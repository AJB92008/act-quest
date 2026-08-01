import { SUBJECTS } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

export function renderWorldMap(root, navigate) {
  const cards = SUBJECTS.map((subject) => {
    const stats = gameState.getSubjectStats(subject.id);
    const pct = Math.round((stats.masteredCount / stats.totalSkills) * 100);
    return `
      <button class="island-card" data-subject="${subject.id}" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="island-icon">${subject.icon}</div>
        <div class="island-info">
          <h3>${subject.name}</h3>
          <p class="island-place">${subject.place}</p>
          <p class="island-blurb">${subject.blurb}</p>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <p class="island-progress">${stats.masteredCount} / ${stats.totalSkills} skills mastered</p>
        </div>
      </button>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen map-screen">
      <h1 class="map-title">Choose an Island to Explore</h1>
      <p class="map-subtitle">Acto is ready to study. Pick a subject to begin the path.</p>
      <div class="island-grid">${cards}</div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelectorAll("[data-subject]").forEach((card) => {
    card.addEventListener("click", () => navigate("island", { subjectId: card.dataset.subject }));
  });
}
