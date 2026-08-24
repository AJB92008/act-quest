// Apples to Apples' own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — coastal mountains
// again, like Number Match, but mirrored: the sea sits along the RIGHT
// edge here instead of the left, so the two coastal skills don't read
// as flipped copies of each other. The signature device is a run of
// matching sea-arch PAIRS rising from the water — two identical rock
// arches, side by side, over and over — a direct visual pun on the
// skill itself: putting two like things side by side for a fair
// comparison. A few apple trees dotted along the clifftop are the
// literal nod to the skill's own name.
import { COL_W, clamp, bandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 40, max: COL_W - 220 };
const WATER_OUTER = COL_W + 40;

function computeShore(totalHeight) {
  const steps = Math.max(26, Math.round(totalHeight / 80));
  const mid = COL_W - 140;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.4 + 0.6 * edgeFalloff;
    const wobble = 42 * Math.sin(i * 0.38 + 0.9) + 22 * Math.sin(i * 1.05 + 1.6) + 11 * Math.sin(i * 2.3 + 0.3);
    const edge = mid + envelope * wobble;
    return { y, left: clamp(edge, COL_W - 210, WATER_OUTER - 20), right: WATER_OUTER };
  });
}

function renderWaterDefs() {
  return `
    <defs>
      <linearGradient id="twinCliffsDepth" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="#2c4a56" />
        <stop offset="100%" stop-color="#5a8a9c" />
      </linearGradient>
    </defs>
  `;
}

function renderWater(shore) {
  const band = bandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.left},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#twinCliffsDepth)" opacity="0.9" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round" />
  `;
}

// One rock arch — two short pillars and a curved span between them.
function renderArch(x, y, scale) {
  const w = 34 * scale;
  const h = 56 * scale;
  return `
    <rect x="${x - w / 2}" y="${y - h * 0.55}" width="${w * 0.22}" height="${h * 0.55}" fill="#8c8270" />
    <rect x="${x + w / 2 - w * 0.22}" y="${y - h * 0.55}" width="${w * 0.22}" height="${h * 0.55}" fill="#8c8270" />
    <path d="M${x - w / 2},${y - h * 0.55} Q${x},${y - h} ${x + w / 2},${y - h * 0.55} L${x + w / 2 - w * 0.22},${y - h * 0.55} Q${x},${y - h * 0.78} ${x - w / 2 + w * 0.22},${y - h * 0.55} Z" fill="#8c8270" stroke="#6b6353" stroke-width="1.5" />
  `;
}

// Twin arches — the same shape and size, planted right next to each
// other — repeated down the whole coastline.
function renderArchPairs(shore) {
  const count = Math.max(3, Math.round(shore.length / 11));
  const out = [];
  for (let g = 0; g < count; g++) {
    const idx = clamp(Math.round(((g + 0.5) / count) * shore.length), 2, shore.length - 2);
    const s = shore[idx];
    const width = WATER_OUTER - s.left;
    if (width < 55) continue;
    const scale = 0.85 + (g % 2) * 0.25;
    const gap = 46 * scale;
    const cx = s.left + Math.min(width - 30, 55);
    out.push(renderArch(cx, s.y, scale));
    out.push(renderArch(cx + gap, s.y, scale));
  }
  return out.join("");
}

function renderAppleTree(x, y) {
  return `
    <rect x="${x - 3}" y="${y - 18}" width="6" height="18" fill="#6b5a44" />
    <circle cx="${x}" cy="${y - 28}" r="16" fill="#5f8a4a" />
    <circle cx="${x - 6}" cy="${y - 30}" r="3" fill="#c0392b" />
    <circle cx="${x + 7}" cy="${y - 24}" r="3" fill="#c0392b" />
    <circle cx="${x + 2}" cy="${y - 36}" r="3" fill="#c0392b" />
  `;
}

function computeAppleTrees(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(5, Math.round(totalHeight / 340));
  return Array.from({ length: count }, (_, i) => {
    const f = (i + 0.5) / count;
    const p = nearestPosition(positions, f * totalHeight);
    const side = p.x < mid ? -1 : 1;
    const x = clamp(p.x + side * 60, BAND.min + 15, BAND.max - 15);
    return { x, y: p.y };
  });
}

function renderFoothillRock(x, y, r) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#8c8270" stroke="#6b6353" stroke-width="2" />`;
}

// A little mountain ridge silhouette on the cliff-top, recurring down
// the whole land side — coastal cliffs backed by real mountain shapes.
function renderRidgeCluster(cx, baseY) {
  const peaks = 3;
  const step = 56;
  const pts = [];
  for (let i = 0; i < peaks; i++) {
    const x = cx - step + i * step;
    const h = 55 + (i % 2) * 24;
    pts.push({ x, y: baseY - h });
  }
  const line = `M${cx - step - 20},${baseY} L${pts[0].x},${pts[0].y} L${(pts[0].x + pts[1].x) / 2},${baseY - 22} L${pts[1].x},${pts[1].y} L${(pts[1].x + pts[2].x) / 2},${baseY - 18} L${pts[2].x},${pts[2].y} L${cx + step + 20},${baseY}`;
  const cap = pts
    .map((p) => `<path d="M${p.x - 9},${p.y + 13} L${p.x},${p.y} L${p.x + 9},${p.y + 13} Z" fill="#eef2ea" opacity="0.8" />`)
    .join("");
  return `<path d="${line} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />${cap}`;
}

function computeRidges(totalHeight) {
  const count = Math.max(2, Math.round(totalHeight / 600));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    x: BAND.min + 80 + (i % 2) * 55,
  }));
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 200));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    const side = i % 2 === 0 ? 1 : -1;
    return { x: clamp(nearest.x + side * (55 + (i % 3) * 10), BAND.min + 15, BAND.max - 15), y, r: 9 + (i % 4) * 5 };
  });
}

const DECOR_EMOJI = ["🦅", "🐿️"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 50, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="21" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const shore = computeShore(totalHeight);
  const water = renderWater(shore);
  const arches = renderArchPairs(shore);
  const trees = computeAppleTrees(positions, totalHeight)
    .map((t) => renderAppleTree(t.x, t.y))
    .join("");
  const ridges = computeRidges(totalHeight)
    .map((r) => renderRidgeCluster(r.x, r.y))
    .join("");
  const scree = computeScree(positions, totalHeight)
    .map((r) => renderFoothillRock(r.x, r.y, r.r))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="82" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: rocky coastal cliffs and mountain ridges above the sea, with matching pairs of twin sea arches and a few apple trees on the clifftop, connecting every Apples to Apples lesson up to ${bossName}'s own clearing">
      ${renderWaterDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#a89b82" />
      ${water}
      ${arches}
      <g>${scree}</g>
      ${ridges}
      <g>${trees}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const twinCliffsTheme = {
  trailBand: BAND,
  mapBg: "#a89b82",
  hintColor: "rgba(35, 30, 22, 0.78)",
  renderScene,
};
