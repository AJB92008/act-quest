// Round Trip's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, where the trail passes through a real stone ring at
// intervals rather than just past one: a dashed loop breaks off the
// main trail, circles the ring, and rejoins it right where it left off
// — an actual round trip, not just a circle drawn nearby.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#8ba3b6";
const WALL_STROKE = "#3f4a56";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      40 * Math.sin(i * 0.42 + phase) +
      25 * Math.sin(i * 1.1 + phase * 1.6) +
      16 * Math.sin(i * 2.4 + phase * 0.6) +
      9 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(54 + wobble, 14, 84) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="roundTripLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="roundTripRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#roundTripLeftFade)" : "url(#roundTripRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

// A real stone ring — an outer circle with a smaller circle cut out of
// its middle (evenodd fill), not a plain donut icon.
function renderStoneRing(cx, cy, r, shade) {
  const inner = r * 0.6;
  return `<path d="M${(cx - r).toFixed(1)},${cy.toFixed(1)} A${r},${r} 0 1 0 ${(cx + r).toFixed(1)},${cy.toFixed(1)} A${r},${r} 0 1 0 ${(cx - r).toFixed(1)},${cy.toFixed(1)} Z M${(cx - inner).toFixed(1)},${cy.toFixed(1)} A${inner},${inner} 0 1 1 ${(cx + inner).toFixed(1)},${cy.toFixed(1)} A${inner},${inner} 0 1 1 ${(cx - inner).toFixed(1)},${cy.toFixed(1)} Z" fill="${shade}" fill-rule="evenodd" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.92" />`;
}

// A dashed loop that leaves the main trail at its own point, circles a
// stone ring, and comes back to that exact same point — the round trip
// itself, drawn as a real path rather than implied.
function renderLoopDetour(px, py, r) {
  const loopR = r + 26;
  return `<path d="M${px.toFixed(1)},${py.toFixed(1)} A${loopR.toFixed(1)},${loopR.toFixed(1)} 0 1 1 ${(px - 0.1).toFixed(1)},${(py + 0.1).toFixed(1)}" stroke="#b98a52" stroke-width="3.5" stroke-dasharray="1 11" fill="none" opacity="0.7" />`;
}

function computeRings(positions, totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 560));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const side = i % 2 === 0 ? 1 : -1;
    const nearest = nearestPosition(positions, y);
    const cx = clamp(nearest.x + side * 92, BAND.min + 55, BAND.max - 55);
    return { cx, cy: nearest.y, side, r: 46 + (i % 3) * 8 };
  });
}

function renderRings(positions, totalHeight) {
  return computeRings(positions, totalHeight)
    .map(({ cx, cy, side, r }) => {
      const px = cx - side * (r + 26);
      return renderStoneRing(cx, cy, r, "#c5d2db") + renderLoopDetour(px, cy, r);
    })
    .join("");
}

// Smaller pebble rings scattered through the shore-scree — the same
// ring shape, just tiny, so the motif reads even between the big ones.
function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 6 + (i % 4) * 3,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(positions, totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="none" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.55" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const scree = renderScree(positions, totalHeight);
  const rings = renderRings(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, where the trail loops out through a real stone ring and back at every stop, connecting every Round Trip lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${rings}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const roundTripLoopTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(16, 24, 30, 0.78)",
  renderScene,
};
