// Angle & Arc's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, where a real stone circle and a real straight line
// meet at every stop: the line is a genuine secant through the circle
// (drawn from two actual points chosen on its own circumference, not
// eyeballed to look close), so where it crosses is exact — the line
// and the arc, together, every time.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#83a0ac";
const WALL_STROKE = "#3f4a56";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      42 * Math.sin(i * 0.42 + phase) +
      26 * Math.sin(i * 1.1 + phase * 1.6) +
      17 * Math.sin(i * 2.4 + phase * 0.6) +
      10 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(56 + wobble, 14, 88) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="angleArcLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="angleArcRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#angleArcLeftFade)" : "url(#angleArcRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

// A circle with a genuine secant through it: p1/p2 are picked as actual
// points on the circle's own circumference (not estimated), so the two
// intersection markers land exactly where the line and the circle meet.
function renderAngleArcMotif(cx, cy, r, theta1, theta2) {
  const p1 = { x: cx + Math.cos(theta1) * r, y: cy + Math.sin(theta1) * r };
  const p2 = { x: cx + Math.cos(theta2) * r, y: cy + Math.sin(theta2) * r };
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ext = 26;
  const ex1 = { x: p1.x - (dx / len) * ext, y: p1.y - (dy / len) * ext };
  const ex2 = { x: p2.x + (dx / len) * ext, y: p2.y + (dy / len) * ext };
  return `
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#c9d4dc" stroke-width="5" opacity="0.92" />
    <line x1="${ex1.x.toFixed(1)}" y1="${ex1.y.toFixed(1)}" x2="${ex2.x.toFixed(1)}" y2="${ex2.y.toFixed(1)}" stroke="#c9a668" stroke-width="3.5" opacity="0.9" />
    <circle cx="${p1.x.toFixed(1)}" cy="${p1.y.toFixed(1)}" r="5" fill="#efe4cf" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="5" fill="#efe4cf" stroke="${WALL_STROKE}" stroke-width="1.5" />
  `;
}

function computeMotifs(positions, totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 560));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const side = i % 2 === 0 ? 1 : -1;
    const nearest = nearestPosition(positions, y);
    const cx = clamp(nearest.x + side * 92, BAND.min + 55, BAND.max - 55);
    return { cx, cy: nearest.y, r: 44 + (i % 3) * 8, theta1: 0.7 + i * 0.6, theta2: 3.1 + i * 0.4 };
  });
}

function renderMotifs(positions, totalHeight) {
  return computeMotifs(positions, totalHeight)
    .map(({ cx, cy, r, theta1, theta2 }) => renderAngleArcMotif(cx, cy, r, theta1, theta2))
    .join("");
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 230));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(positions, totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#95a8b8" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.7" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const scree = renderScree(positions, totalHeight);
  const motifs = renderMotifs(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, where a real stone circle and a genuine secant line cross at every stop, connecting every Angle & Arc lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${motifs}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const angleArcTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(16, 24, 30, 0.78)",
  renderScene,
};
