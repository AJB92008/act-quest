// Angle Anchor's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, anchored at intervals by an actual geometric proof:
// a right triangle with a real square built on each of its three sides
// — the classic a²+b² = c² picture, not just a triangle icon, planted
// like a landmark rather than explained in text. Smaller angle-tick
// marks (an arc between two rays) scattered along the way keep the
// skill's own theme present between anchors.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#7d93a8";
const WALL_STROKE = "#3f4a56";
const SQUARE_SHADES = ["#95a8b8", "#647c92", "#c9d4dc"];

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
      <linearGradient id="pythagoreanAnchorLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="pythagoreanAnchorRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#pythagoreanAnchorLeftFade)" : "url(#pythagoreanAnchorRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

function polyPts(pts) {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

// The right-angle vertex sits at (cx, cy); one leg runs right, the
// other runs up. A real square (not a decorative box) is built outward
// on each of the three sides — the actual a²+b²=c² picture.
function renderPythagorean(cx, cy, scale) {
  const L1 = 42 * scale;
  const L2 = 56 * scale;
  const A = { x: cx, y: cy };
  const B = { x: cx + L1, y: cy };
  const C = { x: cx, y: cy - L2 };
  const sq1 = [A, B, { x: B.x, y: B.y + L1 }, { x: A.x, y: A.y + L1 }];
  const sq2 = [A, C, { x: C.x - L2, y: C.y }, { x: A.x - L2, y: A.y }];
  const dx = C.x - B.x;
  const dy = C.y - B.y;
  const len = Math.hypot(dx, dy);
  let nx = -dy / len;
  let ny = dx / len;
  const mid = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  if ((A.x - mid.x) * nx + (A.y - mid.y) * ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const D = { x: B.x + nx * len, y: B.y + ny * len };
  const E = { x: C.x + nx * len, y: C.y + ny * len };
  const sq3 = [B, C, E, D];
  return `
    <polygon points="${polyPts(sq1)}" fill="${SQUARE_SHADES[0]}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.85" />
    <polygon points="${polyPts(sq2)}" fill="${SQUARE_SHADES[1]}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.85" />
    <polygon points="${polyPts(sq3)}" fill="${SQUARE_SHADES[2]}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.92" />
    <polygon points="${polyPts([A, B, C])}" fill="#5a7186" stroke="${WALL_STROKE}" stroke-width="2" />
  `;
}

function computeAnchors(totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 560));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
  }));
}

function renderAnchors(positions, totalHeight) {
  return computeAnchors(totalHeight)
    .map(({ y, side }, i) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * 90, BAND.min + 60, BAND.max - 60);
      return renderPythagorean(x, y, 0.9 + (i % 3) * 0.1);
    })
    .join("");
}

// A small angle tick — two rays and the arc between them — scattered
// along the way, keeping "angle" present between the bigger proofs.
function renderAngleTick(x, y, rot) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})">
    <line x1="0" y1="0" x2="26" y2="0" stroke="${WALL_STROKE}" stroke-width="2" />
    <line x1="0" y1="0" x2="14" y2="-22" stroke="${WALL_STROKE}" stroke-width="2" />
    <path d="M14,0 A14,14 0 0 0 6,-12" stroke="#c9a668" stroke-width="2" fill="none" />
  </g>`;
}

function renderAngleTicks(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 46, BAND.min + 15, BAND.max - 15);
      return renderAngleTick(dx, p.y - 30, side > 0 ? 20 : -110);
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
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#95a8b8" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.75" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const scree = renderScree(positions, totalHeight);
  const anchors = renderAnchors(positions, totalHeight);
  const ticks = renderAngleTicks(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, anchored at intervals by a real square-on-each-side Pythagorean proof, connecting every Angle Anchor lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${anchors}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${ticks}</g>
    </svg>
  `;
}

export const pythagoreanAnchorTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(18, 26, 34, 0.78)",
  renderScene,
};
