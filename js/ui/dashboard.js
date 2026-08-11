import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

export function renderDashboard(root, navigate) {
  const overall = gameState.getOverallStats();
  const levelProgress = gameState.getLevelProgress();
  const evolutionStageName = gameState.getEvolutionStageName();
  const masteryPct = Math.round(gameState.getMasteryPct() * 100);

  const rows = overall.subjectStats
    .map(({ subject, accuracy, masteredCount, totalSkills }) => {
      const masteredPct = totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0;
      const accuracyPct = accuracy === null ? 0 : Math.round(accuracy * 100);
      return `
        <div class="dash-row">
          <div class="dash-row-label">
            <span>${subject.icon} ${subject.name}</span>
            <span>${masteredCount}/${totalSkills} mastered</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${masteredPct}%;background:${subject.color}"></div></div>
          <div class="dash-row-accuracy">${accuracy === null ? "No attempts yet" : `${accuracyPct}% accuracy`}</div>
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    ${hudHTML("dashboard")}
    <main class="screen dashboard-screen">
      <h1>📊 Your Progress</h1>
      <div class="dash-summary">
        <div class="dash-summary-tile"><span class="tile-num">${overall.masteredCount}</span><span>Skills Mastered</span></div>
        <div class="dash-summary-tile"><span class="tile-num">${overall.totalStars}</span><span>Total Stars</span></div>
        <div class="dash-summary-tile"><span class="tile-num">${overall.coins}</span><span>Coins</span></div>
      </div>
      <div class="dash-monster-card">
        <div class="dash-monster-preview">${monsterSVG(gameState.getDisplayAvatar(), { size: 70 })}</div>
        <div class="dash-monster-info">
          <div class="dash-monster-row">
            <strong>Level ${levelProgress.level}</strong>
            <span class="dash-monster-substat">${Math.round(levelProgress.pct * 100)}% to Level ${levelProgress.level + 1}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(levelProgress.pct * 100)}%;background:var(--purple)"></div></div>
          <div class="dash-monster-row">
            <strong>${evolutionStageName} form</strong>
            <span class="dash-monster-substat">${masteryPct}% overall mastery</span>
          </div>
        </div>
      </div>
      <div class="dash-rows">${rows}</div>
      <button class="btn-danger-quiet" data-reset>Reset All Progress</button>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
      gameState.reset();
      navigate("avatarCreator", { onboarding: true });
    }
  });
}
