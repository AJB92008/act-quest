// Regression tests for the streak tracker, achievement system, pacing
// stats, and study-plan date math added to state.js.
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

// Several methods under test here call gameState.save(), which (unlike the
// read-only assertions elsewhere) writes to the real localStorage key —
// and since run.html only clears that key once, at the very top of the
// whole suite, a `new GameState()` in a later test would otherwise inherit
// an earlier test's saved state. Clear it right before each fresh instance
// so every test starts from a true blank save.
function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

// --- streak ---

test("a fresh save has no streak", () => {
  const gs = freshGameState();
  const streak = gs.getStreak();
  assertEqual(streak.current, 0);
  assertEqual(streak.best, 0);
});

test("finishing a session today starts a 1-day streak", () => {
  const gs = freshGameState();
  gs._recordDailyActivity();
  const streak = gs.getStreak();
  assertEqual(streak.current, 1);
  assertEqual(streak.best, 1);
  assertTrue(streak.activeToday);
});

test("calling _recordDailyActivity twice in the same day doesn't double-count", () => {
  const gs = freshGameState();
  gs._recordDailyActivity();
  gs._recordDailyActivity();
  assertEqual(gs.getStreak().current, 1);
});

test("activity on consecutive days increments the streak; a gap resets it", () => {
  const gs = freshGameState();
  const today = gs._todayLocalDateStr();
  // Simulate 3 consecutive days ending yesterday, then a 3-day gap before today.
  gs.data.streak.lastActiveDate = gs._addDaysToDateStr(today, -5);
  gs.data.streak.current = 3;
  gs.data.streak.best = 3;
  const readBeforeToday = gs.getStreak();
  assertEqual(readBeforeToday.current, 0, "a streak with a multi-day gap should read as broken (0) even before new activity is recorded");

  gs._recordDailyActivity();
  const after = gs.getStreak();
  assertEqual(after.current, 1, "activity after a gap starts a fresh 1-day streak");
  assertEqual(after.best, 3, "best streak is preserved even after the current streak resets");
});

test("consecutive-day activity accumulates correctly", () => {
  const gs = freshGameState();
  const today = gs._todayLocalDateStr();
  gs.data.streak.lastActiveDate = gs._addDaysToDateStr(today, -1);
  gs.data.streak.current = 4;
  gs.data.streak.best = 4;
  gs._recordDailyActivity();
  const streak = gs.getStreak();
  assertEqual(streak.current, 5);
  assertEqual(streak.best, 5);
});

// --- achievements ---

test("no achievements are unlocked on a fresh save", () => {
  const gs = freshGameState();
  const unlocked = gs.getAchievements().filter((a) => a.unlockedAt !== null);
  assertEqual(unlocked.length, 0);
});

test("mastering a skill unlocks the first-mastery achievement", () => {
  const gs = freshGameState();
  gs.cheatSetSkillMastered("en-commas", true);
  const newly = gs._checkAchievements();
  assertTrue(newly.some((a) => a.id === "first-mastery"));
});

test("an already-unlocked achievement is never returned again by _checkAchievements", () => {
  const gs = freshGameState();
  gs.cheatSetSkillMastered("en-commas", true);
  gs._checkAchievements();
  const second = gs._checkAchievements();
  assertTrue(!second.some((a) => a.id === "first-mastery"));
});

test("reaching level 10 unlocks the level-10 achievement", () => {
  const gs = freshGameState();
  gs.cheatAddXp(5000);
  assertTrue(gs.level >= 10);
  const newly = gs._checkAchievements();
  assertTrue(newly.some((a) => a.id === "level-10"));
});

// "Test Day" is about the milestone of finishing any full-length practice
// test at all — completing one on SAT or PSAT (both now have their own,
// see data/tests.js's practiceTest config) should unlock it exactly like
// completing one on ACT always has.
test("completing a full-length practice test on any planet unlocks Test Day", () => {
  const gs = freshGameState();
  // recordPracticeTestResult already runs _checkAchievements internally
  // (see state.js) — its own returned outcome.newlyUnlocked is the real
  // signal, same as every screen that calls it reads. A second, separate
  // _checkAchievements() call here would find nothing new (already
  // unlocked on the first pass), same as the
  // "an already-unlocked achievement is never returned again" test above.
  const outcome = gs.recordPracticeTestResult({
    sectionResults: [{ subjectId: "sat-rw", label: "Reading & Writing", correctCount: 30, totalCount: 54, subscore: 500 }],
    composite: 1000,
    starsEarned: 0,
    coinsEarned: 0,
    testId: "sat",
  });
  assertTrue(outcome.newlyUnlocked.some((a) => a.id === "test-day"), "expected an SAT practice test to unlock test-day");
});

// "Solid Score"/"Standout Score" name specific 1-36 ACT composite
// thresholds ("25+", "30+") — an SAT/PSAT composite (400-1600 / 320-1520)
// clears those trivially and must never unlock them.
test("a high SAT composite does not unlock the ACT-scoped Solid/Standout Score achievements", () => {
  const gs = freshGameState();
  const outcome = gs.recordPracticeTestResult({
    sectionResults: [{ subjectId: "sat-rw", label: "Reading & Writing", correctCount: 54, totalCount: 54, subscore: 800 }],
    composite: 1600,
    starsEarned: 0,
    coinsEarned: 0,
    testId: "sat",
  });
  assertTrue(!outcome.newlyUnlocked.some((a) => a.id === "solid-score"), "a 1600 SAT composite should not unlock a 25+ ACT-composite achievement");
  assertTrue(!outcome.newlyUnlocked.some((a) => a.id === "standout-score"), "a 1600 SAT composite should not unlock a 30+ ACT-composite achievement");
});

test("a 25+ ACT composite still unlocks Solid Score", () => {
  const gs = freshGameState();
  const outcome = gs.recordPracticeTestResult({
    sectionResults: [{ subjectId: "math", label: "Math", correctCount: 45, totalCount: 60, subscore: 25 }],
    composite: 25,
    starsEarned: 0,
    coinsEarned: 0,
  });
  assertTrue(outcome.newlyUnlocked.some((a) => a.id === "solid-score"));
});

test("recordLessonResult's returned outcome includes newlyUnlocked", () => {
  const gs = freshGameState();
  const outcome = gs.recordLessonResult("en-commas", 0, { correctCount: 5, totalCount: 5, starsEarned: 6, coinsEarned: 30 });
  assertTrue(Array.isArray(outcome.newlyUnlocked));
});

// --- boss lesson: a skill's own final lesson (index 19 for a standard
// 20-lesson skill like en-relevance), replaced with a bigger 15-question
// one rather than added on top — gates mastery ---

test("finishing the 19 lessons before the boss doesn't master a skill on its own — the boss (its final lesson) is still required", () => {
  const gs = freshGameState();
  for (let i = 0; i < 19; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  const progress = gs.getSkillProgress("en-relevance");
  assertEqual(progress.lessonsCompleted, 19);
  assertTrue(!progress.mastered, "expected the skill to stay unmastered until the boss lesson (its final lesson, index 19) is cleared too");
});

test("passing the boss lesson (a skill's final lesson) after the lessons before it masters the skill", () => {
  const gs = freshGameState();
  for (let i = 0; i < 19; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  const outcome = gs.recordLessonResult("en-relevance", 19, { correctCount: 11, totalCount: 15, starsEarned: 11, coinsEarned: 40 });
  assertTrue(outcome.justMastered, "expected clearing the boss lesson to master the skill");
  assertTrue(gs.getSkillProgress("en-relevance").mastered);
});

test("the boss lesson isn't unlocked until the lessons before it are cleared", () => {
  const gs = freshGameState();
  assertTrue(!gs.isLessonUnlocked("en-relevance", 19));
  for (let i = 0; i < 18; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  assertTrue(!gs.isLessonUnlocked("en-relevance", 19), "boss should still be locked with one lesson left before it");
  gs.recordLessonResult("en-relevance", 18, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  assertTrue(gs.isLessonUnlocked("en-relevance", 19), "boss should unlock right after the lesson before it");
});

// --- pacing ---

test("getPacingStats is null before any samples are recorded", () => {
  const gs = freshGameState();
  assertEqual(gs.getPacingStats("math"), null);
});

test("recordPaceSample feeds a rolling average, and caps at 50 samples", () => {
  const gs = freshGameState();
  for (let i = 0; i < 60; i++) gs.recordPaceSample("math", 40);
  const stats = gs.getPacingStats("math");
  assertEqual(stats.sampleCount, 50);
  assertEqual(Math.round(stats.avgSeconds), 40);
  assertTrue(stats.budgetSeconds > 0);
});

// --- study plan ---

test("getDaysUntilTest is null with no test date set", () => {
  const gs = freshGameState();
  assertEqual(gs.getDaysUntilTest(), null);
});

test("getDaysUntilTest computes whole days from today to the configured date", () => {
  const gs = freshGameState();
  const today = gs._todayLocalDateStr();
  const future = gs._addDaysToDateStr(today, 14);
  gs.setStudyPlanSettings({ testDate: future, targetScore: 30 });
  assertEqual(gs.getDaysUntilTest(), 14);
});

test("getDaysUntilTest floors at 0 for a past date rather than going negative", () => {
  const gs = freshGameState();
  const today = gs._todayLocalDateStr();
  const past = gs._addDaysToDateStr(today, -10);
  gs.setStudyPlanSettings({ testDate: past });
  assertEqual(gs.getDaysUntilTest(), 0);
});

// --- export / import save ---

test("exportSave produces JSON that round-trips through importSave into an equivalent state", () => {
  const gs1 = freshGameState();
  gs1.setName("Exportia");
  gs1.cheatAddCoins(123);
  gs1.cheatSetSkillMastered("en-commas", true);
  const json = gs1.exportSave();

  const gs2 = freshGameState();
  const result = gs2.importSave(json);
  assertTrue(result.ok, result.error);
  assertEqual(gs2.data.createdName, "Exportia");
  assertEqual(gs2.data.coins, 123);
  assertTrue(gs2.isMastered("en-commas"));
});

test("importSave rejects invalid JSON without touching existing progress", () => {
  const gs = freshGameState();
  gs.cheatAddCoins(50);
  const result = gs.importSave("not valid json {{{");
  assertTrue(!result.ok);
  assertEqual(gs.data.coins, 50);
});

test("importSave rejects well-formed JSON that isn't a save file", () => {
  const gs = freshGameState();
  const result = gs.importSave(JSON.stringify({ hello: "world" }));
  assertTrue(!result.ok);
});

test("importSave backfills fields missing from an older exported save", () => {
  const gs1 = freshGameState();
  const stripped = { ...gs1.data };
  delete stripped.srs; // simulate a save exported before SRS existed
  const gs2 = freshGameState();
  const result = gs2.importSave(JSON.stringify(stripped));
  assertTrue(result.ok, result.error);
  assertTrue(gs2.data.srs !== undefined, "missing fields should be backfilled with defaults, not left absent");
  assertEqual(gs2.data.srs.totalReviews, 0);
});

// --- endless mode, scoped per test (ACT/SAT/PSAT) ---

test("a fresh save has a zero endless-mode best run for every test", () => {
  const gs = freshGameState();
  assertEqual(gs.getEndlessBest("act"), 0);
  assertEqual(gs.getEndlessBest("sat"), 0);
  assertEqual(gs.getEndlessBest("psat"), 0);
});

test("recordEndlessRun defaults to testId 'act' when none is given", () => {
  const gs = freshGameState();
  gs.recordEndlessRun({ correctCount: 10, starsEarned: 10, coinsEarned: 40 });
  assertEqual(gs.getEndlessBest("act"), 10);
  assertEqual(gs.getEndlessBest("sat"), 0);
});

test("an ACT endless run's best score doesn't pollute SAT's or PSAT's", () => {
  const gs = freshGameState();
  gs.recordEndlessRun({ correctCount: 15, starsEarned: 15, coinsEarned: 60, testId: "act" });
  gs.recordEndlessRun({ correctCount: 8, starsEarned: 8, coinsEarned: 32, testId: "sat" });
  assertEqual(gs.getEndlessBest("act"), 15);
  assertEqual(gs.getEndlessBest("sat"), 8);
  assertEqual(gs.getEndlessBest("psat"), 0);
});

test("recordEndlessRun only reports isNewBest when that specific test's record is actually beaten", () => {
  const gs = freshGameState();
  const first = gs.recordEndlessRun({ correctCount: 12, starsEarned: 12, coinsEarned: 48, testId: "psat" });
  assertTrue(first.isNewBest);
  const worse = gs.recordEndlessRun({ correctCount: 5, starsEarned: 5, coinsEarned: 20, testId: "psat" });
  assertTrue(!worse.isNewBest);
  assertEqual(gs.getEndlessBest("psat"), 12, "a worse run shouldn't overwrite the existing best");
});

// Endless Mode used to be ACT-only, so a pre-multi-test save has the
// legacy flat `endless.bestRun` number instead of the per-test object —
// that real best has to survive the upgrade into bestRun.act rather than
// silently resetting to 0.
test("a legacy flat endless.bestRun number migrates into bestRun.act", () => {
  localStorage.removeItem("act-quest-save-v1");
  const legacy = { version: 1, endless: { bestRun: 18, timerEnabled: false } };
  localStorage.setItem("act-quest-save-v1", JSON.stringify(legacy));
  const gs = new GameState();
  assertEqual(gs.getEndlessBest("act"), 18);
  assertEqual(gs.getEndlessBest("sat"), 0);
  assertEqual(gs.endlessTimerEnabled, false);
  localStorage.removeItem("act-quest-save-v1");
});

test("the endless-grinder achievement unlocks from a 25+ run on any test, not just ACT", () => {
  const gs = freshGameState();
  // recordEndlessRun already runs _checkAchievements internally — its own
  // returned newlyUnlocked is the real signal, same as
  // recordPracticeTestResult's equivalent test above.
  const { newlyUnlocked } = gs.recordEndlessRun({ correctCount: 26, starsEarned: 26, coinsEarned: 100, testId: "sat" });
  assertTrue(newlyUnlocked.some((a) => a.id === "endless-grinder"), "a SAT-mode run of 25+ should unlock the same achievement an ACT run would");
});
