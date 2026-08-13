// Test-date countdown + an honest, transparent daily study plan: how many
// of the remaining unmastered skills you'd need to clear per day to finish
// them all before test day, plus today's recommended focus (weakest
// skills first). Deliberately not a "guaranteed path to your target
// score" — score gains depend on far more than skill count, so the plan
// only promises what it can actually compute from real save data.
import { allSkillIds, getSkill } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function renderStudyPlan(root, navigate) {
  function render() {
    const { testDate, targetScore } = gameState.getStudyPlanSettings();
    const daysUntilTest = gameState.getDaysUntilTest();
    const predicted = gameState.getPredictedScore();

    const unmastered = allSkillIds()
      .filter((id) => !gameState.isMastered(id))
      .map((id) => {
        const p = gameState.getSkillProgress(id);
        const accuracy = p.attempts > 0 ? p.correct / p.attempts : null;
        return { id, accuracy };
      })
      .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

    const skillsPerDay = testDate && daysUntilTest > 0 ? Math.ceil(unmastered.length / daysUntilTest) : null;
    const todaysFocus = unmastered.slice(0, 5);

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen dashboard-screen">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <h1>📅 Study Plan</h1>

        <div class="dash-predictor-card">
          <div class="dash-predictor-score">${testDate ? (daysUntilTest === 0 ? "🎉" : daysUntilTest) : "—"}</div>
          <div class="dash-predictor-info">
            <strong>${testDate ? (daysUntilTest === 0 ? "Test day is today — good luck!" : `${daysUntilTest} day${daysUntilTest === 1 ? "" : "s"} until your test`) : "No test date set"}</strong>
            <p class="dash-monster-substat">${testDate ? formatDate(testDate) : "Set a test date below to see a personalized daily plan."}</p>
          </div>
        </div>

        <div class="dash-history-card">
          <h3 class="dash-history-title">⚙️ Test Details</h3>
          <form id="planForm" class="study-plan-form">
            <label class="study-plan-field">
              <span>Test date</span>
              <input type="date" id="testDateInput" value="${testDate || ""}" />
            </label>
            <label class="study-plan-field">
              <span>Target composite score (1–36)</span>
              <input type="number" id="targetScoreInput" min="1" max="36" value="${targetScore ?? ""}" />
            </label>
            <button type="submit" class="btn-primary">Save</button>
          </form>
        </div>

        ${
          testDate
            ? `
              <div class="dash-history-card">
                <h3 class="dash-history-title">📊 The Plan</h3>
                <p class="lesson-paragraph">${unmastered.length} of ${allSkillIds().length} skills still unmastered. At ${daysUntilTest > 0 ? `${daysUntilTest} day${daysUntilTest === 1 ? "" : "s"} left` : "your test today"}, that's about <strong>${skillsPerDay ?? "—"} skill${skillsPerDay === 1 ? "" : "s"} a day</strong> to master everything before test day.</p>
                ${
                  targetScore && predicted.score !== null
                    ? `<p class="lesson-paragraph">Your predicted score is <strong>${predicted.score}</strong>, and you're aiming for <strong>${targetScore}</strong>${
                        predicted.score >= targetScore
                          ? " — you're already there! Keep practicing to hold steady."
                          : ` — a ${targetScore - predicted.score}-point gap. Finishing more skills helps, but consistent full-length practice tests are the best way to actually move this number.`
                      }</p>`
                    : ""
                }
              </div>
              <div class="dash-history-card">
                <h3 class="dash-history-title">🎯 Today's Focus</h3>
                ${
                  todaysFocus.length === 0
                    ? `<p class="lesson-paragraph">Every skill is mastered — nice work! Keep sharp with the Review Queue or a Practice Test.</p>`
                    : `<div class="drill-skill-list">${todaysFocus
                        .map((s) => {
                          const { subject, skill } = getSkill(s.id);
                          return `
                            <button class="drill-skill-row" data-focus-skill="${s.id}" data-subject-id="${subject.id}" type="button">
                              <span class="drill-skill-name">${subject.icon} ${skill.name}</span>
                              <span class="drill-skill-meta">${s.accuracy === null ? "Not started" : `${Math.round(s.accuracy * 100)}%`}</span>
                            </button>
                          `;
                        })
                        .join("")}</div>`
                }
              </div>
            `
            : ""
        }
      </main>
    `;

    wireHud(root, navigate);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
    root.querySelector("#planForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const newDate = root.querySelector("#testDateInput").value || null;
      const rawScore = root.querySelector("#targetScoreInput").value;
      const newScore = rawScore ? Math.max(1, Math.min(36, Math.round(Number(rawScore)))) : null;
      gameState.setStudyPlanSettings({ testDate: newDate, targetScore: newScore });
      render();
    });
    root.querySelectorAll("[data-focus-skill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate("skillPath", { skillId: btn.dataset.focusSkill, subjectId: btn.dataset.subjectId });
      });
    });
  }

  render();
}
