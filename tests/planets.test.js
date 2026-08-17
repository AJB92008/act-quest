// Regression tests for the multi-planet infrastructure (data/tests.js) —
// ACT and both of SAT's subjects (data/satSkills.js: Reading & Writing and
// Math, full 100-question-per-skill banks in data/questions/satRw.js and
// data/questions/satMath.js) all have playable content now; every subject
// on PSAT/State Assessments is still fully empty scaffolding. These tests
// guard the things that actually matter at this stage: ACT's data is
// untouched by being folded into the registry, every id across every
// planet stays globally unique (the one hard rule the cross-planet
// getSubject()/getSkill() lookups depend on), and a subject with a real
// skill tree but no content yet (contentPending) is correctly reported as
// not playable rather than crashing something downstream that assumes
// real lesson data exists wherever a skill id does.
import { SUBJECTS as ACT_SUBJECTS } from "../js/data/skills.js";
import { REPORTING_CATEGORIES as SAT_REPORTING_CATEGORIES, SAT_SUBJECTS } from "../js/data/satSkills.js";
import { TESTS, TEST_IDS, getTest, getTestSubjects, isTestReady, isSubjectPlayable, getSubject, getSkill } from "../js/data/tests.js";
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

test("ACT, SAT, and PSAT are ready now that each has at least one subject with real content; State Assessments is still empty", () => {
  assertTrue(isTestReady("act"));
  assertTrue(isTestReady("sat"));
  assertTrue(isTestReady("psat"));
  assertTrue(!isTestReady("stateAssessments"));
});

test("every subject id is globally unique across every planet", () => {
  const ids = TESTS.flatMap((t) => t.subjects.map((s) => s.id));
  assertEqual(new Set(ids).size, ids.length, "expected no subject id to repeat across planets");
});

test("every skill id is globally unique across every planet", () => {
  const ids = TESTS.flatMap((t) => t.subjects.flatMap((s) => s.skills.map((sk) => sk.id)));
  assertEqual(new Set(ids).size, ids.length, "expected no skill id to repeat across planets");
  assertTrue(ids.length > ACT_SUBJECTS.flatMap((s) => s.skills).length, "expected at least one non-ACT skill (SAT Reading & Writing) to exist");
});

// --- SAT Reading & Writing (data/satSkills.js) ---

test("SAT Reading & Writing's skill tree is folded into the sat planet by reference", () => {
  const subject = getTestSubjects("sat").find((s) => s.id === "sat-rw");
  assertEqual(subject, SAT_SUBJECTS[0]);
});

test("SAT Reading & Writing has a real skill tree and is reported as playable", () => {
  const subject = getSubject("sat-rw");
  assertTrue(!subject.contentPending, "sat-rw's content is complete — contentPending should be unset");
  assertTrue(subject.skills.length > 0, "expected a real skill tree, not an empty placeholder");
  assertTrue(isSubjectPlayable(subject), "a skill tree with real content and no contentPending flag should count as playable");
});

test("a subject still marked contentPending is correctly reported as not playable", () => {
  const pendingSubject = { id: "test-pending", skills: [{ id: "test-skill" }], contentPending: true };
  assertTrue(!isSubjectPlayable(pendingSubject), "a skill tree with contentPending should not count as playable");
});

test("every SAT Reading & Writing skill's reportingCategory is a real domain in its REPORTING_CATEGORIES", () => {
  const domainIds = new Set(SAT_REPORTING_CATEGORIES["sat-rw"].map((c) => c.id));
  const subject = getSubject("sat-rw");
  for (const skill of subject.skills) {
    assertTrue(domainIds.has(skill.reportingCategory), `skill "${skill.id}" has an unrecognized reportingCategory "${skill.reportingCategory}"`);
  }
});

test("SAT Reading & Writing's four domain weights sum to 1", () => {
  const total = SAT_REPORTING_CATEGORIES["sat-rw"].reduce((sum, c) => sum + c.weight, 0);
  assertTrue(Math.abs(total - 1) < 1e-9, `expected domain weights to sum to 1, got ${total}`);
});

test("getSubject/getSkill (data/tests.js) resolve real ACT ids exactly like skills.js's own versions", () => {
  const subject = getSubject("math");
  assertTrue(!!subject && subject.id === "math");
  const found = getSkill("ma-linear");
  assertTrue(!!found && found.skill.id === "ma-linear" && found.subject.id === "math");
});

test("getSubject/getSkill resolve a scaffolded (contentless) planet's subject, and correctly find no skill in it", () => {
  const subject = getSubject("state-math");
  assertTrue(!!subject && subject.name === "Math" && subject.skills.length === 0);
  assertEqual(getSkill("sat-anything-not-real"), null);
});

// --- SAT Math (data/satSkills.js) ---

test("SAT Math has a real skill tree and is reported as playable", () => {
  const subject = getSubject("sat-math");
  assertTrue(!subject.contentPending, "sat-math's content is complete — contentPending should be unset");
  assertTrue(subject.skills.length > 0, "expected a real skill tree, not an empty placeholder");
  assertTrue(isSubjectPlayable(subject), "a skill tree with real content and no contentPending flag should count as playable");
});

test("SAT Math lists the College Board's real 19 skills across its 4 domains", () => {
  const subject = getSubject("sat-math");
  assertEqual(subject.skills.length, 19);
});

test("every SAT Math skill's reportingCategory is a real domain in its REPORTING_CATEGORIES", () => {
  const domainIds = new Set(SAT_REPORTING_CATEGORIES["sat-math"].map((c) => c.id));
  const subject = getSubject("sat-math");
  for (const skill of subject.skills) {
    assertTrue(domainIds.has(skill.reportingCategory), `skill "${skill.id}" has an unrecognized reportingCategory "${skill.reportingCategory}"`);
  }
});

test("SAT Math's four domain weights sum to 1", () => {
  const total = SAT_REPORTING_CATEGORIES["sat-math"].reduce((sum, c) => sum + c.weight, 0);
  assertTrue(Math.abs(total - 1) < 1e-9, `expected domain weights to sum to 1, got ${total}`);
});

test("getSubject/getSkill return undefined/null (not throw) for a completely unknown id", () => {
  assertEqual(getSubject("not-a-real-subject"), undefined);
  assertEqual(getSkill("not-a-real-skill"), null);
});

test("a fresh save has a real skillProgress entry for every SAT Reading & Writing skill, not just ACT's", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  for (const skill of getSubject("sat-rw").skills) {
    const p = gs.getSkillProgress(skill.id);
    assertTrue(!!p, `expected a skillProgress entry for "${skill.id}"`);
    assertEqual(p.attempts, 0);
    assertEqual(p.mastered, false);
  }
  localStorage.removeItem("act-quest-save-v1");
});

test("getSubjectStats works correctly for a subject with real skills and content", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  const stats = gs.getSubjectStats("sat-rw");
  assertEqual(stats.masteredCount, 0);
  assertEqual(stats.totalSkills, getSubject("sat-rw").skills.length);
  localStorage.removeItem("act-quest-save-v1");
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
