import { getSkillBossName } from "../data/skills.js";
import { getSkill } from "../data/tests.js";
import { getLessonQuestions, getLessonCount, isBossLessonIndex, preloadSubjectForSkill } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";
import { renderLoadingScreen } from "./loadingScreen.js";
import { renderPacingTag } from "./pacingFeedback.js";

const QUESTION_TIME = 20; // seconds budgeted per question, for the speed bonus

export function renderQuiz(root, navigate, { skillId, subjectId, lessonIndex }) {
  const { subject, skill } = getSkill(skillId);
  const isBoss = isBossLessonIndex(skillId, lessonIndex);
  const bossName = getSkillBossName(skill.name);

  // The island page already kicked this subject's data off loading as soon
  // as the player opened it, so this almost always resolves instantly; the
  // loading screen only actually shows up on a very fast click or a slow
  // connection, rather than the player ever waiting on a blank screen.
  renderLoadingScreen(root, { subject });
  preloadSubjectForSkill(skillId).then(() => startQuiz());

  function startQuiz() {
  const questions = getLessonQuestions(skillId, lessonIndex, {
    getQuestionStat: (sId, bankIndex) => gameState.getQuestionStat(sId, bankIndex),
  });
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
  let questionStartedAt = 0;

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
    questionStartedAt = Date.now();
    const q = questions[idx];
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen quiz-screen ${isBoss ? "boss-quiz-screen" : ""}" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Quit to Path</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <h2 class="quiz-skill-name">${isBoss ? `👑 ${bossName}` : skill.name}</h2>
        <p class="quiz-lesson-label">${isBoss ? `Boss Battle &mdash; Question ${idx + 1} of ${questions.length}` : `Lesson ${lessonIndex + 1} of ${totalLessons}`}</p>
        ${gameState.timerEnabled ? `<div class="timer-bar-track"><div class="timer-bar-fill" id="timerFill"></div></div>` : ""}
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}
          </div>
          ${renderHintButton()}
          <div class="explain-panel" id="explainPanel" role="status" aria-live="polite" hidden></div>
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
    gameState.recordQuestionAnswer(skillId, q.bankIndex, correct, choiceIdx);
    const elapsedSeconds = (Date.now() - questionStartedAt) / 1000;
    gameState.recordPaceSample(subject.id, elapsedSeconds);

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
    const pacing = gameState.getPacingStats(subject.id);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.passed ? (isBoss ? "👑 Boss Defeated!" : "Lesson Passed!") : isBoss ? "The Boss Wins This Round!" : "Keep Practicing!"}</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          ${
            outcome.justMastered
              ? `<p class="results-flag">🏅 Skill mastered!</p>`
              : outcome.passed
              ? `<p class="results-flag">${isBoss ? `👑 ${bossName} defeated!` : `✅ Lesson ${lessonIndex + 1} of ${totalLessons} cleared`}</p>`
              : `<p class="results-flag results-flag-muted">Score 70% or higher to ${isBoss ? `defeat ${bossName}` : "pass and unlock the next lesson"}.</p>`
          }
          ${renderProgressBanners(outcome)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          ${renderPacingTag(pacing)}
          <div class="results-actions">
            ${hasNextLesson ? `<button class="btn-primary" data-next>Next Lesson &rarr;</button>` : ""}
            <button class="${hasNextLesson ? "btn-secondary" : "btn-primary"}" data-retry>${isBoss ? "Retry Boss" : "Retry Lesson"}</button>
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
}
