// Spaced-repetition Review Queue: pulls whatever questions and vocab words
// are actually due right now per the SM-2 schedule in state.js (as opposed
// to Weak Skill Review, which is a skill-level weighted practice session
// that doesn't follow any real schedule). Questions are graded
// automatically (right/wrong, same as every other quiz screen); vocab
// flashcards have no multiple-choice to check against, so they're
// self-graded with a "Got it" / "Didn't know it" pair, same idea as
// physical SRS flashcard apps.
import { getAllQuestionsFlat, preloadAllSubjects } from "../data/questions/index.js";
import { VOCABULARY } from "../data/vocabulary.js";
import { getSubject } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";

// Distinct from Weak Skill Review's teal — these are two different
// features (schedule-driven vs. skill-weighted practice) and sharing a
// color made them hard to tell apart on the World Map at a glance.
const REVIEW_COLOR = "#7c5cff";
const REVIEW_BG = "#f1eeff";

function flattenVocab() {
  const cards = [];
  for (const section of VOCABULARY.sections) {
    for (const topic of section.topics) {
      for (const card of topic.flashcards || []) cards.push(card);
    }
  }
  return cards;
}

export function renderReviewQueue(root, navigate) {
  const dataReady = preloadAllSubjects();
  const vocabByWord = new Map(flattenVocab().map((c) => [c.front, c]));

  let mode = "intro"; // intro | questions | vocab | results
  let questionQueue = [];
  let qIdx = 0;
  let vocabQueue = [];
  let vIdx = 0;
  let vocabFlipped = false;

  let correctCount = 0;
  let vocabGotItCount = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let answered = false;
  let unbindKeys = () => {};
  let levelResult = {};
  let finished = false;

  function finishSession() {
    if (finished) return;
    finished = true;
    if (starsEarned > 0 || coinsEarned > 0) {
      levelResult = gameState.finishSrsReview({ starsEarned, coinsEarned }) || {};
    }
  }

  function goTo(screen, params) {
    unbindKeys();
    finishSession();
    navigate(screen, params);
  }

  function renderIntro() {
    const dueKeys = gameState.getDueQuestionKeys(20);
    const dueWords = gameState.getDueVocabWords(20);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🧠 Review Queue</h1>
          <p class="lesson-blurb">Spaced repetition: questions and vocab you've missed before, resurfaced right when you're about to forget them.</p>
          <div class="dash-summary" style="margin:16px 0;">
            <div class="dash-summary-tile"><span class="tile-num">${dueKeys.length}</span><span>Questions Due</span></div>
            <div class="dash-summary-tile"><span class="tile-num">${dueWords.length}</span><span>Vocab Due</span></div>
          </div>
          ${
            dueKeys.length === 0 && dueWords.length === 0
              ? `<p class="lesson-paragraph">Nothing's due right now. Answer questions in lessons or review vocab flashcards, and anything you miss will show up here on a schedule.</p>
                 <button class="btn-secondary lesson-start-btn" data-back-2>Back to Map</button>`
              : `
                <div class="results-actions">
                  ${dueKeys.length > 0 ? `<button class="btn-primary lesson-start-btn" data-start-questions>Review ${dueKeys.length} Question${dueKeys.length === 1 ? "" : "s"} &rarr;</button>` : ""}
                  ${dueWords.length > 0 ? `<button class="btn-secondary lesson-start-btn" data-start-vocab>Review ${dueWords.length} Vocab Word${dueWords.length === 1 ? "" : "s"} &rarr;</button>` : ""}
                </div>
              `
          }
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
    root.querySelector("[data-back-2]")?.addEventListener("click", () => navigate("map"));
    root.querySelector("[data-start-questions]")?.addEventListener("click", (e) => {
      e.target.disabled = true;
      e.target.textContent = "Loading…";
      dataReady.then(() => {
        const flat = getAllQuestionsFlat();
        const byKey = new Map(flat.map((q) => [`${q.skillId}:${q.bankIndex}`, q]));
        questionQueue = dueKeys.map((k) => byKey.get(k)).filter(Boolean);
        qIdx = 0;
        mode = "questions";
        renderQuestion();
      });
    });
    root.querySelector("[data-start-vocab]")?.addEventListener("click", () => {
      vocabQueue = dueWords.map((w) => vocabByWord.get(w)).filter(Boolean);
      vIdx = 0;
      vocabFlipped = false;
      mode = "vocab";
      renderVocabCard();
    });
  }

  function renderQuestion() {
    if (qIdx >= questionQueue.length) return renderResults();
    answered = false;
    const q = questionQueue[qIdx];
    const subject = getSubject(q.subjectId);
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Review</button>
          <div class="quiz-progress-dots">
            ${questionQueue.map((_, i) => `<span class="dot ${i < qIdx ? "done" : ""} ${i === qIdx ? "current" : ""}"></span>`).join("")}
          </div>
        </div>
        <div class="endless-tag" style="--tag-color:${subject.color};--tag-bg:${subject.bg}">${subject.icon} ${subject.name} &middot; ${q.skillName}</div>
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}
          </div>
          ${renderHintButton()}
          <div class="explain-panel" id="explainPanel" role="status" aria-live="polite" hidden></div>
          <button class="next-btn" id="nextBtn" hidden>${qIdx === questionQueue.length - 1 ? "Continue" : "Next Question"} &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => {
      unbindKeys();
      finishSession();
      renderResults();
    });
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

    const q = questionQueue[qIdx];
    const correct = choiceIdx === q.answer;

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
      starsEarned += 1;
      coinsEarned += 4;
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
        qIdx++;
        renderQuestion();
      },
      { once: true }
    );
  }

  function renderVocabCard() {
    if (vIdx >= vocabQueue.length) return renderResults();
    const card = vocabQueue[vIdx];

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Review</button>
          <div class="quiz-progress-dots">
            ${vocabQueue.map((_, i) => `<span class="dot ${i < vIdx ? "done" : ""} ${i === vIdx ? "current" : ""}"></span>`).join("")}
          </div>
        </div>
        <div class="lesson-card">
          <p class="lesson-blurb">Do you remember what this word means?</p>
          <div class="flashcard-panel">
            <div class="flashcard ${vocabFlipped ? "is-flipped" : ""}" data-flip>
              <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front">${card.front}</div>
                <div class="flashcard-face flashcard-back">${card.back}</div>
              </div>
            </div>
            <p class="flashcard-hint">Tap the card to flip it</p>
          </div>
          <div class="results-actions" id="vocabGradeActions" ${vocabFlipped ? "" : "hidden"}>
            <button class="btn-primary" data-got-it>✅ Got it</button>
            <button class="btn-secondary" data-missed-it>❌ Didn't know it</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => {
      finishSession();
      renderResults();
    });
    root.querySelector("[data-flip]").addEventListener("click", () => {
      vocabFlipped = true;
      renderVocabCard();
    });
    root.querySelector("[data-got-it]")?.addEventListener("click", () => gradeVocab(true));
    root.querySelector("[data-missed-it]")?.addEventListener("click", () => gradeVocab(false));
  }

  function gradeVocab(gotIt) {
    gameState.recordVocabReview(vocabQueue[vIdx].front, gotIt);
    if (gotIt) vocabGotItCount++;
    vIdx++;
    vocabFlipped = false;
    renderVocabCard();
  }

  function renderResults() {
    unbindKeys();
    finishSession();
    const questionsDone = qIdx > 0 || mode === "questions";
    const vocabDone = vIdx > 0 || mode === "vocab";

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${REVIEW_COLOR};--island-bg:${REVIEW_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>Review Complete!</h1>
          ${questionsDone && questionQueue.length > 0 ? `<p class="results-score">${correctCount} / ${questionQueue.length} questions correct</p>` : ""}
          ${vocabDone && vocabQueue.length > 0 ? `<p class="results-score">${vocabGotItCount} / ${vocabQueue.length} vocab words remembered</p>` : ""}
          <p class="results-flag">🧠 Spaced repetition keeps this fresh. You'll see the tricky ones again soon.</p>
          ${renderProgressBanners(levelResult)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Back to Review Queue</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("reviewQueue"));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  renderIntro();
}
