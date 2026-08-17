// Unit tests for js/ui/writtenAnswer.js — the shared support for "written"
// (student-produced-response) questions. Focused on checkWrittenAnswer's
// numeric-equivalence logic (the one piece of real behavior worth
// regression-testing here; the render/wire/mark helpers are exercised
// end-to-end by the quiz screens themselves) and isWrittenQuestion's
// choices-based discriminator.
import { isWrittenQuestion, checkWrittenAnswer } from "../js/ui/writtenAnswer.js";
import { test, assertTrue } from "./assert.js";

test("isWrittenQuestion is true for a question with no choices array, false for one with choices", () => {
  assertTrue(isWrittenQuestion({ q: "x", answer: "5", explain: "e" }));
  assertTrue(!isWrittenQuestion({ q: "x", choices: ["a", "b", "c", "d"], answer: 0, explain: "e" }));
});

test("checkWrittenAnswer accepts an exact string match", () => {
  assertTrue(checkWrittenAnswer("6", { answer: "6" }));
});

test("checkWrittenAnswer is tolerant of surrounding whitespace", () => {
  assertTrue(checkWrittenAnswer("  6  ", { answer: "6" }));
});

test("checkWrittenAnswer treats an equivalent decimal and fraction as the same answer", () => {
  assertTrue(checkWrittenAnswer("0.5", { answer: "1/2" }));
  assertTrue(checkWrittenAnswer("1/2", { answer: "0.5" }));
  assertTrue(checkWrittenAnswer("6.0", { answer: "6" }));
});

test("checkWrittenAnswer accepts a listed acceptableAnswers entry, not just the primary answer", () => {
  assertTrue(checkWrittenAnswer("1.5", { answer: "3/2", acceptableAnswers: ["1.5"] }));
});

test("checkWrittenAnswer rejects a numerically different answer", () => {
  assertTrue(!checkWrittenAnswer("7", { answer: "6" }));
});

test("checkWrittenAnswer rejects an empty or whitespace-only submission", () => {
  assertTrue(!checkWrittenAnswer("", { answer: "6" }));
  assertTrue(!checkWrittenAnswer("   ", { answer: "6" }));
});

test("checkWrittenAnswer falls back to a case-insensitive string compare for non-numeric answers", () => {
  assertTrue(checkWrittenAnswer("Yes", { answer: "yes" }));
  assertTrue(!checkWrittenAnswer("No", { answer: "yes" }));
});

test("checkWrittenAnswer handles a negative number correctly", () => {
  assertTrue(checkWrittenAnswer("-4", { answer: "-4" }));
  assertTrue(!checkWrittenAnswer("4", { answer: "-4" }));
});
