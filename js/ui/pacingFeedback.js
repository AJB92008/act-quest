// Shared "how's your pace" readout, comparing a subject's rolling average
// seconds-per-question (state.js's recordPaceSample/getPacingStats) against
// the real ACT's per-question time budget for that section. Used on lesson
// results (fresh signal right after a session) and the dashboard (the
// longer-run trend).
export function renderPacingTag(pacing) {
  if (!pacing || !pacing.budgetSeconds) return "";
  const diff = pacing.avgSeconds - pacing.budgetSeconds;
  const pctOff = Math.abs(diff) / pacing.budgetSeconds;
  let verdict;
  let cls;
  if (pctOff < 0.1) {
    verdict = "right on pace for the real ACT";
    cls = "pace-good";
  } else if (diff < 0) {
    verdict = "faster than the real ACT's pace, with room to slow down and double-check";
    cls = "pace-good";
  } else {
    verdict = "slower than the real ACT's pace — worth practicing faster recognition";
    cls = "pace-warn";
  }
  return `
    <p class="pacing-tag ${cls}">⏱️ Averaging ${pacing.avgSeconds.toFixed(1)}s/question vs. the real ACT's ~${pacing.budgetSeconds}s/question budget — ${verdict}.</p>
  `;
}
