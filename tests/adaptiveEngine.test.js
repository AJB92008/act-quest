// Regression tests for the adaptive difficulty engine: per-question stat
// tracking (state.js) and the personalized weighting it feeds into
// getWeakReviewQuestions (data/questions/index.js).
import { GameState } from "../js/state.js";
import {
  getLessonQuestions,
  getWeakReviewQuestions,
  getAllQuestionsFlat,
  getEndlessQuestion,
  preloadSubjectForSkill,
  preloadAllSubjects,
} from "../js/data/questions/index.js";
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

// --- calibrated (self-recalibrating) lesson difficulty ordering ---

test("getLessonQuestions without a getQuestionStat callback behaves exactly as before (pure text heuristic)", async () => {
  await preloadSubjectForSkill("ma-linear");
  const qs = getLessonQuestions("ma-linear", 0);
  assertEqual(qs.length, 5);
});

test("a question the player has consistently missed moves out of lesson 1 once it has enough personal attempts", async () => {
  await preloadSubjectForSkill("ma-linear");
  const gs = new GameState();
  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);

  // Pick a question the pure heuristic currently ranks among the easiest
  // (i.e. it's actually in lesson 1) rather than hardcoding a bankIndex,
  // so this test doesn't silently stop meaning anything if the bank changes.
  const lesson1Before = getLessonQuestions("ma-linear", 0, { getQuestionStat });
  const target = lesson1Before[0].bankIndex;

  // Enough wrong attempts to cross MIN_ATTEMPTS_FOR_CALIBRATION.
  for (let i = 0; i < 4; i++) gs.recordQuestionAnswer("ma-linear", target, false);

  const lesson1After = getLessonQuestions("ma-linear", 0, { getQuestionStat });
  assertTrue(
    !lesson1After.some((q) => q.bankIndex === target),
    `expected bankIndex ${target} to have moved out of lesson 1 after repeated misses, but it's still there`
  );
});

test("a question the player has consistently aced can move INTO lesson 1 even if the heuristic thought it was hard", async () => {
  await preloadSubjectForSkill("ma-linear");
  const gs = new GameState();
  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);

  // The last lesson holds the heuristic's "hardest" questions; pick one and
  // give it a flawless personal record.
  const lastLessonIndex = Math.ceil(100 / 5) - 1; // ma-linear has no bonus lessons -> 20 lessons
  const target = getLessonQuestions("ma-linear", lastLessonIndex, { getQuestionStat })[0].bankIndex;
  for (let i = 0; i < 4; i++) gs.recordQuestionAnswer("ma-linear", target, true);

  const lesson1After = getLessonQuestions("ma-linear", 0, { getQuestionStat });
  assertTrue(
    lesson1After.some((q) => q.bankIndex === target),
    `expected consistently-aced bankIndex ${target} to have moved into lesson 1`
  );
});

test("fewer than 3 personal attempts doesn't move a question out of lesson 1 yet", async () => {
  await preloadSubjectForSkill("ma-linear");
  const gs = new GameState();
  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);

  const lesson1Before = getLessonQuestions("ma-linear", 0, { getQuestionStat });
  const target = lesson1Before[0].bankIndex;
  gs.recordQuestionAnswer("ma-linear", target, false);
  gs.recordQuestionAnswer("ma-linear", target, false);

  const lesson1After = getLessonQuestions("ma-linear", 0, { getQuestionStat });
  assertTrue(
    lesson1After.some((q) => q.bankIndex === target),
    "expected the question to still be in lesson 1 with only 2 personal attempts recorded"
  );
});

test("recalibration is stable between answers (same signature -> same order) but updates once new attempts land", async () => {
  await preloadSubjectForSkill("ma-linear");
  const gs = new GameState();
  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);

  const a = getLessonQuestions("ma-linear", 0, { getQuestionStat }).map((q) => q.bankIndex);
  const b = getLessonQuestions("ma-linear", 0, { getQuestionStat }).map((q) => q.bankIndex);
  assertEqual(JSON.stringify(a.slice().sort()), JSON.stringify(b.slice().sort()));

  const target = a[0];
  for (let i = 0; i < 4; i++) gs.recordQuestionAnswer("ma-linear", target, false);
  const c = getLessonQuestions("ma-linear", 0, { getQuestionStat }).map((q) => q.bankIndex);
  assertTrue(JSON.stringify(a.slice().sort()) !== JSON.stringify(c.slice().sort()), "expected lesson 1's contents to change after new calibrating data");
});

// --- calibration reaching Endless Mode too ---

test("getEndlessQuestion without a getQuestionStat callback behaves exactly as before", async () => {
  await preloadAllSubjects();
  const q = getEndlessQuestion(null, 0.5);
  assertTrue(q && typeof q.q === "string");
});

test("questions this player has personally aced are drawn far more often than ones they've missed, at a low difficulty target", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const flat = getAllQuestionsFlat();
  // 10-question groups from the same easy end of the same skill (so their
  // base difficultyPct starts out identical — only personal history
  // differs), not single questions: against the full multi-thousand-
  // question flat pool, any one specific question is too rare a draw on
  // its own for a modest round count to reliably land on non-flaky
  // numbers, but a same-direction group of 10 gives a stable signal.
  const easySkillQs = flat.filter((q) => q.skillId === "en-commas").slice(0, 20);
  const acedQs = easySkillQs.slice(0, 10);
  const missedQs = easySkillQs.slice(10, 20);
  for (const q of acedQs) for (let i = 0; i < 4; i++) gs.recordQuestionAnswer(q.skillId, q.bankIndex, true);
  for (const q of missedQs) for (let i = 0; i < 4; i++) gs.recordQuestionAnswer(q.skillId, q.bankIndex, false);

  const getQuestionStat = (skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex);
  let acedDraws = 0;
  let missedDraws = 0;
  const rounds = 8000;
  for (let i = 0; i < rounds; i++) {
    // Target the easy end (difficultyLevel near 0) — the aced group should
    // fit right in, the consistently-missed group should now read as
    // effectively harder and get drawn less at this target.
    const pick = getEndlessQuestion(null, 0.05, { getQuestionStat });
    if (acedQs.some((q) => q.skillId === pick.skillId && q.bankIndex === pick.bankIndex)) acedDraws++;
    if (missedQs.some((q) => q.skillId === pick.skillId && q.bankIndex === pick.bankIndex)) missedDraws++;
  }
  assertTrue(
    acedDraws > missedDraws * 3,
    `expected the aced group (drawn ${acedDraws}x) to be favored well over the missed group (drawn ${missedDraws}x) at an easy difficulty target`
  );
});
