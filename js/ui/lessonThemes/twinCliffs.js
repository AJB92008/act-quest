// Apples to Apples' own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a rocky mountain
// wall along the RIGHT edge (mirrored from Number Match's own wall
// setup, so the two non-coastal hillside skills don't read as flipped
// copies of each other), rising straight out of solid ground instead of
// the sea. The signature device — matching rock-arch PAIRS, carved from
// the wall itself now rather than rising out of water — is unchanged:
// two identical arches, side by side, over and over, a direct visual
// pun on the skill itself: putting two like things side by side for a
// fair comparison. A few apple trees dotted along the clifftop are the
// literal nod to the skill's own name. (An earlier version had open
// water in the wall's place, with the arches rising from it as sea
// arches; dropped along with every other coastal skill's water feature
// so this hillside skill reads as ordinary mountain terrain, like its
// non-coastal neighbors Number Match, Match Makers, and Clear
// Antecedent.)
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 40, max: COL_W - 220 };
const WALL_OUTER = COL_W + 40;

function computeWallEdge(totalHeight) {
  const steps = Math.max(36, Math.round(totalHeight / 48));
  const mid = COL_W - 150;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.35 + 0.65 * edgeFalloff;
    const wobble =
      58 * Math.sin(i * 0.34 + 0.9) +
      34 * Math.sin(i * 0.9 + 1.6) +
      20 * Math.sin(i * 2.0 + 0.3) +
      11 * Math.sin(i * 4.4 + 1.4);
    const edge = mid + envelope * wobble;
    return { y, edge: clamp(edge, COL_W - 195, WALL_OUTER - 15) };
  });
}

// The wall's outer edge (away from the trail, off past the frame) is a
// flat color running the full height of the canvas — a fade to
// transparent right at the frame's own edge lets the rock dissolve into
// the ground before it ever reaches that boundary, instead of getting
// clipped there. The jagged inner (trail-facing) edge is untouched.
function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="twinCliffsWallFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#a89b82" stop-opacity="0" />
        <stop offset="100%" stop-color="#a89b82" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(wall) {
  const line = wall.map((w, i) => `${i === 0 ? "M" : "L"}${w.edge},${w.y}`).join(" ");
  const fillPath = `${line} L${WALL_OUTER},${wall[wall.length - 1].y} L${WALL_OUTER},0 Z`;
  return `<path d="${fillPath}" fill="url(#twinCliffsWallFade)" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
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
// other — repeated down the whole wall, carved straight out of it.
function renderArchPairs(wall) {
  const count = Math.max(3, Math.round(wall.length / 11));
  const out = [];
  for (let g = 0; g < count; g++) {
    const idx = clamp(Math.round(((g + 0.5) / count) * wall.length), 2, wall.length - 2);
    const w = wall[idx];
    const width = WALL_OUTER - w.edge;
    if (width < 55) continue;
    const scale = 0.85 + (g % 2) * 0.25;
    const gap = 46 * scale;
    const cx = w.edge + Math.min(width - 30, 55);
    out.push(renderArch(cx, w.y, scale));
    out.push(renderArch(cx + gap, w.y, scale));
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
  const wall = computeWallEdge(totalHeight);
  const wallShape = renderWall(wall);
  const arches = renderArchPairs(wall);
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
      aria-label="A close-up corner of Wordwood Isle: a rocky mountain wall and mountain ridges along one edge, with matching pairs of twin rock arches carved from the wall and a few apple trees on the clifftop, connecting every Apples to Apples lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#a89b82" />
      <g>${scree}</g>
      ${wallShape}
      ${arches}
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
