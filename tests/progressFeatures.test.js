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

test("recordLessonResult's returned outcome includes newlyUnlocked", () => {
  const gs = freshGameState();
  const outcome = gs.recordLessonResult("en-commas", 0, { correctCount: 5, totalCount: 5, starsEarned: 6, coinsEarned: 30 });
  assertTrue(Array.isArray(outcome.newlyUnlocked));
});

// --- boss lesson (lesson 21) gates mastery ---

test("finishing all 20 regular lessons doesn't master a skill on its own — the boss lesson is still required", () => {
  const gs = freshGameState();
  for (let i = 0; i < 20; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  const progress = gs.getSkillProgress("en-relevance");
  assertEqual(progress.lessonsCompleted, 20);
  assertTrue(!progress.mastered, "expected the skill to stay unmastered until the boss lesson (21) is cleared too");
});

test("passing the boss lesson (21) after all regular lessons masters the skill", () => {
  const gs = freshGameState();
  for (let i = 0; i < 20; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  const outcome = gs.recordLessonResult("en-relevance", 20, { correctCount: 11, totalCount: 15, starsEarned: 11, coinsEarned: 40 });
  assertTrue(outcome.justMastered, "expected clearing the boss lesson to master the skill");
  assertTrue(gs.getSkillProgress("en-relevance").mastered);
});

test("the boss lesson isn't unlocked until all 20 regular lessons are cleared", () => {
  const gs = freshGameState();
  assertTrue(!gs.isLessonUnlocked("en-relevance", 20));
  for (let i = 0; i < 19; i++) {
    gs.recordLessonResult("en-relevance", i, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  }
  assertTrue(!gs.isLessonUnlocked("en-relevance", 20), "boss should still be locked with one regular lesson left");
  gs.recordLessonResult("en-relevance", 19, { correctCount: 5, totalCount: 5, starsEarned: 5, coinsEarned: 20 });
  assertTrue(gs.isLessonUnlocked("en-relevance", 20), "boss should unlock right after the 20th regular lesson");
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
