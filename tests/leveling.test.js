// Regression tests for the level-based monster growth curve and the
// underlying xp -> level formula. These pin down the two guarantees the
// growth curve was explicitly designed around (see monster.js): always
// exactly +25% at the first level-up, and never past LEVEL_SIZE_CAP no
// matter how high level climbs.
import { levelSizeBonus, LEVEL_SIZE_CAP } from "../js/ui/monster.js";
import { GameState } from "../js/state.js";
import { test, assertEqual, assertClose, assertTrue } from "./assert.js";

test("levelSizeBonus(1) is exactly 1 (no bonus at the starting level)", () => {
  assertEqual(levelSizeBonus(1), 1);
});

test("levelSizeBonus(2) is the guaranteed +25%, regardless of the cap's value", () => {
  assertClose(levelSizeBonus(2), 1.25, 0.0001);
});

test("levelSizeBonus never exceeds LEVEL_SIZE_CAP, even far past normal play", () => {
  // At extreme levels the underlying Math.pow(ratio, steps) underflows to
  // exactly 0 (ratio < 1 raised to a large enough power), so the formula
  // lands exactly on the cap rather than staying strictly below it — that's
  // fine and matches how the rest of the codebase treats this cap (e.g.
  // ACCESSORY_SCALE_CAP's Math.min clamp); the invariant that matters is
  // "never past it," not "never reaches it."
  assertTrue(levelSizeBonus(1000) <= LEVEL_SIZE_CAP, "should never exceed the cap");
  assertTrue(levelSizeBonus(1000) > LEVEL_SIZE_CAP - 0.001, "should be extremely close to the cap by level 1000");
});

test("levelSizeBonus is monotonically non-decreasing across levels 1-100", () => {
  let prev = levelSizeBonus(1);
  for (let lvl = 2; lvl <= 100; lvl++) {
    const cur = levelSizeBonus(lvl);
    assertTrue(cur >= prev, `levelSizeBonus decreased at level ${lvl}: ${prev} -> ${cur}`);
    prev = cur;
  }
});

test("a fresh save starts at level 1 with 0 xp", () => {
  const gs = new GameState();
  assertEqual(gs.level, 1);
  assertEqual(gs.xp, 0);
});

test("level thresholds match the documented curve (L2@20xp, L3@80xp, L4@180xp)", () => {
  const gs = new GameState();
  gs.data.monster.xp = 19;
  assertEqual(gs.level, 1, "19xp should not be enough for level 2");
  gs.data.monster.xp = 20;
  assertEqual(gs.level, 2);
  gs.data.monster.xp = 79;
  assertEqual(gs.level, 2, "79xp should not be enough for level 3");
  gs.data.monster.xp = 80;
  assertEqual(gs.level, 3);
  gs.data.monster.xp = 179;
  assertEqual(gs.level, 3, "179xp should not be enough for level 4");
  gs.data.monster.xp = 180;
  assertEqual(gs.level, 4);
});

test("getLevelProgress().pct is 0 right at a level's own xp floor", () => {
  const gs = new GameState();
  gs.data.monster.xp = 20; // exactly level 2's floor
  const progress = gs.getLevelProgress();
  assertEqual(progress.level, 2);
  assertClose(progress.pct, 0, 0.001);
});
