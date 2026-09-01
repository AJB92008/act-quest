// Who's There?'s own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — one continuous jagged
// mountain wall along the right edge, the same technique as Time
// Traveler and Number Match, not a repeating alternation of separate
// mountain/clearing blocks (an earlier version alternated every 480
// units, which read as arbitrary — mountain, clearing, mountain,
// clearing, with no reason for the rhythm). The wall carries one
// deliberate low gap — a saddle — with a little watchtower standing
// guard right in the notch, the mountain itself asking "who's there?"
// of anyone crossing through. Past that gap the wall gradually recedes
// into a small clearing at the very bottom, the one open stretch in
// the whole scene. A narrow sliver of sea runs the entire length along
// the opposite edge — coast with mountains, one coherent scene rather
// than patchwork zones.
import { COL_W, clamp, jaggedBandPath, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const WATER_BAND = { min: -40, max: 65 };
const BAND = { min: 225, max: COL_W - 90 };
const PASS_Y_FRACTION = 0.48;
const PASS_HALF_WIDTH = 130;
const RECEDE_START_FRACTION = 0.8;

// The wall's inner (trail-facing) edge — a jagged silhouette like Time
// Traveler's, but with two deliberate modifications baked into its
// depth profile: a saddle dip (the pass) partway down, and a long taper
// to near-nothing over the final stretch (the mountain gradually
// giving way to a small clearing at the very bottom).
function computeWallEdge(totalHeight) {
  const steps = Math.max(45, Math.round(totalHeight / 40));
  const passY = totalHeight * PASS_Y_FRACTION;
  const recedeStart = totalHeight * RECEDE_START_FRACTION;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      44 * Math.sin(i * 0.4 + 0.6) +
      27 * Math.sin(i * 1.05 + 1.9) +
      17 * Math.sin(i * 2.3 + 0.8) +
      10 * Math.sin(i * 5.2 + 2.4);
    let depth = clamp(58 + wobble, 16, 88);
    const passDist = Math.abs(y - passY);
    if (passDist < PASS_HALF_WIDTH) {
      const t = 1 - passDist / PASS_HALF_WIDTH;
      depth = depth * (1 - t) + 20 * t;
    }
    if (y > recedeStart) {
      const t = clamp((y - recedeStart) / (totalHeight - recedeStart), 0, 1);
      depth *= 1 - t;
    }
    return { y, depth };
  });
}

function renderWallFadeDefs() {
  return `
    <defs>
      <linearGradient id="sentryPassWallFade" x1="${COL_W}" y1="0" x2="${COL_W - 70}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ab9f86" stop-opacity="1" />
        <stop offset="100%" stop-color="#ab9f86" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="sentryPassWaterDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2e4e5c" />
        <stop offset="100%" stop-color="#5f95a8" />
      </linearGradient>
    </defs>
  `;
}

function renderWall(edge) {
  const line = edge.map((e, i) => `${i === 0 ? "M" : "L"}${COL_W - e.depth},${e.y}`).join(" ");
  const fillPath = `${line} L${COL_W + 40},${edge[edge.length - 1].y} L${COL_W + 40},0 Z`;
  return `<path d="${fillPath}" fill="#8c8270" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
}

function renderWallOuterFade(totalHeight) {
  return `<rect x="${COL_W - 70}" y="0" width="70" height="${totalHeight}" fill="url(#sentryPassWallFade)" />`;
}

// Snow-capped ridge silhouettes recurring up the wall wherever it's
// tall enough to carry one (skipped near the pass and the receding
// tail, where the wall itself is too shallow).
function computeRidges(edge, totalHeight) {
  const count = Math.max(4, Math.round(totalHeight / 480));
  const ridges = [];
  for (let i = 0; i < count; i++) {
    const y = ((i + 0.5) / count) * totalHeight;
    const nearest = edge.reduce((best, e) => (Math.abs(e.y - y) < Math.abs(best.y - y) ? e : best));
    if (nearest.depth > 45) ridges.push({ y: nearest.y, depth: nearest.depth });
  }
  return ridges;
}

function renderRidgeCluster(y, depth) {
  const cx = COL_W - depth - 30;
  const step = 46;
  const h = 40;
  const line = `M${cx - step - 16},${y} L${cx - step},${y - h} L${cx - step / 2},${y - h * 0.6} L${cx},${y - h * 1.15} L${cx + step / 2},${y - h * 0.6} L${cx + step},${y - h} L${cx + step + 16},${y}`;
  const cap = [cx - step, cx, cx + step]
    .map((px, i) => {
      const py = i === 1 ? y - h * 1.15 : y - h;
      return `<path d="M${px - 8},${py + 11} L${px},${py} L${px + 8},${py + 11} Z" fill="#eef2ea" opacity="0.85" />`;
    })
    .join("");
  return `<path d="${line} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />${cap}`;
}

// A little sentry post right in the notch of the pass, challenging
// anyone crossing — the "who's there?" of the whole scene.
function renderWatchtower(x, y) {
  return `
    <rect x="${x - 12}" y="${y - 46}" width="24" height="46" fill="#6b5a44" />
    <path d="M${x - 16},${y - 46} L${x},${y - 66} L${x + 16},${y - 46} Z" fill="#4a3d2e" />
    <rect x="${x - 6}" y="${y - 34}" width="12" height="10" fill="#2c241a" opacity="0.7" />
    <line x1="${x + 12}" y1="${y - 66}" x2="${x + 12}" y2="${y - 80}" stroke="#4a3d2e" stroke-width="2" />
    <path d="M${x + 12},${y - 80} L${x + 30},${y - 74} L${x + 12},${y - 68} Z" fill="#b3453f" />
  `;
}

function computeScree(positions, totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 210));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight,
    side: i % 2 === 0 ? 1 : -1,
    r: 7 + (i % 4) * 4,
  }));
}

function renderScree(positions, totalHeight) {
  return computeScree(positions, totalHeight)
    .map(({ y, side, r }) => {
      const nearest = nearestPosition(positions, y);
      const x = clamp(nearest.x + side * (55 + r), BAND.min + 15, BAND.max - 15);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#9c9280" stroke="#7a7260" stroke-width="2" />`;
    })
    .join("");
}

// A narrow, quiet sliver of sea along the left edge — same technique
// as Time Traveler, running the entire height rather than confined to
// any one zone.
function computeShore(totalHeight) {
  const steps = Math.max(36, Math.round(totalHeight / 48));
  const mid = 22;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const edgeFalloff = clamp(Math.min(y / 130, (totalHeight - y) / 130), 0, 1);
    const envelope = 0.35 + 0.65 * edgeFalloff;
    const wobble = 16 * Math.sin(i * 0.31 + 1.1) + 9 * Math.sin(i * 0.83 + 0.4) + 5 * Math.sin(i * 1.9 + 2.3);
    const edge = mid + envelope * wobble;
    return { y, left: WATER_BAND.min, right: clamp(edge, 8, WATER_BAND.max) };
  });
}

function renderWater(shore) {
  const band = jaggedBandPath(
    shore.map((s) => ({ x: s.left, y: s.y })),
    shore.map((s) => ({ x: s.right, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.right},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#sentryPassWaterDepth)" opacity="0.7" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="2" fill="none" opacity="0.3" stroke-linecap="round" />
  `;
}

const MOUNTAIN_EMOJI = ["🐐", "🦅"];
const CLEARING_EMOJI = ["🌼", "🦋"];

function renderDecorations(positions, edge) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const nearest = edge.reduce((best, e) => (Math.abs(e.y - p.y) < Math.abs(best.y - p.y) ? e : best));
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 15, BAND.max - 10);
      const emoji = nearest.depth < 30 ? CLEARING_EMOJI[i % CLEARING_EMOJI.length] : MOUNTAIN_EMOJI[i % MOUNTAIN_EMOJI.length];
      return `<text x="${dx}" y="${p.y - 12}" font-size="23" text-anchor="middle">${emoji}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const edge = computeWallEdge(totalHeight);
  const passY = totalHeight * PASS_Y_FRACTION;
  const passPoint = edge.reduce((best, e) => (Math.abs(e.y - passY) < Math.abs(best.y - passY) ? e : best));
  const wall = renderWall(edge);
  const ridges = computeRidges(edge, totalHeight)
    .map((r) => renderRidgeCluster(r.y, r.depth))
    .join("");
  const scree = renderScree(positions, totalHeight);
  const shore = computeShore(totalHeight);
  const water = renderWater(shore);
  const watchtower = renderWatchtower(COL_W - passPoint.depth - 8, passPoint.y);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: a mountain wall with one watchtower-guarded pass, receding into a small clearing near the bottom, a narrow sliver of sea along the opposite edge, connecting every Who's There? lesson up to ${bossName}'s own clearing">
      ${renderWallFadeDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#ab9f86" />
      <g>${scree}</g>
      ${water}
      ${wall}
      ${ridges}
      ${renderWallOuterFade(totalHeight)}
      ${watchtower}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions, edge)}</g>
    </svg>
  `;
}

export const sentryPassTheme = {
  trailBand: BAND,
  mapBg: "#ab9f86",
  hintColor: "rgba(255, 252, 240, 0.85)",
  renderScene,
};
