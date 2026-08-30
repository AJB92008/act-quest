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
import {
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  decorationPos,
  zoneCenter,
  computeCurveLayout,
  pointOnCurve,
  renderWorldSvg,
  renderRibbonIsland,
  renderCurveTrails,
  wireMovement,
  wireFullscreenToggle,
  joystickHTML,
} from "./hubWorld.js";

// A hook/nautilus-shell spiral, not a simple S — Wordwood Isle's own
// spine, replacing the old single rounded landmass with something that
// actually has a shape (each of ZONES' 4 entries below gets an
// equal-*length* quarter of this curve — see hubWorld.js's own
// computeCurveLayout, which measures real arc length, not raw parameter,
// specifically so a tightly-curled stretch of spiral doesn't bunch its
// zone's own markers together while a wide stretch spreads its own
// too thin). `t` sweeps just over 3/4 of a full turn while the radius
// grows the whole way, so successive loops stay well clear of each
// other — never mind overlapping, since the ribbon itself
// (renderRibbonIsland) is only ~260px wide against a 620px radius
// growth across the sweep.
function CURVE_FN(t) {
  const center = { x: 1000, y: 620 };
  const startAngle = -Math.PI * 0.15;
  const turns = 0.74;
  const angle = startAngle + t * turns * Math.PI * 2;
  const r = 210 + t * 610;
  return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r * 0.8 };
}

// Dev mode's unlock gesture used to be 10 rapid clicks on the (now
// removed) dark-mode toggle; with that gone, the Rocky Hillside's own
// goat decoration (see computeGoatPos) is the new one — same 10-clicks-
// within-5s mechanic, just moved somewhere only exists on this screen.
const DEV_MODE_CLICKS = 10;
const DEV_MODE_WINDOW_MS = 5000;
// Module-level (not per-render) so rapid clicks keep counting across the
// innerHTML rebuild every navigate() triggers — same reasoning hud.js's
// old toggle-click tracking used.
let goatClickTimestamps = [];

const SKILL_TRIGGER_RADIUS = 58;
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
const ZONES = [
  { id: "meadow", name: "Sunny Meadow", fill: "#c3dd8f", decorations: ["🌼", "🌸", "🦋", "🐝"] },
  { id: "hillside", name: "Rocky Hillside", fill: "#c2ab84", decorations: ["🪨", "⛰️", "🐐"] },
  { id: "forest", name: "Whisper Grove", fill: "#7fa35e", decorations: ["🌳", "🌲", "🦉"] },
  { id: "dock", name: "Tidewater Dock", fill: "#dcc48f", decorations: ["⚓", "🚤", "🐚"] },
];

// Rocky Hillside's goat is the dev-mode unlock: 10 clicks within 5s,
// same mechanic the old theme toggle used before dark mode was removed.
// Found by position (zone id + the emoji itself) rather than a
// hardcoded index, so reordering ZONES' decoration lists later can't
// silently move it.
function computeGoatPos(layout) {
  const hillside = ZONES.find((z) => z.id === "hillside");
  const points = layout.filter((p) => p.zone === hillside);
  if (!points.length) return null;
  const { avgX, avgY } = zoneCenter(points);
  const index = hillside.decorations.indexOf("🐐");
  return decorationPos(avgX, avgY, index, hillside.decorations.length);
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

export function renderEnglishHub(root, navigate, subject) {
  const layout = computeCurveLayout(subject.skills, ZONES, CURVE_FN);
  // The Vocabulary Builder sits right on the spine at its midpoint —
  // Wordwood Isle's one landmark, same role CENTER played for the old
  // radiating layout, just relocated to wherever this hub's own curve
  // happens to have its middle instead of the world's raw geometric
  // center.
  const landmarkPoint = pointOnCurve(CURVE_FN, 0.5);
  const landmarkPos = { x: landmarkPoint.x, y: landmarkPoint.y };
  const goatPos = computeGoatPos(layout);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Wordwood Isle, one curled hook-shaped island split into four clean bands along its own spiral spine — a sunny meadow, a rocky hillside, a whisper grove, and a tidewater dock — each with its own trail of grammar skills, plus a dark path south to the boss lair",
    skipDecoration: (zone, emoji) => zone.id === "hillside" && emoji === "🐐",
    landmass: () => "",
    regionShapes: (zoneGroups) => renderRibbonIsland(zoneGroups, CURVE_FN, { baseWidth: 270, shoreRingWidth: 50 }),
    trails: renderCurveTrails,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) through the meadow, hillside, grove, and dock — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${joystickHTML("hubJoystick")}
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          <div class="hub-marker-wrap" style="left:${landmarkPos.x}px;top:${landmarkPos.y}px;">
            <button class="hub-landmark" data-landmark aria-label="ACT Vocabulary Builder">
              <span class="hub-landmark-icon">🔤</span>
            </button>
            <span class="hub-skill-name hub-landmark-name">Vocabulary Builder</span>
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

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    // 220px further along the spine's own tangent from the landmark —
    // clear of its 150px trigger radius (see the note on Science's own
    // spawn/landmark spacing bug this mirrors), landing inside Whisper
    // Grove's own stretch of the curve.
    spawn: { x: landmarkPos.x + Math.cos(landmarkPoint.angle) * 220, y: landmarkPos.y + Math.sin(landmarkPoint.angle) * 220 },
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
