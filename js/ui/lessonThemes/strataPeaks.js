// Time Traveler's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a mountain wall along the
// RIGHT edge, built slice by slice from strata bands whose color shifts
// the whole way down: muted, weathered tones near the top (the trail's
// earliest lessons), warmer "present-day" tones through the middle, and
// vivid, almost unnaturally saturated bands near the boss's clearing at
// the bottom — a visual pun on verb tense, the same mountain literally
// showing its own past, present, and future as you travel down it. A
// narrow, quiet sliver of sea runs along the left edge — just enough to
// read as coastal without competing with the strata for attention (an
// earlier version gave it a full, elaborate shoreline, which turned two
// good ideas into one busy scene).
import { COL_W, clamp, jaggedBandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const WATER_BAND = { min: -40, max: 65 };
const BAND = { min: 225, max: COL_W - 90 };

const ANCIENT_BANDS = ["#8a8270", "#736b5a", "#5c564a"];
const PRESENT_BANDS = ["#9a8a5a", "#8a6a4a", "#6a4a3a"];
const FUTURE_BANDS = ["#8a4a5a", "#6a3a6a", "#3a2a5a"];

function bandsFor(t) {
  if (t < 0.33) return ANCIENT_BANDS;
  if (t < 0.66) return PRESENT_BANDS;
  return FUTURE_BANDS;
}

function computeWallEdge(totalHeight) {
  const steps = Math.max(45, Math.round(totalHeight / 40));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      42 * Math.sin(i * 0.4 + 2.2) +
      26 * Math.sin(i * 1.05 + 3.3) +
      17 * Math.sin(i * 2.3 + 1.4) +
      10 * Math.sin(i * 5.2 + 4.4);
    return { y, depth: clamp(56 + wobble, 12, 84) };
  });
}

// Slice by slice down the wall, each one banded by the era its height
// falls into — the wall itself is the strata.
function renderStrataWall(edge, totalHeight) {
  const slices = [];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i];
    const b = edge[i + 1];
    const t = ((a.y + b.y) / 2) / totalHeight;
    const bands = bandsFor(t);
    const color = bands[i % bands.length];
    const ax = COL_W - a.depth;
    const bx = COL_W - b.depth;
    const outerX = COL_W + 40;
    slices.push(`<path d="M${outerX},${a.y} L${ax},${a.y} L${bx},${b.y} L${outerX},${b.y} Z" fill="${color}" />`);
  }
  return slices.join("");
}

// The wall's outer edge (away from the trail, off past the frame) is a
// flat-colored slice running the full height of the canvas — even
// off-canvas, the visible sliver right at x=COL_W is a hard,
// dead-straight cut, since a solid fill just stops wherever the viewBox
// does. Each slice here has its own strata color, so rather than a
// separate gradient per color, a single vignette overlay fades from the
// ground's own color (opaque, right at the true edge) to fully
// transparent — painted on top of whichever strata color happens to sit
// there, so the wall dissolves into the ground before the frame
// boundary regardless of which era's palette it's in. The jagged inner
// (trail-facing) edge is untouched.
function renderDefs() {
  return `
    <defs>
      <linearGradient id="strataPeaksRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 70}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#948a7a" stop-opacity="1" />
        <stop offset="100%" stop-color="#948a7a" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="strataPeaksWaterDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2e4e5c" />
        <stop offset="100%" stop-color="#5f95a8" />
      </linearGradient>
      <linearGradient id="strataPeaksWaterFade" x1="0" y1="0" x2="70" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#948a7a" stop-opacity="1" />
        <stop offset="100%" stop-color="#948a7a" stop-opacity="0" />
      </linearGradient>
    </defs>
  `;
}

function renderOuterFadeOverlay(totalHeight) {
  return `<rect x="${COL_W - 70}" y="0" width="70" height="${totalHeight}" fill="url(#strataPeaksRightFade)" />`;
}

function computeShore(totalHeight) {
  const steps = Math.max(36, Math.round(totalHeight / 48));
  const mid = 22;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.35 + 0.65 * edgeFalloff;
    const wobble = 16 * Math.sin(i * 0.33 + 0.7) + 9 * Math.sin(i * 0.88 + 1.9) + 5 * Math.sin(i * 1.95 + 0.5);
    const edge = mid + envelope * wobble;
    return { y, left: WATER_BAND.min, right: clamp(edge, 8, WATER_BAND.max) };
  });
}

function renderWaterEdgeFade(totalHeight) {
  return `<rect x="0" y="0" width="70" height="${totalHeight}" fill="url(#strataPeaksWaterFade)" />`;
}

function renderWater(shore) {
  const band = jaggedBandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#strataPeaksWaterDepth)" opacity="0.7" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="2" fill="none" opacity="0.3" stroke-linecap="round" />
  `;
}

// A small progression of one-off accents — a fossil near the ancient
// top, a little sparkle near the vivid future bottom.
function renderTimeAccents(positions, totalHeight) {
  const early = positions[Math.floor(positions.length * 0.1)];
  const late = positions[Math.floor(positions.length * 0.92)];
  const sideEarly = early.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
  const sideLate = late.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
  return `
    <text x="${clamp(early.x - sideEarly * 55, BAND.min + 10, BAND.max - 10)}" y="${early.y - 10}" font-size="22" text-anchor="middle" opacity="0.85">🦴</text>
    <text x="${clamp(late.x - sideLate * 55, BAND.min + 10, BAND.max - 10)}" y="${late.y - 10}" font-size="22" text-anchor="middle" opacity="0.9">✨</text>
  `;
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
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b6353" opacity="0.6" />`;
    })
    .join("");
}

const DECOR_EMOJI = ["🐐", "🦅"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 48, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="20" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const wallEdge = computeWallEdge(totalHeight);
  const wall = renderStrataWall(wallEdge, totalHeight);
  const wallOutline = `<path d="${wallEdge.map((e, i) => `${i === 0 ? "M" : "L"}${COL_W - e.depth},${e.y}`).join(" ")}" fill="none" stroke="#2c281f" stroke-width="1.5" opacity="0.3" />`;
  const shore = computeShore(totalHeight);
  const water = renderWater(shore);
  const scree = renderScree(positions, totalHeight);
  const accents = renderTimeAccents(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a mountain wall whose rock strata visibly age from weathered to vivid down its length, with a narrow sliver of sea along the opposite edge, connecting every Time Traveler lesson up to ${bossName}'s own clearing">
      ${renderDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#948a7a" />
      <g>${scree}</g>
      ${water}
      ${renderWaterEdgeFade(totalHeight)}
      ${wall}
      ${wallOutline}
      ${renderOuterFadeOverlay(totalHeight)}
      ${accents}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const strataPeaksTheme = {
  trailBand: BAND,
  mapBg: "#948a7a",
  hintColor: "rgba(250, 245, 235, 0.85)",
  renderScene,
};
