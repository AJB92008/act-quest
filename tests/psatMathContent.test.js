// Content-integrity tests for the PSAT/NMSQT Math question banks
// (data/questions/psatMath.js) — these guard the actual data, not just the
// plumbing that loads it: every one of the 19 skills has exactly 100
// questions (20 lessons, matching sat-math's bank size with no
// BANK_SIZE_OVERRIDES entry needed), every question has a well-formed
// shape, and the subject is now wired up end-to-end (preloadable,
// lesson/boss-lesson lookups work, isSubjectPlayable is true).
import { PSAT_SUBJECTS } from "../js/data/psatSkills.js";
import { getSubject, isSubjectPlayable, isTestReady } from "../js/data/tests.js";
import {
  preloadSubjectForSkill,
  getFullBank,
  getLessonCount,
  getLessonQuestions,
  isBossLessonIndex,
  BOSS_LESSON_SIZE,
} from "../js/data/questions/index.js";
import { getBossMonster } from "../js/data/bossMonsters.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const PSAT_MATH_SUBJECT = PSAT_SUBJECTS.find((s) => s.id === "psat-math");
const PSAT_MATH_SKILL_IDS = PSAT_MATH_SUBJECT.skills.map((s) => s.id);

test("psat-math lists exactly 19 skills", () => {
  assertEqual(PSAT_MATH_SKILL_IDS.length, 19);
});

test("psat-math is no longer contentPending and is reported as playable", () => {
  const subject = getSubject("psat-math");
  assertTrue(!subject.contentPending);
  assertTrue(isSubjectPlayable(subject));
});

test("the psat planet is ready with both subjects now playable", () => {
  assertTrue(isTestReady("psat"));
});

test("psat-math has a BOSS_MONSTERS entry", () => {
  const boss = getBossMonster("psat-math", 5);
  assertTrue(!!boss && typeof boss.name === "string" && boss.name.length > 0);
});

test("every psat-math skill's real bank has exactly 100 questions once loaded", async () => {
  for (const skillId of PSAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    assertEqual(getFullBank(skillId).length, 100, `expected 100 questions in "${skillId}"`);
  }
});

test("every psat-math skill reports 20 lessons (100 questions / 5 per lesson), no BANK_SIZE_OVERRIDES needed", () => {
  for (const skillId of PSAT_MATH_SKILL_IDS) {
    assertEqual(getLessonCount(skillId), 20, `expected 20 lessons for "${skillId}"`);
  }
});

test("every psat-math skill's 20th lesson (index 19) is its boss lesson", () => {
  for (const skillId of PSAT_MATH_SKILL_IDS) {
    assertTrue(isBossLessonIndex(skillId, 19), `expected lesson index 19 to be the boss lesson for "${skillId}"`);
    assertTrue(!isBossLessonIndex(skillId, 18), `lesson index 18 should not be the boss lesson for "${skillId}"`);
  }
});

test("a psat-math skill's boss lesson returns 15 valid questions", async () => {
  const skillId = "psatmath-linear1var";
  await preloadSubjectForSkill(skillId);
  const boss = getLessonQuestions(skillId, 19);
  assertEqual(boss.length, BOSS_LESSON_SIZE);
  const bank = getFullBank(skillId);
  for (const q of boss) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("a psat-math skill's regular (non-boss) lesson returns 5 valid questions", async () => {
  const skillId = "psatmath-circles";
  await preloadSubjectForSkill(skillId);
  assertEqual(getLessonQuestions(skillId, 0).length, 5);
  assertEqual(getLessonQuestions(skillId, 18).length, 5);
});

test("every question across every psat-math skill has a well-formed shape (no passage field, unlike psatrw)", async () => {
  for (const skillId of PSAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    for (const [i, q] of bank.entries()) {
      const where = `${skillId}[${i}]`;
      assertTrue(typeof q.q === "string" && q.q.length > 0, `${where}: missing question text`);
      assertTrue(Array.isArray(q.choices) && q.choices.length === 4, `${where}: expected exactly 4 choices`);
      assertTrue(new Set(q.choices).size === 4, `${where}: choices are not all distinct`);
      assertTrue(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${where}: answer index out of range`);
      assertTrue(typeof q.explain === "string" && q.explain.length > 0, `${where}: missing explanation`);
      assertTrue(q.passage === undefined, `${where}: unexpected passage field on a math question`);
    }
  }
});

test("no two questions within the same psat-math skill share identical question text", async () => {
  for (const skillId of PSAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    const seen = new Set();
    for (const q of bank) {
      assertTrue(!seen.has(q.q), `duplicate question in "${skillId}": ${q.q.slice(0, 80)}`);
      seen.add(q.q);
    }
  }
});
