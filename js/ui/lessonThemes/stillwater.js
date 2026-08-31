// Full Stop's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a hushed swamp meeting the
// sea at dawn: one large, perfectly still cove reaching in from the
// left edge (open to the coast beyond the frame, not a landlocked pond)
// instead of Writer's Goal's several busy bogs, a single bare dead tree
// instead of leafy cypress, and hardly any wildlife. Pale and misty
// rather than dark — soft dawn-fog grays and sage instead of a dim
// night palette, so "hushed and still" reads as calm rather than
// gloomy. The trail is a solid, unbroken line — the one theme without
// any dash/dot pattern at all — a visual pun on the skill itself (a
// period is one definitive, unbroken stop, not a trailing-off dotted
// line) — echoed by the one single, singular body of water too.
import { COL_W, clamp, blobPoints, closedBlobPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

// No edge-fade vignette here unlike the isle's other coastal skills —
// the pool's own blob shape is already organic and irregular, so
// clipping it at the frame boundary doesn't produce the hard straight
// cut that technique exists to soften.
function renderStillPool(cx, cy, r) {
  const outer = closedBlobPath(blobPoints(cx, cy, r, 11, 3.4));
  const inner = closedBlobPath(blobPoints(cx + r * 0.05, cy - r * 0.05, r * 0.5, 8, 5.1));
  return `
    <path d="${outer}" fill="#8fa39c" opacity="0.75" />
    <path d="${inner}" fill="#b7c7c0" opacity="0.55" />
    <ellipse cx="${cx - r * 0.2}" cy="${cy - r * 0.25}" rx="${r * 0.28}" ry="${r * 0.09}" fill="#fdf8e8" opacity="0.4" />
  `;
}

// A handful of soft, low-opacity patches drifting across the scene — the
// dawn mist that keeps the pale palette feeling atmospheric rather than
// flat or washed out.
function renderMist(totalHeight) {
  const count = Math.max(5, Math.round(totalHeight / 480));
  return Array.from({ length: count }, (_, i) => {
    const fy = (i + 0.5) / count;
    const fx = i % 2 === 0 ? 0.2 + (i % 3) * 0.05 : 0.75 - (i % 3) * 0.05;
    const r = 100 + (i % 3) * 25;
    return `<ellipse cx="${fx * COL_W}" cy="${fy * totalHeight}" rx="${r}" ry="${r * 0.45}" fill="#f3f6f0" opacity="0.28" />`;
  }).join("");
}

// A soft dawn glow low in the sky at the top of the scene.
function renderDawnGlow() {
  return `
    <ellipse cx="${COL_W * 0.5}" cy="10" rx="260" ry="120" fill="#fff2cf" opacity="0.35" />
    <ellipse cx="${COL_W * 0.5}" cy="10" rx="150" ry="70" fill="#ffe9b8" opacity="0.3" />
  `;
}

// A bare, leafless tree — forking branches only, no canopy at all.
function renderBareTree(x, y, r) {
  const branch = (angle, len) => {
    const rad = (angle * Math.PI) / 180;
    const bx = x + Math.cos(rad) * len;
    const by = y - r * 0.6 + Math.sin(rad) * len;
    return `<line x1="${x}" y1="${y - r * 0.6}" x2="${bx}" y2="${by}" stroke="#7a6f5c" stroke-width="4" stroke-linecap="round" />`;
  };
  return `
    <ellipse cx="${x}" cy="${y + 8}" rx="${r * 0.5}" ry="${r * 0.14}" fill="rgba(60,60,50,0.14)" />
    <rect x="${x - 5}" y="${y - r * 0.6}" width="10" height="${r * 0.65}" fill="#7a6f5c" rx="2" />
    ${branch(-70, r * 0.55)}
    ${branch(-40, r * 0.65)}
    ${branch(-15, r * 0.5)}
    ${branch(200, r * 0.5)}
    ${branch(235, r * 0.6)}
  `;
}

function computeBareTrees(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(3, Math.round(totalHeight / 500));
  const fractions = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
  return fractions.map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const x = clamp(nearest.x + side * (95 + (i % 2) * 30), BAND.min + 20, BAND.max - 20);
    return { x, y: hy, r: 50 + (i % 2) * 12 };
  });
}

function renderReeds(x, y) {
  return Array.from({ length: 3 }, (_, i) => {
    const dx = (i - 1) * 7;
    const h = 20 + (i % 2) * 10;
    return `<path d="M${x + dx},${y} Q${x + dx + 3},${y - h * 0.6} ${x + dx},${y - h}" stroke="#8a9a7c" stroke-width="2.5" fill="none" opacity="0.85" />`;
  }).join("");
}

// A few reed clumps scattered independently of the one central pool, so
// a long scroll isn't just three trees and nothing else for most of its
// length.
function computeReedClumps(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  const count = Math.max(3, Math.round(totalHeight / 480));
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = i % 2 === 0 ? 1 : -1;
    return { x: clamp(nearest.x + side * 70, BAND.min + 15, BAND.max - 15), y: hy };
  });
}

// Unbroken, no dash pattern at all — the "full stop" pun. A deeper,
// muted tone so it still reads clearly against the pale ground.
function renderSolidTrail(positions) {
  return `<path d="${renderTrailPath(positions)}" stroke="#5b6b5e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9" />`;
}

function renderScene(positions, totalHeight, bossName) {
  const poolY = totalHeight * 0.5;
  const poolX = -70;
  const trees = computeBareTrees(positions, totalHeight)
    .map((t) => renderBareTree(t.x, t.y, t.r))
    .join("");
  const reeds = computeReedClumps(positions, totalHeight)
    .map((r) => renderReeds(r.x, r.y))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="80" fill="#e9eee7" stroke="#8fa39c" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a hushed, misty swamp meeting the sea at dawn, one large quiet cove reaching in from the coast and bare trees, crossed by an unbroken trail connecting every Full Stop lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#d3dbd4" />
      ${renderDawnGlow()}
      ${renderStillPool(poolX, poolY, 230)}
      <g>${trees}</g>
      <g>${reeds}</g>
      ${renderMist(totalHeight)}
      ${bossClearing}
      ${renderSolidTrail(positions)}
    </svg>
  `;
}

export const stillwaterTheme = {
  trailBand: BAND,
  mapBg: "#d3dbd4",
  hintColor: "rgba(40, 48, 42, 0.78)",
  renderScene,
};
