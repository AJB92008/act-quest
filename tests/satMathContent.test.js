// Content-integrity tests for the SAT Math question banks
// (data/questions/satMath.js) — these guard the actual data, not just the
// plumbing that loads it: every one of the 19 skills has its original 100
// multiple-choice questions plus a batch of "written" (student-produced-
// response) questions on top (see js/ui/writtenAnswer.js and
// BANK_SIZE_OVERRIDES in questions/index.js for why the exact per-skill
// total isn't a flat number), every question has a well-formed shape for
// its type, and the subject is wired up end-to-end (preloadable,
// lesson/boss-lesson lookups work, isSubjectPlayable is true).
import { SAT_SUBJECTS } from "../js/data/satSkills.js";
import { getSubject, isSubjectPlayable } from "../js/data/tests.js";
import {
  preloadSubjectForSkill,
  getFullBank,
  getLessonCount,
  getLessonQuestions,
  isBossLessonIndex,
  BOSS_LESSON_SIZE,
  LESSON_SIZE,
} from "../js/data/questions/index.js";
import { getBossMonster } from "../js/data/bossMonsters.js";
import { isWrittenQuestion } from "../js/ui/writtenAnswer.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const SAT_MATH_SUBJECT = SAT_SUBJECTS.find((s) => s.id === "sat-math");
const SAT_MATH_SKILL_IDS = SAT_MATH_SUBJECT.skills.map((s) => s.id);

test("sat-math lists exactly 19 skills", () => {
  assertEqual(SAT_MATH_SKILL_IDS.length, 19);
});

test("sat-math is no longer contentPending and is reported as playable", () => {
  const subject = getSubject("sat-math");
  assertTrue(!subject.contentPending);
  assertTrue(isSubjectPlayable(subject));
});

test("sat-math has a BOSS_MONSTERS entry", () => {
  const boss = getBossMonster("sat-math", 5);
  assertTrue(!!boss && typeof boss.name === "string" && boss.name.length > 0);
});

test("every sat-math skill's real bank has its original 100 multiple-choice questions plus a batch of written ones (~25 each)", async () => {
  for (const skillId of SAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    const mc = bank.filter((q) => !isWrittenQuestion(q));
    const written = bank.filter((q) => isWrittenQuestion(q));
    assertEqual(mc.length, 100, `expected 100 multiple-choice questions in "${skillId}"`);
    assertTrue(written.length >= 17 && written.length <= 25, `expected roughly 25 written questions in "${skillId}", got ${written.length}`);
  }
});

test("every sat-math skill's lesson count matches its real bank size (no longer a flat 20)", async () => {
  for (const skillId of SAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    const expectedLessons = Math.ceil(bank.length / LESSON_SIZE);
    assertEqual(getLessonCount(skillId), expectedLessons, `expected ${expectedLessons} lessons for "${skillId}"`);
    assertTrue(expectedLessons >= 24, `expected at least 24 lessons for "${skillId}" now that written questions were added`);
  }
});

test("every sat-math skill's last lesson is its boss lesson", () => {
  for (const skillId of SAT_MATH_SKILL_IDS) {
    const lastIndex = getLessonCount(skillId) - 1;
    assertTrue(isBossLessonIndex(skillId, lastIndex), `expected the last lesson index to be the boss lesson for "${skillId}"`);
    assertTrue(!isBossLessonIndex(skillId, lastIndex - 1), `the second-to-last lesson should not be the boss lesson for "${skillId}"`);
  }
});

test("a sat-math skill's boss lesson returns 15 valid questions", async () => {
  const skillId = "satmath-linear1var";
  await preloadSubjectForSkill(skillId);
  const boss = getLessonQuestions(skillId, getLessonCount(skillId) - 1);
  assertEqual(boss.length, BOSS_LESSON_SIZE);
  const bank = getFullBank(skillId);
  for (const q of boss) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("a sat-math skill's regular (non-boss) lesson returns 5 valid questions", async () => {
  const skillId = "satmath-circles";
  await preloadSubjectForSkill(skillId);
  assertEqual(getLessonQuestions(skillId, 0).length, 5);
  assertEqual(getLessonQuestions(skillId, getLessonCount(skillId) - 2).length, 5);
});

test("every multiple-choice question across every sat-math skill has a well-formed shape (no passage field, unlike satrw)", async () => {
  for (const skillId of SAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    for (const [i, q] of bank.entries()) {
      const where = `${skillId}[${i}]`;
      assertTrue(typeof q.q === "string" && q.q.length > 0, `${where}: missing question text`);
      assertTrue(typeof q.explain === "string" && q.explain.length > 0, `${where}: missing explanation`);
      assertTrue(q.passage === undefined, `${where}: unexpected passage field on a math question`);
      if (isWrittenQuestion(q)) {
        assertTrue(q.answer !== undefined && q.answer !== null && q.answer !== "", `${where}: missing written answer`);
      } else {
        assertTrue(Array.isArray(q.choices) && q.choices.length === 4, `${where}: expected exactly 4 choices`);
        assertTrue(new Set(q.choices).size === 4, `${where}: choices are not all distinct`);
        assertTrue(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${where}: answer index out of range`);
      }
    }
  }
});

test("no two questions within the same sat-math skill share identical question text", async () => {
  for (const skillId of SAT_MATH_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    const seen = new Set();
    for (const q of bank) {
      assertTrue(!seen.has(q.q), `duplicate question in "${skillId}": ${q.q.slice(0, 80)}`);
      seen.add(q.q);
    }
  }
});
