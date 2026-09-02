// Coordinate Compass' own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a purple forest
// (matching Numeria Peaks' own Skyline Functions zone, trees leading
// rather than the spires that dominate the hub map itself, which only
// show up here as a faint distant skyline) laid over a faint coordinate
// grid, with a compass rose planted at intervals and small plotted-point
// markers along the way — the forest floor doubling as the plane this
// skill actually measures distances and slopes across.
import { COL_W, clamp, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 45, max: COL_W - 45 };
const TREE_COUNT = 9;
const GROUND = "#443a66";
const CANOPY_PALETTES = [
  ["#6f6690", "#8b7fc4", "#a89adf"],
  ["#5c4f7a", "#7a6ba8", "#9a8cc4"],
  ["#4a3d66", "#6a5a90", "#8a7ab0"],
];

// A faint skyline glimpsed above the canopy — small, low-opacity
// spires along the very top, the same shape the hub map's own Skyline
// Functions uses for its central motif, just distant and secondary here.
function renderDistantSkyline() {
  const spires = Array.from({ length: 6 }, (_, i) => {
    const x = BAND.min + 10 + i * ((BAND.max - BAND.min - 20) / 5);
    const h = 30 + (i % 3) * 14;
    return `<path d="M${(x - 9).toFixed(1)},40 L${x.toFixed(1)},${(40 - h).toFixed(1)} L${(x + 9).toFixed(1)},40 Z" fill="#6f6690" opacity="0.35" />`;
  }).join("");
  return `<g>${spires}</g>`;
}

function computeTrees(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return Array.from({ length: TREE_COUNT }, (_, i) => {
    const hy = ((i + 0.5) / TREE_COUNT) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const dist = 90 + (i % 3) * 40;
    const tx = clamp(nearest.x + side * dist, BAND.min + 25, BAND.max - 25);
    const r = 32 + (i % 4) * 8;
    const palette = i % CANOPY_PALETTES.length;
    const jitter = ((i * 5) % 7) / 6 - 0.5;
    return { x: tx, y: hy, r, palette, jitter };
  });
}

function renderTree({ x, y, r, palette, jitter }) {
  const [c1, c2, c3] = CANOPY_PALETTES[palette];
  return `
    <rect x="${x - 4}" y="${y + r * 0.25}" width="8" height="${r * 0.85}" fill="#453a5c" rx="3" />
    <ellipse cx="${x}" cy="${y + r * 0.35}" rx="${r * 0.6}" ry="${r * 0.26}" fill="rgba(10,6,20,0.3)" />
    <circle cx="${x - r * (0.35 + jitter * 0.1)}" cy="${y + jitter * 6}" r="${r * 0.55}" fill="${c1}" />
    <circle cx="${x + r * (0.38 + jitter * 0.08)}" cy="${y - r * 0.08 - jitter * 5}" r="${r * 0.6}" fill="${c2}" />
    <circle cx="${x - jitter * 8}" cy="${y - r * 0.48}" r="${r * 0.62}" fill="${c3}" />
  `;
}

// A faint coordinate grid across the whole ground — the plane this
// skill's own midpoint/distance/slope work actually happens on.
function renderGrid(totalHeight) {
  const step = 90;
  const cols = Array.from({ length: Math.ceil(COL_W / step) }, (_, i) => i * step);
  const rows = Array.from({ length: Math.ceil(totalHeight / step) }, (_, i) => i * step);
  const vLines = cols.map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${totalHeight}" stroke="#8b7fc4" stroke-width="1" opacity="0.14" />`).join("");
  const hLines = rows.map((y) => `<line x1="0" y1="${y}" x2="${COL_W}" y2="${y}" stroke="#8b7fc4" stroke-width="1" opacity="0.14" />`).join("");
  return vLines + hLines;
}

function renderCompassRose(x, y, r) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    return `${(x + Math.cos(angle) * rr).toFixed(1)},${(y + Math.sin(angle) * rr).toFixed(1)}`;
  }).join(" ");
  return `
    <circle cx="${x}" cy="${y}" r="${r + 10}" fill="none" stroke="#efe4cf" stroke-width="1.5" opacity="0.5" />
    <polygon points="${pts}" fill="#efe4cf" stroke="#453a5c" stroke-width="1.5" opacity="0.92" />
    <circle cx="${x}" cy="${y}" r="4" fill="#c9a668" />
  `;
}

function computeRoses(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 900));
  return Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * totalHeight);
}

// A small plotted point — a dot with a faint coordinate-style crosshair
// — marking the trail itself as points on the same plane the grid draws.
function renderPlottedPoint(x, y) {
  return `
    <line x1="${x - 10}" y1="${y}" x2="${x + 10}" y2="${y}" stroke="#efe4cf" stroke-width="1" opacity="0.5" />
    <line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}" stroke="#efe4cf" stroke-width="1" opacity="0.5" />
    <circle cx="${x}" cy="${y}" r="4" fill="#c9a668" stroke="#453a5c" stroke-width="1" />
  `;
}

function renderPlottedPoints(positions) {
  return positions
    .filter((_, i) => i % 3 === 0)
    .map((p) => renderPlottedPoint(p.x, p.y))
    .join("");
}

function renderAmbient(totalHeight) {
  const emoji = ["✨", "🍃"];
  const count = Math.max(10, Math.round(totalHeight / 200));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 61) % (BAND.max - BAND.min - 40)), BAND.min + 10, BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="18" opacity="0.6" text-anchor="middle">${emoji[i % emoji.length]}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const trees = computeTrees(positions, totalHeight).map(renderTree).join("");
  const roses = computeRoses(totalHeight)
    .map((y, i) => renderCompassRose(clamp((BAND.min + BAND.max) / 2 + (i % 2 === 0 ? 30 : -30), BAND.min + 40, BAND.max - 40), y, 30))
    .join("");
  const points = renderPlottedPoints(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="90" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a purple forest over a faint coordinate grid, with a compass rose and plotted points marking the way, a distant skyline above the canopy, connecting every Coordinate Compass lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      ${renderDistantSkyline()}
      ${renderGrid(totalHeight)}
      <g>${renderAmbient(totalHeight)}</g>
      <g>${trees}</g>
      ${roses}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${points}</g>
    </svg>
  `;
}

export const coordinateForestTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(240, 236, 250, 0.85)",
  renderScene,
};
