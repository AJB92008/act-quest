// Power Surge's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — open, flat gold-flecked
// ground (matching Numeria Peaks' own Goldtally Flats zone, deliberately
// low rather than the rock walls or forest the other three zones lean
// on, since "Flats" means no elevation), where a nugget cluster's own
// count doubles at every stop — two, then four, then eight, then
// sixteen — an actual exponential surge rather than a fixed pile, and
// real lightning-shaped cracks run through the dry earth between them.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };
const GROUND = "#dcc48f";
const CRACK_COLOR = "#8a6d1f";

function renderGoldNugget(x, y, r) {
  return `
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.3).toFixed(1)}" rx="${(r * 1.05).toFixed(1)}" ry="${(r * 0.35).toFixed(1)}" fill="rgba(60,45,20,0.16)" />
    <ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.82).toFixed(1)}" fill="#d4af37" stroke="#8a6d1f" stroke-width="1.5" />
    <ellipse cx="${(x - r * 0.28).toFixed(1)}" cy="${(y - r * 0.22).toFixed(1)}" rx="${(r * 0.34).toFixed(1)}" ry="${(r * 0.2).toFixed(1)}" fill="#f0d97a" opacity="0.75" />
  `;
}

// A cluster whose own nugget count is the point — 2^n, not a fixed
// handful, laid out in a loose ring so a bigger count reads as visibly
// bigger rather than just more crowded.
function renderNuggetCluster(cx, cy, count) {
  if (count <= 1) return renderGoldNugget(cx, cy, 13);
  const ringR = 10 + count * 3.2;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(angle) * ringR;
    const y = cy + Math.sin(angle) * ringR * 0.6;
    return renderGoldNugget(x, y, 11 + (i % 3) * 1.5);
  }).join("");
}

function computeSurgeClusters(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(4, Math.round(totalHeight / 560));
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const x = clamp(nearest.x + side * 90, BAND.min + 45, BAND.max - 45);
    const power = Math.min(4, (i % 4) + 1);
    return { x, y: hy, count: Math.pow(2, power) };
  });
}

function renderSurgeClusters(positions, totalHeight) {
  return computeSurgeClusters(positions, totalHeight)
    .map(({ x, y, count }) => renderNuggetCluster(x, y, count))
    .join("");
}

// A genuine lightning-bolt crack in the dry earth — a jagged zigzag,
// not the gentler forked crack barrens.js uses, so "surge" reads even
// in the ground texture itself.
function renderLightningCrack(x, y, s, rot) {
  const d = `M0,0 L${5 * s},${-3 * s} L${3 * s},${-1 * s} L${9 * s},${-6 * s} L${6 * s},${-2 * s} L${12 * s},${-8 * s}`;
  return `<path d="${d}" stroke="${CRACK_COLOR}" stroke-width="${(1.6 * s).toFixed(1)}" fill="none" opacity="0.55" stroke-linecap="round" stroke-linejoin="round" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})" />`;
}

function computeCracks(totalHeight) {
  const count = Math.max(16, Math.round(totalHeight / 190));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    return { x: clamp(hx * COL_W, 20, COL_W - 20), y: hy * totalHeight, rot: (i * 47) % 360, s: 1 + (i % 3) * 0.4 };
  });
}

function renderCracks(totalHeight) {
  return computeCracks(totalHeight)
    .map((c) => renderLightningCrack(c.x, c.y, c.s, c.rot))
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const cracks = renderCracks(totalHeight);
  const clusters = renderSurgeClusters(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: open flat gold-flecked ground crossed by lightning-shaped cracks, where a cluster of nuggets doubles in count at every stop, connecting every Power Surge lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      <g>${cracks}</g>
      ${clusters}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#8a6d1f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const powerSurgeFlatsTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
