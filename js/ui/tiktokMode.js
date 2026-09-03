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
import { TIKTOK_EXPLANATIONS } from "../data/tiktokExplanations.js";

const TIKTOK_COLOR = "#25f4ee";
const TIKTOK_BG = "#0a0a0f";
const REVEAL_SECONDS = 10;
const VOICE_STORAGE_KEY = "act-quest-tiktok-voice";

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadPreferredVoiceURI() {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function savePreferredVoiceURI(uri) {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, uri);
  } catch {
    // ignore
  }
}

function availableVoices() {
  return "speechSynthesis" in window ? window.speechSynthesis.getVoices() : [];
}

const DEFAULT_VOICE_NAME = "Google US English";
const DEFAULT_VOICE_LANG = "en-US";

// Applies the saved voice preference (by voiceURI, since a
// SpeechSynthesisVoice object itself can't be persisted to localStorage)
// if it's still present in the browser's current voice list. With no
// saved preference, defaults to "Google US English" (Chrome's own voice,
// not a system one) rather than leaving it to whatever the browser picks
// on its own — falls back to the plain browser default if that voice
// isn't available on this machine/browser.
function applyPreferredVoice(utterance) {
  const voices = availableVoices();
  const uri = loadPreferredVoiceURI();
  if (uri) {
    const saved = voices.find((v) => v.voiceURI === uri);
    if (saved) {
      utterance.voice = saved;
      return;
    }
  }
  const fallback = voices.find((v) => v.name === DEFAULT_VOICE_NAME && v.lang === DEFAULT_VOICE_LANG) || voices.find((v) => v.name === DEFAULT_VOICE_NAME);
  if (fallback) utterance.voice = fallback;
}

// `onEnd` fires once the utterance finishes — or immediately, if this
// browser has no speech support at all — so callers can sequence what
// happens next (e.g. don't start the reveal countdown until the question
// has actually finished being read).
function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  applyPreferredVoice(utter);
  if (onEnd) utter.addEventListener("end", onEnd, { once: true });
  window.speechSynthesis.speak(utter);
}

// TikTok Mode-only narration text is layered on top of the base bank's
// `explain` (see data/tiktokExplanations.js) without ever touching the
// data lessons/quizzes/boss quizzes actually use — falls back to the
// original explain for anything not (yet) rewritten there.
//
// Composite key built in three layers, each added only when present:
//   1. A passage/stimulus disambiguator — q.passageId or q.stimulusId
//      (ACT Reading/Science: many questions share one passage/stimulus,
//      and a generic stem like "Which choice best states the main
//      idea..." repeats verbatim across every different one in the
//      skill) or the full inline q.passage text (SAT/PSAT R&W: one
//      passage per question with no id, and literally the same stem
//      reused for EVERY question in the skill).
//   2. The question's own q.q text.
//   3. q.choices, joined — added ALWAYS, for every skill, because some
//      skills (found first in ma-numbersense) reuse a fully generic stem
//      like "Which of the following numbers is prime?" across multiple,
//      otherwise-unrelated questions whose only distinguishing content
//      lives in the answer choices, not the stem or any passage.
function explainKey(q) {
  const stimulusKey = q.passageId ?? q.stimulusId ?? q.passage;
  const base = stimulusKey ? `${stimulusKey}::${q.q}` : q.q;
  const choicesKey = Array.isArray(q.choices) ? q.choices.join("|") : "";
  return choicesKey ? `${base}::${choicesKey}` : base;
}
function explainFor(q) {
  return TIKTOK_EXPLANATIONS[q.skillId]?.[explainKey(q)] || q.explain;
}

// Reads the question (and passage) out loud before the reveal countdown
// starts, so a clip's narration walks through the problem, not just the
// answer. Deliberately doesn't read the answer choices — those are
// already on screen the whole time, and reading four options aloud made
// the narration long and repetitive.
function speakQuestion(q, onEnd) {
  const passagePart = q.passage ? `${q.passage} ` : "";
  speak(`${passagePart}${q.q}`, onEnd);
}

// Read the correct answer and why it's correct out loud (Web Speech API —
// built into every modern browser, no backend/library needed) so a
// recording captures a spoken reveal instead of relying on the person
// filming to read it themselves. Silently does nothing on a browser
// without speech support rather than erroring — this is a nice-to-have
// for the recording, not something the screen depends on.
function speakAnswer(q) {
  const answerPart = isWrittenQuestion(q)
    ? `The correct answer is ${q.answer}.`
    : `The correct answer is ${String.fromCharCode(65 + q.answer)}: ${q.choices[q.answer]}`.replace(/[.!?]$/, "") + ".";
  speak(`${answerPart} ${explainFor(q)}`);
}

// Voices load asynchronously in some browsers (notably Chrome on first
// page load) — getVoices() can return an empty array until this fires.
// Re-populates the picker's <select> in place if it's currently on
// screen, rather than forcing a full re-render that would lose whatever
// else the player was doing.
function populateVoiceSelect(select) {
  const voices = availableVoices();
  const current = select.value || loadPreferredVoiceURI();
  select.innerHTML =
    `<option value="">Default voice</option>` +
    voices.map((v) => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join("");
  if (current && voices.some((v) => v.voiceURI === current)) select.value = current;
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    const select = document.querySelector("[data-voice-select]");
    if (select) populateVoiceSelect(select);
  });
}

export function renderTiktokMode(root, navigate, { testId = "act" } = {}) {
  let currentTestId = testId;
  let subjectId = getTestSubjects(currentTestId).find((s) => isSubjectPlayable(s))?.id || getTestSubjects(currentTestId)[0].id;
  let selectedSkillIds = new Set();
  let pool = [];
  let current = null;
  let revealed = false;
  let narratingQuestion = false;
  let countdown = REVEAL_SECONDS;
  let countdownTimer = null;
  // Bumped whenever the current question cycle is abandoned (exit,
  // change topic, or a fresh pickNext) — an in-flight speakQuestion
  // onEnd callback checks this before starting the countdown, so
  // stopSpeaking()'s cancel() (which itself fires an 'end' event) can't
  // resurrect a countdown for a question the viewer already navigated
  // away from.
  let cycleId = 0;

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // The single place that flips `revealed`, so speakAnswer() only ever
  // fires once per question.
  function reveal() {
    stopCountdown();
    revealed = true;
    renderCard();
    speakAnswer(current);
  }

  // Pure timer — no tap-to-skip. Once a question is shown, it just counts
  // down on its own and reveals itself.
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
      if (label) label.textContent = `⏱ Revealing in ${countdown}s…`;
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
          <div class="study-plan-form">
            <label class="study-plan-field">
              🔊 Answer voice
              <select data-voice-select></select>
            </label>
            <button type="button" class="btn-secondary" data-voice-preview>▶️ Preview</button>
          </div>
          <div class="results-actions">
            <button class="btn-primary lesson-start-btn" data-start-tiktok ${selectedSkillIds.size === 0 ? "disabled" : ""}>Start (${selectedSkillIds.size} skill${selectedSkillIds.size === 1 ? "" : "s"} selected) &rarr;</button>
          </div>
        </div>
      </main>
    `;

    root.querySelector("[data-exit]").addEventListener("click", () => {
      stopSpeaking();
      navigate("map");
    });

    const voiceSelect = root.querySelector("[data-voice-select]");
    populateVoiceSelect(voiceSelect);
    voiceSelect.addEventListener("change", () => savePreferredVoiceURI(voiceSelect.value));
    root.querySelector("[data-voice-preview]").addEventListener("click", () => {
      savePreferredVoiceURI(voiceSelect.value);
      speak("The correct answer is B: this is what that voice sounds like.");
    });

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
            getFullBank(skillId).forEach((q) =>
              pool.push({ ...q, skillId, skillName: skill.name, subjectName: subject.name, subjectIcon: subject.icon })
            );
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
    cycleId++;
    if (pool.length === 0) {
      renderPicker();
      return;
    }
    const myCycle = cycleId;
    current = pool.pop();
    revealed = false;
    narratingQuestion = true;
    renderCard();
    speakQuestion(current, () => {
      if (cycleId !== myCycle) return; // abandoned this cycle mid-narration
      narratingQuestion = false;
      renderCard();
      startCountdown();
    });
  }

  function renderCard() {
    const q = current;
    const written = isWrittenQuestion(q);
    const passageHTML = q.passage ? `<p class="tiktok-passage">${q.passage}</p>` : "";

    const revealPromptHTML = narratingQuestion
      ? `<div class="tiktok-tap-reveal" data-countdown>🔊 Reading question…</div>`
      : `<div class="tiktok-tap-reveal" data-countdown>⏱ Revealing in ${countdown}s…</div>`;

    let answerAreaHTML;
    if (written) {
      answerAreaHTML = revealed
        ? `<div class="tiktok-reveal"><span class="tiktok-reveal-label">Answer</span><p class="tiktok-answer-value">${q.answer}</p><p class="tiktok-explain">${explainFor(q)}</p></div>`
        : revealPromptHTML;
    } else {
      const choicesHTML = q.choices
        .map((c, i) => `<div class="tiktok-choice ${revealed && i === q.answer ? "is-correct" : ""}">${String.fromCharCode(65 + i)}. ${c}</div>`)
        .join("");
      answerAreaHTML = `
        <div class="tiktok-choices">${choicesHTML}</div>
        ${revealed ? `<div class="tiktok-reveal"><p class="tiktok-explain">${explainFor(q)}</p></div>` : revealPromptHTML}
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
      cycleId++;
      stopCountdown();
      stopSpeaking();
      navigate("map");
    });
    root.querySelector("[data-settings]").addEventListener("click", () => {
      cycleId++;
      stopCountdown();
      stopSpeaking();
      renderPicker();
    });
    root.querySelector("[data-next]").addEventListener("click", () => pickNext());
  }

  preloadSubject(subjectId).then(renderPicker);
}
