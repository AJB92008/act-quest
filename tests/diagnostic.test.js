// Regression tests for the Placement Diagnostic's cross-subject sampling
// (getDiagnosticQuestions, data/questions/index.js) and for the skill-level
// stats it feeds via gameState.recordWeakReviewAnswer.
import { GameState } from "../js/state.js";
import { getDiagnosticQuestions, preloadAllSubjects } from "../js/data/questions/index.js";
import { SUBJECTS } from "../js/data/skills.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("getDiagnosticQuestions returns the requested count, each with a valid structure", async () => {
  await preloadAllSubjects();
  const qs = getDiagnosticQuestions(24);
  assertEqual(qs.length, 24);
  for (const q of qs) {
    assertTrue(typeof q.q === "string" && q.q.length > 0, "missing question text");
    assertTrue(Array.isArray(q.choices) && q.choices.length === 4, "expected 4 choices");
    assertTrue(q.answer >= 0 && q.answer <= 3, "answer out of range");
    assertTrue(typeof q.skillId === "string", "missing skillId");
    assertTrue(typeof q.skillName === "string", "missing skillName");
    assertTrue(typeof q.subjectId === "string", "missing subjectId");
    assertTrue(typeof q.bankIndex === "number", "missing bankIndex");
  }
});

test("getDiagnosticQuestions spreads across every subject, not just one", async () => {
  await preloadAllSubjects();
  const qs = getDiagnosticQuestions(24);
  const subjectsHit = new Set(qs.map((q) => q.subjectId));
  assertEqual(subjectsHit.size, SUBJECTS.length);
});

test("getDiagnosticQuestions favors breadth: no skill repeats within the same subject at the default count", async () => {
  await preloadAllSubjects();
  const qs = getDiagnosticQuestions(24);
  const bySubject = {};
  for (const q of qs) {
    bySubject[q.subjectId] = bySubject[q.subjectId] || new Set();
    bySubject[q.subjectId].add(q.skillId);
  }
  for (const subjectId of Object.keys(bySubject)) {
    const countForSubject = qs.filter((q) => q.subjectId === subjectId).length;
    assertEqual(bySubject[subjectId].size, countForSubject, `expected distinct skills within ${subjectId}`);
  }
});

test("getDiagnosticQuestions respects a smaller requested count", async () => {
  await preloadAllSubjects();
  const qs = getDiagnosticQuestions(8);
  assertEqual(qs.length, 8);
});

test("answering a diagnostic question the way the UI does updates both skill-level and per-question stats", () => {
  const gs = new GameState();
  assertEqual(gs.getWeakSkills(5, 1, 1.01).find((s) => s.id === "en-commas"), undefined);
  gs.recordWeakReviewAnswer("en-commas", false);
  gs.recordQuestionAnswer("en-commas", 12, false);
  const stat = gs.getQuestionStat("en-commas", 12);
  assertEqual(stat.attempts, 1);
  assertEqual(stat.correct, 0);
  const weak = gs.getWeakSkills(5, 1, 1.01).find((s) => s.id === "en-commas");
  assertTrue(!!weak, "expected en-commas to show up once at least one attempt is recorded, with a low minAttempts threshold");
  assertEqual(weak.accuracy, 0);
});
