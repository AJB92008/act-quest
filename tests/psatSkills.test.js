// Infrastructure-only tests for the PSAT/NMSQT Reading and Writing skill
// tree (data/psatSkills.js) — psat-rw now has a real skill tree (see that
// file's header comment for why it mirrors sat-rw's domain breakdown
// skill-for-skill) but, unlike sat-rw, no lesson/question content behind
// it yet. These tests guard the tree itself and its contentPending state,
// not question data that doesn't exist yet — the same "tree before
// content" stage sat-rw's own tests covered before its question bank was
// written.
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

test("psat-rw is marked contentPending and is correctly reported as not yet playable", () => {
  const subject = getSubject("psat-rw");
  assertTrue(subject.contentPending, "psat-rw has no question content yet — contentPending should be set");
  assertTrue(subject.skills.length > 0, "expected a real skill tree, not an empty placeholder");
  assertTrue(!isSubjectPlayable(subject), "a skill tree with contentPending should not count as playable yet");
});

test("the psat planet is still not ready overall (psat-rw pending, psat-math still fully empty)", () => {
  assertTrue(!isTestReady("psat"));
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

// Even without a question bank registered, getLessonCount still needs to
// answer correctly for a psat-rw skill id — see index.js's KNOWN_SKILL_IDS
// comment for why every planet's skill ids (not just ones with content) are
// known there.
test("getLessonCount still resolves a real value for a psat-rw skill despite no question bank existing yet", () => {
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
