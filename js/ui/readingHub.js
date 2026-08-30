// ACT Reading's "hub" island, Athenaeum Reef — the same walkable-hub
// treatment as English's Wordwood Isle (islandHub.js) and Math's Numeria
// Peaks (mathHub.js): a big walkable island, one trail per skill, a
// central Vocabulary Builder landmark, WASD-or-joystick movement that
// auto-opens whatever the player's monster walks onto. Replaces
// island.js's usual scrollable skill list for this subject only — see
// island.js's own dispatch at the top of renderIsland(). The underlying
// "big walkable world" mechanics (world/camera geometry, movement,
// fullscreen toggle) live in hubWorld.js; this file owns only what's
// specific to Reading's own hub: the reef-themed zones and the
// Vocabulary Builder landmark (also the reference lesson on Reading's
// plain island list — see island.js's referenceLinkHTML).
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import {
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  computeCurveLayout,
  pointOnCurve,
  renderWorldSvg,
  renderRibbonIsland,
  renderCurveTrails,
  wireMovement,
  wireFullscreenToggle,
  joystickHTML,
} from "./hubWorld.js";

const SKILL_TRIGGER_RADIUS = 58;
const LANDMARK_TRIGGER_RADIUS = 150;

// A cubic Bezier's 4 control points, sweeping a gentle crescent from the
// world's lower-left up through the top-middle and back down through
// the lower-right — Athenaeum Reef's own spine (a different shape than
// Wordwood Isle's, for visual variety between the two), replacing the
// old single rounded landmass with something that actually has a shape.
const CURVE = [
  { x: 200, y: 950 },
  { x: 950, y: 250 },
  { x: 1300, y: 900 },
  { x: 2020, y: 350 },
];

// One long reef island, five differently-themed bands along its own
// spine rather than five separate islets — same "one landmass, several
// zones" approach as Wordwood Isle, just five-way instead of English's
// four, since Reading's ten skills split evenly two per zone (four zones
// would leave one skill stranded alone — see computeCurveLayout's
// per-zone chunking). Order here is order along CURVE, not a compass
// direction; every skill stays in the exact same zone it's always been
// in regardless of how this array is ordered.
const ZONES = [
  { id: "stacks", name: "Coral Stacks", fill: "#7fd9c4", decorations: ["🪸", "📚", "🐠"] },
  { id: "tidepool", name: "Tide Pool Terrace", fill: "#a7e0d8", decorations: ["🌊", "🦀", "🐚"] },
  { id: "lighthouse", name: "Lighthouse Point", fill: "#e8d29a", decorations: ["🧭", "⛵", "🐟"] },
  { id: "archive", name: "Sunken Archive", fill: "#6fb8c9", decorations: ["📜", "🐙", "🦑"] },
  { id: "driftwood", name: "Driftwood Cove", fill: "#c9a887", decorations: ["🪵", "🐬", "🐳"] },
];

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

export function renderReadingHub(root, navigate, subject) {
  const layout = computeCurveLayout(subject.skills, ZONES, CURVE);
  // The Vocabulary Builder sits right on the spine at its midpoint —
  // same role a raw world CENTER played for the old radiating layout,
  // just relocated to wherever this hub's own curve has its middle.
  const landmarkPoint = pointOnCurve(CURVE, 0.5);
  const landmarkPos = { x: landmarkPoint.x, y: landmarkPoint.y };

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Athenaeum Reef, one long curved reef island split into five clean bands along its own spine — coral stacks, a tide pool terrace, a lighthouse point, a sunken archive, and a driftwood cove — each with its own trail of reading skills, plus a dark path south to the boss lair",
    landmass: () => "",
    regionShapes: (zoneGroups) => renderRibbonIsland(zoneGroups, CURVE),
    trails: renderCurveTrails,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen reef-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) through the stacks, tide pool, lighthouse, archive, and cove — every trail leads to a skill</p>
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

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    // 220px further along the spine's own tangent from the landmark —
    // clear of its 150px trigger radius, so a single step at spawn can
    // never yank the player straight into the Vocabulary Builder.
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
