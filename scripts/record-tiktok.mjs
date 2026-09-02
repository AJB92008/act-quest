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
//   2. Open Audio MIDI Setup.app -> "+" (bottom left) -> "Create
//      Multi-Output Device" -> check both "BlackHole 2ch" and your normal
//      output (e.g. "MacBook Air Speakers"). Leave its name containing
//      "Multi-Output" (the default already does — this script looks for
//      that name to confirm it's active).
//   3. System Settings -> Sound -> Output -> select that Multi-Output
//      Device. This is what lets the spoken TTS answer reach both your
//      speakers (so you can hear it live) and BlackHole (so ffmpeg can
//      record it) at the same time. Leave it selected between runs —
//      switch back to your normal output only when you're not recording
//      and want quieter/simpler routing.
//   This script checks step 3 is in place before every run and refuses to
//   record silently if it isn't (pass --force to record picture-only).
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
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PORT = 8935;
const BASE_URL = `http://localhost:${PORT}`;
const DEFAULT_OUT_DIR = path.join(os.homedir(), "Desktop", "tiktok-clips", "Unposted");
const POSTED_DIR = path.join(os.homedir(), "Desktop", "tiktok-clips", "Posted");
const MAX_CLIP_MS = 45_000; // safety cap in case the speech "end" event never fires
const TRAILING_BUFFER_MS = 700; // avoid an abrupt cut right as speech ends
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

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
  --voice <text>          Substring match against a voice name (default: browser default)
  --out <dir>             Output folder (default: ~/Desktop/tiktok-clips/Unposted)
  --force                 Record even if system audio isn't routed through BlackHole (picture only)

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

function preflightAudioRouting(force) {
  const outputName = getDefaultOutputDeviceName();
  const ok = outputName && /blackhole|multi-output/i.test(outputName);
  if (ok) return;
  const msg =
    `\nSystem audio output is currently "${outputName ?? "unknown"}", not routed through BlackHole/a Multi-Output Device.\n` +
    `The spoken TTS answer won't be captured — clips would come out silent.\n\n` +
    `One-time fix:\n` +
    `  1. Open Audio MIDI Setup.app\n` +
    `  2. "+" -> "Create Multi-Output Device" -> check "BlackHole 2ch" and your normal output\n` +
    `  3. System Settings -> Sound -> Output -> select that Multi-Output Device\n\n` +
    `Then re-run. Or pass --force to record picture-only, no audio.\n`;
  if (force) {
    console.warn(msg);
    return;
  }
  throw new Error(msg);
}

function buildFilename({ testId, subjectId, skillIds, index }) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const shown = skillIds.slice(0, 2).join("+");
  const skillsPart = skillIds.length > 2 ? `${shown}+${skillIds.length - 2}more` : shown;
  return `tiktok_${testId}_${subjectId}_${skillsPart}_${ts}_${index}.mp4`;
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

async function recordOneClip({ browser, testId, subjectId, skillIds, blackHoleIdx, outDir, index, voiceQuery }) {
  const workDir = path.join(os.tmpdir(), `tiktok-rec-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`);
  mkdirSync(workDir, { recursive: true });

  const contextCreatedAt = Date.now();
  const context = await browser.newContext({
    viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
    recordVideo: { dir: workDir, size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } },
  });
  const page = await context.newPage();

  let resolveSpeechEnd;
  const speechEnded = new Promise((res) => {
    resolveSpeechEnd = res;
  });
  await page.exposeFunction("__tiktokRecorderSpeechEnd", () => resolveSpeechEnd());
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
  let contextClosed = false;
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
    await page.click("[data-start-tiktok]");
    if (process.env.TIKTOK_DEBUG) console.error("[debug] clicked start");
    await page.waitForSelector(".tiktok-card", { timeout: 15000 });
    if (process.env.TIKTOK_DEBUG) console.error("[debug] card shown");
    const cardShownAt = Date.now();

    if (blackHoleIdx !== null) {
      ffmpegAudio = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "avfoundation", "-i", `:${blackHoleIdx}`, audioPath], {
        stdio: "ignore",
      });
    }
    if (process.env.TIKTOK_DEBUG) console.error("[debug] audio capture started, waiting for speech end or timeout");

    await Promise.race([speechEnded, sleep(MAX_CLIP_MS)]);
    if (process.env.TIKTOK_DEBUG) console.error("[debug] race resolved");
    await sleep(TRAILING_BUFFER_MS);

    if (ffmpegAudio) {
      ffmpegAudio.kill("SIGINT");
      if (process.env.TIKTOK_DEBUG) console.error("[debug] sent SIGINT to audio ffmpeg, waiting for close");
      await new Promise((res) => ffmpegAudio.once("close", res));
      if (process.env.TIKTOK_DEBUG) console.error("[debug] audio ffmpeg closed");
    }

    await context.close();
    contextClosed = true;
    if (process.env.TIKTOK_DEBUG) console.error("[debug] context closed");
    const rawVideoPath = await page.video().path();
    if (process.env.TIKTOK_DEBUG) console.error("[debug] video path resolved:", rawVideoPath);
    const trimSeconds = Math.max(0, (cardShownAt - contextCreatedAt) / 1000);

    const outPath = path.join(outDir, buildFilename({ testId, subjectId, skillIds, index }));
    muxAndConvert({ videoPath: rawVideoPath, audioPath, outPath, trimSeconds, hasAudio: !!ffmpegAudio });
    return outPath;
  } finally {
    if (ffmpegAudio && !ffmpegAudio.killed) ffmpegAudio.kill("SIGKILL");
    if (!contextClosed) {
      try {
        await context.close();
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
  let browser;
  try {
    await waitForServer(`${BASE_URL}/`, 15000);
    browser = await chromium.launch({
      headless: false,
      args: ["--window-size=480,860", "--window-position=40,40"],
    });

    const bootstrapPage = await browser.newPage();
    await bootstrapPage.goto(`${BASE_URL}/?dev=1`);
    const catalog = await fetchCatalog(bootstrapPage, args.test);
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
    preflightAudioRouting(args.force);

    const outDir = args.out ? path.resolve(args.out.replace(/^~/, os.homedir())) : DEFAULT_OUT_DIR;
    mkdirSync(outDir, { recursive: true });
    mkdirSync(POSTED_DIR, { recursive: true });

    console.log(`\nRecording ${args.count} clip(s) — ${subject.name} (${skillIds.length} skill${skillIds.length === 1 ? "" : "s"}) -> ${outDir}\n`);

    let succeeded = 0;
    for (let i = 1; i <= args.count; i++) {
      process.stdout.write(`  [${i}/${args.count}] recording... `);
      try {
        const outPath = await recordOneClip({ browser, testId: args.test, subjectId: subject.id, skillIds, blackHoleIdx, outDir, index: i, voiceQuery: args.voice });
        console.log(`done -> ${path.basename(outPath)}`);
        succeeded++;
      } catch (err) {
        console.log(`FAILED (${err.message})`);
      }
    }
    console.log(`\n${succeeded}/${args.count} clip(s) saved to ${outDir}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
