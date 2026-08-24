// Idiom Instinct's own "hub" lesson path — the same big-walkable-world
// treatment built for English's Wordwood Isle hub (islandHub.js), one
// level down: instead of one trail per skill, this is one trail per
// lesson within a single skill, with that skill's own hardest lesson
// (its "boss lesson," always the last one — see isBossLessonIndex in
// data/questions/index.js) standing in for the subject-level boss
// encounter's dark-pathed lair. Replaces skillPath.js's usual winding
// list for this one skill only; every other skill's lesson path still
// renders that original list unchanged — see skillPath.js's own dispatch
// near the top of renderSkillPath(). The shared "big walkable world"
// mechanics (world/camera geometry, movement, fullscreen toggle) live in
// hubWorld.js.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getSkillBossName } from "../data/skills.js";
import { getSkill } from "../data/tests.js";
import { getLessonCount } from "../data/questions/index.js";
import { LESSONS } from "../data/lessons.js";
import { glowVars } from "./pathTrail.js";
import { CENTER, BOSS_POS, BOSS_TRIGGER_RADIUS, WORLD_W, WORLD_H, computeZoneLayout, renderWorldSvg, wireMovement, wireFullscreenToggle } from "./hubWorld.js";

const LESSON_TRIGGER_RADIUS = 58;

// Four zones themed like a small scholar's retreat rather than Wordwood
// Isle's own outdoor nature palette — same "big walkable world" idea,
// distinct enough in color/decoration that this reads as its own place
// and not just a re-skinned copy of the island it sits inside.
const ZONES = [
  { id: "nook", name: "Reading Nook", dir: { x: -1, y: -1 }, fill: "#e8d9b5", decorations: ["📖", "🕯️", "🔖"] },
  { id: "archive", name: "Scroll Archive", dir: { x: 1, y: -1 }, fill: "#cbb0ae", decorations: ["📜", "🏺", "🦉"] },
  { id: "study", name: "Ink & Quill Study", dir: { x: -1, y: 1 }, fill: "#a893b0", decorations: ["🖋️", "📚", "🔍"] },
  { id: "lantern", name: "Lantern Walk", dir: { x: 1, y: 1 }, fill: "#8fb3ad", decorations: ["🏮", "🔭", "🕰️"] },
];

function renderLessonMarker({ item: index, x, y }, skillId, subject) {
  const progress = gameState.getSkillProgress(skillId);
  const unlocked = gameState.isLessonUnlocked(skillId, index);
  const done = index < progress.lessonsCompleted;
  const stateClass = done ? "is-mastered" : unlocked ? "is-open" : "is-locked";
  const badge = done ? "✓" : unlocked ? String(index + 1) : "🔒";
  return `
    <div class="hub-marker-wrap" style="left:${x}px;top:${y}px;">
      <button class="hub-skill-marker node-circle node-circle-small ${stateClass}" data-lesson="${index}" ${unlocked ? "" : "disabled"}
        style="--node-color:${subject.color}"
        aria-label="Lesson ${index + 1}${done ? ", complete" : unlocked ? "" : ", locked"}">
        ${badge}
      </button>
      <span class="hub-skill-name">Lesson ${index + 1}</span>
    </div>
  `;
}

function renderBossLessonMarker(skillId, bossIndex, bossName) {
  const progress = gameState.getSkillProgress(skillId);
  const unlocked = gameState.isLessonUnlocked(skillId, bossIndex);
  const done = bossIndex < progress.lessonsCompleted;
  const stateClass = done ? "is-cleared" : unlocked ? "is-unlocked" : "is-locked";
  const locked = stateClass === "is-locked";
  return `
    <div class="hub-marker-wrap" style="left:${BOSS_POS.x}px;top:${BOSS_POS.y}px;">
      <button class="hub-boss-marker ${stateClass}" data-lesson="${bossIndex}" ${locked ? "disabled" : ""}
        aria-label="${bossName}${done ? " (cleared)" : locked ? ": locked until every earlier lesson is complete" : ""}">
        <span class="hub-boss-emoji">👑</span>
        ${done ? `<span class="hub-boss-crown">👑</span>` : locked ? `<span class="hub-boss-lock">🔒</span>` : ""}
      </button>
      <span class="hub-skill-name hub-boss-name">${locked ? "🔒 " : ""}${bossName}</span>
    </div>
  `;
}

export function renderIdiomHub(root, navigate, { skillId, subjectId }) {
  const { subject, skill } = getSkill(skillId);
  const totalLessons = getLessonCount(skillId);
  const bossIndex = totalLessons - 1;
  const bossName = getSkillBossName(skill.name);
  const paragraphs = LESSONS[skillId] || [];

  const regularLessons = Array.from({ length: bossIndex }, (_, i) => i);
  const layout = computeZoneLayout(regularLessons, ZONES);

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel: `${skill.name}'s own island: a reading nook, a scroll archive, an ink and quill study, and a lantern walk, each with its own trail of lessons, plus a dark path south to ${bossName}`,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen skillpath-screen hub-island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Island</button>
      <div class="lesson-card">
        <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 80 })}</div>
        <h1 class="lesson-title">${skill.name}</h1>
        <p class="lesson-blurb">${skill.blurb}</p>
        ${paragraphs.map((p) => `<p class="lesson-paragraph">${p}</p>`).join("")}
        <div class="lesson-timer-setting">
          <label class="toggle-label">
            <input type="checkbox" id="timerToggle" ${gameState.timerEnabled ? "checked" : ""} />
            ⏱️ Timed questions
          </label>
          <p class="lesson-timer-hint">Turn off if you'd rather take your time on each question.</p>
        </div>
      </div>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD through the reading nook, archive, study, and lantern walk — every trail leads to a lesson</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          ${layout.map((p) => renderLessonMarker(p, skillId, subject)).join("")}
          ${renderBossLessonMarker(skillId, bossIndex, bossName)}
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
  root.querySelector("[data-back]").addEventListener("click", () => goTo("island", { subjectId }));
  root.querySelector("#timerToggle").addEventListener("change", (e) => {
    gameState.setTimerEnabled(e.target.checked);
  });
  root.querySelectorAll("[data-lesson]:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => goTo("quiz", { skillId, subjectId, lessonIndex: Number(btn.dataset.lesson) }));
  });

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    spawn: { x: CENTER.x, y: CENTER.y + 55 },
    targets: [
      {
        x: BOSS_POS.x,
        y: BOSS_POS.y,
        radius: BOSS_TRIGGER_RADIUS,
        gate: () => gameState.isLessonUnlocked(skillId, bossIndex),
        onArrive: () => goTo("quiz", { skillId, subjectId, lessonIndex: bossIndex }),
      },
      ...layout.map((p) => ({
        x: p.x,
        y: p.y,
        radius: LESSON_TRIGGER_RADIUS,
        gate: () => gameState.isLessonUnlocked(skillId, p.item),
        onArrive: () => goTo("quiz", { skillId, subjectId, lessonIndex: p.item }),
      })),
    ],
  });
  stop = () => {
    stopMovement();
    unwireFullscreen();
  };
}
