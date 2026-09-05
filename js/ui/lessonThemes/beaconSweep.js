// Athenaeum Reef's own theme for Cause & Effect, Lighthouse Point's
// first skill (see lessonTerrain.js for the shared engine every
// lesson-path theme renders through). The scene pairs a cause with its
// effect at every single stop, never one without the other: a rock
// (cause) sits right where the water breaks against it, with a burst of
// spray (effect) right beside it — and the lighthouse itself, standing
// over the whole scene, is the one fixed thing every pair traces back
// to, the same way a real cause-and-effect chain has one source.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };

function renderLighthouse(x, y) {
  return `
    <polygon points="${x - 16},${y} ${x + 16},${y} ${x + 10},${y - 90} ${x - 10},${y - 90}" fill="#f3ead6" stroke="#c9a887" stroke-width="3" />
    <rect x="${x - 10}" y="${y - 70}" width="20" height="10" fill="#e8895f" />
    <rect x="${x - 10}" y="${y - 40}" width="20" height="10" fill="#e8895f" />
    <polygon points="${x - 14},${y - 90} ${x + 14},${y - 90} ${x},${y - 112}" fill="#c9564f" />
    <circle cx="${x}" cy="${y - 96}" r="7" fill="#ffe9a8" />
    <polygon points="${x},${y - 96} ${x + 280},${y - 246} ${x + 280},${y + 54}" fill="#ffe9a8" opacity="0.14" />
  `;
}

// One rock struck by breaking spray — cause (the rock) and effect (the
// spray) drawn as a single inseparable unit rather than two things that
// merely happen to be near each other.
function renderCauseEffect(x, y) {
  const rockR = 16;
  return `
    <ellipse cx="${x}" cy="${y + 6}" rx="${rockR}" ry="${rockR * 0.7}" fill="#8a8a86" stroke="#6b6b66" stroke-width="2" />
    <circle cx="${x + 22}" cy="${y - 8}" r="4" fill="#eafcff" opacity="0.85" />
    <circle cx="${x + 30}" cy="${y - 2}" r="3" fill="#eafcff" opacity="0.7" />
    <circle cx="${x + 16}" cy="${y - 16}" r="3" fill="#eafcff" opacity="0.65" />
  `;
}

function renderPairs(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .map((p) => {
      const side = p.x < mid ? 1 : -1;
      const x = clamp(p.x + side * 70, 40, COL_W - 40);
      return renderCauseEffect(x, p.y);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#e8d29a" stroke-width="4" />`;
  const lighthouseX = clamp(positions[0].x, 130, COL_W - 130);

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Lighthouse Point: a lighthouse casting its beam over the water, a rock struck by breaking spray at every stop, connecting every Cause and Effect lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#6fa8b0" />
      ${renderLighthouse(lighthouseX, 140)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#f3ead6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderPairs(positions)}</g>
    </svg>
  `;
}

export const beaconSweepTheme = {
  trailBand: BAND,
  mapBg: "#6fa8b0",
  hintColor: "rgba(15, 30, 30, 0.75)",
  renderScene,
};
