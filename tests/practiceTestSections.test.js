// Regression tests for the Practice Test's category-proportional section
// sampling (getPracticeTestSectionQuestions in data/questions/index.js) —
// distinct from practiceTestScoring.test.js, which only covers the
// raw -> scaled score tables.
import { REPORTING_CATEGORIES, SUBJECTS } from "../js/data/skills.js";
import { getPracticeTestSectionQuestions, preloadAllSubjects } from "../js/data/questions/index.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const SECTION_COUNTS = { english: 75, math: 60, reading: 40, science: 40 };

for (const [subjectId, count] of Object.entries(SECTION_COUNTS)) {
  test(`${subjectId} section returns exactly ${count} unique questions`, async () => {
    await preloadAllSubjects();
    const qs = getPracticeTestSectionQuestions(subjectId, count);
    assertEqual(qs.length, count);
    const seen = new Set(qs.map((q) => `${q.skillId}:${q.bankIndex}`));
    assertEqual(seen.size, count);
  });

  test(`${subjectId} section tags every question with a real reporting category`, async () => {
    await preloadAllSubjects();
    const validIds = new Set(REPORTING_CATEGORIES[subjectId].map((c) => c.id));
    const qs = getPracticeTestSectionQuestions(subjectId, count);
    for (const q of qs) {
      assertTrue(validIds.has(q.reportingCategory), `unexpected reportingCategory "${q.reportingCategory}"`);
    }
  });

  test(`${subjectId} section covers every reporting category (none skipped entirely)`, async () => {
    await preloadAllSubjects();
    const qs = getPracticeTestSectionQuestions(subjectId, count);
    const present = new Set(qs.map((q) => q.reportingCategory));
    for (const cat of REPORTING_CATEGORIES[subjectId]) {
      assertTrue(present.has(cat.id), `category "${cat.id}" got zero questions in a ${count}-question section`);
    }
  });
}

test("english section's category proportions roughly match the real ACT's published weights", async () => {
  await preloadAllSubjects();
  const qs = getPracticeTestSectionQuestions("english", 75);
  const counts = {};
  qs.forEach((q) => (counts[q.reportingCategory] = (counts[q.reportingCategory] || 0) + 1));
  // Real ACT: Conventions of Standard English ~53%, Production of Writing
  // ~32%, Knowledge of Language ~15% — allow rounding slack either way.
  assertTrue(Math.abs(counts.cse / 75 - 0.53) < 0.05, `cse share ${counts.cse}/75 too far from 53%`);
  assertTrue(Math.abs(counts.pow / 75 - 0.32) < 0.05, `pow share ${counts.pow}/75 too far from 32%`);
  assertTrue(Math.abs(counts.kla / 75 - 0.15) < 0.05, `kla share ${counts.kla}/75 too far from 15%`);
});

test("math section's category proportions are driven by skill-tree coverage, not a hardcoded weight", async () => {
  await preloadAllSubjects();
  const mathSubject = SUBJECTS.find((s) => s.id === "math");
  const skillCountByCategory = {};
  mathSubject.skills.forEach((s) => {
    skillCountByCategory[s.reportingCategory] = (skillCountByCategory[s.reportingCategory] || 0) + 1;
  });
  const qs = getPracticeTestSectionQuestions("math", 60);
  const counts = {};
  qs.forEach((q) => (counts[q.reportingCategory] = (counts[q.reportingCategory] || 0) + 1));
  // Geometry has the most skills, so it should end up with the most
  // questions of any single category in the section.
  const geometryCount = counts.geometry || 0;
  const maxOther = Math.max(...Object.entries(counts).filter(([id]) => id !== "geometry").map(([, n]) => n));
  assertTrue(geometryCount >= maxOther, `expected geometry (the largest math category by skill count: ${skillCountByCategory.geometry} skills) to get the most questions`);
});

test("getPracticeTestSectionQuestions falls back to a plain shuffled slice for an unknown subject", async () => {
  await preloadAllSubjects();
  const qs = getPracticeTestSectionQuestions("not-a-real-subject", 10);
  assertEqual(qs.length, 0);
});
