// Regression tests for the optional Writing section: prompt data validity
// and the essay-history/best-score state that backs the results screen.
import { GameState } from "../js/state.js";
import { essayPrompts } from "../js/data/essayPrompts.js";
import { test, assertEqual, assertTrue } from "./assert.js";

// recordEssayResult (like other finish*/record* methods) writes to the
// real localStorage key, and run.html only clears that key once at the top
// of the whole suite — without this, a `new GameState()` here would
// inherit whatever an earlier test in this run already saved. See the same
// pattern in progressFeatures.test.js and srs.test.js.
function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

test("every essay prompt has the real ACT Writing shape: an issue statement plus exactly three perspectives", () => {
  assertTrue(essayPrompts.length > 0, "expected at least one prompt");
  for (const p of essayPrompts) {
    assertTrue(typeof p.id === "string" && p.id.length > 0, "missing id");
    assertTrue(typeof p.title === "string" && p.title.length > 0, "missing title");
    assertTrue(typeof p.issueStatement === "string" && p.issueStatement.length > 20, "issue statement too short");
    assertTrue(Array.isArray(p.perspectives) && p.perspectives.length === 3, "expected exactly 3 perspectives");
    for (const persp of p.perspectives) {
      assertTrue(typeof persp.label === "string" && persp.label.length > 0, "missing perspective label");
      assertTrue(typeof persp.text === "string" && persp.text.length > 20, "perspective text too short");
    }
  }
});

test("essay prompt ids are unique", () => {
  const ids = essayPrompts.map((p) => p.id);
  assertEqual(new Set(ids).size, ids.length);
});

test("recordEssayResult starts a new player's best at 0 and updates it on the first essay", () => {
  const gs = freshGameState();
  assertEqual(gs.essayBest, 0);
  const outcome = gs.recordEssayResult({
    promptId: essayPrompts[0].id,
    wordCount: 320,
    domainScores: { ideas: 4, development: 3, organization: 4, language: 5 },
    totalScore: 8,
    starsEarned: 16,
    coinsEarned: 54,
  });
  assertTrue(outcome.isNewBest, "first essay should always be a new best");
  assertEqual(gs.essayBest, 8);
  assertEqual(gs.getEssayHistory().length, 1);
  assertEqual(gs.getEssayHistory()[0].totalScore, 8);
});

test("recordEssayResult doesn't lower bestScore on a weaker subsequent essay, but still logs it in history", () => {
  const gs = freshGameState();
  gs.recordEssayResult({ promptId: essayPrompts[0].id, wordCount: 400, domainScores: { ideas: 6, development: 6, organization: 6, language: 6 }, totalScore: 12, starsEarned: 20, coinsEarned: 66 });
  const secondOutcome = gs.recordEssayResult({ promptId: essayPrompts[1].id, wordCount: 200, domainScores: { ideas: 2, development: 2, organization: 2, language: 2 }, totalScore: 4, starsEarned: 12, coinsEarned: 42 });
  assertTrue(!secondOutcome.isNewBest, "a lower score shouldn't register as a new best");
  assertEqual(gs.essayBest, 12);
  assertEqual(gs.getEssayHistory().length, 2);
});

test("recordEssayResult banks stars and coins the same way other finish* methods do", () => {
  const gs = freshGameState();
  const startingCoins = gs.coins;
  const startingStars = gs.totalStars;
  gs.recordEssayResult({ promptId: essayPrompts[0].id, wordCount: 300, domainScores: { ideas: 4, development: 4, organization: 4, language: 4 }, totalScore: 8, starsEarned: 16, coinsEarned: 54 });
  assertEqual(gs.coins, startingCoins + 54);
  assertEqual(gs.totalStars, startingStars + 16);
});
