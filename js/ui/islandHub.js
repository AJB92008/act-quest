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
  CENTER,
  LANDMARK_CLEARING_R,
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  decorationPos,
  zoneCenter,
  computeZoneLayout,
  renderWorldSvg,
  wireMovement,
  wireFullscreenToggle,
} from "./hubWorld.js";

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

// One big island, four differently-themed regions blended into it rather
// than four separate islets — keeps the whole thing walkable as a single
// landmass (matches "island should be very big," singular) while still
// giving each cluster of skills its own distinct look and a handful of
// small scenery details, per the brief. Each zone's `dir` points from the
// world's center out toward that zone's corner; skill trails wind further
// out along that same direction; the four fill colors deliberately land
// far from every other subject's own palette elsewhere in the app.
const ZONES = [
  { id: "meadow", name: "Sunny Meadow", dir: { x: -1, y: -1 }, fill: "#c3dd8f", decorations: ["🌼", "🌸", "🦋", "🐝"] },
  { id: "hillside", name: "Rocky Hillside", dir: { x: 1, y: -1 }, fill: "#c2ab84", decorations: ["🪨", "⛰️", "🐐"] },
  { id: "forest", name: "Whisper Grove", dir: { x: -1, y: 1 }, fill: "#7fa35e", decorations: ["🌳", "🌲", "🦉"] },
  { id: "dock", name: "Tidewater Dock", dir: { x: 1, y: 1 }, fill: "#dcc48f", decorations: ["⚓", "🚤", "🐚"] },
];

// The Rocky Hillside sits toward the world's top-right (see ZONES' own
// `dir`), and its goat is the dev-mode unlock: 10 clicks within 5s, same
// mechanic the old theme toggle used before dark mode was removed. Found
// by position (zone id + the emoji itself) rather than a hardcoded index,
// so reordering ZONES' decoration lists later can't silently move it.
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
  const layout = computeZoneLayout(subject.skills, ZONES);
  const landmarkPos = { x: CENTER.x, y: CENTER.y };
  const goatPos = computeGoatPos(layout);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Wordwood Isle, a big island with a sunny meadow, a rocky hillside, a whisper grove, and a tidewater dock, each with its own trail of grammar skills, plus a dark path south to the boss lair",
    centerClearing: { fill: "#efe4cf", stroke: "#c9a668", strokeWidth: 4 },
    skipDecoration: (zone, emoji) => zone.id === "hillside" && emoji === "🐐",
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD through the meadow, hillside, grove, and dock — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
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
    spawn: { x: CENTER.x, y: CENTER.y + LANDMARK_CLEARING_R + 55 },
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
