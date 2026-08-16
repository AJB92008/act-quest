// Regression tests for the multi-planet infrastructure (data/tests.js) —
// ACT is the only planet with real content, the other three are
// scaffolding (empty skill trees) for future content. These tests guard
// the two things that actually matter at this stage: ACT's data is
// untouched by being folded into the registry, and every id across every
// planet stays globally unique (the one hard rule the cross-planet
// getSubject()/getSkill() lookups below depend on).
import { SUBJECTS as ACT_SUBJECTS } from "../js/data/skills.js";
import { TESTS, TEST_IDS, getTest, getTestSubjects, isTestReady, getSubject, getSkill } from "../js/data/tests.js";
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("TEST_IDS lists exactly the four planets", () => {
  assertEqual(TEST_IDS.size, 4);
  ["act", "sat", "psat", "stateAssessments"].forEach((id) => assertTrue(TEST_IDS.has(id), `expected TEST_IDS to include "${id}"`));
});

test("ACT's planet reuses skills.js's real SUBJECTS by reference, not a copy", () => {
  assertEqual(getTestSubjects("act"), ACT_SUBJECTS);
});

test("getTest returns undefined for an unknown planet id rather than throwing", () => {
  assertEqual(getTest("not-a-real-planet"), undefined);
  assertEqual(getTestSubjects("not-a-real-planet").length, 0);
});

test("only ACT is ready — the other three planets have no lessons yet", () => {
  assertTrue(isTestReady("act"));
  assertTrue(!isTestReady("sat"));
  assertTrue(!isTestReady("psat"));
  assertTrue(!isTestReady("stateAssessments"));
});

test("every subject id is globally unique across every planet", () => {
  const ids = TESTS.flatMap((t) => t.subjects.map((s) => s.id));
  assertEqual(new Set(ids).size, ids.length, "expected no subject id to repeat across planets");
});

test("every skill id is globally unique across every planet (none exist outside ACT yet, but the rule still holds)", () => {
  const ids = TESTS.flatMap((t) => t.subjects.flatMap((s) => s.skills.map((sk) => sk.id)));
  assertEqual(new Set(ids).size, ids.length, "expected no skill id to repeat across planets");
});

test("getSubject/getSkill (data/tests.js) resolve real ACT ids exactly like skills.js's own versions", () => {
  const subject = getSubject("math");
  assertTrue(!!subject && subject.id === "math");
  const found = getSkill("ma-linear");
  assertTrue(!!found && found.skill.id === "ma-linear" && found.subject.id === "math");
});

test("getSubject/getSkill resolve a scaffolded (contentless) planet's subject, and correctly find no skill in it", () => {
  const subject = getSubject("sat-math");
  assertTrue(!!subject && subject.name === "Math" && subject.skills.length === 0);
  assertEqual(getSkill("sat-anything-not-real"), null);
});

test("getSubject/getSkill return undefined/null (not throw) for a completely unknown id", () => {
  assertEqual(getSubject("not-a-real-subject"), undefined);
  assertEqual(getSkill("not-a-real-skill"), null);
});

// --- gameState.currentTestId ---

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

test("a fresh save defaults currentTestId to act", () => {
  const gs = freshGameState();
  assertEqual(gs.currentTestId, "act");
});

test("setCurrentTestId persists a real planet id", () => {
  const gs = freshGameState();
  gs.setCurrentTestId("sat");
  assertEqual(gs.currentTestId, "sat");
});

test("setCurrentTestId silently ignores an unknown planet id instead of corrupting state", () => {
  const gs = freshGameState();
  gs.setCurrentTestId("not-a-real-planet");
  assertEqual(gs.currentTestId, "act");
});

test("state.js's load path resets a tampered/unknown currentTestId from an imported save instead of carrying it through", () => {
  localStorage.setItem("act-quest-save-v1", JSON.stringify({ currentTestId: "not-a-real-planet" }));
  const gs = new GameState();
  assertEqual(gs.currentTestId, "act");
  localStorage.removeItem("act-quest-save-v1");
});
