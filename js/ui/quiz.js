import { getSkill } from "../data/skills.js";
import { getLessonQuestions, getLessonCount } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";

const QUESTION_TIME = 20; // seconds budgeted per question, for the speed bonus

export function renderQuiz(root, navigate, { skillId, subjectId, lessonIndex }) {
  const { subject, skill } = getSkill(skillId);
  const questions = getLessonQuestions(skillId, lessonIndex);
  const totalLessons = getLessonCount(skillId);

  let idx = 0;
  let correctCount = 0;
  let streak = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let timerInterval = null;
  let timeLeft = QUESTION_TIME;
  let answered = false;
  let unbindKeys = () => {};

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  // Every navigation away from this screen — HUD nav, quit, retry, next
  // lesson, back to path/map — has to go through here so the running timer
  // and the keyboard-shortcut listener (which lives on `document`, since
  // each question is a full innerHTML rebuild with no persistent DOM) both
  // get torn down instead of leaking onto whatever screen comes next.
  function goTo(screen, params) {
    unbindKeys();
    stopTimer();
    navigate(screen, params);
  }

  function startTimer() {
    timeLeft = QUESTION_TIME;
    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 0.1);
      const fill = root.querySelector("#timerFill");
      if (fill) fill.style.width = `${(timeLeft / QUESTION_TIME) * 100}%`;
      if (timeLeft <= 0) {
        stopTimer();
        if (!answered) selectChoice(-1);
      }
    }, 100);
  }

  function renderQuestion() {
    answered = false;
    const q = questions[idx];
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen quiz-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Quit to Path</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <h2 class="quiz-skill-name">${skill.name}</h2>
        <p class="quiz-lesson-label">Lesson ${lessonIndex + 1} of ${totalLessons}</p>
        ${gameState.timerEnabled ? `<div class="timer-bar-track"><div class="timer-bar-fill" id="timerFill"></div></div>` : ""}
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}
          </div>
          ${renderHintButton()}
          <div class="explain-panel" id="explainPanel" hidden></div>
          <button class="next-btn" id="nextBtn" hidden>${
            idx === questions.length - 1 ? "See Results" : "Next Question"
          } &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => goTo("skillPath", { skillId, subjectId }));
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(Number(btn.dataset.choice)));
    });
    wireHintButton(root, q);
    if (gameState.timerEnabled) startTimer();

    unbindKeys();
    unbindKeys = bindQuizKeys({
      onChoice: (i) => {
        if (i < q.choices.length) selectChoice(i);
      },
      onNext: () => root.querySelector("#nextBtn:not([hidden])")?.click(),
    });
  }

  function selectChoice(choiceIdx) {
    if (answered) return;
    answered = true;
    stopTimer();
    removeHintButton(root);

    const q = questions[idx];
    const correct = choiceIdx === q.answer;
    const fast = gameState.timerEnabled && timeLeft > QUESTION_TIME / 2;

    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.disabled = true;
      const i = Number(btn.dataset.choice);
      if (i === q.answer) btn.classList.add("is-correct");
      else if (i === choiceIdx) btn.classList.add("is-incorrect");
    });

    const reactor = root.querySelector("#monsterReactor");
    reactor.classList.add(correct ? "react-happy" : "react-sad");

    if (correct) {
      correctCount++;
      streak++;
      const bonus = streak >= 3 ? 1 : 0;
      starsEarned += 1 + bonus;
      coinsEarned += 5 + (fast ? 2 : 0) + bonus * 2;
    } else {
      streak = 0;
    }

    const panel = root.querySelector("#explainPanel");
    panel.hidden = false;
    panel.className = `explain-panel ${correct ? "is-correct-bg" : "is-incorrect-bg"}`;
    panel.innerHTML = correct
      ? `<strong>Nice, that's right!</strong><p>${q.explain}</p>`
      : `<strong>Not quite. The correct answer: ${q.choices[q.answer]}</strong><p>${q.explain}</p>`;

    const nextBtn = root.querySelector("#nextBtn");
    nextBtn.hidden = false;
    nextBtn.addEventListener(
      "click",
      () => {
        idx++;
        if (idx >= questions.length) showResults();
        else renderQuestion();
      },
      { once: true }
    );
  }

  function showResults() {
    unbindKeys();
    const total = questions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const outcome = gameState.recordLessonResult(skillId, lessonIndex, {
      correctCount,
      totalCount: total,
      starsEarned,
      coinsEarned,
    });
    const hasNextLesson = outcome.passed && lessonIndex + 1 < totalLessons;

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.passed ? "Lesson Passed!" : "Keep Practicing!"}</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          ${
            outcome.justMastered
              ? `<p class="results-flag">🏅 Skill mastered!</p>`
              : outcome.passed
              ? `<p class="results-flag">✅ Lesson ${lessonIndex + 1} of ${totalLessons} cleared</p>`
              : `<p class="results-flag results-flag-muted">Score 70% or higher to pass and unlock the next lesson.</p>`
          }
          ${renderProgressBanners(outcome)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            ${hasNextLesson ? `<button class="btn-primary" data-next>Next Lesson &rarr;</button>` : ""}
            <button class="${hasNextLesson ? "btn-secondary" : "btn-primary"}" data-retry>Retry Lesson</button>
            <button class="btn-secondary" data-path>Back to Path</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    const nextBtn = root.querySelector("[data-next]");
    if (nextBtn) nextBtn.addEventListener("click", () => goTo("quiz", { skillId, subjectId, lessonIndex: lessonIndex + 1 }));
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("quiz", { skillId, subjectId, lessonIndex }));
    root.querySelector("[data-path]").addEventListener("click", () => goTo("skillPath", { skillId, subjectId }));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderQuestion();
}
