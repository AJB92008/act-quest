// Final Five's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — one continuous Ironroot
// wall (rust-brown rock, matching Numeria Peaks' own Algebra zone, the
// same single-wall technique as Wordwood Isle's own Time Traveler)
// along the right edge, carrying exactly five named, numbered peaks
// rather than an unbroken jagged range — each one taller and darker
// than the last. The sky itself escalates right alongside them: clear
// and gold at the first peak, gathering cloud by the third, full storm
// with lightning and rain by the fifth and tallest, right before the
// boss's own clearing — the ACT's own toughest final stretch, getting
// harder (and the weather turning right along with it) one peak at a
// time, not just a taller silhouette.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 70, max: COL_W - 130 };
const WALL_BASE = "#ad7f5e";
const WALL_STROKE = "#3f2e1f";
const PEAK_COLORS = ["#c2926f", "#a8785f", "#8a5f47", "#6b4530", "#4a3323"];
// The same (i+0.7)/5 fraction computeNamedPeaks positions each peak at —
// shared here so the sky's own storm progression lands exactly in step
// with whichever peak it's escalating toward, not just approximately.
const PEAK_FRACTIONS = [0.14, 0.34, 0.54, 0.74, 0.94];
const SKY_COLORS = ["#e8c98f", "#c9b48a", "#9c8f78", "#5f574a", "#2e2a26"];
const CLOUD_COLORS = ["#fdf6e3", "#e8dfc9", "#b8ac96", "#7a7268", "#4a463f"];

function computeWallEdge(totalHeight) {
  const steps = Math.max(45, Math.round(totalHeight / 40));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      30 * Math.sin(i * 0.4 + 0.6) + 18 * Math.sin(i * 1.05 + 1.9) + 11 * Math.sin(i * 2.3 + 0.8) + 6 * Math.sin(i * 5.2 + 2.4);
    return { y, depth: clamp(46 + wobble, 14, 68) };
  });
}

// The sky gradient's own stops land exactly on PEAK_FRACTIONS (so each
// peak arrives already inside its own weather), plus the wall's usual
// fade-to-transparent so the rock dissolves into whatever sky is behind
// it at that height instead of a flat color.
function renderDefs() {
  const skyStops = PEAK_FRACTIONS.map((f, i) => `<stop offset="${(f * 100).toFixed(1)}%" stop-color="${SKY_COLORS[i]}" />`).join("");
  return `
    <defs>
      <linearGradient id="fivePeaksSky" x1="0" y1="0" x2="0" y2="1">
        ${skyStops}
      </linearGradient>
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
  return PEAK_FRACTIONS.map((f, i) => {
    const y = f * totalHeight;
    const nearest = edge.reduce((best, e) => (Math.abs(e.y - y) < Math.abs(best.y - y) ? e : best));
    return { x: COL_W - nearest.depth, y: nearest.y, index: i };
  });
}

// A cluster of soft overlapping puffs — more of them, bigger, and
// darker at each successive zone (CLOUD_COLORS/index), the same
// gathering-storm read the sky gradient behind it is already giving.
function renderCloudCluster(cx, cy, index) {
  const color = CLOUD_COLORS[index];
  const count = 2 + index;
  const scale = 0.8 + index * 0.15;
  const puffs = Array.from({ length: count }, (_, i) => {
    const dx = (i - (count - 1) / 2) * 36 * scale;
    const dy = Math.sin(i * 1.7 + index) * 9 * scale;
    const r = (20 + (i % 3) * 7) * scale;
    return `<ellipse cx="${(cx + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" rx="${(r * 1.35).toFixed(1)}" ry="${r.toFixed(1)}" fill="${color}" opacity="0.88" />`;
  }).join("");
  return `<g>${puffs}</g>`;
}

// A jagged bolt dropping out of the cloud cluster above it — only the
// last two zones (peaks 4 and 5) are far enough into the storm to earn
// one.
function renderLightning(x, y, h, seed) {
  const pts = [
    { x, y },
    { x: x - 12 - 4 * Math.sin(seed), y: y + h * 0.28 },
    { x: x + 8, y: y + h * 0.32 },
    { x: x - 16, y: y + h * 0.66 },
    { x: x + 6, y: y + h * 0.7 },
    { x: x - 10, y: y + h },
  ];
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return `
    <path d="${d}" stroke="#ffe27a" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" />
    <path d="${d}" stroke="#fff8dc" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" />
  `;
}

// Wind-swept rain streaks — reserved for the fifth and final zone, the
// only one that's reached full storm.
function renderRain(cx, cy, count) {
  return Array.from({ length: count }, (_, i) => {
    const x = cx + (i - count / 2) * 16;
    const y0 = cy + 14;
    return `<line x1="${x.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(x - 10).toFixed(1)}" y2="${(y0 + 40).toFixed(1)}" stroke="#a8c0d4" stroke-width="2" opacity="0.55" stroke-linecap="round" />`;
  }).join("");
}

// One "chapter" of weather per peak, planted in the open valley at that
// peak's own height so each arrives already inside its own storm stage
// rather than the sky just being a flat backdrop behind the real scene.
function renderStormZone(y, index) {
  const cx = 230;
  const clouds = renderCloudCluster(cx, y - 40, index);
  const lightning = index >= 3 ? renderLightning(cx + 60, y - 10, 90, index) : "";
  const rain = index === 4 ? renderRain(cx, y + 30, 7) : "";
  return clouds + lightning + rain;
}

function renderStorm(totalHeight) {
  return PEAK_FRACTIONS.map((f, i) => renderStormZone(f * totalHeight, i)).join("");
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
  const storm = renderStorm(totalHeight);
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot wall carrying five numbered peaks, each taller and darker than the last, the sky itself turning from clear to full storm alongside them, connecting every Final Five lesson up to ${bossName}'s own clearing">
      ${renderDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#fivePeaksSky)" />
      ${storm}
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
  mapBg: SKY_COLORS[0],
  hintColor: "rgba(42, 26, 14, 0.8)",
  renderScene,
};
