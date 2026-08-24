// Modifier Mix-Up's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — an overgrown,
// tangled thicket of brambles and vines: a visual pun on the skill
// itself (misplaced/dangling modifiers — things attached in a
// confusing, snarled way). Deliberately the messiest, most cluttered
// scene of the set, in contrast to orchard.js's strict rows or
// overlook.js's deliberate emptiness — thorny squiggles are scattered
// everywhere, not confined to one tidy band.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };

// A short, gnarled squiggle of vine — an irregular little loop, not a
// straight line or a smooth curve, so it reads as a snarl.
function renderVineSquiggle(x, y, scale) {
  const s = scale;
  return `<path d="M${x - 18 * s},${y} C${x - 10 * s},${y - 22 * s} ${x + 12 * s},${y - 18 * s} ${x + 4 * s},${y + 4 * s}
    C${x - 4 * s},${y + 24 * s} ${x + 20 * s},${y + 20 * s} ${x + 16 * s},${y - 4 * s}"
    stroke="#3f4a1f" stroke-width="${3 * s}" fill="none" stroke-linecap="round" opacity="0.55" />`;
}

// Tangled vine texture scattered broadly across the whole canvas (not
// one band) — this is what makes the ground itself feel overgrown.
function renderVineTexture(totalHeight) {
  const count = Math.max(16, Math.round(totalHeight / 95));
  const marks = [];
  for (let i = 0; i < count; i++) {
    const y = 40 + ((totalHeight - 80) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + ((i * 83) % (BAND.max - BAND.min)), BAND.min + 10, BAND.max - 10);
    const scale = 0.8 + ((i * 37) % 5) * 0.14;
    marks.push(renderVineSquiggle(x, y, scale));
  }
  return marks.join("");
}

const DECOR_EMOJI = ["🥀", "🕸️", "🦇", "🐛", "🍄", "🐌"];

// Nearly every stop gets a detail — busier than any other theme, since
// this scene is meant to feel like the undergrowth is closing in.
function renderDecorations(positions) {
  return positions.map((p, i) => {
    const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
    const jitter = 50 + (i % 3) * 24;
    const dx = clamp(p.x + side * jitter, BAND.min + 10, BAND.max - 10);
    const dy = p.y - 8 - (i % 2) * 12;
    return `<text x="${dx}" y="${dy}" font-size="26" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
  }).join("");
}

// A few larger thorny bramble clumps (three overlapping dark-green
// blobs with small thorn marks) sitting just off the trail — clutter
// with real visual weight, not just small emoji.
function computeThickets(positions, totalHeight) {
  return [0.18, 0.42, 0.66, 0.88].map((f, i) => {
    const hy = f * totalHeight;
    const side = i % 2 === 0 ? 1 : -1;
    const x = clamp((BAND.min + BAND.max) / 2 + side * (BAND.max - BAND.min) * 0.36, BAND.min + 40, BAND.max - 40);
    return { x, y: hy, r: 46 + (i % 2) * 12 };
  });
}

function renderThicket({ x, y, r }) {
  return `
    <ellipse cx="${x}" cy="${y + r * 0.3}" rx="${r * 0.8}" ry="${r * 0.3}" fill="rgba(10,15,5,0.25)" />
    <circle cx="${x - r * 0.3}" cy="${y}" r="${r * 0.5}" fill="#3a4a20" />
    <circle cx="${x + r * 0.32}" cy="${y - r * 0.05}" r="${r * 0.55}" fill="#465a26" />
    <circle cx="${x}" cy="${y - r * 0.35}" r="${r * 0.5}" fill="#526530" />
    <text x="${x - r * 0.1}" y="${y - r * 0.05}" font-size="18" text-anchor="middle">🥀</text>
  `;
}

function renderScene(positions, totalHeight, bossName) {
  const thickets = computeThickets(positions, totalHeight).map(renderThicket).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `
    <circle cx="${last.x}" cy="${last.y}" r="86" fill="#5a5a3a" stroke="#3a3a22" stroke-width="4" />
    <text x="${last.x - 68}" y="${last.y - 56}" font-size="24">🥀</text>
    <text x="${last.x + 62}" y="${last.y + 54}" font-size="24">🥀</text>
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: an overgrown, tangled bramble thicket, and a trail cutting through the snarl to connect every Modifier Mix-Up lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#4a5a2e" />
      <g>${renderVineTexture(totalHeight)}</g>
      <g>${thickets}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#6b5233" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const brambleTheme = {
  trailBand: BAND,
  mapBg: "#4a5a2e",
  hintColor: "rgba(235, 240, 220, 0.85)",
  renderScene,
};
