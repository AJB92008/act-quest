#!/usr/bin/env node
// Batch-generates TikTok-ready vertical clips from TikTok Mode
// (js/ui/tiktokMode.js) — a dev-only single-question card built to be
// screen-recorded, but with nothing in the app itself that can record.
// This script is the recorder: Playwright drives a real Chrome window
// through one full question cycle at a time (question -> countdown ->
// spoken reveal), capturing picture via Playwright's own video capture
// (this records the browser's internal render surface, not your actual
// screen pixels — so the window can sit in a corner, get covered by other
// windows, whatever, and the clip is unaffected) while ffmpeg grabs the
// spoken answer from a BlackHole virtual audio device in parallel. The
// two get muxed and re-encoded into a 1080x1920 H.264/AAC mp4 (TikTok's
// standard format) and filed into ~/Desktop/tiktok-clips/Unposted.
//
// ONE-TIME SETUP (macOS), needed once per machine:
//   1. BlackHole 2ch installed (`brew install blackhole-2ch` if missing —
//      this script checks and tells you).
//   2. (Optional, for the "Google US English" voice specifically) Run
//      once with --setup-profile. That opens real Google Chrome (not
//      Playwright's bundled Chromium — "Google US English" and friends
//      are a Chrome-account feature, unavailable in a disposable/signed-
//      out browser) to a dedicated profile just for this recorder, and
//      waits for you to sign into Chrome with your Google account in
//      that window. That profile persists on disk (PROFILE_DIR below),
//      so every run after reuses it silently — a normal run without
//      --setup-profile never blocks on this, it just falls back to a
//      different voice if you skip this step.
// That's it — no Multi-Output Device needed (see beginRecordingAudioRoute
// for why: it introduced audible artifacts in testing). The script
// switches system audio output straight to solo BlackHole 2ch itself for
// the duration of a run (via the `SwitchAudioSource` CLI, `brew install
// switchaudio-osx` if missing) and always switches it back to whatever
// you were using before when it's done, on error, or on Ctrl+C — you
// won't hear the TTS live during a run, which is fine for something
// automated you're not sitting and listening to.
//
// USAGE:
//   node scripts/record-tiktok.mjs --list [--test act]
//   node scripts/record-tiktok.mjs --subject math --skills algebra-linear-equations,geometry-angles --count 10
//   node scripts/record-tiktok.mjs --subject math --skills all --count 3 --voice samantha
//
// Each clip is one full question cycle: however long the question sits on
// screen (10s countdown) plus however long the spoken answer/explanation
// takes to read out loud — length varies clip to clip, there's no fixed
// duration knob. Video/audio sync is "good enough for a casual clip", not
// frame-accurate: they're captured on two separate pipelines (Playwright's
// internal frame capture, ffmpeg's OS-level audio capture) started within
// milliseconds of each other, not one unified capture.
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PORT = 8935;
const BASE_URL = `http://localhost:${PORT}`;
const DEFAULT_OUT_DIR = path.join(os.homedir(), "Desktop", "tiktok-clips", "Unposted");
const POSTED_DIR = path.join(os.homedir(), "Desktop", "tiktok-clips", "Posted");
const PROFILE_DIR = path.join(os.homedir(), ".prepquest-recorder-chrome-profile");
const MAX_CLIP_MS = 90_000; // safety cap in case a speech "end" event never fires (question + 10s countdown + answer narration, back to back)
const SPEAK_EVENTS_PER_CLIP = 2; // TikTok Mode speaks the question, then (after reveal) the answer
const TRAILING_BUFFER_MS = 700; // avoid an abrupt cut right as speech ends
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const DEFAULT_VOICE_NAME = "Google US English";

function parseArgs(argv) {
  const args = { count: 1, test: "act" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--list":
        args.list = true;
        break;
      case "--test":
        args.test = next();
        break;
      case "--subject":
        args.subject = next();
        break;
      case "--skills":
        args.skills = next();
        break;
      case "--count":
        args.count = Number(next());
        break;
      case "--voice":
        args.voice = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--force":
        args.force = true;
        break;
      case "--setup-profile":
        args.setupProfile = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a} (--help for usage)`);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
Record TikTok Mode clips.

  --list                 List subjects/skills for --test (default: act) and exit
  --test <id>             Test/planet id (default: act)
  --subject <id|name>     Subject to pull questions from
  --skills <a,b,c|all>    Skill ids/names to draw from, or "all"
  --count <n>             Number of clips to generate (default: 1)
  --voice <text>          Substring match against a voice name (default: Google US English, once the profile is signed in)
  --out <dir>             Output folder (default: ~/Desktop/tiktok-clips/Unposted)
  --force                 Record even if system audio isn't routed through BlackHole (picture only)
  --setup-profile         Sign into Chrome for the "Google US English" voice (waits up to 5 min; a normal run never blocks on this)

Examples:
  node scripts/record-tiktok.mjs --list
  node scripts/record-tiktok.mjs --subject math --skills all --count 10
`);
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error(`Dev server never became ready at ${url}`);
}

function startDevServer() {
  return spawn("python3", ["-m", "http.server", String(PORT)], { cwd: REPO_ROOT, stdio: "ignore" });
}

async function fetchCatalog(page, testId) {
  return page.evaluate(async (testId) => {
    const mod = await import("/js/data/tests.js");
    const subjects = mod.getTestSubjects(testId);
    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      playable: mod.isSubjectPlayable(s),
      skills: (s.skills || []).map((sk) => ({ id: sk.id, name: sk.name })),
    }));
  }, testId);
}

async function fetchTestName(page, testId) {
  return page.evaluate(async (testId) => {
    const mod = await import("/js/data/tests.js");
    return mod.TESTS.find((t) => t.id === testId)?.name || testId;
  }, testId);
}

function printCatalog(testId, catalog) {
  console.log(`\nSubjects for test "${testId}":\n`);
  for (const s of catalog) {
    console.log(`  ${s.icon || ""} ${s.name}  (--subject ${s.id})${s.playable ? "" : "  [not playable yet]"}`);
    for (const sk of s.skills) console.log(`      - ${sk.name}  (${sk.id})`);
    if (s.skills.length === 0) console.log(`      (no skills)`);
  }
  console.log("");
}

function resolveSubject(catalog, wanted) {
  const lower = wanted.toLowerCase();
  return (
    catalog.find((s) => s.id.toLowerCase() === lower) ||
    catalog.find((s) => s.name.toLowerCase() === lower) ||
    catalog.find((s) => s.name.toLowerCase().includes(lower))
  );
}

function resolveSkills(subject, wanted) {
  if (wanted.trim().toLowerCase() === "all") return subject.skills.map((s) => s.id);
  return wanted.split(",").map((token) => {
    const t = token.trim().toLowerCase();
    const match =
      subject.skills.find((s) => s.id.toLowerCase() === t) ||
      subject.skills.find((s) => s.name.toLowerCase() === t) ||
      subject.skills.find((s) => s.name.toLowerCase().includes(t));
    if (!match) throw new Error(`No skill matching "${token}" in subject "${subject.name}". Run --list to see options.`);
    return match.id;
  });
}

// Device indices aren't stable across machines/reboots (they shift with
// whatever's plugged in), so this is resolved fresh at every run rather
// than hardcoded.
function findBlackHoleAudioIndex() {
  let out = "";
  try {
    execFileSync("ffmpeg", ["-f", "avfoundation", "-list_devices", "true", "-i", ""], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err) {
    out = (err.stderr || "").toString();
  }
  let inAudioSection = false;
  for (const line of out.split("\n")) {
    if (line.includes("AVFoundation audio devices")) {
      inAudioSection = true;
      continue;
    }
    if (!inAudioSection) continue;
    const m = line.match(/\[(\d+)\]\s+(.*)$/);
    if (m && /blackhole/i.test(m[2])) return Number(m[1]);
  }
  return null;
}

function getDefaultOutputDeviceName() {
  let out = "";
  try {
    out = execFileSync("system_profiler", ["SPAudioDataType"]).toString();
  } catch {
    return null;
  }
  let currentName = null;
  for (const line of out.split("\n")) {
    const nameMatch = line.match(/^\s{8}(\S[^:]*):\s*$/);
    if (nameMatch) {
      currentName = nameMatch[1];
      continue;
    }
    if (/Default Output Device:\s*Yes/.test(line)) return currentName;
  }
  return null;
}

function hasCommand(cmd) {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function listOutputDevices() {
  try {
    return execFileSync("SwitchAudioSource", ["-a", "-t", "output"])
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getCurrentOutputDevice() {
  try {
    return execFileSync("SwitchAudioSource", ["-c"]).toString().trim() || null;
  } catch {
    return null;
  }
}

function setOutputDevice(name) {
  execFileSync("SwitchAudioSource", ["-s", name]);
}

const NO_BLACKHOLE_OUTPUT_MSG =
  `\nBlackHole 2ch isn't in your list of output devices (needed so the spoken TTS answer can be captured).\n\n` +
  `One-time fix: \`brew install blackhole-2ch\`, then re-run. Or pass --force to record picture-only, no audio.\n`;

// Switches system audio output straight to solo "BlackHole 2ch" (not a
// Multi-Output Device combining it with real speakers) for the duration
// of a recording run, and hands back a restore() function that puts it
// back to whatever it was before — called from a `finally` and from
// SIGINT/SIGTERM handlers, so a Ctrl+C mid-batch can't strand the system
// on a device whose volume keys don't work (see header comment).
//
// A Multi-Output Device was tried first, but real-world testing found
// it introduces audible broadband noise/artifacts into the capture —
// visible as energy filling almost the entire spectrum in a spectrogram,
// not present when capturing from BlackHole alone — from real (if
// small) clock drift between BlackHole's virtual clock and the
// speakers' hardware clock, even with Drift Correction enabled. Solo
// BlackHole has just one clock, so there's nothing to drift against;
// the tradeoff is you won't hear the TTS live while a batch records —
// not a loss for an automated run you're not sitting and listening to.
function beginRecordingAudioRoute(force) {
  if (!hasCommand("SwitchAudioSource")) {
    // No CLI to switch devices for us — fall back to just checking
    // whatever's already selected, same as before this existed.
    const outputName = getDefaultOutputDeviceName();
    const ok = outputName && /blackhole/i.test(outputName);
    if (!ok) {
      const msg = `${NO_BLACKHOLE_OUTPUT_MSG}\n(Install \`brew install switchaudio-osx\` so this script can switch it for you automatically.)\n`;
      if (force) console.warn(msg);
      else throw new Error(msg);
    }
    return () => {};
  }

  const devices = listOutputDevices();
  const blackHoleName = devices.find((d) => /^blackhole/i.test(d));
  if (!blackHoleName) {
    if (force) {
      console.warn(NO_BLACKHOLE_OUTPUT_MSG);
      return () => {};
    }
    throw new Error(NO_BLACKHOLE_OUTPUT_MSG);
  }

  const original = getCurrentOutputDevice();
  if (original !== blackHoleName) {
    console.log(`Switching system audio output to "${blackHoleName}" for recording (you won't hear it live — see header comment)...`);
    setOutputDevice(blackHoleName);
  }

  let restored = false;
  return () => {
    if (restored || !original || original === blackHoleName) return;
    restored = true;
    try {
      setOutputDevice(original);
      console.log(`Restored system audio output to "${original}".`);
    } catch {
      console.warn(`Could not restore system audio output to "${original}" — check System Settings -> Sound -> Output.`);
    }
  };
}

async function hasGoogleUSEnglishVoice(page) {
  return page.evaluate((voiceName) => new Promise((resolve) => {
    const check = () => resolve(window.speechSynthesis.getVoices().some((v) => v.name === voiceName));
    if (window.speechSynthesis.getVoices().length) check();
    else {
      window.speechSynthesis.onvoiceschanged = check;
      setTimeout(check, 3000); // in case 'voiceschanged' never fires
    }
  }), DEFAULT_VOICE_NAME);
}

// "Google US English" (and friends) are a Chrome-account network feature,
// not something a fresh/signed-out browser profile has access to — so
// this recorder keeps its own persistent Chrome profile (PROFILE_DIR)
// instead of a disposable one. A normal run never blocks on this: it does
// one quick check and, if the voice isn't there yet, just proceeds with
// whatever fallback voice the app picks (see tiktokMode.js's own
// default). Only when --setup-profile is explicitly passed does this
// open a sign-in page and poll in the background for the voice to
// appear — you sign into Chrome by hand in the window that opens, at
// your own pace, and it picks up automatically once detected. Nothing
// beyond that sign-in step is automated — this script never touches your
// Google credentials itself.
const PROFILE_SETUP_TIMEOUT_MS = 5 * 60 * 1000;
const PROFILE_SETUP_POLL_MS = 5000;

async function ensureProfileReady(context, { force }) {
  const pollPage = await context.newPage();
  try {
    await pollPage.goto("https://example.com");
    const alreadyOk = await hasGoogleUSEnglishVoice(pollPage);
    if (!force) {
      if (!alreadyOk) console.log(`Note: "${DEFAULT_VOICE_NAME}" isn't set up yet — using a fallback voice this run. Pass --setup-profile to sign in.\n`);
      return;
    }
    if (alreadyOk) return;

    const signInPage = await context.newPage();
    await signInPage.goto("chrome://settings/people");
    console.log(
      `\nOne-time setup: sign into Chrome with your Google account in the window that just opened.\n` +
        `This dedicated profile (not your everyday Chrome) is what lets the recorder use "${DEFAULT_VOICE_NAME}" — every run after this reuses it automatically.\n` +
        `Waiting up to 5 minutes for that to finish — take your time, this continues on its own once it's detected.\n`
    );

    const deadline = Date.now() + PROFILE_SETUP_TIMEOUT_MS;
    let ok = false;
    while (Date.now() < deadline) {
      await pollPage.reload();
      ok = await hasGoogleUSEnglishVoice(pollPage);
      if (ok) break;
      await sleep(PROFILE_SETUP_POLL_MS);
    }
    console.log(
      ok
        ? `"${DEFAULT_VOICE_NAME}" is available — you're all set.\n`
        : `Didn't detect "${DEFAULT_VOICE_NAME}" after waiting — continuing with a fallback voice. Re-run with --setup-profile any time to retry.\n`
    );
    await signInPage.close();
  } finally {
    await pollPage.close();
  }
}

function sanitizeLabel(name) {
  return name.replace(/[\/\\:]/g, "-").trim();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Clips are named "<Test> <Subject> <N>.mp4" (e.g. "ACT Math 1.mp4"),
// numbered per test+subject rather than per run — so a second batch for
// the same subject picks up where the last one left off instead of
// restarting at 1 and colliding with clips already sitting in Unposted
// or already moved into Posted.
function findNextClipNumber(dirs, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)} (\\d+)\\.mp4$`);
  let max = 0;
  for (const dir of dirs) {
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const m = name.match(pattern);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return max + 1;
}

function muxAndConvert({ videoPath, audioPath, outPath, trimSeconds, hasAudio }) {
  const filter = `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-ss", trimSeconds.toFixed(2), "-i", videoPath];
  if (hasAudio) args.push("-i", audioPath);
  args.push("-vf", filter, "-r", "30", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "20");
  if (hasAudio) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest");
  else args.push("-an");
  args.push("-movflags", "+faststart", outPath);
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
}

// `context` is the one shared, persistent-profile browser context (see
// PROFILE_DIR / ensureProfileReady) — its recordVideo directory was fixed
// once at launch, so every clip's raw video lands there under a
// Playwright-generated name; this cleans its own file up after muxing
// rather than clearing the whole (shared, cross-run) directory.
async function recordOneClip({ context, testId, subjectId, skillIds, blackHoleIdx, outPath, voiceQuery }) {
  const workDir = path.join(os.tmpdir(), `tiktok-rec-audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  mkdirSync(workDir, { recursive: true });

  const pageCreatedAt = Date.now();
  const page = await context.newPage();

  // TikTok Mode now speaks twice per question cycle — the question, then
  // (after the reveal) the answer — so this waits for the SECOND "end"
  // event, not the first, or it'd stop recording right after the
  // question narration and cut the reveal off entirely.
  let resolveSpeechEnd;
  const speechEnded = new Promise((res) => {
    resolveSpeechEnd = res;
  });
  let speechEndCount = 0;
  await page.exposeFunction("__tiktokRecorderSpeechEnd", () => {
    speechEndCount++;
    if (speechEndCount >= SPEAK_EVENTS_PER_CLIP) resolveSpeechEnd();
  });
  await page.addInitScript(() => {
    if (!window.speechSynthesis || window.__tiktokRecorderPatched) return;
    window.__tiktokRecorderPatched = true;
    const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (utterance) => {
      utterance.addEventListener("end", () => window.__tiktokRecorderSpeechEnd && window.__tiktokRecorderSpeechEnd());
      orig(utterance);
    };
  });

  let ffmpegAudio = null;
  let pageClosed = false;
  const audioPath = path.join(workDir, "audio.wav");

  try {
    await page.goto(`${BASE_URL}/?dev=1&onboarded=1&screen=tiktokMode`);
    if (process.env.TIKTOK_DEBUG) console.error("[debug] navigated");

    if (voiceQuery) {
      await page.waitForSelector("[data-voice-select]");
      await page.evaluate((q) => {
        const select = document.querySelector("[data-voice-select]");
        const opt = Array.from(select.options).find((o) => o.textContent.toLowerCase().includes(q.toLowerCase()));
        if (opt) {
          select.value = opt.value;
          select.dispatchEvent(new Event("change"));
        }
      }, voiceQuery);
    }

    if (testId !== "act") {
      await page.click(`[data-test-tab="${testId}"]`);
    }
    await page.waitForSelector(`[data-subject-tab="${subjectId}"]`);
    await page.click(`[data-subject-tab="${subjectId}"]`);
    if (process.env.TIKTOK_DEBUG) console.error("[debug] clicked subject tab");
    await page.waitForSelector(`[data-skill-check="${skillIds[0]}"]`);
    for (const skillId of skillIds) {
      await page.click(`[data-skill-check="${skillId}"]`);
    }
    if (process.env.TIKTOK_DEBUG) console.error("[debug] checked skills");
    // Audio capture is spawned BEFORE the click that triggers narration, not
    // after the card appears: ffmpeg's avfoundation device has real startup
    // latency (~1-1.3s observed) before it's actually writing samples, and
    // TikTok Mode starts speaking the question the instant the card renders.
    // Spawning after the card appeared meant that startup latency silently
    // ate the first ~1-1.3s of every question's narration. Starting here
    // instead costs a beat of near-silence before narration begins (audio's
    // own t=0 leads video's post-trim t=0 by roughly ffmpeg's startup time),
    // which is harmless given this recorder is already "good enough sync,
    // not frame-accurate" by design.
    if (blackHoleIdx !== null) {
      ffmpegAudio = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "avfoundation", "-i", `:${blackHoleIdx}`, audioPath], {
        stdio: "ignore",
      });
    }
    await page.click("[data-start-tiktok]");
    if (process.env.TIKTOK_DEBUG) console.error("[debug] clicked start");
    await page.waitForSelector(".tiktok-card", { timeout: 15000 });
    if (process.env.TIKTOK_DEBUG) console.error("[debug] card shown");
    const cardShownAt = Date.now();
    if (process.env.TIKTOK_DEBUG) console.error("[debug] audio capture already running, waiting for speech end or timeout");

    await Promise.race([speechEnded, sleep(MAX_CLIP_MS)]);
    if (process.env.TIKTOK_DEBUG) console.error("[debug] race resolved");
    await sleep(TRAILING_BUFFER_MS);

    if (ffmpegAudio) {
      ffmpegAudio.kill("SIGINT");
      if (process.env.TIKTOK_DEBUG) console.error("[debug] sent SIGINT to audio ffmpeg, waiting for close");
      await new Promise((res) => ffmpegAudio.once("close", res));
      if (process.env.TIKTOK_DEBUG) console.error("[debug] audio ffmpeg closed");
    }

    await page.close(); // finalizes this page's video without touching the shared context
    pageClosed = true;
    if (process.env.TIKTOK_DEBUG) console.error("[debug] page closed");
    const rawVideoPath = await page.video().path();
    if (process.env.TIKTOK_DEBUG) console.error("[debug] video path resolved:", rawVideoPath);
    const trimSeconds = Math.max(0, (cardShownAt - pageCreatedAt) / 1000);

    muxAndConvert({ videoPath: rawVideoPath, audioPath, outPath, trimSeconds, hasAudio: !!ffmpegAudio });
    rmSync(rawVideoPath, { force: true });
    return outPath;
  } finally {
    if (ffmpegAudio && !ffmpegAudio.killed) ffmpegAudio.kill("SIGKILL");
    if (!pageClosed) {
      try {
        await page.close();
      } catch {
        // already closed
      }
    }
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const server = startDevServer();
  const videoDir = path.join(os.tmpdir(), `prepquest-recorder-videos-${Date.now()}`);
  mkdirSync(videoDir, { recursive: true });
  let context;
  let restoreAudioOutput = () => {};
  const onSignal = (signal) => {
    restoreAudioOutput();
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  process.on("SIGINT", () => onSignal("SIGINT"));
  process.on("SIGTERM", () => onSignal("SIGTERM"));

  try {
    await waitForServer(`${BASE_URL}/`, 15000);
    // Real Google Chrome (not Playwright's bundled Chromium) in a
    // dedicated, persistent profile — see PROFILE_DIR and the header
    // comment. Persistent context = a single BrowserContext reused across
    // every page/clip in this run (and across future runs), which is
    // also what lets the one-time Chrome sign-in stick around.
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      channel: "chrome",
      viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
      recordVideo: { dir: videoDir, size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } },
      args: ["--window-size=480,860", "--window-position=40,40"],
    });

    const bootstrapPage = await context.newPage();
    await bootstrapPage.goto(`${BASE_URL}/?dev=1`);
    const catalog = await fetchCatalog(bootstrapPage, args.test);
    const testName = await fetchTestName(bootstrapPage, args.test);
    await bootstrapPage.close();

    if (args.list) {
      printCatalog(args.test, catalog);
      return;
    }

    if (!args.subject) throw new Error("--subject is required (use --list to see options)");
    if (!args.skills) throw new Error("--skills is required (comma-separated ids/names, or 'all')");

    const subject = resolveSubject(catalog, args.subject);
    if (!subject) throw new Error(`No subject matching "${args.subject}". Run --list to see options.`);
    if (!subject.playable || subject.skills.length === 0) throw new Error(`Subject "${subject.name}" has no playable skills yet.`);
    const skillIds = resolveSkills(subject, args.skills);

    const blackHoleIdx = findBlackHoleAudioIndex();
    if (blackHoleIdx === null && !args.force) {
      throw new Error("BlackHole 2ch not found by ffmpeg. Install with: brew install blackhole-2ch (or pass --force to record picture-only).");
    }
    restoreAudioOutput = beginRecordingAudioRoute(args.force);

    await ensureProfileReady(context, { force: !!args.setupProfile });

    const outDir = args.out ? path.resolve(args.out.replace(/^~/, os.homedir())) : DEFAULT_OUT_DIR;
    mkdirSync(outDir, { recursive: true });
    mkdirSync(POSTED_DIR, { recursive: true });

    // "<Test> <Subject> <N>.mp4" — numbered per test+subject across runs
    // (see findNextClipNumber), not restarted at 1 every time, so a later
    // batch for the same subject continues the sequence instead of
    // colliding with clips already in Unposted or moved into Posted.
    const label = sanitizeLabel(`${testName} ${subject.name}`);
    const startNumber = findNextClipNumber([outDir, POSTED_DIR], label);

    console.log(`\nRecording ${args.count} clip(s) — ${label} ${startNumber}${args.count > 1 ? `-${startNumber + args.count - 1}` : ""} -> ${outDir}\n`);

    let succeeded = 0;
    for (let i = 0; i < args.count; i++) {
      const number = startNumber + i;
      const outPath = path.join(outDir, `${label} ${number}.mp4`);
      process.stdout.write(`  [${i + 1}/${args.count}] recording "${label} ${number}"... `);
      try {
        await recordOneClip({ context, testId: args.test, subjectId: subject.id, skillIds, blackHoleIdx, outPath, voiceQuery: args.voice });
        console.log(`done -> ${path.basename(outPath)}`);
        succeeded++;
      } catch (err) {
        console.log(`FAILED (${err.message})`);
      }
    }
    console.log(`\n${succeeded}/${args.count} clip(s) saved to ${outDir}`);
  } finally {
    restoreAudioOutput();
    if (context) await context.close();
    rmSync(videoDir, { recursive: true, force: true });
    server.kill();
  }
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
