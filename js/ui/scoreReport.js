// Score Report: a print/PDF-friendly summary (predicted or actual
// composite + national percentile, latest Practice Test section
// breakdown, best essay score, overall mastery) meant for a distinct
// buyer persona from the player themselves — a parent or tutor who wants
// a readable snapshot without opening the game and clicking around.
//
// Two ways out, both zero-dependency since this is a static site with no
// backend to host a real export or a real shareable link:
//   - Print/Save as PDF: a real PDF export needs no library at all here —
//     every modern browser's own print dialog already offers "Save as
//     PDF" as a destination, so this just needs print-friendly markup and
//     an @media print stylesheet (css/style.css) that hides everything
//     but the report card.
//   - Share Link: encodes a small, self-contained snapshot of the report
//     data as base64 JSON in a `?report=` URL param, so the link itself
//     *is* the shared copy — no server, no login, no account needed to
//     view it (see renderSharedReport() and the bootstrap check in
//     main.js). It's a point-in-time snapshot, not a live view: whoever
//     opens the link sees the data as of when it was copied, not this
//     player's current progress.
import { SUBJECTS, getSubject } from "../data/skills.js";
import { gameState, percentileForComposite } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { monsterSVG } from "./monster.js";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Renders whatever a `?report=` link decodes to, and a `?report=` link is
// exactly the kind of untrusted input this app has no control over once
// it's copied and sent to someone — reportCardHTML() has no way to know
// whether it's rendering buildReportPayload()'s own live output or an
// arbitrary hand-crafted payload someone else built to target whoever
// opens their link. Every field gets coerced to a known-safe shape here,
// once, so reportCardHTML() never has to trust its input either way: a
// free-text field is a string capped at a sane length (still escaped at
// render time too — defense in depth, not a substitute for it), and
// anything that should be a number is actually clamped to one, so a
// crafted payload can't smuggle markup through a field that's only ever
// supposed to hold a score.
function safeNum(v, { min = 0, max = 9999, fallback = null } = {}) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function safeStr(v, maxLen = 60, fallback = "") {
  const s = typeof v === "string" ? v : fallback;
  return s.slice(0, maxLen);
}
function sanitizeReportData(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const rawSections = Array.isArray(r.latestTest?.sectionResults) ? r.latestTest.sectionResults : null;
  return {
    name: safeStr(r.name, 30, "Explorer"),
    generatedAt: safeNum(r.generatedAt, { min: 0, max: 99999999999999, fallback: Date.now() }),
    predictedScore: safeNum(r.predictedScore, { min: 1, max: 36 }),
    latestTest:
      r.latestTest && rawSections
        ? {
            composite: safeNum(r.latestTest.composite, { min: 1, max: 36, fallback: 1 }),
            sectionResults: rawSections.slice(0, 8).map((s) => ({
              subjectId: safeStr(s?.subjectId, 20),
              label: safeStr(s?.label, 40, "Section"),
              correctCount: safeNum(s?.correctCount, { min: 0, max: 999, fallback: 0 }),
              totalCount: safeNum(s?.totalCount, { min: 0, max: 999, fallback: 0 }),
              subscore: safeNum(s?.subscore, { min: 1, max: 36, fallback: 1 }),
            })),
          }
        : null,
    essayBest: safeNum(r.essayBest, { min: 2, max: 12 }),
    masteredCount: safeNum(r.masteredCount, { min: 0, max: 999, fallback: 0 }),
    totalSkills: safeNum(r.totalSkills, { min: 0, max: 999, fallback: 0 }),
  };
}

function encodeReportPayload(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

/** Throws on malformed/tampered input — callers must catch. Returns
 * sanitized, render-safe data regardless of what the encoded payload
 * actually contained (see sanitizeReportData above). */
function decodeReportPayload(str) {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(str))));
  return sanitizeReportData(parsed);
}

function buildReportPayload() {
  const predicted = gameState.getPredictedScore();
  const history = gameState.getPracticeTestHistory();
  const latestTest = history.length > 0 ? history[history.length - 1] : null;
  const overall = gameState.getOverallStats();

  return {
    name: gameState.data.createdName || "Explorer",
    generatedAt: Date.now(),
    predictedScore: predicted.score,
    predictedSource: predicted.source,
    latestTest: latestTest
      ? {
          date: latestTest.date,
          composite: latestTest.composite,
          sectionResults: latestTest.sectionResults.map((s) => ({
            subjectId: s.subjectId,
            label: s.label,
            correctCount: s.correctCount,
            totalCount: s.totalCount,
            subscore: s.subscore,
          })),
        }
      : null,
    essayBest: gameState.essayBest > 0 ? gameState.essayBest : null,
    masteredCount: overall.masteredCount,
    totalSkills: overall.totalSkills,
  };
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function reportCardHTML(data, { shared }) {
  const score = data.latestTest?.composite ?? data.predictedScore;
  const scoreLabel = data.latestTest ? "Practice Test Composite" : "Predicted ACT Score";
  const percentile = score != null ? percentileForComposite(score) : null;

  const sectionRows = data.latestTest
    ? data.latestTest.sectionResults
        .map((s) => {
          const subject = getSubject(s.subjectId);
          return `
            <div class="dash-row">
              <div class="dash-row-label">
                <span>${subject?.icon || ""} ${escapeHtml(s.label)}</span>
                <span>${s.correctCount}/${s.totalCount} correct</span>
              </div>
              <div class="dash-row-accuracy">Section score: ${s.subscore}</div>
            </div>
          `;
        })
        .join("")
    : "";

  return `
    <div class="results-card score-report-card">
      <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 120 })}</div>
      <h1>${escapeHtml(data.name)}'s Score Report</h1>
      <p class="lesson-blurb">${shared ? "Shared, read-only snapshot" : "Live report"} &mdash; generated ${formatDate(data.generatedAt)}</p>
      ${
        score != null
          ? `
            <p class="results-score">${scoreLabel}: ${score} / 36</p>
            <p class="results-flag results-flag-muted">Approximately the ${percentile}th percentile nationally.</p>
          `
          : `<p class="lesson-paragraph">No practice test or lesson data yet.</p>`
      }
      ${sectionRows ? `<div class="dash-rows">${sectionRows}</div>` : ""}
      ${data.essayBest != null ? `<p class="lesson-paragraph">Best Writing score: ${data.essayBest} / 12</p>` : ""}
      <p class="lesson-paragraph">${data.masteredCount} / ${data.totalSkills} skills mastered across ${SUBJECTS.length} subjects.</p>
      ${shared ? `<p class="results-flag results-flag-muted">This is a shared snapshot from Acto's ACT Quest, not a live view &mdash; it won't update as the player keeps practicing.</p>` : ""}
    </div>
  `;
}

export function renderScoreReport(root, navigate) {
  // Routed through the same sanitizer the shared-link path uses (not just
  // for consistency): gameState.data.createdName came from a plain
  // localStorage read, and while this app's own UI caps it at 20
  // characters, nothing stops someone from editing localStorage directly
  // and putting anything there instead.
  const data = sanitizeReportData(buildReportPayload());

  root.innerHTML = `
    ${hudHTML("dashboard")}
    <main class="screen results-screen score-report-screen">
      <button class="back-btn no-print" data-back>&larr; Back to Progress</button>
      ${reportCardHTML(data, { shared: false })}
      <div class="results-actions no-print">
        <button class="btn-primary" data-print>🖨️ Print / Save as PDF</button>
        <button class="btn-secondary" data-share>🔗 Copy Share Link</button>
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
  root.querySelector("[data-print]").addEventListener("click", () => window.print());
  root.querySelector("[data-share]").addEventListener("click", async () => {
    const encoded = encodeReportPayload(data);
    const url = `${location.origin}${location.pathname}?report=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 Share link copied!");
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context)
      // — fall back to just showing the link so it can be copied by hand
      // instead of silently failing.
      window.prompt("Copy this link:", url);
    }
  });
}

/** Renders the read-only view someone opening a `?report=` link sees —
 * no gameState dependency at all, just whatever was encoded into the URL.
 * Called directly from main.js's bootstrap, before the normal
 * onboarding/map routing, so it works even for a visitor with no local
 * save on this device/browser. */
export function renderSharedReport(root, encoded) {
  let data;
  try {
    data = decodeReportPayload(encoded);
  } catch {
    root.innerHTML = `
      <main class="screen results-screen">
        <div class="results-card">
          <h1>Invalid Report Link</h1>
          <p class="lesson-paragraph">This link looks corrupted or incomplete.</p>
          <a class="btn-primary lesson-start-btn" href="${location.origin}${location.pathname}">Go to Acto's ACT Quest</a>
        </div>
      </main>
    `;
    return;
  }

  root.innerHTML = `
    <main class="screen results-screen score-report-screen">
      ${reportCardHTML(data, { shared: true })}
      <div class="results-actions no-print">
        <button class="btn-primary" data-print>🖨️ Print / Save as PDF</button>
        <a class="btn-secondary" href="${location.origin}${location.pathname}">Play Acto's ACT Quest</a>
      </div>
    </main>
  `;
  root.querySelector("[data-print]").addEventListener("click", () => window.print());
}

export { encodeReportPayload, decodeReportPayload, buildReportPayload };
