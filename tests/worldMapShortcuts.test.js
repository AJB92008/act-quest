// Regression tests for the World Map's score-focused shortcut circles
// (Practice Test / Writing / Score Report) added alongside the existing
// five (Diagnostic/Weak Review/Adaptive Practice/Review Queue/Custom
// Drill) — see scoreShortcutsFor() in ui/worldMap.js. Practice Test and
// Score Report apply to any planet with a real Practice Test (ACT/SAT/
// PSAT); Writing is further gated to ACT only, since the real SAT/PSAT
// have no essay section for this app to build against.
import { GameState, gameState } from "../js/state.js";
import { renderWorldMap } from "../js/ui/worldMap.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  const fresh = new GameState();
  fresh.data.onboarded = true;
  gameState.data = fresh.data;
  return gameState;
}

function shortcutIdsFor(testId) {
  freshGameState();
  const root = document.createElement("div");
  renderWorldMap(root, () => {}, { testId });
  return [...root.querySelectorAll("[data-shortcut]")].map((n) => n.dataset.shortcut);
}

test("ACT's World Map includes Practice Test, Writing, and Score Report alongside the original 5 shortcuts", () => {
  const ids = shortcutIdsFor("act");
  ["diagnostic", "weakReview", "adaptivePractice", "reviewQueue", "drillBuilder", "practiceTest", "essay", "scoreReport"].forEach((id) =>
    assertTrue(ids.includes(id), `expected "${id}" among ACT's shortcuts, got [${ids.join(", ")}]`)
  );
  assertEqual(ids.length, 8);
});

test("SAT's World Map includes Practice Test and Score Report, but not Writing (the real SAT has no essay)", () => {
  const ids = shortcutIdsFor("sat");
  assertTrue(ids.includes("practiceTest"));
  assertTrue(ids.includes("scoreReport"));
  assertTrue(!ids.includes("essay"), "SAT should not offer a Writing shortcut");
  assertEqual(ids.length, 7);
});

test("PSAT's World Map includes Practice Test and Score Report, but not Writing (the real PSAT has no essay)", () => {
  const ids = shortcutIdsFor("psat");
  assertTrue(ids.includes("practiceTest"));
  assertTrue(ids.includes("scoreReport"));
  assertTrue(!ids.includes("essay"));
  assertEqual(ids.length, 7);
});

test("State Assessments' World Map has no shortcuts at all (no practiceTest config, and not ready yet either)", () => {
  const gs = freshGameState();
  gs.setHomeState("WI"); // avoid the no-homeState redirect to the state picker
  const root = document.createElement("div");
  renderWorldMap(root, () => {}, { testId: "stateAssessments" });
  assertEqual(root.querySelectorAll("[data-shortcut]").length, 0);
});

test("clicking the Score Report shortcut navigates with this planet's own testId", () => {
  const ids = shortcutIdsFor("sat"); // also resets gameState + renders
  assertTrue(ids.includes("scoreReport"));
  const root = document.createElement("div");
  let navigated = null;
  renderWorldMap(root, (screen, params) => (navigated = { screen, params }), { testId: "sat" });
  root.querySelector('[data-shortcut="scoreReport"]').click();
  assertEqual(navigated.screen, "scoreReport");
  assertEqual(navigated.params.testId, "sat");
});
