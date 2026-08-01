import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

export function renderDashboard(root, navigate) {
  const overall = gameState.getOverallStats();

  const rows = overall.subjectStats
    .map(({ subject, accuracy, masteredCount, totalSkills }) => {
      const pct = accuracy === null ? 0 : Math.round(accuracy * 100);
      return `
        <div class="dash-row">
          <div class="dash-row-label">
            <span>${subject.icon} ${subject.name}</span>
            <span>${masteredCount}/${totalSkills} mastered</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${subject.color}"></div></div>
          <div class="dash-row-accuracy">${accuracy === null ? "No attempts yet" : `${pct}% accuracy`}</div>
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
