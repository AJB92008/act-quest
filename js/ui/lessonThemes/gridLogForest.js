// Grid & Log's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a purple forest (matching
// Numeria Peaks' own Skyline Functions zone, trees leading, spires only
// a faint distant skyline) where the two halves of the skill each get
// their own real landmark: trees planted in an actual row-by-column
// grid between a real pair of matrix brackets, alternating with a real
// logarithmic spiral (r = ae^(bθ), not a hand-drawn curl) growing like
// a vine through the trees.
import { COL_W, clamp, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 45, max: COL_W - 45 };
const GROUND = "#443a66";
const CANOPY_PALETTES = [
  ["#6f6690", "#8b7fc4", "#a89adf"],
  ["#5c4f7a", "#7a6ba8", "#9a8cc4"],
  ["#4a3d66", "#6a5a90", "#8a7ab0"],
];

function renderDistantSkyline() {
  const spires = Array.from({ length: 6 }, (_, i) => {
    const x = BAND.min + 10 + i * ((BAND.max - BAND.min - 20) / 5);
    const h = 30 + (i % 3) * 14;
    return `<path d="M${(x - 9).toFixed(1)},40 L${x.toFixed(1)},${(40 - h).toFixed(1)} L${(x + 9).toFixed(1)},40 Z" fill="#6f6690" opacity="0.35" />`;
  }).join("");
  return `<g>${spires}</g>`;
}

function renderTree(x, y, r, palette, jitter) {
  const [c1, c2, c3] = CANOPY_PALETTES[palette % CANOPY_PALETTES.length];
  return `
    <rect x="${(x - 3.5).toFixed(1)}" y="${(y + r * 0.25).toFixed(1)}" width="7" height="${(r * 0.8).toFixed(1)}" fill="#453a5c" rx="3" />
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.35).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${(r * 0.24).toFixed(1)}" fill="rgba(10,6,20,0.3)" />
    <circle cx="${(x - r * (0.32 + jitter * 0.1)).toFixed(1)}" cy="${(y + jitter * 5).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${c1}" />
    <circle cx="${(x + r * (0.35 + jitter * 0.08)).toFixed(1)}" cy="${(y - r * 0.08 - jitter * 4).toFixed(1)}" r="${(r * 0.55).toFixed(1)}" fill="${c2}" />
    <circle cx="${(x - jitter * 7).toFixed(1)}" cy="${(y - r * 0.44).toFixed(1)}" r="${(r * 0.56).toFixed(1)}" fill="${c3}" />
  `;
}

// A real row-by-column grid of trees, framed by a real pair of matrix
// brackets — the shape a matrix is actually drawn with.
function renderMatrixGrid(cx, cy, rows, cols, spacing, seedOffset) {
  const trees = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cx + (c - (cols - 1) / 2) * spacing;
      const y = cy + (r - (rows - 1) / 2) * spacing;
      trees.push(renderTree(x, y, 20, r * cols + c + seedOffset, ((r + c) % 5) / 4 - 0.5));
    }
  }
  const w = cols * spacing;
  const h = rows * spacing;
  const bx0 = cx - w / 2 - 16;
  const bx1 = cx + w / 2 + 16;
  const by0 = cy - h / 2 - 14;
  const by1 = cy + h / 2 + 14;
  const bracket = `
    <path d="M${(bx0 + 9).toFixed(1)},${by0.toFixed(1)} L${bx0.toFixed(1)},${by0.toFixed(1)} L${bx0.toFixed(1)},${by1.toFixed(1)} L${(bx0 + 9).toFixed(1)},${by1.toFixed(1)}" stroke="#efe4cf" stroke-width="3" fill="none" opacity="0.65" />
    <path d="M${(bx1 - 9).toFixed(1)},${by0.toFixed(1)} L${bx1.toFixed(1)},${by0.toFixed(1)} L${bx1.toFixed(1)},${by1.toFixed(1)} L${(bx1 - 9).toFixed(1)},${by1.toFixed(1)}" stroke="#efe4cf" stroke-width="3" fill="none" opacity="0.65" />
  `;
  return trees.join("") + bracket;
}

// A real logarithmic spiral, r = ae^(bθ), sampled and connected —
// growing outward through the forest like a vine.
function renderLogSpiral(cx, cy, seedOffset) {
  const steps = 44;
  const turns = 2.1;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const theta = (i / steps) * turns * Math.PI * 2;
    const r = 5 * Math.exp(0.19 * theta);
    return { x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const leaves = pts
    .filter((_, i) => i % 8 === 4)
    .map((p, i) => renderTree(p.x, p.y, 18, i + seedOffset, ((i * 3) % 5) / 4 - 0.5))
    .join("");
  return `<path d="${d}" stroke="#c9a668" stroke-width="3" fill="none" opacity="0.75" stroke-linecap="round" />${leaves}`;
}

function computeLandmarks(positions, totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 640));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    const side = i % 2 === 0 ? 1 : -1;
    const cx = clamp(nearest.x + side * 100, BAND.min + 90, BAND.max - 90);
    return { cx, cy: nearest.y, isMatrix: i % 2 === 0, seedOffset: i * 11 };
  });
}

function renderLandmarks(positions, totalHeight) {
  return computeLandmarks(positions, totalHeight)
    .map(({ cx, cy, isMatrix, seedOffset }) =>
      isMatrix ? renderMatrixGrid(cx, cy, 2, 3, 34, seedOffset) : renderLogSpiral(cx, cy, seedOffset)
    )
    .join("");
}

function renderAmbient(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 61) % (BAND.max - BAND.min - 40)), BAND.min + 10, BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="17" opacity="0.55" text-anchor="middle">✨</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const landmarks = renderLandmarks(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="90" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a purple forest where trees form a real matrix grid between bracket marks at some stops and a real logarithmic spiral at others, a distant skyline above the canopy, connecting every Grid & Log lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      ${renderDistantSkyline()}
      <g>${renderAmbient(totalHeight)}</g>
      <g>${landmarks}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const gridLogForestTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(240, 236, 250, 0.85)",
  renderScene,
};
