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
import { CENTER, BOSS_POS, BOSS_TRIGGER_RADIUS, WORLD_W, WORLD_H, WALK_MARGIN, renderWorldSvg, wireMovement, wireFullscreenToggle, joystickHTML } from "./hubWorld.js";
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

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The avatar's own walkable region is exactly "on one of the rendered
// islands" — sampled straight off the live SVG's own sand-colored
// shoreline paths (renderIsland's outer ring) after they're already in
// the DOM, rather than recomputing the same seed/pad math a second time
// from scratch. Sampling the actual rendered path (not just its raw
// control points) means this can never drift out of sync with what's
// actually drawn — if the art changes, the walkable region changes with
// it automatically. getTotalLength/getPointAtLength are pure path
// geometry, so this works immediately, before the SVG has ever painted.
function buildIslandPolygons(root) {
  const sandPaths = root.querySelectorAll(`.hub-scene-svg path[fill="${SAND}"]`);
  const samplesPerIsland = 48;
  return Array.from(sandPaths).map((path) => {
    const len = path.getTotalLength();
    return Array.from({ length: samplesPerIsland }, (_, i) => {
      const p = path.getPointAtLength((i / samplesPerIsland) * len);
      return { x: p.x, y: p.y };
    });
  });
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

// A deterministic per-skill nudge off the raw grid point — same skill,
// same nudge, every render (a real RNG would make nodes visibly jump
// around on every re-render), just enough that the layout reads as
// hand-placed rather than machine-uniform. Caller scales it to that
// grid's own spacing, so it never comes close to overlapping a
// neighboring node even in a cramped, many-skill territory.
function jitterFor(id, maxX, maxY) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  const hx = (Math.sin(h) * 43758.5453) % 1;
  const hy = (Math.sin(h * 1.37 + 4.1) * 12543.789) % 1;
  return { dx: (hx - Math.floor(hx) - 0.5) * 2 * maxX, dy: (hy - Math.floor(hy) - 0.5) * 2 * maxY };
}

// Root Cause's own grid slot (rightmost column, middle row) sits right
// where Algebra's territory causeway attaches to Geometry's, so its
// marker visually sat on top of the crossing. Moving it to the very
// front of the fill order lands it in row 0's first column — a real
// corner (top-left) via the grid's own math, not a special-cased
// position — pushing every other Algebra skill's slot along by one.
const ROOT_CAUSE_ID = "ma-alg2";

function orderForCornerPlacement(skills) {
  const pinned = skills.find((s) => s.id === ROOT_CAUSE_ID);
  if (!pinned) return skills;
  return [pinned, ...skills.filter((s) => s.id !== ROOT_CAUSE_ID)];
}

// Every causeway (renderMathRegions/renderCauseway) attaches at a
// zone's own bbox — its horizontal edges (x0/x1) at its own vertical
// CENTER (cy), the same cy every row's y is interpolated between (the
// island's own shoreline is drawn tight around that same bbox, so this
// is also "solid ground" for the same reason). Whichever row lands
// exactly at that center height is therefore the one at risk of a
// causeway running straight through it — true for a middle row that
// reaches the true left/right edges (Geometry's old 2-2-2), but just as
// true for a single-column zone whose one item per row is already
// "at the edge" by definition (Stats' 1-1-1, where every row's x is
// identical, so only y separates them). Nudging that one row's y off
// the shared center — never its neighbors, which stay exactly where
// the causeway math expects solid ground — clears it in every layout
// shape without needing to reason about which specific skill lands
// there (that's still handled once, explicitly, by
// orderForCornerPlacement above, for Root Cause's own corner).
const CAUSEWAY_Y_CLEARANCE = 80;

// A simple row-major grid *inside* a territory's own inset bounds — every
// node's (x, y) is a convex combination of that territory's own inner
// corners, so containment holds by construction rather than needing a
// separate "does this fit" check afterward. Column count starts from the
// territory's own width (roughly one column per 220px), but for 3+
// skills the row count is floored at 3 regardless of width — a 2-row
// grid puts everything at the very top and bottom edges with an empty
// band between them (exactly what a wide, few-skill territory like
// Geometry or Functions used to do); a 3rd row guarantees something
// occupies the middle. Rows fill as evenly as possible (remainder spread
// across the first rows) rather than greedily packing early rows full
// and leaving a later one empty. A small per-skill jitter (see
// jitterFor) then breaks up the otherwise perfectly uniform result.
function gridPositions(territory) {
  const { skills: rawSkills, zone, x0, y0, x1, y1 } = territory;
  const skills = orderForCornerPlacement(rawSkills);
  const n = skills.length;
  const width = x1 - x0;
  const height = y1 - y0;
  const prefCols = Math.max(1, Math.min(n, Math.round(width / 220)));
  let rows = n ? Math.ceil(n / prefCols) : 0;
  if (n >= 3 && rows < 3) rows = 3;
  const cols = rows ? Math.ceil(n / rows) : prefCols;
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
  const causewayRow = rows >= 3 && rows % 2 === 1 ? (rows - 1) / 2 : -1;
  const causewayShift = Math.min(CAUSEWAY_Y_CLEARANCE, rowSpacing * 0.4);
  const positions = [];
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    const itemsInRow = Math.floor(n / rows) + (row < n % rows ? 1 : 0);
    const baseY = rows > 1 ? innerY0 + (row / (rows - 1)) * (innerY1 - innerY0) : (innerY0 + innerY1) / 2;
    const y = row === causewayRow ? baseY + causewayShift : baseY;
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

// The same "nearest topic island to the boss" pick renderMathRegions'
// own causewaysMarkup makes (by cx, the closest to BOSS_POS.x), and the
// same bottom-center anchor point (cx, y1) its causeway actually starts
// from — recomputed here from the raw layout, one level up, so the
// custom bossBridge below can start its own dark path from that same
// real island edge instead of hubWorld.js's own generic default (a
// straight line from the world's shared CENTER, which for this
// archipelago's layout happens to land inside Geometry's own territory
// and cuts across its nodes on the way down).
function computeNearestBossAnchor(layout) {
  const boxes = ZONES.map((zone) => layout.filter((p) => p.zone === zone))
    .map((points) => {
      if (!points.length) return null;
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, y1: Math.max(...ys) };
    })
    .filter(Boolean);
  if (!boxes.length) return null;
  return boxes.reduce((best, b) => (Math.abs(b.cx - BOSS_POS.x) < Math.abs(best.cx - BOSS_POS.x) ? b : best));
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
// *actually* reaches the rect's own edge (not an ellipse's approximation
// of it — an ellipse inscribed at halfW/halfH pinches in well short of
// the rect's own corners on a diagonal ray, which is exactly the "corner
// node ends up outside the shoreline" failure mode this rewrite closes)
// — *plus* `pad`, then bulges the pad portion further outward by a
// random 0-30% (seeded, so it's fixed per island, not re-randomized
// every render) — never inward. Since the base term always exactly
// touches the rect's boundary (pad=0 would trace the rect itself, corners
// included) and pad only ever adds to that, the padded rect stays fully
// enclosed no matter how small pad gets or how the jitter lands, while
// still tracing an uneven, rounded, "hand-drawn landmass" silhouette
// instead of a crisp box — closedBlobPath (lessonTerrain.js) then
// threads a smooth curve through those points instead of straight
// segments between them.
//
// `pad` is either one number (same padding on every side) or a
// `{left,right,top,bottom}` object — each of the 16 angles picks its pad
// from whichever edge its own ray actually exits through (left/right for
// a ray that hits a vertical edge, top/bottom for one that hits a
// horizontal edge), which is also exactly where the two switch
// continuously: right at the rect's own corner, where both edges are
// the same distance away. The per-side form is what lets
// renderMathRegions shrink only the side of an island that actually
// faces a close neighbor, instead of shrinking the whole island just to
// keep one edge clear. The bulge multiplies only the *pad* portion of
// each ray, not the rect-edge distance itself — so a point's max
// distance beyond the rect's own edge is a predictable `pad * 1.3`,
// never more. That predictability is what renderMathRegions'
// safeShorePad relies on to guarantee a minimum gap to a neighbor.
function organicIslandPoints(bbox, pad, seed, n = 48) {
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const p = typeof pad === "number" ? { left: pad, right: pad, top: pad, bottom: pad } : pad;
  // Floored, not raw: a single-column (or single-row) zone's tight bbox
  // is exactly zero wide (or tall) — with a true zero, `tx` (below)
  // collapses to ~0 at every angle except the one sample that lands
  // exactly on the vertical, producing one huge spike surrounded by
  // near-zero neighbors that the spline through all 48 points can't
  // hug (it rounds the isolated spike back down toward its short
  // neighbors, undershooting the node that spike was supposed to
  // cover). Flooring keeps neighboring angles' radii close enough to
  // the spike's that the curve stays smooth and actually encloses it;
  // 50px is arbitrary but far below any real multi-node zone's own
  // half-extent, so normal zones are unaffected. Coupling to flag if a
  // zone ever gets narrow enough to hit this floor for real:
  // renderMathRegions' safeShorePad sizes each side's pad off the *raw*
  // box.x0/x1/y0/y1 gap to a neighbor, not off this floored half-extent
  // — so a zone whose true half-extent is well under 50px would render
  // wider than safeShorePad accounted for, reopening the overlap this
  // whole file exists to prevent. Harmless today (verified 0 overlap
  // with real data), but if that ever changes, the fix is to run gap
  // math off `Math.max(50, ...)` too, not just this radius formula.
  const halfW = Math.max(50, (bbox.x1 - bbox.x0) / 2);
  const halfH = Math.max(50, (bbox.y1 - bbox.y0) / 2);
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    // Distance from center to the rect's own edge along this ray: the
    // smaller of "distance to a vertical edge" and "distance to a
    // horizontal edge" — whichever the ray actually reaches first.
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

const DEFAULT_SHORE_PAD = 150;
// The sand ring's own thickness: the interior (zone-color) pad always
// sits this much inside whatever the outer (sand) pad is, on every side
// — 95/150 (not, say, 58/105) started this at a flat 55, chosen so an
// ellipse built from a rectangle's own half-width/half-height still
// reaches that rectangle's own *corners* (a corner sits farther from
// center than either semi-axis alone) — a grid's corner-most nodes sit
// exactly at the tight bbox's corners, so the inner pad has to clear
// that diagonal gap, not just the bbox's own straight half-extents, or a
// corner node ends up painted onto the sand ring instead of its own
// zone's color. Kept as a fixed offset (not a ratio) so a side that's
// been shrunk down near MIN_SHORE_PAD still keeps a visible sliver of
// sand instead of the interior swallowing it.
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

// One island: a lighter sand ring (the shoreline) under the zone's own
// solid-colored interior, both traced through the same seeded angles so
// the ring's width stays fairly even all the way around, plus a small
// mountain range sitting on top of the interior fill. `outerPad` is
// normally the flat default (150), but renderMathRegions passes a
// shrunk, possibly per-side value for any island whose neighbor (another
// topic island, or the boss's own island) sits close enough that the
// default pad would otherwise reach past it — see renderMathRegions for
// why that matters: the padded shoreline is also this file's own
// walkable region (buildIslandPolygons samples exactly these sand
// paths), so two islands' padding overlapping doesn't just look wrong,
// it silently erases the water between them as a barrier to movement.
function renderIsland(bbox, fill, seed, outerPad = DEFAULT_SHORE_PAD) {
  const innerPad = innerPadFor(outerPad);
  const outerPts = organicIslandPoints(bbox, outerPad, seed);
  const innerPts = organicIslandPoints(bbox, innerPad, seed);
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

// Each topic island now gets its own full biome instead of one single
// landmark — a denser scatter of several *varied* hand-drawn pieces (a
// couple of different shapes/colors per biome, each individually seeded
// so no two instances match exactly) rather than one repeated icon,
// following the same "no identical repeats" bar the rest of this app's
// terrain art already holds itself to. `ringPositions` scatters that
// many points in the open ring between an island's own tight node bbox
// and its shoreline (see renderIsland's own pad) — outside the bbox at
// every angle, so decorations never land on top of a node or its label.
function ringPositions(bbox, count, seedBase, minPad = 55, maxPad = 90) {
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

// Ironroot Algebra — a proper mountain area: several extra peak clusters
// beyond the one every island already gets from renderMiniMountains,
// scattered around the shoreline instead of confined to one range, plus
// loose scree. Snow caps are seeded per-cluster (not every peak), and
// height/width both vary, so no two clusters read as the same stamp.
function renderPeakCluster(x, y, seed) {
  const h = 32 + pseudoRandom(seed) * 24;
  const w = 18 + pseudoRandom(seed + 1) * 12;
  const snow = pseudoRandom(seed + 2) > 0.45;
  return `
    <ellipse cx="${x}" cy="${y + 3}" rx="${(w * 1.15).toFixed(1)}" ry="${(w * 0.3).toFixed(1)}" fill="rgba(20,15,35,0.18)" />
    <path d="M${(x - w).toFixed(1)},${y} L${x},${(y - h).toFixed(1)} L${(x + w).toFixed(1)},${y} Z" fill="#8b81a8" />
    <path d="M${(x - w * 0.5).toFixed(1)},${(y - h * 0.55).toFixed(1)} L${x},${(y - h).toFixed(1)} L${(x + w * 0.5).toFixed(1)},${(y - h * 0.55).toFixed(1)} L${(x + w * 0.28).toFixed(1)},${(y - h * 0.38).toFixed(1)} L${x},${(y - h * 0.72).toFixed(1)} L${(x - w * 0.28).toFixed(1)},${(y - h * 0.38).toFixed(1)} Z"
      fill="${snow ? "#f0ecf8" : "#6f6690"}" opacity="${snow ? 0.9 : 0.5}" />
  `;
}

function renderScree(x, y, seed) {
  const r = 5 + (seed % 3) * 2;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#7a7192" opacity="0.65" />`;
}

// Shalefoot Geometry — a village: a well as the one centerpiece, then
// several houses with varied roof colors and a couple of body widths.
function renderHouse(x, y, seed) {
  const roof = ["#c94a3f", "#8a6a44", "#5a7a8f"][seed % 3];
  const w = 22 + (seed % 3) * 4;
  const h = 16;
  return `
    <ellipse cx="${x}" cy="${(y + h * 0.6).toFixed(1)}" rx="${(w * 0.7).toFixed(1)}" ry="5" fill="rgba(20,15,35,0.18)" />
    <rect x="${(x - w / 2).toFixed(1)}" y="${(y - h * 0.1).toFixed(1)}" width="${w}" height="${h}" fill="#e8dcc0" stroke="#8a7a5c" stroke-width="1.5" />
    <path d="M${(x - w / 2 - 4).toFixed(1)},${(y - h * 0.1).toFixed(1)} L${x},${(y - h * 0.9).toFixed(1)} L${(x + w / 2 + 4).toFixed(1)},${(y - h * 0.1).toFixed(1)} Z" fill="${roof}" stroke="#3a2a20" stroke-width="1.2" />
    <rect x="${(x - 4).toFixed(1)}" y="${(y + h * 0.3).toFixed(1)}" width="8" height="${(h * 0.6).toFixed(1)}" fill="#4a3a2a" />
  `;
}

function renderWell(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 10}" rx="14" ry="5" fill="rgba(20,15,35,0.18)" />
    <ellipse cx="${x}" cy="${y + 4}" rx="12" ry="6" fill="#8a8a8a" stroke="#5a5a5a" stroke-width="1.5" />
    <ellipse cx="${x}" cy="${y + 2}" rx="8" ry="4" fill="#3a5a6a" />
    <line x1="${x - 11}" y1="${y - 2}" x2="${x - 11}" y2="${y - 16}" stroke="#5c4632" stroke-width="2" />
    <line x1="${x + 11}" y1="${y - 2}" x2="${x + 11}" y2="${y - 16}" stroke="#5c4632" stroke-width="2" />
    <line x1="${x - 11}" y1="${y - 16}" x2="${x + 11}" y2="${y - 16}" stroke="#5c4632" stroke-width="2" />
  `;
}

// Skyline Functions — an enchanted forest: purple-canopied trees in a
// couple of shapes (round and conical) and a small palette of purple
// shades, each with one small glowing mote to sell "enchanted" rather
// than just "purple."
function renderPurpleTree(x, y, seed) {
  const h = 32 + pseudoRandom(seed) * 22;
  const canopy = ["#b39ddb", "#9575cd", "#7e57c2"][seed % 3];
  const round = seed % 2 === 0;
  const glowSide = seed % 2 === 0 ? 1 : -1;
  return `
    <ellipse cx="${x}" cy="${(y + 4).toFixed(1)}" rx="${(h * 0.3).toFixed(1)}" ry="${(h * 0.1).toFixed(1)}" fill="rgba(20,15,35,0.18)" />
    <rect x="${x - 3}" y="${(y - h * 0.5).toFixed(1)}" width="6" height="${(h * 0.5).toFixed(1)}" fill="#4a3a5c" />
    ${
      round
        ? `<circle cx="${x}" cy="${(y - h * 0.65).toFixed(1)}" r="${(h * 0.32).toFixed(1)}" fill="${canopy}" opacity="0.92" />`
        : `<path d="M${(x - h * 0.28).toFixed(1)},${(y - h * 0.45).toFixed(1)} L${x},${(y - h * 1.05).toFixed(1)} L${(x + h * 0.28).toFixed(1)},${(y - h * 0.45).toFixed(1)} Z" fill="${canopy}" opacity="0.92" />`
    }
    <circle cx="${x + glowSide * 6}" cy="${(y - h * 0.7).toFixed(1)}" r="2.5" fill="#ffe9ff" opacity="0.85" />
  `;
}

// Goldtally Flats — a desert: two cactus shapes (a saguaro with arms,
// a round barrel cactus), plus a bare rock or two and a faint dune
// ripple in the sand underfoot.
function renderSaguaro(x, y, seed) {
  const h = 28 + pseudoRandom(seed) * 18;
  const flip = seed % 2 === 0 ? 1 : -1;
  return `
    <ellipse cx="${x}" cy="${y + 4}" rx="11" ry="4" fill="rgba(60,45,20,0.18)" />
    <rect x="${x - 6}" y="${(y - h).toFixed(1)}" width="12" height="${h.toFixed(1)}" rx="5" fill="#6b8a5a" />
    <rect x="${(x + flip * 4).toFixed(1)}" y="${(y - h * 0.6).toFixed(1)}" width="7" height="${(h * 0.32).toFixed(1)}" rx="3.5" fill="#6b8a5a" />
    <rect x="${(x - flip * 4 - 7).toFixed(1)}" y="${(y - h * 0.45).toFixed(1)}" width="7" height="${(h * 0.28).toFixed(1)}" rx="3.5" fill="#5c7a4c" />
  `;
}

function renderBarrelCactus(x, y, seed) {
  const r = 11 + pseudoRandom(seed) * 5;
  return `
    <ellipse cx="${x}" cy="${(y + r * 0.3).toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.35).toFixed(1)}" fill="rgba(60,45,20,0.16)" />
    <ellipse cx="${x}" cy="${y}" rx="${r.toFixed(1)}" ry="${(r * 0.85).toFixed(1)}" fill="#7a9a5f" />
    <ellipse cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.2).toFixed(1)}" rx="${(r * 0.35).toFixed(1)}" ry="${(r * 0.5).toFixed(1)}" fill="#8fae70" opacity="0.7" />
  `;
}

function renderDesertRock(x, y, seed) {
  const w = 15 + (seed % 3) * 4;
  return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${(w * 0.55).toFixed(1)}" fill="#a89060" stroke="#7a6540" stroke-width="1.5" />`;
}

// Each biome's own default ring (min, max) — unchanged from before — is
// clamped against `ringCap` (renderMathRegions' own measure of how much
// room actually exists before the *interior* fill gives way to sand on
// this island's tightest side). On an island with plenty of clearance
// ringCap is generous and every biome renders exactly as before; on one
// squeezed by a close neighbor, the ring pulls in so decorations still
// land on solid ground instead of scattering out past a shrunk shoreline
// into open water.
const ISLAND_BIOMES = {
  // A denser mountain range: renderMiniMountains already draws one
  // cluster near the top of every island — these fill the rest of the
  // ring with more, so Ironroot Algebra reads as *the* mountainous one.
  algebra: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 6, seedBase, min, max)
      .map((p, i) => (i % 3 !== 2 ? renderPeakCluster(p.x, p.y, p.seed) : renderScree(p.x, p.y, p.seed)))
      .join("");
  },
  geometry: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 6, seedBase, min, max)
      .map((p, i) => (i === 0 ? renderWell(p.x, p.y) : renderHouse(p.x, p.y, p.seed)))
      .join("");
  },
  functions: (bbox, seedBase, ringCap) => {
    const max = Math.min(90, ringCap);
    const min = Math.min(55, max - 15);
    return ringPositions(bbox, 7, seedBase, min, max)
      .map((p) => renderPurpleTree(p.x, p.y, p.seed))
      .join("");
  },
  numstats: (bbox, seedBase, ringCap) => {
    const max = Math.min(80, ringCap);
    const min = Math.min(45, max - 15);
    return ringPositions(bbox, 6, seedBase, min, max)
      .map((p, i) => (i % 3 === 0 ? renderBarrelCactus(p.x, p.y, p.seed) : i % 3 === 1 ? renderSaguaro(p.x, p.y, p.seed) : renderDesertRock(p.x, p.y, p.seed)))
      .join("");
  },
};

function renderIslandBiome(zoneId, bbox, seedBase, ringCap) {
  const renderer = ISLAND_BIOMES[zoneId];
  return renderer ? renderer(bbox, seedBase, ringCap) : "";
}

function renderWatchtower(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 26}" rx="15" ry="6" fill="rgba(0,0,0,0.25)" />
    <rect x="${x - 8}" y="${y - 22}" width="16" height="48" fill="#3a3348" stroke="#1f1a2b" stroke-width="1.5" />
    <rect x="${x - 12}" y="${y - 28}" width="24" height="9" fill="#2a2438" stroke="#1f1a2b" stroke-width="1.5" />
    <circle cx="${x}" cy="${y - 36}" r="4.5" fill="#e8a860" opacity="0.9" />
  `;
}

// Every topic zone shares the same TOP_BAND y0/y1 (computeTerritories
// only varies x0/x1 per zone), so the four topic islands are neighbors
// left-to-right, and every one of them is also a neighbor of the boss's
// own island sitting in BOSS_BAND below. GUTTER and each zone's own
// gridPositions insetX/insetY already keep node clusters apart, but by
// how much varies with skill count and column layout — squeeze the
// default 150px shoreline pad down (per side, only on the side that
// actually faces a neighbor) so the padded shoreline can never reach
// past the halfway point to that neighbor's own tight node bbox. Without
// this, two nearby islands' shorelines can overlap outright — which
// doesn't just look wrong, it erases the water between them as a
// walkable-region boundary too, since buildIslandPolygons (in
// renderMathHub) samples these exact sand paths for movement.
const WATER_GUTTER = 26;
// A floor purely against a degenerate near-zero shoreline — much lower
// than the old flat 45, on purpose: 45 was a *cosmetic* preference, and
// letting it override the safety ceiling below (when a genuinely tight
// gap makes 45 unsafe) is exactly the bug this whole file exists to
// avoid. When the ceiling is between this floor and 45, the island's
// shoreline is just a bit thinner on that one side — never overlapping.
const MIN_SHORE_PAD = 20;
// organicIslandPoints' own bulge can stretch a side's pad up to 1.3x —
// divide by that here so the *worst-case* bulged point still clears
// WATER_GUTTER of open water short of the neighbor's own tight bbox
// edge, not just the unbulged pad value.
const MAX_BULGE = 1.3;
function safeShorePad(gap) {
  if (gap == null) return DEFAULT_SHORE_PAD;
  return Math.max(MIN_SHORE_PAD, Math.min(DEFAULT_SHORE_PAD, (gap / 2 - WATER_GUTTER) / MAX_BULGE));
}

// A narrow strip of the exact same sand as every shoreline, connecting
// two islands straight across their own water gap — just a filled quad,
// no organic outline of its own. Same SAND fill as every shoreline means
// buildIslandPolygons (renderMathHub) picks these up automatically as
// more walkable ground, with zero changes needed to the walkability code
// itself: once islands stopped overlapping (see safeShorePad above),
// walking could no longer cross between them at all, since a topic
// zone's own click-to-navigate marker still works from anywhere but
// walking there in-character couldn't — these causeways are what
// restore on-foot travel while keeping "the monster can't walk into
// open water" literally true everywhere else.
function renderCauseway(ax, ay, bx, by, width = 56) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (width / 2);
  const ny = (dx / len) * (width / 2);
  const d = [
    `M${(ax + nx).toFixed(1)},${(ay + ny).toFixed(1)}`,
    `L${(bx + nx).toFixed(1)},${(by + ny).toFixed(1)}`,
    `L${(bx - nx).toFixed(1)},${(by - ny).toFixed(1)}`,
    `L${(ax - nx).toFixed(1)},${(ay - ny).toFixed(1)}`,
    "Z",
  ].join(" ");
  return `<path d="${d}" fill="${SAND}" />`;
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

  const bossBbox = { x0: BOSS_POS.x - 220, x1: BOSS_POS.x + 220, y0: BOSS_POS.y - 180, y1: BOSS_POS.y + 140 };

  const pads = boxes.map((box, i) => {
    if (!box) return DEFAULT_SHORE_PAD;
    const leftGap = boxes[i - 1] ? box.x0 - boxes[i - 1].x1 : null;
    const rightGap = boxes[i + 1] ? boxes[i + 1].x0 - box.x1 : null;
    const bottomGap = bossBbox.y0 - box.y1;
    return { left: safeShorePad(leftGap), right: safeShorePad(rightGap), top: DEFAULT_SHORE_PAD, bottom: safeShorePad(bottomGap) };
  });
  const bossPadTop = safeShorePad(Math.min(...boxes.filter(Boolean).map((b) => bossBbox.y0 - b.y1)));

  // One causeway per adjacent topic-island pair, plus one down to
  // whichever topic island sits horizontally closest to the boss's own
  // island — every topic zone shares the same tight-bbox vertical center
  // (they all grid their nodes inside the same TOP_BAND, regardless of
  // row count), so `box.x1, box.cy` sits exactly at that island's own
  // widest point, guaranteeing the causeway starts on solid ground
  // rather than clipping past its shoreline.
  const presentBoxes = boxes.filter(Boolean);
  const causewaysMarkup = [
    ...presentBoxes.slice(0, -1).map((box, i) => renderCauseway(box.x1, box.cy, presentBoxes[i + 1].x0, presentBoxes[i + 1].cy)),
    ...(presentBoxes.length
      ? [
          (() => {
            const nearest = presentBoxes.reduce((best, b) => (Math.abs(b.cx - BOSS_POS.x) < Math.abs(best.cx - BOSS_POS.x) ? b : best));
            return renderCauseway(nearest.cx, nearest.y1, BOSS_POS.x, bossBbox.y0);
          })(),
        ]
      : []),
  ].join("");

  const water = renderWaterScenery(boxes.filter(Boolean));
  const islands = zoneGroups
    .map(({ zone }, i) => {
      const bbox = boxes[i];
      if (!bbox) return "";
      const innerPad = innerPadFor(pads[i]);
      const ringCap = Math.max(25, Math.min(innerPad.left, innerPad.right, innerPad.top, innerPad.bottom) - 10);
      return renderIsland(bbox, zone.fill, i + 1, pads[i]) + renderIslandBiome(zone.id, bbox, i + 1, ringCap);
    })
    .join("");

  const bossIsland =
    renderIsland(bossBbox, BOSS_FILL, 99, { left: DEFAULT_SHORE_PAD, right: DEFAULT_SHORE_PAD, top: bossPadTop, bottom: DEFAULT_SHORE_PAD }) +
    renderWatchtower(bossBbox.x0 + 55, (bossBbox.y0 + bossBbox.y1) / 2 + 20);
  return water + causewaysMarkup + islands + bossIsland;
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

  const bossAnchor = computeNearestBossAnchor(layout);

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Numeria Peaks, an archipelago of separate mountainous islands floating in open water — algebra, geometry, functions, and number & stats — each with its own trail of math skills, plus a dark path south to the boss's own island",
    landmass: renderMathLandmass,
    regionShapes: renderMathRegions,
    trails: renderMathTrails,
    bossBridge: bossAnchor
      ? () =>
          `<path d="M${bossAnchor.cx},${bossAnchor.y1} L${BOSS_POS.x},${BOSS_POS.y}" stroke="#3b2a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" fill="none" opacity="0.8" />` +
          `<circle cx="${BOSS_POS.x}" cy="${BOSS_POS.y}" r="118" fill="#2c211c" opacity="0.22" />`
      : undefined,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ridge-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) across the islands — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${joystickHTML("hubJoystick")}
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

  const islandPolygons = buildIslandPolygons(root);
  const isWalkable = (px, py) => islandPolygons.some((poly) => pointInPolygon(px, py, poly));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    spawn: { x: CENTER.x, y: CENTER.y },
    isWalkable,
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
