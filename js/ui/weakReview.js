// Weak Skill Review: an on-demand practice session auto-built from your
// lowest-accuracy skills across every subject, weighted so the shakiest
// skills show up more often. Doesn't gate or unlock anything — it's just
// extra reps where you need them, and it feeds back into each skill's
// ongoing accuracy stats as you go.
import { getSkill, getSubject } from "../data/skills.js";
import { getWeakReviewQuestions, preloadSubjectForSkill } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";

const QUESTION_TIME = 20;
const REVIEW_SIZE = 10;
const PREVIEW_SIZE = 5;
const REVIEW_COLOR = "#22b8a3";
const REVIEW_BG = "#e8fbf7";

export function renderWeakReview(root, navigate) {
  let weakSkills = gameState.getWeakSkills(5);
  // A brand-new (or lightly-played) account won't have 5+ attempts on
  // anything yet, so the real "weakest skills" read above comes back
  // empty. Rather than hard-blocking until that history exists, fall back
  // to whatever's been attempted at all (even just once) and offer a
  // shorter warm-up session instead — some reps beat a dead end.
  let isPreview = false;
  if (weakSkills.length === 0) {
    weakSkills = gameState.getWeakSkills(5, 1, 1.01);
    isPreview = weakSkills.length > 0;
  }
  const reviewSize = isPreview ? PREVIEW_SIZE : REVIEW_SIZE;
  // Kicked off immediately (fire-and-forget) so the handful of subjects
  // these weak skills actually span have a head start loading while the
  // player reads the intro screen below — awaited for real just before
  // "Start Review" builds the question set, in case they click fast.
  const dataReady = Promise.all(weakSkills.map((s) => preloadSubjectForSkill(s.id)));
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

  // Banks whatever stars/coins this session earned so far. Idempotent, and
  // called on every exit path (finishing normally, quitting early, or
  // navigating away via the HUD) so nothing is lost either way.
  function finishSession() {
    stopTimer();
    if (finished) return;
    finished = true;
    if (starsEarned > 0 || coinsEarned > 0) {
      levelResult = gameState.finishWeakReview({ starsEarned, coinsEarned }) || {};
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

  function renderIntro() {
    const skillRows = weakSkills
      .map(({ id, accuracy }) => {
        const { skill } = getSkill(id);
        return `<li>${skill.name} <span class="weak-skill-pct">${Math.round(accuracy * 100)}%</span></li>`;
      })
      .join("");

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">${isPreview ? "🔍 Warm-up Preview" : "🎯 Weak Skill Review"}</h1>
          <p class="lesson-blurb">${
            isPreview
              ? `Not enough history yet for a full weak-skill read, so here's a quick ${PREVIEW_SIZE}-question warm-up from what you've tried so far.`
              : `A quick ${REVIEW_SIZE}-question session pulled from the skills you're struggling with most, across every subject.`
          }</p>
          ${
            weakSkills.length === 0
              ? `<p class="lesson-paragraph">You haven't attempted any questions yet. Complete a mini-lesson first, then come back here for a warm-up or a full weak-spot review.</p>`
              : `
                <p class="lesson-paragraph">${isPreview ? "Skills you've touched so far:" : "Right now that's mostly:"}</p>
                <ul class="weak-skill-list">${skillRows}</ul>
              `
          }
          ${
            weakSkills.length > 0
              ? `<button class="btn-primary lesson-start-btn" data-start-review>Start Review &rarr;</button>`
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
          questions =
            weakSkills.length > 0
              ? getWeakReviewQuestions(weakSkills, reviewSize, {
                  getQuestionStat: (skillId, bankIndex) => gameState.getQuestionStat(skillId, bankIndex),
                })
              : [];
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

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Review</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <div class="endless-tag" style="--tag-color:${subject.color};--tag-bg:${subject.bg}">${subject.icon} ${subject.name} &middot; ${q.skillName}</div>
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

    gameState.recordWeakReviewAnswer(q.skillId, correct);
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
      <main class="screen results-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>Review Complete!</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          <p class="results-flag">🎯 Great job shoring up your weak spots.</p>
          ${renderProgressBanners(levelResult)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Review Again</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("weakReview"));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderIntro();
}
