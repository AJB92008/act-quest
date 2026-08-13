// Regression tests for SM-2 spaced-repetition scheduling (state.js) —
// both the question side (piggybacked on recordQuestionAnswer) and the
// vocab side (recordVocabReview).
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

// Several of the methods under test here call gameState.save(), which
// (unlike the read-only assertions elsewhere) writes to the real
// localStorage key — and since run.html only clears that key once, at the
// very top of the whole suite, a `new GameState()` in a later test would
// otherwise inherit an earlier test's saved state. Clear it right before
// each fresh instance so every test starts from a true blank save.
function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

test("a freshly-answered question isn't due again immediately", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, true);
  const due = gs.getDueQuestionKeys();
  assertTrue(!due.includes("en-commas:1"), "a just-answered correct question shouldn't be immediately due");
});

test("a missed question comes back due sooner than a question answered correctly", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, false); // missed
  gs.recordQuestionAnswer("en-commas", 2, true); // correct
  const missedItem = gs.data.srs.questions["en-commas:1"];
  const correctItem = gs.data.srs.questions["en-commas:2"];
  assertTrue(missedItem.dueAt <= correctItem.dueAt, "a missed question's next review should be sooner than a correctly-answered one's");
});

test("repeated correct answers grow the review interval (standard SM-2 shape: 1 day, then 6, then EF-scaled)", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, true);
  const first = gs.data.srs.questions["en-commas:1"].interval;
  gs.recordQuestionAnswer("en-commas", 1, true);
  const second = gs.data.srs.questions["en-commas:1"].interval;
  gs.recordQuestionAnswer("en-commas", 1, true);
  const third = gs.data.srs.questions["en-commas:1"].interval;
  assertEqual(first, 1);
  assertEqual(second, 6);
  assertTrue(third > second, "third correct review should push the interval further out than the second");
});

test("missing a question resets its repetition streak and interval back to 1 day", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, true);
  gs.recordQuestionAnswer("en-commas", 1, true);
  gs.recordQuestionAnswer("en-commas", 1, true);
  assertTrue(gs.data.srs.questions["en-commas:1"].interval > 6);
  gs.recordQuestionAnswer("en-commas", 1, false);
  assertEqual(gs.data.srs.questions["en-commas:1"].interval, 1);
  assertEqual(gs.data.srs.questions["en-commas:1"].repetitions, 0);
});

test("getDueQuestionKeys returns items sorted oldest-due-first", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, false);
  gs.data.srs.questions["en-commas:1"].dueAt = Date.now() - 1000;
  gs.recordQuestionAnswer("en-commas", 2, false);
  gs.data.srs.questions["en-commas:2"].dueAt = Date.now() - 5000;
  const due = gs.getDueQuestionKeys();
  assertEqual(due[0], "en-commas:2");
  assertEqual(due[1], "en-commas:1");
});

test("recordVocabReview schedules a vocab word independently of question SRS", () => {
  const gs = freshGameState();
  gs.recordVocabReview("ambivalent", false);
  assertTrue(gs.data.srs.vocab["ambivalent"] !== undefined);
  assertEqual(Object.keys(gs.data.srs.questions).length, 0);
});

test("recordVocabReview with gotIt=true doesn't leave the word immediately due", () => {
  const gs = freshGameState();
  gs.recordVocabReview("skeptical", true);
  assertTrue(!gs.getDueVocabWords().includes("skeptical"));
});

test("totalReviews counts both question and vocab SRS touches", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, true);
  gs.recordVocabReview("wry", true);
  assertEqual(gs.data.srs.totalReviews, 2);
});
