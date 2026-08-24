// Full Stop's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a hushed, still swamp: one
// large, perfectly still pool instead of Writer's Goal's several busy
// bogs, a single bare dead tree instead of leafy cypress, and hardly any
// wildlife. The trail is a solid, unbroken line — the one theme without
// any dash/dot pattern at all — a visual pun on the skill itself (a
// period is one definitive, unbroken stop, not a trailing-off dotted
// line).
import { COL_W, clamp, blobPoints, closedBlobPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };

function renderStillPool(cx, cy, r) {
  const outer = closedBlobPath(blobPoints(cx, cy, r, 11, 3.4));
  const inner = closedBlobPath(blobPoints(cx + r * 0.05, cy - r * 0.05, r * 0.5, 8, 5.1));
  return `
    <path d="${outer}" fill="#33392a" opacity="0.9" />
    <path d="${inner}" fill="#454c36" opacity="0.5" />
    <ellipse cx="${cx - r * 0.2}" cy="${cy - r * 0.25}" rx="${r * 0.25}" ry="${r * 0.08}" fill="#eef2e0" opacity="0.15" />
  `;
}

// A bare, leafless tree — forking branches only, no canopy at all.
function renderBareTree(x, y, r) {
  const branch = (angle, len) => {
    const rad = (angle * Math.PI) / 180;
    const bx = x + Math.cos(rad) * len;
    const by = y - r * 0.6 + Math.sin(rad) * len;
    return `<line x1="${x}" y1="${y - r * 0.6}" x2="${bx}" y2="${by}" stroke="#3a3226" stroke-width="4" stroke-linecap="round" />`;
  };
  return `
    <ellipse cx="${x}" cy="${y + 8}" rx="${r * 0.5}" ry="${r * 0.14}" fill="rgba(10,15,5,0.25)" />
    <rect x="${x - 5}" y="${y - r * 0.6}" width="10" height="${r * 0.65}" fill="#3a3226" rx="2" />
    ${branch(-70, r * 0.55)}
    ${branch(-40, r * 0.65)}
    ${branch(-15, r * 0.5)}
    ${branch(200, r * 0.5)}
    ${branch(235, r * 0.6)}
  `;
}

function computeBareTrees(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return [0.12, 0.5, 0.88].map((f, i) => {
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
    return `<path d="M${x + dx},${y} Q${x + dx + 3},${y - h * 0.6} ${x + dx},${y - h}" stroke="#6a7a45" stroke-width="2.5" fill="none" opacity="0.8" />`;
  }).join("");
}

// Unbroken, no dash pattern at all — the "full stop" pun.
function renderSolidTrail(positions) {
  return `<path d="${renderTrailPath(positions)}" stroke="#4a4030" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85" />`;
}

function renderScene(positions, totalHeight, bossName) {
  const poolY = totalHeight * 0.5;
  const poolX = COL_W / 2;
  const trees = computeBareTrees(positions, totalHeight)
    .map((t) => renderBareTree(t.x, t.y, t.r))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="80" fill="#4a4a38" stroke="#2c2c1e" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a hushed, still swamp with one large quiet pool and bare trees, crossed by an unbroken trail connecting every Full Stop lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#5a5540" />
      ${renderStillPool(poolX, poolY, 150)}
      <g>${trees}</g>
      ${renderReeds(poolX - 170, poolY + 90)}
      ${renderReeds(poolX + 160, poolY - 60)}
      ${bossClearing}
      ${renderSolidTrail(positions)}
    </svg>
  `;
}

export const stillwaterTheme = {
  trailBand: BAND,
  mapBg: "#5a5540",
  hintColor: "rgba(235, 235, 215, 0.85)",
  renderScene,
};
