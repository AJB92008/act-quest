// Number Match's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a plain all-mountain
// valley, same template as Match Makers/Clear Antecedent: two continuous
// jagged rock walls flank the trail the whole way down, with a mountain
// ridge silhouette cresting each wall at intervals. No water and no
// counting device (an earlier version used sea stacks counted in
// deliberate groups of one/two/three; dropped along with the coastline
// itself so this hillside skill reads as an ordinary inland valley, like
// its non-coastal neighbors).
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      48 * Math.sin(i * 0.4 + phase) +
      30 * Math.sin(i * 1.05 + phase * 1.6) +
      19 * Math.sin(i * 2.3 + phase * 0.7) +
      11 * Math.sin(i * 5.1 + phase * 2.1);
    return { y, depth: clamp(60 + wobble, 14, 92) };
  });
}

// The wall's outer edge (away from the trail, off past the frame) is a
// flat color running the full height of the canvas — a fade to
// transparent right at that edge lets the rock dissolve into the ground
// before it ever reaches the frame boundary, instead of getting clipped
// there. The jagged inner (trail-facing) edge is untouched.
function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="seaStacksLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#9e9280" stop-opacity="0" />
        <stop offset="100%" stop-color="#9e9280" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="seaStacksRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#9e9280" stop-opacity="0" />
        <stop offset="100%" stop-color="#9e9280" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#seaStacksLeftFade)" : "url(#seaStacksRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
}

// A little mountain ridge silhouette cresting the wall, recurring down
// its whole length — coastal-cliff-style ridge detail, minus the coast.
function renderRidgeCluster(cx, baseY) {
  const peaks = 3;
  const step = 60;
  const pts = [];
  for (let i = 0; i < peaks; i++) {
    const x = cx - step + i * step;
    const h = 58 + (i % 2) * 26;
    pts.push({ x, y: baseY - h });
  }
  const line = `M${cx - step - 20},${baseY} L${pts[0].x},${pts[0].y} L${(pts[0].x + pts[1].x) / 2},${baseY - 22} L${pts[1].x},${pts[1].y} L${(pts[1].x + pts[2].x) / 2},${baseY - 18} L${pts[2].x},${pts[2].y} L${cx + step + 20},${baseY}`;
  const cap = pts
    .map((p) => `<path d="M${p.x - 10},${p.y + 14} L${p.x},${p.y} L${p.x + 10},${p.y + 14} Z" fill="#eef2ea" opacity="0.8" />`)
    .join("");
  return `<path d="${line} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />${cap}`;
}

function computeRidges(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 400));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? "left" : "right",
  }));
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 200));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    const side = i % 2 === 0 ? 1 : -1;
    return { x: clamp(nearest.x + side * (55 + (i % 3) * 10), BAND.min + 15, BAND.max - 15), y, r: 9 + (i % 4) * 5 };
  });
}

function renderFoothillRock(x, y, r) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#8c8270" stroke="#6b6353" stroke-width="2" />`;
}

const DECOR_EMOJI = ["🦅", "🐐"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="22" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.3);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const ridges = computeRidges(totalHeight)
    .map((r) => renderRidgeCluster(r.side === "left" ? 90 : COL_W - 90, r.y))
    .join("");
  const scree = computeScree(positions, totalHeight)
    .map((r) => renderFoothillRock(r.x, r.y, r.r))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a mountain valley between two jagged rock walls topped with ridge silhouettes, connecting every Number Match lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#9e9280" />
      <g>${scree}</g>
      ${walls}
      ${ridges}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const seaStacksTheme = {
  trailBand: BAND,
  mapBg: "#9e9280",
  hintColor: "rgba(35, 30, 22, 0.78)",
  renderScene,
};
