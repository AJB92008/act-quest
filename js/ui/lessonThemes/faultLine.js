// Line Crossing's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — an Ironroot valley (rust-
// brown rock, matching Numeria Peaks' own Algebra zone) split again and
// again by the same dead-straight diagonal line: same slope, same
// length, every single time it appears. Everything else in this scene
// wanders (the trail, the rock walls' own jagged edges) — this one line
// never does, a visual pun on the skill itself (a line, unlike every
// curve here, has exactly one constant rate of change). A little plank
// bridge marks every point the wandering trail crosses one.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };
const WALL_BASE = "#a8785f";
const WALL_STROKE = "#4a3323";
const LINE_COLOR = "#3f2e1f";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      36 * Math.sin(i * 0.4 + phase) +
      22 * Math.sin(i * 1.05 + phase * 1.5) +
      14 * Math.sin(i * 2.3 + phase * 0.7) +
      8 * Math.sin(i * 5.1 + phase * 2.2);
    return { y, depth: clamp(42 + wobble, 10, 70) };
  });
}

// The wall's outer edge (away from the trail, off past the frame) fades
// to transparent right at the canvas edge instead of getting clipped
// there — same technique every Wordwood theme's own walls use.
function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="faultLineLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="faultLineRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#faultLineLeftFade)" : "url(#faultLineRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

// One dead-straight diagonal segment, the same slope every time (the
// full BAND width, the same fraction of a segment's own height) —
// repeated down the valley floor as separate segments rather than one
// continuous line the whole scene, so it reads as "the same line,
// drawn again" rather than a single unbroken feature.
const SEG_H = 300;
function computeFaultSegments(totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / SEG_H));
  return Array.from({ length: count }, (_, i) => {
    const y0 = ((i + 0.15) / count) * totalHeight;
    const y1 = y0 + SEG_H * 0.55;
    return { x0: BAND.min, y0, x1: BAND.max, y1 };
  });
}

function renderFault(seg) {
  return `
    <path d="M${seg.x0},${seg.y0} L${seg.x1},${seg.y1}" stroke="${LINE_COLOR}" stroke-width="9" stroke-linecap="round" opacity="0.5" />
    <path d="M${seg.x0},${seg.y0} L${seg.x1},${seg.y1}" stroke="${LINE_COLOR}" stroke-width="4" stroke-linecap="round" />
  `;
}

// A short plank bridge laid crosswise, right at each segment's own
// midpoint — the trail wanders through the same band the segment spans,
// so this always lands where the two visibly meet.
function renderBridge(x, y, angleDeg) {
  return `
    <g transform="rotate(${angleDeg.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">
      <rect x="${(x - 34).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="68" height="14" fill="#8a6a48" stroke="#4a3323" stroke-width="1.5" rx="2" />
      <line x1="${(x - 26).toFixed(1)}" y1="${(y - 7).toFixed(1)}" x2="${(x - 26).toFixed(1)}" y2="${(y + 7).toFixed(1)}" stroke="#4a3323" stroke-width="1.5" />
      <line x1="${x.toFixed(1)}" y1="${(y - 7).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 7).toFixed(1)}" stroke="#4a3323" stroke-width="1.5" />
      <line x1="${(x + 26).toFixed(1)}" y1="${(y - 7).toFixed(1)}" x2="${(x + 26).toFixed(1)}" y2="${(y + 7).toFixed(1)}" stroke="#4a3323" stroke-width="1.5" />
    </g>
  `;
}

function renderCrossings(segments) {
  return segments
    .map((seg) => {
      const midX = (seg.x0 + seg.x1) / 2;
      const midY = (seg.y0 + seg.y1) / 2;
      const angle = (Math.atan2(seg.y1 - seg.y0, seg.x1 - seg.x0) * 180) / Math.PI;
      return renderBridge(midX, midY, angle);
    })
    .join("");
}

function computeScree(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 210));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#8a6a4c" stroke="#4a3323" stroke-width="1.5" opacity="0.85" />`;
    })
    .join("");
}

const DECOR_EMOJI = ["🪨", "⛏️"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 52, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx.toFixed(1)}" y="${(p.y - 14).toFixed(1)}" font-size="20" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.4);
  const rightEdge = computeWallEdge(totalHeight, 2.5);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const segments = computeFaultSegments(totalHeight);
  const faults = segments.map(renderFault).join("");
  const crossings = renderCrossings(segments);
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot valley crossed again and again by the same dead-straight diagonal line, each crossing spanned by a little plank bridge, connecting every Line Crossing lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${faults}
      ${walls}
      ${crossings}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const faultLineTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(42, 26, 14, 0.8)",
  renderScene,
};
