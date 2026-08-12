// Shared short quiz screen for reference-lesson topics (Science Background,
// Vocabulary Builder): a fixed set of questions, no lesson/mastery
// tracking, just coins for correct answers. Supports the same hint and
// keyboard-shortcut affordances as every other quiz screen.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";

const ACCENT_COLOR = "#ff9f38";
const ACCENT_BG = "#fff8ec";

export function renderTopicQuiz(
  root,
  navigate,
  { questions, title, coinsPerCorrect = 4, backScreen, backParams = {}, retryScreen, retryParams = {} }
) {
  let idx = 0;
  let correctCount = 0;
  let coinsEarned = 0;
  let answered = false;
  let unbindKeys = () => {};

  function goTo(screen, params) {
    unbindKeys();
    navigate(screen, params);
  }

  function renderQuestion() {
    answered = false;
    const q = questions[idx];

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen quiz-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Back</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
        </div>
        <h2 class="quiz-skill-name">${title}</h2>
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
    root.querySelector("[data-quit]").addEventListener("click", () => goTo(backScreen, backParams));
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(Number(btn.dataset.choice)));
    });
    wireHintButton(root, q);

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
    removeHintButton(root);

    const q = questions[idx];
    const correct = choiceIdx === q.answer;

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
      coinsEarned += coinsPerCorrect;
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
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    if (coinsEarned > 0) gameState.addCoins(coinsEarned);
    const passed = scorePct >= 70;

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${passed ? "Nice Work!" : "Good Effort!"}</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          <p class="results-flag ${passed ? "" : "results-flag-muted"}">${
      passed ? "✅ Solid grasp of this topic" : "Review the material and try again for a stronger score."
    }</p>
          <div class="results-stats">
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Retry Quiz</button>
            <button class="btn-secondary" data-back>Back</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo(retryScreen, retryParams));
    root.querySelector("[data-back]").addEventListener("click", () => goTo(backScreen, backParams));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderQuestion();
}
