// Phrase Finder's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — deliberately not a recolor
// of plains.js: no river at all (the trail gets nearly the whole width
// instead), a proper scatter of individual tree clusters rather than a
// couple of smooth hills, and wildlife/foliage at nearly every stop
// instead of every third, plus its own denser, wider-varied ambient
// scatter.
import { COL_W, clamp, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 45, max: COL_W - 45 };
const TREE_COUNT = 10;
const FAUNA_EMOJI = ["🦜", "🐒", "🐍", "🐸", "🦋", "🕷️"];
const FLORA_EMOJI = ["🌴", "🌺", "🍄", "🪵"];
const AMBIENT_EMOJI = ["🍃", "🌿", "🍄", "🕸️"];

function computeTrees(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return Array.from({ length: TREE_COUNT }, (_, i) => {
    const hy = ((i + 0.5) / TREE_COUNT) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const dist = 95 + (i % 3) * 42;
    const tx = clamp(nearest.x + side * dist, BAND.min + 25, BAND.max - 25);
    const r = 34 + (i % 4) * 9;
    return { x: tx, y: hy, r };
  });
}

// Three overlapping canopy blobs staggered around a short trunk — reads
// as an actual clump of trees rather than one smooth mound.
function renderTree({ x, y, r }) {
  return `
    <rect x="${x - 4}" y="${y + r * 0.25}" width="8" height="${r * 0.85}" fill="#5a3d22" rx="3" />
    <ellipse cx="${x}" cy="${y + r * 0.35}" rx="${r * 0.6}" ry="${r * 0.26}" fill="rgba(6,16,4,0.28)" />
    <circle cx="${x - r * 0.4}" cy="${y}" r="${r * 0.55}" fill="#2f5626" />
    <circle cx="${x + r * 0.42}" cy="${y - r * 0.08}" r="${r * 0.6}" fill="#3a6b2e" />
    <circle cx="${x}" cy="${y - r * 0.48}" r="${r * 0.62}" fill="#4a7a3a" />
  `;
}

// Wildlife and foliage sit at nearly every stop (skipping only every
// other one, not every third) — busier and more varied than plains.js's
// sparse "one detail every few lessons."
function renderDecorations(positions) {
  const pool = [...FAUNA_EMOJI, ...FLORA_EMOJI];
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const jitter = 55 + (i % 3) * 22;
      const dx = clamp(p.x + side * jitter, BAND.min + 15, BAND.max - 15);
      const dy = p.y - 10 - (i % 2) * 10;
      return `<text x="${dx}" y="${dy}" font-size="28" text-anchor="middle">${pool[i % pool.length]}</text>`;
    })
    .join("");
}

function renderAmbient(totalHeight) {
  const count = Math.max(12, Math.round(totalHeight / 130));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 61) % (BAND.max - BAND.min - 40)), BAND.min + 10, BAND.max - 10);
    const size = 18 + (i % 3) * 6;
    return `<text x="${x}" y="${y}" font-size="${size}" opacity="0.85" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const trees = computeTrees(positions, totalHeight).map(renderTree).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `
    <circle cx="${last.x}" cy="${last.y}" r="90" fill="#dfe0c4" stroke="#7d8f5c" stroke-width="4" />
    <text x="${last.x - 72}" y="${last.y - 58}" font-size="26">🌿</text>
    <text x="${last.x + 66}" y="${last.y + 56}" font-size="26">🌿</text>
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: dense jungle thick with trees, vines, and animals, and a trail connecting every Phrase Finder lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#3f6b34" />
      <g>${renderAmbient(totalHeight)}</g>
      <g>${trees}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#7a5a35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const jungleTheme = {
  trailBand: BAND,
  mapBg: "#3f6b34",
  hintColor: "rgba(240, 250, 230, 0.85)",
  renderScene,
};
