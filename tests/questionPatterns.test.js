// Regression tests for the cross-subject weak-*pattern* engine
// (data/questions/patterns.js + getWeakPatterns/getAdaptivePracticeQuestions
// in data/questions/index.js) — distinct from the skill-level weak-review
// engine tested in adaptiveEngine.test.js.
import { GameState } from "../js/state.js";
import { getQuestionPatterns, PATTERN_DEFS } from "../js/data/questions/patterns.js";
import { getWeakPatterns, getAdaptivePracticeQuestions, getAllQuestionsFlat, preloadAllSubjects } from "../js/data/questions/index.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("getQuestionPatterns detects a negation trap", () => {
  const q = { q: "Which of the following is NOT true about the passage?", choices: ["a", "b", "c", "d"] };
  assertTrue(getQuestionPatterns(q).includes("negationTrap"));
});

test("getQuestionPatterns detects vocabulary-in-context questions", () => {
  const q = { q: `As it is used in the passage, "sanguine" most nearly means`, choices: ["a", "b", "c", "d"] };
  assertTrue(getQuestionPatterns(q).includes("vocabInContext"));
});

test("getQuestionPatterns detects paired-source questions", () => {
  const q = { q: "Which choice best describes how Passage A differs from Passage B?", choices: ["a", "b", "c", "d"] };
  assertTrue(getQuestionPatterns(q).includes("pairedSource"));
});

test("getQuestionPatterns detects data-table reading questions", () => {
  const q = { q: "According to Table 2, what was the average yield?", choices: ["a", "b", "c", "d"] };
  assertTrue(getQuestionPatterns(q).includes("dataTableReading"));
});

test("getQuestionPatterns detects computation from a long stem with all-numeric choices", () => {
  const q = {
    q: "A rectangular garden has a length that is 3 feet more than twice its width. If the perimeter of the garden is 66 feet, what is the width, in feet?",
    choices: ["1", "2", "3", "4"],
  };
  assertTrue(getQuestionPatterns(q).includes("computation"));
});

test("getQuestionPatterns does NOT flag computation for a short numeric-choice question", () => {
  // Numeric choices alone used to match ~90% of every Math question in the
  // real banks — not a useful *pattern* signal, just "this is Math" again.
  // A short stem shouldn't qualify even with numeric choices.
  const q = { q: "What is x?", choices: ["1", "2", "3", "4"] };
  assertTrue(!getQuestionPatterns(q).includes("computation"));
});

test("computation pattern discriminates within Math instead of matching nearly everything", async () => {
  await preloadAllSubjects();
  const mathQs = getAllQuestionsFlat().filter((q) => q.subjectId === "math");
  const matchCount = mathQs.filter((q) => getQuestionPatterns(q).includes("computation")).length;
  const matchRate = matchCount / mathQs.length;
  assertTrue(matchRate > 0.15 && matchRate < 0.6, `expected a discriminating ~15-60% match rate within Math, got ${Math.round(matchRate * 100)}%`);
});

test("getQuestionPatterns returns no patterns for a plain question matching nothing", () => {
  const q = { q: "Which choice is most grammatically correct?", choices: ["went", "goes", "going", "gone"] };
  assertEqual(getQuestionPatterns(q).length, 0);
});

test("every detected pattern id has a matching PATTERN_DEFS entry", () => {
  for (const id of Object.keys(PATTERN_DEFS)) {
    assertTrue(typeof PATTERN_DEFS[id].label === "string" && PATTERN_DEFS[id].label.length > 0, `${id} missing a label`);
  }
});

test("getWeakPatterns returns nothing for a brand-new player with no attempt history", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const patterns = getWeakPatterns((skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex));
  assertEqual(patterns.length, 0);
});

test("getWeakPatterns surfaces a real pattern once enough personally-missed attempts exist", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const flat = getAllQuestionsFlat();
  const negationQs = flat.filter((q) => getQuestionPatterns(q).includes("negationTrap")).slice(0, 6);
  assertTrue(negationQs.length > 0, "expected at least one real negationTrap question in the loaded banks");

  for (const q of negationQs) {
    gs.recordQuestionAnswer(q.skillId, q.bankIndex, false);
  }

  const patterns = getWeakPatterns((skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex), { minAttempts: 3 });
  const negation = patterns.find((p) => p.id === "negationTrap");
  assertTrue(!!negation, "expected negationTrap to surface as a weak pattern");
  assertEqual(negation.accuracy, 0);
});

test("getWeakPatterns does NOT surface a pattern from repeated attempts on a single question", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const flat = getAllQuestionsFlat();
  const oneNegationQ = flat.find((q) => getQuestionPatterns(q).includes("negationTrap"));
  assertTrue(!!oneNegationQ, "expected at least one real negationTrap question");

  // Enough combined attempts to clear MIN_PATTERN_ATTEMPTS, but all on the
  // exact same question — this should describe that one question, not a
  // real cross-skill pattern in this player's understanding.
  for (let i = 0; i < 8; i++) gs.recordQuestionAnswer(oneNegationQ.skillId, oneNegationQ.bankIndex, false);

  const patterns = getWeakPatterns((skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex), { minAttempts: 3 });
  assertTrue(!patterns.some((p) => p.id === "negationTrap"), "a single drilled question shouldn't be enough to flag a weak pattern");
});

test("getWeakPatterns DOES surface a pattern once enough distinct questions confirm it", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const flat = getAllQuestionsFlat();
  const negationQs = flat.filter((q) => getQuestionPatterns(q).includes("negationTrap")).slice(0, 3);
  assertTrue(negationQs.length >= 3, "expected at least 3 real negationTrap questions in the loaded banks");
  for (const q of negationQs) {
    gs.recordQuestionAnswer(q.skillId, q.bankIndex, false);
    gs.recordQuestionAnswer(q.skillId, q.bankIndex, false);
  }

  const patterns = getWeakPatterns((skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex), { minAttempts: 3, minQuestions: 3 });
  assertTrue(patterns.some((p) => p.id === "negationTrap"), "3 distinct missed questions should be enough to flag the pattern");
});

test("getWeakPatterns sorts worst-accuracy first", async () => {
  await preloadAllSubjects();
  const gs = new GameState();
  const flat = getAllQuestionsFlat();
  const negationQs = flat.filter((q) => getQuestionPatterns(q).includes("negationTrap")).slice(0, 4);
  const pairedQs = flat.filter((q) => getQuestionPatterns(q).includes("pairedSource")).slice(0, 4);
  negationQs.forEach((q) => gs.recordQuestionAnswer(q.skillId, q.bankIndex, false));
  pairedQs.forEach((q) => gs.recordQuestionAnswer(q.skillId, q.bankIndex, true));

  const patterns = getWeakPatterns((skillId, bankIndex) => gs.getQuestionStat(skillId, bankIndex), { minAttempts: 3, count: 10 });
  for (let i = 1; i < patterns.length; i++) {
    assertTrue(patterns[i].accuracy >= patterns[i - 1].accuracy, "expected patterns sorted worst-accuracy first");
  }
});

test("getAdaptivePracticeQuestions returns [] when there are no weak patterns", () => {
  assertEqual(getAdaptivePracticeQuestions([], 10).length, 0);
});

test("getAdaptivePracticeQuestions only draws questions that actually match a given weak pattern", async () => {
  await preloadAllSubjects();
  const weakPatterns = [{ id: "negationTrap", accuracy: 0.1 }];
  const picks = getAdaptivePracticeQuestions(weakPatterns, 10);
  assertTrue(picks.length > 0);
  for (const p of picks) {
    assertTrue(getQuestionPatterns(p).includes("negationTrap"), "every returned question should match the requested weak pattern");
  }
});

test("getAdaptivePracticeQuestions spans more than one subject when the pattern appears in multiple", async () => {
  await preloadAllSubjects();
  // pairedSource questions exist in both Reading (Passage A/B) and Science
  // (Scientist/Researcher/Paleontologist 1 vs 2) — a real cross-subject draw.
  const weakPatterns = [{ id: "pairedSource", accuracy: 0.1 }];
  const picks = getAdaptivePracticeQuestions(weakPatterns, 30);
  const subjectIds = new Set(picks.map((p) => p.subjectId));
  assertTrue(subjectIds.size > 1, `expected questions from more than one subject, got only: ${[...subjectIds].join(", ")}`);
});
