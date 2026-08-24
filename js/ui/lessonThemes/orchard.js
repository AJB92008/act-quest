// In Formation's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a tidy orchard planted in
// strict, evenly-spaced rows: a visual pun on the skill itself (parallel
// structure — everything here is deliberately, uniformly "in formation,"
// unlike every other theme's organic, randomly-staggered scenery). No
// river, no rocks, no wildlife clutter — just neat rows of identical
// trees the trail winds between.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };
const ROW_COLS = 4;
const TREE_R = 30;

// A strict grid, not staggered or randomized — every tree the same size,
// evenly spaced in both directions, reading as literal rows/columns.
function computeGrid(totalHeight) {
  const rowSpacing = 170;
  const rows = Math.max(3, Math.round(totalHeight / rowSpacing));
  const colGap = (BAND.max - BAND.min) / (ROW_COLS - 1);
  const trees = [];
  for (let r = 0; r < rows; r++) {
    const y = 90 + r * (totalHeight - 160) / Math.max(rows - 1, 1);
    for (let c = 0; c < ROW_COLS; c++) {
      trees.push({ x: BAND.min + c * colGap, y });
    }
  }
  return trees;
}

// One plain, uniform canopy circle on a short trunk — deliberately
// simple and identical every time, not staggered blobs like jungle.js's
// trees, since the whole point here is uniformity.
function renderTree({ x, y }) {
  return `
    <rect x="${x - 3}" y="${y + 6}" width="6" height="20" fill="#6b5233" rx="2" />
    <ellipse cx="${x}" cy="${y + 24}" rx="${TREE_R * 0.55}" ry="8" fill="rgba(20,35,10,0.16)" />
    <circle cx="${x}" cy="${y}" r="${TREE_R}" fill="#6b9c4d" />
    <circle cx="${x - 8}" cy="${y - 6}" r="${TREE_R * 0.55}" fill="#7fb35e" opacity="0.7" />
  `;
}

const ROW_FLOWER_EMOJI = ["🌷", "🌻"];
const AMBIENT_EMOJI = ["🦋", "🌿"];

// A single tidy flower planted between each pair of trees in a row, not
// scattered — keeps the "orderly" feel even in the small details.
function renderFlowerRows(trees) {
  const byRow = new Map();
  trees.forEach((t) => {
    if (!byRow.has(t.y)) byRow.set(t.y, []);
    byRow.get(t.y).push(t.x);
  });
  const marks = [];
  let i = 0;
  for (const [y, xs] of byRow) {
    xs.sort((a, b) => a - b);
    for (let c = 0; c < xs.length - 1; c++) {
      const mx = (xs[c] + xs[c + 1]) / 2;
      marks.push(`<text x="${mx}" y="${y + 10}" font-size="20" text-anchor="middle">${ROW_FLOWER_EMOJI[i % ROW_FLOWER_EMOJI.length]}</text>`);
      i++;
    }
  }
  return marks.join("");
}

function renderAmbient(positions) {
  return positions
    .filter((_, i) => i % 4 === 2)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 10, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 20}" font-size="24" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const trees = computeGrid(totalHeight);
  const treesHTML = trees.map(renderTree).join("");
  const flowerRows = renderFlowerRows(trees);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#e8ecd8" stroke="#a3b378" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a tidy orchard planted in even rows, and a trail winding between them connecting every In Formation lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#8fae6a" />
      <g>${treesHTML}</g>
      <g>${flowerRows}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderAmbient(positions)}</g>
    </svg>
  `;
}

export const orchardTheme = {
  trailBand: BAND,
  mapBg: "#8fae6a",
  hintColor: "rgba(20, 35, 10, 0.78)",
  renderScene,
};
