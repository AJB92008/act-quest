// Time Traveler's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — an all-mountain valley
// flanked by two continuous rock walls, each one built slice by slice
// from strata bands whose color shifts the whole way down: muted,
// weathered tones near the top (the trail's earliest lessons), warmer
// "present-day" tones through the middle, and vivid, almost unnaturally
// saturated bands near the boss's clearing at the bottom — a visual pun
// on verb tense, the same mountain literally showing its own past,
// present, and future as you travel down it.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };

const ANCIENT_BANDS = ["#8a8270", "#736b5a", "#5c564a"];
const PRESENT_BANDS = ["#9a8a5a", "#8a6a4a", "#6a4a3a"];
const FUTURE_BANDS = ["#8a4a5a", "#6a3a6a", "#3a2a5a"];

function bandsFor(t) {
  if (t < 0.33) return ANCIENT_BANDS;
  if (t < 0.66) return PRESENT_BANDS;
  return FUTURE_BANDS;
}

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(30, Math.round(totalHeight / 55));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble = 24 * Math.sin(i * 0.44 + phase) + 13 * Math.sin(i * 1.15 + phase * 1.5);
    return { y, depth: clamp(56 + wobble, 30, 88) };
  });
}

// Slice by slice down the whole wall, each one banded by the era its
// height falls into — the wall itself is the strata.
function renderStrataWall(edge, side, totalHeight) {
  const slices = [];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i];
    const b = edge[i + 1];
    const t = ((a.y + b.y) / 2) / totalHeight;
    const bands = bandsFor(t);
    const color = bands[i % bands.length];
    const ax = side === "left" ? a.depth : COL_W - a.depth;
    const bx = side === "left" ? b.depth : COL_W - b.depth;
    const outerX = side === "left" ? -40 : COL_W + 40;
    slices.push(`<path d="M${outerX},${a.y} L${ax},${a.y} L${bx},${b.y} L${outerX},${b.y} Z" fill="${color}" />`);
  }
  return slices.join("");
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

// A small progression of one-off accents — a fossil near the ancient
// top, a little sparkle near the vivid future bottom.
function renderTimeAccents(positions, totalHeight) {
  const early = positions[Math.floor(positions.length * 0.1)];
  const late = positions[Math.floor(positions.length * 0.92)];
  const sideEarly = early.x < COL_W / 2 ? 1 : -1;
  const sideLate = late.x < COL_W / 2 ? 1 : -1;
  return `
    <text x="${clamp(early.x - sideEarly * 55, BAND.min + 10, BAND.max - 10)}" y="${early.y - 10}" font-size="22" text-anchor="middle" opacity="0.85">🦴</text>
    <text x="${clamp(late.x - sideLate * 55, BAND.min + 10, BAND.max - 10)}" y="${late.y - 10}" font-size="22" text-anchor="middle" opacity="0.9">✨</text>
  `;
}

function computeScree(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 210));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b6353" opacity="0.6" />`;
    })
    .join("");
}

const DECOR_EMOJI = ["🐐", "🦅"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 48, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="20" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.6);
  const rightEdge = computeWallEdge(totalHeight, 2.2);
  const walls = renderStrataWall(leftEdge, "left", totalHeight) + renderStrataWall(rightEdge, "right", totalHeight);
  const wallOutlines = `
    <path d="${leftEdge.map((e, i) => `${i === 0 ? "M" : "L"}${e.depth},${e.y}`).join(" ")}" fill="none" stroke="#2c281f" stroke-width="1.5" opacity="0.3" />
    <path d="${rightEdge.map((e, i) => `${i === 0 ? "M" : "L"}${COL_W - e.depth},${e.y}`).join(" ")}" fill="none" stroke="#2c281f" stroke-width="1.5" opacity="0.3" />
  `;
  const scree = renderScree(positions, totalHeight);
  const accents = renderTimeAccents(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a mountain valley whose flanking rock strata visibly age from weathered to vivid down its length, connecting every Time Traveler lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#948a7a" />
      <g>${scree}</g>
      ${walls}
      ${wallOutlines}
      ${accents}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const strataPeaksTheme = {
  trailBand: BAND,
  mapBg: "#948a7a",
  hintColor: "rgba(250, 245, 235, 0.85)",
  renderScene,
};
