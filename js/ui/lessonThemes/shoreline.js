// Case Closed's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — Case Closed sits in Sunny
// Meadow, so this reads as a wide-open grassy field running the trail's
// full width, textured with scattered grass tufts and wildflowers so it
// never reads as a flat color block. A little suitcase abandoned in the
// grass is the pun on the skill's own name (a "case," closed), with a
// fallen branch or two nearby. (An earlier version had a strip of murky
// marsh water and reeds confined along one edge, with real depth
// texture, foam, and pond life; dropped along with every other
// no-water-feature skill's water so this meadow-zone lesson reads as
// ordinary open grass, like its neighbors Apostrophe Ally and Semicolon
// Signal.)
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

// Small tufts of tall grass scattered across the whole field,
// independent of the trail — ambient texture so the meadow is never one
// flat fill.
function renderGrassTufts(totalHeight) {
  const count = Math.max(30, Math.round(totalHeight / 34));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    const x = clamp(BAND.min - 20 + hx * (BAND.max - BAND.min + 40), 10, COL_W - 10);
    const y = hy * totalHeight;
    const h = 10 + (i % 3) * 6;
    return `<path d="M${x},${y} Q${x + 3},${y - h * 0.6} ${x},${y - h}" stroke="#6b7a45" stroke-width="2" fill="none" opacity="0.6" />`;
  }).join("");
}

// Small pebbles and grains scattered across the whole field, ambient
// ground texture so the grass is never one flat fill.
function renderGroundTexture(totalHeight) {
  const count = Math.max(40, Math.round(totalHeight / 30));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 34.71 + 1.3) * 29142.31) % 1;
    const hy = Math.abs(Math.sin(i * 91.02 + 2.7) * 8821.44) % 1;
    const x = clamp(BAND.min + hx * (BAND.max - BAND.min), BAND.min + 5, BAND.max - 5);
    const y = hy * totalHeight;
    const r = 1.5 + (i % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#9dbf6e" opacity="0.4" />`;
  }).join("");
}

function computeBranches(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(3, Math.round(totalHeight / 420));
  return Array.from({ length: count }, (_, i) => {
    const f = (i + 0.5) / count;
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const x = clamp(mid + side * (BAND.max - BAND.min) * 0.3, BAND.min + 30, BAND.max - 30);
    return { x, y: hy };
  });
}

function renderBranch({ x, y }) {
  return `<rect x="${x - 26}" y="${y - 5}" width="52" height="10" rx="5" fill="#a9987a" transform="rotate(-12 ${x} ${y})" />`;
}

// The suitcase sits at roughly the trail's own midpoint — the one "case"
// in the whole scene, deliberately singular rather than repeated.
function renderSuitcase(positions) {
  const p = positions[Math.floor(positions.length * 0.55)];
  const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
  const x = clamp(p.x + side * 70, BAND.min + 30, BAND.max - 30);
  const y = p.y + 30;
  return `<text x="${x}" y="${y}" font-size="34" text-anchor="middle">🧳</text>`;
}

const DECOR_EMOJI = ["🌼", "🦋", "🌾", "🌸", "🐝"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 60, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="24" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const branches = computeBranches(positions, totalHeight).map(renderBranch).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="82" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a wide-open grassy meadow, a suitcase abandoned in the grass, and a trail connecting every Case Closed lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#c3dd8f" />
      <g>${renderGroundTexture(totalHeight)}</g>
      <g>${renderGrassTufts(totalHeight)}</g>
      <g>${branches}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      ${renderSuitcase(positions)}
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const shorelineTheme = {
  trailBand: BAND,
  mapBg: "#c3dd8f",
  hintColor: "rgba(25, 40, 10, 0.75)",
  renderScene,
};
