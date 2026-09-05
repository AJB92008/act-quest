// Score Report: a print/PDF-friendly summary (predicted or actual
// composite + national percentile, latest Practice Test section
// breakdown, best essay score on ACT, overall mastery) meant for a
// distinct buyer persona from the player themselves — a parent or tutor
// who wants a readable snapshot without opening the game and clicking
// around. Works for any planet with a real full-length Practice Test
// (ACT/SAT/PSAT — see each test's practiceTest config in data/tests.js);
// State Assessments has none, so this screen is never reachable for it.
//
// Styled to echo the layout of a real standardized-test online score
// report (score tiles, a section-score graph, per-category breakdowns, a
// milestone scale) since that's a format parents/tutors already
// recognize — but every fact on it comes from this app's own practice
// data, and it says so up front (see the disclaimer in reportCardHTML).
// ACT's report additionally echoes the real ACT's own "ACT Readiness
// Range" category label and its National Career Readiness Certificate
// milestone bands (Bronze/Silver/Gold/Platinum) — both explicitly labeled
// as this app's own game flavor, not the real ACT credential. SAT/PSAT
// reports use test-neutral wording for the same concepts instead, since
// neither of those real credential names has anything to do with College
// Board's tests.
//
// Two ways out, both zero-dependency since this is a static site with no
// backend to host a real export or a real shareable link:
//   - Print/Save as PDF: a real PDF export needs no library at all here —
//     every modern browser's own print dialog already offers "Save as
//     PDF" as a destination, so this just needs print-friendly markup and
//     an @media print stylesheet (css/style.css) that hides everything
//     but the report card.
//   - Share Link: encodes a small, self-contained snapshot of the report
//     data (including which planet it's for) as base64 JSON in a
//     `?report=` URL param, so the link itself *is* the shared copy — no
//     server, no login, no account needed to view it (see
//     renderSharedReport() and the bootstrap check in main.js). It's a
//     point-in-time snapshot, not a live view: whoever opens the link
//     sees the data as of when it was copied, not this player's current
//     progress.
import { getSubject, getSkill, getTest, getTestSubjects, TEST_IDS } from "../data/tests.js";
import { gameState, percentileForTestScore, scoreFromAccuracyInRange } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { monsterSVG } from "./monster.js";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// This test's own per-section score range — half the composite range for
// a "sum" test (SAT/PSAT: each of 2 sections covers half the total), the
// full composite range for an "average" test (ACT: every section is
// already scored on the same 1-36 scale the composite is). Used for
// clamping/scaling wherever a single section's score (not the composite)
// needs a min/max to work with.
function sectionRangeFor(test) {
  const { compositeRange, compositeMethod, sections } = test.practiceTest;
  return compositeMethod === "sum" ? { min: compositeRange.min / sections.length, max: compositeRange.max / sections.length } : compositeRange;
}

// Display order for a test's sections. Defaults to that test's own
// practiceTest.sections order (SAT/PSAT: Reading & Writing, then Math —
// the real digital test's own order), except ACT keeps its original,
// already-shipped order here (Math, Science, English, Reading) so
// generalizing this screen for SAT/PSAT doesn't reshuffle the one planet
// that already had a real report.
const SECTION_DISPLAY_ORDER = { act: ["math", "science", "english", "reading"] };
function sectionOrderFor(test) {
  return SECTION_DISPLAY_ORDER[test.id] || test.practiceTest.sections.map((s) => s.subjectId);
}

// This section's own real per-question time budget on the real test —
// derived from that test's own practiceTest.sections config (timeMinutes /
// questionCount) rather than a separate hand-maintained table, so there's
// only ever one place (data/tests.js) that can be wrong about a real
// test's timing, for any planet.
function paceBudgetSeconds(test, subjectId) {
  const section = test.practiceTest.sections.find((s) => s.subjectId === subjectId);
  return section ? Math.round((section.timeMinutes * 60) / section.questionCount) : null;
}

// The player's own lowest-accuracy skills on this planet (see
// GameState.getWeakSkills) — testId is that method's *fourth* positional
// argument, easy to get wrong, so it's passed explicitly and named here
// rather than relying on default params lining up by accident.
function focusAreasFor(testId) {
  return gameState
    .getWeakSkills(5, 5, 0.9, testId)
    .map(({ id, accuracy }) => {
      const resolved = getSkill(id);
      return resolved ? { skillId: id, name: resolved.skill.name, subjectIcon: resolved.subject.icon, accuracy } : null;
    })
    .filter(Boolean);
}

// Average measured pace vs. this test's own real per-question time budget,
// for every one of this test's sections the player has timed data for.
function pacingFor(test) {
  return test.practiceTest.sections
    .map(({ subjectId }) => {
      const stats = gameState.getPacingStats(subjectId);
      const budgetSeconds = paceBudgetSeconds(test, subjectId);
      return stats && budgetSeconds ? { subjectId, avgSeconds: stats.avgSeconds, budgetSeconds } : null;
    })
    .filter(Boolean);
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
// anything that should be a number is actually clamped to *that test's
// own* real range, so a crafted payload can't smuggle markup through a
// field that's only ever supposed to hold a score, or claim an
// impossible score for the test it says it's for.
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
function sanitizePredictedSections(raw, range) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 8).map((s) => ({
    subjectId: safeStr(s?.subjectId, 20),
    score: safeNum(s?.score, { min: range.min, max: range.max }),
  }));
}
// Capped at 20 to match GameState.recordPracticeTestResult's own history
// cap — never more real data than the app itself keeps.
function sanitizeScoreTrend(raw, range) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 20).map((s) => ({
    date: safeNum(s?.date, { min: 0, max: 99999999999999, fallback: 0 }),
    composite: safeNum(s?.composite, { min: range.min, max: range.max, fallback: range.min }),
  }));
}
function sanitizeFocusAreas(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 5).map((f) => ({
    skillId: safeStr(f?.skillId, 60),
    name: safeStr(f?.name, 60, "Skill"),
    subjectIcon: safeStr(f?.subjectIcon, 8, "📘"),
    accuracy: safeNum(f?.accuracy, { min: 0, max: 1, fallback: 0 }),
  }));
}
function sanitizePacing(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 8).map((p) => ({
    subjectId: safeStr(p?.subjectId, 20),
    avgSeconds: safeNum(p?.avgSeconds, { min: 0, max: 99999, fallback: 0 }),
    budgetSeconds: safeNum(p?.budgetSeconds, { min: 1, max: 99999, fallback: 1 }),
  }));
}
function sanitizeReportData(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  // A hand-crafted link could name a real testId with no practiceTest at
  // all (stateAssessments) or something nonexistent — fall back to ACT
  // rather than trusting it far enough to read `.practiceTest` off it.
  const testId = TEST_IDS.has(r.testId) && getTest(r.testId)?.practiceTest ? r.testId : "act";
  const test = getTest(testId);
  const compositeRange = test.practiceTest.compositeRange;
  const sectionRange = sectionRangeFor(test);
  const rawSections = Array.isArray(r.latestTest?.sectionResults) ? r.latestTest.sectionResults : null;
  return {
    testId,
    name: safeStr(r.name, 30, "Explorer"),
    generatedAt: safeNum(r.generatedAt, { min: 0, max: 99999999999999, fallback: Date.now() }),
    predictedScore: safeNum(r.predictedScore, { min: compositeRange.min, max: compositeRange.max }),
    predictedSections: sanitizePredictedSections(r.predictedSections, sectionRange),
    latestTest:
      r.latestTest && rawSections
        ? {
            composite: safeNum(r.latestTest.composite, { min: compositeRange.min, max: compositeRange.max, fallback: compositeRange.min }),
            sectionResults: rawSections.slice(0, 8).map((s) => ({
              subjectId: safeStr(s?.subjectId, 20),
              label: safeStr(s?.label, 40, "Section"),
              correctCount: safeNum(s?.correctCount, { min: 0, max: 999, fallback: 0 }),
              totalCount: safeNum(s?.totalCount, { min: 0, max: 999, fallback: 0 }),
              subscore: safeNum(s?.subscore, { min: sectionRange.min, max: sectionRange.max, fallback: sectionRange.min }),
              categoryBreakdown: sanitizeCategoryBreakdown(s?.categoryBreakdown),
            })),
          }
        : null,
    essayBest: test.practiceTest.supportsWriting ? safeNum(r.essayBest, { min: 2, max: 12 }) : null,
    masteredCount: safeNum(r.masteredCount, { min: 0, max: 999, fallback: 0 }),
    totalSkills: safeNum(r.totalSkills, { min: 0, max: 999, fallback: 0 }),
    scoreTrend: sanitizeScoreTrend(r.scoreTrend, compositeRange),
    focusAreas: sanitizeFocusAreas(r.focusAreas),
    pacing: sanitizePacing(r.pacing),
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

// Same 20-attempt bar getPredictedScore() uses for the overall composite
// estimate ("once there's enough of it to mean anything") — applied per
// subject here, so a section with too little practice shows as unscored
// instead of a number built on a handful of lucky/unlucky guesses.
const MIN_ATTEMPTS_FOR_SECTION_ESTIMATE = 20;

function buildReportPayload(testId = "act") {
  const test = getTest(testId);
  const predicted = gameState.getPredictedScore(testId);
  const history = gameState.getPracticeTestHistory(testId);
  const latestTest = history.length > 0 ? history[history.length - 1] : null;
  const sectionRange = sectionRangeFor(test);
  // Only meaningful when there's no full Practice Test yet (see
  // reportCardHTML) — a rough per-section estimate from lesson accuracy,
  // the same way predictedScore itself falls back to lesson accuracy.
  const predictedSections = test.practiceTest.sections.map(({ subjectId }) => {
    const stats = gameState.getSubjectStats(subjectId);
    const score = stats.attempts >= MIN_ATTEMPTS_FOR_SECTION_ESTIMATE && stats.accuracy != null ? scoreFromAccuracyInRange(stats.accuracy, sectionRange.min, sectionRange.max) : null;
    return { subjectId, score };
  });

  // Scoped to this planet's own subjects, not gameState.getOverallStats()'s
  // cross-planet total — a SAT report showing ACT+PSAT mastery mixed in
  // would be a meaningless number to the parent/tutor reading it.
  let masteredCount = 0;
  let totalSkills = 0;
  getTestSubjects(testId).forEach((s) => {
    const stats = gameState.getSubjectStats(s.id);
    masteredCount += stats.masteredCount;
    totalSkills += stats.totalSkills;
  });

  return {
    testId,
    name: gameState.data.createdName || "Explorer",
    generatedAt: Date.now(),
    predictedScore: predicted.score,
    predictedSource: predicted.source,
    predictedSections,
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
    essayBest: test.practiceTest.supportsWriting && gameState.essayBest > 0 ? gameState.essayBest : null,
    masteredCount,
    totalSkills,
    scoreTrend: history.map((h) => ({ date: h.date, composite: h.composite })),
    focusAreas: focusAreasFor(testId),
    pacing: pacingFor(test),
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

/** subjectId -> {subscore} built from lesson-accuracy estimates (see
 * buildReportPayload's predictedSections) — same shape sectionsBySubject()
 * produces from a real Practice Test, so scoreTilesHTML/scoreGraphHTML can
 * render either without caring which one they got. A subject with too
 * little lesson data (score: null) is simply left out, same as a subject
 * sectionsBySubject() never saw. */
function predictedSectionsMap(data) {
  const map = Object.create(null);
  (data.predictedSections || []).forEach((s) => {
    if (s.score != null) map[s.subjectId] = { subscore: s.score };
  });
  return map;
}

// STEM isn't a section on any of these tests — it's a fifth score the
// real ACT reports as the average of Math and Science, rounded. Only ACT
// has a separate Science section to average in, so this (and every tile/
// graph line that mentions it) is gated to test.id === "act" wherever
// it's used below.
function computeStemScore(sections) {
  const math = sections.math?.subscore;
  const science = sections.science?.subscore;
  if (math == null || science == null) return null;
  return Math.round((math + science) / 2);
}

function graphDescription(data, sections, composite, test) {
  const parts = [`Your ${test.name} composite score is equal to ${composite}.`];
  sectionOrderFor(test).forEach((id) => {
    const s = sections[id];
    const subject = getSubject(id);
    parts.push(`${subject.name} section score is ${s ? s.subscore : "NA"}.`);
    if (test.id === "act" && id === "science") {
      const stem = computeStemScore(sections);
      parts.push(`STEM score is ${stem != null ? stem : "NA"}.`);
    }
  });
  if (test.practiceTest.supportsWriting) {
    parts.push(`Writing section score is ${data.essayBest != null ? data.essayBest : "NA"}.`);
  }
  return parts.join(" ");
}

function scoreGraphHTML(data, sections, composite, test) {
  const range = sectionRangeFor(test);
  const bars = sectionOrderFor(test)
    .map((id) => {
      const s = sections[id];
      if (!s) return "";
      const subject = getSubject(id);
      const pct = Math.round(((s.subscore - range.min) / (range.max - range.min)) * 100);
      return `
      <div class="score-graph-row" style="--island-color:${subject.colorDark}">
        <span class="score-graph-label">${subject.icon} ${subject.name}</span>
        <div class="score-graph-track">
          <div class="score-graph-fill" style="width:${pct}%"></div>
        </div>
        <span class="score-graph-value">${s.subscore}</span>
      </div>
    `;
    })
    .join("");
  return `
    <div class="score-graph" role="img" aria-label="${escapeHtml(graphDescription(data, sections, composite, test))}">
      ${bars}
    </div>
    <p class="score-caption score-graph-desc">${escapeHtml(graphDescription(data, sections, composite, test))}</p>
  `;
}

function scoreTilesHTML(sections, composite, test) {
  const tiles = [];
  if (test.id === "act") tiles.push({ label: "STEM", value: computeStemScore(sections), primary: true });
  tiles.push({ label: "Composite", value: composite, primary: true });
  sectionOrderFor(test).forEach((id) => {
    const subject = getSubject(id);
    tiles.push({ label: subject.name, value: sections[id]?.subscore, subjectId: id });
  });
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

function scoreDetailsHTML(sections, test) {
  const panels = sectionOrderFor(test)
    .map((id) => {
      const s = sections[id];
      if (!s) return "";
      const subject = getSubject(id);
      // Math's real ACT breakdown includes "Integrating Essential Skills" and
      // "Modeling" categories that cut across content areas — this app's ACT
      // questions aren't tagged for those, so ACT's Math shows its overall
      // score only rather than a partial, misleading-looking category list.
      // SAT/PSAT Math (a different subjectId, "sat-math"/"psat-math") isn't
      // affected by this literal-string check.
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
        ${categoryRows ? `<p class="score-caption">${test.id === "act" ? "ACT Readiness Range" : "Category Breakdown"}</p>${categoryRows}` : ""}
      </div>
    `;
    })
    .join("");
  return `
    <details class="score-section-details" open>
      <summary class="score-section-heading">My Score Details</summary>
      <p class="score-caption">Category percentages reflect accuracy on PrepQuest practice questions, not an official ${test.name} readiness placement.</p>
      ${panels}
    </details>
  `;
}

// Fractions of the way from a test's composite min to max, chosen so
// applying them to ACT's own 1-36 range reproduces exactly the tier
// thresholds this screen always used (Bronze 1, Silver 15, Gold 22,
// Platinum 29) — generalizing the tier math to any composite range
// without changing ACT's own already-shipped numbers at all.
const RANK_TIER_FRACTIONS = [
  { name: "Bronze", frac: 0 },
  { name: "Silver", frac: 0.4 },
  { name: "Gold", frac: 0.6 },
  { name: "Platinum", frac: 0.8 },
];

function rankTiersForTest(test) {
  const { min, max } = test.practiceTest.compositeRange;
  const step = test.practiceTest.scoreStep;
  return RANK_TIER_FRACTIONS.map((t) => ({ name: t.name, min: Math.round((min + t.frac * (max - min)) / step) * step }));
}

/** A game-flavored milestone scale. On ACT it echoes the real ACT
 * National Career Readiness Certificate's Bronze/Silver/Gold/Platinum
 * bands, explicitly labeled as in-game flavor, not the real credential
 * (which is scored off a separate WorkKeys assessment this app has
 * nothing to do with). SAT/PSAT get the same Bronze/Silver/Gold/Platinum
 * shape, scaled to their own composite range, but described in
 * test-neutral terms — neither College Board test has an NCRC
 * equivalent, so nothing here claims one does. */
function rankPanelHTML(compositeScore, test) {
  const { min, max } = test.practiceTest.compositeRange;
  const score = Math.max(min, Math.min(max, Math.round(compositeScore)));
  const tiers = rankTiersForTest(test);
  let tier = tiers[0];
  for (const t of tiers) if (score >= t.min) tier = t;
  const nextTier = tiers[tiers.indexOf(tier) + 1];
  const pct = Math.round(((score - min) / (max - min)) * 100);
  return `
    <section class="ncrc-panel">
      <h2 class="score-section-heading">🏅 Quest Rank Progress</h2>
      <p class="score-caption">${
        test.id === "act"
          ? `A game milestone scale inspired by the ACT National Career Readiness Certificate&trade; &mdash; not the official credential, which is scored separately.`
          : `PrepQuest's own game milestone scale for ${test.name} progress &mdash; not an official College Board credential or rating.`
      }</p>
      <p class="ncrc-your-score">Your Score: <strong>${score}</strong></p>
      <div class="ncrc-scale">
        ${tiers.map((t) => `<span class="ncrc-tier${t === tier ? " is-current" : ""}">${t.name}</span>`).join("")}
      </div>
      <div class="ncrc-progress-track">
        <div class="ncrc-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="ncrc-scale-endpoints"><span>${min}</span><span>${max}</span></div>
      <p class="lesson-paragraph">${
        nextTier
          ? `You're at <strong>${tier.name}</strong> rank and making progress toward <strong>${nextTier.name}</strong>!`
          : `You've reached <strong>Platinum</strong> rank &mdash; the top of the scale!`
      }</p>
    </section>
  `;
}

// A visual bar in place of a bare number, so the percentile actually reads
// as "most of the way across" rather than requiring the reader to know
// what "78th percentile" looks like on its own.
function percentileGaugeHTML(percentile) {
  if (percentile == null) return "";
  return `
    <div class="percentile-gauge">
      <div class="percentile-track">
        <div class="percentile-fill" style="width:${percentile}%"></div>
      </div>
      <p class="results-flag results-flag-muted">Approximately the ${percentile}th percentile nationally.</p>
    </div>
  `;
}

// Same pure-SVG sparkline approach as the Dashboard's own Score History
// chart (see scoreHistoryChart in ui/dashboard.js) — a fixed y-domain over
// *this test's own* composite range (not a hardcoded 1-36) so the shape of
// the line is comparable across sessions on any planet, not just ACT.
function scoreTrendChartHTML(trend, range) {
  if (trend.length < 2) return "";
  const w = 300;
  const h = 70;
  const pad = 6;
  const xFor = (i) => pad + (i / (trend.length - 1)) * (w - pad * 2);
  const yFor = (score) => h - pad - ((score - range.min) / (range.max - range.min)) * (h - pad * 2);
  const points = trend.map((r, i) => `${xFor(i)},${yFor(r.composite)}`).join(" ");
  const dots = trend.map((r, i) => `<circle cx="${xFor(i)}" cy="${yFor(r.composite)}" r="3" fill="var(--purple)"/>`).join("");
  return `
    <section class="score-trend-panel">
      <h2 class="score-section-heading">📈 Score Trend</h2>
      <svg viewBox="0 0 ${w} ${h}" class="score-trend-chart" preserveAspectRatio="none" role="img" aria-label="Composite score trend across your last ${trend.length} practice tests, from ${trend[0].composite} to ${trend[trend.length - 1].composite}">
        <polyline points="${points}" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
      </svg>
      <p class="score-caption">Composite across your last ${trend.length} full-length Practice Tests.</p>
    </section>
  `;
}

function focusAreasHTML(focusAreas) {
  if (focusAreas.length === 0) return "";
  const rows = focusAreas
    .map(
      (f) => `
      <div class="focus-area-row">
        <span class="focus-area-label">${f.subjectIcon} ${escapeHtml(f.name)}</span>
        <div class="score-category-track"><div class="score-category-fill" style="width:${Math.round(f.accuracy * 100)}%"></div></div>
        <span class="focus-area-pct">${Math.round(f.accuracy * 100)}%</span>
      </div>
    `
    )
    .join("");
  return `
    <section class="focus-areas-panel">
      <h2 class="score-section-heading">🎯 Focus Areas</h2>
      <p class="score-caption">This player's lowest-accuracy skills so far &mdash; good candidates for extra review.</p>
      ${rows}
    </section>
  `;
}

function pacingHTML(pacing, test) {
  if (pacing.length === 0) return "";
  const rows = pacing
    .map((p) => {
      const subject = getSubject(p.subjectId);
      const overBudget = p.avgSeconds > p.budgetSeconds;
      return `
      <div class="pacing-row">
        <span class="focus-area-label">${subject.icon} ${subject.name}</span>
        <span class="pacing-value">${Math.round(p.avgSeconds)}s <span class="score-caption">avg vs. a ${p.budgetSeconds}s/question budget</span></span>
        <span class="pacing-flag${overBudget ? "" : " pacing-flag-good"}">${overBudget ? "⏱️ Over pace" : "✓ On pace"}</span>
      </div>
    `;
    })
    .join("");
  return `
    <section class="pacing-panel">
      <h2 class="score-section-heading">⏱️ Pacing</h2>
      <p class="score-caption">Average time per question in timed lessons, compared to the real ${test.name}'s own per-question time budget.</p>
      ${rows}
    </section>
  `;
}

function reportCardHTML(data, { shared }) {
  const test = getTest(data.testId) || getTest("act");
  const hasFullTest = !!data.latestTest;
  const sections = hasFullTest ? sectionsBySubject(data) : predictedSectionsMap(data);
  const hasSectionScores = Object.keys(sections).length > 0;
  const compositeScore = data.latestTest?.composite ?? data.predictedScore;
  const scoreLabel = hasFullTest ? "Practice Test Composite" : `Predicted ${test.name} Score`;
  const percentile = compositeScore != null ? percentileForTestScore(test.id, compositeScore) : null;
  const range = test.practiceTest.compositeRange;
  const sectionRange = sectionRangeFor(test);
  const sectionNames = sectionOrderFor(test).map((id) => getSubject(id).name);

  return `
    <div class="results-card score-report-card">
      <p class="score-disclaimer">Not for official use. This is a practice report from PrepQuest, not an official ${test.name} score.</p>
      <div class="score-report-banner" style="--island-color:${test.colorDark};--island-bg:${test.bg}">
        <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 120 })}</div>
        <h1>${escapeHtml(data.name)}'s ${test.name} Score Report</h1>
        <p class="lesson-blurb">${shared ? "Shared, read-only snapshot" : "Live report"} &mdash; generated ${formatDate(data.generatedAt)}</p>
      </div>

      ${
        compositeScore == null
          ? `<p class="lesson-paragraph">No practice test or lesson data yet.</p>`
          : `
            <details class="score-section-details" open>
              <summary class="score-section-heading">Score Information</summary>
              ${hasSectionScores ? scoreTilesHTML(sections, compositeScore, test) : `<p class="results-score">${scoreLabel}: ${compositeScore} / ${range.max}</p>`}
              ${percentileGaugeHTML(percentile)}
              ${hasSectionScores ? scoreGraphHTML(data, sections, compositeScore, test) : ""}
              ${
                !hasFullTest && hasSectionScores
                  ? `<p class="score-caption">Section scores above are rough estimates from lesson accuracy, not a timed test &mdash; take a full-length Practice Test for real section scores.</p>`
                  : ""
              }
              <details class="score-info-detail">
                <summary>What is Composite Score?</summary>
                <p class="lesson-paragraph">${
                  test.practiceTest.compositeMethod === "average"
                    ? `Your Composite score is the average of your ${sectionNames.length} section scores (${sectionNames.join(", ")}), rounded to the nearest whole number, on the ${test.name}'s ${range.min}&mdash;${range.max} scale.`
                    : `Your Composite score is the sum of your ${sectionNames.join(" and ")} section scores (each ${Math.round(sectionRange.min)}&mdash;${Math.round(sectionRange.max)}), on the ${test.name}'s ${range.min}&mdash;${range.max} scale.`
                }</p>
              </details>
              ${
                test.practiceTest.supportsWriting
                  ? `
                    <details class="score-info-detail">
                      <summary>Writing score information</summary>
                      <p class="lesson-paragraph">${
                        data.essayBest != null
                          ? `Your best Writing score is ${data.essayBest} / 12.`
                          : "The Writing section is optional and scored separately on a 2&ndash;12 scale &mdash; it doesn't count toward your Composite. Write an essay from the Dashboard to earn a score here."
                      }</p>
                    </details>
                  `
                  : ""
              }
            </details>
          `
      }

      ${
        hasFullTest
          ? scoreDetailsHTML(sections, test)
          : compositeScore != null
          ? `<p class="lesson-paragraph score-caption">Take a full-length Practice Test to unlock a real per-category breakdown.</p>`
          : ""
      }

      ${scoreTrendChartHTML(data.scoreTrend, range)}
      ${focusAreasHTML(data.focusAreas)}
      ${pacingHTML(data.pacing, test)}

      <p class="lesson-paragraph">${data.masteredCount} / ${data.totalSkills} skills mastered on ${test.name}.</p>

      ${compositeScore != null ? rankPanelHTML(compositeScore, test) : ""}

      ${shared ? `<p class="results-flag results-flag-muted">This is a shared snapshot from PrepQuest, not a live view &mdash; it won't update as the player keeps practicing.</p>` : ""}
    </div>
  `;
}

export function renderScoreReport(root, navigate, { testId } = {}) {
  const resolvedTestId = TEST_IDS.has(testId) && getTest(testId)?.practiceTest ? testId : "act";
  // Routed through the same sanitizer the shared-link path uses (not just
  // for consistency): gameState.data.createdName came from a plain
  // localStorage read, and while this app's own UI caps it at 20
  // characters, nothing stops someone from editing localStorage directly
  // and putting anything there instead.
  const data = sanitizeReportData(buildReportPayload(resolvedTestId));

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
  root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard", { testId: resolvedTestId }));
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
          <a class="btn-primary lesson-start-btn" href="${location.origin}${location.pathname}">Go to PrepQuest</a>
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
        <a class="btn-secondary" href="${location.origin}${location.pathname}">Play PrepQuest</a>
      </div>
    </main>
  `;
  root.querySelector("[data-print]").addEventListener("click", () => window.print());
}

export { encodeReportPayload, decodeReportPayload, buildReportPayload };
