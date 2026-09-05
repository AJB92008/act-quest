// Athenaeum Reef's own theme for Claim Check, Driftwood Cove's first
// skill (see lessonTerrain.js for the shared engine every lesson-path
// theme renders through, and reefCrown.js/coralMosaic.js for Coral
// Stacks' own pair). Claim Check is about weighing a claim against real
// evidence, so the scene is a half-collapsed dock: weathered driftwood
// pylons still standing in shallow water, each lesson stop marked by one
// piece of actual "evidence" washed up alongside it — a bottle, a key,
// an anchor, a compass — rather than generic scenery, the same way the
// skill itself rewards checking a claim against something concrete
// instead of taking it on faith.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const PYLON_FILL = "#8a7259";
const PYLON_DARK = "#6b5641";

// One weathered post, planted on whichever side of the trail it isn't
// using right there (same nearestPosition-free logic as the trail
// itself, since every position already alternates sides on its own
// wander) — a tapered post plus a rougher cross-plank nailed on at a
// slight angle, so it reads as a dock remnant rather than a plain pole.
function renderPylon(x, y, seed) {
  const h = 70 + (seed % 3) * 14;
  const topW = 9;
  const botW = 13;
  const plankY = y - h * 0.4;
  const tilt = (seed % 5) - 2;
  return `
    <polygon points="${x - botW},${y} ${x + botW},${y} ${x + topW},${y - h} ${x - topW},${y - h}" fill="${PYLON_FILL}" stroke="${PYLON_DARK}" stroke-width="2" />
    <rect x="${x - 20}" y="${plankY - 4}" width="40" height="8" rx="2" fill="${PYLON_DARK}" opacity="0.8" transform="rotate(${tilt} ${x} ${plankY})" />
  `;
}

function renderPylons(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .map((p, i) => {
      const side = p.x < mid ? 1 : -1;
      const px = clamp(p.x + side * 90, 30, COL_W - 30);
      return renderPylon(px, p.y + 20, i * 3);
    })
    .join("");
}

// One piece of evidence per every other lesson, on whichever side the
// pylon at that same stop isn't using — never the same item twice in a
// row, so the trail doesn't read as "bottle, bottle, bottle."
const EVIDENCE = ["🍾", "🗝️", "⚓", "🧭"];
function renderEvidence(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < mid ? -1 : 1;
      const ex = clamp(p.x + side * 60, 25, COL_W - 25);
      return `<text x="${ex}" y="${p.y - 6}" font-size="26" text-anchor="middle">${EVIDENCE[i % EVIDENCE.length]}</text>`;
    })
    .join("");
}

// Loose driftwood debris scattered across the whole floor, unrelated to
// the standing pylons — clutter that reads as wreckage, not more
// structure, and fills what would otherwise be a lot of flat open water.
function renderDebris(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 170));
  return Array.from({ length: count }, (_, i) => {
    const y = 60 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(30 + ((i * 113) % (COL_W - 60)), 20, COL_W - 20);
    const len = 22 + (i % 3) * 6;
    const angle = ((i * 37) % 40) - 20;
    return `<rect x="${x - len / 2}" y="${y - 3}" width="${len}" height="6" rx="3" fill="${PYLON_FILL}" opacity="0.5" transform="rotate(${angle} ${x} ${y})" />`;
  }).join("");
}

function defs() {
  return `
    <defs>
      <linearGradient id="driftwoodLockerWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9ccbd1" />
        <stop offset="100%" stop-color="#4f818a" />
      </linearGradient>
    </defs>
  `;
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#c9a887" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Driftwood Cove: a half-collapsed dock of weathered driftwood pylons in shallow water, one piece of evidence washed up alongside every other stop, connecting every Claim Check lesson up to ${bossName}'s own clearing">
      ${defs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#driftwoodLockerWater)" />
      <g>${renderDebris(totalHeight)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#f3ead6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderPylons(positions)}</g>
      <g>${renderEvidence(positions)}</g>
    </svg>
  `;
}

export const driftwoodLockerTheme = {
  trailBand: BAND,
  mapBg: "#4f818a",
  hintColor: "rgba(15, 30, 30, 0.75)",
  renderScene,
};
