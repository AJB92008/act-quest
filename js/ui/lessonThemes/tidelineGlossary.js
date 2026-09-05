// Athenaeum Reef's own theme for Word Watch, Lighthouse Point's second
// skill (see lessonTerrain.js for the shared engine every lesson-path
// theme renders through, and beaconSweep.js for this zone's own first
// theme). Word Watch is about figuring out what a word means from its
// surrounding context, so the tideline is scattered with driftwood
// letter tiles — meaningless alone, the same way a word means nothing
// pulled out of its passage — while a spyglass motif (the "watch" in
// Word Watch) recurs down the trail as the thing actually doing the
// figuring-out.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const LETTERS = ["A", "M", "E", "R", "T", "O", "S", "N"];

function renderTile(x, y, letter, angle) {
  return `
    <g transform="rotate(${angle} ${x} ${y})">
      <rect x="${x - 16}" y="${y - 16}" width="32" height="32" rx="4" fill="#d9b98a" stroke="#a8825a" stroke-width="2" />
      <text x="${x}" y="${y + 7}" font-size="18" font-weight="800" text-anchor="middle" fill="#5c4326">${letter}</text>
    </g>
  `;
}

function renderTiles(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 140));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(30 + ((i * 151) % (COL_W - 60)), 25, COL_W - 25);
    const angle = ((i * 47) % 40) - 20;
    return renderTile(x, y, LETTERS[i % LETTERS.length], angle);
  }).join("");
}

function renderSpyglass(x, y) {
  return `
    <g transform="rotate(-18 ${x} ${y})">
      <rect x="${x - 6}" y="${y - 8}" width="52" height="16" rx="8" fill="#c9a887" stroke="#8a7259" stroke-width="2" />
      <circle cx="${x + 44}" cy="${y}" r="10" fill="none" stroke="#8a7259" stroke-width="3" />
    </g>
  `;
}

function renderSpyglasses(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .filter((_, i) => i % 3 === 0)
    .map((p) => {
      const side = p.x < mid ? -1 : 1;
      return renderSpyglass(clamp(p.x + side * 70, 30, COL_W - 70), p.y);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#e8d29a" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Lighthouse Point: a sandy tideline scattered with driftwood letter tiles and spyglasses watching over them, connecting every Word Watch lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#e8d9b8" />
      <g>${renderTiles(totalHeight)}</g>
      <g>${renderSpyglasses(positions)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#6fa8b0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const tidelineGlossaryTheme = {
  trailBand: BAND,
  mapBg: "#e8d9b8",
  hintColor: "rgba(50, 35, 15, 0.75)",
  renderScene,
};
