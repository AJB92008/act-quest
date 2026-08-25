// Fix the Fracture's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a jungle ravine: a
// literal jagged crack splitting the jungle floor (a visual pun on the
// skill itself: sentence *fragments*, a fracture in the ground you cross
// via a couple of rickety rope-and-plank bridges), with mossy rocks and
// jungle growth crowding right up to its edges. No river — the crack is
// drawn as a stroked zigzag line, not a filled band, and its angular
// straight segments (not smooth curves) are deliberately the opposite of
// plains.js's river or jungle.js's soft canopy blobs — jungle-adjacent
// in palette and wildlife, but its own distinct composition.
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

// A couple of rope-and-plank bridges laid straight across the crack,
// roughly a third and two-thirds of the way down — the crack is
// "fixed"/crossed rather than just decorative. The vine handrail arc is
// what pushes these from "generic wood bridge" to "jungle crossing."
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
        <path d="M${nearest.x - w / 2},${nearest.y - 9} Q${nearest.x},${nearest.y - 24} ${nearest.x + w / 2},${nearest.y - 9}"
          stroke="#4a6b2e" stroke-width="3" fill="none" opacity="0.85" />
        <rect x="${nearest.x - w / 2}" y="${nearest.y - 9}" width="${w}" height="18" rx="3" fill="#7a5c38" />
        <rect x="${nearest.x - w / 2}" y="${nearest.y - 9}" width="${w}" height="5" fill="#9c7c4e" />
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
    return { x: rx, y: hy, r: 30 + (i % 3) * 16, seed: i * 3.1, shade: i % ROCK_SHADES.length };
  });
}

// Moss-tinted rather than dry desert stone — a few different moss shades
// instead of always the same one, and each vertex nudged by a per-rock
// seed so the silhouette itself varies, not just the overall size.
const ROCK_SHADES = [
  ["#8a9668", "#5f6b46"],
  ["#7c8a5c", "#54603c"],
  ["#96a074", "#68724e"],
];

function renderRock({ x, y, r, seed, shade }) {
  const [fill, stroke] = ROCK_SHADES[shade];
  const j = (n) => (Math.sin(seed * 7.7 + n * 3.3) * 0.5) * r * 0.18;
  const pts = [
    { x: x - r + j(1), y: y + r * 0.3 + j(2) },
    { x: x - r * 0.5 + j(3), y: y - r * 0.6 + j(4) },
    { x: x + r * 0.15 + j(5), y: y - r + j(6) },
    { x: x + r * 0.7 + j(7), y: y - r * 0.35 + j(8) },
    { x: x + r + j(9), y: y + r * 0.35 + j(10) },
    { x: x + r * 0.4 + j(11), y: y + r * 0.55 + j(12) },
  ];
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
  const mossX = x + r * 0.1 + j(13) * 0.5;
  const mossY = y - r * 0.6;
  return `
    <ellipse cx="${x}" cy="${y + r * 0.5}" rx="${r * 0.9}" ry="${r * 0.3}" fill="rgba(15,25,8,0.22)" />
    <path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
    <text x="${mossX}" y="${mossY}" font-size="16" text-anchor="middle">🌿</text>
  `;
}

// A little cluster of jungle growth (two overlapping leafy blobs on a
// short stem) sitting right at the crack's own edge, so the fracture
// reads as cutting through real jungle floor rather than bare rock.
function computeCrackVines(crackPoints) {
  return [0.22, 0.5, 0.78].map((f) => {
    const idx = Math.round(f * (crackPoints.length - 1));
    const p = crackPoints[idx];
    return { x: clamp(p.x + 34, 30, BAND.min - 20), y: p.y };
  });
}

function renderCrackVine({ x, y }) {
  return `
    <circle cx="${x - 8}" cy="${y}" r="16" fill="#3f6b2c" />
    <circle cx="${x + 9}" cy="${y - 4}" r="18" fill="#527a38" />
  `;
}

const DECOR_EMOJI = ["🐸", "🐍", "🌿", "🍂", "🦋"];
const AMBIENT_EMOJI = ["🍃", "🌿"];

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
  const crackVines = computeCrackVines(crackPoints).map(renderCrackVine).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#c3cba0" stroke="#6f8552" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a jungle ravine with a jagged fracture in the ground crossed by rope-and-plank bridges, mossy rocks, and jungle growth, with a trail connecting every Fix the Fracture lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#5d7a3f" />
      <g>${renderAmbient(totalHeight)}</g>
      <g>${rocks}</g>
      ${bossClearing}
      <g>${crackVines}</g>
      <path d="${renderCrackPath(crackPoints)}" stroke="#3a2a1c" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85" />
      <path d="${renderCrackPath(crackPoints)}" stroke="#5c4530" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7" />
      <g>${renderBridges(crackPoints, totalHeight)}</g>
      <path d="${renderTrailPath(positions)}" stroke="#7a5c38" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const canyonTheme = {
  trailBand: BAND,
  mapBg: "#5d7a3f",
  hintColor: "rgba(240, 248, 225, 0.85)",
  renderScene,
};
