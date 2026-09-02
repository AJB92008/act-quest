// Trig Trailhead's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — a purple forest
// (matching Numeria Peaks' own Skyline Functions zone, trees leading,
// spires only a faint distant skyline), opening at a real trailhead
// signpost — the skill's own name, taken literally, planted at the very
// first lesson rather than implied — then marked at intervals by a
// circle split into its four quadrants, each carrying its own sign,
// centered right on the trail's own line rather than floating beside
// it (an earlier version also threaded a sine-wave ribbon through the
// scene, but it shared the trail's own warm amber color and read as a
// confusing second path rather than background texture — removed).
import { COL_W, clamp, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 45, max: COL_W - 45 };
const GROUND = "#443a66";
const CANOPY_PALETTES = [
  ["#6f6690", "#8b7fc4", "#a89adf"],
  ["#5c4f7a", "#7a6ba8", "#9a8cc4"],
  ["#4a3d66", "#6a5a90", "#8a7ab0"],
];

function renderDistantSkyline() {
  const spires = Array.from({ length: 6 }, (_, i) => {
    const x = BAND.min + 10 + i * ((BAND.max - BAND.min - 20) / 5);
    const h = 30 + (i % 3) * 14;
    return `<path d="M${(x - 9).toFixed(1)},40 L${x.toFixed(1)},${(40 - h).toFixed(1)} L${(x + 9).toFixed(1)},40 Z" fill="#6f6690" opacity="0.35" />`;
  }).join("");
  return `<g>${spires}</g>`;
}

function renderTree(x, y, r, palette, jitter) {
  const [c1, c2, c3] = CANOPY_PALETTES[palette % CANOPY_PALETTES.length];
  return `
    <rect x="${(x - 3.5).toFixed(1)}" y="${(y + r * 0.25).toFixed(1)}" width="7" height="${(r * 0.8).toFixed(1)}" fill="#453a5c" rx="3" />
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.35).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${(r * 0.24).toFixed(1)}" fill="rgba(10,6,20,0.3)" />
    <circle cx="${(x - r * (0.32 + jitter * 0.1)).toFixed(1)}" cy="${(y + jitter * 5).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${c1}" />
    <circle cx="${(x + r * (0.35 + jitter * 0.08)).toFixed(1)}" cy="${(y - r * 0.08 - jitter * 4).toFixed(1)}" r="${(r * 0.55).toFixed(1)}" fill="${c2}" />
    <circle cx="${(x - jitter * 7).toFixed(1)}" cy="${(y - r * 0.44).toFixed(1)}" r="${(r * 0.56).toFixed(1)}" fill="${c3}" />
  `;
}

function computeScatterTrees(positions, totalHeight) {
  const count = Math.max(6, Math.round(totalHeight / 520));
  const mid = (BAND.min + BAND.max) / 2;
  return Array.from({ length: count }, (_, i) => {
    const hy = ((i + 0.5) / count) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const tx = clamp(nearest.x + side * (85 + (i % 3) * 30), BAND.min + 25, BAND.max - 25);
    return { x: tx, y: hy, r: 28 + (i % 4) * 7, palette: i, jitter: ((i * 5) % 7) / 6 - 0.5 };
  });
}

function renderScatterTrees(positions, totalHeight) {
  return computeScatterTrees(positions, totalHeight)
    .map(({ x, y, r, palette, jitter }) => renderTree(x, y, r, palette, jitter))
    .join("");
}

// The trailhead itself — a real signpost, planted at the very first
// lesson rather than the skill's own name only appearing in text.
function renderTrailheadSign(x, y) {
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 64}" stroke="#453a5c" stroke-width="5" />
    <g transform="rotate(-8 ${x} ${y - 46})">
      <rect x="${x - 2}" y="${y - 54}" width="52" height="16" fill="#efe4cf" stroke="#453a5c" stroke-width="1.5" rx="2" />
      <text x="${x + 24}" y="${y - 42}" font-size="11" font-weight="700" fill="#453a5c" text-anchor="middle">sin θ</text>
    </g>
    <g transform="rotate(9 ${x} ${y - 30})">
      <rect x="${x - 46}" y="${y - 38}" width="48" height="16" fill="#efe4cf" stroke="#453a5c" stroke-width="1.5" rx="2" />
      <text x="${x - 22}" y="${y - 26}" font-size="11" font-weight="700" fill="#453a5c" text-anchor="middle">cos θ</text>
    </g>
  `;
}

// A circle split into its four quadrants, each carrying its own sign —
// the same picture a unit circle's own quadrant rules are taught with.
function renderQuadrantCircle(cx, cy, r) {
  return `
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="#efe4cf" stroke-width="3" opacity="0.88" />
    <line x1="${(cx - r).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + r).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#efe4cf" stroke-width="1.5" opacity="0.6" />
    <line x1="${cx.toFixed(1)}" y1="${(cy - r).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + r).toFixed(1)}" stroke="#efe4cf" stroke-width="1.5" opacity="0.6" />
    <text x="${(cx + r * 0.45).toFixed(1)}" y="${(cy - r * 0.4).toFixed(1)}" font-size="15" fill="#c9a668" text-anchor="middle">+</text>
    <text x="${(cx - r * 0.45).toFixed(1)}" y="${(cy - r * 0.4).toFixed(1)}" font-size="15" fill="#efe4cf" text-anchor="middle">−</text>
    <text x="${(cx - r * 0.45).toFixed(1)}" y="${(cy + r * 0.55).toFixed(1)}" font-size="15" fill="#c9a668" text-anchor="middle">+</text>
    <text x="${(cx + r * 0.45).toFixed(1)}" y="${(cy + r * 0.55).toFixed(1)}" font-size="15" fill="#efe4cf" text-anchor="middle">−</text>
  `;
}

// Centered directly on the trail's own line (nearest.x, not offset to
// either side) — the quadrant sign sits right on the dotted path
// itself rather than floating beside it.
function computeQuadrantCircles(positions, totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 850));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.7) / count) * totalHeight;
    const nearest = nearestPosition(positions, y);
    return { cx: nearest.x, cy: nearest.y, r: 42 };
  });
}

function renderQuadrantCircles(positions, totalHeight) {
  return computeQuadrantCircles(positions, totalHeight)
    .map(({ cx, cy, r }) => renderQuadrantCircle(cx, cy, r))
    .join("");
}

function renderAmbient(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => {
    const y = 90 + ((totalHeight - 140) / (count - 1 || 1)) * i;
    const x = clamp(BAND.min + 20 + ((i * 61) % (BAND.max - BAND.min - 40)), BAND.min + 10, BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="17" opacity="0.55" text-anchor="middle">✨</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const scatter = renderScatterTrees(positions, totalHeight);
  const circles = renderQuadrantCircles(positions, totalHeight);
  const first = positions[0];
  const sign = renderTrailheadSign(clamp(first.x, BAND.min + 40, BAND.max - 40), first.y - 20);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="90" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: a purple forest opening at a real trailhead signpost, marked by quadrant-sign circles sitting right on the trail itself at intervals, a distant skyline above the canopy, connecting every Trig Trailhead lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      ${renderDistantSkyline()}
      <g>${renderAmbient(totalHeight)}</g>
      <g>${scatter}</g>
      ${circles}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#c9a668" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      ${sign}
    </svg>
  `;
}

export const trigTrailheadTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(240, 236, 250, 0.85)",
  renderScene,
};
