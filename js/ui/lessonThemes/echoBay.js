// Sound-Alike Showdown's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — the odd one out of
// this batch's coastal group: instead of mountains dominant with the
// sea along one edge, here the OCEAN dominates the whole scene, and
// rocky cliffs run down both the far left and far right edges with a
// mountain peak cresting above each near the top — the sea "that is by
// mountains." The signature device is a run of sound-wave arcs radiating
// from each cliff face toward the other, meeting in the middle of the
// bay — two matching walls facing off across the water, a literal
// "showdown" of things that sound alike.
import { COL_W, clamp, bandPath, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 150, max: COL_W - 150 };

function computeCliffEdge(totalHeight, phase) {
  const steps = Math.max(40, Math.round(totalHeight / 42));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const wobble =
      58 * Math.sin(i * 0.38 + phase) +
      36 * Math.sin(i * 1.0 + phase * 1.6) +
      22 * Math.sin(i * 2.2 + phase * 0.7) +
      12 * Math.sin(i * 4.9 + phase * 2.1);
    return { y, depth: clamp(90 + wobble, 25, 145) };
  });
}

function renderCliffBand(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  return `<path d="${fillPath}" fill="#8c8270" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
}

// Mountain peaks cresting above each cliff, recurring down the whole
// scene — "the sea that is by mountains," not just once near the top.
function renderPeakAccent(side, baseY, h) {
  const cx = side === "left" ? 40 : COL_W - 40;
  const w = h * 0.6;
  return `
    <path d="M${cx - w},${baseY} L${cx},${baseY - h} L${cx + w},${baseY} Z" fill="#948a78" stroke="#6b6353" stroke-width="2" />
    <path d="M${cx - w * 0.35},${baseY - h * 0.5} L${cx},${baseY - h} L${cx + w * 0.35},${baseY - h * 0.5} L${cx + w * 0.18},${baseY - h * 0.38} L${cx},${baseY - h * 0.58} L${cx - w * 0.18},${baseY - h * 0.38} Z" fill="#eef2ea" opacity="0.88" />
  `;
}

function computePeakAccents(totalHeight) {
  const count = Math.max(2, Math.round(totalHeight / 480));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * totalHeight + 60,
    h: 130 + (i % 2) * 30,
  }));
}

// Short ripple lines scattered across the whole open bay, so the water
// has texture everywhere, not just where the echo arcs are.
function renderAmbientRipples(totalHeight) {
  const count = Math.max(14, Math.round(totalHeight / 130));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight;
    const cx = BAND.min + 20 + ((i * 97) % (BAND.max - BAND.min - 40));
    const w = 46 + (i % 3) * 14;
    return `<path d="M${cx - w / 2},${y} Q${cx},${y - 6} ${cx + w / 2},${y}" stroke="#eef2ea" stroke-width="2" fill="none" opacity="0.22" />`;
  }).join("");
}

function renderWaterDefs() {
  return `
    <defs>
      <linearGradient id="echoBayDepth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3f6f82" />
        <stop offset="100%" stop-color="#2c5060" />
      </linearGradient>
    </defs>
  `;
}

// Concentric arcs from each cliff, meeting in the bay's own middle —
// sound bouncing back and forth between two matching walls.
function renderEchoArcs(totalHeight) {
  const spots = [0.16, 0.4, 0.62, 0.85];
  return spots
    .map((f) => {
      const y = f * totalHeight;
      const rings = [70, 130, 190];
      const left = rings
        .map((r) => `<path d="M-10,${y - r * 0.5} Q${r},${y} -10,${y + r * 0.5}" stroke="#eef2ea" stroke-width="2" fill="none" opacity="${0.32 - rings.indexOf(r) * 0.08}" />`)
        .join("");
      const right = rings
        .map((r) => `<path d="M${COL_W + 10},${y - r * 0.5} Q${COL_W - r},${y} ${COL_W + 10},${y + r * 0.5}" stroke="#eef2ea" stroke-width="2" fill="none" opacity="${0.32 - rings.indexOf(r) * 0.08}" />`)
        .join("");
      return left + right;
    })
    .join("");
}

// Small stepping stones under alternating lesson stops, so the trail
// still reads as something you can actually stand on out in the bay.
function renderSteppingStones(positions) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p) => `<ellipse cx="${p.x}" cy="${p.y + 6}" rx="20" ry="9" fill="#8c8270" opacity="0.5" />`)
    .join("");
}

const DECOR_EMOJI = ["🐟", "🕊️"];

function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < COL_W / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 48, BAND.min + 10, BAND.max - 10);
      return `<text x="${dx}" y="${p.y - 14}" font-size="20" text-anchor="middle" opacity="0.9">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const leftEdge = computeCliffEdge(totalHeight, 0.4);
  const rightEdge = computeCliffEdge(totalHeight, 2.1);
  const echoArcs = renderEchoArcs(totalHeight);
  const ripples = renderAmbientRipples(totalHeight);
  const steppingStones = renderSteppingStones(positions);
  const peaks = computePeakAccents(totalHeight)
    .map((p) => renderPeakAccent("left", p.y, p.h) + renderPeakAccent("right", p.y, p.h))
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<ellipse cx="${last.x}" cy="${last.y}" rx="88" ry="60" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: an open bay between two rocky cliffs with mountains cresting above them, sound-wave arcs echoing between the two sides, connecting every Sound-Alike Showdown lesson up to ${bossName}'s own clearing">
      ${renderWaterDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#echoBayDepth)" />
      ${renderCliffBand(leftEdge, "left")}
      ${renderCliffBand(rightEdge, "right")}
      ${peaks}
      <g>${ripples}</g>
      ${echoArcs}
      <g>${steppingStones}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#eef2ea" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 13" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
    </svg>
  `;
}

export const echoBayTheme = {
  trailBand: BAND,
  mapBg: "#2c5060",
  hintColor: "rgba(240, 245, 245, 0.9)",
  renderScene,
};
