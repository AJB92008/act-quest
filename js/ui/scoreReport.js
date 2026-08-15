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

function encodeReportPayload(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

/** Throws on malformed/tampered input — callers must catch. */
function decodeReportPayload(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
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
                <span>${subject?.icon || ""} ${s.label}</span>
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
      <h1>${data.name}'s Score Report</h1>
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
  const data = buildReportPayload();

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
