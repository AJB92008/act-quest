// Dash Dash's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a windswept, dusty prairie
// where the trail itself carries the pun: long chunky dashes ("—  —")
// instead of every other theme's fine dotted line, plus motion-streak
// marks in the grass suggesting speed. No river, unlike plains.js. Kept
// deliberately flat/open (no hills or landmark) so the wind has room to
// run — the variety instead comes from a denser, more varied cast of
// prairie wildlife and ambient grass texture scattered across the whole
// scene, not just clustered at trail stops.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

// The pun: two long dashes repeating down the whole trail, not a dotted
// line — literally "dash dash."
function renderDashTrail(positions) {
  return `<path d="${renderTrailPath(positions)}" stroke="#8a6a44" stroke-width="6" stroke-linecap="round" stroke-dasharray="34 22" fill="none" opacity="0.85" />`;
}

// Short parallel motion-streaks scattered through the grass — the
// windswept feel that gives "dash" its speed.
function renderStreaks(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 150));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 71) % (BAND.max - BAND.min - 60)), BAND.min + 10, BAND.max - 40);
    const len = 20 + (i % 3) * 8;
    return `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="#e3d9a8" stroke-width="3" stroke-linecap="round" opacity="0.55" />`;
  }).join("");
}

// A little three-blade tuft, cheaper than an emoji and dense enough to
// scatter freely as background texture without cluttering the scene.
function renderGrassTuft(x, y, scale) {
  const h = 14 * scale;
  return `
    <path d="M${x - 5 * scale},${y} Q${x - 6 * scale},${y - h} ${x - 2 * scale},${y - h * 1.1}" stroke="#a8975f" stroke-width="${2 * scale}" fill="none" opacity="0.6" stroke-linecap="round" />
    <path d="M${x},${y} Q${x},${y - h * 1.2} ${x + 1 * scale},${y - h * 1.3}" stroke="#c9b877" stroke-width="${2 * scale}" fill="none" opacity="0.6" stroke-linecap="round" />
    <path d="M${x + 5 * scale},${y} Q${x + 7 * scale},${y - h} ${x + 3 * scale},${y - h * 1.1}" stroke="#a8975f" stroke-width="${2 * scale}" fill="none" opacity="0.6" stroke-linecap="round" />
  `;
}

// Scattered independently of the trail (a deterministic pseudo-random
// spread via sine hashing) so the whole width of the prairie has texture,
// not just the strip the lessons happen to wind through.
function renderGrassField(totalHeight) {
  const count = Math.max(30, Math.round(totalHeight / 45));
  return Array.from({ length: count }, (_, i) => {
    const hx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = (Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    const x = clamp(Math.abs(hx) * COL_W, 15, COL_W - 15);
    const y = Math.abs(hy) * totalHeight;
    const scale = 0.7 + (i % 3) * 0.25;
    return renderGrassTuft(x, y, scale);
  }).join("");
}

const DECOR_EMOJI = ["🌾", "🐇", "🍂", "🦋", "🐿️", "🌻", "🦗"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 62, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="26" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

// A couple of hawks riding the wind overhead — the one bit of decoration
// not tethered to a trail stop, drifting freely across the open sky.
function renderHawks(totalHeight) {
  return [0.22, 0.68].map((f, i) => {
    const y = f * totalHeight;
    const x = i % 2 === 0 ? BAND.min + 90 : BAND.max - 90;
    return `<text x="${x}" y="${y}" font-size="22" text-anchor="middle" opacity="0.85">🦅</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a windswept prairie full of grass and wildlife, crossed by a long-dashed trail connecting every Dash Dash lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#d8e3a0" />
      <g>${renderGrassField(totalHeight)}</g>
      <g>${renderStreaks(totalHeight)}</g>
      ${renderHawks(totalHeight)}
      ${bossClearing}
      ${renderDashTrail(positions)}
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const windsweptTheme = {
  trailBand: BAND,
  mapBg: "#d8e3a0",
  hintColor: "rgba(35, 30, 5, 0.75)",
  renderScene,
};
