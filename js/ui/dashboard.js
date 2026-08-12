import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

export function renderDashboard(root, navigate) {
  const overall = gameState.getOverallStats();
  const levelProgress = gameState.getLevelProgress();
  const evolutionStageName = gameState.getEvolutionStageName();
  const masteryPct = Math.round(gameState.getMasteryPct() * 100);
  const predicted = gameState.getPredictedScore();

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
          <div class="progress-bar" role="progressbar" aria-valuenow="${masteredPct}" aria-valuemin="0" aria-valuemax="100" aria-label="${subject.name} skills mastered"><div class="progress-fill" style="width:${masteredPct}%;background:${subject.color}"></div></div>
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
        <div class="dash-monster-preview">${monsterSVG(gameState.getDisplayAvatar(), { size: 86 })}</div>
        <div class="dash-monster-info">
          <div class="dash-monster-headline">Level ${levelProgress.level} · ${evolutionStageName} · ${masteryPct}% mastery</div>
          <p class="dash-monster-substat dash-monster-caption">Size grows with level, look evolves with mastery — two separate tracks.</p>
          <div class="dash-monster-row">
            <span class="dash-monster-substat">${Math.round(levelProgress.pct * 100)}% to Level ${levelProgress.level + 1}</span>
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(levelProgress.pct * 100)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to level ${levelProgress.level + 1}"><div class="progress-fill" style="width:${Math.round(levelProgress.pct * 100)}%;background:var(--purple)"></div></div>
        </div>
      </div>
      <div class="dash-predictor-card">
        <div class="dash-predictor-score">${predicted.score === null ? "?" : predicted.score}</div>
        <div class="dash-predictor-info">
          <strong>Predicted ACT Score</strong>
          <p class="dash-monster-substat">${
            predicted.score === null
              ? "Answer more questions in your lessons to see a rough estimate here."
              : predicted.source === "practiceTest"
              ? "Based on your most recent full-length practice test."
              : "A rough estimate from your lesson accuracy — take a full-length practice test for a stronger read."
          }</p>
        </div>
        <button class="btn-secondary" data-practice-test>📝 Practice Test</button>
      </div>
      <div class="dash-rows">${rows}</div>
      <button class="btn-danger-quiet" data-reset>Reset All Progress</button>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-practice-test]").addEventListener("click", () => navigate("practiceTest"));
  root.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
      gameState.reset();
      navigate("avatarCreator", { onboarding: true });
    }
  });
}
