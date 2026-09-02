// Algebra Toolkit's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — an Ironroot mining
// valley (rust-brown rock, matching Numeria Peaks' own Algebra zone)
// between two jagged walls, worked by whoever's been through here: a
// pickaxe, a supply crate, an ore cart on its own short rail, a lantern,
// a coil of rope — a genuinely different tool at each stop rather than
// one repeated prop, a visual pun on the skill itself (a toolkit holds
// several different tools, not five of the same one).
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 95, max: COL_W - 95 };
const WALL_BASE = "#9c7256";
const WALL_STROKE = "#3f2e1f";

function computeWallEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      42 * Math.sin(i * 0.42 + phase) +
      26 * Math.sin(i * 1.1 + phase * 1.6) +
      17 * Math.sin(i * 2.4 + phase * 0.6) +
      10 * Math.sin(i * 5.3 + phase * 2.1);
    return { y, depth: clamp(56 + wobble, 14, 88) };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="minersCacheLeftFade" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
      <linearGradient id="minersCacheRightFade" x1="${COL_W}" y1="0" x2="${COL_W - 60}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${WALL_BASE}" stop-opacity="0" />
        <stop offset="100%" stop-color="${WALL_BASE}" stop-opacity="1" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  const fill = side === "left" ? "url(#minersCacheLeftFade)" : "url(#minersCacheRightFade)";
  return `<path d="${fillPath}" fill="${fill}" stroke="${WALL_STROKE}" stroke-width="2" opacity="0.95" />`;
}

function renderPickaxe(x, y, scale) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)}) rotate(-28)">
    <rect x="-3" y="-30" width="6" height="42" fill="#6b4a2e" stroke="#3f2e1f" stroke-width="1.5" rx="2" />
    <path d="M-26,-32 Q0,-46 26,-32 Q0,-24 -26,-32 Z" fill="#4a4a52" stroke="#26262c" stroke-width="1.5" />
  </g>`;
}

function renderCrate(x, y, scale) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})">
    <rect x="-20" y="-24" width="40" height="24" fill="#8a6a48" stroke="#3f2e1f" stroke-width="2" />
    <line x1="-20" y1="-12" x2="20" y2="-12" stroke="#3f2e1f" stroke-width="1.5" />
    <line x1="-10" y1="-24" x2="-10" y2="0" stroke="#3f2e1f" stroke-width="1.5" opacity="0" />
    <line x1="-20" y1="-24" x2="20" y2="0" stroke="#3f2e1f" stroke-width="1.2" opacity="0.5" />
    <line x1="20" y1="-24" x2="-20" y2="0" stroke="#3f2e1f" stroke-width="1.2" opacity="0.5" />
  </g>`;
}

function renderCart(x, y, scale) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})">
    <line x1="-34" y1="4" x2="34" y2="4" stroke="#4a3323" stroke-width="3" />
    <line x1="-34" y1="9" x2="34" y2="9" stroke="#4a3323" stroke-width="3" />
    <path d="M-22,-20 L22,-20 L26,4 L-26,4 Z" fill="#5a5a62" stroke="#26262c" stroke-width="2" />
    <circle cx="-14" cy="6" r="6" fill="#26262c" />
    <circle cx="14" cy="6" r="6" fill="#26262c" />
    <ellipse cx="0" cy="-20" rx="20" ry="5" fill="#8a7048" />
  </g>`;
}

function renderLantern(x, y, scale) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})">
    <line x1="0" y1="-40" x2="0" y2="-24" stroke="#3f2e1f" stroke-width="2" />
    <rect x="-11" y="-24" width="22" height="26" rx="3" fill="#5a4a30" stroke="#3f2e1f" stroke-width="1.5" />
    <circle cx="0" cy="-11" r="7" fill="#f0c05a" opacity="0.9" />
    <circle cx="0" cy="-11" r="12" fill="#f0c05a" opacity="0.25" />
  </g>`;
}

function renderRopeCoil(x, y, scale) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})">
    <circle cx="0" cy="0" r="16" fill="none" stroke="#8a6a48" stroke-width="5" />
    <circle cx="0" cy="0" r="9" fill="none" stroke="#8a6a48" stroke-width="5" />
    <circle cx="0" cy="0" r="16" fill="none" stroke="#3f2e1f" stroke-width="1" opacity="0.5" />
  </g>`;
}

const TOOLS = [renderPickaxe, renderCrate, renderCart, renderLantern, renderRopeCoil];

function renderTools(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 22, BAND.max - 22);
      const tool = TOOLS[i % TOOLS.length];
      return tool(dx, p.y + 30, 0.85 + (i % 3) * 0.1);
    })
    .join("");
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
      const x = clamp(nearest.x + side * (48 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#8a6a4c" stroke="#3f2e1f" stroke-width="1.5" opacity="0.8" />`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeWallEdge(totalHeight, 0.5);
  const rightEdge = computeWallEdge(totalHeight, 2.4);
  const walls = renderWall(leftEdge, "left") + renderWall(rightEdge, "right");
  const scree = renderScree(positions, totalHeight);
  const tools = renderTools(positions);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: an Ironroot mining valley between two jagged rock walls, worked with a different tool at every stop — a pickaxe, a crate, an ore cart, a lantern, a coil of rope — connecting every Algebra Toolkit lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${WALL_BASE}" />
      <g>${scree}</g>
      ${walls}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${tools}</g>
    </svg>
  `;
}

export const minersCacheTheme = {
  trailBand: BAND,
  mapBg: WALL_BASE,
  hintColor: "rgba(40, 26, 14, 0.8)",
  renderScene,
};
