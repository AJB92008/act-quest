// Bridge Builder's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — open sandy plains
// crossed, again and again, by dry gullies spanned with built plank
// bridges: a direct visual pun on the skill itself (transitions and
// logical connections between ideas) — every crossing is a deliberate,
// built connection over a gap, not a trail that just wanders around one.
import { COL_W, clamp, jaggedBandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };

// A dry wash cutting straight across the whole width — a jagged-edged
// band of sun-baked, cracked ground darker than the open sand around it.
function computeGully(centerY, depth) {
  const steps = 24;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= steps; i++) {
    const x = (COL_W / steps) * i;
    const wobble = 10 * Math.sin(i * 0.7 + centerY * 0.01) + 5 * Math.sin(i * 1.9 + centerY * 0.02);
    top.push({ x, y: centerY - depth / 2 + wobble });
    bottom.push({ x, y: centerY + depth / 2 + wobble * 0.7 });
  }
  return { top, bottom };
}

function renderGully({ top, bottom }) {
  const band = jaggedBandPath(top, bottom);
  const crackLines = top
    .filter((_, i) => i % 4 === 2)
    .map((p, i) => `<path d="M${p.x},${p.y + 6} L${p.x + (i % 2 === 0 ? 8 : -8)},${p.y + 22}" stroke="#8a6a44" stroke-width="1.5" opacity="0.4" />`)
    .join("");
  return `<path d="${band}" fill="#c9a668" opacity="0.85" /><path d="${band}" fill="none" stroke="#a9824c" stroke-width="2" opacity="0.5" />${crackLines}`;
}

// A plank bridge with plain rope handrails (no jungle vines here) laid
// straight across the gully right where the trail crosses it.
function renderBridge(x, y, depth) {
  const w = 70;
  const h = depth + 14;
  return `
    <line x1="${x - w / 2}" y1="${y - h / 2 - 8}" x2="${x - w / 2}" y2="${y + h / 2 + 8}" stroke="#6b5233" stroke-width="3" opacity="0.7" />
    <line x1="${x + w / 2}" y1="${y - h / 2 - 8}" x2="${x + w / 2}" y2="${y + h / 2 + 8}" stroke="#6b5233" stroke-width="3" opacity="0.7" />
    <line x1="${x - w / 2}" y1="${y - h / 2 - 8}" x2="${x + w / 2}" y2="${y - h / 2 - 8}" stroke="#8a6a44" stroke-width="2" opacity="0.6" />
    <line x1="${x - w / 2}" y1="${y + h / 2 + 8}" x2="${x + w / 2}" y2="${y + h / 2 + 8}" stroke="#8a6a44" stroke-width="2" opacity="0.6" />
    <rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="3" fill="#9c7c4e" />
    <rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="5" fill="#c9a668" />
  `;
}

// Gullies recur down the whole scroll (scaling with height) rather than
// showing up once — each one is its own little "transition" the trail
// has to build a crossing for.
function computeCrossings(positions, totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 480));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    const depth = 46 + (i % 3) * 14;
    return { y, x: nearest.x, depth };
  });
}

function computeScrub(totalHeight) {
  const count = Math.max(14, Math.round(totalHeight / 160));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    return { x: clamp(hx * COL_W, 15, COL_W - 15), y: hy * totalHeight, scale: 0.7 + (i % 3) * 0.2 };
  });
}

function renderScrubTuft(x, y, s) {
  return `
    <path d="M${x - 6 * s},${y} Q${x - 7 * s},${y - 12 * s} ${x - 2 * s},${y - 15 * s}" stroke="#9c8a5c" stroke-width="${2 * s}" fill="none" opacity="0.6" stroke-linecap="round" />
    <path d="M${x},${y} Q${x},${y - 16 * s} ${x + 1 * s},${y - 18 * s}" stroke="#b8a06a" stroke-width="${2 * s}" fill="none" opacity="0.6" stroke-linecap="round" />
    <path d="M${x + 6 * s},${y} Q${x + 8 * s},${y - 12 * s} ${x + 3 * s},${y - 15 * s}" stroke="#9c8a5c" stroke-width="${2 * s}" fill="none" opacity="0.6" stroke-linecap="round" />
  `;
}

const DECOR_EMOJI = ["🌵", "🦎", "🐫", "🪶"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="24" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const crossings = computeCrossings(positions, totalHeight);
  const gullies = crossings.map((c) => renderGully(computeGully(c.y, c.depth))).join("");
  const bridges = crossings.map((c) => renderBridge(c.x, c.y, c.depth)).join("");
  const scrub = computeScrub(totalHeight)
    .map((s) => renderScrubTuft(s.x, s.y, s.scale))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: sandy plains crossed again and again by dry gullies spanned with built plank bridges, connecting every Bridge Builder lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#e0c98a" />
      <g>${scrub}</g>
      ${gullies}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#a9824c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      ${bridges}
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const causewayTheme = {
  trailBand: BAND,
  mapBg: "#e0c98a",
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
