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
// non-overlapping rectangular *territories* — equal width regardless of
// skill count, so a light zone doesn't read as an afterthought next to a
// dense one — purely to decide node placement — each zone's nodes sit
// on a simple grid inside its own territory's inset bounds, so every
// node is guaranteed to sit inside its own zone by construction.
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
  { id: "algebra", name: "Ironroot Algebra", categories: ["algebra"], fill: "#a8785f", description: "Algebra", decorations: [] },
  { id: "geometry", name: "Shalefoot Geometry", categories: ["geometry"], fill: "#7d93a8", description: "Geometry", decorations: [] },
  { id: "functions", name: "Skyline Functions", categories: ["functions"], fill: "#8b7fc4", description: "Functions", decorations: [] },
  { id: "numstats", name: "Goldtally Flats", categories: ["numquant", "stats"], fill: "#b99a5c", description: "Number & Stats", decorations: [] },
];
const BOSS_FILL = "#4a4358";

// Same legend islandHub.js's own Wordwood Isle uses — a swatch per
// zone naming what it actually covers, since the island *names*
// (Ironroot Algebra, Shalefoot Geometry...) don't say that on their own.
function renderLegend() {
  return `
    <div class="hub-legend" aria-hidden="true">
      <p class="hub-legend-title">Island regions</p>
      ${ZONES.map(
        (zone) => `
        <div class="hub-legend-row">
          <span class="hub-legend-swatch" style="background:${zone.fill}"></span>
          <span>
            <span class="hub-legend-name">${zone.name}</span><br>
            <span class="hub-legend-desc">${zone.description}</span>
          </span>
        </div>
      `
      ).join("")}
    </div>
  `;
}

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

// Splits the walkable width into one EQUAL-width column per zone — skill
// count still drives each zone's own internal grid (row/column count,
// node spacing), but the island itself is sized the same regardless of
// whether it holds 3 skills or 6, so a light zone doesn't read as an
// afterthought floating in extra space next to a dense one.
function computeTerritories(subject) {
  const zoneSkills = ZONES.map((zone) => subject.skills.filter((s) => zone.categories.includes(s.reportingCategory)));
  const fullWidth = WORLD_W - WALK_MARGIN * 2;
  const colWidth = fullWidth / ZONES.length;
  return ZONES.map((zone, i) => {
    const isFirst = i === 0;
    const isLast = i === ZONES.length - 1;
    const rawX0 = WALK_MARGIN + i * colWidth;
    const rawX1 = WALK_MARGIN + (i + 1) * colWidth;
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
      positions.push({ item: skills[idx], zone, x: jx, y: jy, dockX: jx, dockY: jy + 34, row });
      idx++;
    }
  }
  return positions;
}

function buildLayout(territories) {
  return territories.flatMap(gridPositions);
}

// hubWorld.js's shared CENTER constant is just the raw world midpoint —
// safe as a spawn point on Wordwood Isle's one continuous landmass, but
// Numeria Peaks is an archipelago with open water between islands, and
// nothing guarantees CENTER lands on any of them. It didn't: with equal
// territory widths (see computeTerritories above), the Geometry/Functions
// boundary sits exactly at CENTER.x, so the avatar spawned in the water
// gap between them — walkable-region checks failed in every direction at
// once, reading as "stuck." Spawning at the centroid of whichever zone's
// own node cluster is horizontally closest to world center instead means
// the spawn point is the average of real, walkable node positions inside
// one actual island, not a coordinate that happens to land there.
function computeSpawnPoint(layout) {
  const byZone = new Map();
  for (const p of layout) {
    if (!byZone.has(p.zone)) byZone.set(p.zone, []);
    byZone.get(p.zone).push(p);
  }
  let best = null;
  let bestDist = Infinity;
  for (const pts of byZone.values()) {
    const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    const dist = Math.abs(cx - CENTER.x);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: cx, y: cy };
    }
  }
  return best || CENTER;
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

// A small range of 2-3 jagged peaks sitting entirely ABOVE an island's
// own tight node bbox — in the shoreline padding between the topmost
// node row and the sand ring, not inside the bbox itself. An earlier
// version anchored the range partway *into* the bbox (22% down from its
// own top), which is exactly where the top node row and its connector
// line already are — the "mountain in front of the path" look that read
// as a z-index bug. `headroom` (the actual clearance above the topmost
// node — see renderIsland) both positions and sizes the range so it
// fits in whatever room is actually available instead of a fixed
// height that might not be. Alternating light/dark slope faces (rising
// toward a peak = lit, falling = shadowed) give it real dimension
// instead of reading as a flat 2D silhouette.
// Shared vertical/horizontal placement math every zone's own central
// terrain motif below is built on — one island's mountain range, another's
// shale formation, another's spires, all sitting on the exact same safe
// footing (above the topmost node row, sized to the actual headroom)
// rather than each reimplementing that arithmetic with its own chance to
// drift out of sync. See NODE_CLEARANCE for why bbox.y0 alone isn't
// enough, and the width floor's own comment (below) for why w needs one.
const NODE_CLEARANCE = 45;
function computeMotifBounds(bbox, headroom) {
  const bottomY = bbox.y0 - NODE_CLEARANCE;
  const budget = Math.max(35, Math.min(100, headroom - NODE_CLEARANCE));
  const cx = (bbox.x0 + bbox.x1) / 2;
  // Floored the same way organicIslandPoints already floors its own
  // halfW, and for the same reason: a single-column zone's tight node
  // bbox is only as wide as its per-skill jitter spread (Goldtally
  // Flats, 3 skills forced into one column by gridPositions, measured
  // ~11px wide) — an unfloored width collapses whatever motif is built
  // on it down to a barely-visible sliver while every wider, multi-
  // column zone gets a full one. 250 lands the painted motif in the
  // same ~150px width every zone now measures at.
  const w = Math.max(250, bbox.x1 - bbox.x0);
  return { bottomY, budget, cx, w };
}

// Ironroot Algebra — jagged mountain peaks, sized/placed by
// computeMotifBounds above. Alternating light/dark slope faces (rising
// toward a peak = lit, falling = shadowed) give it real dimension
// instead of reading as a flat 2D silhouette. Deliberately darker than
// the zone's own fill (not the same tone) — same reasoning as
// SHALE_SHADES/SPIRE_SHADES below, tied to the zone's own rust/brown
// family instead of the mismatched purple-gray this used to be filled
// with, but with enough value contrast to still read against the
// lighter brown interior it sits on.
const MOUNTAIN_SHADES = ["#8a5f47", "#6b4530", "#c2926f"];
const MOUNTAIN_STROKE = "#4a3323";
function renderMiniMountains(bbox, seed, headroom = 150) {
  const { bottomY, budget, cx, w } = computeMotifBounds(bbox, headroom);
  const faceDrop = budget * 0.2;
  const peakH = budget * 0.8;
  const baseY = bottomY - faceDrop;
  const peakCount = 2 + (seed % 2);
  const pts = Array.from({ length: peakCount * 2 + 1 }, (_, i) => {
    const x = cx - w * 0.3 + (i / (peakCount * 2)) * w * 0.6;
    const isPeak = i % 2 === 1;
    const jitter = pseudoRandom(seed * 53 + i);
    // Peak multiplier tops out at 1.0 (0.7 + 0.3), never higher — so the
    // highest point a peak can reach is exactly baseY - peakH, which by
    // construction (faceDrop + peakH === budget) never exceeds headroom.
    const y = isPeak ? baseY - peakH * (0.7 + jitter * 0.3) : baseY + jitter * (faceDrop * 0.3);
    return { x, y };
  });
  let faces = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const shade = b.y < a.y ? "rgba(255,255,255,0.24)" : "rgba(20,15,35,0.22)";
    faces += `<path d="M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)} L${b.x.toFixed(1)},${(b.y + faceDrop).toFixed(1)} L${a.x.toFixed(1)},${(a.y + faceDrop).toFixed(1)} Z" fill="${shade}" />`;
  }
  const top = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const base = `L${pts[pts.length - 1].x.toFixed(1)},${(baseY + faceDrop).toFixed(1)} L${pts[0].x.toFixed(1)},${(baseY + faceDrop).toFixed(1)} Z`;
  return `<path d="${top} ${base}" fill="${MOUNTAIN_SHADES[0]}" stroke="${MOUNTAIN_STROKE}" stroke-width="1.5" />${faces}`;
}

// A single tilted rock slab, standing on (x, baseY) as its own base —
// the one shape both Shalefoot Geometry's central formation and its
// smaller scattered outcrops below are built from, just at different
// scales, tying the two together as the same rock rather than two
// unrelated decorations sharing an island.
function renderShaleSlab(x, baseY, w, h, angle, shade) {
  return `<rect x="${(x - w / 2).toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${shade}" stroke="#3f4a56" stroke-width="1.5" opacity="0.95" transform="rotate(${angle.toFixed(1)} ${x.toFixed(1)} ${baseY.toFixed(1)})" />`;
}

// Shalefoot Geometry — angular, tilted rock slabs instead of a jagged
// peak silhouette: an actual shale outcrop (thin, flat-layered rock
// that shears into rectangular slabs), and a visual pun on the skill
// itself — the one island whose landmark is built from literal
// rectangles instead of an organic mountain shape.
const SHALE_SHADES = ["#7d93a8", "#647c92", "#95a8b8"];
function renderShaleFormation(bbox, seed, headroom = 150) {
  const { bottomY, budget, cx, w } = computeMotifBounds(bbox, headroom);
  const slabCount = 4 + (seed % 2);
  let out = "";
  for (let i = 0; i < slabCount; i++) {
    const f = slabCount > 1 ? i / (slabCount - 1) : 0.5;
    const x = cx - w * 0.3 + f * w * 0.6;
    const jitter = pseudoRandom(seed * 61 + i);
    const h = budget * (0.45 + jitter * 0.5);
    const angle = (pseudoRandom(seed * 67 + i) - 0.5) * 26;
    const slabW = w * 0.16;
    const shade = SHALE_SHADES[i % SHALE_SHADES.length];
    out += renderShaleSlab(x, bottomY, slabW, h, angle, shade);
  }
  return out;
}

// A single thin spire, standing on (x, baseY) — Skyline Functions' own
// scaled-down building block, same idea as renderShaleSlab.
function renderSpire(x, baseY, w, h, shade) {
  const topW = w * 0.32;
  return `
    <path d="M${(x - w / 2).toFixed(1)},${baseY.toFixed(1)} L${(x - topW / 2).toFixed(1)},${(baseY - h * 0.85).toFixed(1)} L${x.toFixed(1)},${(baseY - h).toFixed(1)} L${(x + topW / 2).toFixed(1)},${(baseY - h * 0.85).toFixed(1)} L${(x + w / 2).toFixed(1)},${baseY.toFixed(1)} Z" fill="${shade}" stroke="#453a5c" stroke-width="1.5" opacity="0.95" />
    <circle cx="${x.toFixed(1)}" cy="${(baseY - h).toFixed(1)}" r="2.5" fill="#ffe9ff" opacity="0.75" />
  `;
}

// Skyline Functions — a row of thin spires at varying heights instead
// of a mountain silhouette: reads as an actual skyline (the zone's own
// name), and the varying-height row doubles as a function's own graph
// — a step plot or histogram sketched in rock instead of ink.
const SPIRE_SHADES = ["#8b7fc4", "#6f6690", "#a89adf"];
function renderSpireFormation(bbox, seed, headroom = 150) {
  const { bottomY, budget, cx, w } = computeMotifBounds(bbox, headroom);
  const spireCount = 4 + (seed % 2);
  let out = "";
  for (let i = 0; i < spireCount; i++) {
    const f = spireCount > 1 ? i / (spireCount - 1) : 0.5;
    const x = cx - w * 0.3 + f * w * 0.6;
    const jitter = pseudoRandom(seed * 73 + i);
    const h = budget * (0.4 + jitter * 0.55);
    const spireW = w * 0.1;
    const shade = SPIRE_SHADES[i % SPIRE_SHADES.length];
    out += renderSpire(x, bottomY, spireW, h, shade);
  }
  return out;
}

// A single purple-canopied tree, standing on (x, baseY) — Skyline
// Functions' own ground-level accent, scattered around the shoreline
// ring alongside (not instead of) the spire skyline itself: distant
// spires for the skyline pun, actual purple trees for the "forest" the
// zone's own purple color already reads as up close. Canopy drawn from
// SPIRE_SHADES so the trees stay the same purple family as the spires
// rather than introducing an unrelated green.
function renderPurpleTree(x, baseY, h, shade) {
  const trunkW = h * 0.12;
  const trunkH = h * 0.32;
  const canopyR = h * 0.36;
  return `
    <rect x="${(x - trunkW / 2).toFixed(1)}" y="${(baseY - trunkH).toFixed(1)}" width="${trunkW.toFixed(1)}" height="${trunkH.toFixed(1)}" fill="#453a5c" />
    <circle cx="${x.toFixed(1)}" cy="${(baseY - trunkH - canopyR * 0.7).toFixed(1)}" r="${canopyR.toFixed(1)}" fill="${shade}" stroke="#453a5c" stroke-width="1.5" opacity="0.95" />
  `;
}

function renderGoldNugget(x, y, r) {
  return `
    <ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.3).toFixed(1)}" rx="${(r * 1.05).toFixed(1)}" ry="${(r * 0.35).toFixed(1)}" fill="rgba(60,45,20,0.16)" />
    <ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.82).toFixed(1)}" fill="#d4af37" stroke="#8a6d1f" stroke-width="1.5" />
    <ellipse cx="${(x - r * 0.28).toFixed(1)}" cy="${(y - r * 0.22).toFixed(1)}" rx="${(r * 0.34).toFixed(1)}" ry="${(r * 0.2).toFixed(1)}" fill="#f0d97a" opacity="0.75" />
  `;
}

// Four scratched lines and a closing diagonal — the actual counting
// mark "Goldtally" puns on, planted straight into the ground like a
// signpost. `count` lets the scattered small versions below use fewer
// lines (an in-progress tally) than the central full set of five.
function renderTallyMark(x, baseY, h, count = 5) {
  const lines = Array.from({ length: Math.min(4, count) }, (_, i) => `<line x1="${(x + i * (h * 0.14) - h * 0.21).toFixed(1)}" y1="${baseY.toFixed(1)}" x2="${(x + i * (h * 0.14) - h * 0.21).toFixed(1)}" y2="${(baseY - h).toFixed(1)}" stroke="#6b5233" stroke-width="3" stroke-linecap="round" />`).join("");
  const diag = count > 4 ? `<line x1="${(x - h * 0.26).toFixed(1)}" y1="${(baseY - h * 0.12).toFixed(1)}" x2="${(x + h * 0.26).toFixed(1)}" y2="${(baseY - h * 0.88).toFixed(1)}" stroke="#6b5233" stroke-width="3" stroke-linecap="round" />` : "";
  return lines + diag;
}

// Goldtally Flats — deliberately NOT a mountain silhouette (the zone's
// own name is "Flats"): a low cluster of gold nuggets and one full
// tally mark instead, low-profile rather than tall so this island keeps
// reading as flat ground even with its own landmark on it.
function renderFlatsFormation(bbox, seed, headroom = 150) {
  const { bottomY, cx, w } = computeMotifBounds(bbox, headroom);
  const tallyH = Math.min(60, headroom - NODE_CLEARANCE - 10);
  const nuggetR = 15 + (seed % 3) * 3;
  return `
    ${renderGoldNugget(cx - w * 0.22, bottomY - nuggetR * 0.6, nuggetR)}
    ${renderTallyMark(cx, bottomY, tallyH, 5)}
    ${renderGoldNugget(cx + w * 0.2, bottomY - nuggetR * 0.5, nuggetR * 0.8)}
  `;
}

// One central terrain motif per zone (algebra keeps the mountain range
// every island used to get; the other three each get their own, so
// "Ironroot," "Shalefoot," "Skyline," and "Flats" actually look like
// different places instead of the same silhouette recolored four
// times), plus a handful of smaller matching accents scattered through
// that island's own shoreline ring (ringPositions keeps them outside
// the node bbox at every angle, so they never land on a node or trail).
const ZONE_TERRAIN = {
  algebra: {
    central: renderMiniMountains,
    scatterCount: 5,
    scatter: (p, seed) => {
      const h = 26 + pseudoRandom(seed) * 16;
      const shade = MOUNTAIN_SHADES[seed % MOUNTAIN_SHADES.length];
      return `<path d="M${(p.x - h * 0.4).toFixed(1)},${p.y.toFixed(1)} L${p.x.toFixed(1)},${(p.y - h).toFixed(1)} L${(p.x + h * 0.4).toFixed(1)},${p.y.toFixed(1)} Z" fill="${shade}" stroke="${MOUNTAIN_STROKE}" stroke-width="1.5" opacity="0.9" />`;
    },
  },
  geometry: {
    central: renderShaleFormation,
    scatterCount: 5,
    scatter: (p, seed) => renderShaleSlab(p.x, p.y, 16 + pseudoRandom(seed) * 8, 20 + pseudoRandom(seed + 1) * 14, (pseudoRandom(seed + 2) - 0.5) * 40, SHALE_SHADES[seed % SHALE_SHADES.length]),
  },
  functions: {
    central: renderSpireFormation,
    scatterCount: 8,
    scatter: (p, seed) => renderPurpleTree(p.x, p.y, 28 + pseudoRandom(seed) * 16, SPIRE_SHADES[seed % SPIRE_SHADES.length]),
  },
  numstats: {
    central: renderFlatsFormation,
    scatterCount: 6,
    scatter: (p, seed) => (seed % 2 === 0 ? renderGoldNugget(p.x, p.y, 9 + pseudoRandom(seed) * 6) : renderTallyMark(p.x, p.y, 22 + pseudoRandom(seed) * 10, 2 + Math.floor(pseudoRandom(seed + 1) * 3))),
  },
};

// Scatters `count` small accents in the ring between a zone's own tight
// node bbox and its shoreline (same idea as the old, since-removed
// per-zone biomes — every position leans on a real gap in the layout
// rather than a hardcoded coordinate, so it stays correct if skill
// counts ever change) — but every one of them is the same rock/spire/
// nugget the zone's own central motif is built from, at a smaller
// scale, not an unrelated prop dropped in for texture.
function renderZoneScatter(zoneId, bbox, seed, ringCap) {
  const terrain = ZONE_TERRAIN[zoneId];
  if (!terrain) return "";
  const max = Math.min(85, ringCap);
  const min = Math.min(50, max - 15);
  if (max <= 0) return "";
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const halfW = (bbox.x1 - bbox.x0) / 2;
  const halfH = (bbox.y1 - bbox.y0) / 2;
  return Array.from({ length: terrain.scatterCount }, (_, i) => {
    const angle = (i / terrain.scatterCount) * Math.PI * 2 + (pseudoRandom(seed * 17 + i) - 0.5) * 0.9;
    const pad = min + pseudoRandom(seed * 23 + i) * (max - min);
    const x = cx + Math.cos(angle) * (halfW + pad);
    const y = cy + Math.sin(angle) * (halfH + pad);
    return terrain.scatter({ x, y }, seed * 31 + i + 1);
  }).join("");
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
function renderIsland(bbox, fill, seed, outerPad = DEFAULT_SHORE_PAD, centralMotif = renderMiniMountains) {
  const innerPad = innerPadFor(outerPad);
  const outerPts = organicIslandPoints(bbox, outerPad, seed);
  const innerPts = organicIslandPoints(bbox, innerPad, seed);
  const headroom = typeof innerPad === "number" ? innerPad : innerPad.top;
  return `
    <path d="${closedBlobPath(outerPts)}" fill="${SAND}" />
    <path d="${closedBlobPath(innerPts)}" fill="${fill}" />
    ${centralMotif(bbox, seed, headroom)}
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

// Same reasoning as safeShorePad, but for a shoreline that borders the
// world's own hard edge (WORLD_H/WORLD_W — where the SVG's own viewBox
// clips) instead of a neighboring island — used for the boss island's
// bottom pad below. No halving: safeShorePad splits a *shared* gap
// between two islands each claiming half, but nothing sits on the far
// side of the world's edge to claim the other half, so the full
// headroom belongs to this one pad.
function safeEdgePad(headroom) {
  return Math.max(MIN_SHORE_PAD, Math.min(DEFAULT_SHORE_PAD, (headroom - WATER_GUTTER) / MAX_BULGE));
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

  // BOSS_POS.y sits only 180px above WORLD_H (the world's own hard
  // bottom edge, where the SVG's viewBox itself clips) — not enough
  // room for this box's old +140 reach *plus* a full, bulge-safe
  // DEFAULT_SHORE_PAD shoreline below it, which is exactly why the
  // island's own sand used to run straight off the bottom of the world
  // instead of curving into a shoreline like every other edge. Splits
  // the fix across both: pull the box's own bottom edge up (140 -> 70,
  // still leaves the boss its own footprint) and size the shoreline pad
  // itself off whatever room that leaves (see safeEdgePad below), rather
  // than only shrinking the box or only thinning the pad.
  const BOSS_BOTTOM_REACH = 70;
  const bossBbox = { x0: BOSS_POS.x - 220, x1: BOSS_POS.x + 220, y0: BOSS_POS.y - 180, y1: BOSS_POS.y + BOSS_BOTTOM_REACH };
  const bossBottomPad = safeEdgePad(WORLD_H - bossBbox.y1);

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

  const islands = zoneGroups
    .map(({ zone }, i) => {
      const bbox = boxes[i];
      if (!bbox) return "";
      const seed = i + 1;
      const terrain = ZONE_TERRAIN[zone.id];
      const innerPad = innerPadFor(pads[i]);
      const ringCap = Math.max(25, Math.min(innerPad.left, innerPad.right, innerPad.top, innerPad.bottom) - 10);
      return renderIsland(bbox, zone.fill, seed, pads[i], terrain?.central) + renderZoneScatter(zone.id, bbox, seed, ringCap);
    })
    .join("");

  const bossIsland =
    renderIsland(bossBbox, BOSS_FILL, 99, { left: DEFAULT_SHORE_PAD, right: DEFAULT_SHORE_PAD, top: bossPadTop, bottom: bossBottomPad }) +
    renderWatchtower(bossBbox.x0 + 55, (bossBbox.y0 + bossBbox.y1) / 2 + 20);
  return causewaysMarkup + islands + bossIsland;
}

// A boustrophedon ("as the ox plows") ordering: row 0 left-to-right, row
// 1 right-to-left, row 2 left-to-right again, and so on — the classic
// non-crossing way to visit a grid with one continuous line. Connecting
// rows in raw placement order instead (every row scanned the same
// direction) means the line has to jump all the way back across to the
// far column at every row change, crossing itself on the way — visible
// as an X/zigzag rather than one clean path.
function serpentineOrder(points) {
  const rows = new Map();
  for (const p of points) {
    if (!rows.has(p.row)) rows.set(p.row, []);
    rows.get(p.row).push(p);
  }
  const rowIndices = [...rows.keys()].sort((a, b) => a - b);
  const ordered = [];
  rowIndices.forEach((r, i) => {
    const rowPts = rows.get(r).sort((a, b) => a.x - b.x);
    if (i % 2 === 1) rowPts.reverse();
    ordered.push(...rowPts);
  });
  return ordered;
}

// Each zone's own nodes get connected in serpentine (boustrophedon)
// order — a single non-crossing line winding through just that zone's
// own lessons, not one radiating from the world's shared CENTER (which
// would cut across other zones' own territories here, unlike Wordwood
// Isle's round island where every zone fans out from that same center
// anyway).
function renderMathTrails(zoneGroups) {
  return zoneGroups
    .map(({ points }) => {
      if (points.length < 2) return "";
      const ordered = serpentineOrder(points);
      const d = ordered.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
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

  // No dashed bossBridge line — the sand causeway (renderMathRegions'
  // own causewaysMarkup) already connects the nearest topic island
  // straight to the boss's own island; a second, differently-styled dark
  // dashed path drawn on top of that real bridge read as redundant
  // clutter rather than a deliberate "final approach" cue. Passing an
  // empty-returning function (not simply omitting the option) is
  // required — hubWorld.js's own default, used whenever bossBridge is
  // left out entirely, is its own generic dashed line from the world's
  // shared spawn point, which is the exact thing being removed here.
  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Numeria Peaks, an archipelago of separate mountainous islands floating in open water — algebra, geometry, functions, and number & stats — each with its own trail of math skills, connected by sand causeways down to the boss's own island",
    landmass: renderMathLandmass,
    regionShapes: renderMathRegions,
    trails: renderMathTrails,
    bossBridge: () => "",
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ridge-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) across the islands — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${renderLegend()}
        ${joystickHTML("hubJoystick")}
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderBossMarker(boss, bossStateClass, subject)}
          <div class="hub-avatar" id="hubAvatar" aria-hidden="true">${monsterSVG(gameState.getDisplayAvatar(), { size: 64 })}</div>
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
    spawn: computeSpawnPoint(layout),
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
