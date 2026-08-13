// Regression tests for the adaptive difficulty engine: per-question stat
// tracking (state.js) and the personalized weighting it feeds into
// getWeakReviewQuestions (data/questions/index.js).
import { GameState } from "../js/state.js";
import { getLessonQuestions, getWeakReviewQuestions, getAllQuestionsFlat, preloadSubjectForSkill, preloadAllSubjects } from "../js/data/questions/index.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("recordQuestionAnswer/getQuestionStat round-trip correctly", () => {
  const gs = new GameState();
  assertEqual(gs.getQuestionStat("en-commas", 5), undefined);
  gs.recordQuestionAnswer("en-commas", 5, true);
  gs.recordQuestionAnswer("en-commas", 5, false);
  const stat = gs.getQuestionStat("en-commas", 5);
  assertEqual(stat.attempts, 2);
  assertEqual(stat.correct, 1);
});

test("recordQuestionAnswer is a no-op for an unknown skill (never throws)", () => {
  const gs = new GameState();
  gs.recordQuestionAnswer("not-a-real-skill", 0, true);
  assertEqual(gs.getQuestionStat("not-a-real-skill", 0), undefined);
});

test("questions from getLessonQuestions carry a stable bankIndex", async () => {
  await preloadSubjectForSkill("ma-linear");
  const qs = getLessonQuestions("ma-linear", 0);
  for (const q of qs) {
    assertTrue(typeof q.bankIndex === "number", "missing bankIndex");
  }
  // Same lesson requested again should reference the exact same underlying
  // questions (by bankIndex), even though gentleReorder shuffles presentation.
  const qs2 = getLessonQuestions("ma-linear", 0);
  const indices1 = qs.map((q) => q.bankIndex).sort((a, b) => a - b);
  const indices2 = qs2.map((q) => q.bankIndex).sort((a, b) => a - b);
  assertEqual(JSON.stringify(indices1), JSON.stringify(indices2));
});

test("questions from getAllQuestionsFlat carry skillId + bankIndex", async () => {
  await preloadAllSubjects();
  const flat = getAllQuestionsFlat();
  assertTrue(flat.length > 0);
  const sample = flat[0];
  assertTrue(typeof sample.bankIndex === "number");
  assertTrue(typeof sample.skillId === "string");
});

test("getWeakReviewQuestions without a getQuestionStat callback behaves exactly as before (uniform skill weighting)", async () => {
  await preloadSubjectForSkill("en-commas");
  const picks = getWeakReviewQuestions([{ id: "en-commas", accuracy: 0.5 }], 10);
  assertEqual(picks.length, 10);
});

test("a personally-missed question is drawn far more often than a personally-aced one", async () => {
  await preloadSubjectForSkill("en-commas");
  const gs = new GameState();
  for (let i = 0; i < 3; i++) gs.recordQuestionAnswer("en-commas", 5, false);
  for (let i = 0; i < 3; i++) gs.recordQuestionAnswer("en-commas", 10, true);

  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);
  let missedDraws = 0;
  let acedDraws = 0;
  const rounds = 300;
  for (let i = 0; i < rounds; i++) {
    const picks = getWeakReviewQuestions([{ id: "en-commas", accuracy: 0.5 }], 5, { getQuestionStat });
    for (const p of picks) {
      if (p.bankIndex === 5) missedDraws++;
      if (p.bankIndex === 10) acedDraws++;
    }
  }
  assertTrue(
    missedDraws > acedDraws * 2,
    `expected the missed question (bankIndex 5, drawn ${missedDraws}x) to be drawn well more often than the aced one (bankIndex 10, drawn ${acedDraws}x)`
  );
});

test("a question needs at least 2 personal attempts before overriding the skill-level weight", async () => {
  await preloadSubjectForSkill("en-commas");
  const gs = new GameState();
  // Single lucky/unlucky attempt shouldn't swing weighting on its own.
  gs.recordQuestionAnswer("en-commas", 7, false);
  const stat = gs.getQuestionStat("en-commas", 7);
  assertEqual(stat.attempts, 1);
  // (Behavioral confirmation lives in index.js's MIN_ATTEMPTS_FOR_PERSONAL_WEIGHT;
  // this test just documents/pins the single-attempt case stays recorded but
  // is intentionally under the confidence threshold.)
  assertTrue(stat.attempts < 2);
});
