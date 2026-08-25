// In Formation's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — an orchard planted in
// parallel rows: a visual pun on the skill itself (parallel structure).
// Each row stays a straight, level line (that's the pun — everything's
// "in formation" row to row), but the trees *within* a row are spaced
// and sized organically rather than snapped to a rigid column grid, so
// it reads as a real planted orchard rather than graph paper. No river,
// no rocks, no wildlife clutter — just rows of trees the trail winds
// between.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };
const TREE_R = 30;

// Rows stay level (same y across a row — that's the "parallel" pun), but
// how many trees are in a row, how far apart they sit, and how big each
// one is all vary — no two rows are laid out quite the same way.
function computeRows(totalHeight) {
  const rowSpacing = 170;
  const rows = Math.max(3, Math.round(totalHeight / rowSpacing));
  const trees = [];
  for (let r = 0; r < rows; r++) {
    const rowY = 90 + (r * (totalHeight - 160)) / Math.max(rows - 1, 1);
    const count = 3 + (r % 3);
    let x = BAND.min + 15 + ((r * 29) % 45);
    for (let c = 0; c < count; c++) {
      if (x > BAND.max - 15) break;
      const yJitter = ((r * 5 + c * 3) % 9) - 4;
      const treeR = TREE_R * (0.8 + ((r * 4 + c * 2) % 5) * 0.09);
      const shade = (r * 3 + c) % CANOPY_SHADES.length;
      trees.push({ x, y: rowY + yJitter, r: treeR, rowY, shade });
      x += 82 + ((r * 11 + c * 17) % 6) * 15;
    }
  }
  return trees;
}

// One plain, uniform-*shaped* canopy circle on a short trunk (still not
// staggered blobs like jungle.js's trees, since the species stays the
// same tree throughout, and the whole point is a uniform crop) but
// sized per-tree now rather than one fixed TREE_R for every single one,
// plus a touch of natural canopy-color variation (some trees a bit
// riper/yellower than others) so the row doesn't look like one clip-art
// tree stamped over and over.
const CANOPY_SHADES = ["#6b9c4d", "#76a352", "#7ea347", "#649457"];

function renderTree({ x, y, r, shade }) {
  return `
    <rect x="${x - 3}" y="${y + r * 0.2}" width="6" height="${r * 0.68}" fill="#6b5233" rx="2" />
    <ellipse cx="${x}" cy="${y + r * 0.82}" rx="${r * 0.55}" ry="8" fill="rgba(20,35,10,0.16)" />
    <circle cx="${x}" cy="${y}" r="${r}" fill="${CANOPY_SHADES[shade]}" />
    <circle cx="${x - r * 0.27}" cy="${y - r * 0.2}" r="${r * 0.55}" fill="#7fb35e" opacity="0.7" />
  `;
}

const ROW_FLOWER_EMOJI = ["🌷", "🌻"];
const AMBIENT_EMOJI = ["🦋", "🌿"];

// A single tidy flower planted between each pair of trees in a row, not
// scattered — keeps the "orderly, one row at a time" feel even in the
// small details, grouped by each tree's own row line (not its jittered
// y) so the grouping stays exact.
function renderFlowerRows(trees) {
  const byRow = new Map();
  trees.forEach((t) => {
    if (!byRow.has(t.rowY)) byRow.set(t.rowY, []);
    byRow.get(t.rowY).push(t.x);
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
  const trees = computeRows(totalHeight);
  const treesHTML = trees.map(renderTree).join("");
  const flowerRows = renderFlowerRows(trees);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#e8ecd8" stroke="#a3b378" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: an orchard planted in parallel rows, and a trail winding between them connecting every In Formation lesson up to ${bossName}'s own clearing">
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
