// Big Picture Builder's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a sandy mountain
// valley flanked by two jagged sandstone walls, each with a built
// wooden overlook platform jutting out partway up — a visual pun on the
// skill itself (seeing a paragraph or essay's whole structure at once):
// every platform is a deliberate vantage point built for taking in the
// big picture, recurring the whole way down so there's always another
// view coming up.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };

// A jagged sandstone wall edge — wide, chaotic swings (not a gentle
// wobble) so it reads as broken rock rather than a smooth wave.
function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      42 * Math.sin(i * 0.4 + phase) +
      26 * Math.sin(i * 1.05 + phase * 1.6) +
      17 * Math.sin(i * 2.3 + phase * 0.6) +
      10 * Math.sin(i * 5.1 + phase * 2.1);
    return { y, depth: clamp(56 + wobble, 14, 92) };
  });
}

// A fade to transparent right at the frame's own outer edge (off past
// the wall's own off-canvas side) so the sandstone dissolves into the
// ground before it hits the hard clip, instead of the flat fill just
// stopping there.
function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="vistaPeakLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#c9a668" stop-opacity="0" />
        <stop offset="100%" stop-color="#c9a668" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="vistaPeakRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#c9a668" stop-opacity="0" />
        <stop offset="100%" stop-color="#c9a668" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#vistaPeakLeftFade)" : "url(#vistaPeakRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="#a9824c" stroke-width="2" opacity="0.95" />`;
}

function edgeDepthAt(edge, y) {
  let nearest = edge[0];
  let best = Infinity;
  for (const e of edge) {
    const d = Math.abs(e.y - y);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }
  return nearest.depth;
}

// A little built wooden platform jutting out from the wall, with a
// railing and a spyglass — the "seeing the whole picture" landmark.
function renderOverlook(x, y, side) {
  const dir = side === "left" ? 1 : -1;
  const w = 44;
  return `
    <rect x="${x}" y="${y - 6}" width="${dir * w}" height="10" fill="#8a6a44" />
    <line x1="${x + dir * 6}" y1="${y - 6}" x2="${x + dir * 6}" y2="${y - 26}" stroke="#6b5233" stroke-width="3" />
    <line x1="${x + dir * (w - 6)}" y1="${y - 6}" x2="${x + dir * (w - 6)}" y2="${y - 26}" stroke="#6b5233" stroke-width="3" />
    <line x1="${x + dir * 6}" y1="${y - 26}" x2="${x + dir * (w - 6)}" y2="${y - 26}" stroke="#6b5233" stroke-width="3" />
    <text x="${x + dir * w * 0.5}" y="${y - 30}" font-size="18" text-anchor="middle">🔭</text>
  `;
}

function computeOverlooks(leftEdge, rightEdge, totalHeight) {
  const count = Math.max(2, Math.round(totalHeight / 620));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const side = i % 2 === 0 ? "left" : "right";
    const depth = side === "left" ? edgeDepthAt(leftEdge, y) : edgeDepthAt(rightEdge, y);
    const x = side === "left" ? depth : COL_W - depth;
    return { x, y, side };
  });
}

function computeScree(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 210));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 8 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(totalHeight)
    .map(({ y, side, r }) => {
      let nearest = positions[0];
      let best = Infinity;
      for (const p of positions) {
        const d = Math.abs(p.y - y);
        if (d < best) {
          best = d;
          nearest = p;
        }
      }
      const x = clamp(nearest.x + side * (60 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#c9a668" opacity="0.6" />`;
    })
    .join("");
}

const DECOR_EMOJI = ["🦅", "🦎"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 48, BAND.min + 15, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 12}" font-size="21" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const overlooks = computeOverlooks(leftEdge, rightEdge, totalHeight)
    .map((o) => renderOverlook(o.x, o.y, o.side))
    .join("");
  const scree = renderScree(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f4ecd4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a sandy mountain valley with built overlook platforms recurring up both walls, connecting every Big Picture Builder lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#d8b878" />
      <g>${scree}</g>
      ${walls}
      ${overlooks}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#a9824c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const vistaPeakTheme = {
  trailBand: BAND,
  mapBg: "#d8b878",
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
