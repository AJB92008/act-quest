// Tests for the PSAT/NMSQT Reading and Writing skill tree itself
// (data/psatSkills.js) — domain weights, reportingCategory validity, and
// id uniqueness. Content-integrity assertions for the actual question bank
// (100 questions per skill, well-formed shape, etc.) live in
// psatRwContent.test.js instead, same split satRwContent.test.js uses for
// sat-rw's own question-bank checks.
import { PSAT_REPORTING_CATEGORIES, PSAT_SUBJECTS } from "../js/data/psatSkills.js";
import { getSubject, isSubjectPlayable, isTestReady, getTestSubjects } from "../js/data/tests.js";
import { getLessonCount } from "../js/data/questions/index.js";
import { GameState } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const PSAT_RW_SUBJECT = PSAT_SUBJECTS.find((s) => s.id === "psat-rw");
const PSAT_RW_SKILL_IDS = PSAT_RW_SUBJECT.skills.map((s) => s.id);

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

test("the psat planet is ready overall now that psat-rw is playable (psat-math is still fully empty)", () => {
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
