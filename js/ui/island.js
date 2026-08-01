import { getSubject } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

function starRating(bestScore) {
  if (bestScore >= 0.95) return 3;
  if (bestScore >= 0.7) return 2;
  if (bestScore > 0) return 1;
  return 0;
}

export function renderIsland(root, navigate, { subjectId }) {
  const subject = getSubject(subjectId);

  const nodes = subject.skills
    .map((skill, i) => {
      const progress = gameState.getSkillProgress(skill.id);
      const stars = starRating(progress.bestScore);
      const stateClass = progress.mastered ? "is-mastered" : "is-open";
      const side = i % 2 === 0 ? "left" : "right";
      return `
        <div class="path-node ${side}">
          <button class="node-circle ${stateClass}" data-skill="${skill.id}"
            style="--node-color:${subject.color}">
            ${progress.mastered ? "✓" : i + 1}
          </button>
          <div class="node-label">
            <h4>${skill.name}</h4>
            <p>${skill.blurb}</p>
            <div class="node-stars">${[1, 2, 3].map((n) => (n <= stars ? "⭐" : "☆")).join("")}</div>
          </div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="island-heading-blurb">${subject.blurb}</p>
      <div class="path-container">${nodes}</div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
  root.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => navigate("quiz", { skillId: btn.dataset.skill, subjectId }));
  });
}
