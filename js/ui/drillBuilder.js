// Custom Drill Builder: pick a subject and exactly which skills to
// practice, instead of working through the fixed lesson path in order.
// Pulls straight from each selected skill's full 100-question bank
// (shuffled, evenly split across skills) rather than the difficulty-sorted
// lesson slices getLessonQuestions() builds — a drill is meant to be a
// grab-bag review, not a curriculum stop.
import { getTestSubjects, getSubject } from "../data/tests.js";
import { getFullBank, preloadSubject } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";
import { isWrittenQuestion, checkWrittenAnswer, renderWrittenAnswerHTML, wireWrittenAnswer, markWrittenAnswer } from "./writtenAnswer.js";

// Matches this feature's World Map shortcut node — an amber, distinct from
// the app's default purple (already used everywhere as the primary accent,
// which made Custom Drill blend in as just "another purple screen").
const DRILL_COLOR = "#ff9f38";
const DRILL_BG = "#fff4e6";
const DRILL_SIZE = 12;

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function renderDrillBuilder(root, navigate, { testId = "act" } = {}) {
  const subjects = getTestSubjects(testId);
  let subjectId = subjects[0].id;
  let selectedSkillIds = new Set();
  let questions = [];
  let idx = 0;
  let correctCount = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let answered = false;
  let unbindKeys = () => {};
  let levelResult = {};

  function goTo(screen, params) {
    unbindKeys();
    navigate(screen, params);
  }

  function renderBuilder() {
    const subject = getSubject(subjectId);
    const tabs = subjects.map(
      (s) => `<button class="btn-secondary ${s.id === subjectId ? "is-active" : ""}" data-subject-tab="${s.id}">${s.icon} ${s.name}</button>`
    ).join("");
    const skillRows = subject.skills
      .map((skill) => {
        const p = gameState.getSkillProgress(skill.id);
        const checked = selectedSkillIds.has(skill.id);
        return `
          <label class="drill-skill-row ${checked ? "is-checked" : ""}">
            <input type="checkbox" data-skill-check="${skill.id}" ${checked ? "checked" : ""} />
            <span class="drill-skill-name">${skill.name}</span>
            <span class="drill-skill-meta">${p.mastered ? "✅ Mastered" : p.attempts > 0 ? `${Math.round((p.correct / p.attempts) * 100)}%` : "Not started"}</span>
          </label>
        `;
      })
      .join("");

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${DRILL_COLOR};--island-bg:${DRILL_BG}">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🎛️ Custom Drill</h1>
          <p class="lesson-blurb">Pick a subject, check off exactly the skills you want, and drill a ${DRILL_SIZE}-question set pulled straight from those banks.</p>
          <div class="drill-tabs">${tabs}</div>
          <div class="drill-skill-list">${skillRows}</div>
          <div class="results-actions">
            <button class="btn-primary lesson-start-btn" data-start-drill ${selectedSkillIds.size === 0 ? "disabled" : ""}>Start Drill (${selectedSkillIds.size} skill${selectedSkillIds.size === 1 ? "" : "s"} selected) &rarr;</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));
    root.querySelectorAll("[data-subject-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        subjectId = btn.dataset.subjectTab;
        selectedSkillIds = new Set();
        preloadSubject(subjectId).then(renderBuilder);
      });
    });
    root.querySelectorAll("[data-skill-check]").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.dataset.skillCheck;
        if (input.checked) selectedSkillIds.add(id);
        else selectedSkillIds.delete(id);
        renderBuilder();
      });
    });
    const startBtn = root.querySelector("[data-start-drill]");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        startBtn.disabled = true;
        startBtn.textContent = "Loading…";
        preloadSubject(subjectId).then(() => {
          const pool = [];
          for (const skillId of selectedSkillIds) {
            const skill = subject.skills.find((s) => s.id === skillId);
            getFullBank(skillId).forEach((q, bankIndex) => {
              pool.push({ ...q, skillId, skillName: skill.name, subjectId, bankIndex });
            });
          }
          questions = shuffled(pool).slice(0, DRILL_SIZE);
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

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${DRILL_COLOR};--island-bg:${DRILL_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Drill</button>
          <div class="quiz-progress-dots">
            ${questions.map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`).join("")}
          </div>
        </div>
        <div class="endless-tag" style="--tag-color:${subject.color};--tag-bg:${subject.bg}">${subject.icon} ${subject.name} &middot; ${q.skillName}</div>
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="question-text">${q.q}</p>
          ${isWrittenQuestion(q) ? renderWrittenAnswerHTML() : `<div class="choices" id="choices">${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}</div>`}
          ${isWrittenQuestion(q) ? "" : renderHintButton()}
          <div class="explain-panel" id="explainPanel" role="status" aria-live="polite" hidden></div>
          <button class="next-btn" id="nextBtn" hidden>${idx === questions.length - 1 ? "See Results" : "Next Question"} &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => goTo("drillBuilder", { testId }));
    if (isWrittenQuestion(q)) {
      wireWrittenAnswer(root, (value) => selectWritten(value));
    } else {
      root.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => selectChoice(Number(btn.dataset.choice)));
      });
      wireHintButton(root, q);
    }

    unbindKeys();
    unbindKeys = bindQuizKeys({
      onChoice: (i) => {
        if (!isWrittenQuestion(q) && i < q.choices.length) selectChoice(i);
      },
      onNext: () => root.querySelector("#nextBtn:not([hidden])")?.click(),
    });
  }

  function selectChoice(choiceIdx) {
    if (answered) return;
    const q = questions[idx];
    const correct = choiceIdx === q.answer;
    finishAnswer(correct, choiceIdx, null);

    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.disabled = true;
      const i = Number(btn.dataset.choice);
      if (i === q.answer) btn.classList.add("is-correct");
      else if (i === choiceIdx) btn.classList.add("is-incorrect");
    });
  }

  function selectWritten(userInput) {
    if (answered) return;
    const q = questions[idx];
    const correct = checkWrittenAnswer(userInput, q);
    finishAnswer(correct, null, userInput);
    markWrittenAnswer(root, correct);
  }

  function finishAnswer(correct, choiceIdx, chosenText) {
    answered = true;
    removeHintButton(root);

    const q = questions[idx];
    const reactor = root.querySelector("#monsterReactor");
    reactor.classList.add(correct ? "react-happy" : "react-sad");

    gameState.recordQuestionAnswer(q.skillId, q.bankIndex, correct, choiceIdx, chosenText);

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
      : `<strong>Not quite. The correct answer: ${isWrittenQuestion(q) ? q.answer : q.choices[q.answer]}</strong><p>${q.explain}</p>`;

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
    levelResult = gameState.finishDrill({ starsEarned, coinsEarned }) || {};

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${DRILL_COLOR};--island-bg:${DRILL_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>Drill Complete!</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          ${renderProgressBanners(levelResult)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>New Drill</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("drillBuilder", { testId }));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
  }

  preloadSubject(subjectId).then(renderBuilder);
}
