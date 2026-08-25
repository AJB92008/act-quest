// Idiom Instinct's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through). Idiom Instinct sits in
// Wordwood Isle's own green zone, so this reads as open plains: a
// winding river confined to its own band on one side, a couple of
// grassy hills the trail skirts around, and book/scroll-themed details
// at the lesson stops.
import { COL_W, clamp, bandPath, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const RIVER_BAND = { min: 30, max: 210 };
const LAND_BAND = { min: 260, max: COL_W - 40 };

// A self-contained wavy ribbon of water, confined to RIVER_BAND — both
// banks bulge in and out down the whole page, at a large enough
// amplitude relative to the band's own width that it reads unmistakably
// as a winding river rather than a straight-edged panel, and the ribbon
// never touches the canvas's left edge (so there's always dry ground
// visible on both sides of it, not a hard cut at the frame boundary).
function computeRiver(totalHeight) {
  const steps = Math.max(20, Math.round(totalHeight / 110));
  const mid = (RIVER_BAND.min + RIVER_BAND.max) / 2;
  const swing = (RIVER_BAND.max - RIVER_BAND.min) / 2 - 34;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const center = mid + swing * Math.sin(i * 0.5 + 0.4) + swing * 0.45 * Math.sin(i * 1.3 + 2.0);
    const halfWidth = 32 + 14 * Math.sin(i * 0.85 + 1.1);
    return {
      y,
      left: clamp(center - halfWidth, RIVER_BAND.min, RIVER_BAND.max),
      right: clamp(center + halfWidth, RIVER_BAND.min, RIVER_BAND.max),
    };
  });
}

function renderRiver(totalHeight) {
  const banks = computeRiver(totalHeight);
  return bandPath(
    banks.map((b) => ({ x: b.left, y: b.y })),
    banks.map((b) => ({ x: b.right, y: b.y }))
  );
}

// A sandy bank line tracing both edges of the water, plus a few reed
// clumps poking up right at the waterline — without this the river read
// as a flat color panel dropped onto the grass with no transition where
// water actually meets land.
function renderRiverBanks(totalHeight) {
  const banks = computeRiver(totalHeight);
  const leftLine = banks.map((b, i) => `${i === 0 ? "M" : "L"}${b.left},${b.y}`).join(" ");
  const rightLine = banks.map((b, i) => `${i === 0 ? "M" : "L"}${b.right},${b.y}`).join(" ");
  const reeds = banks
    .filter((_, i) => i % 4 === 2)
    .map((b) => {
      const x = b.right + 7;
      return `<path d="M${x},${b.y} Q${x + 3},${b.y - 14} ${x},${b.y - 22}" stroke="#6b7a45" stroke-width="2" fill="none" opacity="0.75" />`;
    })
    .join("");
  return `
    <path d="${leftLine}" stroke="#c9b47e" stroke-width="4" fill="none" opacity="0.55" />
    <path d="${rightLine}" stroke="#c9b47e" stroke-width="4" fill="none" opacity="0.55" />
    ${reeds}
  `;
}

// A couple of soft hill mounds within the land band, each placed on the
// opposite side of the trail from wherever the trail happens to be at
// that height — so the trail always reads as skirting around the near
// edge of one, rather than the two overlapping by coincidence.
function computeHills(positions, totalHeight) {
  const mid = (LAND_BAND.min + LAND_BAND.max) / 2;
  return [0.2, 0.48, 0.76].map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const hx = clamp(mid + side * (LAND_BAND.max - LAND_BAND.min) * 0.32, LAND_BAND.min + 55, LAND_BAND.max - 15);
    return { x: hx, y: hy, r: 90 + (i % 2) * 18 };
  });
}

const DECOR_EMOJI = ["📖", "🔖", "🖋️", "📜", "🦉", "🔍"];
const AMBIENT_EMOJI = ["🌾", "🌿", "🌼"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (LAND_BAND.min + LAND_BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 70, LAND_BAND.min + 20, LAND_BAND.max - 5);
      const dy = p.y - 14;
      return `<text x="${dx}" y="${dy}" font-size="30" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderAmbient(totalHeight) {
  const count = Math.max(6, Math.round(totalHeight / 260));
  return Array.from({ length: count }, (_, i) => {
    const y = 60 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(LAND_BAND.min + 25 + ((i * 73) % (LAND_BAND.max - LAND_BAND.min - 50)), LAND_BAND.min + 10, LAND_BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="22" opacity="0.8" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

// Each hill picks from a small set of shade pairs (not always the same
// green-on-green) and its highlight blob sits at a jittered offset, so
// three hills at different sizes don't all read as one shape rescaled.
const HILL_SHADES = [
  ["#8db35f", "#a3c777"],
  ["#7ba055", "#93bb6d"],
  ["#96b869", "#abcb80"],
];

function renderScene(positions, totalHeight, bossName) {
  const hills = computeHills(positions, totalHeight)
    .map(({ x, y, r }, i) => {
      const [base, highlight] = HILL_SHADES[i % HILL_SHADES.length];
      const hlx = x + (i % 2 === 0 ? -1 : 1) * r * 0.25;
      const hly = y - r * (0.1 + (i % 3) * 0.05);
      return `
        <ellipse cx="${x}" cy="${y + 16}" rx="${r}" ry="${r * 0.58}" fill="rgba(20,45,30,0.16)" />
        <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="${base}" />
        <ellipse cx="${hlx}" cy="${hly}" rx="${r * (0.45 + (i % 2) * 0.15)}" ry="${r * 0.3}" fill="${highlight}" opacity="0.75" />
      `;
    })
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: open grassy plains with a winding river down one side, hills, and a trail connecting every Idiom Instinct lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#c3dd8f" />
      <g>${renderAmbient(totalHeight)}</g>
      <path d="${renderRiver(totalHeight)}" fill="#7fa8b8" opacity="0.75" />
      ${renderRiverBanks(totalHeight)}
      <g>${hills}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const plainsTheme = {
  trailBand: LAND_BAND,
  mapBg: "#c3dd8f",
  hintColor: "rgba(25, 40, 10, 0.75)",
  renderScene,
};
