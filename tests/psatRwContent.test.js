// Content-integrity tests for the PSAT/NMSQT Reading & Writing question
// banks (data/questions/psatRw.js) — these guard the actual data, not just
// the plumbing that loads it: every one of the 17 skills has exactly 100
// questions (20 lessons, matching sat-rw's bank size with no
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

const PSAT_RW_SKILL_IDS = PSAT_SUBJECTS[0].skills.map((s) => s.id);
const SEC_SKILL_IDS = new Set(["psatrw-boundaries", "psatrw-punctuation", "psatrw-agreement", "psatrw-verbforms"]);

test("psat-rw lists exactly 17 skills", () => {
  assertEqual(PSAT_RW_SKILL_IDS.length, 17);
});

test("psat-rw is no longer contentPending and is reported as playable", () => {
  const subject = getSubject("psat-rw");
  assertTrue(!subject.contentPending);
  assertTrue(isSubjectPlayable(subject));
});

test("the psat planet is now ready overall now that psat-rw has real content", () => {
  assertTrue(isTestReady("psat"));
});

test("psat-rw has a BOSS_MONSTERS entry", () => {
  const boss = getBossMonster("psat-rw", 5);
  assertTrue(!!boss && typeof boss.name === "string" && boss.name.length > 0);
});

test("every psat-rw skill's real bank has exactly 100 questions once loaded", async () => {
  for (const skillId of PSAT_RW_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    assertEqual(getFullBank(skillId).length, 100, `expected 100 questions in "${skillId}"`);
  }
});

test("every psat-rw skill reports 20 lessons (100 questions / 5 per lesson), no BANK_SIZE_OVERRIDES needed", () => {
  for (const skillId of PSAT_RW_SKILL_IDS) {
    assertEqual(getLessonCount(skillId), 20, `expected 20 lessons for "${skillId}"`);
  }
});

test("every psat-rw skill's 20th lesson (index 19) is its boss lesson", () => {
  for (const skillId of PSAT_RW_SKILL_IDS) {
    assertTrue(isBossLessonIndex(skillId, 19), `expected lesson index 19 to be the boss lesson for "${skillId}"`);
    assertTrue(!isBossLessonIndex(skillId, 18), `lesson index 18 should not be the boss lesson for "${skillId}"`);
  }
});

test("a psat-rw skill's boss lesson returns 15 valid questions", async () => {
  const skillId = "psatrw-boundaries";
  await preloadSubjectForSkill(skillId);
  const boss = getLessonQuestions(skillId, 19);
  assertEqual(boss.length, BOSS_LESSON_SIZE);
  const bank = getFullBank(skillId);
  for (const q of boss) {
    assertTrue(typeof q.bankIndex === "number" && q.bankIndex >= 0 && q.bankIndex < bank.length, "bankIndex out of range");
  }
});

test("a psat-rw skill's regular (non-boss) lesson returns 5 valid questions", async () => {
  const skillId = "psatrw-evidence-data";
  await preloadSubjectForSkill(skillId);
  assertEqual(getLessonQuestions(skillId, 0).length, 5);
  assertEqual(getLessonQuestions(skillId, 18).length, 5);
});

test("every question across every psat-rw skill has a well-formed shape", async () => {
  for (const skillId of PSAT_RW_SKILL_IDS) {
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

test("Standard English Conventions psat-rw skills carry no passage field (grammar-only, question is the sentence itself)", async () => {
  for (const skillId of SEC_SKILL_IDS) {
    await preloadSubjectForSkill(skillId);
    const bank = getFullBank(skillId);
    for (const [i, q] of bank.entries()) {
      assertTrue(q.passage === undefined, `${skillId}[${i}]: unexpected passage field on a grammar-only question`);
    }
  }
});

test("no two questions within the same psat-rw skill share an identical passage+question pair", async () => {
  for (const skillId of PSAT_RW_SKILL_IDS) {
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
