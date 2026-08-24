// Writer's Goal's own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — a misty swamp: several
// separate murky bogs scattered through the scene (not one continuous
// river/band like plains.js or canyon.js), knobby-rooted cypress trees
// with hanging moss, reed clusters, and a wooden boardwalk trail instead
// of every other theme's dotted dirt path — a visual pun on the skill
// itself: staying purposeful (a clear boardwalk laid straight through
// the murk) even when the surroundings are unclear.
import { COL_W, clamp, nearestPosition, blobPoints, closedBlobPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };

// A boardwalk, not a dirt path — a thick wood-brown stroke with a
// lighter offset stroke layered on top so the dash segments read as
// individual planks rather than dots. The one theme with a built,
// deliberate path through otherwise wild terrain.
function renderBoardwalk(positions) {
  const d = positions
    .slice(0, -1)
    .map((a, i) => {
      const b = positions[i + 1];
      const midY = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY} Q ${b.x} ${midY} ${b.x} ${b.y}`;
    })
    .join(" ");
  return `
    <path d="${d}" stroke="#5a4128" stroke-width="13" stroke-linecap="butt" stroke-dasharray="19 7" fill="none" opacity="0.92" />
    <path d="${d}" stroke="#8a6a44" stroke-width="13" stroke-linecap="butt" stroke-dasharray="19 7" stroke-dashoffset="5" fill="none" opacity="0.5" />
  `;
}

function computeBogs(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return [0.16, 0.4, 0.64, 0.86].map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const bx = clamp(mid + side * (BAND.max - BAND.min) * 0.33, BAND.min + 55, BAND.max - 55);
    return { x: bx, y: hy, r: 58 + (i % 2) * 20, seed: i * 1.9 };
  });
}

function renderBog({ x, y, r, seed }) {
  const outer = closedBlobPath(blobPoints(x, y, r, 10, seed));
  const inner = closedBlobPath(blobPoints(x - r * 0.1, y - r * 0.05, r * 0.55, 8, seed + 2.2));
  return `
    <path d="${outer}" fill="#3f4f38" opacity="0.85" />
    <path d="${inner}" fill="#5c6e4c" opacity="0.5" />
    <text x="${x - r * 0.35}" y="${y + r * 0.15}" font-size="26">🪷</text>
  `;
}

// A cypress: a knobby, flared base (a few small bump ellipses) under a
// lumpy, non-round canopy blob, with two or three thin curled strokes of
// hanging moss dangling from the edge.
function computeCypresses(positions, totalHeight) {
  const mid = (BAND.min + BAND.max) / 2;
  return [0.05, 0.28, 0.52, 0.76, 0.96].map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const cx = clamp(nearest.x + side * (85 + (i % 3) * 30), BAND.min + 20, BAND.max - 20);
    return { x: cx, y: hy, r: 30 + (i % 3) * 8, seed: i * 2.7 };
  });
}

function renderCypress({ x, y, r, seed }) {
  const canopy = closedBlobPath(blobPoints(x, y - r * 0.5, r, 8, seed));
  return `
    <ellipse cx="${x - r * 0.5}" cy="${y + r * 0.5}" rx="${r * 0.32}" ry="${r * 0.18}" fill="#4a3a24" />
    <ellipse cx="${x + r * 0.4}" cy="${y + r * 0.55}" rx="${r * 0.3}" ry="${r * 0.16}" fill="#4a3a24" />
    <rect x="${x - 5}" y="${y - r * 0.1}" width="10" height="${r * 0.7}" fill="#5a4530" rx="3" />
    <path d="${canopy}" fill="#546b3e" />
    <path d="M${x - r * 0.5},${y - r * 0.7} Q${x - r * 0.4},${y - r * 0.2} ${x - r * 0.55},${y + r * 0.1}"
      stroke="#8a9270" stroke-width="2" fill="none" opacity="0.7" />
    <path d="M${x + r * 0.35},${y - r * 0.75} Q${x + r * 0.45},${y - r * 0.25} ${x + r * 0.3},${y + r * 0.05}"
      stroke="#8a9270" stroke-width="2" fill="none" opacity="0.7" />
  `;
}

function renderReeds(x, y) {
  return Array.from({ length: 4 }, (_, i) => {
    const dx = (i - 1.5) * 7;
    const h = 22 + (i % 2) * 12;
    return `
      <path d="M${x + dx},${y} Q${x + dx + 3},${y - h * 0.6} ${x + dx},${y - h}" stroke="#7a8a4a" stroke-width="2.5" fill="none" />
      <ellipse cx="${x + dx}" cy="${y - h}" rx="3" ry="6" fill="#6b5233" />
    `;
  }).join("");
}

function computeReedClumps(totalHeight) {
  const count = Math.max(5, Math.round(totalHeight / 320));
  return Array.from({ length: count }, (_, i) => ({
    x: clamp(BAND.min + 30 + ((i * 97) % (BAND.max - BAND.min - 60)), BAND.min + 20, BAND.max - 20),
    y: 60 + ((totalHeight - 120) / (count - 1 || 1)) * i,
  }));
}

// A few soft, low-opacity haze blobs — the one theme with atmospheric
// fog sitting over everything else.
function renderFog(totalHeight) {
  return [0.1, 0.35, 0.6, 0.85].map((f, i) => {
    const y = f * totalHeight;
    const x = BAND.min + ((i % 2) * (BAND.max - BAND.min) * 0.7) + 60;
    return `<ellipse cx="${x}" cy="${y}" rx="150" ry="60" fill="#dfe8dc" opacity="0.1" />`;
  }).join("");
}

const DECOR_EMOJI = ["🐸", "🐊", "🦆", "🦟", "🪲"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 62, BAND.min + 15, BAND.max - 10);
      const dy = p.y - 12;
      return `<text x="${dx}" y="${dy}" font-size="26" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const bogs = computeBogs(positions, totalHeight).map(renderBog).join("");
  const cypresses = computeCypresses(positions, totalHeight).map(renderCypress).join("");
  const reeds = computeReedClumps(totalHeight)
    .map((r) => renderReeds(r.x, r.y))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `
    <rect x="${last.x - 78}" y="${last.y - 60}" width="156" height="120" rx="14" fill="#8a6a44" stroke="#5a4128" stroke-width="4" />
    <text x="${last.x - 55}" y="${last.y + 48}" font-size="24">🪷</text>
    <text x="${last.x + 50}" y="${last.y - 42}" font-size="24">🪷</text>
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a misty swamp with scattered bogs, knobby cypress trees, and reeds, crossed by a wooden boardwalk connecting every Writer's Goal lesson up to ${bossName}'s own platform">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#6b6144" />
      <g>${reeds}</g>
      <g>${bogs}</g>
      <g>${cypresses}</g>
      ${bossClearing}
      ${renderBoardwalk(positions)}
      <g>${renderDecorations(positions)}</g>
      <g>${renderFog(totalHeight)}</g>
    </svg>
  `;
}

export const swampTheme = {
  trailBand: BAND,
  mapBg: "#6b6144",
  hintColor: "rgba(235, 240, 215, 0.85)",
  renderScene,
};
