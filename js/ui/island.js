import { getSubject } from "../data/skills.js";
import { getLessonCount } from "../data/questions/index.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 148;

export function renderIsland(root, navigate, { subjectId }) {
  const subject = getSubject(subjectId);
  const positions = pathPositions(subject.skills.length, { rowHeight: ROW_HEIGHT });
  const totalHeight = pathHeight(subject.skills.length, ROW_HEIGHT);
  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subjectId);

  let currentIndex = subject.skills.findIndex((skill) => !gameState.isMastered(skill.id));
  if (currentIndex === -1) currentIndex = subject.skills.length - 1;

  // Skills within an island are always freely accessible (practice any of
  // them any time); it's only the mini-lessons *inside* a skill that are
  // gated to chronological order. The mascot just marks a suggested next
  // stop, it doesn't block anything.
  const nodes = subject.skills
    .map((skill, i) => {
      const { x, y } = positions[i];
      const progress = gameState.getSkillProgress(skill.id);
      const totalLessons = getLessonCount(skill.id);
      const stateClass = progress.mastered ? "is-mastered" : "is-open";
      const isCurrent = i === currentIndex;
      const badge = progress.mastered ? "✓" : String(i + 1);
      return `
        <div class="path-node-wrap" style="left:${x}%;top:${y}px;">
          ${isCurrent ? `<div class="path-mascot">${monsterSVG(gameState.getDisplayAvatar(), { size: 48 })}</div>` : ""}
          <button class="node-circle ${stateClass}" data-skill="${skill.id}"
            style="--node-color:${subject.color}">
            ${badge}
          </button>
          <div class="node-label">
            <h4>${skill.name}</h4>
            <p>${skill.blurb}</p>
            <div class="node-progress-badge">${progress.lessonsCompleted}/${totalLessons} lessons</div>
          </div>
        </div>
      `;
    })
    .join("");

  const referenceLinkHTML =
    subjectId === "science"
      ? `
        <button class="background-lesson-card" data-reference="background">
          <span class="background-lesson-icon">📚</span>
          <span class="background-lesson-text">
            <strong>ACT Science Background Knowledge</strong>
            <span>All 18 core science concepts, plus the calculator-free math, in one reference lesson.</span>
          </span>
          <span class="background-lesson-arrow">&rarr;</span>
        </button>
      `
      : subjectId === "english" || subjectId === "reading"
      ? `
        <button class="background-lesson-card" data-reference="vocabulary">
          <span class="background-lesson-icon">🔤</span>
          <span class="background-lesson-text">
            <strong>ACT Vocabulary Builder</strong>
            <span>Words that keep showing up in ACT Reading passages and English answer choices.</span>
          </span>
          <span class="background-lesson-arrow">&rarr;</span>
        </button>
      `
      : "";

  // A unique, subject-themed monster guards the bottom of the path — locked
  // (silhouette) until every skill above it is mastered, in full color once
  // the fight is available, and crowned once it's been cleared.
  const boss = getBossMonster(subjectId);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";
  const bossEncounterHTML = `
    <div class="boss-encounter ${bossStateClass}" style="--island-color:${subject.color}">
      <div class="boss-encounter-monster">
        ${monsterSVG(boss.avatar, { size: 130 })}
        ${bossCleared ? `<span class="boss-encounter-crown">👑</span>` : ""}
      </div>
      <div class="boss-encounter-info">
        <h3>${allMastered ? "" : "🔒 "}${boss.name}</h3>
        <p class="boss-encounter-subtitle">${subject.name} Boss Quiz${bossCleared ? " — Cleared!" : ""}</p>
        <p class="boss-encounter-blurb">${
          allMastered
            ? "20 mixed questions from everything on this island. Clear it for a big one-time bonus."
            : `Master all ${subject.skills.length} skills on this island to unlock.`
        }</p>
        ${allMastered ? `<button class="btn-primary" data-boss>Challenge the Boss &rarr;</button>` : ""}
      </div>
    </div>
  `;

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="island-heading-blurb">${subject.blurb}</p>
      ${referenceLinkHTML}
      <div class="map-path-container" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: subject.color })}
        <div class="path-decorations">${renderDecorations(totalHeight, subjectId.length)}</div>
        ${nodes}
      </div>
      ${bossEncounterHTML}
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
  root.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => navigate("skillPath", { skillId: btn.dataset.skill, subjectId }));
  });
  const referenceBtn = root.querySelector("[data-reference]");
  if (referenceBtn) {
    referenceBtn.addEventListener("click", () => navigate(referenceBtn.dataset.reference, { subjectId }));
  }
  const bossBtn = root.querySelector("[data-boss]");
  if (bossBtn) {
    bossBtn.addEventListener("click", () => navigate("bossQuiz", { subjectId }));
  }
}
