// Who's There?'s own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — mostly rocky mountain with
// only a small strip of plains at the very bottom (unlike Comma Sense's
// roughly even mountain/plains split, this one is heavily mountain-
// weighted). The signature device is a literal pass: the range isn't an
// unbroken ridge like Comma Sense's, it has one deliberate low gap (a
// saddle) with a little watchtower standing guard right in the notch —
// the mountain itself asking "who's there?" of anyone crossing through.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };
const SPLIT_FRACTION = 0.78;

// A jagged range with one peak pulled way down into a saddle — the pass
// the trail (and the watchtower) sit in.
function computeRange(splitY) {
  const peaks = 5;
  const passIndex = 2;
  const step = COL_W / peaks;
  const pts = [{ x: -20, y: splitY }];
  for (let i = 0; i < peaks; i++) {
    const peakX = step * i + step * 0.5;
    const isPass = i === passIndex;
    const peakY = isPass ? splitY - 55 : clamp(splitY - (130 + (i % 3) * 55), 25, splitY - 45);
    pts.push({ x: peakX, y: peakY });
    pts.push({ x: step * (i + 1), y: splitY - 25 - (i % 2) * 18 });
  }
  pts.push({ x: COL_W + 20, y: splitY });
  return { pts, passX: step * passIndex + step * 0.5, passY: splitY - 55 };
}

function renderRange(pts, splitY) {
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${COL_W + 20},${splitY} L-20,${splitY} Z`;
  const snowCaps = pts
    .filter((_, i) => i % 2 === 1)
    .map((p) => `<path d="M${p.x - 15},${p.y + 20} L${p.x},${p.y} L${p.x + 15},${p.y + 20} L${p.x + 7},${p.y + 15} L${p.x},${p.y + 22} L${p.x - 7},${p.y + 15} Z" fill="#eef2ea" opacity="0.85" />`)
    .join("");
  return `
    <path d="${fillPath}" fill="#8c8270" />
    <path d="${line}" fill="none" stroke="#6b6353" stroke-width="3" opacity="0.6" />
    ${snowCaps}
  `;
}

// A little sentry post right in the notch of the pass, challenging
// anyone crossing — the "who's there?" of the whole scene.
function renderWatchtower(x, y) {
  return `
    <rect x="${x - 12}" y="${y - 46}" width="24" height="46" fill="#6b5a44" />
    <path d="M${x - 16},${y - 46} L${x},${y - 66} L${x + 16},${y - 46} Z" fill="#4a3d2e" />
    <rect x="${x - 6}" y="${y - 34}" width="12" height="10" fill="#2c241a" opacity="0.7" />
    <line x1="${x + 12}" y1="${y - 66}" x2="${x + 12}" y2="${y - 80}" stroke="#4a3d2e" stroke-width="2" />
    <path d="M${x + 12},${y - 80} L${x + 30},${y - 74} L${x + 12},${y - 68} Z" fill="#b3453f" />
  `;
}

function computeFoothillRocks(splitY) {
  return [0.16, 0.4, 0.62, 0.88].map((f, i) => ({
    x: f * COL_W,
    y: splitY - 5 - (i % 2) * 9,
    r: 18 + (i % 3) * 6,
  }));
}

function renderFoothillRock({ x, y, r }) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#9c9280" stroke="#7a7260" stroke-width="2" />`;
}

const MOUNTAIN_EMOJI = ["🐐", "🦅"];
const PLAIN_EMOJI = ["🌼", "🦋"];

function renderDecorations(positions, splitY) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 15, BAND.max - 10);
      const emoji = p.y > splitY ? PLAIN_EMOJI[i % PLAIN_EMOJI.length] : MOUNTAIN_EMOJI[i % MOUNTAIN_EMOJI.length];
      return `<text x="${dx}" y="${p.y - 12}" font-size="23" text-anchor="middle">${emoji}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const splitY = totalHeight * SPLIT_FRACTION;
  const range = computeRange(splitY);
  const foothillRocks = computeFoothillRocks(splitY).map(renderFoothillRock).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a rocky mountain range with one watchtower-guarded pass, giving way to a small strip of plains, connecting every Who's There? lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${splitY + 40}" fill="#ab9f86" />
      <rect x="0" y="${splitY}" width="${COL_W}" height="${totalHeight - splitY}" fill="#c3dd8f" />
      ${renderRange(range.pts, splitY)}
      <g>${foothillRocks}</g>
      ${renderWatchtower(range.passX, range.passY)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions, splitY)}</g>
    </svg>
  `;
}

export const sentryPassTheme = {
  trailBand: BAND,
  mapBg: "#ab9f86",
  hintColor: "rgba(255, 252, 240, 0.85)",
  renderScene,
};
