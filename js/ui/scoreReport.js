// Score Report: a print/PDF-friendly summary (predicted or actual
// composite + national percentile, latest Practice Test section
// breakdown, best essay score, overall mastery) meant for a distinct
// buyer persona from the player themselves — a parent or tutor who wants
// a readable snapshot without opening the game and clicking around.
//
// Styled to echo the layout of a real ACT online score report (score
// tiles, a section-score graph, per-category "ACT Readiness Range"
// breakdowns, a milestone scale) since that's a format parents/tutors
// already recognize — but every fact on it comes from this app's own
// practice data, and it says so up front (see the disclaimer in
// reportCardHTML). The "Quest Rank" milestone scale is explicitly game
// flavor, not a claim about the real ACT NCRC credential.
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
  // Number(null) is 0, not NaN — without this check, a genuinely missing
  // value (no predicted score yet, no essay taken) would silently clamp to
  // `min` instead of falling back, e.g. a fresh player's null predictedScore
  // becoming a fake "1" instead of staying null.
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function safeStr(v, maxLen = 60, fallback = "") {
  const s = typeof v === "string" ? v : fallback;
  return s.slice(0, maxLen);
}
function sanitizeCategoryBreakdown(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 8).map((c) => ({
    name: safeStr(c?.name, 60, "Category"),
    correct: safeNum(c?.correct, { min: 0, max: 999, fallback: 0 }),
    total: safeNum(c?.total, { min: 0, max: 999, fallback: 0 }),
  }));
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
              categoryBreakdown: sanitizeCategoryBreakdown(s?.categoryBreakdown),
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
            categoryBreakdown: s.categoryBreakdown || [],
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

/** subjectId -> that section's result, for the current latestTest (or {} if
 * there isn't one — every caller already guards on hasFullTest first). */
function sectionsBySubject(data) {
  // A share link's subjectId is attacker-controlled (see the sanitizer
  // comment above) — Object.create(null) means a crafted `"__proto__"`
  // subjectId just becomes an inert own-property instead of repointing
  // this object's prototype.
  const map = Object.create(null);
  (data.latestTest?.sectionResults || []).forEach((s) => {
    map[s.subjectId] = s;
  });
  return map;
}

// STEM isn't one of the ACT's four sections — it's a fifth score the real
// ACT reports as the average of Math and Science, rounded, same as here.
function computeStemScore(sections) {
  const math = sections.math?.subscore;
  const science = sections.science?.subscore;
  if (math == null || science == null) return null;
  return Math.round((math + science) / 2);
}

// Order the real report's own score-graph description reads section
// scores in, so the accessible text below the bars matches it exactly.
const GRAPH_ORDER = [
  ["math", "Math"],
  ["science", "Science"],
  ["english", "English"],
  ["reading", "Reading"],
];

function graphDescription(data, sections, composite) {
  const parts = [`Your ACT composite score is equal to ${composite}.`];
  GRAPH_ORDER.forEach(([id, label]) => {
    const s = sections[id];
    parts.push(`${label} section score is ${s ? s.subscore : "NA"}.`);
    if (id === "science") {
      const stem = computeStemScore(sections);
      parts.push(`STEM score is ${stem != null ? stem : "NA"}.`);
    }
  });
  parts.push(`Writing section score is ${data.essayBest != null ? data.essayBest : "NA"}.`);
  return parts.join(" ");
}

function scoreGraphHTML(data, sections, composite) {
  const bars = GRAPH_ORDER.map(([id, label]) => {
    const s = sections[id];
    if (!s) return "";
    const subject = getSubject(id);
    const pct = Math.round((s.subscore / 36) * 100);
    return `
      <div class="score-graph-row" style="--island-color:${subject.colorDark}">
        <span class="score-graph-label">${subject.icon} ${label}</span>
        <div class="score-graph-track">
          <div class="score-graph-fill" style="width:${pct}%"></div>
        </div>
        <span class="score-graph-value">${s.subscore}</span>
      </div>
    `;
  }).join("");
  return `
    <div class="score-graph" role="img" aria-label="${escapeHtml(graphDescription(data, sections, composite))}">
      ${bars}
    </div>
    <p class="score-caption score-graph-desc">${escapeHtml(graphDescription(data, sections, composite))}</p>
  `;
}

function scoreTilesHTML(sections, composite) {
  const stem = computeStemScore(sections);
  const tiles = [
    { label: "STEM", value: stem, primary: true },
    { label: "Composite", value: composite, primary: true },
    { label: "Math", value: sections.math?.subscore, subjectId: "math" },
    { label: "Science", value: sections.science?.subscore, subjectId: "science" },
    { label: "English", value: sections.english?.subscore, subjectId: "english" },
    { label: "Reading", value: sections.reading?.subscore, subjectId: "reading" },
  ];
  return `
    <div class="score-tile-grid">
      ${tiles
        .map((t) => {
          const subject = t.subjectId ? getSubject(t.subjectId) : null;
          const style = subject ? ` style="--island-color:${subject.colorDark};--island-bg:${subject.bg}"` : "";
          return `
            <div class="score-tile${t.primary ? " score-tile-primary" : ""}"${style}>
              <span class="score-tile-value">${t.value != null ? t.value : "NA"}</span>
              <span class="score-tile-label">${t.label}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

// Real order the ACT's own report lists section detail panels in.
const DETAIL_ORDER = ["math", "science", "english", "reading"];

function scoreDetailsHTML(sections) {
  const panels = DETAIL_ORDER.map((id) => {
    const s = sections[id];
    if (!s) return "";
    const subject = getSubject(id);
    // Math's real ACT breakdown includes "Integrating Essential Skills" and
    // "Modeling" categories that cut across content areas — this app's
    // questions aren't tagged for those, so Math shows its overall score
    // only rather than a partial, misleading-looking category list.
    const categories = id === "math" ? [] : s.categoryBreakdown || [];
    const categoryRows = categories
      .map((c) => {
        const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
        return `
          <div class="score-category-row">
            <div class="score-category-row-label">
              <span>${escapeHtml(c.name)}</span>
              <span>${c.correct}/${c.total} &middot; ${pct}%</span>
            </div>
            <div class="score-category-track">
              <div class="score-category-fill" style="width:${pct}%;--island-color:${subject.colorDark}"></div>
            </div>
          </div>
        `;
      })
      .join("");
    return `
      <div class="score-detail-panel" style="--island-color:${subject.colorDark};--island-bg:${subject.bg}">
        <div class="score-detail-header">
          <span class="score-detail-score">${s.subscore}</span>
          <span class="score-detail-name">${subject.icon} ${subject.name}</span>
        </div>
        ${categoryRows ? `<p class="score-caption">ACT Readiness Range</p>${categoryRows}` : ""}
      </div>
    `;
  }).join("");
  return `
    <details class="score-section-details" open>
      <summary class="score-section-heading">My Score Details</summary>
      <p class="score-caption">Category percentages reflect accuracy on Acto's ACT Quest practice questions, not an official ACT readiness placement.</p>
      ${panels}
    </details>
  `;
}

const NCRC_TIERS = [
  { name: "Bronze", min: 1 },
  { name: "Silver", min: 15 },
  { name: "Gold", min: 22 },
  { name: "Platinum", min: 29 },
];

function ncrcTierForScore(score) {
  let tier = NCRC_TIERS[0];
  for (const t of NCRC_TIERS) {
    if (score >= t.min) tier = t;
  }
  return tier;
}

/** A game-flavored milestone scale echoing the real ACT NCRC's
 * Bronze/Silver/Gold/Platinum bands and 1-36-style bar — explicitly
 * labeled as in-game flavor (not the real credential, which is scored
 * off a separate WorkKeys assessment this app has nothing to do with). */
function ncrcPanelHTML(compositeScore) {
  const score = Math.max(1, Math.min(36, Math.round(compositeScore)));
  const tier = ncrcTierForScore(score);
  const nextTier = NCRC_TIERS[NCRC_TIERS.indexOf(tier) + 1];
  const pct = Math.round((score / 36) * 100);
  return `
    <section class="ncrc-panel">
      <h2 class="score-section-heading">🏅 Quest Rank Progress</h2>
      <p class="score-caption">A game milestone scale inspired by the ACT National Career Readiness Certificate&trade; &mdash; not the official credential, which is scored separately.</p>
      <p class="ncrc-your-score">Your Score: <strong>${score}</strong></p>
      <div class="ncrc-scale">
        ${NCRC_TIERS.map((t) => `<span class="ncrc-tier${t === tier ? " is-current" : ""}">${t.name}</span>`).join("")}
      </div>
      <div class="ncrc-progress-track">
        <div class="ncrc-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="ncrc-scale-endpoints"><span>1</span><span>36</span></div>
      <p class="lesson-paragraph">${
        nextTier
          ? `You're at <strong>${tier.name}</strong> rank and making progress toward <strong>${nextTier.name}</strong>!`
          : `You've reached <strong>Platinum</strong> rank &mdash; the top of the scale!`
      }</p>
    </section>
  `;
}

function reportCardHTML(data, { shared }) {
  const sections = sectionsBySubject(data);
  const hasFullTest = !!data.latestTest;
  const compositeScore = data.latestTest?.composite ?? data.predictedScore;
  const scoreLabel = hasFullTest ? "Practice Test Composite" : "Predicted ACT Score";
  const percentile = compositeScore != null ? percentileForComposite(compositeScore) : null;

  return `
    <div class="results-card score-report-card">
      <p class="score-disclaimer">Not for official use. This is a practice report from Acto's ACT Quest, not an official ACT score.</p>
      <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 120 })}</div>
      <h1>${escapeHtml(data.name)}'s Score Report</h1>
      <p class="lesson-blurb">${shared ? "Shared, read-only snapshot" : "Live report"} &mdash; generated ${formatDate(data.generatedAt)}</p>

      ${
        compositeScore == null
          ? `<p class="lesson-paragraph">No practice test or lesson data yet.</p>`
          : `
            <details class="score-section-details" open>
              <summary class="score-section-heading">Score Information</summary>
              ${hasFullTest ? scoreTilesHTML(sections, compositeScore) : `<p class="results-score">${scoreLabel}: ${compositeScore} / 36</p>`}
              <p class="results-flag results-flag-muted">Approximately the ${percentile}th percentile nationally.</p>
              ${hasFullTest ? scoreGraphHTML(data, sections, compositeScore) : ""}
              <details class="score-info-detail">
                <summary>What is Composite Score?</summary>
                <p class="lesson-paragraph">Your Composite score is the average of your four section scores (English, Math, Reading, Science), rounded to the nearest whole number, on the ACT's 1&ndash;36 scale.</p>
              </details>
              <details class="score-info-detail">
                <summary>Writing score information</summary>
                <p class="lesson-paragraph">${
                  data.essayBest != null
                    ? `Your best Writing score is ${data.essayBest} / 12.`
                    : "The Writing section is optional and scored separately on a 2&ndash;12 scale &mdash; it doesn't count toward your Composite. Write an essay from the Dashboard to earn a score here."
                }</p>
              </details>
            </details>
          `
      }

      ${hasFullTest ? scoreDetailsHTML(sections) : compositeScore != null ? `<p class="lesson-paragraph score-caption">Take a full-length Practice Test to unlock the full score breakdown by category.</p>` : ""}

      <p class="lesson-paragraph">${data.masteredCount} / ${data.totalSkills} skills mastered across ${SUBJECTS.length} subjects.</p>

      ${compositeScore != null ? ncrcPanelHTML(compositeScore) : ""}

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
