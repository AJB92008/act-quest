// Optional Writing section: a real ACT Writing prompt (issue + three
// perspectives), a 40-minute timed draft, and a guided rubric-based
// self-assessment across the same four domains the real test reports on.
// There's no backend or model call in this app to grade the essay for
// real, so scoring is self-assessed against explicit guiding questions per
// domain rather than a black-box number — closer to how a student would
// actually use a rubric to sanity-check their own draft than a fake
// "AI-graded" number with nothing behind it.
import { essayPrompts } from "../data/essayPrompts.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud, showToast } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { renderProgressBanners } from "./progressBanner.js";

const WRITE_MINUTES = 40;
const TIME_WARNING_SECONDS = 5 * 60;
const TIME_CRITICAL_SECONDS = 60;
const MIN_WORDS_TO_SUBMIT = 50;
const ESSAY_COLOR = "#c2377a";
const ESSAY_BG = "#fdeaf3";

// Original guiding questions per domain, written for this app — not the
// real ACT's rubric language, just organized around the same four things
// the real test reports on, so the self-assessment maps onto a real score
// report a student might see later.
const DOMAINS = [
  {
    id: "ideas",
    name: "Ideas & Analysis",
    prompts: [
      "Did you actually engage with what each perspective is arguing, not just restate it?",
      "Is your own position clear, and does it go beyond just picking one of the three given perspectives?",
      "Did you address at least one meaningful complication or counterargument to your own view?",
    ],
  },
  {
    id: "development",
    name: "Development & Support",
    prompts: [
      "Is each claim backed by a specific reason, example, or explanation, not just asserted?",
      "Would a reader who disagreed with you still understand exactly why you believe what you believe?",
      "Did you avoid padding with repetition instead of adding real support?",
    ],
  },
  {
    id: "organization",
    name: "Organization",
    prompts: [
      "Does the essay have a clear opening, body, and conclusion a reader could outline?",
      "Do ideas build on each other in a logical order, with transitions that make the order clear?",
      "Could a paragraph be moved elsewhere in the essay without anything getting lost or confused?",
    ],
  },
  {
    id: "language",
    name: "Language Use & Conventions",
    prompts: [
      "Is the sentence structure varied, rather than the same pattern repeated throughout?",
      "Is word choice precise, not just the first word that came to mind?",
      "Are grammar, spelling, and punctuation clean enough that they don't distract from the ideas?",
    ],
  },
];

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function renderEssay(root, navigate, { fromPracticeTest = false, practiceTestResults = null } = {}) {
  let prompt = null;
  let essayText = "";
  let timerInterval = null;
  let timeLeft = WRITE_MINUTES * 60;
  let warnedAtFiveMin = false;
  let warnedAtOneMin = false;
  let domainScores = {};
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
    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <div class="lesson-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">✍️ Optional Writing Section</h1>
          <p class="lesson-blurb">${
            fromPracticeTest
              ? "Continuing from your practice test, same real ACT structure: one prompt, three perspectives, 40 minutes."
              : "Real ACT Writing format: one issue, three different perspectives on it, 40 minutes to respond."
          }</p>
          <p class="lesson-paragraph">You'll write a response that engages with the given perspectives and develops your own. When time's up (or you submit early), you'll self-score your draft against the same four domains the real test reports on: Ideas & Analysis, Development & Support, Organization, and Language Use & Conventions.</p>
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
    root.querySelector("[data-start]").addEventListener("click", () => {
      prompt = essayPrompts[Math.floor(Math.random() * essayPrompts.length)];
      essayText = "";
      timeLeft = WRITE_MINUTES * 60;
      warnedAtFiveMin = false;
      warnedAtOneMin = false;
      writingInProgress = true;
      renderWriting();
    });
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      const el = root.querySelector("#essayTimer");
      if (el) {
        el.textContent = formatTime(timeLeft);
        el.classList.toggle("is-time-warning", timeLeft <= TIME_WARNING_SECONDS && timeLeft > TIME_CRITICAL_SECONDS);
        el.classList.toggle("is-time-critical", timeLeft <= TIME_CRITICAL_SECONDS);
      }
      if (!warnedAtFiveMin && timeLeft <= TIME_WARNING_SECONDS && timeLeft > TIME_CRITICAL_SECONDS) {
        warnedAtFiveMin = true;
        showToast("⏱️ 5 minutes remaining");
      }
      if (!warnedAtOneMin && timeLeft > 0 && timeLeft <= TIME_CRITICAL_SECONDS) {
        warnedAtOneMin = true;
        showToast("⏱️ 1 minute remaining!");
      }
      if (timeLeft <= 0) {
        stopTimer();
        writingInProgress = false;
        renderSelfScore();
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
          <textarea id="essayInput" class="essay-textarea" placeholder="Write your response here…" spellcheck="true">${essayText}</textarea>
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
      renderSelfScore();
    });

    startTimer();
  }

  function renderSelfScore() {
    domainScores = {};
    const domainCards = DOMAINS.map(
      (d) => `
        <div class="lesson-card" style="margin-bottom:14px;">
          <h3 class="lesson-title" style="font-size:1.1rem;">${d.name}</h3>
          <ul class="weak-skill-list" style="margin-bottom:12px;">
            ${d.prompts.map((p) => `<li style="list-style:disc;margin-left:18px;">${p}</li>`).join("")}
          </ul>
          <div class="choices" data-domain="${d.id}">
            ${[1, 2, 3, 4, 5, 6].map((n) => `<button class="choice-btn" data-score="${n}" style="min-width:44px;">${n}</button>`).join("")}
          </div>
        </div>
      `
    ).join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen practice-test-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <h1 class="lesson-title">Self-Score Your Draft</h1>
        <p class="lesson-blurb">Reread what you wrote (${wordCount(essayText)} words), then rate each domain 1 (weak) to 6 (strong) using the guiding questions. Be honest &mdash; this only helps if the score reflects the actual draft.</p>
        <div class="stimulus-panel">
          <p class="passage-box">${essayText.replace(/\n/g, "<br>")}</p>
        </div>
        ${domainCards}
        <button class="btn-primary lesson-start-btn" id="calcScoreBtn" disabled>Calculate My Score &rarr;</button>
      </main>
    `;

    wireHud(root, goTo);
    root.querySelectorAll("[data-domain]").forEach((group) => {
      const domainId = group.dataset.domain;
      group.querySelectorAll("[data-score]").forEach((btn) => {
        btn.addEventListener("click", () => {
          domainScores[domainId] = Number(btn.dataset.score);
          group.querySelectorAll("[data-score]").forEach((b) => b.classList.toggle("is-selected", b === btn));
          const allRated = DOMAINS.every((d) => domainScores[d.id] != null);
          root.querySelector("#calcScoreBtn").disabled = !allRated;
        });
      });
    });

    root.querySelector("#calcScoreBtn").addEventListener("click", () => showResults());
  }

  function showResults() {
    // Same math the real ACT uses to fold two raters' 1-6 domain scores
    // into one 2-12 domain score, then averages the four domains into the
    // final 2-12 essay score — just with one rater (this player) standing
    // in for both.
    const sum = DOMAINS.reduce((s, d) => s + domainScores[d.id], 0);
    const totalScore = Math.max(2, Math.min(12, Math.round(sum / 2)));
    const starsEarned = 8 + totalScore;
    const coinsEarned = 30 + totalScore * 3;

    const outcome = gameState.recordEssayResult({
      promptId: prompt.id,
      wordCount: wordCount(essayText),
      domainScores: { ...domainScores },
      totalScore,
      starsEarned,
      coinsEarned,
    });

    const domainRows = DOMAINS.map((d) => `<li>${d.name}: ${domainScores[d.id]} / 6</li>`).join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen results-screen" style="--island-color:${ESSAY_COLOR};--island-bg:${ESSAY_BG}">
        <div class="results-card">
          <div class="results-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 160 })}</div>
          <h1>${outcome.isNewBest ? "New Best Essay Score!" : "Essay Complete!"}</h1>
          <p class="results-score">Essay Score: ${totalScore} / 12</p>
          ${
            outcome.isNewBest
              ? `<p class="results-flag">🏆 New personal best!</p>`
              : `<p class="results-flag results-flag-muted">Best essay score: ${gameState.essayBest}</p>`
          }
          ${renderProgressBanners(outcome)}
          <ul class="weak-skill-list">${domainRows}</ul>
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
