// Stay on Topic's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a wide-open, uncluttered
// clearing: a visual pun on the skill itself (relevance — staying
// focused, not getting distracted). Deliberately the emptiest, calmest
// scene of the set (in direct contrast to bramble.js's clutter): a
// single big landmark tree, a signpost, a compass, and almost nothing
// else. The trail itself is unusually direct too — a much narrower
// trailBand than any other theme means far less side-to-side wander, a
// straighter line "staying on topic" rather than winding.
import { COL_W, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: COL_W / 2 - 70, max: COL_W / 2 + 70 };

function renderLandmarkTree(x, y) {
  const r = 70;
  return `
    <ellipse cx="${x}" cy="${y + 30}" rx="${r * 0.7}" ry="18" fill="rgba(20,35,10,0.14)" />
    <rect x="${x - 8}" y="${y + 6}" width="16" height="34" fill="#7a5a35" rx="4" />
    <circle cx="${x}" cy="${y - r * 0.35}" r="${r}" fill="#7fb35e" />
    <circle cx="${x - r * 0.4}" cy="${y - r * 0.15}" r="${r * 0.62}" fill="#8fc26e" opacity="0.8" />
  `;
}

function renderSignpost(x, y) {
  return `
    <rect x="${x - 4}" y="${y - 6}" width="8" height="46" fill="#8a6a44" rx="2" />
    <rect x="${x - 30}" y="${y - 22}" width="60" height="20" rx="4" fill="#e8e2cf" stroke="#a3987a" stroke-width="2" />
  `;
}

function renderScene(positions, totalHeight, bossName) {
  const treeY = totalHeight * 0.34;
  const treeX = COL_W / 2 + 90;
  const signY = totalHeight * 0.62;
  const signX = COL_W / 2 - 95;
  const last = positions[positions.length - 1];
  const bossClearing = `
    <circle cx="${last.x}" cy="${last.y}" r="86" fill="#eef5df" stroke="#9fc47a" stroke-width="4" />
    <text x="${last.x}" y="${last.y - 100}" font-size="30" text-anchor="middle">🧭</text>
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a wide, open, unobstructed clearing with a single landmark tree and a signpost, and a direct trail connecting every Stay on Topic lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#9fc47a" />
      ${renderLandmarkTree(treeX, treeY)}
      ${renderSignpost(signX, signY)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const overlookTheme = {
  trailBand: BAND,
  mapBg: "#9fc47a",
  hintColor: "rgba(15, 35, 10, 0.78)",
  renderScene,
};
