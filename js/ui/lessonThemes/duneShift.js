// Tone Tuner's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a dune desert meeting the
// sea along one edge (Tone Tuner sits in Tidewater Dock, so it finally
// gets the water its own zone name promises), whose light itself shifts
// the whole way down: warm sunrise gold near the top, cooling through
// midday and into a dusky purple-blue by the boss's own clearing. Every
// dune AND the water itself are tinted to match wherever they sit in
// that gradient, not just the sky — a visual pun on the skill itself,
// the same coastline consistently "retuned" from one mood to the next
// rather than changing at random. A simple tuning dial recurs as the
// one built landmark, always pointing at whichever mood the ground has
// shifted to right there.
import { COL_W, clamp, jaggedBandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const WATER_BAND = { min: -40, max: 205 };
const BAND = { min: 220, max: COL_W - 60 };

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
const WATER_STOPS = { warm: "#4a8a94", mid: "#5a6e94", cool: "#3a3a70" };

function renderGroundGradientDefs() {
  return `
    <defs>
      <linearGradient id="duneShiftGround" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GROUND_STOPS.warm}" />
        <stop offset="50%" stop-color="${GROUND_STOPS.mid}" />
        <stop offset="100%" stop-color="${GROUND_STOPS.cool}" />
      </linearGradient>
      <linearGradient id="duneShiftWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${WATER_STOPS.warm}" />
        <stop offset="50%" stop-color="${WATER_STOPS.mid}" />
        <stop offset="100%" stop-color="${WATER_STOPS.cool}" />
      </linearGradient>
      <linearGradient id="duneShiftEdgeFade" x1="0" y1="0" x2="70" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${GROUND_STOPS.mid}" stop-opacity="1" />
        <stop offset="100%" stop-color="${GROUND_STOPS.mid}" stop-opacity="0" />
      </linearGradient>
    </defs>
  `;
}

// Same coastline technique used by the isle's other coastal skills: a
// wavy shore edge, a vignette fading the water's outer edge into the
// ground before the frame boundary clips it. The water's own fill is a
// vertical mood gradient instead of a flat depth gradient, so it shifts
// warm-to-cool right alongside the sand.
function computeShore(totalHeight) {
  const steps = Math.max(36, Math.round(totalHeight / 48));
  const mid = 95;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.35 + 0.65 * edgeFalloff;
    const wobble =
      54 * Math.sin(i * 0.31 + 1.1) +
      32 * Math.sin(i * 0.83 + 0.4) +
      19 * Math.sin(i * 1.9 + 2.3) +
      10 * Math.sin(i * 4.2 + 0.8);
    const edge = mid + envelope * wobble;
    return { y, left: WATER_BAND.min, right: clamp(edge, 15, WATER_BAND.max) };
  });
}

function renderWaterEdgeFade(totalHeight) {
  return `<rect x="0" y="0" width="70" height="${totalHeight}" fill="url(#duneShiftEdgeFade)" />`;
}

function renderWater(shore) {
  const band = jaggedBandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#duneShiftWater)" opacity="0.9" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round" />
  `;
}

// A rolling dune silhouette, tinted to match its own position in the
// mood gradient, running from the shoreline inland to the frame's own
// right edge (never over the water).
function renderDune(cy, totalHeight, leftBound) {
  const t = cy / totalHeight;
  const color = moodColor(t, DUNE_STOPS);
  const h = 70;
  const span = COL_W + 20 - leftBound;
  const x1 = leftBound + span * 0.32;
  const x2 = leftBound + span * 0.6;
  const x3 = leftBound + span * 0.85;
  const x4 = leftBound + span;
  return `
    <path d="M${leftBound},${cy + h} Q${x1},${cy - h} ${x2},${cy + h * 0.3} Q${x3},${cy - h * 0.6} ${x4},${cy + h}"
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
  const shore = computeShore(totalHeight);
  const water = renderWater(shore);
  const dunes = computeDunes(totalHeight)
    .map((y) => renderDune(y, totalHeight, WATER_BAND.max))
    .join("");
  const dials = computeDials(positions, totalHeight)
    .map((d) => renderTuningDial(d.x, d.y, totalHeight))
    .join("");
  const last = positions[positions.length - 1];
  const bossMoodColor = moodColor(last.y / totalHeight, GROUND_STOPS);
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="${bossMoodColor}" opacity="0.6" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a dune desert meeting the sea along one edge, its light and the water itself both shifting from warm sunrise gold to cool dusk purple down its length, with a tuning dial recurring along the trail, connecting every Tone Tuner lesson up to ${bossName}'s own clearing">
      ${renderGroundGradientDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#duneShiftGround)" />
      <g>${dunes}</g>
      ${water}
      ${renderWaterEdgeFade(totalHeight)}
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
