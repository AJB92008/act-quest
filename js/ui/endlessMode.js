// Endless Mode: a continuous, mixed-subject stream of questions pulled
// randomly from every skill across all four islands (English/Math/Reading/
// Science), styled after "Teach Your Monster to Read"'s endless/high-score
// modes. The run keeps going, one timed question after another, until three
// wrong (or timed-out) answers end it; how many you answered correctly is
// your score, and the best score you've ever reached is saved permanently.
import { getSubject } from "../data/skills.js";
import { getRandomEndlessQuestion } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";

const QUESTION_TIME = 20; // seconds budgeted per question, for the speed bonus
const MAX_LIVES = 3;
const ENDLESS_COLOR = "#ef4470";
const ENDLESS_BG = "#fff0f4";

function livesHTML(lives) {
  return "❤️".repeat(lives) + "🤍".repeat(MAX_LIVES - lives);
}

export function renderEndlessMode(root, navigate) {
  let lives = MAX_LIVES;
  let correctCount = 0;
  let combo = 0;
  let bestComboThisRun = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let currentQuestion = null;
  let previousQuestion = null;
  let timerInterval = null;
  let timeLeft = QUESTION_TIME;
  let answered = false;
  let runEnded = false;
  let lastRunNewBest = false;

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
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

  // Banks whatever stars/coins/best-score progress the run has earned so
  // far. Called whenever the run truly ends, whether by striking out,
  // choosing to end it, or navigating away via the HUD mid-run — always
  // idempotent so it only ever records once per run.
  function endRun() {
    stopTimer();
    if (runEnded) return;
    runEnded = true;
    const { isNewBest } = gameState.recordEndlessRun({ correctCount, starsEarned, coinsEarned });
    lastRunNewBest = isNewBest;
  }

  // Anything that navigates away from an in-progress run (HUD nav, or the
  // explicit "End Run" button) must bank progress first, the same way the
  // regular quiz screen has to stop its timer before leaving.
  function navigateAway(screen, params) {
    endRun();
    navigate(screen, params);
  }

  function renderIntro() {
    root.innerHTML = `
      ${hudHTML("endless")}
      <main class="screen endless-screen" style="--island-color:${ENDLESS_COLOR};--island-bg:${ENDLESS_BG}">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getAvatar(), { size: 90 })}</div>
          <h1 class="lesson-title">🔁 Endless Mode</h1>
          <p class="lesson-blurb">Mixed questions from every subject, one after another, for as long as you can keep going.</p>
          <p class="lesson-paragraph">Every question can come from any skill on any island. You get ${MAX_LIVES} lives (❤️❤️❤️) — a wrong or timed-out answer costs one, and the run ends when you're out. Answer in a row for a combo bonus on stars and coins.</p>
          <p class="lesson-paragraph">Your score is how many questions you get right in a single run. Your best run ever is saved below.</p>
          <div class="endless-best-tile">
            <span class="endless-best-num">${gameState.endlessBest}</span>
            <span>Best Run</span>
          </div>
          <button class="btn-primary lesson-start-btn" data-start-run>Start Run &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
    root.querySelector("[data-start-run]").addEventListener("click", () => {
      lives = MAX_LIVES;
      correctCount = 0;
      combo = 0;
      bestComboThisRun = 0;
      starsEarned = 0;
      coinsEarned = 0;
      previousQuestion = null;
      runEnded = false;
      renderQuestion();
    });
  }

  function renderQuestion() {
    answered = false;
    previousQuestion = currentQuestion;
    currentQuestion = getRandomEndlessQuestion(previousQuestion);
    const q = currentQuestion;
    const subject = getSubject(q.subjectId);
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${hudHTML("endless")}
      <main class="screen endless-screen" style="--island-color:${ENDLESS_COLOR};--island-bg:${ENDLESS_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Run</button>
          <div class="endless-lives" title="Lives remaining">${livesHTML(lives)}</div>
          <div class="endless-score">✅ ${correctCount} correct${combo >= 2 ? ` &nbsp; 🔥 ${combo} combo` : ""}</div>
        </div>
        <div class="endless-tag" style="--tag-color:${subject.color};--tag-bg:${subject.bg}">${subject.icon} ${subject.name} &middot; ${q.skillName}</div>
        <div class="timer-bar-track"><div class="timer-bar-fill" id="timerFill"></div></div>
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getAvatar(), { size: 90 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}
          </div>
          <div class="explain-panel" id="explainPanel" hidden></div>
          <button class="next-btn" id="nextBtn" hidden></button>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-quit]").addEventListener("click", () => {
      endRun();
      renderResults();
    });
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(Number(btn.dataset.choice)));
    });
    startTimer();
  }

  function selectChoice(choiceIdx) {
    if (answered) return;
    answered = true;
    stopTimer();

    const q = currentQuestion;
    const correct = choiceIdx === q.answer;
    const fast = timeLeft > QUESTION_TIME / 2;

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
      combo++;
      bestComboThisRun = Math.max(bestComboThisRun, combo);
      const bonus = combo >= 3 ? 1 : 0;
      starsEarned += 1 + bonus;
      coinsEarned += 5 + (fast ? 2 : 0) + bonus * 2;
    } else {
      combo = 0;
      lives--;
    }

    const panel = root.querySelector("#explainPanel");
    panel.hidden = false;
    panel.className = `explain-panel ${correct ? "is-correct-bg" : "is-incorrect-bg"}`;
    panel.innerHTML = correct
      ? `<strong>Nice, that's right!</strong><p>${q.explain}</p>`
      : `<strong>Not quite. The correct answer: ${q.choices[q.answer]}</strong><p>${q.explain}</p>`;

    const outOfLives = lives <= 0;
    const nextBtn = root.querySelector("#nextBtn");
    nextBtn.hidden = false;
    nextBtn.textContent = outOfLives ? "See Results →" : "Next Question →";
    nextBtn.addEventListener(
      "click",
      () => {
        if (outOfLives) {
          endRun();
          renderResults();
        } else {
          renderQuestion();
        }
      },
      { once: true }
    );
  }

  function renderResults() {
    root.innerHTML = `
      ${hudHTML("endless")}
      <main class="screen results-screen" style="--island-color:${ENDLESS_COLOR};--island-bg:${ENDLESS_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getAvatar(), { size: 130 })}</div>
          <h1>${lastRunNewBest ? "New Best!" : "Run Over!"}</h1>
          <p class="results-score">${correctCount} correct this run</p>
          ${
            lastRunNewBest
              ? `<p class="results-flag">🏆 New personal best!</p>`
              : `<p class="results-flag results-flag-muted">Best run: ${gameState.endlessBest} correct</p>`
          }
          <div class="results-stats">
            <span>🔥 Best combo: ${bestComboThisRun}</span>
          </div>
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Play Again</button>
            <button class="btn-secondary" data-map>Back to Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-retry]").addEventListener("click", () => renderEndlessMode(root, navigate));
    root.querySelector("[data-map]").addEventListener("click", () => navigate("map"));
  }

  renderIntro();
}
