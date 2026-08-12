// Full-length practice test: all four ACT sections back-to-back (English,
// Math, Reading, Science — the real ACT's order), each with its own
// countdown timer and no per-question feedback, matching real test-day
// pacing rather than the immediate-feedback style of every other quiz
// screen here. A short break screen separates sections. The final score is
// a 1-36 composite averaged from each section's own estimate, which then
// becomes the dashboard's score predictor going forward.
import { getSubject } from "../data/skills.js";
import { getBossQuizQuestions } from "../data/questions/index.js";
import { gameState, scoreFromAccuracy } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderProgressBanners } from "./progressBanner.js";

const SECTIONS = [
  { subjectId: "english", questionCount: 20, timeMinutes: 12 },
  { subjectId: "math", questionCount: 20, timeMinutes: 20 },
  { subjectId: "reading", questionCount: 20, timeMinutes: 14 },
  { subjectId: "science", questionCount: 20, timeMinutes: 14 },
];
const ACCENT_COLOR = "#6a5cff";
const ACCENT_BG = "#f0eeff";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function renderPracticeTest(root, navigate) {
  let sectionIndex = 0;
  let questions = [];
  let idx = 0;
  let sectionAnswers = [];
  let sectionResults = [];
  let timerInterval = null;
  let timeLeft = 0;
  let unbindKeys = () => {};

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  // Same timer/keyboard-cleanup discipline as every other quiz screen: any
  // way of leaving mid-test (HUD nav, quit) has to tear both down first.
  function goTo(screen, params) {
    unbindKeys();
    stopTimer();
    navigate(screen, params);
  }

  function renderIntro() {
    const best = gameState.practiceTestBest;
    const rows = SECTIONS.map((s) => {
      const subject = getSubject(s.subjectId);
      return `<li>${subject.icon} <strong>${subject.name}</strong> &mdash; ${s.questionCount} questions, ${s.timeMinutes} min</li>`;
    }).join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">📝 Full-Length Practice Test</h1>
          <p class="lesson-blurb">All four ACT sections back-to-back, each on its own countdown &mdash; no answer feedback until the very end, just like test day.</p>
          <ul class="practice-test-sections">${rows}</ul>
          <p class="lesson-paragraph">You'll get a short break between sections and can start the next one whenever you're ready. Your score is a composite (1-36) averaged across all four sections, and it becomes your new predicted score on the Progress page.</p>
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
    root.querySelector("[data-start]").addEventListener("click", () => {
      sectionIndex = 0;
      sectionResults = [];
      startSection();
    });
  }

  function startSection() {
    const section = SECTIONS[sectionIndex];
    questions = getBossQuizQuestions(section.subjectId, section.questionCount);
    idx = 0;
    sectionAnswers = new Array(questions.length).fill(null);
    timeLeft = section.timeMinutes * 60;
    renderQuestion();
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      const el = root.querySelector("#sectionTimer");
      if (el) el.textContent = formatTime(timeLeft);
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
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="practice-test-timer" id="sectionTimer">${formatTime(timeLeft)}</div>
        </div>
        <h2 class="quiz-skill-name">${subject.icon} ${subject.name} Section</h2>
        <p class="quiz-lesson-label">Question ${idx + 1} of ${questions.length}</p>
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
    questions.forEach((q, i) => {
      if (sectionAnswers[i] === q.answer) correctCount++;
    });
    const totalCount = questions.length;
    const subscore = scoreFromAccuracy(totalCount > 0 ? correctCount / totalCount : 0);
    sectionResults.push({ subjectId: section.subjectId, label: subject.name, correctCount, totalCount, subscore });

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
          <p class="lesson-paragraph">Next up: ${nextSubject.icon} <strong>${nextSubject.name}</strong> &mdash; ${nextSection.questionCount} questions, ${nextSection.timeMinutes} minutes. Take a breath, then start whenever you're ready.</p>
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
    const composite = Math.round(sectionResults.reduce((sum, s) => sum + s.subscore, 0) / sectionResults.length);
    const totalCorrect = sectionResults.reduce((sum, s) => sum + s.correctCount, 0);
    const starsEarned = totalCorrect;
    const coinsEarned = totalCorrect * 3 + 20;

    const outcome = gameState.recordPracticeTestResult({ sectionResults, composite, starsEarned, coinsEarned });

    const sectionRows = sectionResults
      .map((s) => {
        const subject = getSubject(s.subjectId);
        return `
          <div class="dash-row">
            <div class="dash-row-label">
              <span>${subject.icon} ${s.label}</span>
              <span>${s.correctCount}/${s.totalCount} correct</span>
            </div>
            <div class="dash-row-accuracy">Section score: ${s.subscore}</div>
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
