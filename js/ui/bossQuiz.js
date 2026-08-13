// Boss Quiz: a capstone challenge for an island, unlocked once every skill
// on it is mastered. A single bigger mixed-question test (not tied to any
// one skill's path) drawing from everything you've learned on that island,
// with a one-time bonus reward the first time you clear it.
import { getSubject } from "../data/skills.js";
import { getBossQuizQuestions, preloadSubject } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";
import { renderLoadingScreen } from "./loadingScreen.js";

const QUESTION_TIME = 20;
const QUESTION_COUNT = 20;
const FIRST_CLEAR_BONUS_STARS = 30;
const FIRST_CLEAR_BONUS_COINS = 100;

export function renderBossQuiz(root, navigate, { subjectId }) {
  const subject = getSubject(subjectId);

  // A boss fight only unlocks after the player already mastered every
  // skill on this island, so this subject was preloaded (from island.js)
  // ages ago in practice — this just guards the rare case it wasn't.
  renderLoadingScreen(root, { subject });
  preloadSubject(subjectId).then(() => startQuiz());

  function startQuiz() {
  const questions = getBossQuizQuestions(subjectId, QUESTION_COUNT);

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
      <main class="screen quiz-screen boss-quiz-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Quit to Island</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <h2 class="quiz-skill-name">👑 ${subject.name} Boss Quiz</h2>
        <p class="quiz-lesson-label">Question ${idx + 1} of ${questions.length} &middot; ${q.skillName}</p>
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
    root.querySelector("[data-quit]").addEventListener("click", () => goTo("island", { subjectId }));
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
    gameState.recordQuestionAnswer(q.skillId, q.bankIndex, correct);

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

    // Work out the first-clear bonus before recording, since recording is
    // what flips gameState's `bossCleared` flag.
    const willFirstClear = scorePct / 100 >= 0.7 && !gameState.isBossCleared(subjectId);
    const totalStars = starsEarned + (willFirstClear ? FIRST_CLEAR_BONUS_STARS : 0);
    const totalCoins = coinsEarned + (willFirstClear ? FIRST_CLEAR_BONUS_COINS : 0);

    const outcome = gameState.recordBossQuizResult(subjectId, {
      correctCount,
      totalCount: total,
      starsEarned: totalStars,
      coinsEarned: totalCoins,
    });

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.justCleared ? "👑 Boss Cleared!" : outcome.passed ? "Cleared Again!" : "Not Quite!"}</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          ${
            outcome.justCleared
              ? `<p class="results-flag">🏆 First clear bonus: +${FIRST_CLEAR_BONUS_STARS} stars, +${FIRST_CLEAR_BONUS_COINS} coins!</p>`
              : outcome.passed
              ? `<p class="results-flag">✅ Passing score</p>`
              : `<p class="results-flag results-flag-muted">Score 70% or higher to clear the Boss Quiz.</p>`
          }
          ${renderProgressBanners(outcome)}
          <div class="results-stats">
            <span>⭐ +${totalStars} stars</span>
            <span>🪙 +${totalCoins} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Retry Boss Quiz</button>
            <button class="btn-secondary" data-island>Back to Island</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("bossQuiz", { subjectId }));
    root.querySelector("[data-island]").addEventListener("click", () => goTo("island", { subjectId }));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderQuestion();
  }
}
