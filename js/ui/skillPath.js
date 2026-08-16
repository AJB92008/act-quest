import { getSkillBossName } from "../data/skills.js";
import { getSkill } from "../data/tests.js";
import { getLessonCount, isBossLessonIndex } from "../data/questions/index.js";
import { LESSONS } from "../data/lessons.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 128;

export function renderSkillPath(root, navigate, { skillId, subjectId }) {
  const { subject, skill } = getSkill(skillId);
  const totalLessons = getLessonCount(skillId);
  const progress = gameState.getSkillProgress(skillId);
  const paragraphs = LESSONS[skillId] || [];
  const bossName = getSkillBossName(skill.name);

  const positions = pathPositions(totalLessons, { rowHeight: ROW_HEIGHT });
  const totalHeight = pathHeight(totalLessons, ROW_HEIGHT);

  const nodes = Array.from({ length: totalLessons }, (_, i) => {
    const { x, y } = positions[i];
    const isBoss = isBossLessonIndex(skillId, i);
    const unlocked = gameState.isLessonUnlocked(skillId, i);
    const done = i < progress.lessonsCompleted;
    const stateClass = `${done ? "is-mastered" : unlocked ? "is-open" : "is-locked"}${isBoss ? " is-boss-node" : ""}`;
    const isCurrent = !progress.mastered && i === progress.lessonsCompleted;
    const badge = done ? "✓" : unlocked ? (isBoss ? "👑" : String(i + 1)) : "🔒";
    const label = isBoss ? "👑 Boss" : `Lesson ${i + 1}`;
    const ariaLabel = isBoss ? `Boss: ${bossName}` : `Lesson ${i + 1}`;
    return `
      <div class="path-node-wrap" style="left:${x}%;top:${y}px;">
        ${isCurrent ? `<div class="path-mascot">${monsterSVG(gameState.getDisplayAvatar(), { size: 54 })}</div>` : ""}
        <button class="node-circle node-circle-small ${stateClass}" data-lesson="${i}" ${unlocked ? "" : "disabled"}
          aria-label="${ariaLabel}${done ? ", complete" : unlocked ? "" : ", locked"}"
          style="--node-color:${subject.color}">
          ${badge}
        </button>
        <div class="node-label node-label-compact"><h4>${label}</h4></div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen skillpath-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
      <button class="back-btn" data-back>&larr; Back to Island</button>
      <div class="lesson-card">
        <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 98 })}</div>
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
      <p class="skillpath-hint">${progress.mastered ? "🏅 Skill mastered! Revisit any lesson to practice." : "Clear each lesson to unlock the next."}</p>
      <div class="map-path-container skillpath-path" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: subject.color })}
        <div class="path-decorations">${renderDecorations(totalHeight, skillId.length)}</div>
        ${nodes}
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("island", { subjectId }));
  root.querySelector("#timerToggle").addEventListener("change", (e) => {
    gameState.setTimerEnabled(e.target.checked);
  });
  root.querySelectorAll("[data-lesson]:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () =>
      navigate("quiz", { skillId, subjectId, lessonIndex: Number(btn.dataset.lesson) })
    );
  });
}
