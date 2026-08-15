// Regression tests for the Mistake Journal: the central logging hook in
// recordQuestionAnswer (state.js), and the accessor methods the
// ui/mistakeJournal.js screen reads from.
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

test("a fresh save has an empty mistake journal", () => {
  const gs = freshGameState();
  assertEqual(gs.mistakeJournalCount(), 0);
  assertEqual(gs.getMistakeJournal().length, 0);
});

test("recordQuestionAnswer logs an entry when the answer is wrong", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 5, false, 2);
  assertEqual(gs.mistakeJournalCount(), 1);
  const [entry] = gs.getMistakeJournal();
  assertEqual(entry.skillId, "en-commas");
  assertEqual(entry.bankIndex, 5);
  assertEqual(entry.chosenIndex, 2);
  assertTrue(typeof entry.date === "number" && entry.date > 0, "expected a real timestamp");
});

test("recordQuestionAnswer does NOT log an entry when the answer is correct", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 5, true, 0);
  assertEqual(gs.mistakeJournalCount(), 0);
});

test("recordQuestionAnswer without a chosenIndex argument still logs (chosenIndex defaults to null)", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 5, false);
  const [entry] = gs.getMistakeJournal();
  assertEqual(entry.chosenIndex, null);
});

test("getMistakeJournal returns newest-first", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, false, 0);
  gs.recordQuestionAnswer("en-commas", 2, false, 0);
  gs.recordQuestionAnswer("en-commas", 3, false, 0);
  const entries = gs.getMistakeJournal();
  assertEqual(entries.map((e) => e.bankIndex).join(","), "3,2,1");
});

test("recordQuestionAnswer is a no-op for an unknown skill (never throws, never logs)", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("not-a-real-skill", 0, false, 0);
  assertEqual(gs.mistakeJournalCount(), 0);
});

test("the mistake journal has a real but generous cap so an extremely long-lived save can't grow unbounded", () => {
  const gs = freshGameState();
  // Enough misses to exceed any plausible cap without being slow to run —
  // recordQuestionAnswer doesn't touch localStorage on its own (only a
  // later save()-calling method does), so this loop stays fast.
  for (let i = 0; i < 10050; i++) {
    gs.recordQuestionAnswer("en-commas", i % 100, false, 0);
  }
  const count = gs.mistakeJournalCount();
  assertTrue(count <= 10000, `expected the journal to be capped, got ${count} entries`);
  assertTrue(count > 9000, `expected the cap to be generous (>9000), got ${count}`);
});

test("mistakes logged across different skills all show up, each resolvable back to that skill", () => {
  const gs = freshGameState();
  gs.recordQuestionAnswer("en-commas", 1, false, 0);
  gs.recordQuestionAnswer("ma-linear", 2, false, 1);
  const skillIds = gs.getMistakeJournal().map((e) => e.skillId);
  assertTrue(skillIds.includes("en-commas") && skillIds.includes("ma-linear"), "expected mistakes from both skills");
});
