// Graph Architect's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a purple forest
// (matching Numeria Peaks' own Skyline Functions zone, trees leading,
// spires only a faint distant skyline) where the trees themselves are
// planted into real conic shapes rather than scattered at random: a
// ring of trees forming a circle, another forming an ellipse, another
// following a parabola's own arc — an actual graph, built from trees
// instead of drawn.
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

// A ring of trees on a real ellipse (rx === ry gives a circle) — the
// conic's own equation, not an eyeballed oval.
function renderConicRing(cx, cy, rx, ry, count, seedOffset) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;
    return renderTree(x, y, 24 + (i % 3) * 5, i + seedOffset, ((i * 3) % 5) / 4 - 0.5);
  }).join("");
}

// A row of trees along a real parabola, y = a(x-h)² + k in local scene
// coordinates — an actual arc, not a hand-bent curve.
function renderParabolaArc(cx, cy, width, depth, count, seedOffset) {
  const a = depth / (width * width);
  return Array.from({ length: count }, (_, i) => {
    const t = (i / (count - 1)) * 2 - 1;
    const x = cx + t * width;
    const y = cy + a * (x - cx) * (x - cx);
    return renderTree(x, y, 22 + (i % 3) * 5, i + seedOffset, ((i * 3) % 5) / 4 - 0.5);
  }).join("");
}

function computeLandmarks(positions, totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 780));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    const side = i % 2 === 0 ? 1 : -1;
    const cx = clamp(nearest.x + side * 100, BAND.min + 80, BAND.max - 80);
    return { cx, cy: nearest.y, kind: i % 3, seedOffset: i * 7 };
  });
}

function renderLandmarks(positions, totalHeight) {
  return computeLandmarks(positions, totalHeight)
    .map(({ cx, cy, kind, seedOffset }) => {
      if (kind === 0) return renderConicRing(cx, cy, 60, 60, 9, seedOffset);
      if (kind === 1) return renderConicRing(cx, cy, 72, 44, 8, seedOffset);
      return renderParabolaArc(cx, cy, 66, 58, 7, seedOffset);
    })
    .join("");
}

function computeScatterTrees(positions, totalHeight) {
  const count = Math.max(5, Math.round(totalHeight / 620));
  const mid = (BAND.min + BAND.max) / 2;
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const tx = clamp(nearest.x - side * 90, BAND.min + 25, BAND.max - 25);
    return { x: tx, y: hy, r: 28 + (i % 3) * 6, palette: i, jitter: ((i * 5) % 7) / 6 - 0.5 };
  });
}

function renderScatterTrees(positions, totalHeight) {
  return computeScatterTrees(positions, totalHeight)
    .map(({ x, y, r, palette, jitter }) => renderTree(x, y, r, palette, jitter))
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
  const scatter = renderScatterTrees(positions, totalHeight);
  const landmarks = renderLandmarks(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="90" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a purple forest where the trees themselves form real conic shapes — a circle, an ellipse, a parabola's own arc — a distant skyline above the canopy, connecting every Graph Architect lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      ${renderDistantSkyline()}
      <g>${renderAmbient(totalHeight)}</g>
      <g>${scatter}</g>
      <g>${landmarks}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const graphArchitectForestTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(240, 236, 250, 0.85)",
  renderScene,
};
