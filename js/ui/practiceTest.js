// Full-length practice test: all four ACT sections back-to-back (English,
// Math, Reading, Science, the real ACT's order), each with its own
// countdown timer and no per-question feedback, matching real test-day
// pacing rather than the immediate-feedback style of every other quiz
// screen here. A short break screen separates sections. The final score is
// a 1-36 composite averaged from each section's own estimate, which then
// becomes the dashboard's score predictor going forward.
import { getSubject, REPORTING_CATEGORIES } from "../data/skills.js";
import { getPracticeTestSectionQuestions, preloadAllSubjects } from "../data/questions/index.js";
import { gameState, scaledScoreFromRaw } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderProgressBanners } from "./progressBanner.js";

// Real proctors call out these thresholds; the timer picks up a warning
// style at the same points instead of ticking down identically the whole way.
const TIME_WARNING_SECONDS = 5 * 60;
const TIME_CRITICAL_SECONDS = 60;

// Real ACT section order, question counts, and official time limits — this
// is genuinely full-length (215 questions, 2h55m total across the four
// sections), not a scaled-down sample, so the intro screen is upfront
// about the time commitment before anyone starts.
const SECTIONS = [
  { subjectId: "english", questionCount: 75, timeMinutes: 45 },
  { subjectId: "math", questionCount: 60, timeMinutes: 60 },
  { subjectId: "reading", questionCount: 40, timeMinutes: 35 },
  { subjectId: "science", questionCount: 40, timeMinutes: 35 },
];
const TOTAL_MINUTES = SECTIONS.reduce((sum, s) => sum + s.timeMinutes, 0);
const ACCENT_COLOR = "#6a5cff";
const ACCENT_BG = "#f0eeff";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function renderPracticeTest(root, navigate) {
  // All four sections (one per subject) will be needed over the course of
  // a single test, so there's no per-section lazy load worth doing here —
  // just kick everything off as soon as the player opens this screen.
  const dataReady = preloadAllSubjects();
  let sectionIndex = 0;
  let questions = [];
  let idx = 0;
  let sectionAnswers = [];
  let sectionResults = [];
  let timerInterval = null;
  let timeLeft = 0;
  let unbindKeys = () => {};
  // True from the moment the first section starts until final results are
  // recorded — a nearly-3-hour test has a lot more to lose than any other
  // screen here, so every way out while this is true (a HUD nav click, the
  // in-quiz Quit Test button) has to actually ask first instead of
  // silently discarding the attempt.
  let testInProgress = false;
  // Reset per section (see startSection()) so each section's own countdown
  // gets its own one-time 5-minute/1-minute call-out, instead of firing
  // once total across the whole test or re-firing on every question render.
  let warnedAtFiveMin = false;
  let warnedAtOneMin = false;

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  // Same timer/keyboard-cleanup discipline as every other quiz screen: any
  // way of leaving mid-test (HUD nav, quit) has to tear both down first —
  // and, uniquely to this screen, confirm first if real progress is on the line.
  function goTo(screen, params) {
    if (testInProgress && !confirm("Leave the practice test? Your progress on this attempt will be lost. It isn't saved until you finish all four sections.")) {
      return;
    }
    unbindKeys();
    stopTimer();
    testInProgress = false;
    navigate(screen, params);
  }

  function renderIntro() {
    const best = gameState.practiceTestBest;
    const rows = SECTIONS.map((s) => {
      const subject = getSubject(s.subjectId);
      return `<li>${subject.icon} <strong>${subject.name}</strong>: ${s.questionCount} questions, ${s.timeMinutes} min</li>`;
    }).join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">📝 Full-Length Practice Test</h1>
          <p class="lesson-blurb">All four ACT sections back-to-back, each on its own countdown. No answer feedback until the very end, just like test day.</p>
          <ul class="practice-test-sections">${rows}</ul>
          <p class="lesson-paragraph">⏱️ ${TOTAL_MINUTES} minutes of testing time total (${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m). This is the real, full-length test, not a shortened sample. You'll get an untimed break between sections and can start the next one whenever you're ready.</p>
          <p class="lesson-paragraph">Each section is sampled to match the real ACT's own reporting-category proportions, not just drawn evenly across skills. Your score is a composite (1-36) averaged across all four sections' own scaled scores, the same way the real ACT computes it, and it becomes your new predicted score on the Progress page.</p>
          ${
            best > 0
              ? `<div class="endless-best-tile"><span class="endless-best-num">${best}</span><span>Best Composite</span></div>`
              : ""
          }
          <button class="btn-primary lesson-start-btn" data-start>Start Test &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
    const startBtn = root.querySelector("[data-start]");
    startBtn.addEventListener("click", () => {
      startBtn.disabled = true;
      startBtn.textContent = "Loading…";
      sectionIndex = 0;
      sectionResults = [];
      testInProgress = true;
      dataReady.then(() => startSection());
    });
  }

  function startSection() {
    const section = SECTIONS[sectionIndex];
    questions = getPracticeTestSectionQuestions(section.subjectId, section.questionCount);
    idx = 0;
    sectionAnswers = new Array(questions.length).fill(null);
    timeLeft = section.timeMinutes * 60;
    warnedAtFiveMin = false;
    warnedAtOneMin = false;
    renderQuestion();
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      const el = root.querySelector("#sectionTimer");
      if (el) {
        el.textContent = formatTime(timeLeft);
        // Real proctors call out a 5-minute and a 1-minute warning; the
        // timer picks up the same two-stage urgency instead of looking
        // identical from 45:00 down to 0:00.
        el.classList.toggle("is-time-warning", timeLeft <= TIME_WARNING_SECONDS && timeLeft > TIME_CRITICAL_SECONDS);
        el.classList.toggle("is-time-critical", timeLeft <= TIME_CRITICAL_SECONDS);
      }
      if (!warnedAtFiveMin && timeLeft <= TIME_WARNING_SECONDS && timeLeft > TIME_CRITICAL_SECONDS) {
        warnedAtFiveMin = true;
        showToast("⏱️ 5 minutes remaining");
      }
      if (!warnedAtOneMin && timeLeft > 0 && timeLeft <= TIME_CRITICAL_SECONDS) {
        warnedAtOneMin = true;
        showToast("⏱️ 1 minute remaining!");
      }
      if (timeLeft <= 0) {
        stopTimer();
        endSection();
      }
    }, 1000);
  }

  function renderQuestion() {
    const section = SECTIONS[sectionIndex];
    const subject = getSubject(section.subjectId);
    const q = questions[idx];
    const selected = sectionAnswers[idx];
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen quiz-screen practice-test-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Quit Test</button>
          <div class="practice-test-timer" id="sectionTimer">${formatTime(timeLeft)}</div>
        </div>
        <h2 class="quiz-skill-name">${subject.icon} ${subject.name} Section</h2>
        <p class="quiz-lesson-label">Question ${idx + 1} of ${questions.length}</p>
        <div
          class="progress-bar practice-test-progress"
          role="progressbar"
          aria-valuenow="${idx + 1}"
          aria-valuemin="0"
          aria-valuemax="${questions.length}"
          aria-label="${subject.name} section progress"
        >
          <div class="progress-fill" style="width:${Math.round(((idx + 1) / questions.length) * 100)}%;background:${subject.color}"></div>
        </div>
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices
              .map((c, i) => `<button class="choice-btn ${selected === i ? "is-selected" : ""}" data-choice="${i}">${c}</button>`)
              .join("")}
          </div>
          <div class="practice-test-nav">
            <button class="btn-ghost" id="skipBtn">Skip &rarr;</button>
            <button class="btn-primary" id="nextBtn" ${selected === null ? "disabled" : ""}>${
      idx === questions.length - 1 ? "Finish Section" : "Next Question"
    } &rarr;</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => goTo("dashboard"));
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const choice = Number(btn.dataset.choice);
        sectionAnswers[idx] = choice;
        root.querySelectorAll("[data-choice]").forEach((b) => b.classList.toggle("is-selected", Number(b.dataset.choice) === choice));
        root.querySelector("#nextBtn").disabled = false;
      });
    });
    root.querySelector("#skipBtn").addEventListener("click", () => advance());
    root.querySelector("#nextBtn").addEventListener("click", () => advance());
    startTimer();

    unbindKeys();
    unbindKeys = bindQuizKeys({
      onChoice: (i) => {
        if (i < q.choices.length) root.querySelector(`[data-choice="${i}"]`)?.click();
      },
      onNext: () => {
        const btn = root.querySelector("#nextBtn");
        if (btn && !btn.disabled) btn.click();
      },
    });
  }

  function advance() {
    stopTimer();
    unbindKeys();
    idx++;
    if (idx >= questions.length) endSection();
    else renderQuestion();
  }

  function endSection() {
    stopTimer();
    unbindKeys();
    const section = SECTIONS[sectionIndex];
    const subject = getSubject(section.subjectId);
    let correctCount = 0;
    // categoryId -> { name, correct, total }, mirroring how a real ACT
    // score report breaks a section down by reporting category rather
    // than just giving one raw section score.
    const categoryTotals = {};
    const categories = REPORTING_CATEGORIES[section.subjectId] || [];
    questions.forEach((q, i) => {
      const correct = sectionAnswers[i] === q.answer;
      if (correct) correctCount++;
      // Skipped questions (sectionAnswers[i] === null) were never actually
      // attempted, so they shouldn't count as a personal "miss" for the
      // adaptive review weighting.
      if (sectionAnswers[i] !== null) gameState.recordQuestionAnswer(q.skillId, q.bankIndex, correct);
      const catDef = categories.find((c) => c.id === q.reportingCategory);
      if (!catDef) return;
      const entry = categoryTotals[catDef.id] || { name: catDef.name, correct: 0, total: 0 };
      entry.total += 1;
      if (correct) entry.correct += 1;
      categoryTotals[catDef.id] = entry;
    });
    const totalCount = questions.length;
    const subscore = scaledScoreFromRaw(section.subjectId, correctCount);
    sectionResults.push({
      subjectId: section.subjectId,
      label: subject.name,
      correctCount,
      totalCount,
      subscore,
      categoryBreakdown: Object.values(categoryTotals),
    });

    if (sectionIndex + 1 < SECTIONS.length) renderSectionBreak();
    else showResults();
  }

  function renderSectionBreak() {
    const justFinished = sectionResults[sectionResults.length - 1];
    const finishedSubject = getSubject(justFinished.subjectId);
    const nextSection = SECTIONS[sectionIndex + 1];
    const nextSubject = getSubject(nextSection.subjectId);

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${nextSubject.color};--island-bg:${nextSubject.bg}">
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">✅ ${finishedSubject.name} Section Complete</h1>
          <p class="lesson-blurb">${justFinished.correctCount} / ${justFinished.totalCount} correct.</p>
          <p class="lesson-paragraph">Next up: ${nextSubject.icon} <strong>${nextSubject.name}</strong>: ${nextSection.questionCount} questions, ${nextSection.timeMinutes} minutes. Take a breath, then start whenever you're ready.</p>
          <button class="btn-primary lesson-start-btn" data-continue>Start ${nextSubject.name} &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-continue]").addEventListener("click", () => {
      sectionIndex++;
      startSection();
    });
  }

  function showResults() {
    testInProgress = false; // recorded below — nothing left to lose by navigating away now
    const composite = Math.round(sectionResults.reduce((sum, s) => sum + s.subscore, 0) / sectionResults.length);
    const totalCorrect = sectionResults.reduce((sum, s) => sum + s.correctCount, 0);
    const starsEarned = totalCorrect;
    const coinsEarned = totalCorrect * 3 + 20;

    const outcome = gameState.recordPracticeTestResult({ sectionResults, composite, starsEarned, coinsEarned });

    const sectionRows = sectionResults
      .map((s) => {
        const subject = getSubject(s.subjectId);
        const categoryRows = (s.categoryBreakdown || [])
          .map((c) => {
            const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
            return `<li>${c.name}: ${c.correct}/${c.total} (${pct}%)</li>`;
          })
          .join("");
        return `
          <div class="dash-row">
            <div class="dash-row-label">
              <span>${subject.icon} ${s.label}</span>
              <span>${s.correctCount}/${s.totalCount} correct</span>
            </div>
            <div class="dash-row-accuracy">Section score: ${s.subscore}</div>
            ${categoryRows ? `<ul class="practice-test-category-breakdown">${categoryRows}</ul>` : ""}
          </div>
        `;
      })
      .join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen results-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.isNewBest ? "New Best Composite!" : "Test Complete!"}</h1>
          <p class="results-score">Composite: ${composite} / 36</p>
          ${
            outcome.isNewBest
              ? `<p class="results-flag">🏆 New personal best!</p>`
              : `<p class="results-flag results-flag-muted">Best composite: ${gameState.practiceTestBest}</p>`
          }
          ${renderProgressBanners(outcome)}
          <div class="dash-rows">${sectionRows}</div>
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Take Another Test</button>
            <button class="btn-secondary" data-dashboard>Back to Progress</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => renderPracticeTest(root, navigate));
    root.querySelector("[data-dashboard]").addEventListener("click", () => navigate("dashboard"));
    root.querySelector("[data-map]").addEventListener("click", () => navigate("map"));
  }

  renderIntro();
}
