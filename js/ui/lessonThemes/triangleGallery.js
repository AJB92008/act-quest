// Triangle Mastery's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, its floor scattered with crystal shards cut into
// every triangle type this skill covers — right, equilateral,
// isosceles, scalene — a genuinely different one at each stop rather
// than one shape repeated, "mastery" meaning fluency across all of
// them, not just one.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#6c8398";
const WALL_STROKE = "#3f4a56";
const SHARD_SHADES = ["#95a8b8", "#c9d4dc", "#647c92"];

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      42 * Math.sin(i * 0.42 + phase) +
      26 * Math.sin(i * 1.1 + phase * 1.6) +
      17 * Math.sin(i * 2.4 + phase * 0.6) +
      10 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(56 + wobble, 14, 88) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="triangleGalleryLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="triangleGalleryRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#triangleGalleryLeftFade)" : "url(#triangleGalleryRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

function shard(pts, shade, rot, cx, cy) {
  const p = pts.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
  return `<polygon points="${p}" fill="${shade}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.92" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`;
}

function renderRightTriangle(x, y, s, shade, rot) {
  return shard(
    [
      [x - s * 0.5, y + s * 0.4],
      [x + s * 0.5, y + s * 0.4],
      [x - s * 0.5, y - s * 0.5],
    ],
    shade,
    rot,
    x,
    y
  );
}

function renderEquilateral(x, y, s, shade, rot) {
  return shard(
    [
      [x, y - s * 0.58],
      [x + s * 0.5, y + s * 0.29],
      [x - s * 0.5, y + s * 0.29],
    ],
    shade,
    rot,
    x,
    y
  );
}

function renderIsosceles(x, y, s, shade, rot) {
  return shard(
    [
      [x, y - s * 0.75],
      [x + s * 0.32, y + s * 0.35],
      [x - s * 0.32, y + s * 0.35],
    ],
    shade,
    rot,
    x,
    y
  );
}

function renderScalene(x, y, s, shade, rot) {
  return shard(
    [
      [x - s * 0.48, y + s * 0.3],
      [x + s * 0.4, y + s * 0.44],
      [x - s * 0.1, y - s * 0.5],
    ],
    shade,
    rot,
    x,
    y
  );
}

const SHARDS = [renderRightTriangle, renderEquilateral, renderIsosceles, renderScalene];

function renderShards(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 30, BAND.max - 30);
      const shardFn = SHARDS[i % SHARDS.length];
      const shade = SHARD_SHADES[i % SHARD_SHADES.length];
      return shardFn(dx, p.y + 30, 46 + (i % 3) * 10, shade, (i * 47) % 360);
    })
    .join("");
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 230));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(positions, totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#95a8b8" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.7" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const scree = renderScree(positions, totalHeight);
  const shards = renderShards(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, its floor scattered with crystal shards cut into a different triangle type at every stop, connecting every Triangle Mastery lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${shards}</g>
    </svg>
  `;
}

export const triangleGalleryTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(230, 238, 244, 0.85)",
  renderScene,
};
