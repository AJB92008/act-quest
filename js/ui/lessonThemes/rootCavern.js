// Root Cause's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — the one Ironroot scene that
// goes underground rather than over a valley: a mine cavern dug beneath
// Numeria Peaks' own Algebra zone, its walls threaded with the peaks'
// own gnarled roots reaching down from above (a literal root, echoing
// both the skill's own math and "Ironroot" itself), braced at intervals
// by wooden mine-shaft supports, with the odd crystal catching what
// little light makes it down here — digging past the surface to find
// what's actually at the root of things.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const WALL_BASE = "#6b4a35";
const WALL_STROKE = "#2a1c10";
const ROOT_COLOR = "#c17a45";
const CRYSTAL_COLOR = "#9fd8e0";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      34 * Math.sin(i * 0.42 + phase) +
      20 * Math.sin(i * 1.1 + phase * 1.6) +
      13 * Math.sin(i * 2.4 + phase * 0.6) +
      8 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(64 + wobble, 20, 96) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="rootCavernLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="rootCavernRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#rootCavernLeftFade)" : "url(#rootCavernRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.97" />`;
}

// A gnarled root reaching out from the wall's own inner edge, forking
// into two smaller branches partway out — the same stem-then-fork shape
// every time, just mirrored for whichever wall it's growing from.
function renderRoot(x, y, dir, scale) {
  const s = scale;
  const midX = x + dir * 26 * s;
  const midY = y + 14 * s;
  const endX = x + dir * 50 * s;
  const endY = y + 4 * s;
  const b1x = midX + dir * 20 * s;
  const b1y = midY + 22 * s;
  const b2x = midX + dir * 16 * s;
  const b2y = midY - 20 * s;
  return `
    <path d="M${x.toFixed(1)},${y.toFixed(1)} Q${midX.toFixed(1)},${midY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}" stroke="${ROOT_COLOR}" stroke-width="${(4.2 * s).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.85" />
    <path d="M${midX.toFixed(1)},${midY.toFixed(1)} Q${(midX + dir * 8 * s).toFixed(1)},${(midY + 10 * s).toFixed(1)} ${b1x.toFixed(1)},${b1y.toFixed(1)}" stroke="${ROOT_COLOR}" stroke-width="${(2.3 * s).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.8" />
    <path d="M${midX.toFixed(1)},${midY.toFixed(1)} Q${(midX + dir * 8 * s).toFixed(1)},${(midY - 10 * s).toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}" stroke="${ROOT_COLOR}" stroke-width="${(2.3 * s).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.8" />
  `;
}

function computeRootSpots(edge, totalHeight) {
  const count = Math.max(6, Math.round(totalHeight / 260));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    return edge.reduce((best, e) => (Math.abs(e.y - y) < Math.abs(best.y - y) ? e : best));
  });
}

function renderRoots(leftEdge, rightEdge, totalHeight) {
  const left = computeRootSpots(leftEdge, totalHeight)
    .map((e, i) => renderRoot(e.depth, e.y, 1, 0.85 + (i % 3) * 0.12))
    .join("");
  const right = computeRootSpots(rightEdge, totalHeight)
    .map((e, i) => renderRoot(COL_W - e.depth, e.y, -1, 0.85 + (i % 3) * 0.12))
    .join("");
  return left + right;
}

// A wooden mine-shaft frame spanning wall to wall, at whatever depth
// each wall's own edge happens to sit at that height — always lands
// flush against both walls instead of a fixed width that might not fit.
function renderSupportBeam(y, leftEdge, rightEdge) {
  const l = nearestPosition(leftEdge.map((e) => ({ x: e.depth, y: e.y })), y);
  const r = nearestPosition(rightEdge.map((e) => ({ x: COL_W - e.depth, y: e.y })), y);
  return `
    <line x1="${(l.x - 6).toFixed(1)}" y1="${y}" x2="${(r.x + 6).toFixed(1)}" y2="${y}" stroke="#4a3323" stroke-width="11" stroke-linecap="round" />
    <line x1="${l.x.toFixed(1)}" y1="${y}" x2="${(l.x + 20).toFixed(1)}" y2="${y + 54}" stroke="#4a3323" stroke-width="9" stroke-linecap="round" />
    <line x1="${r.x.toFixed(1)}" y1="${y}" x2="${(r.x - 20).toFixed(1)}" y2="${y + 54}" stroke="#4a3323" stroke-width="9" stroke-linecap="round" />
  `;
}

function computeBeams(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 620));
  return Array.from({ length: count }, (_, i) => ((i + 0.6) / count) * totalHeight);
}

function renderCrystal(x, y, scale) {
  const s = scale;
  return `
    <path d="M${x.toFixed(1)},${(y - 14 * s).toFixed(1)} L${(x + 8 * s).toFixed(1)},${(y - 2 * s).toFixed(1)} L${x.toFixed(1)},${(y + 10 * s).toFixed(1)} L${(x - 8 * s).toFixed(1)},${(y - 2 * s).toFixed(1)} Z" fill="${CRYSTAL_COLOR}" stroke="#3f6c74" stroke-width="1.5" opacity="0.92" />
    <circle cx="${x.toFixed(1)}" cy="${(y - 2 * s).toFixed(1)}" r="${(18 * s).toFixed(1)}" fill="${CRYSTAL_COLOR}" opacity="0.14" />
  `;
}

function renderCrystals(positions) {
  return positions
    .filter((_, i) => i % 4 === 2)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 62, BAND.min + 15, BAND.max - 15);
      return renderCrystal(dx, p.y - 30, 1);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const roots = renderRoots(leftEdge, rightEdge, totalHeight);
  const beams = computeBeams(totalHeight)
    .map((y) => renderSupportBeam(y, leftEdge, rightEdge))
    .join("");
  const crystals = renderCrystals(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot mine cavern, its walls threaded with the peaks' own roots and braced by wooden shaft supports, connecting every Root Cause lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      ${walls}
      ${roots}
      ${beams}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${crystals}</g>
    </svg>
  `;
}

export const rootCavernTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(255, 245, 230, 0.85)",
  renderScene,
};
