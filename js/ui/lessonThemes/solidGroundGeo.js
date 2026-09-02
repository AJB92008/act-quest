// Solid Ground's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a Shalefoot valley
// (blue-gray shale, matching Numeria Peaks' own Geometry zone) between
// two jagged walls, planted with actual 3D solids rather than flat
// shapes: a cube, a cylinder, a cone, a sphere, each drawn with real
// shading faces so it reads as a volume sitting on the ground, not an
// icon floating over it — a different solid at every stop, echoing the
// skill's own range (volume, surface area, inscribed shapes) the same
// way Algebra Toolkit's tools do.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#5f7688";
const WALL_STROKE = "#2b3742";
const SOLID_SHADES = ["#7d93a8", "#647c92", "#95a8b8"];

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
      <linearGradient id="solidGroundGeoLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="solidGroundGeoRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
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
  const fill = side === "left" ? "url(#solidGroundGeoLeftFade)" : "url(#solidGroundGeoRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

function renderCube(x, baseY, s) {
  const topY = baseY - s * 1.3;
  const midY = baseY - s * 0.65;
  return `
    <polygon points="${x},${topY.toFixed(1)} ${(x + s).toFixed(1)},${midY.toFixed(1)} ${x},${baseY.toFixed(1)} ${(x - s).toFixed(1)},${midY.toFixed(1)}" fill="${SOLID_SHADES[2]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <polygon points="${x},${baseY.toFixed(1)} ${(x + s).toFixed(1)},${midY.toFixed(1)} ${(x + s).toFixed(1)},${(midY + s).toFixed(1)} ${x},${(baseY + s * 0.65).toFixed(1)}" fill="${SOLID_SHADES[0]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <polygon points="${x},${baseY.toFixed(1)} ${(x - s).toFixed(1)},${midY.toFixed(1)} ${(x - s).toFixed(1)},${(midY + s).toFixed(1)} ${x},${(baseY + s * 0.65).toFixed(1)}" fill="${SOLID_SHADES[1]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
  `;
}

function renderCylinder(x, baseY, r, h) {
  return `
    <ellipse cx="${x}" cy="${baseY.toFixed(1)}" rx="${r}" ry="${(r * 0.4).toFixed(1)}" fill="${SOLID_SHADES[1]}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.92" />
    <rect x="${(x - r).toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${r * 2}" height="${h}" fill="${SOLID_SHADES[0]}" stroke="none" />
    <line x1="${(x - r).toFixed(1)}" y1="${(baseY - h).toFixed(1)}" x2="${(x - r).toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <line x1="${(x + r).toFixed(1)}" y1="${(baseY - h).toFixed(1)}" x2="${(x + r).toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <ellipse cx="${x}" cy="${(baseY - h).toFixed(1)}" rx="${r}" ry="${(r * 0.4).toFixed(1)}" fill="${SOLID_SHADES[2]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
  `;
}

function renderCone(x, baseY, r, h) {
  return `
    <ellipse cx="${x}" cy="${baseY.toFixed(1)}" rx="${r}" ry="${(r * 0.4).toFixed(1)}" fill="${SOLID_SHADES[1]}" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.92" />
    <path d="M${(x - r).toFixed(1)},${baseY.toFixed(1)} L${x},${(baseY - h).toFixed(1)} L${(x + r).toFixed(1)},${baseY.toFixed(1)} Z" fill="${SOLID_SHADES[0]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
  `;
}

function renderSphere(x, y, r) {
  return `
    <circle cx="${x}" cy="${y.toFixed(1)}" r="${r}" fill="${SOLID_SHADES[0]}" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <path d="M${(x - r * 0.7).toFixed(1)},${y.toFixed(1)} A${(r * 0.7).toFixed(1)},${(r * 0.35).toFixed(1)} 0 0 1 ${(x + r * 0.7).toFixed(1)},${y.toFixed(1)}" stroke="${SOLID_SHADES[2]}" stroke-width="2" fill="none" opacity="0.7" />
    <ellipse cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.3).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" ry="${(r * 0.18).toFixed(1)}" fill="${SOLID_SHADES[2]}" opacity="0.55" />
  `;
}

const SOLIDS = [
  (x, y, s) => renderCube(x, y, s * 0.6),
  (x, y, s) => renderCylinder(x, y, s * 0.5, s * 1.3),
  (x, y, s) => renderCone(x, y, s * 0.55, s * 1.2),
  (x, y, s) => renderSphere(x, y - s * 0.5, s * 0.5),
];

function renderSolids(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 62, BAND.min + 40, BAND.max - 40);
      return SOLIDS[i % SOLIDS.length](dx, p.y + 34, 34 + (i % 3) * 6);
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
  const solids = renderSolids(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a Shalefoot valley between two jagged rock walls, planted with a different real 3D solid at every stop — a cube, a cylinder, a cone, a sphere — connecting every Solid Ground lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${solids}</g>
    </svg>
  `;
}

export const solidGroundGeoTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(230, 238, 244, 0.85)",
  renderScene,
};
