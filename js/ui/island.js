// A planet's own island-picker: each skill within this subject is an
// island (see worldMap.js's header comment for the full solar
// system > planet > island hierarchy). Clicking an island hands off to
// skillPath.js, which shows that island's own lesson path.
import { getSubject, isSubjectPlayable } from "../data/tests.js";
import { getLessonCount, preloadSubject } from "../data/questions/index.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations, glowVars } from "./pathTrail.js";
import { getSubjectTheme } from "./subjectTheme.js";
import { renderEnglishHubIsland } from "./islandHubArt.js";

const ROW_HEIGHT = 148;

export function renderIsland(root, navigate, { subjectId }) {
  // Fire-and-forget: the player will very likely start a lesson (or the
  // boss fight) on this island soon, so give that subject's question data
  // a head start loading in the background while they read the skill
  // list — by the time they actually click into a lesson it's usually
  // already cached, and getLessonCount below doesn't need it either way.
  preloadSubject(subjectId);

  const subject = getSubject(subjectId);
  const hasSkillTree = subject.skills.length > 0;
  // A subject can have a real skill tree planned out before it has real
  // lesson/question content behind it (see isSubjectPlayable in
  // data/tests.js) — `playable` gates anything that would otherwise assume
  // real content exists: clicking into a lesson, the boss encounter (no
  // BOSS_MONSTERS entry for a subject with no content yet), and lesson
  // counts (getLessonCount falls back to a meaningless "1" for a skill id
  // data/questions/index.js has never heard of).
  const playable = isSubjectPlayable(subject);
  const positions = pathPositions(subject.skills.length, { rowHeight: ROW_HEIGHT });
  const totalHeight = pathHeight(subject.skills.length, ROW_HEIGHT);
  const allMastered = playable && subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = playable && gameState.isBossCleared(subjectId);

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
      const totalLessons = playable ? getLessonCount(skill.id) : null;
      const stateClass = !playable ? "is-locked" : progress.mastered ? "is-mastered" : "is-open";
      const isCurrent = playable && i === currentIndex;
      const badge = !playable ? "🚧" : progress.mastered ? "✓" : String(i + 1);
      return `
        <div class="path-node-wrap" style="left:${x}%;top:${y}px;">
          ${isCurrent ? `<div class="path-mascot">${monsterSVG(gameState.getDisplayAvatar(), { size: 59 })}</div>` : ""}
          <div class="node-anchor">
            <span class="node-area-blob node-area-blob-md map-blob-shape-${(i % 4) + 1}" style="--blob-color:${subject.bg}"></span>
            <button class="node-circle ${stateClass}" data-skill="${skill.id}" ${playable ? "" : "disabled"}
              aria-label="${skill.name} island${playable ? `: ${progress.mastered ? "mastered" : `${progress.lessonsCompleted} of ${totalLessons} lessons complete`}` : ", lessons not written yet"}"
              style="--node-color:${subject.color}">
              ${badge}
            </button>
          </div>
          <div class="node-label">
            <h4>${skill.name}</h4>
            <p>${skill.blurb}</p>
            ${playable ? `<div class="node-progress-badge">${progress.lessonsCompleted}/${totalLessons} lessons</div>` : `<div class="node-progress-badge">Coming soon</div>`}
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
  // the fight is available, and crowned once it's been cleared. Only real
  // for subjects with actual skills — a still-empty subject has no
  // BOSS_MONSTERS entry to render at all.
  let bossEncounterHTML = "";
  if (playable) {
    const boss = getBossMonster(subjectId, gameState.level);
    const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";
    bossEncounterHTML = `
      <div class="boss-encounter ${bossStateClass}" style="--island-color:${subject.color}">
        <div class="boss-encounter-monster">
          ${monsterSVG(boss.avatar, { size: 160 })}
          ${bossCleared ? `<span class="boss-encounter-crown">👑</span>` : ""}
        </div>
        <div class="boss-encounter-info">
          <h3>${allMastered ? "" : "🔒 "}${boss.name}</h3>
          <p class="boss-encounter-subtitle">${subject.name} Boss Quiz${bossCleared ? " (Cleared!)" : ""}</p>
          <p class="boss-encounter-blurb">${
            allMastered
              ? "20 mixed questions from every island on this planet. Clear it for a big one-time bonus."
              : `Master all ${subject.skills.length} islands on this planet to unlock.`
          }</p>
          ${allMastered ? `<button class="btn-primary" data-boss>Challenge the Boss &rarr;</button>` : ""}
        </div>
      </div>
    `;
  }

  const comingSoonHTML = playable
    ? ""
    : hasSkillTree
    ? `
      <div class="island-coming-soon">
        <span class="island-coming-soon-icon">🚧</span>
        <h3>${subject.name}'s islands are planned — lessons aren't written yet</h3>
        <p>The ${subject.skills.length} islands below are the real plan for this planet; none of them have lessons to play yet.</p>
      </div>
    `
    : `
      <div class="island-coming-soon">
        <span class="island-coming-soon-icon">🚧</span>
        <h3>Lessons for ${subject.name} are still being built</h3>
        <p>This planet's islands haven't been written yet — check back once it has real content.</p>
      </div>
    `;

  const theme = getSubjectTheme(subjectId);
  // English is this planet's "hub" island — see islandHubArt.js's own
  // header comment for the full brief this was built from. It gets a
  // bespoke illustrated landmark instead of the generic topic-* pattern
  // background every other island still uses, floating on the same calm
  // ocean the World Map already established for ACT (.ocean-scene) rather
  // than the leafy topic-forest tint, since the design brief specifically
  // wants this island's own warm palette to stand out *against* the
  // surrounding water/sky.
  const isHubIsland = subjectId === "english";
  const sceneClass = isHubIsland ? "ocean-scene" : `topic-${theme.kind}`;
  const decorations = isHubIsland ? ["〰️", "〰️"] : theme.decorations;

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen ${sceneClass}" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="island-heading-blurb">${subject.blurb}</p>
      <p class="map-subtitle">🏝️ Choose an Island to Explore</p>
      ${isHubIsland ? renderEnglishHubIsland() : ""}
      ${referenceLinkHTML}
      ${comingSoonHTML}
      <div class="map-path-container" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: subject.color })}
        <div class="path-decorations">${renderDecorations(totalHeight, subjectId.length, decorations)}</div>
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
