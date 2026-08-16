// Optional Writing section: a real ACT Writing prompt (issue + three
// perspectives), a timed draft, and an automated score across the same
// four domains the real test reports on. There's no backend or model call
// in this app to grade the essay with a real language model (a static
// site can't hide an API key client-side), so scoring runs through
// scoreEssay() (data/essayScoring.js) — a genuine text-heuristic grader,
// not a placeholder, but still a proxy for writing quality rather than
// real language understanding. The results screen shows the specific
// signals behind each domain score for exactly that reason: an opaque
// auto-generated number would be less trustworthy than one that shows its
// work.
import { essayPrompts } from "../data/essayPrompts.js";
import { scoreEssay } from "../data/essayScoring.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderProgressBanners } from "./progressBanner.js";

// 40 minutes matches the real, full-length ACT Writing test; the shorter
// options exist purely for quicker practice reps (drafting under real time
// pressure without committing to the full 40 minutes every time).
const TIME_OPTIONS = [
  { minutes: 5, label: "5 min", blurb: "Quick warm-up" },
  { minutes: 10, label: "10 min", blurb: "Quick practice" },
  { minutes: 25, label: "25 min", blurb: "Extended practice" },
  { minutes: 40, label: "40 min", blurb: "Real ACT timing" },
];
const DEFAULT_MINUTES = 40;
const TIME_WARNING_SECONDS = 5 * 60;
const TIME_CRITICAL_SECONDS = 60;
const MIN_WORDS_TO_SUBMIT = 50;
const ESSAY_COLOR = "#c2377a";
const ESSAY_BG = "#fdeaf3";

const DOMAIN_NAMES = {
  ideas: "Ideas & Analysis",
  development: "Development & Support",
  organization: "Organization",
  language: "Language Use & Conventions",
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function renderEssay(root, navigate, { fromPracticeTest = false, practiceTestResults = null } = {}) {
  let prompt = null;
  let essayText = "";
  let timerInterval = null;
  let selectedMinutes = DEFAULT_MINUTES;
  let timeLeft = DEFAULT_MINUTES * 60;
  let warnedAtFiveMin = false;
  let warnedAtOneMin = false;
  let writingInProgress = false;

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function goTo(screen, params) {
    if (writingInProgress && !confirm("Leave the Writing section? Your draft will be lost.")) return;
    stopTimer();
    writingInProgress = false;
    navigate(screen, params);
  }

  function renderIntro() {
    const timeChoices = TIME_OPTIONS.map(
      (t) => `
        <button class="choice-btn ${t.minutes === selectedMinutes ? "is-selected" : ""}" data-minutes="${t.minutes}" style="min-width:100px;">
          <strong>${t.label}</strong><br><span style="font-size:0.8rem;">${t.blurb}</span>
        </button>
      `
    ).join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">✍️ Optional Writing Section</h1>
          <p class="lesson-blurb">${
            fromPracticeTest
              ? "Continuing from your practice test, same real ACT structure: one prompt, three perspectives."
              : "Real ACT Writing format: one issue, three different perspectives on it."
          }</p>
          <p class="lesson-paragraph">You'll write a response that engages with the given perspectives and develops your own. When time's up (or you submit early), your draft is scored automatically across the same four domains the real test reports on: Ideas & Analysis, Development & Support, Organization, and Language Use & Conventions.</p>
          <p class="lesson-paragraph">Time limit:</p>
          <div class="choices" id="timeChoices">${timeChoices}</div>
          ${
            gameState.essayBest > 0
              ? `<div class="endless-best-tile"><span class="endless-best-num">${gameState.essayBest}</span><span>Best Essay Score</span></div>`
              : ""
          }
          <button class="btn-primary lesson-start-btn" data-start>Start Writing &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
    root.querySelectorAll("[data-minutes]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedMinutes = Number(btn.dataset.minutes);
        root.querySelectorAll("[data-minutes]").forEach((b) => b.classList.toggle("is-selected", Number(b.dataset.minutes) === selectedMinutes));
      });
    });
    root.querySelector("[data-start]").addEventListener("click", () => {
      prompt = essayPrompts[Math.floor(Math.random() * essayPrompts.length)];
      essayText = "";
      timeLeft = selectedMinutes * 60;
      warnedAtFiveMin = false;
      warnedAtOneMin = false;
      writingInProgress = true;
      renderWriting();
    });
  }

  function startTimer() {
    stopTimer();
    // Scaled down for the shorter practice options so "5 minutes
    // remaining" doesn't fire immediately in a 5-minute session — full
    // 5-min/1-min real-ACT-style call-outs only apply once the session is
    // long enough for them to mean something (unchanged for the 25/40 min
    // options, which both comfortably exceed these).
    const totalSeconds = selectedMinutes * 60;
    const warningThreshold = Math.min(TIME_WARNING_SECONDS, Math.floor(totalSeconds * 0.25));
    const criticalThreshold = Math.min(TIME_CRITICAL_SECONDS, Math.floor(totalSeconds * 0.05));
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      const el = root.querySelector("#essayTimer");
      if (el) {
        el.textContent = formatTime(timeLeft);
        el.classList.toggle("is-time-warning", timeLeft <= warningThreshold && timeLeft > criticalThreshold);
        el.classList.toggle("is-time-critical", timeLeft <= criticalThreshold);
      }
      if (!warnedAtFiveMin && timeLeft <= warningThreshold && timeLeft > criticalThreshold) {
        warnedAtFiveMin = true;
        showToast(`⏱️ ${formatTime(warningThreshold)} remaining`);
      }
      if (!warnedAtOneMin && timeLeft > 0 && timeLeft <= criticalThreshold) {
        warnedAtOneMin = true;
        showToast(`⏱️ ${formatTime(criticalThreshold)} remaining!`);
      }
      if (timeLeft <= 0) {
        stopTimer();
        writingInProgress = false;
        showResults();
      }
    }, 1000);
  }

  function renderWriting() {
    const perspectivesHTML = prompt.perspectives
      .map((p) => `<p class="stimulus-note" style="font-style:normal;margin-bottom:10px;"><strong>${p.label}:</strong> ${p.text}</p>`)
      .join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen quiz-screen practice-test-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <div class="quiz-top">
          <button class="back-btn" data-quit>&larr; End Early</button>
          <div class="practice-test-timer" id="essayTimer">${formatTime(timeLeft)}</div>
        </div>
        <div class="stimulus-panel">
          <h4 class="stimulus-title">${prompt.title}</h4>
          <p class="stimulus-intro">${prompt.issueStatement}</p>
          ${perspectivesHTML}
        </div>
        <div class="question-card">
          <textarea id="essayInput" class="essay-textarea" placeholder="Write your response here…" spellcheck="true">${escapeHtml(essayText)}</textarea>
          <p class="lesson-paragraph" id="wordCountLabel">${wordCount(essayText)} words</p>
          <button class="btn-primary lesson-start-btn" id="submitBtn">Submit Essay &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-quit]").addEventListener("click", () => {
      if (!confirm("Leave the Writing section? Your draft will be lost.")) return;
      stopTimer();
      writingInProgress = false;
      navigate("dashboard");
    });

    const textarea = root.querySelector("#essayInput");
    const wordLabel = root.querySelector("#wordCountLabel");
    textarea.addEventListener("input", () => {
      essayText = textarea.value;
      wordLabel.textContent = `${wordCount(essayText)} words`;
    });

    root.querySelector("#submitBtn").addEventListener("click", () => {
      essayText = textarea.value;
      if (wordCount(essayText) < MIN_WORDS_TO_SUBMIT && !confirm(`Your draft is only ${wordCount(essayText)} words. Submit anyway?`)) {
        return;
      }
      stopTimer();
      writingInProgress = false;
      showResults();
    });

    startTimer();
  }

  function showResults() {
    const { domainScores, signals } = scoreEssay(essayText, prompt);
    // Same math the real ACT uses to fold two raters' 1-6 domain scores
    // into one 2-12 domain score, then averages the four domains into the
    // final 2-12 essay score — just with the heuristic grader standing in
    // for both raters.
    const sum = Object.values(domainScores).reduce((s, n) => s + n, 0);
    const totalScore = Math.max(2, Math.min(12, Math.round(sum / 2)));
    const starsEarned = 8 + totalScore;
    const coinsEarned = 30 + totalScore * 3;

    const outcome = gameState.recordEssayResult({
      promptId: prompt.id,
      wordCount: wordCount(essayText),
      domainScores,
      totalScore,
      starsEarned,
      coinsEarned,
    });

    const domainCards = Object.entries(DOMAIN_NAMES)
      .map(
        ([id, name]) => `
          <div class="lesson-card" style="margin-bottom:14px;">
            <h3 class="lesson-title" style="font-size:1.05rem;">${name}: ${domainScores[id]} / 6</h3>
            <ul class="weak-skill-list">
              ${signals[id].map((s) => `<li style="list-style:disc;margin-left:18px;">${s}</li>`).join("")}
            </ul>
          </div>
        `
      )
      .join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen results-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.isNewBest ? "New Best Essay Score!" : "Essay Complete!"}</h1>
          <p class="results-score">Essay Score: ${totalScore} / 12</p>
          <p class="results-flag results-flag-muted">🤖 Automated score from an algorithm, not a real grader &mdash; a rough estimate, not an official read on your writing.</p>
          ${
            outcome.isNewBest
              ? `<p class="results-flag">🏆 New personal best!</p>`
              : `<p class="results-flag results-flag-muted">Best essay score: ${gameState.essayBest}</p>`
          }
          ${renderProgressBanners(outcome)}
          ${domainCards}
          <div class="results-stats">
            <span>⭐ +${starsEarned} stars</span>
            <span>🪙 +${coinsEarned} coins</span>
          </div>
          ${fromPracticeTest && practiceTestResults ? `<p class="results-flag results-flag-muted">Practice Test Composite: ${practiceTestResults.composite} / 36</p>` : ""}
          <div class="results-actions">
            <button class="btn-primary" data-retry>Write Another Essay</button>
            <button class="btn-secondary" data-dashboard>Back to Progress</button>
            <button class="btn-secondary" data-map>World Map</button>
          </div>
        </div>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelector("[data-retry]").addEventListener("click", () => renderEssay(root, navigate));
    root.querySelector("[data-dashboard]").addEventListener("click", () => navigate("dashboard"));
    root.querySelector("[data-map]").addEventListener("click", () => navigate("map"));
  }

  renderIntro();
}
