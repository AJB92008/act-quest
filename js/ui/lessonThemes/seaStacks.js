// Number Match's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — coastal mountains: rocky
// cliff terrain (the trail's own band) dominates, with the ocean
// confined along one edge, same technique as Case Closed's shoreline
// but re-colored for open sea instead of swamp. The signature device is
// a run of sea stacks rising out of the water in deliberately countable
// groups — one alone, then a pair, then a cluster of three — a visual
// pun on the skill itself: matching a subject's number, singular or
// plural, to its verb.
import { COL_W, clamp, bandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const WATER_BAND = { min: -40, max: 190 };
const BAND = { min: 220, max: COL_W - 40 };

function computeShore(totalHeight) {
  const steps = Math.max(26, Math.round(totalHeight / 80));
  const mid = 85;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.4 + 0.6 * edgeFalloff;
    const wobble = 45 * Math.sin(i * 0.4 + 0.5) + 24 * Math.sin(i * 1.1 + 2.0) + 12 * Math.sin(i * 2.4 + 0.9);
    const edge = mid + envelope * wobble;
    return { y, left: WATER_BAND.min, right: clamp(edge, 20, WATER_BAND.max) };
  });
}

function renderWaterDefs() {
  return `
    <defs>
      <linearGradient id="seaStacksDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2e4e5c" />
        <stop offset="100%" stop-color="#5f95a8" />
      </linearGradient>
    </defs>
  `;
}

function renderWater(shore) {
  const band = bandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#seaStacksDepth)" opacity="0.9" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round" />
  `;
}

function renderSeaStack(x, y, h) {
  const w = 16 + h * 0.12;
  return `
    <ellipse cx="${x}" cy="${y + 4}" rx="${w * 0.8}" ry="5" fill="rgba(10,20,20,0.2)" />
    <path d="M${x - w / 2},${y} Q${x - w * 0.6},${y - h * 0.5} ${x - w * 0.3},${y - h} L${x + w * 0.3},${y - h} Q${x + w * 0.6},${y - h * 0.5} ${x + w / 2},${y} Z" fill="#8c8270" stroke="#6b6353" stroke-width="1.5" />
    <ellipse cx="${x}" cy="${y - h}" rx="${w * 0.32}" ry="6" fill="#8fa96a" opacity="0.85" />
  `;
}

// Deliberately countable groups: one stack alone, then a pair, then a
// cluster of three, repeating down the whole coastline.
function renderStackGroups(shore) {
  const groupPattern = [1, 2, 3];
  const groupCount = Math.max(3, Math.round(shore.length / 10));
  const out = [];
  for (let g = 0; g < groupCount; g++) {
    const count = groupPattern[g % groupPattern.length];
    const idx = clamp(Math.round(((g + 0.5) / groupCount) * shore.length), 2, shore.length - 2);
    const s = shore[idx];
    if (s.right < 45) continue;
    const spread = Math.min(46, s.right - 20);
    for (let k = 0; k < count; k++) {
      const fx = count === 1 ? 0.5 : k / (count - 1);
      const x = clamp(15 + fx * spread, 12, s.right - 8);
      const h = 42 + ((g + k) % 3) * 12;
      out.push(renderSeaStack(x, s.y, h));
    }
  }
  return out.join("");
}

function renderReedsAtShore(shore) {
  return shore
    .filter((_, i) => i % 5 === 2)
    .map((s) => `<path d="M${s.right + 8},${s.y} Q${s.right + 12},${s.y - 16} ${s.right + 6},${s.y - 26}" stroke="#7a8a5a" stroke-width="2" fill="none" opacity="0.7" />`)
    .join("");
}

function renderFoothillRock(x, y, r) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#8c8270" stroke="#6b6353" stroke-width="2" />`;
}

// A little mountain ridge silhouette on the cliff-top, recurring down
// the whole land side — coastal cliffs backed by real mountain shapes,
// not just flat rocky ground.
function renderRidgeCluster(cx, baseY) {
  const peaks = 3;
  const step = 60;
  const pts = [];
  for (let i = 0; i < peaks; i++) {
    const x = cx - step + i * step;
    const h = 60 + (i % 2) * 26;
    pts.push({ x, y: baseY - h });
  }
  const line = `M${cx - step - 20},${baseY} L${pts[0].x},${pts[0].y} L${(pts[0].x + pts[1].x) / 2},${baseY - 24} L${pts[1].x},${pts[1].y} L${(pts[1].x + pts[2].x) / 2},${baseY - 20} L${pts[2].x},${pts[2].y} L${cx + step + 20},${baseY}`;
  const cap = pts
    .map((p) => `<path d="M${p.x - 10},${p.y + 14} L${p.x},${p.y} L${p.x + 10},${p.y + 14} Z" fill="#eef2ea" opacity="0.8" />`)
    .join("");
  return `<path d="${line} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />${cap}`;
}

function computeRidges(totalHeight) {
  const count = Math.max(2, Math.round(totalHeight / 620));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    x: BAND.min + 90 + (i % 2) * 60,
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

const DECOR_EMOJI = ["🦅", "🐚"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 55, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="22" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const shore = computeShore(totalHeight);
  const water = renderWater(shore);
  const stacks = renderStackGroups(shore);
  const reeds = renderReedsAtShore(shore);
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
      aria-label="A close-up corner of Wordwood Isle: rocky coastal cliffs and mountain ridges above the sea, with sea stacks rising from the water in countable groups of one, two, and three, connecting every Number Match lesson up to ${bossName}'s own clearing">
      ${renderWaterDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#9e9280" />
      ${water}
      ${stacks}
      <g>${reeds}</g>
      <g>${scree}</g>
      ${ridges}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const seaStacksTheme = {
  trailBand: BAND,
  mapBg: "#9e9280",
  hintColor: "rgba(35, 30, 22, 0.78)",
  renderScene,
};
