// Who's There?'s own theme (see lessonTerrain.js for the shared engine
// every lesson-path theme renders through) — mountain zones and sandy
// clearing zones alternate all the way down the whole scene (not a
// single mountain block giving way to one strip at the end, the way
// Comma Sense does it): you cross a jagged range, drop into a clearing,
// then climb into another range, over and over. Every range has one
// deliberate low gap (a saddle) with a little watchtower standing
// guard right in the notch — the mountain itself asking "who's there?"
// of anyone crossing through, again and again. A narrow sliver of sea
// hugs the same edge the whole way down, in every clearing (never
// alternating sides, never wide enough to compete with the mountains
// or reach the trail's own band) — coast with mountains, not a beach
// scene with mountains as an afterthought.
import { COL_W, clamp, jaggedBandPath, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 60, max: COL_W - 60 };
const ZONE_H = 480;
const WATER_EDGE_MAX = 42;

function computeZones(totalHeight) {
  const zones = [];
  let y = 0;
  let i = 0;
  while (y < totalHeight) {
    const h = Math.min(ZONE_H, totalHeight - y);
    zones.push({ y, h, type: i % 2 === 0 ? "mountain" : "clearing" });
    y += h;
    i++;
  }
  return zones;
}

// A jagged range confined to one zone, with one peak pulled way down
// into a saddle — the pass the watchtower sits in.
function computeRange(zoneTop, zoneBottom) {
  const peaks = 5;
  const passIndex = 2;
  const step = COL_W / peaks;
  const pts = [{ x: -20, y: zoneBottom }];
  for (let i = 0; i < peaks; i++) {
    const peakX = step * i + step * 0.5;
    const isPass = i === passIndex;
    const zoneH = zoneBottom - zoneTop;
    const peakY = isPass
      ? zoneBottom - zoneH * 0.35
      : clamp(zoneBottom - zoneH * (0.55 + (i % 3) * 0.14), zoneTop + 15, zoneBottom - zoneH * 0.3);
    pts.push({ x: peakX, y: peakY });
    pts.push({ x: step * (i + 1), y: zoneBottom - zoneH * (0.18 + (i % 2) * 0.1) });
  }
  pts.push({ x: COL_W + 20, y: zoneBottom });
  return { pts, passX: step * passIndex + step * 0.5, passY: zoneBottom - (zoneBottom - zoneTop) * 0.35 };
}

function renderRange(pts, zoneBottom) {
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${COL_W + 20},${zoneBottom} L-20,${zoneBottom} Z`;
  const snowCaps = pts
    .filter((_, i) => i % 2 === 1)
    .map((p) => `<path d="M${p.x - 15},${p.y + 20} L${p.x},${p.y} L${p.x + 15},${p.y + 20} L${p.x + 7},${p.y + 15} L${p.x},${p.y + 22} L${p.x - 7},${p.y + 15} Z" fill="#eef2ea" opacity="0.85" />`)
    .join("");
  return `
    <path d="${fillPath}" fill="#8c8270" />
    <path d="${line}" fill="none" stroke="#6b6353" stroke-width="3" opacity="0.6" />
    ${snowCaps}
  `;
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

// A narrow, consistent sliver of sea along the left edge of a clearing
// zone — well clear of the trail's own band (BAND.min is 60; this
// never reaches past WATER_EDGE_MAX, 42), so the trail never crosses
// it. Same edge, every clearing, the whole way down.
function computeZoneShore(zoneY, zoneH, seed) {
  const steps = Math.max(14, Math.round(zoneH / 40));
  const mid = 24;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const localY = (zoneH / steps) * i;
    const edgeFalloff = clamp(Math.min(localY / 70, (zoneH - localY) / 70), 0, 1);
    const envelope = 0.3 + 0.7 * edgeFalloff;
    const wobble = 16 * Math.sin(i * 0.5 + seed) + 8 * Math.sin(i * 1.3 + seed * 1.7);
    pts.push({ y: zoneY + localY, edge: clamp(mid + envelope * wobble, 8, WATER_EDGE_MAX) });
  }
  return pts;
}

function renderZoneWater(shore) {
  const band = jaggedBandPath(
    shore.map((s) => ({ x: -40, y: s.y })),
    shore.map((s) => ({ x: s.edge, y: s.y }))
  );
  const foamLine = shore.map((s, i) => `${i === 0 ? "M" : "L"}${s.edge},${s.y}`).join(" ");
  return `
    <path d="${band}" fill="url(#sentryPassWaterDepth)" opacity="0.9" />
    <path d="${foamLine}" stroke="#eef2ea" stroke-width="2.5" fill="none" opacity="0.4" stroke-linecap="round" />
  `;
}

function renderDefs() {
  return `
    <defs>
      <linearGradient id="sentryPassWaterDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2e4e5c" />
        <stop offset="100%" stop-color="#5f95a8" />
      </linearGradient>
    </defs>
  `;
}

function computeFoothillRocks(zoneBottom) {
  return [0.16, 0.4, 0.62, 0.88].map((f, i) => ({
    x: f * COL_W,
    y: zoneBottom - 5 - (i % 2) * 9,
    r: 18 + (i % 3) * 6,
  }));
}

function renderFoothillRock({ x, y, r }) {
  return `<path d="M${x - r},${y} L${x - r * 0.4},${y - r} L${x + r * 0.5},${y - r * 0.7} L${x + r},${y} Z" fill="#9c9280" stroke="#7a7260" stroke-width="2" />`;
}

const MOUNTAIN_EMOJI = ["🐐", "🦅"];
const CLEARING_EMOJI = ["🐚", "🦀"];

function renderDecorations(positions, zones) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const zone = zones.find((z) => p.y >= z.y && p.y < z.y + z.h) || zones[zones.length - 1];
      const side = p.x < (BAND.min + BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 15, BAND.max - 10);
      const emoji = zone.type === "clearing" ? CLEARING_EMOJI[i % CLEARING_EMOJI.length] : MOUNTAIN_EMOJI[i % MOUNTAIN_EMOJI.length];
      return `<text x="${dx}" y="${p.y - 12}" font-size="23" text-anchor="middle">${emoji}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const zones = computeZones(totalHeight);
  const grounds = zones
    .map((z) => `<rect x="0" y="${z.y}" width="${COL_W}" height="${z.h}" fill="${z.type === "mountain" ? "#ab9f86" : "#d8c896"}" />`)
    .join("");
  const mountains = zones
    .filter((z) => z.type === "mountain")
    .map((z) => {
      const range = computeRange(z.y, z.y + z.h);
      const foothillRocks = computeFoothillRocks(z.y + z.h).map(renderFoothillRock).join("");
      return `${renderRange(range.pts, z.y + z.h)}<g>${foothillRocks}</g>${renderWatchtower(range.passX, range.passY)}`;
    })
    .join("");
  const water = zones
    .filter((z) => z.type === "clearing")
    .map((z, i) => renderZoneWater(computeZoneShore(z.y, z.h, i * 1.9 + 0.6)))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: watchtower-guarded mountain passes alternating with clearings, a narrow sliver of sea hugging one edge the whole way down, connecting every Who's There? lesson up to ${bossName}'s own clearing">
      ${renderDefs()}
      ${grounds}
      ${water}
      ${mountains}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions, zones)}</g>
    </svg>
  `;
}

export const sentryPassTheme = {
  trailBand: BAND,
  mapBg: "#ab9f86",
  hintColor: "rgba(255, 252, 240, 0.85)",
  renderScene,
};
