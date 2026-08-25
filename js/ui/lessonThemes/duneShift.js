// Tone Tuner's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a dune desert whose light
// itself shifts the whole way down: warm sunrise gold near the top,
// cooling through midday and into a dusky purple-blue by the boss's own
// clearing. Every dune is tinted to match wherever it sits in that
// gradient, not just the sky — a visual pun on the skill itself, the
// same desert consistently "retuned" from one mood to the next rather
// than changing at random. A simple tuning dial recurs as the one
// built landmark, always pointing at whichever mood the ground has
// shifted to right there.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

// The mood ramps warm -> neutral -> cool once down the whole scene
// (not cyclically), so it reads as one deliberate shift, not noise.
function moodColor(t, { warm, mid, cool }) {
  if (t < 0.5) return lerpColor(warm, mid, t / 0.5);
  return lerpColor(mid, cool, (t - 0.5) / 0.5);
}

function lerpColor(a, b, f) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * f);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * f);
  const bch = Math.round(pa[2] + (pb[2] - pa[2]) * f);
  return `rgb(${r},${g},${bch})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const GROUND_STOPS = { warm: "#e8c888", mid: "#d8b0a0", cool: "#a08cb0" };
const DUNE_STOPS = { warm: "#d8a860", mid: "#c09080", cool: "#8070a0" };

function renderGroundGradientDefs() {
  return `
    <defs>
      <linearGradient id="duneShiftGround" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GROUND_STOPS.warm}" />
        <stop offset="50%" stop-color="${GROUND_STOPS.mid}" />
        <stop offset="100%" stop-color="${GROUND_STOPS.cool}" />
      </linearGradient>
    </defs>
  `;
}

// A rolling dune silhouette, tinted to match its own position in the
// mood gradient.
function renderDune(cy, totalHeight) {
  const t = cy / totalHeight;
  const color = moodColor(t, DUNE_STOPS);
  const h = 70;
  return `
    <path d="M-20,${cy + h} Q${COL_W * 0.3},${cy - h} ${COL_W * 0.55},${cy + h * 0.3} Q${COL_W * 0.8},${cy - h * 0.6} ${COL_W + 20},${cy + h}"
      fill="${color}" opacity="0.55" />
  `;
}

function computeDunes(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 480));
  return Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * totalHeight);
}

// A simple built tuning dial — a post with a gauge face and a needle,
// always sitting right at the local mood color.
function renderTuningDial(x, y, totalHeight) {
  const t = y / totalHeight;
  const needleColor = moodColor(t, DUNE_STOPS);
  const angle = -60 + t * 120;
  const rad = (angle * Math.PI) / 180;
  const nx = x + Math.sin(rad) * 22;
  const ny = y - 28 - Math.cos(rad) * 22;
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 28}" stroke="#6b5233" stroke-width="4" />
    <circle cx="${x}" cy="${y - 28}" r="20" fill="#efe4cf" stroke="#8a6a44" stroke-width="3" />
    <line x1="${x}" y1="${y - 28}" x2="${nx}" y2="${ny}" stroke="${needleColor}" stroke-width="3" stroke-linecap="round" />
    <circle cx="${x}" cy="${y - 28}" r="3" fill="#6b5233" />
  `;
}

function computeDials(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(2, Math.round(totalHeight / 700));
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    return { x: clamp(nearest.x + side * 60, BAND.min + 15, BAND.max - 15), y: hy };
  });
}

const DECOR_EMOJI = ["🦂", "🌵", "🦎"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="22" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const dunes = computeDunes(totalHeight)
    .map((y) => renderDune(y, totalHeight))
    .join("");
  const dials = computeDials(positions, totalHeight)
    .map((d) => renderTuningDial(d.x, d.y, totalHeight))
    .join("");
  const last = positions[positions.length - 1];
  const bossMoodColor = moodColor(last.y / totalHeight, GROUND_STOPS);
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="${bossMoodColor}" opacity="0.6" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a dune desert whose light shifts from warm sunrise gold to cool dusk purple down its length, with a tuning dial recurring along the trail, connecting every Tone Tuner lesson up to ${bossName}'s own clearing">
      ${renderGroundGradientDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#duneShiftGround)" />
      <g>${dunes}</g>
      ${dials}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#6b5233" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const duneShiftTheme = {
  trailBand: BAND,
  mapBg: "#d8b0a0",
  hintColor: "rgba(45, 30, 20, 0.78)",
  renderScene,
};
