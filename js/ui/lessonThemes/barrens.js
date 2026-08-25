// Trim the Fat's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a stark, bleached desert,
// deliberately the barest of the four dock-zone scenes: cracked dry
// earth, a few pruned cacti (each one visibly cut flat across the top,
// not a full round crown), and almost nothing else — a visual pun on
// the skill itself, concision, everything unnecessary trimmed away
// until only what's needed is left standing.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };

// Cracked dry-earth texture scattered thinly across the whole ground —
// the one bit of ambient detail dense enough to keep the scene from
// looking unfinished, without contradicting how bare it's meant to feel.
function computeCracks(totalHeight) {
  const count = Math.max(14, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    return { x: clamp(hx * COL_W, 20, COL_W - 20), y: hy * totalHeight, rot: (i * 47) % 360 };
  });
}

function renderCrack(x, y, rot) {
  return `<path d="M0,0 L14,-3 M14,-3 L24,4 M14,-3 L10,-14" stroke="#a9824c" stroke-width="1.5" fill="none" opacity="0.4" transform="translate(${x},${y}) rotate(${rot})" />`;
}

// A pruned cactus — its top cut flat rather than rounding off into a
// full crown, with one clean stub arm instead of the usual pair.
function renderPrunedCactus(x, y, h, seed) {
  const flip = seed % 2 === 0 ? 1 : -1;
  return `
    <ellipse cx="${x}" cy="${y + 4}" rx="14" ry="4" fill="rgba(60,45,20,0.2)" />
    <rect x="${x - 8}" y="${y - h}" width="16" height="${h}" rx="7" fill="#6b8a5a" />
    <rect x="${x - 8}" y="${y - h}" width="16" height="6" fill="#587049" />
    <rect x="${x + flip * 6}" y="${y - h * 0.55}" width="9" height="14" rx="4" fill="#6b8a5a" />
  `;
}

function computeCacti(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(3, Math.round(totalHeight / 640));
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const x = clamp(nearest.x + side * (75 + (i % 2) * 25), BAND.min + 15, BAND.max - 15);
    return { x, y: hy, h: 44 + (i % 3) * 10, seed: i };
  });
}

// A sun-bleached skull, sitting alone — the one flourish this theme
// allows itself, and only once.
function renderSkull(positions, totalHeight) {
  const p = positions[Math.floor(positions.length * 0.62)];
  const side = p.x < (BAND.min + BAND.max) / 2 ? -1 : 1;
  const x = clamp(p.x + side * 60, BAND.min + 15, BAND.max - 15);
  return `<text x="${x}" y="${p.y - 10}" font-size="24" text-anchor="middle" opacity="0.85">💀</text>`;
}

const DECOR_EMOJI = ["🦂", "🪨"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 4 === 3)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="20" text-anchor="middle" opacity="0.8">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const cracks = computeCracks(totalHeight)
    .map((c) => renderCrack(c.x, c.y, c.rot))
    .join("");
  const cacti = computeCacti(positions, totalHeight)
    .map((c) => renderPrunedCactus(c.x, c.y, c.h, c.seed))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a stark, bleached desert with cracked earth and a few pruned cacti, connecting every Trim the Fat lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#e8d9ae" />
      <g>${cracks}</g>
      <g>${cacti}</g>
      ${renderSkull(positions, totalHeight)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#a9824c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const barrensTheme = {
  trailBand: BAND,
  mapBg: "#e8d9ae",
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
