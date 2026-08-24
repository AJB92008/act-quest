// Case Closed's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a sandy beach where a swamp
// meets the shore: mostly open sand (the trail's own band), with a strip
// of murky swamp water and reeds confined along one edge. The water
// itself carries real detail — a depth gradient, ripple texture, foam
// scallops rolling in at its outer edge, and a bit of life (fish, a
// frog, lily pads) — so it never reads as a flat color block. A little
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

// The outer edge of the water (away from the sand) sits at a constant
// x, off past the left of the frame — by design, so it reads as open
// water continuing beyond what's visible. But a flat color run up
// against a straight clip line still looks like a wall, not a coast, so
// this edge gets its own treatment: a run of foam scallops (little wave
// crests rolling in from off-frame) right at the boundary, on top of a
// depth gradient and ripple texture across the whole body of water so
// nowhere in it reads as a flat, undetailed fill.
function renderWaterDefs() {
  return `
    <defs>
      <linearGradient id="caseClosedWaterDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#333d27" />
        <stop offset="100%" stop-color="#61754c" />
      </linearGradient>
    </defs>
  `;
}

function renderWater(totalHeight, shore) {
  const band = bandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#caseClosedWaterDepth)" opacity="0.88" />
    <path d="${foamLine}" stroke="#e8dfb8" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round" />
  `;
}

// Ripple lines scattered across the water's own surface, each one only
// as wide as the water is at that row, so the texture always stays
// inside the shore boundary.
function renderRipples(shore) {
  return shore
    .filter((_, i) => i % 4 === 2)
    .map((s, i) => {
      const w = s.right + 30;
      if (w < 40) return "";
      const y = s.y + (i % 2 === 0 ? -8 : 8);
      return `<path d="M-20,${y} Q${w * 0.28},${y - 7} ${w * 0.55},${y} Q${w * 0.78},${y + 7} ${w},${y}" stroke="#9fb083" stroke-width="2" fill="none" opacity="0.3" stroke-linecap="round" />`;
    })
    .join("");
}

// A repeating scallop right at the frame's own edge — small wave crests
// rolling in from off-screen, so the outer boundary of the water reads
// as a wave line instead of a flat clipped cut.
function renderEdgeFoam(totalHeight) {
  const count = Math.max(12, Math.round(totalHeight / 100));
  return Array.from({ length: count }, (_, i) => {
    const y = ((totalHeight / count) * i) + (totalHeight / count) * 0.5;
    return `<path d="M-25,${y - 16} Q14,${y - 14} 12,${y} Q14,${y + 14} -25,${y + 16}" fill="none" stroke="#dfe8c8" stroke-width="2.5" opacity="0.4" stroke-linecap="round" />`;
  }).join("");
}

const WATER_LIFE = ["🐟", "🐸", "🪷"];

// Fish, a frog, and a lily pad or two, floating out on the water itself
// rather than clustered at the shore like the reeds/driftwood.
function renderWaterLife(shore) {
  return shore
    .filter((_, i) => i % 7 === 3 && shore[i].right > 55)
    .map((s, i) => {
      const x = clamp(s.right * 0.42, 15, s.right - 20);
      return `<text x="${x}" y="${s.y}" font-size="20" text-anchor="middle" opacity="0.9">${WATER_LIFE[i % WATER_LIFE.length]}</text>`;
    })
    .join("");
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
  const shore = computeShore(totalHeight);
  const water = renderWater(totalHeight, shore);
  const ripples = renderRipples(shore);
  const edgeFoam = renderEdgeFoam(totalHeight);
  const waterLife = renderWaterLife(shore);
  const sandPoints = renderSandPoints(totalHeight);
  const reeds = renderReedsAtShore(totalHeight);
  const driftwood = computeDriftwood(positions, totalHeight).map(renderDriftwood).join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="82" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a sandy beach where a swamp meets the shore, a suitcase washed up in the sand, and a trail connecting every Case Closed lesson up to ${bossName}'s own clearing">
      ${renderWaterDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#dfd0a0" />
      ${water}
      <g>${ripples}</g>
      <g>${edgeFoam}</g>
      <g>${waterLife}</g>
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
