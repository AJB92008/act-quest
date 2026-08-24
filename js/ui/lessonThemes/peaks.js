// Comma Sense's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — the one composite scene of
// the set: rocky mountains fill the upper portion, open plains fill the
// lower, and the trail crosses from one into the other partway down — a
// visual pun on the skill itself (a comma marks a brief pause between
// two different things, same as the trail's own pause crossing from
// dramatic peaks into calm flat ground).
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };
const SPLIT_FRACTION = 0.4;

// A single jagged silhouette spanning the whole width — one connected
// mountain range, not a scatter of separate peaks.
function computeRange(splitY) {
  const peaks = 5;
  const step = COL_W / peaks;
  const pts = [{ x: -20, y: splitY }];
  for (let i = 0; i < peaks; i++) {
    const peakX = step * i + step * 0.5;
    const peakY = clamp(splitY - (110 + (i % 3) * 55), 30, splitY - 40);
    pts.push({ x: peakX, y: peakY });
    pts.push({ x: step * (i + 1), y: splitY - 30 - (i % 2) * 20 });
  }
  pts.push({ x: COL_W + 20, y: splitY });
  return pts;
}

function renderRange(pts, splitY) {
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${COL_W + 20},${splitY} L-20,${splitY} Z`;
  const snowCaps = pts
    .filter((_, i) => i % 2 === 1)
    .map((p) => `<path d="M${p.x - 16},${p.y + 22} L${p.x},${p.y} L${p.x + 16},${p.y + 22} L${p.x + 8},${p.y + 16} L${p.x},${p.y + 24} L${p.x - 8},${p.y + 16} Z" fill="#eef2ea" opacity="0.85" />`)
    .join("");
  return `
    <path d="${fillPath}" fill="#8a8270" />
    <path d="${line}" fill="none" stroke="#6b6353" stroke-width="3" opacity="0.6" />
    ${snowCaps}
  `;
}

function computeFoothillRocks(splitY) {
  return [0.18, 0.42, 0.68, 0.86].map((f, i) => ({
    x: f * COL_W,
    y: splitY - 6 - (i % 2) * 10,
    r: 20 + (i % 3) * 6,
  }));
}

function renderFoothillRock({ x, y, r }) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#9c9280" stroke="#7a7260" stroke-width="2" />`;
}

const PLAIN_EMOJI = ["🌼", "🦋", "🌿"];

function renderPlainDecorations(positions, splitY) {
  return positions
    .filter((p, i) => p.y > splitY && i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="24" text-anchor="middle">${PLAIN_EMOJI[i % PLAIN_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const splitY = totalHeight * SPLIT_FRACTION;
  const rangePts = computeRange(splitY);
  const foothillRocks = computeFoothillRocks(splitY).map(renderFoothillRock).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: rocky mountains giving way to open plains, with a trail crossing from one into the other, connecting every Comma Sense lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${splitY + 40}" fill="#a89f88" />
      <rect x="0" y="${splitY}" width="${COL_W}" height="${totalHeight - splitY}" fill="#c3dd8f" />
      ${renderRange(rangePts, splitY)}
      <g>${foothillRocks}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderPlainDecorations(positions, splitY)}</g>
    </svg>
  `;
}

export const peaksTheme = {
  trailBand: BAND,
  mapBg: "#a89f88",
  hintColor: "rgba(255, 252, 240, 0.85)",
  renderScene,
};
