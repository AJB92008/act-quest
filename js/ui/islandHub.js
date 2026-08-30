// ACT English's "hub" island — see the design brief this was built from
// (a big walkable island, one trail per skill, a central Vocabulary
// Builder landmark, WASD movement that auto-opens whatever the player's
// monster walks onto). Replaces island.js's usual scrollable skill list
// for this one subject only; every other subject's island still renders
// that original list unchanged — see island.js's own dispatch at the top
// of renderIsland(). The underlying "big walkable world" mechanics (the
// world/camera geometry, movement, fullscreen toggle) live in
// hubWorld.js, shared with Idiom Instinct's own lesson path
// (skillPathHub.js) — this file owns only what's specific to a skill
// hub: the nature-themed zones, the Vocabulary Builder landmark, the
// subject boss encounter, and the goat.
import { gameState } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { showDevPanel, toggleDevPanel } from "./devPanel.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import { closedBlobPath } from "./lessonTerrain.js";
import {
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  decorationPos,
  zoneCenter,
  computeCurveLayout,
  pointOnCurve,
  ribbonEdgePoint,
  organicRingPoints,
  renderPlankBridge,
  renderWorldSvg,
  renderRibbonIsland,
  renderCurveTrails,
  wireMovement,
  wireFullscreenToggle,
  joystickHTML,
  pointInPolygon,
  buildShorelinePolygons,
} from "./hubWorld.js";

// A hook/nautilus-shell spiral, not a simple S — Wordwood Isle's own
// spine, replacing the old single rounded landmass with something that
// actually has a shape. Each of ZONES' 4 entries below gets a
// length-of-curve share proportional to its own skill count (see
// hubWorld.js's own computeCurveLayout), measured in real arc length —
// but arc-length correctness alone still isn't enough on a curve this
// tightly wound: two markers a fixed arc-length apart end up physically
// *closer* together than that (their straight-line chord, not the arc)
// the more sharply the curve bends between them — see hubWorld.js's own
// computeCurveLayout for how it picks each marker's perpendicular offset
// with that in mind. SPIRAL_CENTER/the radius formula below are tuned so
// the spine itself stays well inside WALK_MARGIN even after that offset.
//
// The inner radius (470, was 350) and y-squash (0.87, was 0.75) are both
// bumped from their original values to fix a real self-intersection: the
// tightest bend's own radius of curvature used to be ~232px, less than
// RIBBON_WIDTH (330) — offsetting the shore that far past the curve's own
// center of curvature folded the shore polygon over itself, rendering as
// a visible gap in the coastline (near where Sunny Meadow and Rocky
// Hillside meet). These values keep the curve's tightest bend at a
// radius of curvature of ~383px, safely past 330. SPIRAL_CENTER.y (310,
// was 510) is a separate, independent tune: it exists purely to trade
// the extra vertical room these two changes need between the island's
// own north tip (must stay clear of the world's top edge) and the boss's
// southern platform (must stay clear of the boss's own dark clearing) —
// see BOSS_POS/renderBossMarker below. It also happens to roughly double
// the boss bridge's own length (the nearest-coastline-point-to-BOSS_POS
// distance) as a side effect, which was wanted anyway. Re-run this
// module's own layout math (min pairwise marker distance, spawn-point
// clearance, shore's own y-bounds) if any of these three ever change
// again — they're a genuinely coupled system, not three independent
// knobs.
const SPIRAL_CENTER = { x: 1100, y: 310 };
function CURVE_FN(t) {
  const startAngle = -Math.PI * 0.15;
  const turns = 0.58;
  const angle = startAngle + t * turns * Math.PI * 2;
  const r = 470 + t * 280;
  return { x: SPIRAL_CENTER.x + Math.cos(angle) * r, y: SPIRAL_CENTER.y + Math.sin(angle) * r * 0.87 };
}
// Wide enough to contain computeCurveLayout's own marker offsets (up to
// 230px out from the spine) with real margin left over to the shoreline
// itself, so markers never sit right at the water's edge.
const RIBBON_WIDTH = 330;
const RIBBON_SHORE_WIDTH = 55;
// Both bridges' own rendered width, shared between the actual
// renderPlankBridge() calls below and their matching walkable-corridor
// polygons (see bridgePolygon/isWalkable) — kept in one place so the
// walkable strip can never drift out of sync with what's actually drawn.
const VOCAB_BRIDGE_WIDTH = 52;
const BOSS_BRIDGE_WIDTH = 68;

// The Vocabulary Builder's own islet sits just off the ribbon at the
// curve's own arc-length *midpoint* — the middle of the curved path
// itself, not the spiral's unrelated mathematical center point (which
// sits inside the tightest part of the inner winding, nowhere near the
// visual middle of the shape) — offset perpendicular from the spine
// there by more than a full ribbon width, so the islet sits in open
// water beside the island rather than on top of it.
const VOCAB_ISLET_OFFSET = 480;
const midSpine = pointOnCurve(CURVE_FN, 0.5);
const VOCAB_ISLET = {
  x: midSpine.x - Math.sin(midSpine.angle) * VOCAB_ISLET_OFFSET,
  y: midSpine.y + Math.cos(midSpine.angle) * VOCAB_ISLET_OFFSET,
  radius: 100,
};

// Walks a stretch of the ribbon's own two edges (both `side`s, arc
// fractions `sMin`..`sMax`) looking for whichever point sits physically
// closest to `target` — used to anchor a bridge to wherever the
// island's actual coastline is, rather than a hand-guessed coordinate
// that could drift out of sync if the spiral's own shape ever changes.
function findNearestRibbonEdge(target, sMin, sMax, steps = 48) {
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i <= steps; i++) {
    const sFrac = sMin + (i / steps) * (sMax - sMin);
    for (const side of [1, -1]) {
      const p = ribbonEdgePoint(CURVE_FN, sFrac, RIBBON_WIDTH, side);
      const d = Math.hypot(p.x - target.x, p.y - target.y);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
  }
  return best;
}

// A rectangle polygon for a plank bridge's own walkable span — the
// bridge itself isn't a sand-colored path (buildShorelinePolygons only
// ever finds actual shoreline), so without this the avatar would hit
// invisible water the moment it stepped off either island onto a
// bridge, unable to reach the Vocabulary Builder or the boss despite the
// visible crossing right there. `halfWidth` should be a little under the
// bridge's own rendered `width / 2` so the walkable strip stays inside
// the rails rather than hanging just past them.
function bridgePolygon(ax, ay, bx, by, halfWidth) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * halfWidth;
  const py = (dx / len) * halfWidth;
  return [
    { x: ax + px, y: ay + py },
    { x: bx + px, y: by + py },
    { x: bx - px, y: by - py },
    { x: ax - px, y: ay - py },
  ];
}

// A bridge's own end should touch the islet's actual shore, not its
// center — steps back from `to` toward `from` by exactly the islet's
// own radius, along the straight line between them.
function pullBackToEdge(from, to, radius) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / len) * radius, y: from.y + (dy / len) * radius };
}

const ISLET_SAND = "#ecdfb8";
const ISLET_FILL = "#efe4cf";

function renderVocabIslet(seed = 5) {
  const outerPts = organicRingPoints(VOCAB_ISLET, VOCAB_ISLET.radius + 22, seed, 40, [0, 0.15]);
  const innerPts = organicRingPoints(VOCAB_ISLET, VOCAB_ISLET.radius - 14, seed, 40, [0, 0.15]);
  return `<path d="${closedBlobPath(outerPts)}" fill="${ISLET_SAND}" /><path d="${closedBlobPath(innerPts)}" fill="${ISLET_FILL}" stroke="#c9a668" stroke-width="4" />`;
}

// Sells "ominous path to a boss" beyond just the bridge's own geometry —
// a soft dark mist hugging the water the whole bridge crosses (drawn
// first, so the bridge itself renders on top of it) and a few warm torch
// glows along one rail (drawn last, so they sit visibly on top of the
// planks rather than under them) — see the two render calls below.
// Pure visual dressing, no gameplay effect; scoped to islandHub.js since
// Wordwood Isle is the only hub with an actual boss *bridge* to dress up
// (every other hub's boss sits on renderWorldSvg's own default plain
// dashed path from CENTER).
function renderBossBridgeMist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  return `<ellipse cx="${midX.toFixed(1)}" cy="${midY.toFixed(1)}" rx="${(len / 2 + 70).toFixed(1)}" ry="95" fill="#0a1520" opacity="0.3" transform="rotate(${angleDeg.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)})" />`;
}

function renderBossBridgeTorches(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const railOffset = 42;
  return [0.2, 0.5, 0.8]
    .map((f) => {
      const tx = ax + dx * f + px * railOffset;
      const ty = ay + dy * f + py * railOffset;
      return (
        `<circle class="boss-bridge-torch-glow" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="20" fill="#ffb347" opacity="0.16" />` +
        `<circle class="boss-bridge-torch" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="6" fill="#ffcf7a" />`
      );
    })
    .join("");
}

// Dev mode's unlock gesture used to be 10 rapid clicks on the (now
// removed) dark-mode toggle; with that gone, a goat hidden on Rocky
// Hillside (see computeGoatPos) is the new one — same 10-clicks-within-5s
// mechanic, just moved somewhere only exists on this screen.
const DEV_MODE_CLICKS = 10;
const DEV_MODE_WINDOW_MS = 5000;
// Module-level (not per-render) so rapid clicks keep counting across the
// innerHTML rebuild every navigate() triggers — same reasoning hud.js's
// old toggle-click tracking used.
let goatClickTimestamps = [];

// Smaller than the other hubs' shared 58px default — computeCurveLayout's
// own greedy placement guarantees every pair of markers on this spiral is
// at least MIN_MARKER_DIST=100px apart (in practice the tightest pair
// ends up ~111px), but two 58px hitboxes would still overlap at that gap
// (2*58=116>111). 50px leaves real margin (2*50=100<111) while still
// being bigger than Wordwood Isle's old 40px felt walking through it.
const SKILL_TRIGGER_RADIUS = 50;
const LANDMARK_TRIGGER_RADIUS = 150;

// One long island, four differently-themed bands along its own spine
// rather than four separate islets — keeps the whole thing walkable as a
// single landmass (matches "island should be very big," singular) while
// still giving each cluster of skills its own distinct look and a
// handful of small scenery details, per the brief. Order here is order
// along CURVE (see computeCurveLayout/renderRibbonIsland in
// hubWorld.js) — Sunny Meadow starts the spine, Tidewater Dock ends it —
// not a compass direction the way the old radiating layout's zones
// pointed; the four fill colors deliberately land far from every other
// subject's own palette elsewhere in the app. Reordering this array
// would move a zone to a different stretch of the curve, but every
// skill stays in the exact same zone it's always been in either way —
// this is only ever a *position* change, never a re-grouping.
// `description` is what the legend shows for each zone — a plain
// description of what it actually covers, not one of the ACT's own 3
// real reporting-category names (Conventions of Standard English/
// Knowledge of Language/Production of Writing — see js/data/skills.js),
// since these 4 visual zones don't line up with those 3 categories
// 1:1. No `decorations` array anymore — the old per-zone emoji (flowers,
// rocks, trees, an anchor...) didn't map to any lesson and just added
// visual noise; still an array (not omitted) because renderWorldSvg's
// own default decoration pass reads `zone.decorations` unconditionally.
const ZONES = [
  { id: "meadow", name: "Sunny Meadow", fill: "#c3dd8f", description: "Punctuation & mechanics", decorations: [] },
  { id: "hillside", name: "Rocky Hillside", fill: "#c2ab84", description: "Grammar & agreement", decorations: [] },
  { id: "forest", name: "Whisper Grove", fill: "#7fa35e", description: "Sentence structure", decorations: [] },
  { id: "dock", name: "Tidewater Dock", fill: "#dcc48f", description: "Organization & style", decorations: [] },
];

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

// Rocky Hillside's goat is the dev-mode unlock: 10 clicks within 5s,
// same mechanic the old theme toggle used before dark mode was removed.
// With the zone's own decorations gone, it isn't found by emoji index
// anymore — it just sits at decorationPos' own spot #0 off that zone's
// center, the same fixed spot it already occupied.
function computeGoatPos(layout) {
  const hillside = ZONES.find((z) => z.id === "hillside");
  const points = layout.filter((p) => p.zone === hillside);
  if (!points.length) return null;
  const { avgX, avgY } = zoneCenter(points);
  return decorationPos(avgX, avgY, 0, 1);
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
      <button class="hub-boss-marker is-grammar-golem ${bossStateClass}" data-boss ${locked ? "disabled" : ""}
        aria-label="${boss.name}, ${subject.name} Boss Quiz${cleared ? " (cleared)" : locked ? `: locked until every skill on this island is mastered` : ""}">
        ${monsterSVG(boss.avatar, { size: 92 })}
        ${cleared ? `<span class="hub-boss-crown">👑</span>` : locked ? `<span class="hub-boss-lock">🔒</span>` : ""}
      </button>
      <span class="hub-skill-name hub-boss-name">${locked ? "🔒 " : ""}${boss.name}</span>
    </div>
  `;
}

export function renderEnglishHub(root, navigate, subject) {
  const layout = computeCurveLayout(subject.skills, ZONES, CURVE_FN);
  // The Vocabulary Builder sits on its own islet at the spiral's own
  // mathematical center (see VOCAB_ISLET above) rather than directly on
  // the spine, reached by its own bridge from wherever the ribbon's
  // actual coastline happens to pass closest — searched fresh each
  // render rather than a hand-picked point, so it can never drift out of
  // sync with CURVE_FN/RIBBON_WIDTH if either changes later.
  const landmarkPos = { x: VOCAB_ISLET.x, y: VOCAB_ISLET.y };
  const vocabBridgeAnchor = findNearestRibbonEdge(VOCAB_ISLET, 0, 1);
  const vocabBridgeStart = pullBackToEdge(VOCAB_ISLET, vocabBridgeAnchor, VOCAB_ISLET.radius);
  // Same search, but against BOSS_POS and over the *whole* ribbon —
  // "south off the island's edge" means finding whichever stretch of
  // coastline is actually nearest the boss, not assuming it's any one
  // particular zone's own end of the spiral.
  const bossBridgeAnchor = findNearestRibbonEdge(BOSS_POS, 0, 1);
  const goatPos = computeGoatPos(layout);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Wordwood Isle, one curled hook-shaped island split into four clean bands along its own spiral spine — a sunny meadow, a rocky hillside, a whisper grove, and a tidewater dock — plus a small islet at the spiral's own center, reachable by its own bridge, holding the Vocabulary Builder, and a dark bridge off the island's southern edge leading to the boss's own platform",
    landmass: () => "",
    regionShapes: (zoneGroups) =>
      renderRibbonIsland(zoneGroups, CURVE_FN, { baseWidth: RIBBON_WIDTH, shoreRingWidth: RIBBON_SHORE_WIDTH }) +
      renderPlankBridge(vocabBridgeStart.x, vocabBridgeStart.y, vocabBridgeAnchor.x, vocabBridgeAnchor.y, {
        width: VOCAB_BRIDGE_WIDTH,
        color: "#c9a668",
        railColor: "#8a6a48",
        railThickness: 6,
        plankThickness: 9,
      }) +
      renderVocabIslet(),
    trails: renderCurveTrails,
    bossBridge: () =>
      renderBossBridgeMist(bossBridgeAnchor.x, bossBridgeAnchor.y, BOSS_POS.x, BOSS_POS.y) +
      renderPlankBridge(bossBridgeAnchor.x, bossBridgeAnchor.y, BOSS_POS.x, BOSS_POS.y, {
        width: BOSS_BRIDGE_WIDTH,
        color: "#241a15",
        railColor: "#140d0a",
        railThickness: 8,
        plankThickness: 11,
      }) +
      `<circle cx="${BOSS_POS.x}" cy="${BOSS_POS.y}" r="95" fill="#2c211c" opacity="0.32" />` +
      renderBossBridgeTorches(bossBridgeAnchor.x, bossBridgeAnchor.y, BOSS_POS.x, BOSS_POS.y),
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) through the meadow, hillside, grove, and dock — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${renderLegend()}
        ${joystickHTML("hubJoystick")}
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          <div class="hub-marker-wrap" style="left:${landmarkPos.x}px;top:${landmarkPos.y}px;">
            <button class="hub-landmark" data-landmark aria-label="ACT Vocabulary Builder (bonus, not a graded skill)">
              <span class="hub-landmark-icon">🔤</span>
              <span class="hub-landmark-bonus-badge" aria-hidden="true">Bonus</span>
            </button>
            <span class="hub-skill-name hub-landmark-name is-bonus-name">Vocabulary Builder</span>
          </div>
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderBossMarker(boss, bossStateClass, subject)}
          ${
            goatPos
              ? `<button class="hub-goat-btn" id="hubGoatBtn" type="button" style="left:${goatPos.x}px;top:${goatPos.y}px" aria-label="A goat">🐐</button>`
              : ""
          }
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
  root.querySelector("[data-landmark]").addEventListener("click", () => goTo("vocabulary", {}));
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  root.querySelector("#hubGoatBtn")?.addEventListener("click", () => {
    const now = Date.now();
    goatClickTimestamps.push(now);
    goatClickTimestamps = goatClickTimestamps.filter((t) => now - t <= DEV_MODE_WINDOW_MS);
    if (goatClickTimestamps.length < DEV_MODE_CLICKS) return;
    goatClickTimestamps = [];
    if (!gameState.devModeUnlocked) {
      gameState.setDevModeUnlocked(true);
      showToast("🛠️ Developer Mode unlocked!");
      showDevPanel(goTo);
    } else {
      toggleDevPanel(goTo);
    }
  });

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  // The avatar's walkable ground is the actual rendered shore (both the
  // main island's ribbon and the Vocabulary Builder's own islet — both
  // painted in RIBBON_SAND, so buildShorelinePolygons picks up each as
  // its own polygon) plus a walkable strip down the middle of each
  // bridge, since a bridge itself isn't sand-colored and would otherwise
  // read as open water no avatar could cross. Built fresh off the live
  // DOM (after root.innerHTML above), so it can never drift out of sync
  // with whatever CURVE_FN/RIBBON_WIDTH/seed actually drew this render.
  const shorePolygons = buildShorelinePolygons(root);
  const bridgePolygons = [
    bridgePolygon(vocabBridgeStart.x, vocabBridgeStart.y, vocabBridgeAnchor.x, vocabBridgeAnchor.y, VOCAB_BRIDGE_WIDTH / 2),
    bridgePolygon(bossBridgeAnchor.x, bossBridgeAnchor.y, BOSS_POS.x, BOSS_POS.y, BOSS_BRIDGE_WIDTH / 2),
  ];
  const walkablePolygons = [...shorePolygons, ...bridgePolygons];
  const isWalkable = (px, py) => walkablePolygons.some((poly) => pointInPolygon(px, py, poly));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    isWalkable,
    // Right on the spine's own centerline, halfway along its length —
    // verified clear of every marker's own SKILL_TRIGGER_RADIUS (closest
    // marker sits ~78px away, radius is 50px), same reasoning as
    // Science's own spawn/landmark spacing fix. Re-check this if
    // SKILL_TRIGGER_RADIUS grows or CURVE_FN/ZONES' skill counts change —
    // computeCurveLayout's greedy placement can put a marker anywhere
    // from -230 to +230px off the spine, including right on it.
    spawn: (() => {
      const p = pointOnCurve(CURVE_FN, 0.5);
      return { x: p.x, y: p.y };
    })(),
    targets: [
      { x: landmarkPos.x, y: landmarkPos.y, radius: LANDMARK_TRIGGER_RADIUS, onArrive: () => goTo("vocabulary", {}) },
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
