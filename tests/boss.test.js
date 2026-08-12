// Regression tests for boss-level scaling (getBossMonster in bossMonsters.js):
// a boss should always render a few levels ahead of the player, but never
// below BOSS_LEVEL_MIN, and must never mutate the shared BOSS_MONSTERS config.
import { getBossMonster, BOSS_LEVEL_BONUS, BOSS_LEVEL_MIN } from "../js/data/bossMonsters.js";
import { test, assertEqual } from "./assert.js";

test("boss level floors at BOSS_LEVEL_MIN for a low-level player", () => {
  const boss = getBossMonster("math", 1);
  assertEqual(boss.avatar.level, BOSS_LEVEL_MIN);
});

test("boss level scales above the floor once the player outgrows it", () => {
  const playerLevel = BOSS_LEVEL_MIN + 10;
  const boss = getBossMonster("math", playerLevel);
  assertEqual(boss.avatar.level, playerLevel + BOSS_LEVEL_BONUS);
});

test("getBossMonster never mutates the shared BOSS_MONSTERS config", () => {
  const before = getBossMonster("english", 1).avatar.level;
  getBossMonster("english", 999); // a very different player level
  const after = getBossMonster("english", 1).avatar.level;
  assertEqual(before, after, "calling getBossMonster with a different player level changed a later call's result");
});

test("an unknown subject returns undefined without throwing", () => {
  assertEqual(getBossMonster("nonexistent", 5), undefined);
});

test("every subject's boss resolves to a renderable avatar config", () => {
  for (const subjectId of ["english", "math", "reading", "science"]) {
    const boss = getBossMonster(subjectId, 12);
    assertEqual(typeof boss.avatar.bodyShape, "string");
    assertEqual(boss.avatar.level, 12 + BOSS_LEVEL_BONUS);
  }
});
