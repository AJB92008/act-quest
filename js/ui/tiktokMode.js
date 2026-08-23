// TikTok Mode: a dev-mode-only, recording-friendly single-question card —
// full-screen, dark, portrait-oriented, big bold text — meant to be
// screen-recorded and posted as a "can you solve this?" clip. This app has
// no backend/API integration, so it can't post to TikTok itself; this just
// gives a clean vertical-video-shaped view to record from. Reached by
// typing "TIK" while the developer panel is open (see devPanel.js) —
// there's no ordinary in-game entry point, since it's a content-creation
// tool rather than part of gameplay.
import { getTestSubjects, getSubject, isSubjectPlayable, TESTS } from "../data/tests.js";
import { preloadSubject, getFullBank } from "../data/questions/index.js";
import { isWrittenQuestion } from "./writtenAnswer.js";

const TIKTOK_COLOR = "#25f4ee";
const TIKTOK_BG = "#0a0a0f";
const REVEAL_SECONDS = 10;

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Read the correct answer out loud (Web Speech API — built into every
// modern browser, no backend/library needed) so a recording captures a
// spoken reveal instead of relying on the person filming to read it
// themselves. Silently does nothing on a browser without speech support
// rather than erroring — this is a nice-to-have for the recording, not
// something the screen depends on.
function speakAnswer(q) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const text = isWrittenQuestion(q)
    ? `The correct answer is ${q.answer}.`
    : `The correct answer is ${String.fromCharCode(65 + q.answer)}: ${q.choices[q.answer]}`;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function renderTiktokMode(root, navigate, { testId = "act" } = {}) {
  let currentTestId = testId;
  let subjectId = getTestSubjects(currentTestId).find((s) => isSubjectPlayable(s))?.id || getTestSubjects(currentTestId)[0].id;
  let selectedSkillIds = new Set();
  let pool = [];
  let current = null;
  let revealed = false;
  let countdown = REVEAL_SECONDS;
  let countdownTimer = null;

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // Called both when the countdown hits 0 and when the reveal button is
  // tapped early — either way this is the single place that flips
  // `revealed`, so speakAnswer() only ever fires once per question.
  function reveal() {
    stopCountdown();
    revealed = true;
    renderCard();
    speakAnswer(current);
  }

  function startCountdown() {
    stopCountdown();
    countdown = REVEAL_SECONDS;
    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        reveal();
        return;
      }
      const label = root.querySelector("[data-countdown]");
      if (label) label.textContent = `👆 Auto-reveals in ${countdown}s — tap to reveal now`;
    }, 1000);
  }

  function renderPicker() {
    const testTabs = TESTS.filter((t) => getTestSubjects(t.id).some((s) => isSubjectPlayable(s)))
      .map((t) => `<button class="btn-secondary ${t.id === currentTestId ? "is-active" : ""}" data-test-tab="${t.id}">${t.icon} ${t.name}</button>`)
      .join("");

    const subjects = getTestSubjects(currentTestId);
    const subjectTabs = subjects
      .map((s) => `<button class="btn-secondary ${s.id === subjectId ? "is-active" : ""}" data-subject-tab="${s.id}" ${isSubjectPlayable(s) ? "" : "disabled"}>${s.icon} ${s.name}</button>`)
      .join("");

    const subject = getSubject(subjectId);
    const skillRows = (subject.skills || [])
      .map((skill) => {
        const checked = selectedSkillIds.has(skill.id);
        return `
          <label class="drill-skill-row ${checked ? "is-checked" : ""}">
            <input type="checkbox" data-skill-check="${skill.id}" ${checked ? "checked" : ""} />
            <span class="drill-skill-name">${skill.name}</span>
          </label>
        `;
      })
      .join("");

    root.innerHTML = `
      <main class="screen weak-review-screen" style="--island-color:${TIKTOK_COLOR};--island-bg:#e6fdfc">
        <button class="back-btn" data-exit>&larr; Exit TikTok Mode</button>
        <div class="lesson-card">
          <h1 class="lesson-title">🎬 TikTok Mode</h1>
          <p class="lesson-blurb">Pick a test, subject, and skill(s). We'll pull one question at a time into a big vertical card you can screen-record and post — this app can't post to TikTok for you, it just makes a clip-friendly view.</p>
          <div class="drill-tabs">${testTabs}</div>
          <div class="drill-tabs">${subjectTabs}</div>
          <div class="drill-skill-list">${skillRows || "<p>This subject has no skills yet.</p>"}</div>
          <div class="results-actions">
            <button class="btn-primary lesson-start-btn" data-start-tiktok ${selectedSkillIds.size === 0 ? "disabled" : ""}>Start (${selectedSkillIds.size} skill${selectedSkillIds.size === 1 ? "" : "s"} selected) &rarr;</button>
          </div>
        </div>
      </main>
    `;

    root.querySelector("[data-exit]").addEventListener("click", () => navigate("map"));

    root.querySelectorAll("[data-test-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTestId = btn.dataset.testTab;
        subjectId = getTestSubjects(currentTestId).find((s) => isSubjectPlayable(s))?.id || getTestSubjects(currentTestId)[0].id;
        selectedSkillIds = new Set();
        preloadSubject(subjectId).then(renderPicker);
      });
    });
    root.querySelectorAll("[data-subject-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        subjectId = btn.dataset.subjectTab;
        selectedSkillIds = new Set();
        preloadSubject(subjectId).then(renderPicker);
      });
    });
    root.querySelectorAll("[data-skill-check]").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.dataset.skillCheck;
        if (input.checked) selectedSkillIds.add(id);
        else selectedSkillIds.delete(id);
        renderPicker();
      });
    });

    const startBtn = root.querySelector("[data-start-tiktok]");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        startBtn.disabled = true;
        startBtn.textContent = "Loading…";
        preloadSubject(subjectId).then(() => {
          pool = [];
          for (const skillId of selectedSkillIds) {
            const skill = subject.skills.find((s) => s.id === skillId);
            getFullBank(skillId).forEach((q) => pool.push({ ...q, skillName: skill.name, subjectName: subject.name, subjectIcon: subject.icon }));
          }
          pool = shuffled(pool);
          pickNext();
        });
      });
    }
  }

  function pickNext() {
    stopCountdown();
    stopSpeaking();
    if (pool.length === 0) {
      renderPicker();
      return;
    }
    current = pool.pop();
    revealed = false;
    renderCard();
  }

  function renderCard() {
    const q = current;
    const written = isWrittenQuestion(q);
    const passageHTML = q.passage ? `<p class="tiktok-passage">${q.passage}</p>` : "";

    const revealPromptHTML = `<button class="tiktok-tap-reveal" data-reveal data-countdown>👆 Auto-reveals in ${countdown}s — tap to reveal now</button>`;

    let answerAreaHTML;
    if (written) {
      answerAreaHTML = revealed
        ? `<div class="tiktok-reveal"><span class="tiktok-reveal-label">Answer</span><p class="tiktok-answer-value">${q.answer}</p><p class="tiktok-explain">${q.explain}</p></div>`
        : revealPromptHTML;
    } else {
      const choicesHTML = q.choices
        .map((c, i) => `<div class="tiktok-choice ${revealed && i === q.answer ? "is-correct" : ""}">${String.fromCharCode(65 + i)}. ${c}</div>`)
        .join("");
      answerAreaHTML = `
        <div class="tiktok-choices">${choicesHTML}</div>
        ${revealed ? `<div class="tiktok-reveal"><p class="tiktok-explain">${q.explain}</p></div>` : revealPromptHTML}
      `;
    }

    root.innerHTML = `
      <main class="screen tiktok-mode-screen">
        <div class="tiktok-card">
          <div class="tiktok-topbar">
            <button class="tiktok-icon-btn" data-exit title="Exit TikTok Mode">✕</button>
            <span class="tiktok-tag">${q.subjectIcon} ${q.subjectName} &middot; ${q.skillName}</span>
            <button class="tiktok-icon-btn" data-settings title="Change topic">⚙️</button>
          </div>
          <div class="tiktok-content">
            ${passageHTML}
            <p class="tiktok-question">${q.q}</p>
            ${answerAreaHTML}
          </div>
          <button class="tiktok-next-btn" data-next>🔀 Next Question</button>
        </div>
      </main>
    `;

    root.querySelector("[data-exit]").addEventListener("click", () => {
      stopCountdown();
      stopSpeaking();
      navigate("map");
    });
    root.querySelector("[data-settings]").addEventListener("click", () => {
      stopCountdown();
      stopSpeaking();
      renderPicker();
    });
    root.querySelector("[data-next]").addEventListener("click", () => pickNext());
    const revealBtn = root.querySelector("[data-reveal]");
    if (revealBtn) {
      revealBtn.addEventListener("click", () => reveal());
      startCountdown();
    }
  }

  preloadSubject(subjectId).then(renderPicker);
}
