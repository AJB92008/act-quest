// Semicolon Signal's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — open plains with a
// tall windmill landmark partway down and small flags marking the trail
// — a visual pun on the skill itself ("Signal": a semicolon signals a
// close connection between two independent clauses, so the whole scene
// is built around one visible, unmistakable signal-post). No river,
// unlike plains.js.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

function renderWindmill(x, y) {
  const bladeLen = 46;
  const angles = [20, 110, 200, 290];
  const blades = angles
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const bx = x + Math.cos(rad) * bladeLen;
      const by = y - 30 + Math.sin(rad) * bladeLen;
      return `<line x1="${x}" y1="${y - 30}" x2="${bx}" y2="${by}" stroke="#e8e2cf" stroke-width="9" stroke-linecap="round" />`;
    })
    .join("");
  return `
    <rect x="${x - 7}" y="${y - 30}" width="14" height="76" fill="#8a6a44" rx="3" />
    ${blades}
    <circle cx="${x}" cy="${y - 30}" r="7" fill="#5a4128" />
  `;
}

function renderFlag(x, y) {
  return `
    <rect x="${x - 2}" y="${y - 34}" width="4" height="34" fill="#7a8a4a" />
    <path d="M${x + 2},${y - 34} L${x + 22},${y - 27} L${x + 2},${y - 20} Z" fill="#d9524a" />
  `;
}

const AMBIENT_EMOJI = ["🐦", "🌾", "🦋"];

function renderAmbient(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 60, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 16}" font-size="24" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderFlagRow(positions) {
  return positions
    .filter((_, i) => i % 4 === 3)
    .map((p) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 40, BAND.min + 10, BAND.max - 25);
      return renderFlag(dx, p.y + 20);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const mid = positions[Math.floor(positions.length / 2)];
  const millX = mid.x < COL_W / 2 ? mid.x + 130 : mid.x - 130;
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: open plains with a windmill signal-post and small flags along the trail, connecting every Semicolon Signal lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#c8d98f" />
      <g>${renderAmbient(positions)}</g>
      ${renderWindmill(clamp(millX, BAND.min + 40, BAND.max - 40), mid.y)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderFlagRow(positions)}</g>
    </svg>
  `;
}

export const beaconTheme = {
  trailBand: BAND,
  mapBg: "#c8d98f",
  hintColor: "rgba(25, 40, 10, 0.75)",
  renderScene,
};
