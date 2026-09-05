// Athenaeum Reef's own theme for Time Order, Tide Pool Terrace's first
// skill (see lessonTerrain.js for the shared engine every lesson-path
// theme renders through). Time Order is about following a passage's own
// sequence of events, so the scene is a literal cascade: a chain of tide
// pools connected by a spill-channel from one to the next, each pool a
// little larger than the last — water only ever flows one direction,
// the same way a passage's own events only ever happen in one order.
import { COL_W, clamp, blobPoints, closedBlobPath, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const POOL_FILL = "#bdeee2";
const POOL_EDGE = "#5f9ab8";

// One pool per every other lesson (not every one — a pool at every
// single stop would crowd the chain), alternating sides of the trail.
function poolPositions(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < mid ? 1 : -1;
      const x = clamp(p.x + side * 80, 40, COL_W - 40);
      return { x, y: p.y };
    });
}

function renderPool(x, y, r, seed) {
  const pts = blobPoints(x, y, r, 16, seed);
  return `<path d="${closedBlobPath(pts)}" fill="${POOL_FILL}" stroke="${POOL_EDGE}" stroke-width="3" />`;
}

// A curved spill-channel between two consecutive pools — the visual
// throughline that makes this read as one connected cascade rather than
// a scatter of unrelated pools.
function renderChannel(a, b) {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  return `<path d="M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}" stroke="${POOL_EDGE}" stroke-width="8" fill="none" opacity="0.5" stroke-linecap="round" />`;
}

function renderPools(positions) {
  const pools = poolPositions(positions);
  const channels = pools
    .slice(0, -1)
    .map((p, i) => renderChannel(p, pools[i + 1]))
    .join("");
  // Growing radius down the chain — the pool itself gets visibly
  // "later" the further down the sequence you go.
  const shapes = pools.map((p, i) => renderPool(p.x, p.y, 26 + i * 4, i * 2.2)).join("");
  return channels + shapes;
}

const AMBIENT_EMOJI = ["🦀", "🐚"];
function renderAmbient(totalHeight) {
  const count = Math.max(8, Math.round(totalHeight / 200));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 90) / (count - 1 || 1)) * i;
    const x = clamp(30 + ((i * 101) % (COL_W - 60)), 20, COL_W - 20);
    return `<text x="${x}" y="${y}" font-size="20" opacity="0.6" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#a7e0d8" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Tide Pool Terrace: a cascade of tide pools connected by spill-channels, each a little larger than the last, water flowing one direction from lesson to lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#dff2ee" />
      <g>${renderAmbient(totalHeight)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#6fb8a6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderPools(positions)}</g>
    </svg>
  `;
}

export const tidalCascadeTheme = {
  trailBand: BAND,
  mapBg: "#dff2ee",
  hintColor: "rgba(15, 45, 40, 0.75)",
  renderScene,
};
