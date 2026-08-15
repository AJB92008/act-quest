// Placement Diagnostic: a short, cross-subject sample offered at the end
// of onboarding (and retakeable any time from the World Map shortcut) so a
// brand-new player's Weak Skill Review and Adaptive Practice have real
// per-question data to work from immediately, instead of a cold start
// through dozens of real lessons before either system has anything to go
// on. Unlike Weak Skill Review (which needs existing weak-skill history to
// even build a session) this works with zero prior data — that's the
// entire point — by drawing from getDiagnosticQuestions() instead, which
// spreads across as many distinct skills as it can rather than weighting
// toward skills that already look weak.
import { getSkill, getSubject } from "../data/skills.js";
import { getDiagnosticQuestions, getWeakPatterns, preloadAllSubjects } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderQuestionStimulus } from "./stimulusPanels.js";
import { bindQuizKeys } from "./keyboardNav.js";
import { renderHintButton, wireHintButton, removeHintButton } from "./hint.js";
import { renderProgressBanners } from "./progressBanner.js";

const QUESTION_TIME = 25;
const SESSION_SIZE = 24;
const DIAG_COLOR = "#2a6df5";
const DIAG_BG = "#eaf1ff";

export function renderDiagnostic(root, navigate, { onboarding = false } = {}) {
  const dataReady = preloadAllSubjects();
  let questions = [];
  // Per-skill session tally (not gameState's 5-attempt-minimum weak-skill
  // read, which won't have enough data yet right after a single diagnostic
  // pass) — this is what actually drives the results screen's "revisit
  // first" list, built purely from what happened in this one session.
  const sessionSkillTally = {}; // skillId -> { skillName, subjectId, attempts, correct }

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
      ${onboarding ? "" : hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${DIAG_COLOR};--island-bg:${DIAG_BG}">
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🧪 Placement Diagnostic</h1>
          <p class="lesson-blurb">Loading a sample from every subject…</p>
        </div>
      </main>
    `;
    if (!onboarding) wireHud(root, goTo);
  }

  function renderIntro() {
    root.innerHTML = `
      ${onboarding ? "" : hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${DIAG_COLOR};--island-bg:${DIAG_BG}">
        ${onboarding ? "" : `<button class="back-btn" data-back>&larr; Back to Map</button>`}
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">🧪 Placement Diagnostic</h1>
          <p class="lesson-blurb">${SESSION_SIZE} questions pulled from across every subject and skill, roughly 15-20 minutes. No penalty for missing any of them &mdash; this just gives Weak Skill Review and Adaptive Practice something real to target from your very first session instead of starting from nothing.</p>
          <p class="lesson-paragraph">${onboarding ? "Totally optional. You can also skip it and take it later from the World Map." : "Retaking it adds fresh data on top of whatever you've already played."}</p>
          <button class="btn-primary lesson-start-btn" data-start-diag>Start Diagnostic &rarr;</button>
          <button class="btn-secondary lesson-start-btn" data-skip>${onboarding ? "Skip for Now" : "Back to Map"}</button>
        </div>
      </main>
    `;

    if (!onboarding) wireHud(root, goTo);
    root.querySelector("[data-back]")?.addEventListener("click", () => navigate("map"));
    root.querySelector("[data-skip]").addEventListener("click", () => navigate("map"));
    const startBtn = root.querySelector("[data-start-diag]");
    startBtn.addEventListener("click", () => {
      startBtn.disabled = true;
      startBtn.textContent = "Loading…";
      dataReady.then(() => {
        questions = getDiagnosticQuestions(SESSION_SIZE);
        idx = 0;
        renderQuestion();
      });
    });
  }

  function renderQuestion() {
    answered = false;
    const q = questions[idx];
    const subject = getSubject(q.subjectId);
    const stimulusHTML = renderQuestionStimulus(q);

    root.innerHTML = `
      ${onboarding ? "" : hudHTML("map")}
      <main class="screen weak-review-screen" style="--island-color:${DIAG_COLOR};--island-bg:${DIAG_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Diagnostic</button>
          <div class="quiz-progress-dots">
            ${questions.map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`).join("")}
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
          <button class="next-btn" id="nextBtn" hidden>${idx === questions.length - 1 ? "See Results" : "Next Question"} &rarr;</button>
        </div>
      </main>
    `;

    if (!onboarding) wireHud(root, goTo);
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

    // Both calls matter here, not just recordQuestionAnswer: this also
    // feeds gameState's skill-level attempts/correct (what getWeakSkills()
    // reads) the same way Weak Skill Review's own answers do, so a
    // diagnostic hit genuinely counts toward that 5-attempt threshold
    // rather than only feeding per-question stats and patterns.
    gameState.recordWeakReviewAnswer(q.skillId, correct);
    gameState.recordQuestionAnswer(q.skillId, q.bankIndex, correct, choiceIdx);

    const tally = sessionSkillTally[q.skillId] || { skillName: q.skillName, subjectId: q.subjectId, attempts: 0, correct: 0 };
    tally.attempts += 1;
    if (correct) tally.correct += 1;
    sessionSkillTally[q.skillId] = tally;

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

    // Worst-first, missed-at-least-once skills from this session only —
    // gameState.getWeakSkills() would come back empty right after a single
    // diagnostic pass (it needs 5 attempts on the same skill; this gives
    // at most 1 per skill by design, for breadth), so the "revisit first"
    // list here is built straight from what actually happened in this
    // session instead.
    const revisitSkills = Object.entries(sessionSkillTally)
      .map(([skillId, t]) => ({ skillId, ...t, accuracy: t.correct / t.attempts }))
      .filter((s) => s.correct < s.attempts)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6);

    const weakPatterns = getWeakPatterns((skillId, bankIndex) => gameState.getQuestionStat(skillId, bankIndex));

    const revisitHTML =
      revisitSkills.length > 0
        ? `
          <p class="lesson-paragraph">Worth revisiting first:</p>
          <div class="drill-skill-list">${revisitSkills
            .map((s) => {
              const { subject } = getSkill(s.skillId);
              return `
                <button class="drill-skill-row" data-focus-skill="${s.skillId}" data-subject-id="${s.subjectId}" type="button">
                  <span class="drill-skill-name">${subject.icon} ${s.skillName}</span>
                  <span class="drill-skill-meta">${Math.round(s.accuracy * 100)}%</span>
                </button>
              `;
            })
            .join("")}</div>
        `
        : `<p class="lesson-paragraph">You handled this spread well &mdash; no single skill stood out as shaky yet. Keep playing and Weak Skill Review will sharpen up as more data comes in.</p>`;

    const patternsHTML =
      weakPatterns.length > 0
        ? `<p class="lesson-paragraph">Patterns already showing up across subjects:</p><ul class="weak-skill-list">${weakPatterns
            .map((p) => `<li>${p.label} <span class="weak-skill-pct">${Math.round(p.accuracy * 100)}%</span></li>`)
            .join("")}</ul>`
        : "";

    root.innerHTML = `
      ${onboarding ? "" : hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${DIAG_COLOR};--island-bg:${DIAG_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>Diagnostic Complete!</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          <p class="results-flag">🧪 Weak Skill Review and Adaptive Practice now have real data to work from.</p>
          ${renderProgressBanners(levelResult)}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          ${revisitHTML}
          ${patternsHTML}
          <div class="results-actions">
            <button class="btn-primary" data-map>${onboarding ? "Start Exploring" : "World Map"}</button>
            <button class="btn-secondary" data-retry>Retake Diagnostic</button>
          </div>
        </div>
      </main>
    `;

    if (!onboarding) wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => goTo("diagnostic"));
    root.querySelector("[data-map]").addEventListener("click", () => goTo("map"));
    root.querySelectorAll("[data-focus-skill]").forEach((btn) => {
      btn.addEventListener("click", () => goTo("skillPath", { skillId: btn.dataset.focusSkill, subjectId: btn.dataset.subjectId }));
    });
  }

  renderLoading();
  dataReady.then(renderIntro);
}
