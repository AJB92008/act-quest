// ACT Math's own "hub" island — Numeria Peaks, the Math equivalent of
// Wordwood Isle (islandHub.js's own header comment has the full English
// brief; this file mirrors its structure but is deliberately its own
// file rather than a parameterized branch of islandHub.js, since the
// two subjects' zones, palette, and landmass are unrelated). Same
// underlying "big walkable world" engine from hubWorld.js (world/camera
// geometry, movement, fullscreen toggle) — this file owns only what's
// specific to Math: an archipelago of separate mountainous islands in
// open water instead of Wordwood Isle's one rounded coastline, and four
// zones grouped by actual math topic (algebra, geometry, functions,
// number & stats) rather than English's positional quadrants, so each
// zone's terrain flavor matches what's actually studied there.
//
// Unlike Wordwood Isle (and this file's own first two drafts), Math's
// zones do NOT use hubWorld.js's computeZoneLayout — that function
// radiates every zone's markers out from one shared CENTER point, which
// is a natural fit for four quadrants fanning out around a round island,
// but for a spread-out set of islands it produces zones whose actual
// marker spread varies with skill count and direction in ways a single
// generic "cap the region near its centroid" rule can't reliably contain
// (some markers ended up outside their own zone's supposed region).
// Instead, this file tiles the walkable width into four explicit,
// non-overlapping rectangular *territories* (widths proportional to each
// zone's own skill count) purely to decide node placement — each zone's
// nodes sit on a simple grid inside its own territory's inset bounds, so
// every node is guaranteed to sit inside its own zone by construction.
// The *visible* island shapes are then drawn separately (renderIsland),
// tightly around each zone's actual node cluster rather than around the
// full territory column, which is what leaves open water between
// neighboring islands without moving a single node. The boss gets its
// own island in a reserved band below the four topic ranges, so it's
// part of the same layout rather than a leftover marker in open space.
//
// No center landmark (Math has no Vocabulary-Builder equivalent) and no
// goat/dev-mode easter egg — that unlock lives on Wordwood Isle only;
// once unlocked there it stays unlocked everywhere, so there's nothing
// to duplicate here.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import { CENTER, BOSS_POS, BOSS_TRIGGER_RADIUS, WORLD_W, WORLD_H, WALK_MARGIN, renderWorldSvg, wireMovement, wireFullscreenToggle } from "./hubWorld.js";
import { closedBlobPath } from "./lessonTerrain.js";

const SKILL_TRIGGER_RADIUS = 58;

// A cohesive family of muted rock tones (all pulled toward the same
// lavender-gray the landmass itself uses) instead of four unrelated
// bright hues — reads as different strata of one mountain range rather
// than four clashing UI colors dropped on a purple background.
// `decorations: []` (not omitted) — hubWorld.js's own default decoration
// pass reads `zone.decorations` unconditionally, even though it never
// gets called here (this file's own renderMathRegions never renders it,
// so there's no icon clutter), so the field still needs to exist as an
// empty array rather than being left off entirely.
const ZONES = [
  { id: "algebra", name: "Ironroot Algebra", categories: ["algebra"], fill: "#a8785f", decorations: [] },
  { id: "geometry", name: "Shalefoot Geometry", categories: ["geometry"], fill: "#7d93a8", decorations: [] },
  { id: "functions", name: "Skyline Functions", categories: ["functions"], fill: "#8b7fc4", decorations: [] },
  { id: "numstats", name: "Goldtally Flats", categories: ["numquant", "stats"], fill: "#b99a5c", decorations: [] },
];
const BOSS_FILL = "#4a4358";

// The four topic territories tile the top band of the walkable width;
// the boss gets its own reserved band below them, offset enough to leave
// a visible gap between the two bands. These bounds only ever drive
// *node placement* (computeTerritories/gridPositions below) — the
// visible island shapes are drawn separately, tightly around each
// zone's actual node cluster rather than these full columns, which is
// what leaves open water between islands even though node positions
// never change (see renderMathRegions).
const TOP_BAND = { y0: WALK_MARGIN, y1: 1120 };
const BOSS_BAND = { y0: 1170, y1: WORLD_H - WALK_MARGIN };
// Half-gutter trimmed off each side of a territory that touches a
// neighbor, so two adjacent zones' own node grids never crowd flush
// against each other even before the island art adds its own spacing.
const GUTTER = 44;

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 3.7) * 43758.5453;
  return x - Math.floor(x);
}

// Splits the walkable width into one column per zone, sized by how many
// of that zone's skills it actually holds (a 6-skill zone gets a wider
// column than a 3-skill one), so box size is a deliberate reflection of
// content instead of an emergent side effect of marker math.
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

// A simple row-major grid *inside* a territory's own inset bounds — every
// node's (x, y) is a convex combination of that territory's own inner
// corners, so containment holds by construction rather than needing a
// separate "does this fit" check afterward. Column count adapts to the
// territory's own width (roughly one column per 220px) so a narrow
// territory gets a tall single column instead of cramming into 3 wide
// ones, and a wide one spreads out instead of stacking unnecessarily.
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
  const positions = [];
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    const itemsInRow = Math.min(cols, n - idx);
    const y = rows > 1 ? innerY0 + (row / (rows - 1)) * (innerY1 - innerY0) : (innerY0 + innerY1) / 2;
    for (let c = 0; c < itemsInRow; c++) {
      const x = itemsInRow > 1 ? innerX0 + (c / (itemsInRow - 1)) * (innerX1 - innerX0) : (innerX0 + innerX1) / 2;
      positions.push({ item: skills[idx], zone, x, y, dockX: x, dockY: y + 34 });
      idx++;
    }
  }
  return positions;
}

function buildLayout(territories) {
  return territories.flatMap(gridPositions);
}

// A full-bleed ocean, edge to edge across all of WORLD_W x WORLD_H, so
// there is no seam anywhere the camera's own clamped panning could ever
// expose (see hubWorld.js's wireMovement: the camera never shows past
// the world's edges in the first place, so covering exactly those edges
// guarantees zero gap, at any viewport size). The four topic islands
// (plus the boss's own) sit on top of this, so it reads as water behind
// and between them rather than a flat page-background color.
function renderMathLandmass() {
  return `
    <defs>
      <radialGradient id="mathOcean" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#cfe6ea" />
        <stop offset="55%" stop-color="#5f8fa8" />
        <stop offset="100%" stop-color="#28405c" />
      </radialGradient>
      <pattern id="mathOceanRipple" width="420" height="130" patternUnits="userSpaceOnUse">
        <path d="M0 40 Q105 20 210 40 T420 40" stroke="rgba(255,255,255,0.28)" stroke-width="2" fill="none" />
        <path d="M0 90 Q105 68 210 90 T420 90" stroke="rgba(255,255,255,0.16)" stroke-width="2" fill="none" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" fill="url(#mathOcean)" />
    <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" fill="url(#mathOceanRipple)" opacity="0.5" />
  `;
}

const SAND = "#ecdfb8";

// An organic outline around a rectangle: at each of `n` angles around the
// rect's own center, the base radius is however far that angle's ray
// reaches the rect's edge *plus* `pad`, then bulges further outward by a
// random 0-30% (seeded, so it's fixed per island, not re-randomized every
// render) — never inward. That one-directional bulge is what guarantees
// the padded rectangle stays fully enclosed no matter how the jitter
// lands, while still tracing an uneven, rounded, "hand-drawn landmass"
// silhouette instead of a crisp box — closedBlobPath (lessonTerrain.js)
// then threads a smooth curve through those points instead of straight
// segments between them.
function organicIslandPoints(bbox, pad, seed, n = 16) {
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const halfW = (bbox.x1 - bbox.x0) / 2 + pad;
  const halfH = (bbox.y1 - bbox.y0) / 2 + pad;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const ex = Math.cos(angle) * halfW;
    const ey = Math.sin(angle) * halfH;
    const bulge = 1 + pseudoRandom(seed * 31 + i) * 0.3;
    return { x: cx + ex * bulge, y: cy + ey * bulge };
  });
}

// A small range of 2-3 jagged peaks sitting inside an island's own upper
// area — Numeria Peaks' mountain motif, shrunk down to "one small range
// per island" instead of one ridge spanning the whole former landmass,
// so it stays part of each island's own terrain instead of a world-scale
// backdrop hidden behind a flat color panel. Alternating light/dark
// slope faces (rising toward a peak = lit, falling = shadowed) give it
// real dimension instead of reading as a flat 2D silhouette.
function renderMiniMountains(bbox, seed) {
  const w = bbox.x1 - bbox.x0;
  const baseY = bbox.y0 + (bbox.y1 - bbox.y0) * 0.22;
  const peakCount = 2 + (seed % 2);
  const pts = Array.from({ length: peakCount * 2 + 1 }, (_, i) => {
    const x = bbox.x0 + w * 0.2 + (i / (peakCount * 2)) * w * 0.6;
    const isPeak = i % 2 === 1;
    const jitter = pseudoRandom(seed * 53 + i);
    const y = isPeak ? baseY - 46 - jitter * 34 : baseY + jitter * 10;
    return { x, y };
  });
  let faces = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const shade = b.y < a.y ? "rgba(255,255,255,0.24)" : "rgba(20,15,35,0.22)";
    faces += `<path d="M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)} L${b.x.toFixed(1)},${(b.y + 60).toFixed(1)} L${a.x.toFixed(1)},${(a.y + 60).toFixed(1)} Z" fill="${shade}" />`;
  }
  const top = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const base = `L${pts[pts.length - 1].x.toFixed(1)},${(baseY + 60).toFixed(1)} L${pts[0].x.toFixed(1)},${(baseY + 60).toFixed(1)} Z`;
  return `<path d="${top} ${base}" fill="#8b81a8" />${faces}`;
}

// One island: a lighter sand ring (the shoreline) under the zone's own
// solid-colored interior, both traced through the same seeded angles so
// the ring's width stays fairly even all the way around, plus a small
// mountain range sitting on top of the interior fill.
function renderIsland(bbox, fill, seed) {
  // 95/150 (not, say, 58/105): an ellipse built from a rectangle's own
  // half-width/half-height doesn't actually reach that rectangle's own
  // *corners* (a corner sits farther from center than either semi-axis
  // alone) — a grid's corner-most nodes sit exactly at the tight bbox's
  // corners, so the inner pad has to clear that diagonal gap, not just
  // the bbox's own straight half-extents, or a corner node ends up
  // painted onto the sand ring instead of its own zone's color.
  const outerPts = organicIslandPoints(bbox, 150, seed);
  const innerPts = organicIslandPoints(bbox, 95, seed);
  return `
    <path d="${closedBlobPath(outerPts)}" fill="${SAND}" />
    <path d="${closedBlobPath(innerPts)}" fill="${fill}" />
    ${renderMiniMountains(bbox, seed)}
  `;
}

// A handful of bigger, hand-drawn, one-off set pieces scattered in the
// open water — a lighthouse, a shipwreck, a couple of buoys, a few gulls
// — purely decorative texture, deliberately NOT the same idea as the
// small repeated topic-icon emoji that got tried and rejected twice
// earlier: each of these is a distinct drawn shape appearing once, not a
// repeated icon set. Every position leans on a real gap in the layout
// (the space between two neighboring islands' own node clusters, or the
// open flanks beside the boss island) rather than a hardcoded world
// coordinate, so it stays correct if the zones' own skill counts ever
// change.
function renderLighthouse(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 34}" rx="24" ry="8" fill="rgba(20,15,35,0.22)" />
    <path d="M${x - 15},${y + 30} L${x - 8},${y - 36} L${x + 8},${y - 36} L${x + 15},${y + 30} Z" fill="#e8e2d0" stroke="#8a8060" stroke-width="2" />
    <rect x="${x - 8}" y="${y - 6}" width="16" height="7" fill="#c94a3f" />
    <rect x="${x - 8}" y="${y + 9}" width="16" height="7" fill="#c94a3f" />
    <path d="M${x - 10},${y - 36} L${x},${y - 50} L${x + 10},${y - 36} Z" fill="#5c4a3a" />
    <circle cx="${x}" cy="${y - 40}" r="4" fill="#ffe9a8" />
  `;
}

function renderShipwreck(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 10}" rx="44" ry="11" fill="rgba(20,15,35,0.2)" />
    <path d="M${x - 40},${y} Q${x},${y + 20} ${x + 38},${y - 2} L${x + 32},${y + 11} Q${x - 4},${y + 24} ${x - 36},${y + 9} Z" fill="#6b5233" stroke="#4a3a26" stroke-width="2" />
    <line x1="${x - 4}" y1="${y - 2}" x2="${x}" y2="${y - 30}" stroke="#4a3a26" stroke-width="3" />
    <path d="M${x},${y - 30} L${x + 18},${y - 18} L${x},${y - 12} Z" fill="#d8cba8" opacity="0.85" />
  `;
}

function renderBuoy(x, y, seed) {
  const bob = pseudoRandom(seed) * 6 - 3;
  return `
    <ellipse cx="${x}" cy="${y + 13}" rx="11" ry="4" fill="rgba(20,15,35,0.2)" />
    <path d="M${x - 7},${(y + 7 + bob).toFixed(1)} Q${x},${(y - 14 + bob).toFixed(1)} ${x + 7},${(y + 7 + bob).toFixed(1)} Z" fill="#c94a3f" stroke="#7a2a22" stroke-width="1.5" />
    <circle cx="${x}" cy="${(y - 12 + bob).toFixed(1)}" r="3.5" fill="#f0e4c0" />
  `;
}

function renderGull(x, y) {
  return `<path d="M${x - 13},${y} Q${x - 6},${y - 7} ${x},${y} Q${x + 6},${y - 7} ${x + 13},${y}" stroke="#332a3d" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.75" />`;
}

function renderWaterScenery(islandBoxes) {
  let out = "";
  for (let i = 0; i < islandBoxes.length - 1; i++) {
    const gapX = (islandBoxes[i].x1 + islandBoxes[i + 1].x0) / 2;
    const gapY = Math.max(islandBoxes[i].cy, islandBoxes[i + 1].cy) + 130;
    if (i === 0) out += renderLighthouse(gapX, gapY);
    else if (i === 1) out += renderShipwreck(gapX, gapY - 70);
    else out += renderBuoy(gapX, gapY, i + 5);
  }
  out += renderGull(340, 250);
  out += renderGull(1080, 210);
  out += renderGull(1850, 290);
  return out;
}

// One signature, hand-drawn landmark per topic island — a visual pun on
// what that topic actually studies, sitting just below that island's own
// bottom row of nodes (real open room there: the island's own shoreline
// extends well past the tight node bbox — see renderIsland's own pad).
function renderCairn(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 24}" rx="19" ry="6" fill="rgba(20,15,35,0.2)" />
    <ellipse cx="${x}" cy="${y + 15}" rx="17" ry="9" fill="#8a6a52" stroke="#5c4632" stroke-width="1.5" />
    <ellipse cx="${x + 2}" cy="${y}" rx="12" ry="7" fill="#9c7c62" stroke="#5c4632" stroke-width="1.5" />
    <ellipse cx="${x - 1}" cy="${y - 13}" rx="8" ry="5" fill="#ac8c70" stroke="#5c4632" stroke-width="1.5" />
  `;
}

function renderCrystalCluster(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 18}" rx="23" ry="7" fill="rgba(20,15,35,0.2)" />
    <path d="M${x - 4},${y + 16} L${x - 14},${y - 4} L${x - 2},${y - 26} L${x + 9},${y - 6} Z" fill="#9fd6cf" stroke="#5a9a90" stroke-width="1.5" opacity="0.92" />
    <path d="M${x + 8},${y + 16} L${x + 1},${y - 2} L${x + 13},${y - 18} L${x + 19},${y + 2} Z" fill="#c7ece5" stroke="#5a9a90" stroke-width="1.5" opacity="0.92" />
  `;
}

function renderStoneArch(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 20}" rx="29" ry="7" fill="rgba(20,15,35,0.2)" />
    <path d="M${x - 23},${y + 18} Q${x - 23},${y - 25} ${x},${y - 29} Q${x + 23},${y - 25} ${x + 23},${y + 18}
      L${x + 13},${y + 18} Q${x + 13},${y - 15} ${x},${y - 13} Q${x - 13},${y - 15} ${x - 13},${y + 18} Z"
      fill="#a89ccb" stroke="#6b5f8f" stroke-width="1.5" />
  `;
}

function renderCoinPile(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 15}" rx="25" ry="8" fill="rgba(20,15,35,0.2)" />
    <ellipse cx="${x - 10}" cy="${y + 9}" rx="10" ry="5" fill="#e8c96a" stroke="#a8823c" stroke-width="1.5" />
    <ellipse cx="${x + 4}" cy="${y + 5}" rx="10" ry="5" fill="#f0d67e" stroke="#a8823c" stroke-width="1.5" />
    <ellipse cx="${x - 3}" cy="${y - 3}" rx="10" ry="5" fill="#e8c96a" stroke="#a8823c" stroke-width="1.5" />
    <ellipse cx="${x + 8}" cy="${y - 7}" rx="8" ry="4.5" fill="#f0d67e" stroke="#a8823c" stroke-width="1.5" />
  `;
}

function renderWatchtower(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 26}" rx="15" ry="6" fill="rgba(0,0,0,0.25)" />
    <rect x="${x - 8}" y="${y - 22}" width="16" height="48" fill="#3a3348" stroke="#1f1a2b" stroke-width="1.5" />
    <rect x="${x - 12}" y="${y - 28}" width="24" height="9" fill="#2a2438" stroke="#1f1a2b" stroke-width="1.5" />
    <circle cx="${x}" cy="${y - 36}" r="4.5" fill="#e8a860" opacity="0.9" />
  `;
}

const ISLAND_LANDMARKS = {
  algebra: renderCairn,
  geometry: renderCrystalCluster,
  functions: renderStoneArch,
  numstats: renderCoinPile,
};

function renderIslandLandmark(zoneId, bbox) {
  const renderer = ISLAND_LANDMARKS[zoneId];
  if (!renderer) return "";
  return renderer((bbox.x0 + bbox.x1) / 2, bbox.y1 + 70);
}

// Each island is drawn tightly around that zone's *actual* placed nodes
// (hubWorld.js's own `zoneGroups`, not this file's wider territory
// columns from computeTerritories) — node positions are already inset
// well inside their territory's own bounds (see gridPositions' insetX/
// insetY), so an island sized to just the nodes plus a shoreline naturally
// leaves open water between neighboring islands, without moving a single
// node to make room for it.
function renderMathRegions(zoneGroups) {
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

  const water = renderWaterScenery(boxes.filter(Boolean));
  const islands = zoneGroups
    .map(({ zone }, i) => {
      const bbox = boxes[i];
      if (!bbox) return "";
      return renderIsland(bbox, zone.fill, i + 1) + renderIslandLandmark(zone.id, bbox);
    })
    .join("");

  const bossBbox = { x0: BOSS_POS.x - 220, x1: BOSS_POS.x + 220, y0: BOSS_POS.y - 180, y1: BOSS_POS.y + 140 };
  const bossIsland = renderIsland(bossBbox, BOSS_FILL, 99) + renderWatchtower(bossBbox.x0 + 55, (bossBbox.y0 + bossBbox.y1) / 2 + 20);
  return water + islands + bossIsland;
}

// Each zone's own nodes get connected in the same order they were placed
// (row by row through that zone's own grid) — a path winding through
// just that zone's own lessons, not one radiating from the world's
// shared CENTER (which would cut across other zones' own territories
// here, unlike Wordwood Isle's round island where every zone fans out
// from that same center anyway).
function renderMathTrails(zoneGroups) {
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

export function renderMathHub(root, navigate, subject) {
  const territories = computeTerritories(subject);
  const layout = buildLayout(territories);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Numeria Peaks, an archipelago of separate mountainous islands floating in open water — algebra, geometry, functions, and number & stats — each with its own trail of math skills, plus a dark path south to the boss's own island",
    landmass: renderMathLandmass,
    regionShapes: renderMathRegions,
    trails: renderMathTrails,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ridge-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD across the islands — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
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
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    spawn: { x: CENTER.x, y: CENTER.y },
    targets: [
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
