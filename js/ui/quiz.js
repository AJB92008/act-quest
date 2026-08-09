import { getSkill } from "../data/skills.js";
import { getQuestions, getPassageById, getStimulusById } from "../data/questions/index.js";
import { LESSONS } from "../data/lessons.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

const QUESTION_TIME = 20; // seconds budgeted per question, for the speed bonus

function renderPassage(passageId) {
  const p = getPassageById(passageId);
  if (!p) return "";
  return `
    <div class="stimulus-panel">
      <h4 class="stimulus-title">${p.title}</h4>
      <div class="passage-box">${p.text}</div>
    </div>
  `;
}

function renderTable(table) {
  return `
    <div class="stimulus-table-wrap">
      <table class="stimulus-table">
        <thead><tr>${table.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStimulus(stimulusId) {
  const s = getStimulusById(stimulusId);
  if (!s) return "";
  let body = `<p class="stimulus-intro">${s.intro}</p>`;
  if (s.tables) {
    body += s.tables
      .map((t) => `${t.label ? `<h5 class="stimulus-subtitle">${t.label}</h5>` : ""}${t.note ? `<p class="stimulus-note">${t.note}</p>` : ""}${renderTable(t)}`)
      .join("");
  } else if (s.table) {
    body += renderTable(s.table);
  }
  if (s.viewpoints) {
    body += `
      <div class="viewpoints">
        ${s.viewpoints
          .map((v) => `<div class="viewpoint-card"><h5>${v.name}</h5><p>${v.text}</p></div>`)
          .join("")}
      </div>
    `;
  }
  return `<div class="stimulus-panel"><h4 class="stimulus-title">${s.title}</h4>${body}</div>`;
}

export function renderQuiz(root, navigate, { skillId, subjectId }) {
  const { subject, skill } = getSkill(skillId);
  const questions = getQuestions(skillId);

  let idx = 0;
  let correctCount = 0;
  let streak = 0;
  let starsEarned = 0;
  let coinsEarned = 0;
  let timerInterval = null;
  let timeLeft = QUESTION_TIME;
  let answered = false;

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  // The HUD's nav buttons (Map/Progress/Shop/Monster) navigate away directly;
  // without this, a running question timer keeps ticking against a screen
  // that no longer has a #monsterReactor/#timerFill, and throws once it hits
  // zero and tries to auto-submit. Route HUD navigation through here so the
  // timer always gets torn down first, same as the explicit quit buttons.
  function navigateAway(screen, params) {
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

  function renderLesson() {
    const paragraphs = LESSONS[skillId] || [];
    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen lesson-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <button class="back-btn" data-quit>&larr; Quit to Island</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getAvatar(), { size: 90 })}</div>
          <h1 class="lesson-title">${skill.name}</h1>
          <p class="lesson-blurb">${skill.blurb}</p>
          ${paragraphs.map((p) => `<p class="lesson-paragraph">${p}</p>`).join("")}
          <div class="lesson-timer-setting">
            <label class="toggle-label">
              <input type="checkbox" id="timerToggle" ${gameState.timerEnabled ? "checked" : ""} />
              ⏱️ Timed questions
            </label>
            <p class="lesson-timer-hint">Turn off if you'd rather take your time on each question.</p>
          </div>
          <button class="btn-primary lesson-start-btn" data-start-quiz>Start Quiz &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-quit]").addEventListener("click", () => navigateAway("island", { subjectId }));
    root.querySelector("[data-start-quiz]").addEventListener("click", () => renderQuestion());
    root.querySelector("#timerToggle").addEventListener("change", (e) => {
      gameState.setTimerEnabled(e.target.checked);
    });
  }

  function renderQuestion() {
    answered = false;
    const q = questions[idx];
    const stimulusHTML = q.passageId
      ? renderPassage(q.passageId)
      : q.stimulusId
      ? renderStimulus(q.stimulusId)
      : "";

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen quiz-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; Quit to Island</button>
          <div class="quiz-progress-dots">
            ${questions
              .map((_, i) => `<span class="dot ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}"></span>`)
              .join("")}
          </div>
          <div class="quiz-streak">🔥 Streak: ${streak}</div>
        </div>
        <h2 class="quiz-skill-name">${skill.name}</h2>
        ${gameState.timerEnabled ? `<div class="timer-bar-track"><div class="timer-bar-fill" id="timerFill"></div></div>` : ""}
        ${stimulusHTML}
        <div class="question-card">
          <div class="monster-reactor" id="monsterReactor">${monsterSVG(gameState.getAvatar(), { size: 90 })}</div>
          <p class="question-text">${q.q}</p>
          <div class="choices" id="choices">
            ${q.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c}</button>`).join("")}
          </div>
          <div class="explain-panel" id="explainPanel" hidden></div>
          <button class="next-btn" id="nextBtn" hidden>${
            idx === questions.length - 1 ? "See Results" : "Next Question"
          } &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-quit]").addEventListener("click", () => navigateAway("island", { subjectId }));
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(Number(btn.dataset.choice)));
    });
    if (gameState.timerEnabled) startTimer();
  }

  function selectChoice(choiceIdx) {
    if (answered) return;
    answered = true;
    stopTimer();

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
    const total = questions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const outcome = gameState.recordQuizResult(skillId, {
      correctCount,
      totalCount: total,
      starsEarned,
      coinsEarned,
    });
    const passed = scorePct >= 70;

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen results-screen" style="--island-color:${subject.color};--island-bg:${subject.bg}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getAvatar(), { size: 130 })}</div>
          <h1>${passed ? "Level Cleared!" : "Good Effort!"}</h1>
          <p class="results-score">${correctCount} / ${total} correct (${scorePct}%)</p>
          ${
            outcome.justMastered
              ? `<p class="results-flag">🏅 Skill mastered!</p>`
              : passed
              ? `<p class="results-flag">✅ Passing score</p>`
              : `<p class="results-flag results-flag-muted">Score 70% or higher to master this skill.</p>`
          }
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          <div class="results-actions">
            <button class="btn-primary" data-retry>Retry Level</button>
            <button class="btn-secondary" data-island>Back to Island</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, navigateAway);
    root.querySelector("[data-retry]").addEventListener("click", () => navigate("quiz", { skillId, subjectId }));
    root.querySelector("[data-island]").addEventListener("click", () => navigate("island", { subjectId }));
    root.querySelector("[data-map]").addEventListener("click", () => navigate("map"));
  }

  renderLesson();
}
