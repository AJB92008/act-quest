// Shared support for "written" (student-produced-response) questions —
// currently only a subset of sat-math/psat-math questions carry these,
// mixed into their otherwise-multiple-choice banks (see satMath.js's own
// header comment). A written question has no `choices` field at all; the
// player types their answer into a text box instead of picking one of
// four buttons. Every quiz-taking screen that can draw from those two
// subjects (quiz.js, bossQuiz.js, practiceTest.js, endlessMode.js,
// drillBuilder.js, diagnostic.js, weakReview.js, adaptivePractice.js,
// reviewQueue.js) branches on isWrittenQuestion() and calls the helpers
// below instead of rendering/wiring the choice-button grid — everything
// else about a question (stimulus, hint, streak, scoring, explain panel,
// Next button, gameState recording) stays exactly as it already was.
export function isWrittenQuestion(q) {
  return !Array.isArray(q.choices);
}

// Evaluates a simple "n/d" fraction into its decimal value, or parses a
// plain number — returns null for anything that isn't cleanly one of
// those, so the caller can fall back to a plain string compare.
function normalizeNumeric(raw) {
  const s = String(raw).trim().replace(/^\+/, "");
  if (s === "") return null;
  const fracMatch = s.match(/^-?\d+(\.\d+)?\/\d+(\.\d+)?$/);
  if (fracMatch) {
    const slash = s.indexOf("/");
    const num = Number(s.slice(0, slash));
    const den = Number(s.slice(slash + 1));
    if (den !== 0) return num / den;
    return null;
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// Compares a player's typed answer against a written question's correct
// answer (plus any listed acceptable alternate forms), tolerant of
// equivalent numeric notations ("1/2" vs "0.5" vs ".5") and of incidental
// whitespace/case for the rare non-numeric answer. Digital SAT/PSAT
// student-produced-response questions are always numeric, so exact
// string matching (case aside) is the only fallback ever actually needed.
export function checkWrittenAnswer(userInput, q) {
  const guess = String(userInput ?? "").trim();
  if (!guess) return false;
  const candidates = [q.answer, ...(q.acceptableAnswers || [])];
  const guessNum = normalizeNumeric(guess);
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const candidateNum = normalizeNumeric(candidate);
    if (guessNum !== null && candidateNum !== null) {
      if (Math.abs(guessNum - candidateNum) < 1e-9) return true;
    } else if (guess.toLowerCase() === String(candidate).trim().toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Renders the answer-input block for a written question — swaps in for
// the `<div class="choices">...</div>` block a multiple-choice question
// would render instead. `idSuffix` lets a screen that ever needs two
// independent written inputs on screen at once avoid an id collision;
// every current call site just uses the default.
//
// Deliberately no `inputmode="decimal"` here: some answers are negative
// (a decimal mobile keypad usually has no minus key) and some math-math
// skills phrase answers in terms of π, which no numeric keypad can type
// at all — the plain-text keyboard this falls back to at least makes both
// possible (the π itself can be copied straight out of the question text).
export function renderWrittenAnswerHTML(idSuffix = "") {
  return `
    <div class="written-answer">
      <input
        type="text"
        class="written-answer-input"
        id="writtenAnswerInput${idSuffix}"
        placeholder="Type your answer"
        aria-label="Your answer"
        autocomplete="off"
      />
      <button class="btn-primary written-answer-submit" id="writtenAnswerSubmit${idSuffix}">Submit</button>
    </div>
  `;
}

// Wires the input + submit button + Enter-to-submit. Calls
// onSubmit(rawInputValue) once; the caller owns everything downstream
// (correctness check via checkWrittenAnswer, scoring, gameState
// recording, explain panel, Next button) — same division of
// responsibility the choice-button path already has between the click
// handler and selectChoice().
export function wireWrittenAnswer(root, onSubmit, idSuffix = "") {
  const input = root.querySelector(`#writtenAnswerInput${idSuffix}`);
  const submitBtn = root.querySelector(`#writtenAnswerSubmit${idSuffix}`);
  if (!input || !submitBtn) return;
  input.focus();
  const submit = () => {
    if (input.disabled) return;
    onSubmit(input.value);
  };
  submitBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    // Every quiz screen also binds a document-level Enter-to-advance
    // shortcut (see keyboardNav.js's bindQuizKeys) that clicks whatever
    // "Next Question" button is on screen. While the input is still
    // enabled, this Enter press means "submit," not "advance" — stop it
    // from bubbling so the same keystroke doesn't also fire that global
    // handler and skip straight past the explain panel. Once answered
    // (input disabled), let it bubble normally so a *second* Enter press
    // does trigger the global advance-to-next shortcut as expected.
    if (input.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    submit();
  });
}

// Locks the input after answering and colors it correct/incorrect,
// mirroring the choice-button path's disable-and-highlight behavior. The
// correct answer itself is left to the caller's existing explain panel
// (every screen already shows "The correct answer: ..." there for a
// missed choice question) rather than repeated here too.
export function markWrittenAnswer(root, correct, idSuffix = "") {
  const input = root.querySelector(`#writtenAnswerInput${idSuffix}`);
  const submitBtn = root.querySelector(`#writtenAnswerSubmit${idSuffix}`);
  if (!input) return;
  input.disabled = true;
  if (submitBtn) submitBtn.disabled = true;
  input.classList.add(correct ? "is-correct" : "is-incorrect");
}
