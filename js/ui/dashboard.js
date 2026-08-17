import { getSubject, SUBJECTS } from "../data/skills.js";
import { TESTS, TEST_IDS, getTestSubjects, isTestReady, isSubjectPlayable } from "../data/tests.js";
import { gameState, percentileForComposite } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderPacingTag } from "./pacingFeedback.js";
import { getCloudStatus, onCloudSyncChange, signUp, signIn, signOutCloud, resolveConflict, retryCloudInit } from "../cloudSync.js";

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

function masteryHeatmapHTML(subjects) {
  const rows = subjects.map((subject) => {
    if (!isSubjectPlayable(subject)) {
      return `
        <div class="heatmap-row">
          <span class="heatmap-row-label">${subject.icon} ${subject.name}</span>
          <span class="dash-monster-substat">Coming soon</span>
        </div>
      `;
    }
    const cells = subject.skills
      .map((skill) => {
        const p = gameState.getSkillProgress(skill.id);
        const started = p.attempts > 0;
        const cls = p.mastered ? "is-mastered" : started ? "is-started" : "is-untouched";
        const detail = p.mastered ? "mastered" : started ? `${Math.round((p.correct / p.attempts) * 100)}% accuracy` : "not started";
        return `<span class="heatmap-cell ${cls}" style="--cell-color:${subject.color}" data-tip="${skill.name}: ${detail}" aria-label="${skill.name}: ${detail}"></span>`;
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

// Pill tabs for switching which planet's subject breakdown the rows/heatmap
// below show — reuses avatarCreator.js's generic .avatar-tab-btn styling
// rather than a new tab component, since it's the same "pick one of a few
// named options" shape. State Assessments is included like any other
// planet; its subjects just have empty skill arrays (see data/tests.js),
// which subjectRowsHTML/masteryHeatmapHTML already render as "Coming soon"
// via isSubjectPlayable, so no special-casing is needed here.
function testTabsHTML(activeTestId) {
  const tabs = TESTS.map(
    (t) => `
      <button class="avatar-tab-btn ${t.id === activeTestId ? "is-active" : ""}" data-test-tab="${t.id}" aria-pressed="${t.id === activeTestId}">
        <span class="avatar-tab-icon">${t.icon}</span>${t.name}
      </button>
    `
  ).join("");
  return `<div class="avatar-tabs" role="tablist" aria-label="Choose a test">${tabs}</div>`;
}

// A compact version of the top-of-screen "Predicted ACT Score" card, scoped
// to whichever planet's tab is active. No action buttons here (Practice
// Test/Writing/Score Report are ACT-only features — see practiceTest.js's
// header comment) — just the number and its source, mirroring
// getPredictedScore(testId)'s own fallback chain. Percentile is ACT-only
// too: COMPOSITE_PERCENTILES is built against the 1-36 scale, so it isn't
// meaningful for SAT/PSAT's much larger score ranges.
function predictedScoreCardHTML(testId, test) {
  const predicted = gameState.getPredictedScore(testId);
  const isWide = predicted.score !== null && String(predicted.score).length > 2;
  return `
    <div class="dash-predictor-card dash-predictor-card--compact">
      <div class="dash-predictor-score ${isWide ? "is-wide" : ""}">${predicted.score === null ? "?" : predicted.score}</div>
      <div class="dash-predictor-info">
        <strong>Predicted ${test.name} Score</strong>
        <p class="dash-monster-substat">${
          predicted.score === null
            ? `Answer more ${test.name} lesson questions to see a rough estimate here.`
            : predicted.source === "practiceTest"
            ? "Based on your most recent full-length practice test."
            : "A rough estimate from your lesson accuracy on this planet."
        }</p>
        ${
          predicted.score !== null && testId === "act"
            ? `<p class="dash-monster-substat">Approximately the ${percentileForComposite(predicted.score)}th percentile nationally.</p>`
            : ""
        }
      </div>
    </div>
  `;
}

function subjectRowsHTML(subjectStats) {
  return subjectStats
    .map(({ subject, accuracy, masteredCount, totalSkills }) => {
      if (!isSubjectPlayable(subject)) {
        return `
          <div class="dash-row dash-row-empty">
            <div class="dash-row-label">
              <span>${subject.icon} ${subject.name}</span>
              <span>Coming soon</span>
            </div>
            <p class="dash-monster-substat">${subject.blurb || "Content for this subject hasn't been built yet."}</p>
          </div>
        `;
      }
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
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function streakCalendarHTML() {
  const streak = gameState.getStreak();

  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak.best);
  const milestoneText =
    streak.current > 0
      ? nextMilestone
        ? `${nextMilestone - streak.current} more day${nextMilestone - streak.current === 1 ? "" : "s"} to a ${nextMilestone}-day streak`
        : "Longest streak yet. Keep it going!"
      : streak.best > 0
      ? `Your best is ${streak.best} day${streak.best === 1 ? "" : "s"}. Study today to start a new one`
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
      <div class="dash-predictor-score">${days === null ? "?" : days}</div>
      <div class="dash-predictor-info">
        <strong>${days === null ? "Study Plan" : days === 0 ? "Test day is today!" : "Days Until Test"}</strong>
        <p class="dash-monster-substat">${testDate ? `Test date: ${testDate}` : "Set a test date for a personalized daily study plan."}</p>
      </div>
      <button class="btn-secondary" data-study-plan>📅 ${testDate ? "View Plan" : "Set Up"}</button>
    </div>
  `;
}

function mistakeJournalPreviewHTML() {
  const count = gameState.mistakeJournalCount();
  return `
    <div class="dash-predictor-card">
      <div class="dash-predictor-score">${count}</div>
      <div class="dash-predictor-info">
        <strong>Mistake Journal</strong>
        <p class="dash-monster-substat">${count === 0 ? "No missed questions logged yet." : `${count} missed question${count === 1 ? "" : "s"} logged across your whole history, searchable by skill or text.`}</p>
      </div>
      <button class="btn-secondary" data-mistake-journal>📓 View All</button>
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

function cloudErrorMessage(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return `That email already has an account. Try "I Already Have One" instead.`;
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("weak-password")) return "Password is too weak. Use at least 6 characters.";
  if (code.includes("invalid-email")) return "That doesn't look like a valid email address.";
  return "Something went wrong. Please try again.";
}

function cloudCardInnerHTML() {
  const status = getCloudStatus();
  if (!status.ready) {
    if (status.initError) {
      return `
        <h3 class="dash-history-title">☁️ Cloud Account</h3>
        <p class="lesson-paragraph">Couldn't reach cloud sync. Your progress still saves normally on this device.</p>
        <p class="backup-status is-error">${status.initError.message || "Connection failed."}</p>
        <button class="btn-secondary" data-cloud-retry>Try Again</button>
      `;
    }
    return `<h3 class="dash-history-title">☁️ Cloud Account</h3><p class="lesson-paragraph">Connecting…</p>`;
  }
  if (status.conflict) {
    const date = new Date(status.conflict.remoteUpdatedAt).toLocaleString();
    return `
      <h3 class="dash-history-title">☁️ Cloud Account</h3>
      <p class="lesson-paragraph">Found saved progress in the cloud from <strong>${date}</strong> that's different from what's on this device.</p>
      <div class="results-actions">
        <button class="btn-secondary" data-cloud-use-remote>⬇️ Load Cloud Progress</button>
        <button class="btn-secondary" data-cloud-keep-local>💾 Keep This Device's Progress</button>
      </div>
      <p class="backup-status is-error">Choosing one replaces the other. There's no automatic merge.</p>
    `;
  }
  if (status.signedIn) {
    return `
      <h3 class="dash-history-title">☁️ Cloud Account</h3>
      <p class="lesson-paragraph">Signed in as <strong>${status.email}</strong>. Progress syncs automatically. Sign in with the same account on another device to pick up where you left off.</p>
      <button class="btn-secondary" data-cloud-sign-out>Sign Out</button>
    `;
  }
  return `
    <h3 class="dash-history-title">☁️ Cloud Account</h3>
    <p class="lesson-paragraph">Progress is already backing up to the cloud automatically for this browser. Create a free account so you can pick up on another device too.</p>
    <form class="cloud-auth-form" data-cloud-form>
      <label class="visually-hidden" for="cloudEmailInput">Email</label>
      <input type="email" id="cloudEmailInput" name="email" placeholder="Email" required autocomplete="email" />
      <label class="visually-hidden" for="cloudPasswordInput">Password (6+ characters)</label>
      <input type="password" id="cloudPasswordInput" name="password" placeholder="Password (6+ characters)" required minlength="6" autocomplete="new-password" />
      <div class="results-actions">
        <button type="submit" class="btn-secondary" data-cloud-action="signUp">Create Account</button>
        <button type="button" class="btn-secondary" data-cloud-action="signIn">I Already Have One</button>
      </div>
    </form>
    <p class="backup-status" id="cloudAuthStatus" hidden></p>
  `;
}

function wireCloudCardEvents(container) {
  const retryBtn = container.querySelector("[data-cloud-retry]");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => retryCloudInit());
    return;
  }
  const useRemoteBtn = container.querySelector("[data-cloud-use-remote]");
  if (useRemoteBtn) {
    useRemoteBtn.addEventListener("click", () => resolveConflict("useCloud"));
    container.querySelector("[data-cloud-keep-local]").addEventListener("click", () => resolveConflict("keepLocal"));
    return;
  }
  const signOutBtn = container.querySelector("[data-cloud-sign-out]");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      if (confirm("Sign out? This device keeps backing up anonymously, but you'll need to sign in again to reach this account from elsewhere.")) {
        signOutCloud();
      }
    });
    return;
  }
  const form = container.querySelector("[data-cloud-form]");
  if (!form) return;
  const status = container.querySelector("#cloudAuthStatus");
  const runAuth = async (action) => {
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || password.length < 6) {
      status.hidden = false;
      status.className = "backup-status is-error";
      status.textContent = "Enter a valid email and a password of at least 6 characters.";
      return;
    }
    status.hidden = false;
    status.className = "backup-status";
    status.textContent = "Working…";
    try {
      if (action === "signUp") await signUp(email, password);
      else await signIn(email, password);
      // onCloudSyncChange fires once auth settles and re-renders this card.
    } catch (err) {
      status.className = "backup-status is-error";
      status.textContent = cloudErrorMessage(err);
    }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runAuth("signUp");
  });
  container.querySelector('[data-cloud-action="signIn"]').addEventListener("click", () => runAuth("signIn"));
}

// The cloud card's content depends on async auth state that isn't known
// yet at initial render, so it re-renders itself in place whenever that
// state changes rather than being folded into renderDashboard's one-shot
// innerHTML build. Each call to renderDashboard registers a fresh listener
// bound to that render's own container element; once that element is torn
// out by a later navigate() (a plain `root.innerHTML = ...` elsewhere,
// same as every other screen transition in this app), the closure notices
// via isConnected and unsubscribes itself on its next fire instead of
// leaking indefinitely.
function wireCloudCard(root) {
  const container = root.querySelector("[data-cloud-card]");
  if (!container) return;
  const renderCloudCard = () => {
    if (!container.isConnected) {
      unsubscribe();
      return;
    }
    container.innerHTML = cloudCardInnerHTML();
    wireCloudCardEvents(container);
  };
  const unsubscribe = onCloudSyncChange(renderCloudCard);
  renderCloudCard();
}

export function renderDashboard(root, navigate, params = {}) {
  const overall = gameState.getOverallStats();
  const levelProgress = gameState.getLevelProgress();
  const evolutionStageName = gameState.getEvolutionStageName();
  const masteryPct = Math.round(gameState.getMasteryPct() * 100);
  const predicted = gameState.getPredictedScore();
  const history = gameState.getPracticeTestHistory();

  // Which planet's subject breakdown (the rows + heatmap below) is showing
  // right now — a pure view toggle local to this screen, independent of
  // gameState.currentTestId (which is "the planet you're actively
  // studying on" and drives Endless Mode/weak-skill defaults elsewhere).
  // Not persisted: every visit to the dashboard starts back on ACT, same
  // as every other params-driven screen in this app.
  const testId = TEST_IDS.has(params.testId) ? params.testId : "act";
  const test = TESTS.find((t) => t.id === testId);
  const testSubjects = getTestSubjects(testId);
  const testSubjectStats = testSubjects.map((s) => ({ subject: s, ...gameState.getSubjectStats(s.id) }));
  const rows = subjectRowsHTML(testSubjectStats);

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
          <p class="dash-monster-substat dash-monster-caption">Size grows with level, look evolves with mastery: two separate tracks.</p>
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
              : "A rough estimate from your lesson accuracy. Take a full-length practice test for a stronger read."
          }</p>
          ${
            predicted.score !== null
              ? `<p class="dash-monster-substat">Approximately the ${percentileForComposite(predicted.score)}th percentile nationally.</p>`
              : ""
          }
        </div>
        <button class="btn-secondary" data-practice-test>📝 Practice Test</button>
        <button class="btn-secondary" data-essay>✍️ Writing</button>
        <button class="btn-secondary" data-score-report>📄 Score Report</button>
      </div>
      ${streakCalendarHTML()}
      ${achievementsPreviewHTML()}
      ${mistakeJournalPreviewHTML()}
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
      <div class="dash-history-card">
        <h3 class="dash-history-title">📚 Skills by Test</h3>
        ${testTabsHTML(testId)}
        <p class="dash-monster-substat">${test.planetName} — ${test.tagline}${isTestReady(testId) ? "" : " 🚧 This planet's content is still being built."}</p>
        ${isTestReady(testId) ? predictedScoreCardHTML(testId, test) : ""}
        <div class="dash-rows">${rows}</div>
      </div>
      ${masteryHeatmapHTML(testSubjects)}
      <div class="dash-history-card" data-cloud-card></div>
      <button class="btn-danger-quiet" data-reset>Reset All Progress</button>
    </main>
  `;

  wireHud(root, navigate);
  wireHeatmapTooltip(root);
  wireCloudCard(root);
  root.querySelectorAll("[data-test-tab]").forEach((btn) => {
    btn.addEventListener("click", () => navigate("dashboard", { testId: btn.dataset.testTab }));
  });
  root.querySelector("[data-practice-test]").addEventListener("click", () => navigate("practiceTest"));
  root.querySelector("[data-essay]").addEventListener("click", () => navigate("essay"));
  root.querySelector("[data-score-report]").addEventListener("click", () => navigate("scoreReport"));
  root.querySelector("[data-achievements]").addEventListener("click", () => navigate("achievements"));
  root.querySelector("[data-mistake-journal]").addEventListener("click", () => navigate("mistakeJournal"));
  root.querySelector("[data-study-plan]").addEventListener("click", () => navigate("studyPlan"));
  root.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
      gameState.reset();
      navigate("avatarCreator", { onboarding: true });
    }
  });
}
