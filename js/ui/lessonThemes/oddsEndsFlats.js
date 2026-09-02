// Odds & Ends' own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — open, flat gold-flecked
// ground (matching Numeria Peaks' own Goldtally Flats zone, deliberately
// low rather than the rock walls or forest the other three zones lean
// on), scattered with a genuinely varied assortment rather than one
// repeated prop: a die, a coin, a tally mark, a different one at every
// stop — "odds" (the dice and coins probability actually uses) and
// "ends" (a real mixed leftover assortment, not a matched set) both at
// once, the same varied-stop technique Algebra Toolkit uses.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };
const GROUND = "#dcc48f";
const CRACK_COLOR = "#8a6d1f";

function computeCracks(totalHeight) {
  const count = Math.max(14, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    return { x: clamp(hx * COL_W, 20, COL_W - 20), y: hy * totalHeight, rot: (i * 47) % 360 };
  });
}

function renderCrack(x, y, rot) {
  return `<path d="M0,0 L14,-3 M14,-3 L24,4 M14,-3 L10,-14" stroke="${CRACK_COLOR}" stroke-width="1.5" fill="none" opacity="0.4" transform="translate(${x},${y}) rotate(${rot})" />`;
}

const PIP_LAYOUTS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

function renderDie(x, y, s, pips) {
  const layout = PIP_LAYOUTS[pips] || PIP_LAYOUTS[1];
  const dots = layout
    .map(([dx, dy]) => `<circle cx="${(x + dx * s * 0.28).toFixed(1)}" cy="${(y + dy * s * 0.28).toFixed(1)}" r="${(s * 0.09).toFixed(1)}" fill="#453a1f" />`)
    .join("");
  return `
    <ellipse cx="${x.toFixed(1)}" cy="${(y + s * 0.58).toFixed(1)}" rx="${(s * 0.55).toFixed(1)}" ry="${(s * 0.16).toFixed(1)}" fill="rgba(60,45,20,0.18)" />
    <rect x="${(x - s * 0.5).toFixed(1)}" y="${(y - s * 0.5).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${(s * 0.14).toFixed(1)}" fill="#f0e6c4" stroke="#8a6d1f" stroke-width="1.5" />
    ${dots}
  `;
}

function renderCoin(x, y, r) {
  return `
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.3).toFixed(1)}" rx="${(r * 1.05).toFixed(1)}" ry="${(r * 0.3).toFixed(1)}" fill="rgba(60,45,20,0.16)" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#d4af37" stroke="#8a6d1f" stroke-width="1.5" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.68).toFixed(1)}" fill="none" stroke="#f0d97a" stroke-width="1.5" opacity="0.85" />
    <ellipse cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.28).toFixed(1)}" rx="${(r * 0.28).toFixed(1)}" ry="${(r * 0.16).toFixed(1)}" fill="#f0d97a" opacity="0.7" />
  `;
}

function renderTallyMark(x, baseY, h, count) {
  const lines = Array.from({ length: Math.min(4, count) }, (_, i) => `<line x1="${(x + i * (h * 0.14) - h * 0.21).toFixed(1)}" y1="${baseY.toFixed(1)}" x2="${(x + i * (h * 0.14) - h * 0.21).toFixed(1)}" y2="${(baseY - h).toFixed(1)}" stroke="#6b5233" stroke-width="3" stroke-linecap="round" />`).join("");
  const diag = count > 4 ? `<line x1="${(x - h * 0.26).toFixed(1)}" y1="${(baseY - h * 0.12).toFixed(1)}" x2="${(x + h * 0.26).toFixed(1)}" y2="${(baseY - h * 0.88).toFixed(1)}" stroke="#6b5233" stroke-width="3" stroke-linecap="round" />` : "";
  return lines + diag;
}

const ITEMS = [
  (x, y, i) => renderDie(x, y, 34, (i % 6) + 1),
  (x, y) => renderCoin(x, y, 18),
  (x, y, i) => renderTallyMark(x, y + 14, 30, 2 + (i % 4)),
];

function renderItems(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 56, BAND.min + 30, BAND.max - 30);
      return ITEMS[i % ITEMS.length](dx, p.y + 20, i);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const cracks = computeCracks(totalHeight)
    .map((c) => renderCrack(c.x, c.y, c.rot))
    .join("");
  const items = renderItems(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: open flat gold-flecked ground scattered with a different odd item at every stop — a die, a coin, a tally mark — connecting every Odds & Ends lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      <g>${cracks}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#8a6d1f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${items}</g>
    </svg>
  `;
}

export const oddsEndsFlatsTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
