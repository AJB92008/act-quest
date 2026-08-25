// Apostrophe Ally's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — open plains, but
// everything comes in pairs: twin ponds, twin hills, paired flowers at
// every stop — a visual pun on the skill itself ("Ally": an apostrophe
// always has a partner, the word it belongs to). No river, unlike
// plains.js — the water here is two small round ponds instead of one
// long winding one.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

function computeTwinHills(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(2, Math.round(totalHeight / 700));
  const fractions = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
  return fractions.flatMap((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const baseX = mid + side * (BAND.max - BAND.min) * 0.3;
    const r = 62 + (i % 2) * 10;
    return [
      { x: clamp(baseX - r * 0.9, BAND.min + 20, BAND.max - 20), y: hy - 6, r },
      { x: clamp(baseX + r * 0.9, BAND.min + 20, BAND.max - 20), y: hy + 10, r: r * 0.9 },
    ];
  });
}

function renderHill({ x, y, r }) {
  return `
    <ellipse cx="${x}" cy="${y + r * 0.6}" rx="${r * 0.85}" ry="${r * 0.26}" fill="rgba(20,45,30,0.14)" />
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#8fbf6a" />
    <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.1}" rx="${r * 0.5}" ry="${r * 0.3}" fill="#a6d17e" opacity="0.75" />
  `;
}

function computeTwinPonds(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(1, Math.round(totalHeight / 900));
  return Array.from({ length: count }, (_, i) => (i + 0.5) / count).flatMap((f) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const baseX = mid + side * (BAND.max - BAND.min) * 0.32;
    return [
      { x: clamp(baseX - 46, BAND.min + 30, BAND.max - 30), y: hy },
      { x: clamp(baseX + 46, BAND.min + 30, BAND.max - 30), y: hy + 18 },
    ];
  });
}

function renderPond({ x, y }) {
  return `
    <ellipse cx="${x}" cy="${y}" rx="38" ry="26" fill="#8fb8bd" opacity="0.8" />
    <ellipse cx="${x - 8}" cy="${y - 6}" rx="16" ry="9" fill="#c3dde0" opacity="0.5" />
  `;
}

const PAIR_EMOJI = ["🌷", "🌻", "🦋"];

// Every decorated stop gets the *same* emoji placed twice, close
// together — pairs, not a single flourish, at nearly every stop.
function renderPairedDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const cx = clamp(p.x + side * 58, BAND.min + 20, BAND.max - 20);
      const emoji = PAIR_EMOJI[i % PAIR_EMOJI.length];
      return `
        <text x="${cx - 9}" y="${p.y - 10}" font-size="22" text-anchor="middle">${emoji}</text>
        <text x="${cx + 9}" y="${p.y - 4}" font-size="22" text-anchor="middle">${emoji}</text>
      `;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const hills = computeTwinHills(positions, totalHeight).map(renderHill).join("");
  const ponds = computeTwinPonds(positions, totalHeight).map(renderPond).join("");
  const last = positions[positions.length - 1];
  // The primary clearing stays centered exactly on the boss marker
  // (same convention every other theme uses) — a smaller "twin echo"
  // ring peeking out from behind carries the pun instead of offsetting
  // the marker's own clearing away from where the marker actually sits.
  const bossClearing = `
    <circle cx="${last.x + 22}" cy="${last.y + 4}" r="40" fill="#efe4cf" stroke="#c9a668" stroke-width="3" opacity="0.55" />
    <circle cx="${last.x}" cy="${last.y}" r="58" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: open plains where everything comes in pairs, two small ponds and twin hills, and a trail connecting every Apostrophe Ally lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#d0dc9a" />
      <g>${hills}</g>
      <g>${ponds}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderPairedDecorations(positions)}</g>
    </svg>
  `;
}

export const twinPondsTheme = {
  trailBand: BAND,
  mapBg: "#d0dc9a",
  hintColor: "rgba(25, 40, 10, 0.75)",
  renderScene,
};
