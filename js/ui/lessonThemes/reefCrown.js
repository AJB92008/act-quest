// Athenaeum Reef's own theme for Big Picture, Coral Stacks' first skill
// (see lessonTerrain.js for the shared engine every lesson-path theme
// renders through). Big Picture asks "what's the main idea," so the
// scene leans into exactly one dominant idea: a single oversized coral
// crown formation the trail winds *around* rather than through, with a
// handful of small satellite corals kept well clear of it. Everything
// else in the scene stays small and quiet specifically so that one
// central shape reads as unmissable — the same way a main idea is meant
// to stand out above a passage's supporting details.
import { COL_W, clamp, blobPoints, closedBlobPath, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };

// The crown sits near the trail's own vertical midpoint, offset to
// whichever side the trail isn't using right there — same
// nearest-position-aware placement plains.js's hills use, just for one
// large feature instead of several small ones.
function crownCenter(positions, totalHeight) {
  const cy = totalHeight * 0.42;
  const nearest = nearestPosition(positions, cy);
  const mid = (BAND.min + BAND.max) / 2;
  const side = nearest.x < mid ? 1 : -1;
  const cx = clamp(mid + side * (BAND.max - BAND.min) * 0.3, BAND.min + 100, BAND.max - 40);
  return { x: cx, y: cy };
}

// Three nested, jittered rings (not one flat blob) so the crown reads as
// a tall branching coral tower rather than a single boulder — each ring
// a little smaller and higher than the last, all sharing one seed
// family so they bulge in matching directions like a real single growth
// would, rather than three unrelated shapes stacked by coincidence.
function renderCrown(center) {
  const seed = 3.1;
  const layers = [
    { r: 150, dy: 0, fill: "#e8895f" },
    { r: 108, dy: -46, fill: "#f0a978" },
    { r: 66, dy: -84, fill: "#f6c79a" },
  ];
  return layers
    .map(({ r, dy, fill }, i) => {
      const pts = blobPoints(center.x, center.y + dy, r, 14, seed + i * 1.7);
      return `<path d="${closedBlobPath(pts)}" fill="${fill}" />`;
    })
    .join("");
}

// A few small, deliberately unremarkable satellite corals, kept outside
// the crown's own footprint (its widest layer's radius plus a margin)
// so nothing competes with it for attention.
const SATELLITE_FILLS = ["#7fd9c4", "#5fb8a6", "#9be3d2"];
function renderSatellites(positions, crown) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const dist = Math.hypot(p.x - crown.x, p.y - crown.y);
      if (dist < 220) return "";
      const pts = blobPoints(p.x + (i % 2 === 0 ? 34 : -34), p.y + 8, 20 + (i % 3) * 6, 10, i * 2.3);
      return `<path d="${closedBlobPath(pts)}" fill="${SATELLITE_FILLS[i % SATELLITE_FILLS.length]}" opacity="0.85" />`;
    })
    .join("");
}

const AMBIENT_EMOJI = ["🐠", "🫧", "🐟"];
function renderAmbient(totalHeight) {
  const count = Math.max(6, Math.round(totalHeight / 240));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 90) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 30 + ((i * 97) % (BAND.max - BAND.min - 60)), BAND.min + 15, BAND.max - 15);
    return `<text x="${x}" y="${y}" font-size="22" opacity="0.75" text-anchor="middle">${AMBIENT_EMOJI[i % AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const crown = crownCenter(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#d8b98a" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Coral Stacks: one large central coral crown formation with a handful of small satellite corals in open water, and a trail connecting every Big Picture lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#5fb0c4" />
      <g>${renderAmbient(totalHeight)}</g>
      <g>${renderCrown(crown)}</g>
      <g>${renderSatellites(positions, crown)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#e8d9b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const reefCrownTheme = {
  trailBand: BAND,
  mapBg: "#5fb0c4",
  hintColor: "rgba(10, 35, 40, 0.75)",
  renderScene,
};
