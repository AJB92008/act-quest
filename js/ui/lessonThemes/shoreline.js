// Case Closed's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a sandy beach where a swamp
// meets the shore: mostly open sand (the trail's own band), with a strip
// of murky swamp water and reeds confined along one edge. A little
// suitcase washed up in the sand is the pun on the skill's own name (a
// "case," closed).
import { COL_W, clamp, bandPath, nearestPosition, renderTrailPath, blobPoints, closedBlobPath } from "../lessonTerrain.js";

const WATER_BAND = { min: -40, max: 208 };
const BAND = { min: 235, max: COL_W - 40 };

// The water's shore edge is a real coastline, not a straight-sided
// canal: four overlapping wave frequencies (a broad regional bay, a
// couple of medium bays/points visible within a single screen's worth
// of scroll, and fine jagged jitter on top) so it reads as irregular at
// every zoom level, not just once over the whole scroll. A falloff tied
// to a fixed pixel distance from the very top/bottom of the frame (not
// scaled to the skill's total height) pulls the water narrower right at
// the frame's edges, so even a long scene still tapers visibly there
// instead of just getting clipped by the viewport.
function computeShore(totalHeight) {
  const steps = Math.max(28, Math.round(totalHeight / 70));
  const mid = 95;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 140, (totalHeight - y) / 140), 0, 1);
    const envelope = 0.35 + 0.65 * edgeFalloff;
    const wobble =
      50 * Math.sin(i * 0.32 + 0.6) +
      34 * Math.sin(i * 0.85 + 2.1) +
      18 * Math.sin(i * 1.9 + 0.4) +
      8 * Math.sin(i * 4.1 + 1.2);
    const edge = mid + envelope * wobble;
    return { y, left: WATER_BAND.min, right: clamp(edge, 20, WATER_BAND.max) };
  });
}

function renderWater(totalHeight) {
  const shore = computeShore(totalHeight);
  const band = bandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="#4f5d3f" opacity="0.85" />
    <path d="${foamLine}" stroke="#e8dfb8" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round" />
  `;
}

// A couple of sandy points poking into the water — breaks up the shore
// edge further and keeps it from reading as one clean boundary line.
function renderSandPoints(totalHeight) {
  const shore = computeShore(totalHeight);
  return [0.28, 0.7].map((f) => {
    const idx = clamp(Math.round(shore.length * f), 1, shore.length - 2);
    const s = shore[idx];
    const pts = blobPoints(s.right - 18, s.y, 34, 9, f * 10);
    return `<path d="${closedBlobPath(pts)}" fill="#dfd0a0" opacity="0.92" />`;
  }).join("");
}

function renderReedsAtShore(totalHeight) {
  const shore = computeShore(totalHeight);
  return shore
    .filter((_, i) => i % 3 === 1)
    .map((s) => {
      const x = s.right + 6;
      return Array.from({ length: 3 }, (_, j) => {
        const dx = x + (j - 1) * 6;
        const h = 18 + (j % 2) * 8;
        return `<path d="M${dx},${s.y} Q${dx + 3},${s.y - h * 0.6} ${dx},${s.y - h}" stroke="#6b7a45" stroke-width="2" fill="none" opacity="0.8" />`;
      }).join("");
    })
    .join("");
}

function computeDriftwood(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return [0.3, 0.72].map((f) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const x = clamp(mid + side * (BAND.max - BAND.min) * 0.3, BAND.min + 30, BAND.max - 30);
    return { x, y: hy };
  });
}

function renderDriftwood({ x, y }) {
  return `<rect x="${x - 26}" y="${y - 5}" width="52" height="10" rx="5" fill="#a9987a" transform="rotate(-12 ${x} ${y})" />`;
}

// The suitcase sits at roughly the trail's own midpoint — the one "case"
// in the whole scene, deliberately singular rather than repeated.
function renderSuitcase(positions) {
  const p = positions[Math.floor(positions.length * 0.55)];
  const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
  const x = clamp(p.x + side * 70, BAND.min + 30, BAND.max - 30);
  const y = p.y + 30;
  return `<text x="${x}" y="${y}" font-size="34" text-anchor="middle">🧳</text>`;
}

const DECOR_EMOJI = ["🐚", "🦀", "🐚", "⭐"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 2)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 60, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="24" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const water = renderWater(totalHeight);
  const sandPoints = renderSandPoints(totalHeight);
  const reeds = renderReedsAtShore(totalHeight);
  const driftwood = computeDriftwood(positions, totalHeight).map(renderDriftwood).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="82" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a sandy beach where a swamp meets the shore, a suitcase washed up in the sand, and a trail connecting every Case Closed lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#dfd0a0" />
      ${water}
      ${sandPoints}
      <g>${reeds}</g>
      <g>${driftwood}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      ${renderSuitcase(positions)}
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const shorelineTheme = {
  trailBand: BAND,
  mapBg: "#dfd0a0",
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
