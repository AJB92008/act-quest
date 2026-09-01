// ACT Science's own "hub" island — Lab Archipelago, built to the same
// bar as Math's Numeria Peaks (mathHub.js's own header comment has the
// full brief on why that one is a true archipelago rather than one
// blended landmass): separate hand-shaped islands in open water, each
// with its own biome, instead of a single rounded coastline. Same
// underlying "big walkable world" engine from hubWorld.js — this file
// owns only what's specific to Science: three islands grouped by actual
// ACT Science reporting category (Interpretation of Data, Scientific
// Investigation, Evaluation of Models & Results) instead of Math's four
// math topics, and lab-themed biomes (a data deck, a field station, an
// observatory) instead of Math's mountain/village/forest/desert.
//
// Deliberately its own file rather than a parameterized branch of
// mathHub.js — the two subjects' zones, palette, and biome art are
// unrelated, same reasoning mathHub.js's own header gives for not
// sharing with islandHub.js.
//
// Unlike Numeria Peaks, this archipelago's islands aren't the avatar's
// only walkable ground — there's no point-in-polygon collision here, so
// the amber "energy field" between islands (renderScienceBackdrop) is
// just as walkable as the islands themselves, the same open-world model
// Wordwood Isle/Athenaeum Reef use. That's a deliberate scope cut, not
// an oversight: it means no causeways are needed to keep foot travel
// between islands possible, since there's no water to block it in the
// first place.
//
// One landmark, unlike Numeria Peaks' none: ACT Science Background
// Knowledge (Science's own reference lesson, reachable from the plain
// island list's own reference card before this hub existed — see
// island.js's history) still needs a real entry point, so it gets its
// own marker on the path down to the boss, the same "walk onto it to
// open it" treatment islandHub.js's/readingHub.js's own landmarks use.
// It sits south of the three islands rather than at the world's raw
// CENTER, since CENTER falls inside Field Station's own territory here
// (unlike Wordwood Isle's round layout, where every zone radiates out
// from CENTER and a landmark there sits naturally in the middle of all
// of them). No goat/dev-mode easter egg — that unlock lives on
// Wordwood Isle only.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import { CENTER, BOSS_POS, BOSS_TRIGGER_RADIUS, WORLD_W, WORLD_H, WALK_MARGIN, renderWorldSvg, wireMovement, wireFullscreenToggle, joystickHTML } from "./hubWorld.js";
import { closedBlobPath } from "./lessonTerrain.js";

const SKILL_TRIGGER_RADIUS = 58;
const LANDMARK_TRIGGER_RADIUS = 150;

// Three islands, one per real ACT Science reporting category (see
// REPORTING_CATEGORIES.science in data/skills.js) — grouping by category
// rather than by skill order means the zoning stays correct even if a
// skill's position in the array ever changes. `decorations: []` mirrors
// mathHub.js's own zones: hubWorld.js's default decoration pass reads
// this field even though renderScienceRegions (this file's own
// regionShapes override) never calls it.
const ZONES = [
  { id: "datadeck", name: "Data Deck", categories: ["iod"], fill: "#e8b84f", decorations: [] },
  { id: "fieldstation", name: "Field Station", categories: ["sin"], fill: "#8fb86a", decorations: [] },
  { id: "observatory", name: "Observatory Ridge", categories: ["emi"], fill: "#6f8fc9", decorations: [] },
];

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 3.7) * 43758.5453;
  return x - Math.floor(x);
}

// The three topic territories tile the top band of the walkable width,
// same idea as mathHub.js's own TOP_BAND/BOSS_BAND split — just no
// BOSS_BAND here, since Science's boss sits on hubWorld.js's own default
// dark clearing rather than a fourth bespoke island (see this file's own
// header comment on skipping collision/causeways entirely).
const TOP_BAND = { y0: WALK_MARGIN, y1: 1000 };
const GUTTER = 70;

// Splits the walkable width into one column per zone, sized by how many
// of that zone's skills it actually holds — identical approach to
// mathHub.js's own computeTerritories, just against `categories` instead
// of `reportingCategory` membership stored differently... no, same field
// (`skill.reportingCategory`), just Science's own three category ids.
function computeTerritories(subject) {
  const zoneSkills = ZONES.map((zone) => subject.skills.filter((s) => zone.categories.includes(s.reportingCategory)));
  const total = zoneSkills.reduce((sum, s) => sum + s.length, 0);
  const fullWidth = WORLD_W - WALK_MARGIN * 2;
  let cursor = WALK_MARGIN;
  return ZONES.map((zone, i) => {
    const isFirst = i === 0;
    const isLast = i === ZONES.length - 1;
    const rawX0 = cursor;
    const rawX1 = isLast ? WORLD_W - WALK_MARGIN : cursor + (zoneSkills[i].length / total) * fullWidth;
    cursor = rawX1;
    return {
      zone,
      skills: zoneSkills[i],
      x0: isFirst ? rawX0 : rawX0 + GUTTER / 2,
      x1: isLast ? rawX1 : rawX1 - GUTTER / 2,
      y0: TOP_BAND.y0,
      y1: TOP_BAND.y1,
    };
  });
}

// A deterministic per-skill nudge off the raw grid point — same skill,
// same nudge, every render (a real RNG would make nodes visibly jump
// around on every re-render), just enough that the layout reads as
// hand-placed rather than machine-uniform. Caller scales it to that
// grid's own spacing, so it never comes close to overlapping a
// neighboring node even in a cramped, many-skill territory. Verbatim
// the same helper mathHub.js's own gridPositions uses.
function jitterFor(id, maxX, maxY) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  const hx = (Math.sin(h) * 43758.5453) % 1;
  const hy = (Math.sin(h * 1.37 + 4.1) * 12543.789) % 1;
  return { dx: (hx - Math.floor(hx) - 0.5) * 2 * maxX, dy: (hy - Math.floor(hy) - 0.5) * 2 * maxY };
}

// A simple row-major grid inside a territory's own inset bounds —
// verbatim the same layout mathHub.js's own gridPositions uses, so a
// zone's nodes are guaranteed to sit inside its own territory by
// construction rather than needing a containment check afterward. A
// small per-skill jitter (see jitterFor) breaks up the otherwise
// perfectly uniform rows/columns.
function gridPositions(territory) {
  const { skills, zone, x0, y0, x1, y1 } = territory;
  const n = skills.length;
  const width = x1 - x0;
  const height = y1 - y0;
  const cols = Math.max(1, Math.min(n, Math.round(width / 220)));
  const rows = Math.ceil(n / cols);
  const insetX = Math.min(115, width * 0.22);
  const insetY = Math.min(115, height * 0.22);
  const innerX0 = x0 + insetX;
  const innerX1 = x1 - insetX;
  const innerY0 = y0 + insetY;
  const innerY1 = y1 - insetY;
  const colSpacing = cols > 1 ? (innerX1 - innerX0) / (cols - 1) : innerX1 - innerX0;
  const rowSpacing = rows > 1 ? (innerY1 - innerY0) / (rows - 1) : innerY1 - innerY0;
  const jitterX = Math.min(20, Math.max(0, colSpacing) * 0.25);
  const jitterY = Math.min(20, Math.max(0, rowSpacing) * 0.25);
  const positions = [];
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    const itemsInRow = Math.min(cols, n - idx);
    const y = rows > 1 ? innerY0 + (row / (rows - 1)) * (innerY1 - innerY0) : (innerY0 + innerY1) / 2;
    for (let c = 0; c < itemsInRow; c++) {
      const x = itemsInRow > 1 ? innerX0 + (c / (itemsInRow - 1)) * (innerX1 - innerX0) : (innerX0 + innerX1) / 2;
      const { dx, dy } = jitterFor(skills[idx].id, jitterX, jitterY);
      const jx = x + dx;
      const jy = y + dy;
      positions.push({ item: skills[idx], zone, x: jx, y: jy, dockX: jx, dockY: jy + 34 });
      idx++;
    }
  }
  return positions;
}

function buildLayout(territories) {
  return territories.flatMap(gridPositions);
}

const SAND = "#ecdfb8";

// An organic outline around a rectangle — identical technique to
// mathHub.js's own organicIslandPoints (see that file's much longer
// comment for the full reasoning): trace the rect's true edge at each of
// n angles, then pad outward by `pad` (per-side, `{left,right,top,bottom}`)
// plus a seeded 0-30% bulge, so the padded shape always fully encloses
// the rect no matter how the jitter lands.
function organicIslandPoints(bbox, pad, seed, n = 48) {
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const p = typeof pad === "number" ? { left: pad, right: pad, top: pad, bottom: pad } : pad;
  const halfW = Math.max(50, (bbox.x1 - bbox.x0) / 2);
  const halfH = Math.max(50, (bbox.y1 - bbox.y0) / 2);
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const tx = dirX !== 0 ? halfW / Math.abs(dirX) : Infinity;
    const ty = dirY !== 0 ? halfH / Math.abs(dirY) : Infinity;
    const hitsVerticalEdge = tx <= ty;
    const rectR = hitsVerticalEdge ? tx : ty;
    const padSide = hitsVerticalEdge ? (dirX >= 0 ? p.right : p.left) : dirY >= 0 ? p.bottom : p.top;
    const bulge = 1 + pseudoRandom(seed * 31 + i) * 0.3;
    const r = rectR + padSide * bulge;
    return { x: cx + dirX * r, y: cy + dirY * r };
  });
}

const DEFAULT_SHORE_PAD = 150;
const SHORE_RING_WIDTH = 55;
function innerPadFor(outerPad) {
  if (typeof outerPad === "number") return Math.max(20, outerPad - SHORE_RING_WIDTH);
  return {
    left: Math.max(20, outerPad.left - SHORE_RING_WIDTH),
    right: Math.max(20, outerPad.right - SHORE_RING_WIDTH),
    top: Math.max(20, outerPad.top - SHORE_RING_WIDTH),
    bottom: Math.max(20, outerPad.bottom - SHORE_RING_WIDTH),
  };
}

// Squeezes the default shoreline pad down (only on a side that actually
// faces a neighboring island) so two islands' shorelines can never
// overlap outright — same safety math as mathHub.js's own safeShorePad,
// minus the collision-walkability stakes that file's own version guards
// against (this hub has no point-in-polygon walking to corrupt), kept
// anyway because overlapping shorelines look wrong regardless of whether
// anything walks on them.
const WATER_GUTTER = 26;
const MIN_SHORE_PAD = 20;
const MAX_BULGE = 1.3;
function safeShorePad(gap) {
  if (gap == null) return DEFAULT_SHORE_PAD;
  return Math.max(MIN_SHORE_PAD, Math.min(DEFAULT_SHORE_PAD, (gap / 2 - WATER_GUTTER) / MAX_BULGE));
}

// A full-bleed amber "energy field" behind the islands — Lab
// Archipelago's own equivalent of mathHub.js's open-water backdrop
// (renderMathLandmass), tuned to Science's own amber brand color instead
// of forcing this hub into the same blue-water palette every other
// subject's hub already uses. The faint grid overlay (graph paper, not
// ripples) nods at Data Deck without needing its own decoration.
function renderScienceBackdrop() {
  return `
    <defs>
      <radialGradient id="labField" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#fff3d6" />
        <stop offset="55%" stop-color="#e0a34a" />
        <stop offset="100%" stop-color="#3d2a12" />
      </radialGradient>
      <pattern id="labGrid" width="90" height="90" patternUnits="userSpaceOnUse">
        <path d="M0 0 H90 M0 0 V90" stroke="rgba(255,255,255,0.16)" stroke-width="1.5" fill="none" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" fill="url(#labField)" />
    <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" fill="url(#labGrid)" opacity="0.5" />
  `;
}

// One island: a sand shoreline ring under the zone's own solid-colored
// interior — same "lighter ring under solid fill" construction as
// mathHub.js's own renderIsland, minus the mini-mountain range every
// Numeria Peaks island gets (Lab Archipelago's own terrain interest
// comes from each zone's biome props below instead).
function renderIsland(bbox, fill, seed, outerPad = DEFAULT_SHORE_PAD) {
  const innerPad = innerPadFor(outerPad);
  const outerPts = organicIslandPoints(bbox, outerPad, seed);
  const innerPts = organicIslandPoints(bbox, innerPad, seed);
  return `
    <path d="${closedBlobPath(outerPts)}" fill="${SAND}" />
    <path d="${closedBlobPath(innerPts)}" fill="${fill}" />
  `;
}

// Scatters `count` points in the open ring between a zone's tight node
// bbox and its own shoreline — same technique as mathHub.js's own
// ringPositions, so biome props land on solid ground around the nodes
// rather than on top of them or out past the shoreline.
function ringPositions(bbox, count, seedBase, minPad, maxPad) {
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const halfW = (bbox.x1 - bbox.x0) / 2;
  const halfH = (bbox.y1 - bbox.y0) / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (pseudoRandom(seedBase * 17 + i) - 0.5) * 0.9;
    const pad = minPad + pseudoRandom(seedBase * 23 + i) * (maxPad - minPad);
    return {
      x: cx + Math.cos(angle) * (halfW + pad),
      y: cy + Math.sin(angle) * (halfH + pad),
      seed: seedBase * 31 + i + 1,
    };
  });
}

// Data Deck — a monitor showing a little bar graph, a server tower with
// a couple of status lights, and a small dish antenna.
function renderMonitor(x, y, seed) {
  const bars = [0.4, 0.7, 0.5, 0.9].map((h, i) => h * (0.7 + pseudoRandom(seed + i) * 0.3));
  const barsSvg = bars
    .map((h, i) => {
      const bw = 6;
      const bx = x - 16 + i * 10;
      const bh = h * 22;
      return `<rect x="${bx.toFixed(1)}" y="${(y - 3 - bh).toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" fill="#5fd0c0" />`;
    })
    .join("");
  return `
    <ellipse cx="${x}" cy="${y + 24}" rx="20" ry="6" fill="rgba(40,25,5,0.2)" />
    <rect x="${x - 26}" y="${y - 20}" width="52" height="34" rx="3" fill="#2a2f3a" stroke="#14171d" stroke-width="2" />
    <rect x="${x - 22}" y="${y - 16}" width="44" height="26" fill="#12222a" />
    ${barsSvg}
    <rect x="${x - 5}" y="${y + 14}" width="10" height="8" fill="#3a3f4a" />
    <rect x="${x - 14}" y="${y + 21}" width="28" height="5" rx="2" fill="#3a3f4a" />
  `;
}

function renderServerTower(x, y, seed) {
  const lights = [0, 1, 2].map((i) => {
    const on = pseudoRandom(seed + i) > 0.35;
    return `<circle cx="${x + 10}" cy="${(y - 24 + i * 10).toFixed(1)}" r="2.6" fill="${on ? "#7fe08a" : "#3a4650"}" />`;
  });
  return `
    <ellipse cx="${x}" cy="${y + 30}" rx="16" ry="5" fill="rgba(40,25,5,0.2)" />
    <rect x="${x - 14}" y="${y - 34}" width="28" height="64" rx="2" fill="#3a4048" stroke="#1c2026" stroke-width="2" />
    ${lights.join("")}
    <rect x="${x - 8}" y="${y - 10}" width="16" height="3" fill="#20242a" />
    <rect x="${x - 8}" y="${y + 2}" width="16" height="3" fill="#20242a" />
  `;
}

function renderDishAntenna(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 14}" rx="10" ry="4" fill="rgba(40,25,5,0.18)" />
    <line x1="${x}" y1="${y + 10}" x2="${x}" y2="${y - 10}" stroke="#7a7566" stroke-width="3" />
    <path d="M${x - 16},${y - 8} Q${x},${y - 26} ${x + 16},${y - 8} Q${x},${y - 16} ${x - 16},${y - 8} Z" fill="#dfe4e8" stroke="#9aa2ab" stroke-width="1.5" />
  `;
}

// Field Station — a canvas tent, a petri dish on a stand, and a
// sprouting plant.
function renderTent(x, y, seed) {
  const stripe = pseudoRandom(seed) > 0.5;
  return `
    <ellipse cx="${x}" cy="${y + 22}" rx="30" ry="7" fill="rgba(20,40,10,0.18)" />
    <path d="M${x - 30},${y + 20} L${x},${y - 30} L${x + 30},${y + 20} Z" fill="${stripe ? "#e8dcc0" : "#d9e4c8"}" stroke="#7a6a48" stroke-width="2" />
    <path d="M${x},${y - 30} L${x},${y + 20}" stroke="#7a6a48" stroke-width="1.5" />
    <path d="M${x - 9},${y + 20} L${x},${y + 2} L${x + 9},${y + 20} Z" fill="#4a4038" />
  `;
}

function renderPetriDish(x, y, seed) {
  const colonyColor = ["#8fd0a0", "#e0a860", "#c98fb8"][seed % 3];
  return `
    <ellipse cx="${x}" cy="${y + 12}" rx="16" ry="5" fill="rgba(20,40,10,0.16)" />
    <rect x="${x - 3}" y="${y - 6}" width="6" height="18" fill="#8a9aa0" />
    <ellipse cx="${x}" cy="${y - 10}" rx="17" ry="8" fill="#eef2ee" stroke="#b8c0c4" stroke-width="1.5" />
    <circle cx="${(x - 4 + pseudoRandom(seed) * 6).toFixed(1)}" cy="${(y - 11).toFixed(1)}" r="3" fill="${colonyColor}" opacity="0.85" />
    <circle cx="${(x + 3 + pseudoRandom(seed + 1) * 5).toFixed(1)}" cy="${(y - 9).toFixed(1)}" r="2.2" fill="${colonyColor}" opacity="0.7" />
  `;
}

function renderSprout(x, y, seed) {
  const lean = (pseudoRandom(seed) - 0.5) * 8;
  return `
    <ellipse cx="${x}" cy="${y + 4}" rx="8" ry="3" fill="rgba(20,40,10,0.16)" />
    <path d="M${x},${y + 3} Q${(x + lean).toFixed(1)},${y - 14} ${x},${y - 24}" stroke="#4a7a3a" stroke-width="2.5" fill="none" />
    <path d="M${x},${(y - 16).toFixed(1)} Q${(x - 12).toFixed(1)},${(y - 20).toFixed(1)} ${(x - 3).toFixed(1)},${(y - 26).toFixed(1)} Z" fill="#6fae54" />
    <path d="M${x},${(y - 10).toFixed(1)} Q${(x + 12).toFixed(1)},${(y - 14).toFixed(1)} ${(x + 3).toFixed(1)},${(y - 20).toFixed(1)} Z" fill="#7fbf60" />
  `;
}

// Observatory Ridge — a telescope on a tripod, a small dome, and an
// orbit ring with one bright point.
function renderTelescope(x, y, seed) {
  const tilt = 30 + pseudoRandom(seed) * 15;
  const rad = (tilt * Math.PI) / 180;
  const tubeLen = 40;
  const tx = x + Math.cos(rad) * tubeLen;
  const ty = y - 20 - Math.sin(rad) * tubeLen;
  return `
    <ellipse cx="${x}" cy="${y + 14}" rx="14" ry="5" fill="rgba(10,15,30,0.22)" />
    <line x1="${x - 12}" y1="${y + 12}" x2="${x}" y2="${y - 8}" stroke="#4a4a5a" stroke-width="2.5" />
    <line x1="${x + 12}" y1="${y + 12}" x2="${x}" y2="${y - 8}" stroke="#4a4a5a" stroke-width="2.5" />
    <line x1="${x}" y1="${y + 14}" x2="${x}" y2="${y - 8}" stroke="#4a4a5a" stroke-width="2.5" />
    <line x1="${x}" y1="${y - 20}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#8a8fae" stroke-width="7" stroke-linecap="round" />
    <circle cx="${x}" cy="${y - 20}" r="6" fill="#6a6f8e" />
  `;
}

function renderObservatoryDome(x, y, seed) {
  const w = 30 + pseudoRandom(seed) * 8;
  return `
    <ellipse cx="${x}" cy="${y + 6}" rx="${(w * 1.1).toFixed(1)}" ry="6" fill="rgba(10,15,30,0.2)" />
    <rect x="${(x - w).toFixed(1)}" y="${y - 4}" width="${(w * 2).toFixed(1)}" height="18" fill="#cfd2de" />
    <path d="M${(x - w).toFixed(1)},${y - 4} A${w.toFixed(1)},${(w * 0.85).toFixed(1)} 0 0 1 ${(x + w).toFixed(1)},${y - 4} Z" fill="#e4e6ee" stroke="#aeb3c4" stroke-width="1.5" />
    <path d="M${x},${(y - 4 - w * 0.85).toFixed(1)} L${x},${y - 4}" stroke="#aeb3c4" stroke-width="2" />
  `;
}

function renderOrbitRing(x, y, seed) {
  const rot = pseudoRandom(seed) * 40 - 20;
  const angle = pseudoRandom(seed + 1) * Math.PI * 2;
  const px = x + Math.cos(angle) * 22;
  const py = y + Math.sin(angle) * 8;
  return `
    <ellipse cx="${x}" cy="${y}" rx="24" ry="9" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.5" transform="rotate(${rot.toFixed(1)} ${x} ${y})" />
    <circle cx="${x}" cy="${y}" r="7" fill="#8fa8d6" />
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#f0e4c0" />
  `;
}

const ISLAND_BIOMES = {
  datadeck: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 5, seedBase, min, max)
      .map((p, i) => (i % 3 === 0 ? renderServerTower(p.x, p.y, p.seed) : i % 3 === 1 ? renderMonitor(p.x, p.y, p.seed) : renderDishAntenna(p.x, p.y)))
      .join("");
  },
  fieldstation: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 5, seedBase, min, max)
      .map((p, i) => (i % 3 === 0 ? renderTent(p.x, p.y, p.seed) : i % 3 === 1 ? renderPetriDish(p.x, p.y, p.seed) : renderSprout(p.x, p.y, p.seed)))
      .join("");
  },
  observatory: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 5, seedBase, min, max)
      .map((p, i) => (i % 3 === 0 ? renderTelescope(p.x, p.y, p.seed) : i % 3 === 1 ? renderObservatoryDome(p.x, p.y, p.seed) : renderOrbitRing(p.x, p.y, p.seed)))
      .join("");
  },
};

function renderIslandBiome(zoneId, bbox, seedBase, ringCap) {
  const renderer = ISLAND_BIOMES[zoneId];
  return renderer ? renderer(bbox, seedBase, ringCap) : "";
}

// The three islands, spaced apart with shoreline padding shrunk (only on
// the side facing a neighbor) so they never overlap — see safeShorePad
// above. No causeways and no boss island (compare mathHub.js's own
// renderMathRegions): this hub's open water is walkable ground, and the
// boss sits on hubWorld.js's own default dark clearing.
function renderScienceRegions(zoneGroups) {
  const boxes = zoneGroups.map(({ points }) => {
    if (!points.length) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  });

  const pads = boxes.map((box, i) => {
    if (!box) return DEFAULT_SHORE_PAD;
    const leftGap = boxes[i - 1] ? box.x0 - boxes[i - 1].x1 : null;
    const rightGap = boxes[i + 1] ? boxes[i + 1].x0 - box.x1 : null;
    return { left: safeShorePad(leftGap), right: safeShorePad(rightGap), top: DEFAULT_SHORE_PAD, bottom: DEFAULT_SHORE_PAD };
  });

  return zoneGroups
    .map(({ zone }, i) => {
      const bbox = boxes[i];
      if (!bbox) return "";
      const innerPad = innerPadFor(pads[i]);
      const ringCap = Math.max(25, Math.min(innerPad.left, innerPad.right, innerPad.top, innerPad.bottom) - 10);
      return renderIsland(bbox, zone.fill, i + 1, pads[i]) + renderIslandBiome(zone.id, bbox, i + 1, ringCap);
    })
    .join("");
}

// Each zone's own nodes get connected in the order they were placed,
// same idea as mathHub.js's own renderMathTrails — a path through just
// that zone's own skills, not one radiating from the world's shared
// CENTER (which would cut across the other zones' own territories here).
function renderScienceTrails(zoneGroups) {
  return zoneGroups
    .map(({ points }) => {
      if (points.length < 2) return "";
      const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return `<path d="${d}" stroke="#5c4a3a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />`;
    })
    .join("");
}

function renderSkillMarker({ item: skill, x, y }, subject) {
  const progress = gameState.getSkillProgress(skill.id);
  const totalLessons = getLessonCount(skill.id);
  const stateClass = progress.mastered ? "is-mastered" : "is-open";
  return `
    <div class="hub-marker-wrap" style="left:${x}px;top:${y}px;">
      <button class="hub-skill-marker node-circle node-circle-small ${stateClass}" data-skill="${skill.id}"
        style="--node-color:${subject.color}"
        aria-label="${skill.name}: ${progress.mastered ? "mastered" : `${progress.lessonsCompleted} of ${totalLessons} lessons complete`}">
        ${progress.mastered ? "✓" : ""}
      </button>
      <span class="hub-skill-name">${skill.name}</span>
    </div>
  `;
}

// South of the three islands, along the same north-south line as the
// default dark path to the boss (hubWorld.js draws that path from raw
// CENTER, which sits at this same x) — reads as a waypoint on the way
// to the boss rather than a stray marker in open space.
const LANDMARK_POS = { x: CENTER.x, y: 1150 };

function renderLandmarkMarker() {
  return `
    <div class="hub-marker-wrap" style="left:${LANDMARK_POS.x}px;top:${LANDMARK_POS.y}px;">
      <button class="hub-landmark" data-landmark aria-label="ACT Science Background Knowledge">
        <span class="hub-landmark-icon">📚</span>
      </button>
      <span class="hub-skill-name hub-landmark-name">Background Knowledge</span>
    </div>
  `;
}

function renderBossMarker(boss, bossStateClass, subject) {
  const locked = bossStateClass === "is-locked";
  const cleared = bossStateClass === "is-cleared";
  return `
    <div class="hub-marker-wrap" style="left:${BOSS_POS.x}px;top:${BOSS_POS.y}px;">
      <button class="hub-boss-marker ${bossStateClass}" data-boss ${locked ? "disabled" : ""}
        aria-label="${boss.name}, ${subject.name} Boss Quiz${cleared ? " (cleared)" : locked ? `: locked until every skill on this island is mastered` : ""}">
        ${monsterSVG(boss.avatar, { size: 74 })}
        ${cleared ? `<span class="hub-boss-crown">👑</span>` : locked ? `<span class="hub-boss-lock">🔒</span>` : ""}
      </button>
      <span class="hub-skill-name hub-boss-name">${locked ? "🔒 " : ""}${boss.name}</span>
    </div>
  `;
}

export function renderScienceHub(root, navigate, subject) {
  const territories = computeTerritories(subject);
  const layout = buildLayout(territories);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Lab Archipelago, an archipelago of separate islands floating over an amber energy field — a data deck, a field station, and an observatory ridge — each with its own trail of science skills, plus a dark path south to the boss's own clearing",
    landmass: renderScienceBackdrop,
    regionShapes: renderScienceRegions,
    trails: renderScienceTrails,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen lab-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) across the islands — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${joystickHTML("hubJoystick")}
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderLandmarkMarker()}
          ${renderBossMarker(boss, bossStateClass, subject)}
          <div class="hub-avatar" id="hubAvatar" aria-hidden="true">${monsterSVG(gameState.getDisplayAvatar(), { size: 46 })}</div>
        </div>
      </div>
    </main>
  `;

  let stop = () => {};
  const goTo = (screen, params) => {
    stop();
    navigate(screen, params);
  };

  wireHud(root, goTo);
  root.querySelector("[data-back]").addEventListener("click", () => goTo("map"));
  root.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => goTo("skillPath", { skillId: btn.dataset.skill, subjectId: subject.id }));
  });
  root.querySelector("[data-landmark]").addEventListener("click", () => goTo("background", { subjectId: subject.id }));
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    // 800 + 100 = 900: far enough south of the islands' own bottom edge
    // (they cluster around y~325-845) to spawn on open ground, and far
    // enough north of LANDMARK_POS (1150) that the 150px landmark trigger
    // radius doesn't reach all the way back up to the spawn point itself
    // (900 to 1150 is a 250px gap) — spawning inside a trigger's own
    // radius would fire that trigger the instant the avatar takes a
    // single step, before the player has any chance to walk elsewhere.
    spawn: { x: CENTER.x, y: CENTER.y + 100 },
    targets: [
      { x: LANDMARK_POS.x, y: LANDMARK_POS.y, radius: LANDMARK_TRIGGER_RADIUS, onArrive: () => goTo("background", { subjectId: subject.id }) },
      { x: BOSS_POS.x, y: BOSS_POS.y, radius: BOSS_TRIGGER_RADIUS, gate: () => allMastered, onArrive: () => goTo("bossQuiz", { subjectId: subject.id }) },
      ...layout.map((p) => ({
        x: p.x,
        y: p.y,
        radius: SKILL_TRIGGER_RADIUS,
        onArrive: () => goTo("skillPath", { skillId: p.item.id, subjectId: subject.id }),
      })),
    ],
  });
  stop = () => {
    stopMovement();
    unwireFullscreen();
  };
}
