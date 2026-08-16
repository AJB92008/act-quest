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
  isBossLessonIndex,
  BOSS_LESSON_SIZE,
} from "../js/data/questions/index.js";
import { getSkillBossName } from "../js/data/skills.js";
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

// --- boss lesson: a skill's own final lesson, replaced (not added to) ---

test("isBossLessonIndex is true only for a skill's actual final lesson index, wherever that lands", () => {
  assertTrue(isBossLessonIndex("ma-linear", 19)); // 20-lesson skill: final index is 19
  assertTrue(!isBossLessonIndex("ma-linear", 18));
  assertTrue(!isBossLessonIndex("ma-linear", 20)); // doesn't exist as a lesson at all
  assertTrue(isBossLessonIndex("en-commas", 20)); // 21-lesson skill: final index is 20
  assertTrue(!isBossLessonIndex("en-commas", 19));
  assertTrue(isBossLessonIndex("re-mainidea", 27)); // 28-lesson skill: final index is 27
});

test("the boss lesson (a skill's final lesson index) returns 15 questions, each with a valid bankIndex into the skill's real bank", async () => {
  await preloadSubjectForSkill("ma-linear");
  const boss = getLessonQuestions("ma-linear", 19);
  assertEqual(boss.length, BOSS_LESSON_SIZE);
  const bank = getFullBank("ma-linear");
  for (const q of boss) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("the boss lesson is a fixed set (the bank's hardest questions), only its presentation order varies between draws", async () => {
  await preloadSubjectForSkill("ma-linear");
  const a = getLessonQuestions("ma-linear", 19).map((q) => q.bankIndex).sort();
  const b = getLessonQuestions("ma-linear", 19).map((q) => q.bankIndex).sort();
  assertEqual(JSON.stringify(a), JSON.stringify(b));
});

test("the boss lesson for an extended skill still returns 15 questions at its real final index", async () => {
  await preloadSubjectForSkill("en-commas");
  assertEqual(getLessonQuestions("en-commas", 20).length, BOSS_LESSON_SIZE); // en-commas: 21 lessons, final index 20
  await preloadSubjectForSkill("re-mainidea");
  assertEqual(getLessonQuestions("re-mainidea", 27).length, BOSS_LESSON_SIZE); // re-mainidea: 28 lessons, final index 27
});

test("getSkillBossName relates the boss's name to the skill's own name", () => {
  assertEqual(getSkillBossName("Comma Sense"), "Comma Sense Champion");
});

test("a skill extended beyond 100 questions actually has that many in its real bank once loaded", async () => {
  await preloadSubjectForSkill("re-mainidea");
  assertEqual(getFullBank("re-mainidea").length, 140);
  await preloadSubjectForSkill("sc-datarep");
  assertEqual(getFullBank("sc-datarep").length, 140);
  await preloadSubjectForSkill("en-commas");
  assertEqual(getFullBank("en-commas").length, 105);
});

test("lesson 21 (a real, non-boss bonus lesson) of an extended skill still returns 5 real, valid questions", async () => {
  await preloadSubjectForSkill("re-mainidea");
  const qs = getLessonQuestions("re-mainidea", 20); // 0-indexed: lesson 21, one before the boss at index 27
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

test("getLessonQuestions returns 5 questions per lesson once loaded (for a non-boss lesson)", async () => {
  await preloadSubjectForSkill("ma-linear");
  assertEqual(getLessonQuestions("ma-linear", 0).length, 5);
  assertEqual(getLessonQuestions("ma-linear", 18).length, 5); // lesson 19 of 20 — last one before the boss
});

test("lesson 19 tends to be built from harder-scored questions than lesson 1, and the boss lesson (20) harder still", async () => {
  await preloadSubjectForSkill("ma-linear");
  function score(q) {
    const hasNeg = /\b(NOT|EXCEPT|LEAST)\b/.test(q.q);
    return q.q.length + q.choices.reduce((s, c) => s + c.length, 0) * 0.4 + (hasNeg ? 60 : 0);
  }
  const avg = (qs) => qs.reduce((s, q) => s + score(q), 0) / qs.length;
  const first = avg(getLessonQuestions("ma-linear", 0));
  const last = avg(getLessonQuestions("ma-linear", 18));
  const boss = avg(getLessonQuestions("ma-linear", 19));
  assertTrue(last > first, `expected lesson 19's avg difficulty score (${last}) > lesson 1's (${first})`);
  // Comparing the boss against lesson 1 rather than lesson 19 here: the
  // boss (the sorted bank's hardest 15) and lesson 19 (a middle slice of 5)
  // overlap in range, so their *means* aren't guaranteed to order cleanly
  // even though the boss is built from harder material overall — but the
  // boss's range and lesson 1's are fully disjoint (hardest 15 vs. easiest
  // 5 of the same sorted bank), so this comparison always holds.
  assertTrue(boss > first, `expected the boss lesson's avg difficulty score (${boss}) > lesson 1's (${first})`);
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
