// Fix the Fracture's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a dusty, rocky
// canyon with a literal jagged crack running through the ground (a
// visual pun on the skill itself: sentence *fragments*, a fracture in
// the ground you cross via a couple of rickety plank bridges). No river
// — the crack is drawn as a stroked zigzag line, not a filled band, and
// its angular straight segments (not smooth curves) are deliberately the
// opposite of plains.js's river or jungle.js's soft canopy blobs.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 210, max: COL_W - 40 };
const CRACK_X = 130;

// A jagged zigzag, not a smooth curve — straight segments with sharp
// direction changes read as an actual fracture rather than a river.
function computeCrack(totalHeight) {
  const steps = Math.max(14, Math.round(totalHeight / 150));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const y = (totalHeight / steps) * i;
    const jag = (i % 2 === 0 ? 1 : -1) * (26 + (i % 3) * 16);
    const x = clamp(CRACK_X + jag, 40, BAND.min - 60);
    points.push({ x, y });
  }
  return points;
}

function renderCrackPath(points) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

// A couple of simple wood-plank bridges laid straight across the crack,
// roughly a third and two-thirds of the way down — the crack is
// "fixed"/crossed rather than just decorative.
function renderBridges(points, totalHeight) {
  const targets = [0.32, 0.68].map((f) => f * totalHeight);
  return targets
    .map((ty) => {
      let nearest = points[0];
      let best = Infinity;
      for (const p of points) {
        const d = Math.abs(p.y - ty);
        if (d < best) {
          best = d;
          nearest = p;
        }
      }
      const w = 74;
      return `
        <rect x="${nearest.x - w / 2}" y="${nearest.y - 9}" width="${w}" height="18" rx="3" fill="#8a6a44" />
        <rect x="${nearest.x - w / 2}" y="${nearest.y - 9}" width="${w}" height="5" fill="#a9865c" />
      `;
    })
    .join("");
}

function computeRocks(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return [0.15, 0.38, 0.6, 0.82].map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const rx = clamp(mid + side * (BAND.max - BAND.min) * 0.3, BAND.min + 40, BAND.max - 20);
    return { x: rx, y: hy, r: 34 + (i % 2) * 14 };
  });
}

function renderRock({ x, y, r }) {
  return `
    <ellipse cx="${x}" cy="${y + r * 0.5}" rx="${r * 0.9}" ry="${r * 0.3}" fill="rgba(30,22,12,0.2)" />
    <path d="M${x - r},${y + r * 0.3} L${x - r * 0.5},${y - r * 0.6} L${x + r * 0.15},${y - r} L${x + r * 0.7},${y - r * 0.35} L${x + r},${y + r * 0.35} L${x + r * 0.4},${y + r * 0.55} Z"
      fill="#9c8266" stroke="#7a6249" stroke-width="2" />
  `;
}

const DECOR_EMOJI = ["🪨", "🦎", "🌵", "🍂"];
const AMBIENT_EMOJI = ["🪨", "🌾"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 2)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 65, BAND.min + 15, BAND.max - 10);
      const dy = p.y - 12;
      return `<text x="${dx}" y="${dy}" font-size="27" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderAmbient(totalHeight) {
  const count = Math.max(7, Math.round(totalHeight / 240));
  return Array.from({ length: count }, (_, i) => {
    const y = 55 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 67) % (BAND.max - BAND.min - 40)), BAND.min + 10, BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="20" opacity="0.75" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const crackPoints = computeCrack(totalHeight);
  const rocks = computeRocks(positions, totalHeight).map(renderRock).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#c9bfa0" stroke="#8a7355" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a dusty rocky canyon with a jagged fracture in the ground crossed by plank bridges, and a trail connecting every Fix the Fracture lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#b9a37e" />
      <g>${renderAmbient(totalHeight)}</g>
      <g>${rocks}</g>
      ${bossClearing}
      <path d="${renderCrackPath(crackPoints)}" stroke="#3a2a1c" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85" />
      <path d="${renderCrackPath(crackPoints)}" stroke="#5c4530" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7" />
      <g>${renderBridges(crackPoints, totalHeight)}</g>
      <path d="${renderTrailPath(positions)}" stroke="#8a6a44" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const canyonTheme = {
  trailBand: BAND,
  mapBg: "#b9a37e",
  hintColor: "rgba(35, 25, 10, 0.78)",
  renderScene,
};
