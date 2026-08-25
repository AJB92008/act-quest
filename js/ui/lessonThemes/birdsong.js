// Colon Call's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — open plains full of birds
// and a bell-tower landmark — a visual pun on the skill itself ("Call":
// a colon calls out what follows, so the whole scene is full of things
// calling — birdsong, a ringing bell). No river, unlike plains.js.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

function renderBellTower(x, y) {
  return `
    <rect x="${x - 22}" y="${y - 10}" width="44" height="60" fill="#c9a668" rx="4" />
    <path d="M${x - 26},${y - 10} L${x},${y - 44} L${x + 26},${y - 10} Z" fill="#8a6a44" />
    <circle cx="${x}" cy="${y + 16}" r="12" fill="#efe4cf" stroke="#8a6a44" stroke-width="3" />
    <path d="M${x - 9},${y + 12} Q${x},${y + 28} ${x + 9},${y + 12}" fill="#c9a668" stroke="#8a6a44" stroke-width="2" />
  `;
}

function computeHills(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(2, Math.round(totalHeight / 650));
  const fractions = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
  return fractions.map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const hx = clamp(mid + side * (BAND.max - BAND.min) * 0.32, BAND.min + 55, BAND.max - 15);
    return { x: hx, y: hy, r: 80 + (i % 2) * 20 };
  });
}

function renderHill({ x, y, r }) {
  return `
    <ellipse cx="${x}" cy="${y + r * 0.5}" rx="${r * 0.85}" ry="${r * 0.28}" fill="rgba(20,45,30,0.14)" />
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#8fbf6a" />
    <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.1}" rx="${r * 0.5}" ry="${r * 0.3}" fill="#a6d17e" opacity="0.75" />
  `;
}

const BIRD_EMOJI = ["🐦", "🕊️", "🐤"];

// Birds sit at nearly every stop, each with a little musical note beside
// it — the calling itself is the point, so this is busier than a plains
// scene normally gets.
function renderBirds(positions) {
  return positions
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 15);
      const dy = p.y - 16 - (i % 2) * 10;
      const showNote = i % 2 === 0;
      return `
        <text x="${dx}" y="${dy}" font-size="22" text-anchor="middle">${BIRD_EMOJI[i % BIRD_EMOJI.length]}</text>
        ${showNote ? `<text x="${dx + 16}" y="${dy - 8}" font-size="14" opacity="0.7">♪</text>` : ""}
      `;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const hills = computeHills(positions, totalHeight).map(renderHill).join("");
  const mid = positions[Math.floor(positions.length * 0.4)];
  const towerX = clamp(mid.x < COL_W / 2 ? mid.x + 120 : mid.x - 120, BAND.min + 30, BAND.max - 30);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: open plains full of birdsong with a bell tower, connecting every Colon Call lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#bfe0a5" />
      <g>${hills}</g>
      ${renderBellTower(towerX, mid.y)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderBirds(positions)}</g>
    </svg>
  `;
}

export const birdsongTheme = {
  trailBand: BAND,
  mapBg: "#bfe0a5",
  hintColor: "rgba(15, 35, 10, 0.75)",
  renderScene,
};
