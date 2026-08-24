// Match Makers' own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — an all-mountain valley (no
// plains at all, unlike Who's There?): two continuous jagged rock walls
// flank the trail the whole way down, and at intervals a tall peak
// spike rises out of EACH wall at the exact same height, flying the
// exact same colored pennant as its partner across the valley — a
// visual pun on the skill itself, since every peak in this valley has
// been matched up with its one correct partner, just like a pronoun and
// its antecedent.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const PAIR_COLORS = ["#b3453f", "#c9a668", "#4f7a8c", "#7a9c5a"];

// A jagged wall edge — how far the rock intrudes from its own edge of
// the canvas at each height, sampled and connected with straight
// segments for a rocky (not smoothly wavy) silhouette. Wide swings plus
// a sharp, chaotic high-frequency term so it reads as broken rock, not
// a gentle wave with a bit of noise on it.
function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      46 * Math.sin(i * 0.42 + phase) +
      30 * Math.sin(i * 1.1 + phase * 1.6) +
      20 * Math.sin(i * 2.4 + phase * 0.6) +
      12 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(62 + wobble, 14, 95) };
  });
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  return `<path d="${fillPath}" fill="#8c8270" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
}

function edgeDepthAt(edge, y) {
  let nearest = edge[0];
  let best = Infinity;
  for (const e of edge) {
    const d = Math.abs(e.y - y);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest.depth;
}

function renderPeakSpike(cx, baseY, h, color) {
  const w = 46;
  return `
    <path d="M${cx - w},${baseY} L${cx},${baseY - h} L${cx + w},${baseY} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />
    <path d="M${cx - w * 0.4},${baseY - h * 0.55} L${cx},${baseY - h} L${cx + w * 0.4},${baseY - h * 0.55} L${cx + w * 0.22},${baseY - h * 0.42} L${cx},${baseY - h * 0.62} L${cx - w * 0.22},${baseY - h * 0.42} Z" fill="#eef2ea" opacity="0.88" />
    <line x1="${cx}" y1="${baseY - h}" x2="${cx}" y2="${baseY - h - 16}" stroke="#4a3d2e" stroke-width="2" />
    <path d="M${cx},${baseY - h - 16} L${cx + 16},${baseY - h - 11} L${cx},${baseY - h - 6} Z" fill="${color}" />
  `;
}

// The matching pairs — same height, same pennant color, one on each
// wall at the exact same point down the valley.
function renderPeakPairs(leftEdge, rightEdge, totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 340));
  const out = [];
  for (let i = 0; i < count; i++) {
    const y = ((i + 0.5) / count) * totalHeight;
    const h = 105 + (i % 3) * 22;
    const color = PAIR_COLORS[i % PAIR_COLORS.length];
    out.push(renderPeakSpike(edgeDepthAt(leftEdge, y), y + h * 0.35, h, color));
    out.push(renderPeakSpike(COL_W - edgeDepthAt(rightEdge, y), y + h * 0.35, h, color));
  }
  return out.join("");
}

function computeScree(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 200));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 8 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (60 + r), BAND.min + 20, BAND.max - 20);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#8c8270" opacity="0.7" />`;
    })
    .join("");
}

const DECOR_EMOJI = ["🐐", "🦅"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 48, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="21" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const pairs = renderPeakPairs(leftEdge, rightEdge, totalHeight);
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a mountain valley between two jagged rock walls lined with matching pairs of pennant-topped peaks, connecting every Match Makers lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#9c9484" />
      <g>${scree}</g>
      ${walls}
      ${pairs}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const matchedPeaksTheme = {
  trailBand: BAND,
  mapBg: "#9c9484",
  hintColor: "rgba(40, 34, 24, 0.78)",
  renderScene,
};
