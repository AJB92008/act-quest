// Tests for both PSAT/NMSQT skill trees themselves (data/psatSkills.js) —
// domain weights, reportingCategory validity, and id uniqueness.
// psat-rw's content-integrity assertions (100 questions per skill,
// well-formed shape, etc.) live in psatRwContent.test.js instead, same
// split satRwContent.test.js uses for sat-rw's own question-bank checks.
// psat-math has no question bank yet (still contentPending) — its tests
// here guard the tree itself, the same "tree before content" stage
// psat-rw's own tests covered before its question bank was written.
import { PSAT_REPORTING_CATEGORIES, PSAT_SUBJECTS } from "../js/data/psatSkills.js";
import { getSubject, isSubjectPlayable, isTestReady, getTestSubjects } from "../js/data/tests.js";
import { getLessonCount } from "../js/data/questions/index.js";
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const PSAT_RW_SUBJECT = PSAT_SUBJECTS.find((s) => s.id === "psat-rw");
const PSAT_RW_SKILL_IDS = PSAT_RW_SUBJECT.skills.map((s) => s.id);
const PSAT_MATH_SUBJECT = PSAT_SUBJECTS.find((s) => s.id === "psat-math");
const PSAT_MATH_SKILL_IDS = PSAT_MATH_SUBJECT.skills.map((s) => s.id);

test("psat-rw's skill tree is folded into the psat planet by reference", () => {
  const subject = getTestSubjects("psat").find((s) => s.id === "psat-rw");
  assertEqual(subject, PSAT_RW_SUBJECT);
});

test("psat-rw lists exactly 17 skills, mirroring sat-rw's domain breakdown", () => {
  assertEqual(PSAT_RW_SKILL_IDS.length, 17);
});

test("psat-rw is no longer contentPending and is correctly reported as playable", () => {
  const subject = getSubject("psat-rw");
  assertTrue(!subject.contentPending, "psat-rw now has a real question bank — contentPending should be unset");
  assertTrue(subject.skills.length > 0, "expected a real skill tree, not an empty placeholder");
  assertTrue(isSubjectPlayable(subject), "a skill tree with real content and no contentPending flag should count as playable");
});

test("the psat planet is ready overall now that psat-rw is playable (psat-math is still contentPending)", () => {
  assertTrue(isTestReady("psat"));
});

test("every psat-rw skill's reportingCategory is a real domain in PSAT_REPORTING_CATEGORIES", () => {
  const domainIds = new Set(PSAT_REPORTING_CATEGORIES["psat-rw"].map((c) => c.id));
  for (const skill of PSAT_RW_SUBJECT.skills) {
    assertTrue(domainIds.has(skill.reportingCategory), `skill "${skill.id}" has an unrecognized reportingCategory "${skill.reportingCategory}"`);
  }
});

test("psat-rw's four domain weights sum to 1", () => {
  const total = PSAT_REPORTING_CATEGORIES["psat-rw"].reduce((sum, c) => sum + c.weight, 0);
  assertTrue(Math.abs(total - 1) < 1e-9, `expected domain weights to sum to 1, got ${total}`);
});

test("psat-rw's domain weights and skill-per-domain split match sat-rw's exactly", () => {
  const byDomain = {};
  for (const skill of PSAT_RW_SUBJECT.skills) {
    byDomain[skill.reportingCategory] = (byDomain[skill.reportingCategory] || 0) + 1;
  }
  assertEqual(byDomain.ii, 5);
  assertEqual(byDomain.cs, 5);
  assertEqual(byDomain.eoi, 3);
  assertEqual(byDomain.sec, 4);
});

test("getSubject/getSkill (data/tests.js) resolve psat-rw ids", () => {
  const subject = getSubject("psat-rw");
  assertTrue(!!subject && subject.id === "psat-rw");
});

test("no psat-rw skill id collides with any other planet's skill id", () => {
  for (const id of PSAT_RW_SKILL_IDS) {
    assertTrue(id.startsWith("psatrw-"), `expected "${id}" to use the psatrw- prefix`);
  }
});

test("getLessonCount resolves a real value for a psat-rw skill from its skill tree alone, no bank load required", () => {
  assertEqual(getLessonCount("psatrw-centralidea"), 20);
});

test("a fresh save has a real skillProgress entry for every psat-rw skill", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  for (const skill of PSAT_RW_SUBJECT.skills) {
    const p = gs.getSkillProgress(skill.id);
    assertTrue(!!p, `expected a skillProgress entry for "${skill.id}"`);
    assertEqual(p.attempts, 0);
    assertEqual(p.mastered, false);
  }
  localStorage.removeItem("act-quest-save-v1");
});

// --- psat-math (infrastructure only — see psatSkills.js's header comment) ---

test("psat-math's skill tree is folded into the psat planet by reference", () => {
  const subject = getTestSubjects("psat").find((s) => s.id === "psat-math");
  assertEqual(subject, PSAT_MATH_SUBJECT);
});

test("psat-math lists exactly 19 skills, mirroring sat-math's domain breakdown", () => {
  assertEqual(PSAT_MATH_SKILL_IDS.length, 19);
});

test("psat-math is marked contentPending and is correctly reported as not yet playable", () => {
  const subject = getSubject("psat-math");
  assertTrue(subject.contentPending, "psat-math has no question content yet — contentPending should be set");
  assertTrue(subject.skills.length > 0, "expected a real skill tree, not an empty placeholder");
  assertTrue(!isSubjectPlayable(subject), "a skill tree with contentPending should not count as playable yet");
});

test("every psat-math skill's reportingCategory is a real domain in PSAT_REPORTING_CATEGORIES", () => {
  const domainIds = new Set(PSAT_REPORTING_CATEGORIES["psat-math"].map((c) => c.id));
  for (const skill of PSAT_MATH_SUBJECT.skills) {
    assertTrue(domainIds.has(skill.reportingCategory), `skill "${skill.id}" has an unrecognized reportingCategory "${skill.reportingCategory}"`);
  }
});

test("psat-math's four domain weights sum to 1", () => {
  const total = PSAT_REPORTING_CATEGORIES["psat-math"].reduce((sum, c) => sum + c.weight, 0);
  assertTrue(Math.abs(total - 1) < 1e-9, `expected domain weights to sum to 1, got ${total}`);
});

test("psat-math's domain weights and skill-per-domain split match sat-math's exactly", () => {
  const byDomain = {};
  for (const skill of PSAT_MATH_SUBJECT.skills) {
    byDomain[skill.reportingCategory] = (byDomain[skill.reportingCategory] || 0) + 1;
  }
  assertEqual(byDomain.algebra, 5);
  assertEqual(byDomain.advmath, 3);
  assertEqual(byDomain.psda, 7);
  assertEqual(byDomain.geotrig, 4);
});

test("getSubject/getSkill (data/tests.js) resolve psat-math ids", () => {
  const subject = getSubject("psat-math");
  assertTrue(!!subject && subject.id === "psat-math");
});

test("no psat-math skill id collides with any other planet's skill id", () => {
  for (const id of PSAT_MATH_SKILL_IDS) {
    assertTrue(id.startsWith("psatmath-"), `expected "${id}" to use the psatmath- prefix`);
  }
});

test("getLessonCount still resolves a real value for a psat-math skill despite no question bank existing yet", () => {
  assertEqual(getLessonCount("psatmath-linear1var"), 20);
});

test("a fresh save has a real skillProgress entry for every psat-math skill", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  for (const skill of PSAT_MATH_SUBJECT.skills) {
    const p = gs.getSkillProgress(skill.id);
    assertTrue(!!p, `expected a skillProgress entry for "${skill.id}"`);
    assertEqual(p.attempts, 0);
    assertEqual(p.mastered, false);
  }
  localStorage.removeItem("act-quest-save-v1");
});
