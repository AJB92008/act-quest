// Athenaeum Reef's own theme for Big Picture, Coral Stacks' first skill
// (see lessonTerrain.js for the shared engine every lesson-path theme
// renders through). Big Picture asks "what's the main idea," so the
// scene leans into exactly one dominant idea: a single oversized coral
// crown formation the trail winds *around* rather than through, with a
// handful of small satellite corals kept well clear of it. Everything
// else in the scene stays small and quiet specifically so that one
// central shape reads as unmissable — the same way a main idea is meant
// to stand out above a passage's supporting details. First pass at this
// (a flat single-color background, three smooth soft-edged blobs) read
// as too plain rather than deliberately minimal — this version keeps the
// exact same "one dominant, everything else quiet" concept but actually
// renders it with real depth (a lit-water gradient, light shafts, kelp)
// and real coral texture (finger bumps, an outline, polyp speckle,
// a grounding shadow) instead of flat shapes.
import { COL_W, clamp, blobPoints, closedBlobPath, renderTrailPath, nearestPosition } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };

// The crown sits near the trail's own vertical midpoint, offset to
// whichever side the trail isn't using right there — same
// nearest-position-aware placement plains.js's hills use, just for one
// large feature instead of several small ones.
function crownCenter(positions, totalHeight) {
  const cy = totalHeight * 0.42;
  const nearest = nearestPosition(positions, cy);
  const mid = (BAND.min + BAND.max) / 2;
  const side = nearest.x < mid ? 1 : -1;
  const cx = clamp(mid + side * (BAND.max - BAND.min) * 0.3, BAND.min + 100, BAND.max - 40);
  return { x: cx, y: cy };
}

function defs() {
  return `
    <defs>
      <linearGradient id="reefCrownWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8fd6e0" />
        <stop offset="45%" stop-color="#5fb0c4" />
        <stop offset="100%" stop-color="#2f6f85" />
      </linearGradient>
      <radialGradient id="reefCrownGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff6e0" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#fff6e0" stop-opacity="0" />
      </radialGradient>
    </defs>
  `;
}

// A few soft diagonal shafts of surface light — the classic underwater
// cue that there's a sky above the frame, not just tinted water. Widest
// (and most transparent) at the top, narrowing as they reach down, drawn
// once at fixed positions rather than tied to the trail so they read as
// ambient lighting, not another marker to track.
function renderLightRays(totalHeight) {
  const rays = [0.18, 0.5, 0.8];
  return rays
    .map((f, i) => {
      const topX = COL_W * f;
      const bottomX = topX - 70 - i * 14;
      const width = 46 + i * 10;
      return `<polygon points="${(topX - width / 2).toFixed(1)},0 ${(topX + width / 2).toFixed(1)},0 ${(bottomX + 16).toFixed(1)},${totalHeight} ${(bottomX - 16).toFixed(1)},${totalHeight}" fill="#eafcff" opacity="0.09" />`;
    })
    .join("");
}

// A handful of kelp fronds rooted at the very bottom, swaying in a slow
// sine curve — background depth filler, deliberately muted (low opacity,
// desaturated green) so it reads as "something is down there" without
// competing with the crown for attention the way a brighter or larger
// shape would.
function renderKelp(totalHeight) {
  const roots = [0.08, 0.24, 0.7, 0.92];
  return roots
    .map((f, i) => {
      const x = COL_W * f;
      const height = totalHeight * (0.5 + (i % 2) * 0.12);
      const top = totalHeight - height;
      const sway = 26 + (i % 3) * 8;
      const path = `M${x},${totalHeight} C${x - sway},${totalHeight - height * 0.66} ${x + sway},${top + height * 0.33} ${x},${top}`;
      return `<path d="${path}" stroke="#3f8f7a" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.22" />`;
    })
    .join("");
}

// Three nested, jittered rings (not one flat blob) so the crown reads as
// a tall branching coral tower rather than a single boulder — each ring
// a little smaller and higher than the last, all sharing one seed family
// so they bulge in matching directions like a real single growth would.
// Each layer now also gets: a darker outline (defines the silhouette
// against the water instead of just a flat-color edge), small finger
// bumps around its rim (blobPoints with more points and a sharper
// wobble, instead of the smooth 14-point ellipse-ish outline the first
// pass used), and a scatter of darker polyp-texture dots across its own
// interior.
const LAYER_SEED = 3.1;
const LAYERS = [
  { r: 150, dy: 0, fill: "#e8895f", edge: "#c05f3a", dots: "#c05f3a" },
  { r: 108, dy: -46, fill: "#f0a978", edge: "#cf7f52", dots: "#d98a5c" },
  { r: 66, dy: -84, fill: "#f6c79a", edge: "#e0a06e", dots: "#e8b483" },
];

function fingeryBlob(cx, cy, r, seed) {
  const pts = blobPoints(cx, cy, r, 22, seed);
  // A second, higher-frequency wobble layered on top of blobPoints' own
  // smooth undulation, at a small enough amplitude to read as coral
  // fingers rather than a jagged/broken outline.
  return pts.map((p, i) => {
    const a = (i / pts.length) * Math.PI * 2;
    const bump = 1 + 0.09 * Math.sin(a * 9 + seed * 3);
    return { x: cx + (p.x - cx) * bump, y: cy + (p.y - cy) * bump };
  });
}

function polypDots(cx, cy, r, seed, fill) {
  const count = Math.round(r / 11);
  return Array.from({ length: count }, (_, i) => {
    const a = i * 2.4 + seed;
    const dist = r * (0.25 + 0.55 * ((Math.sin(i * 12.9 + seed) + 1) / 2));
    const dx = cx + Math.cos(a) * dist;
    const dy = cy + Math.sin(a) * dist * 0.85;
    return `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3.2" fill="${fill}" opacity="0.55" />`;
  }).join("");
}

function renderCrown(center) {
  const shadow = `<ellipse cx="${center.x}" cy="${center.y + 18}" rx="150" ry="34" fill="#0d2e33" opacity="0.22" />`;
  const glow = `<circle cx="${center.x}" cy="${center.y - 60}" r="190" fill="url(#reefCrownGlow)" />`;
  const layers = LAYERS.map(({ r, dy, fill, edge, dots }, i) => {
    const cy = center.y + dy;
    const pts = fingeryBlob(center.x, cy, r, LAYER_SEED + i * 1.7);
    const path = closedBlobPath(pts);
    return `<path d="${path}" fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round" />${polypDots(center.x, cy, r, i * 4.2, dots)}`;
  }).join("");
  return shadow + glow + layers;
}

// A few small, deliberately unremarkable satellite corals, kept outside
// the crown's own footprint (its widest layer's radius plus a margin)
// so nothing competes with it for attention.
const SATELLITE_FILLS = ["#7fd9c4", "#5fb8a6", "#9be3d2"];
function renderSatellites(positions, crown) {
  return positions
    .filter((_, i) => i % 2 === 0)
    .map((p, i) => {
      const dist = Math.hypot(p.x - crown.x, p.y - crown.y);
      if (dist < 220) return "";
      const pts = blobPoints(p.x + (i % 2 === 0 ? 34 : -34), p.y + 8, 20 + (i % 3) * 6, 10, i * 2.3);
      return `<path d="${closedBlobPath(pts)}" fill="${SATELLITE_FILLS[i % SATELLITE_FILLS.length]}" opacity="0.85" />`;
    })
    .join("");
}

// Three species at three sizes/opacities (not one emoji repeated at one
// size) so the water reads as inhabited at a few different depths rather
// than a single flat row of identical fish.
const AMBIENT = [
  { emoji: "🐠", size: 24, opacity: 0.85 },
  { emoji: "🫧", size: 16, opacity: 0.55 },
  { emoji: "🐟", size: 20, opacity: 0.75 },
  { emoji: "🫧", size: 11, opacity: 0.4 },
];
function renderAmbient(totalHeight) {
  const count = Math.max(10, Math.round(totalHeight / 150));
  return Array.from({ length: count }, (_, i) => {
    const y = 40 + ((totalHeight - 80) / (count - 1 || 1)) * i;
    const x = clamp(20 + ((i * 137) % (COL_W - 40)), 20, COL_W - 20);
    const a = AMBIENT[i % AMBIENT.length];
    return `<text x="${x}" y="${y}" font-size="${a.size}" opacity="${a.opacity}" text-anchor="middle">${a.emoji}</text>`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const crown = crownCenter(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#d8b98a" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Coral Stacks: sunlit water with light shafts and drifting kelp, one large textured coral crown formation with a handful of small satellite corals, and a trail connecting every Big Picture lesson up to ${bossName}'s own clearing">
      ${defs()}
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="url(#reefCrownWater)" />
      ${renderLightRays(totalHeight)}
      ${renderKelp(totalHeight)}
      <g>${renderAmbient(totalHeight)}</g>
      <g>${renderCrown(crown)}</g>
      <g>${renderSatellites(positions, crown)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#e8d9b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const reefCrownTheme = {
  trailBand: BAND,
  mapBg: "#5fb0c4",
  hintColor: "rgba(10, 35, 40, 0.75)",
  renderScene,
};
