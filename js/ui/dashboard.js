import { getSubject } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

// A pure-SVG sparkline (no charting library) plotting composite score (1-36,
// a fixed y-domain so the line's shape is comparable across sessions rather
// than auto-scaling to whatever range this particular run of attempts hit)
// against attempt order. preserveAspectRatio="none" lets it stretch to fill
// whatever width the CSS gives it without recomputing point coordinates.
function scoreHistoryChart(history) {
  if (history.length < 2) return "";
  const w = 300;
  const h = 70;
  const pad = 6;
  const xFor = (i) => pad + (i / (history.length - 1)) * (w - pad * 2);
  const yFor = (score) => h - pad - ((score - 1) / 35) * (h - pad * 2);
  const points = history.map((r, i) => `${xFor(i)},${yFor(r.composite)}`).join(" ");
  const dots = history
    .map((r, i) => `<circle cx="${xFor(i)}" cy="${yFor(r.composite)}" r="3" fill="var(--purple)"/>`)
    .join("");
  return `
    <svg viewBox="0 0 ${w} ${h}" class="score-history-chart" preserveAspectRatio="none" role="img" aria-label="Composite score trend across your last ${history.length} practice tests">
      <polyline points="${points}" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>
  `;
}

function formatHistoryDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function renderDashboard(root, navigate) {
  const overall = gameState.getOverallStats();
  const levelProgress = gameState.getLevelProgress();
  const evolutionStageName = gameState.getEvolutionStageName();
  const masteryPct = Math.round(gameState.getMasteryPct() * 100);
  const predicted = gameState.getPredictedScore();
  const history = gameState.getPracticeTestHistory();

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
      ${
        history.length > 0
          ? `
            <div class="dash-history-card">
              <h3 class="dash-history-title">📈 Score History</h3>
              ${
                history.length > 1
                  ? scoreHistoryChart(history)
                  : `<p class="dash-monster-substat">Take one more practice test to start seeing a trend line here.</p>`
              }
              <ul class="dash-history-list">
                ${history
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map(
                    (r) => `
                      <li class="dash-history-row">
                        <span class="dash-history-date">${formatHistoryDate(r.date)}</span>
                        <span class="dash-history-composite">${r.composite}</span>
                        <span class="dash-history-sections">${r.sectionResults
                          .map((s) => `${getSubject(s.subjectId).icon} ${s.subscore}`)
                          .join(" &nbsp; ")}</span>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </div>
          `
          : ""
      }
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
