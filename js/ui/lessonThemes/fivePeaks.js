// Final Five's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — one continuous Ironroot
// wall (rust-brown rock, matching Numeria Peaks' own Algebra zone, the
// same single-wall technique as Wordwood Isle's own Time Traveler)
// along the right edge, carrying exactly five named, numbered peaks
// rather than an unbroken jagged range — each one taller and darker
// than the last, right up to the fifth and tallest just before the
// boss's own clearing, a visual pun on the skill itself: the ACT's own
// toughest final stretch, getting harder one peak at a time.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 70, max: COL_W - 130 };
const WALL_BASE = "#ad7f5e";
const WALL_STROKE = "#3f2e1f";
const PEAK_COLORS = ["#c2926f", "#a8785f", "#8a5f47", "#6b4530", "#4a3323"];

function computeWallEdge(totalHeight) {
  const steps = Math.max(45, Math.round(totalHeight / 40));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      30 * Math.sin(i * 0.4 + 0.6) + 18 * Math.sin(i * 1.05 + 1.9) + 11 * Math.sin(i * 2.3 + 0.8) + 6 * Math.sin(i * 5.2 + 2.4);
    return { y, depth: clamp(46 + wobble, 14, 68) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="fivePeaksWallFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="1" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="0" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge) {
  const line = edge.map((e, i) => `${i === 0 ? "M" : "L"}${(COL_W - e.depth).toFixed(1)},${e.y.toFixed(1)}`).join(" ");
  const fillPath = `${line} L${COL_W + 40},${edge[edge.length - 1].y} L${COL_W + 40},0 Z`;
  return `<path d="${fillPath}" fill="#8c7058" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

function renderWallOuterFade(totalHeight) {
  return `<rect x="${COL_W - 60}" y="0" width="60" height="${totalHeight}" fill="url(#fivePeaksWallFade)" />`;
}

// One numbered, flagged peak — taller and darker than the one before it
// (see PEAK_COLORS), rising straight out of the wall's own edge.
function renderNamedPeak(baseX, baseY, index) {
  const h = 130 + index * 34;
  const w = 66 + index * 8;
  const color = PEAK_COLORS[index];
  const tipX = baseX - w * 0.15;
  const tipY = baseY - h;
  return `
    <path d="M${(baseX - w).toFixed(1)},${baseY.toFixed(1)} L${tipX.toFixed(1)},${tipY.toFixed(1)} L${(baseX + w * 0.7).toFixed(1)},${baseY.toFixed(1)} Z" fill="${color}" stroke="${WALL_STROKE}" stroke-width="2.5" />
    <path d="M${(tipX - w * 0.32).toFixed(1)},${(tipY + h * 0.42).toFixed(1)} L${tipX.toFixed(1)},${tipY.toFixed(1)} L${(tipX + w * 0.3).toFixed(1)},${(tipY + h * 0.4).toFixed(1)} L${(tipX + w * 0.16).toFixed(1)},${(tipY + h * 0.3).toFixed(1)} L${tipX.toFixed(1)},${(tipY + h * 0.46).toFixed(1)} L${(tipX - w * 0.16).toFixed(1)},${(tipY + h * 0.3).toFixed(1)} Z" fill="#eef2ea" opacity="0.85" />
    <line x1="${tipX.toFixed(1)}" y1="${tipY.toFixed(1)}" x2="${tipX.toFixed(1)}" y2="${(tipY - 24).toFixed(1)}" stroke="${WALL_STROKE}" stroke-width="2" />
    <path d="M${tipX.toFixed(1)},${(tipY - 24).toFixed(1)} L${(tipX + 26).toFixed(1)},${(tipY - 19).toFixed(1)} L${tipX.toFixed(1)},${(tipY - 14).toFixed(1)} Z" fill="#efe4cf" stroke="${WALL_STROKE}" stroke-width="1.5" />
    <text x="${(tipX + 9).toFixed(1)}" y="${(tipY - 16.5).toFixed(1)}" font-size="10" font-weight="700" fill="${WALL_STROKE}" text-anchor="middle">${index + 1}</text>
  `;
}

function computeNamedPeaks(edge, totalHeight) {
  return Array.from({ length: 5 }, (_, i) => {
    const y = ((i + 0.7) / 5) * totalHeight;
    const nearest = edge.reduce((best, e) => (Math.abs(e.y - y) < Math.abs(best.y - y) ? e : best));
    return { x: COL_W - nearest.depth, y: nearest.y, index: i };
  });
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 210));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(positions, totalHeight)
    .map(({ y, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x - (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#9c8064" stroke="${WALL_STROKE}" stroke-width="1.5" opacity="0.75" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const edge = computeWallEdge(totalHeight);
  const wall = renderWall(edge);
  const peaks = computeNamedPeaks(edge, totalHeight)
    .map((p) => renderNamedPeak(p.x, p.y, p.index))
    .join("");
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot wall carrying five numbered peaks, each taller and darker than the last, connecting every Final Five lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${wall}
      ${peaks}
      ${renderWallOuterFade(totalHeight)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
    </svg>
  `;
}

export const fivePeaksTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(42, 26, 14, 0.8)",
  renderScene,
};
