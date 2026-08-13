import { getSubject, SUBJECTS } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderPacingTag } from "./pacingFeedback.js";

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

function masteryHeatmapHTML() {
  const rows = SUBJECTS.map((subject) => {
    const cells = subject.skills
      .map((skill) => {
        const p = gameState.getSkillProgress(skill.id);
        const started = p.attempts > 0;
        const cls = p.mastered ? "is-mastered" : started ? "is-started" : "is-untouched";
        const detail = p.mastered ? "mastered" : started ? `${Math.round((p.correct / p.attempts) * 100)}% accuracy` : "not started";
        return `<span class="heatmap-cell ${cls}" style="--cell-color:${subject.color}" data-tip="${skill.name} — ${detail}" aria-label="${skill.name}: ${detail}"></span>`;
      })
      .join("");
    return `
      <div class="heatmap-row">
        <span class="heatmap-row-label">${subject.icon} ${subject.name}</span>
        <div class="heatmap-cells">${cells}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="dash-heatmap-card">
      <h3 class="dash-history-title">🗺️ Skill Mastery Map</h3>
      <div class="heatmap-grid">${rows}</div>
      <div class="heatmap-legend">
        <span><span class="heatmap-cell is-untouched"></span> Not started</span>
        <span><span class="heatmap-cell is-started" style="--cell-color:var(--purple)"></span> In progress</span>
        <span><span class="heatmap-cell is-mastered" style="--cell-color:var(--purple)"></span> Mastered</span>
      </div>
    </div>
  `;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function streakCalendarHTML() {
  const streak = gameState.getStreak();

  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak.best);
  const milestoneText =
    streak.current > 0
      ? nextMilestone
        ? `${nextMilestone - streak.current} more day${nextMilestone - streak.current === 1 ? "" : "s"} to a ${nextMilestone}-day streak`
        : "Longest streak yet — keep it going!"
      : streak.best > 0
      ? `Your best is ${streak.best} day${streak.best === 1 ? "" : "s"} — study today to start a new one`
      : "Complete a lesson today to start your streak";

  return `
    <div class="dash-streak-card">
      <div class="dash-streak-header">
        <div class="dash-streak-count">
          <span class="streak-flame ${streak.current > 0 ? "is-lit" : ""}">🔥</span>
          <span class="tile-num">${streak.current}</span>
          <span class="dash-streak-label">day streak</span>
        </div>
        <div class="dash-monster-substat">Best: ${streak.best} day${streak.best === 1 ? "" : "s"}</div>
      </div>
      <p class="streak-milestone">${milestoneText}</p>
    </div>
  `;
}

function achievementsPreviewHTML() {
  const achievements = gameState.getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;
  return `
    <div class="dash-predictor-card">
      <div class="dash-predictor-score">${unlockedCount}</div>
      <div class="dash-predictor-info">
        <strong>Achievements</strong>
        <p class="dash-monster-substat">${unlockedCount} of ${achievements.length} badges unlocked.</p>
      </div>
      <button class="btn-secondary" data-achievements>🏅 View All</button>
    </div>
  `;
}

function studyPlanCardHTML() {
  const days = gameState.getDaysUntilTest();
  const { testDate } = gameState.getStudyPlanSettings();
  return `
    <div class="dash-predictor-card">
      <div class="dash-predictor-score">${days === null ? "—" : days}</div>
      <div class="dash-predictor-info">
        <strong>${days === null ? "Study Plan" : days === 0 ? "Test day is today!" : "Days Until Test"}</strong>
        <p class="dash-monster-substat">${testDate ? `Test date: ${testDate}` : "Set a test date for a personalized daily study plan."}</p>
      </div>
      <button class="btn-secondary" data-study-plan>📅 ${testDate ? "View Plan" : "Set Up"}</button>
    </div>
  `;
}

// A single styled tooltip element, positioned near the cursor on hover —
// the native `title` attribute works but is slow to appear and unstyled,
// so heatmap cells use `data-tip` instead and this wires the hover/move/
// leave behavior. Appended inside `root` (not document.body) so it's torn
// down for free on the next navigate()'s innerHTML rebuild rather than
// needing its own cleanup path.
function wireHeatmapTooltip(root) {
  const cells = root.querySelectorAll(".heatmap-cell[data-tip]");
  if (cells.length === 0) return;
  const tooltip = document.createElement("div");
  tooltip.className = "heatmap-tooltip";
  root.appendChild(tooltip);
  cells.forEach((cell) => {
    cell.addEventListener("mouseenter", () => {
      tooltip.textContent = cell.dataset.tip;
      tooltip.classList.add("is-visible");
    });
    cell.addEventListener("mousemove", (e) => {
      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${e.clientY}px`;
    });
    cell.addEventListener("mouseleave", () => {
      tooltip.classList.remove("is-visible");
    });
  });
}

function pacingCardHTML() {
  const tags = SUBJECTS.map((subject) => {
    const pacing = gameState.getPacingStats(subject.id);
    if (!pacing) return "";
    return `<div class="pacing-row"><span class="pacing-row-label">${subject.icon} ${subject.name}</span>${renderPacingTag(pacing)}</div>`;
  })
    .filter(Boolean)
    .join("");
  if (!tags) return "";
  return `
    <div class="dash-history-card">
      <h3 class="dash-history-title">⏱️ Pacing</h3>
      ${tags}
    </div>
  `;
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
      ${streakCalendarHTML()}
      ${achievementsPreviewHTML()}
      ${studyPlanCardHTML()}
      ${pacingCardHTML()}
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
      ${masteryHeatmapHTML()}
      <div class="dash-history-card">
        <h3 class="dash-history-title">💾 Backup &amp; Transfer</h3>
        <p class="lesson-paragraph">Your progress lives only in this browser. Download a backup now and then, or restore one to carry progress to a new device.</p>
        <div class="results-actions">
          <button class="btn-secondary" data-export-save>⬇️ Export Save</button>
          <button class="btn-secondary" data-import-save>⬆️ Import Save</button>
          <input type="file" id="importSaveInput" accept="application/json" hidden />
        </div>
        <p class="backup-status" id="backupStatus" hidden></p>
      </div>
      <button class="btn-danger-quiet" data-reset>Reset All Progress</button>
    </main>
  `;

  wireHud(root, navigate);
  wireHeatmapTooltip(root);
  root.querySelector("[data-practice-test]").addEventListener("click", () => navigate("practiceTest"));
  root.querySelector("[data-achievements]").addEventListener("click", () => navigate("achievements"));
  root.querySelector("[data-study-plan]").addEventListener("click", () => navigate("studyPlan"));
  root.querySelector("[data-export-save]").addEventListener("click", () => {
    const json = gameState.exportSave();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acto-act-quest-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  const importInput = root.querySelector("#importSaveInput");
  // Confirm only after a file is actually picked, not before — asking
  // "continue?" before the browser's own file picker even opens means two
  // blocking native dialogs back to back for no reason, and confirming a
  // destructive action before the player has chosen anything to import is
  // premature anyway.
  root.querySelector("[data-import-save]").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => {
    const file = importInput.files[0];
    importInput.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!confirm(`Import "${file.name}"? This replaces ALL current progress in this browser.`)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = gameState.importSave(String(reader.result));
      const status = root.querySelector("#backupStatus");
      status.hidden = false;
      if (result.ok) {
        status.className = "backup-status is-success";
        status.textContent = "Save imported! Reloading your progress…";
        setTimeout(() => navigate("dashboard"), 900);
      } else {
        status.className = "backup-status is-error";
        status.textContent = result.error;
      }
    };
    reader.readAsText(file);
  });
  root.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
      gameState.reset();
      navigate("avatarCreator", { onboarding: true });
    }
  });
}
