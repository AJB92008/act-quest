// Regression tests for the lazy per-subject question loading (see
// preloadSubject() in data/questions/index.js) and the difficulty-curved
// lesson ordering built on top of it.
import {
  getLessonCount,
  getFullBank,
  getLessonQuestions,
  preloadSubject,
  preloadSubjectForSkill,
  preloadAllSubjects,
  getBossQuizQuestions,
  getWeakReviewQuestions,
  getEndlessQuestion,
  getPassageById,
  getStimulusById,
} from "../js/data/questions/index.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("getLessonCount is 20 for a real skill without needing any data loaded", () => {
  assertEqual(getLessonCount("en-relevance"), 20);
});

test("getLessonCount falls back to 1 for an unknown skill id", () => {
  assertEqual(getLessonCount("not-a-real-skill"), 1);
});

test("getLessonCount reflects the real bank size for skills extended beyond 100 questions, still without loading data", () => {
  assertEqual(getLessonCount("re-mainidea"), 28);
  assertEqual(getLessonCount("sc-datarep"), 28);
  assertEqual(getLessonCount("en-commas"), 21);
});

test("a skill extended beyond 100 questions actually has that many in its real bank once loaded", async () => {
  await preloadSubjectForSkill("re-mainidea");
  assertEqual(getFullBank("re-mainidea").length, 140);
  await preloadSubjectForSkill("sc-datarep");
  assertEqual(getFullBank("sc-datarep").length, 140);
  await preloadSubjectForSkill("en-commas");
  assertEqual(getFullBank("en-commas").length, 105);
});

test("lesson 21 (the first bonus lesson) of an extended skill returns 5 real, valid questions", async () => {
  await preloadSubjectForSkill("re-mainidea");
  const qs = getLessonQuestions("re-mainidea", 20); // 0-indexed: lesson 21, only reachable because getLessonCount now reports 28
  assertEqual(qs.length, 5);
  const bank = getFullBank("re-mainidea");
  for (const q of qs) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("getFullBank is empty before that skill's subject has been preloaded", () => {
  assertEqual(getFullBank("ma-linear").length, 0);
});

test("preloadSubjectForSkill loads the right subject and getFullBank then returns all 100 questions", async () => {
  await preloadSubjectForSkill("ma-linear");
  assertEqual(getFullBank("ma-linear").length, 100);
});

test("preloadSubject is idempotent — calling it again doesn't throw or duplicate work", async () => {
  await preloadSubject("math");
  await preloadSubject("math");
  assertEqual(getFullBank("ma-linear").length, 100);
});

test("getLessonQuestions returns 5 questions per lesson once loaded", async () => {
  await preloadSubjectForSkill("ma-linear");
  assertEqual(getLessonQuestions("ma-linear", 0).length, 5);
  assertEqual(getLessonQuestions("ma-linear", 19).length, 5);
});

test("lesson 20 tends to be built from harder-scored questions than lesson 1", async () => {
  await preloadSubjectForSkill("ma-linear");
  function score(q) {
    const hasNeg = /\b(NOT|EXCEPT|LEAST)\b/.test(q.q);
    return q.q.length + q.choices.reduce((s, c) => s + c.length, 0) * 0.4 + (hasNeg ? 60 : 0);
  }
  const first = getLessonQuestions("ma-linear", 0).reduce((s, q) => s + score(q), 0) / 5;
  const last = getLessonQuestions("ma-linear", 19).reduce((s, q) => s + score(q), 0) / 5;
  assertTrue(last > first, `expected lesson 20's avg difficulty score (${last}) > lesson 1's (${first})`);
});

test("preloadAllSubjects loads every subject, unlocking cross-subject getters", async () => {
  await preloadAllSubjects();
  const boss = getBossQuizQuestions("science", 20);
  assertEqual(boss.length, 20);
  assertTrue(boss.every((q) => q.subjectId === "science"));

  const weak = getWeakReviewQuestions([{ id: "en-commas", accuracy: 0.5 }], 10);
  assertEqual(weak.length, 10);

  const endless = getEndlessQuestion(null, 0.5);
  assertTrue(endless && typeof endless.q === "string");
});

test("getPassageById/getStimulusById resolve once reading/science are loaded", async () => {
  await preloadSubject("reading");
  await preloadSubject("science");
  assertTrue(getPassageById("p2") !== undefined);
  assertTrue(getStimulusById("s4") !== undefined);
  assertEqual(getPassageById("not-a-real-passage"), undefined);
});
