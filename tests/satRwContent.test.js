// Content-integrity tests for the SAT Reading & Writing question banks
// (data/questions/satRw.js) — these guard the actual data, not just the
// plumbing that loads it: every one of the 17 skills has exactly 200
// questions (the original 100, doubled — 40 lessons, via a
// BANK_SIZE_OVERRIDES entry now that it's no longer ACT's standard 100),
// every question has a well-formed shape, and the subject is wired up
// end-to-end (preloadable, lesson/boss-lesson lookups work,
// isSubjectPlayable is true).
import { SAT_SUBJECTS } from "../js/data/satSkills.js";
import { getSubject, isSubjectPlayable } from "../js/data/tests.js";
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

const SAT_RW_SKILL_IDS = SAT_SUBJECTS[0].skills.map((s) => s.id);

test("sat-rw lists exactly 17 skills", () => {
  assertEqual(SAT_RW_SKILL_IDS.length, 17);
});

test("sat-rw is no longer contentPending and is reported as playable", () => {
  const subject = getSubject("sat-rw");
  assertTrue(!subject.contentPending);
  assertTrue(isSubjectPlayable(subject));
});

test("sat-rw has a BOSS_MONSTERS entry", () => {
  const boss = getBossMonster("sat-rw", 5);
  assertTrue(!!boss && typeof boss.name === "string" && boss.name.length > 0);
});

test("every sat-rw skill's real bank has exactly 200 questions once loaded", async () => {
  for (const skillId of SAT_RW_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    assertEqual(getFullBank(skillId).length, 200, `expected 200 questions in "${skillId}"`);
  }
});

test("every sat-rw skill reports 40 lessons (200 questions / 5 per lesson), via BANK_SIZE_OVERRIDES", () => {
  for (const skillId of SAT_RW_SKILL_IDS) {
    assertEqual(getLessonCount(skillId), 40, `expected 40 lessons for "${skillId}"`);
  }
});

test("every sat-rw skill's 40th lesson (index 39) is its boss lesson", () => {
  for (const skillId of SAT_RW_SKILL_IDS) {
    assertTrue(isBossLessonIndex(skillId, 39), `expected lesson index 39 to be the boss lesson for "${skillId}"`);
    assertTrue(!isBossLessonIndex(skillId, 38), `lesson index 38 should not be the boss lesson for "${skillId}"`);
  }
});

test("a sat-rw skill's boss lesson returns 15 valid questions", async () => {
  const skillId = "satrw-boundaries";
  await preloadSubjectForSkill(skillId);
  const boss = getLessonQuestions(skillId, 39);
  assertEqual(boss.length, BOSS_LESSON_SIZE);
  const bank = getFullBank(skillId);
  for (const q of boss) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("a sat-rw skill's regular (non-boss) lesson returns 5 valid questions", async () => {
  const skillId = "satrw-evidence-data";
  await preloadSubjectForSkill(skillId);
  assertEqual(getLessonQuestions(skillId, 0).length, 5);
  assertEqual(getLessonQuestions(skillId, 38).length, 5);
});

test("every question across every sat-rw skill has a well-formed shape", async () => {
  for (const skillId of SAT_RW_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    for (const [i, q] of bank.entries()) {
      const where = `${skillId}[${i}]`;
      assertTrue(typeof q.q === "string" && q.q.length > 0, `${where}: missing question text`);
      assertTrue(Array.isArray(q.choices) && q.choices.length === 4, `${where}: expected exactly 4 choices`);
      assertTrue(new Set(q.choices).size === 4, `${where}: choices are not all distinct`);
      assertTrue(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${where}: answer index out of range`);
      assertTrue(typeof q.explain === "string" && q.explain.length > 0, `${where}: missing explanation`);
      if (q.passage !== undefined) {
        assertTrue(typeof q.passage === "string" && q.passage.length > 0, `${where}: passage present but empty`);
      }
    }
  }
});

test("no two questions within the same sat-rw skill share an identical passage+question pair", async () => {
  for (const skillId of SAT_RW_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    const seen = new Set();
    for (const q of bank) {
      const key = `${q.passage || ""}|${q.q}`;
      assertTrue(!seen.has(key), `duplicate passage+question in "${skillId}": ${key.slice(0, 80)}`);
      seen.add(key);
    }
  }
});
