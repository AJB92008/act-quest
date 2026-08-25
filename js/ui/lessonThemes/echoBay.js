// Sound-Alike Showdown's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — the odd one out of
// this batch's coastal group: instead of mountains dominant with the
// sea along one edge, here the OCEAN dominates the whole scene, and
// rocky cliffs run down both the far left and far right edges, each
// topped with its own small, irregular cluster of peaks — the sea
// "that is by mountains." The water itself carries the depth cue: pale
// turquoise shallows right against each cliff, deepening to a dark
// channel in the middle where the trail actually runs. The signature
// device is a run of sound-wave arcs radiating from each cliff face
// toward the other, meeting in the middle of the bay — two matching
// walls facing off across the water, a literal "showdown" of things
// that sound alike.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 150, max: COL_W - 150 };

function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

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

// The cliff's outer edge (away from the bay, off past the frame) is
// meant to read as more land continuing off-screen, not water — so
// unlike the coastal themes' water bands, it stays a solid fill rather
// than fading to transparent. A little scattered scree near the true
// edge keeps it from reading as one flat mechanical wall.
function renderCliffBand(edge, side) {
  const pts = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const outerX = side === "left" ? -40 : COL_W + 40;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillPath = `${line} L${outerX},${edge[edge.length - 1].y} L${outerX},0 Z`;
  return `<path d="${fillPath}" fill="#8c8270" stroke="#6b6353" stroke-width="2" opacity="0.95" />`;
}

function renderOuterScree(totalHeight, side) {
  const count = Math.max(10, Math.round(totalHeight / 130));
  return Array.from({ length: count }, (_, i) => {
    const seed = (side === "left" ? 3 : 71) + i * 3.3;
    const y = ((i + 0.5) / count) * totalHeight;
    const x = side === "left" ? rand(seed) * 34 : COL_W - rand(seed) * 34;
    const r = 5 + rand(seed + 0.5) * 7;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#79705f" opacity="0.6" />`;
  }).join("");
}

// A little cluster of 2-3 unevenly sized, unevenly spaced peaks per
// cliff-top, instead of one repeated identical triangle — real
// archipelago peaks vary in height, width, and shape.
function computeCluster(side, seedBase, baseY) {
  const cx0 = side === "left" ? 45 : COL_W - 45;
  const peakCount = rand(seedBase) > 0.45 ? 3 : 2;
  const spacing = 42 + rand(seedBase + 0.2) * 12;
  return Array.from({ length: peakCount }, (_, p) => {
    const s = seedBase + p * 4.3;
    const h = 55 + rand(s) * 65;
    const w = h * (0.4 + rand(s + 0.5) * 0.3);
    const dx = (p - (peakCount - 1) / 2) * spacing + (rand(s + 0.8) - 0.5) * 12;
    return {
      x: cx0 + dx,
      baseY: baseY + (rand(s + 1.6) - 0.5) * 18,
      h,
      w,
      snow: h > 100,
      dark: rand(s + 1.2) > 0.55,
    };
  });
}

function renderPeak(p) {
  const rock = p.dark ? "#7c7260" : "#a0947e";
  const stroke = p.dark ? "#5c5346" : "#7a7260";
  let out = `<path d="M${p.x - p.w / 2},${p.baseY} L${p.x},${p.baseY - p.h} L${p.x + p.w / 2},${p.baseY} Z" fill="${rock}" stroke="${stroke}" stroke-width="2" />`;
  if (p.snow) {
    out += `<path d="M${p.x - p.w * 0.32},${p.baseY - p.h * 0.55} L${p.x},${p.baseY - p.h} L${p.x + p.w * 0.32},${p.baseY - p.h * 0.55} L${p.x + p.w * 0.16},${p.baseY - p.h * 0.42} L${p.x},${p.baseY - p.h * 0.6} L${p.x - p.w * 0.16},${p.baseY - p.h * 0.42} Z" fill="#eef2ea" opacity="0.85" />`;
  }
  return out;
}

function computeClusters(totalHeight) {
  const count = Math.max(3, Math.round(totalHeight / 380));
  return Array.from({ length: count }, (_, i) => {
    const y = ((i + 0.5) / count) * totalHeight + 50;
    return {
      left: computeCluster("left", i * 13.7 + 1, y),
      right: computeCluster("right", i * 17.3 + 50, y),
    };
  });
}

function renderPeaks(totalHeight) {
  return computeClusters(totalHeight)
    .flatMap((c) => [...c.left, ...c.right])
    .map(renderPeak)
    .join("");
}

// The waterline itself: a band of foam/wet rock hugging each cliff's
// jagged edge, plus a bright surf-line stroke right at the boundary —
// so the rock visibly emerges from the water instead of just floating
// above a flat-colored sea.
function renderShoreline(edge, side) {
  const inward = side === "left" ? 1 : -1;
  const boundary = edge.map((e) => ({ x: side === "left" ? e.depth : COL_W - e.depth, y: e.y }));
  const foamOuter = edge.map((e) => ({ x: (side === "left" ? e.depth : COL_W - e.depth) + inward * 18, y: e.y }));
  const line1 = boundary.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const line2 = [...foamOuter]
    .reverse()
    .map((p) => `L${p.x},${p.y}`)
    .join(" ");
  const band = `<path d="${line1} ${line2} Z" fill="#cdeee6" opacity="0.4" />`;
  const surf = `<path d="${line1}" stroke="#eef8f4" stroke-width="2.5" fill="none" opacity="0.65" />`;
  return band + surf;
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

// A horizontal depth cue rather than a top-to-bottom vignette: pale
// turquoise shallows right against each cliff, deepening toward the
// dark open channel in the middle where the trail runs.
function renderWaterDefs() {
  return `
    <defs>
      <linearGradient id="echoBayDepth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#5fb0ad" />
        <stop offset="16%" stop-color="#2f6d78" />
        <stop offset="50%" stop-color="#173a48" />
        <stop offset="84%" stop-color="#2f6d78" />
        <stop offset="100%" stop-color="#5fb0ad" />
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
  const peaks = renderPeaks(totalHeight);
  const shorelines = renderShoreline(leftEdge, "left") + renderShoreline(rightEdge, "right");
  const scree = renderOuterScree(totalHeight, "left") + renderOuterScree(totalHeight, "right");
  const last = positions[positions.length - 1];
  const bossClearing = `<ellipse cx="${last.x}" cy="${last.y}" rx="88" ry="60" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: an open bay between two rocky cliffs topped with irregular mountain clusters, pale shallows at the shoreline deepening to a dark channel, sound-wave arcs echoing between the two sides, connecting every Sound-Alike Showdown lesson up to ${bossName}'s own clearing">
      ${renderWaterDefs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#echoBayDepth)" />
      ${renderCliffBand(leftEdge, "left")}
      ${renderCliffBand(rightEdge, "right")}
      <g>${scree}</g>
      ${shorelines}
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
  mapBg: "#173a48",
  hintColor: "rgba(240, 245, 245, 0.9)",
  renderScene,
};
