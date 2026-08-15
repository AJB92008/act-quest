// Adaptive Practice: unlike Weak Skill Review (which targets your lowest-
// accuracy *skills*), this targets your lowest-accuracy *patterns* — traits
// a question can have regardless of which skill or subject it's filed
// under, like negation traps or cross-passage synthesis (see
// data/questions/patterns.js). Two players who are both "weak at re-claims"
// might need entirely different practice depending on which pattern is
// actually tripping them up; this is the session built from that finer
// signal instead of the skill-level one.
import { getSubject } from "../data/skills.js";
import { getWeakPatterns, getAdaptivePracticeQuestions, preloadAllSubjects } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";

const QUESTION_TIME = 20;
const SESSION_SIZE = 10;
const ADAPTIVE_COLOR = "#c2410c";
const ADAPTIVE_BG = "#fff1e8";

export function renderAdaptivePractice(root, navigate) {
  // Needs every subject's real question text loaded to tag patterns at
  // all (a pattern like "paired-passage comparison" only exists in
  // Reading/Science), unlike Weak Skill Review which only ever needs the
  // handful of subjects its weak skills happen to span.
  const dataReady = preloadAllSubjects();
  let weakPatterns = [];
  let questions = [];

  let idx = 0;
  let correctCount = 0;
  let streak = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let timerInterval = null;
  let timeLeft = QUESTION_TIME;
  let answered = false;
  let finished = false;
  let levelResult = {};
  let unbindKeys = () => {};

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function finishSession() {
    stopTimer();
    if (finished) return;
    finished = true;
    if (starsEarned > 0 || coinsEarned > 0) {
      levelResult = gameState.finishDrill({ starsEarned, coinsEarned }) || {};
    }
  }

  function goTo(screen, params) {
    unbindKeys();
    finishSession();
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

  function renderLoading() {
    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${ADAPTIVE_COLOR};--island-bg:${ADAPTIVE_BG}">
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🧭 Adaptive Practice</h1>
          <p class="lesson-blurb">Reading your attempt history for cross-subject weak patterns…</p>
        </div>
      </main>
    `;
    wireHud(root, goTo);
  }

  function renderIntro() {
    const patternRows = weakPatterns
      .map((p) => `<li>${p.label} <span class="weak-skill-pct">${Math.round(p.accuracy * 100)}%</span><p class="trait-flavor">${p.hint}</p></li>`)
      .join("");

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${ADAPTIVE_COLOR};--island-bg:${ADAPTIVE_BG}">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🧭 Adaptive Practice</h1>
          <p class="lesson-blurb">${
            weakPatterns.length === 0
              ? "Not enough attempt history yet to detect a weak pattern. Answer more questions across a few different skills, then check back here."
              : `A ${SESSION_SIZE}-question session pulled from every subject, targeting the specific question patterns you've struggled with most, not just weak skills.`
          }</p>
          ${
            weakPatterns.length > 0
              ? `<p class="lesson-paragraph">Your lowest-accuracy patterns right now:</p><ul class="weak-skill-list">${patternRows}</ul>`
              : ""
          }
          ${
            weakPatterns.length > 0
              ? `<button class="btn-primary lesson-start-btn" data-start-review>Start Practice &rarr;</button>`
              : `<button class="btn-secondary lesson-start-btn" data-back-2>Back to Map</button>`
          }
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
    root.querySelector("[data-back-2]")?.addEventListener("click", () => navigate("map"));
    const startBtn = root.querySelector("[data-start-review]");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        startBtn.disabled = true;
        startBtn.textContent = "Loading…";
        dataReady.then(() => {
          questions = getAdaptivePracticeQuestions(weakPatterns, SESSION_SIZE, {
            getQuestionStat: (skillId, bankIndex) => gameState.getQuestionStat(skillId, bankIndex),
          });
          idx = 0;
          renderQuestion();
        });
      });
    }
  }

  function renderQuestion() {
    answered = false;
    const q = questions[idx];
    const subject = getSubject(q.subjectId);
    const stimulusHTML = renderQuestionStimulus(q);
    const matchedLabels = q.matchedPatterns.map((id) => weakPatterns.find((p) => p.id === id)?.label).filter(Boolean);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${ADAPTIVE_COLOR};--island-bg:${ADAPTIVE_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Practice</button>
          <div class="quiz-progress-dots">
            ${questions.map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`).join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <div class="endless-tag" style="--tag-color:${subject.color};--tag-bg:${subject.bg}">${subject.icon} ${subject.name} &middot; ${q.skillName}</div>
        ${matchedLabels.length > 0 ? `<p class="trait-flavor">🎯 Targets: ${matchedLabels.join(", ")}</p>` : ""}
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
          <button class="next-btn" id="nextBtn" hidden>${idx === questions.length - 1 ? "See Results" : "Next Question"} &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => {
      unbindKeys();
      finishSession();
      showResults();
    });
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

    gameState.recordQuestionAnswer(q.skillId, q.bankIndex, correct, choiceIdx);

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
        if (idx >= questions.length) {
          unbindKeys();
          finishSession();
          showResults();
        } else {
          renderQuestion();
        }
      },
      { once: true }
    );
  }

  function showResults() {
    const total = questions.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${ADAPTIVE_COLOR};--island-bg:${ADAPTIVE_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>Practice Complete!</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          <p class="results-flag">🧭 Targeted reps on your weakest patterns, not just weak skills.</p>
          ${renderProgressBanners(levelResult)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Practice Again</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("adaptivePractice"));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderLoading();
  dataReady.then(() => {
    weakPatterns = getWeakPatterns((skillId, bankIndex) => gameState.getQuestionStat(skillId, bankIndex));
    renderIntro();
  });
}
