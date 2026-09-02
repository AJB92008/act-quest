// Shape Shifter's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, where the same landmark shape reappears at every
// stop but never twice in the same form: a square, then a pentagon,
// hexagon, heptagon, octagon, then back to a square again — literally
// shifting shape each time rather than a fixed polygon repeated.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#7690a6";
const WALL_STROKE = "#3f4a56";
const SHIFT_SHADES = ["#95a8b8", "#c9d4dc", "#647c92"];
const MIN_SIDES = 4;
const MAX_SIDES = 8;

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
      <linearGradient id="shapeShifterLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="shapeShifterRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#shapeShifterLeftFade)" : "url(#shapeShifterRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

// A regular N-gon, N read straight off `sides` rather than picked from
// a fixed shape list — the same shape family (a landmark polygon)
// genuinely changing its own vertex count each time it shows up.
function renderPolygon(cx, cy, r, sides, shade) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${shade}" stroke="${WALL_STROKE}" stroke-width="2.5" opacity="0.92" />`;
}

function computeLandmarks(positions, totalHeight) {
  const count = Math.max(5, Math.round(totalHeight / 460));
  const span = MAX_SIDES - MIN_SIDES + 1;
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    sides: MIN_SIDES + (i % span),
  }));
}

function renderLandmarks(positions, totalHeight) {
  return computeLandmarks(positions, totalHeight)
    .map(({ y, side, sides }, i) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * 82, BAND.min + 44, BAND.max - 44);
      return renderPolygon(x, y, 34 + (sides - MIN_SIDES) * 2, sides, SHIFT_SHADES[i % SHIFT_SHADES.length]);
    })
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
  const landmarks = renderLandmarks(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, where the same landmark shape reappears with a different number of sides every time, connecting every Shape Shifter lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${landmarks}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const shapeShifterTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(16, 24, 30, 0.78)",
  renderScene,
};
