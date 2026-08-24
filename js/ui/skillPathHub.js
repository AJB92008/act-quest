// Per-skill "skins" for the zoomed-in lesson-path terrain (see
// lessonTerrain.js for the shared engine every one of these renders
// through — the trail's own wander math, lesson/boss markers, and the
// screen's chrome/wiring are shared, but each skill's own `renderScene`
// below draws a genuinely different composition, not just a recolor of
// the same one). Each skill's own look is meant to match where its node
// actually sits on Wordwood Isle's own map: Idiom Instinct is in the
// light-green meadow zone, so it gets open plains with a river; Phrase
// Finder is in the darker forest zone, so it gets dense jungle — no
// river, lots of trees, and far more scattered wildlife.
import { COL_W, clamp, bandPath, renderTrailPath, nearestPosition, renderLessonTerrainPath } from "./lessonTerrain.js";

const RIVER_BAND = { min: 30, max: 210 };
const PLAINS_LAND_BAND = { min: 260, max: COL_W - 40 };

// A self-contained wavy ribbon of water, confined to RIVER_BAND — both
// banks bulge in and out down the whole page, at a large enough
// amplitude relative to the band's own width that it reads unmistakably
// as a winding river rather than a straight-edged panel, and the ribbon
// never touches the canvas's left edge (so there's always dry ground
// visible on both sides of it, not a hard cut at the frame boundary).
function computeRiver(totalHeight) {
  const steps = Math.max(20, Math.round(totalHeight / 110));
  const mid = (RIVER_BAND.min + RIVER_BAND.max) / 2;
  const swing = (RIVER_BAND.max - RIVER_BAND.min) / 2 - 34;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const center = mid + swing * Math.sin(i * 0.5 + 0.4) + swing * 0.45 * Math.sin(i * 1.3 + 2.0);
    const halfWidth = 32 + 14 * Math.sin(i * 0.85 + 1.1);
    return {
      y,
      left: clamp(center - halfWidth, RIVER_BAND.min, RIVER_BAND.max),
      right: clamp(center + halfWidth, RIVER_BAND.min, RIVER_BAND.max),
    };
  });
}

function renderRiver(totalHeight) {
  const banks = computeRiver(totalHeight);
  return bandPath(
    banks.map((b) => ({ x: b.left, y: b.y })),
    banks.map((b) => ({ x: b.right, y: b.y }))
  );
}

// A couple of soft hill mounds within the land band, each placed on the
// opposite side of the trail from wherever the trail happens to be at
// that height — so the trail always reads as skirting around the near
// edge of one, rather than the two overlapping by coincidence.
function computeHills(positions, totalHeight) {
  const mid = (PLAINS_LAND_BAND.min + PLAINS_LAND_BAND.max) / 2;
  return [0.2, 0.48, 0.76].map((f, i) => {
    const hy = f * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const hx = clamp(mid + side * (PLAINS_LAND_BAND.max - PLAINS_LAND_BAND.min) * 0.32, PLAINS_LAND_BAND.min + 55, PLAINS_LAND_BAND.max - 15);
    return { x: hx, y: hy, r: 90 + (i % 2) * 18 };
  });
}

const PLAINS_DECOR_EMOJI = ["📖", "🔖", "🖋️", "📜", "🦉", "🔍"];
const PLAINS_AMBIENT_EMOJI = ["🌾", "🌿", "🌼"];

function renderPlainsDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (PLAINS_LAND_BAND.min + PLAINS_LAND_BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 70, PLAINS_LAND_BAND.min + 20, PLAINS_LAND_BAND.max - 5);
      const dy = p.y - 14;
      return `<text x="${dx}" y="${dy}" font-size="30" text-anchor="middle">${PLAINS_DECOR_EMOJI[i % PLAINS_DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderPlainsAmbient(totalHeight) {
  const count = Math.max(6, Math.round(totalHeight / 260));
  return Array.from({ length: count }, (_, i) => {
    const y = 60 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(
      PLAINS_LAND_BAND.min + 25 + ((i * 73) % (PLAINS_LAND_BAND.max - PLAINS_LAND_BAND.min - 50)),
      PLAINS_LAND_BAND.min + 10,
      PLAINS_LAND_BAND.max - 10
    );
    return `<text x="${x}" y="${y}" font-size="22" opacity="0.8" text-anchor="middle">${PLAINS_AMBIENT_EMOJI[i % PLAINS_AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderPlainsScene(positions, totalHeight, bossName) {
  const hills = computeHills(positions, totalHeight)
    .map(
      ({ x, y, r }) => `
        <ellipse cx="${x}" cy="${y + 16}" rx="${r}" ry="${r * 0.58}" fill="rgba(20,45,30,0.16)" />
        <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#8db35f" />
        <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.12}" rx="${r * 0.55}" ry="${r * 0.32}" fill="#a3c777" opacity="0.75" />
      `
    )
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: open grassy plains with a winding river down one side, hills, and a trail connecting every Idiom Instinct lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#c3dd8f" />
      <g>${renderPlainsAmbient(totalHeight)}</g>
      <path d="${renderRiver(totalHeight)}" fill="#7fa8b8" opacity="0.75" />
      <g>${hills}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderPlainsDecorations(positions)}</g>
    </svg>
  `;
}

// Phrase Finder's own jungle — deliberately not a recolor of the plains
// scene above: no river at all (the trail gets the whole width instead),
// a proper scatter of individual tree clusters rather than a couple of
// smooth hills, and wildlife/foliage at nearly every stop instead of
// every third, plus its own denser, wider-varied ambient scatter.
const JUNGLE_BAND = { min: 45, max: COL_W - 45 };
const JUNGLE_TREE_COUNT = 10;
const JUNGLE_FAUNA_EMOJI = ["🦜", "🐒", "🐍", "🐸", "🦋", "🕷️"];
const JUNGLE_FLORA_EMOJI = ["🌴", "🌺", "🍄", "🪵"];
const JUNGLE_AMBIENT_EMOJI = ["🍃", "🌿", "🍄", "🕸️"];

function computeJungleTrees(positions, totalHeight) {
  const mid = (JUNGLE_BAND.min + JUNGLE_BAND.max) / 2;
  return Array.from({ length: JUNGLE_TREE_COUNT }, (_, i) => {
    const hy = ((i + 0.5) / JUNGLE_TREE_COUNT) * totalHeight;
    const nearest = nearestPosition(positions, hy);
    const side = nearest.x < mid ? 1 : -1;
    const dist = 95 + (i % 3) * 42;
    const tx = clamp(nearest.x + side * dist, JUNGLE_BAND.min + 25, JUNGLE_BAND.max - 25);
    const r = 34 + (i % 4) * 9;
    return { x: tx, y: hy, r };
  });
}

// Three overlapping canopy blobs staggered around a short trunk — reads
// as an actual clump of trees rather than one smooth mound.
function renderJungleTree({ x, y, r }) {
  return `
    <rect x="${x - 4}" y="${y + r * 0.25}" width="8" height="${r * 0.85}" fill="#5a3d22" rx="3" />
    <ellipse cx="${x}" cy="${y + r * 0.35}" rx="${r * 0.6}" ry="${r * 0.26}" fill="rgba(6,16,4,0.28)" />
    <circle cx="${x - r * 0.4}" cy="${y}" r="${r * 0.55}" fill="#2f5626" />
    <circle cx="${x + r * 0.42}" cy="${y - r * 0.08}" r="${r * 0.6}" fill="#3a6b2e" />
    <circle cx="${x}" cy="${y - r * 0.48}" r="${r * 0.62}" fill="#4a7a3a" />
  `;
}

// Wildlife and foliage sit at nearly every stop (skipping only every
// other one, not every third) — this is meant to feel busier and more
// varied than Idiom Instinct's sparse "one detail every few lessons."
function renderJungleDecorations(positions) {
  const pool = [...JUNGLE_FAUNA_EMOJI, ...JUNGLE_FLORA_EMOJI];
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = p.x < (JUNGLE_BAND.min + JUNGLE_BAND.max) / 2 ? 1 : -1;
      const jitter = 55 + (i % 3) * 22;
      const dx = clamp(p.x + side * jitter, JUNGLE_BAND.min + 15, JUNGLE_BAND.max - 15);
      const dy = p.y - 10 - (i % 2) * 10;
      return `<text x="${dx}" y="${dy}" font-size="28" text-anchor="middle">${pool[i % pool.length]}</text>`;
    })
    .join("");
}

// A denser, more varied loose scatter than Idiom Instinct's ambient
// wheat — bigger emoji pool, tighter spacing, mixed sizes, since a jungle
// floor is meant to feel cluttered rather than open.
function renderJungleAmbient(totalHeight) {
  const count = Math.max(12, Math.round(totalHeight / 130));
  return Array.from({ length: count }, (_, i) => {
    const y = 50 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(JUNGLE_BAND.min + 20 + ((i * 61) % (JUNGLE_BAND.max - JUNGLE_BAND.min - 40)), JUNGLE_BAND.min + 10, JUNGLE_BAND.max - 10);
    const size = 18 + (i % 3) * 6;
    return `<text x="${x}" y="${y}" font-size="${size}" opacity="0.85" text-anchor="middle">${JUNGLE_AMBIENT_EMOJI[i % JUNGLE_AMBIENT_EMOJI.length]}</text>`;
  }).join("");
}

function renderJungleScene(positions, totalHeight, bossName) {
  const trees = computeJungleTrees(positions, totalHeight)
    .map(renderJungleTree)
    .join("");
  const last = positions[positions.length - 1];
  const bossClearing = `
    <circle cx="${last.x}" cy="${last.y}" r="90" fill="#dfe0c4" stroke="#7d8f5c" stroke-width="4" />
    <text x="${last.x - 72}" y="${last.y - 58}" font-size="26">🌿</text>
    <text x="${last.x + 66}" y="${last.y + 56}" font-size="26">🌿</text>
  `;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: dense jungle thick with trees, vines, and animals, and a trail connecting every Phrase Finder lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#3f6b34" />
      <g>${renderJungleAmbient(totalHeight)}</g>
      <g>${trees}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#7a5a35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderJungleDecorations(positions)}</g>
    </svg>
  `;
}

export const LESSON_THEMES = {
  "en-idioms": {
    trailBand: PLAINS_LAND_BAND,
    mapBg: "#c3dd8f",
    hintColor: "rgba(25, 40, 10, 0.75)",
    renderScene: renderPlainsScene,
  },
  "en-verbalphrases": {
    trailBand: JUNGLE_BAND,
    mapBg: "#3f6b34",
    hintColor: "rgba(240, 250, 230, 0.85)",
    renderScene: renderJungleScene,
  },
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
