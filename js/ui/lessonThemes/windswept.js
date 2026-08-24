// Dash Dash's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a windswept, dusty prairie
// where the trail itself carries the pun: long chunky dashes ("—  —")
// instead of every other theme's fine dotted line, plus motion-streak
// marks in the grass suggesting speed. No river, unlike plains.js.
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

const DECOR_EMOJI = ["🌾", "🐇", "🍂"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 62, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="26" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a windswept prairie crossed by a long-dashed trail, connecting every Dash Dash lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#d8e3a0" />
      <g>${renderStreaks(totalHeight)}</g>
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
