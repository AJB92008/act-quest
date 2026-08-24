// Clear Antecedent's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a mountain valley
// under a crystal-clear sky (no mist, no haze, unlike Full Stop's fog),
// flanked by two continuous jagged rock walls for texture. Rising
// straight out of the trail itself, the exact same landmark peak
// recurs, identical in shape and color every single time, with a
// signpost at each nearby lesson pointing straight at it. No matter
// where you are in the scene, there's exactly one unmistakable peak to
// reference — a visual pun on the skill itself, where a pronoun always
// has exactly one clear thing it points back to.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 80, max: COL_W - 80 };
const LANDMARK_X = COL_W / 2;

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(30, Math.round(totalHeight / 60));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble = 22 * Math.sin(i * 0.46 + phase) + 12 * Math.sin(i * 1.2 + phase * 1.5);
    return { y, depth: clamp(46 + wobble, 24, 74) };
  });
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const snowTips = edge
    .filter((_, i) => i % 6 === 3)
    .map((e) => {
      const x = side === "left" ? e.depth : COL_W - e.depth;
      return `<path d="M${x - 10},${e.y + 8} L${x},${e.y - 6} L${x + 10},${e.y + 8} Z" fill="#eef2ea" opacity="0.75" />`;
    })
    .join("");
  return `<path d="${fillPath}" fill="#a89c82" stroke="#7a7260" stroke-width="2" opacity="0.95" />${snowTips}`;
}

// The one landmark peak — same shape, same color, every time it shows
// up, so it's always instantly recognizable.
function renderLandmarkPeak(baseY) {
  const cx = LANDMARK_X;
  const h = 150;
  const w = 90;
  return `
    <path d="M${cx - w},${baseY} L${cx},${baseY - h} L${cx + w},${baseY} Z" fill="#a89c82" stroke="#7a7260" stroke-width="3" />
    <path d="M${cx - w * 0.38},${baseY - h * 0.5} L${cx},${baseY - h} L${cx + w * 0.38},${baseY - h * 0.5} L${cx + w * 0.2},${baseY - h * 0.36} L${cx},${baseY - h * 0.58} L${cx - w * 0.2},${baseY - h * 0.36} Z" fill="#ffffff" opacity="0.92" />
  `;
}

function computeLandmarks(totalHeight) {
  const count = Math.max(2, Math.round(totalHeight / 650));
  return Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * totalHeight + 40);
}

// A small signpost, its arrow always pointing back toward the one
// landmark, planted at scattered points along the trail.
function renderSignpost(x, y, pointsRight) {
  const arrow = pointsRight
    ? `<path d="M${x + 4},${y - 26} L${x + 22},${y - 22} L${x + 4},${y - 18} Z" fill="#6b5a44" />`
    : `<path d="M${x - 4},${y - 26} L${x - 22},${y - 22} L${x - 4},${y - 18} Z" fill="#6b5a44" />`;
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 28}" stroke="#4a3d2e" stroke-width="3" />
    ${arrow}
  `;
}

function renderSignposts(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p) => {
      const pointsRight = p.x < LANDMARK_X;
      const side = pointsRight ? 1 : -1;
      const dx = clamp(p.x + side * 46, BAND.min + 10, BAND.max - 10);
      return renderSignpost(dx, p.y, pointsRight);
    })
    .join("");
}

const DECOR_EMOJI = ["🦅", "🐐"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 2)
    .map((p, i) => {
      const side = p.x < LANDMARK_X ? -1 : 1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 34}" font-size="21" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.3);
  const rightEdge = computeWallEdge(totalHeight, 2.6);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const landmarks = computeLandmarks(totalHeight).map(renderLandmarkPeak).join("");
  const signposts = renderSignposts(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f4f0e2" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a clear mountain valley between two rock walls, where the same landmark peak keeps reappearing dead ahead with signposts pointing back to it, connecting every Clear Antecedent lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#b4a98e" />
      ${walls}
      ${landmarks}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${signposts}</g>
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const clearPeakTheme = {
  trailBand: BAND,
  mapBg: "#b4a98e",
  hintColor: "rgba(40, 34, 22, 0.78)",
  renderScene,
};
