// Curve Ball's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — an Ironroot valley (rust-
// brown rock, matching Numeria Peaks' own Algebra zone) where two actual
// parabolic ridgelines sweep down the walls and cross each other, again
// and again. Each ridge is a literal quadratic curve (x as a function of
// height, not just an eyeballed arc), so where the two genuinely
// intersect is computed, not guessed — and it always comes out to
// exactly two crossings per pair, the same "up to two solutions" a real
// quadratic system has. A little boulder marks each one.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 110, max: COL_W - 110 };
const WALL_BASE = "#b08464";
const WALL_STROKE = "#4a3323";
const CURVE_A = "#6b4530";
const CURVE_B = "#8f6248";
const BOULDER_FILL = "#c9a668";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble = 22 * Math.sin(i * 0.4 + phase) + 12 * Math.sin(i * 1.05 + phase * 1.5) + 7 * Math.sin(i * 2.3 + phase * 0.7);
    return { y, depth: clamp(26 + wobble, 8, 46) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="archCrossingLeftFade" x1="0" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="archCrossingRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 50}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -30 : COL_W + 30;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#archCrossingLeftFade)" : "url(#archCrossingRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.9" />`;
}

const CYCLE_H = 360;
function computeCycles(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / CYCLE_H));
  return Array.from({ length: count }, (_, i) => {
    const y0 = (i / count) * totalHeight + 20;
    const y1 = ((i + 1) / count) * totalHeight - 20;
    return { y0, y1 };
  });
}

// x(u) = x0 + range*4*u*(1-u): a real quadratic in u, bulging from x0
// (at u=0 and u=1) out to the opposite wall at u=0.5 — not eyeballed,
// an actual parabola, so the SVG quadratic Bezier through its own
// start/mid/end point traces it exactly (a quadratic Bezier IS a
// parabola in x already).
function bezierControl(x0, y0, xMid, yMid, x1, y1) {
  return { cx: 2 * xMid - 0.5 * (x0 + x1), cy: 2 * yMid - 0.5 * (y0 + y1) };
}

function renderCurve(y0, y1, fromRight, color) {
  const x0 = fromRight ? BAND.max : BAND.min;
  const xMid = fromRight ? BAND.min : BAND.max;
  const yMid = (y0 + y1) / 2;
  const { cx, cy } = bezierControl(x0, y0, xMid, yMid, x0, y1);
  return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)}" stroke="${color}" stroke-width="11" fill="none" stroke-linecap="round" opacity="0.88" />`;
}

// u(1-u) = 1/8 is where the two mirrored parabolas above genuinely
// intersect — solved once, algebraically, not sampled: u = (1 ± √0.5)/2.
const CROSS_U = [(1 - Math.SQRT1_2) / 2, (1 + Math.SQRT1_2) / 2];

function renderBoulder(x, y, r) {
  return `
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.75).toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.3).toFixed(1)}" fill="rgba(40,25,15,0.25)" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${BOULDER_FILL}" stroke="#7a5c2e" stroke-width="2" />
    <path d="M${(x - r * 0.5).toFixed(1)},${y.toFixed(1)} A${(r * 0.5).toFixed(1)},${(r * 0.5).toFixed(1)} 0 0 1 ${(x + r * 0.5).toFixed(1)},${y.toFixed(1)}" stroke="#7a5c2e" stroke-width="1.5" fill="none" opacity="0.6" />
    <ellipse cx="${(x - r * 0.32).toFixed(1)}" cy="${(y - r * 0.32).toFixed(1)}" rx="${(r * 0.28).toFixed(1)}" ry="${(r * 0.18).toFixed(1)}" fill="#f0dca0" opacity="0.7" />
  `;
}

function renderCycle(cycle) {
  const { y0, y1 } = cycle;
  const h = y1 - y0;
  const curveA = renderCurve(y0, y1, false, CURVE_A);
  const curveB = renderCurve(y0, y1, true, CURVE_B);
  const bandMid = (BAND.min + BAND.max) / 2;
  const boulders = CROSS_U.map((u, i) => renderBoulder(bandMid, y0 + u * h, i === 0 ? 15 : 12)).join("");
  return curveA + curveB + boulders;
}

function computeScree(totalHeight) {
  const count = Math.max(8, Math.round(totalHeight / 240));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 6 + (i % 3) * 3,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (60 + r), BAND.min + 12, BAND.max - 12);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#8f6248" opacity="0.7" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.6);
  const rightEdge = computeWallEdge(totalHeight, 2.3);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const cycles = computeCycles(totalHeight).map(renderCycle).join("");
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot valley where two curving ridgelines sweep from wall to wall and cross each other twice per pass, each crossing marked with a boulder, connecting every Curve Ball lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${cycles}
      ${walls}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#efe4cf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const archCrossingTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(44, 26, 14, 0.8)",
  renderScene,
};
