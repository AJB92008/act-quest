// Athenaeum Reef's own theme for Two Texts, One Story, Driftwood Cove's
// second skill (see lessonTerrain.js for the shared engine every
// lesson-path theme renders through, and driftwoodLocker.js for this
// zone's own first theme). The skill is about integrating information
// from two separate texts into one understanding, so the scene is built
// around exactly that: two distinct currents (different colors, each
// carrying its own drifting log) running down either side of the frame,
// physically merging into one wider current by MERGE_FRAC down the
// page and continuing the rest of the way as a single combined flow —
// the trail itself crosses right at the confluence.
import { COL_W, clamp, edgeSegments, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };
const MERGE_FRAC = 0.46; // how far down the two currents finish merging

// Both currents' own inner (trail-facing) edges are computed together,
// tapering from their own starting width down to touching exactly at
// the centerline by mergeY — after that point both stay at the
// centerline (still independently wobbling, so the seam breathes rather
// than reading as a perfectly rigid line), which is what actually makes
// the two shapes read as *one* continuous colored region afterward
// instead of two bands with a gap between them.
function computeCurrents(totalHeight) {
  const mergeY = totalHeight * MERGE_FRAC;
  const steps = 36;
  const leftOuterX = 70;
  const leftInnerStart = 220;
  const rightInnerStart = COL_W - 220;
  const rightOuterX = COL_W - 70;
  const midX = COL_W / 2;

  const left = { outer: [], inner: [] };
  const right = { outer: [], inner: [] };
  for (let i = 0; i <= steps; i++) {
    const y = (totalHeight / steps) * i;
    const wobble = 14 * Math.sin(i * 0.6);
    const t = clamp(y / mergeY, 0, 1);
    const leftInnerX = leftInnerStart + (midX - leftInnerStart) * t;
    const rightInnerX = rightInnerStart + (midX - rightInnerStart) * t;
    left.outer.push({ x: leftOuterX + wobble, y });
    left.inner.push({ x: leftInnerX + wobble * 0.4, y });
    right.outer.push({ x: rightOuterX - wobble, y });
    right.inner.push({ x: rightInnerX - wobble * 0.4, y });
  }
  return { left, right, mergeY };
}

function bandFrom(outerPts, innerPts) {
  const top = outerPts[0];
  const bottomInner = innerPts[innerPts.length - 1];
  return `M${top.x},${top.y} ${edgeSegments(outerPts)} L${bottomInner.x},${bottomInner.y} ${edgeSegments([...innerPts].reverse())} Z`;
}

function renderDriftLog(x, y, angle, fill) {
  return `<rect x="${x - 26}" y="${y - 6}" width="52" height="12" rx="6" fill="${fill}" transform="rotate(${angle} ${x} ${y})" />`;
}

const AMBIENT_EMOJI = ["🐬", "🫧"];
function renderAmbient(totalHeight, mergeY) {
  // Dolphins swim across both currents (not confined to one side), the
  // clearest way to show the two are already part of the same water —
  // a hint at the merge before it visually happens.
  const count = Math.max(6, Math.round(mergeY / 130));
  return Array.from({ length: count }, (_, i) => {
    const y = 20 + (mergeY / count) * i;
    const x = 90 + ((i * 151) % (COL_W - 180));
    const a = AMBIENT_EMOJI[i % AMBIENT_EMOJI.length];
    return `<text x="${x}" y="${y}" font-size="20" opacity="0.7" text-anchor="middle">${a}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const { left, right, mergeY } = computeCurrents(totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#c9a887" stroke-width="4" />`;
  const midX = COL_W / 2;

  // One drifting log per current before the merge (each its own color),
  // one wider composite log just after it — the same two colors now
  // literally joined side by side into a single wider piece.
  const logsBefore = renderDriftLog(140, mergeY * 0.4, -8, "#8a7259") + renderDriftLog(COL_W - 140, mergeY * 0.55, 6, "#6b5641");
  const logAfter = `
    <rect x="${midX - 30}" y="${mergeY + 34}" width="34" height="14" rx="7" fill="#8a7259" />
    <rect x="${midX + 2}" y="${mergeY + 34}" width="34" height="14" rx="7" fill="#6b5641" />
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Driftwood Cove: two separate currents, each carrying its own drifting log, merging into one wider current partway down, with a trail crossing right at the confluence and connecting every Two Texts, One Story lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#c9a887" />
      <path d="${bandFrom(left.outer, left.inner)}" fill="#5fa0c4" opacity="0.88" />
      <path d="${bandFrom(right.outer, right.inner)}" fill="#5fc4a0" opacity="0.88" />
      <g>${renderAmbient(totalHeight, mergeY)}</g>
      ${logsBefore}
      ${logAfter}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#f3ead6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const confluenceCoveTheme = {
  trailBand: BAND,
  mapBg: "#c9a887",
  hintColor: "rgba(30, 25, 15, 0.75)",
  renderScene,
};
