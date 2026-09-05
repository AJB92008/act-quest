// Athenaeum Reef's own theme for Side by Side, Tide Pool Terrace's
// second skill (see lessonTerrain.js for the shared engine every
// lesson-path theme renders through, and tidalCascade.js for this
// zone's own first theme). Side by Side is about comparing two things
// directly against each other, so every stop gets exactly that: two
// pools sitting right next to each other, each holding different
// contents — shells in one, seaweed in the other — built to be read as
// a pair, not individually.
import { COL_W, clamp, blobPoints, closedBlobPath, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const POOL_A_FILL = "#bdeee2";
const POOL_B_FILL = "#a7cbe0";
const EDGE = "#5f9ab8";

function renderPoolPair(cx, y, seed) {
  const gap = 16;
  const r = 30;
  const leftX = cx - r - gap / 2;
  const rightX = cx + r + gap / 2;
  const leftPts = blobPoints(leftX, y, r, 14, seed);
  const rightPts = blobPoints(rightX, y, r, 14, seed + 5.5);
  return `
    <path d="${closedBlobPath(leftPts)}" fill="${POOL_A_FILL}" stroke="${EDGE}" stroke-width="3" />
    <path d="${closedBlobPath(rightPts)}" fill="${POOL_B_FILL}" stroke="${EDGE}" stroke-width="3" />
    <text x="${leftX - 6}" y="${y + 5}" font-size="15" text-anchor="middle">🐚</text>
    <text x="${leftX + 8}" y="${y - 6}" font-size="13" text-anchor="middle">🐚</text>
    <text x="${rightX}" y="${y + 5}" font-size="17" text-anchor="middle">🌿</text>
  `;
}

// One pair per every other lesson, centered on the trail itself (not
// offset to a side) — since each stop's whole point is the pair sitting
// symmetrically together, not competing for space with the trail line.
function renderPairs(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => renderPoolPair(p.x, p.y, i * 3.1))
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#a7e0d8" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Tide Pool Terrace: pairs of tide pools sitting side by side, each pair holding different contents to compare, connecting every Side by Side lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#e2ede8" />
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#5f9ab8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderPairs(positions)}</g>
    </svg>
  `;
}

export const twinTidepoolsTheme = {
  trailBand: BAND,
  mapBg: "#e2ede8",
  hintColor: "rgba(20, 35, 35, 0.75)",
  renderScene,
};
