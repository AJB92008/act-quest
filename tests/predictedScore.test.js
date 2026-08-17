// Regression tests for GameState.getPredictedScore(testId) — the Dashboard's
// "📚 Skills by Test" section calls this once per planet tab (see
// predictedScoreCardHTML in ui/dashboard.js) to show a rough estimated
// score for whichever test is selected. All three playable planets (ACT,
// SAT, PSAT) now share the same two-source behavior: a real Practice Test
// composite for that planet wins when one exists (see ui/practiceTest.js
// and data/tests.js's per-planet practiceTest config), else lesson
// accuracy on that planet's own skills, mapped onto its own real published
// score range (1-36 / 400-1600 / 320-1520).
import { GameState } from "../js/state.js";
import { getTestSkillIds } from "../js/data/tests.js";
import { test, assertEqual } from "./assert.js";

function seedAccuracy(gs, testId, accuracy, attempts = 20) {
  const ids = getTestSkillIds(testId);
  const correct = Math.round(attempts * accuracy);
  gs.data.skillProgress[ids[0]].attempts = attempts;
  gs.data.skillProgress[ids[0]].correct = correct;
}

test("getPredictedScore defaults to testId 'act' when called with no argument", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "act", 1, 20);
  assertEqual(gs.getPredictedScore().score, gs.getPredictedScore("act").score);
  localStorage.removeItem("act-quest-save-v1");
});

test("ACT: predicted score is null (insufficient) before 20 lesson attempts", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  const result = gs.getPredictedScore("act");
  assertEqual(result.score, null);
  assertEqual(result.source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("ACT: 0% and 100% lesson accuracy map to the 1-36 scale's floor and ceiling", () => {
  localStorage.removeItem("act-quest-save-v1");
  let gs = new GameState();
  seedAccuracy(gs, "act", 0, 20);
  assertEqual(gs.getPredictedScore("act").score, 1);
  localStorage.removeItem("act-quest-save-v1");

  gs = new GameState();
  seedAccuracy(gs, "act", 1, 20);
  const result = gs.getPredictedScore("act");
  assertEqual(result.score, 36);
  assertEqual(result.source, "lessons");
  localStorage.removeItem("act-quest-save-v1");
});

test("ACT: a completed practice test takes priority over lesson accuracy", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "act", 0, 20); // would predict 1 from lessons alone
  gs.recordPracticeTestResult({
    sectionResults: [{ subjectId: "math", label: "Math", correctCount: 30, totalCount: 60, subscore: 20 }],
    composite: 27,
    starsEarned: 0,
    coinsEarned: 0,
  });
  const result = gs.getPredictedScore("act");
  assertEqual(result.score, 27);
  assertEqual(result.source, "practiceTest");
  localStorage.removeItem("act-quest-save-v1");
});

test("SAT: predicted score is null (insufficient) before 20 lesson attempts", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  const result = gs.getPredictedScore("sat");
  assertEqual(result.score, null);
  assertEqual(result.source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("SAT: 0% and 100% lesson accuracy map to the real 400-1600 composite range", () => {
  localStorage.removeItem("act-quest-save-v1");
  let gs = new GameState();
  seedAccuracy(gs, "sat", 0, 20);
  assertEqual(gs.getPredictedScore("sat").score, 400);
  localStorage.removeItem("act-quest-save-v1");

  gs = new GameState();
  seedAccuracy(gs, "sat", 1, 20);
  const result = gs.getPredictedScore("sat");
  assertEqual(result.score, 1600);
  assertEqual(result.source, "lessons");
  localStorage.removeItem("act-quest-save-v1");
});

test("SAT: a completed practice test takes priority over lesson accuracy", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "sat", 0, 20); // would predict 400 from lessons alone
  gs.recordPracticeTestResult({
    sectionResults: [
      { subjectId: "sat-rw", label: "Reading & Writing", correctCount: 40, totalCount: 54, subscore: 650 },
      { subjectId: "sat-math", label: "Math", correctCount: 30, totalCount: 44, subscore: 600 },
    ],
    composite: 1250,
    starsEarned: 0,
    coinsEarned: 0,
    testId: "sat",
  });
  const result = gs.getPredictedScore("sat");
  assertEqual(result.score, 1250);
  assertEqual(result.source, "practiceTest");
  // Recording an SAT practice test must not affect ACT's own predicted score.
  assertEqual(gs.getPredictedScore("act").source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("PSAT: predicted score is null (insufficient) before 20 lesson attempts", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  const result = gs.getPredictedScore("psat");
  assertEqual(result.score, null);
  assertEqual(result.source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("PSAT: 0% and 100% lesson accuracy map to the real 320-1520 composite range", () => {
  localStorage.removeItem("act-quest-save-v1");
  let gs = new GameState();
  seedAccuracy(gs, "psat", 0, 20);
  assertEqual(gs.getPredictedScore("psat").score, 320);
  localStorage.removeItem("act-quest-save-v1");

  gs = new GameState();
  seedAccuracy(gs, "psat", 1, 20);
  const result = gs.getPredictedScore("psat");
  assertEqual(result.score, 1520);
  assertEqual(result.source, "lessons");
  localStorage.removeItem("act-quest-save-v1");
});

test("PSAT: a completed practice test takes priority over lesson accuracy", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "psat", 0, 20); // would predict 320 from lessons alone
  gs.recordPracticeTestResult({
    sectionResults: [
      { subjectId: "psat-rw", label: "Reading & Writing", correctCount: 40, totalCount: 54, subscore: 600 },
      { subjectId: "psat-math", label: "Math", correctCount: 30, totalCount: 44, subscore: 580 },
    ],
    composite: 1180,
    starsEarned: 0,
    coinsEarned: 0,
    testId: "psat",
  });
  const result = gs.getPredictedScore("psat");
  assertEqual(result.score, 1180);
  assertEqual(result.source, "practiceTest");
  // Recording a PSAT practice test must not affect SAT's own predicted score.
  assertEqual(gs.getPredictedScore("sat").source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("getPracticeTestBest/getPracticeTestHistory are scoped per planet and default to testId 'act'", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  assertEqual(gs.getPracticeTestBest(), 0);
  assertEqual(gs.getPracticeTestHistory().length, 0);
  gs.recordPracticeTestResult({
    sectionResults: [{ subjectId: "sat-rw", label: "Reading & Writing", correctCount: 50, totalCount: 54, subscore: 750 }],
    composite: 1400,
    starsEarned: 0,
    coinsEarned: 0,
    testId: "sat",
  });
  assertEqual(gs.getPracticeTestBest("sat"), 1400);
  assertEqual(gs.getPracticeTestHistory("sat").length, 1);
  // Default (no testId) still means ACT, untouched by the SAT result above.
  assertEqual(gs.getPracticeTestBest(), 0);
  assertEqual(gs.getPracticeTestHistory().length, 0);
  localStorage.removeItem("act-quest-save-v1");
});

test("a planet's predicted score is scoped to its own skills, not polluted by another planet's progress", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "act", 1, 40); // plenty of ACT attempts
  const sat = gs.getPredictedScore("sat");
  assertEqual(sat.score, null, "SAT should still be insufficient — none of that practice was on SAT skills");
  assertEqual(sat.source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

test("State Assessments has no skills yet, so its predicted score is always insufficient", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  const result = gs.getPredictedScore("stateAssessments");
  assertEqual(result.score, null);
  assertEqual(result.source, "insufficient");
  localStorage.removeItem("act-quest-save-v1");
});

// Before SAT/PSAT had their own practiceTest config, practiceTests was a
// single flat {bestComposite, history} — ACT was the only planet with a
// full-length test, so there was nothing to key it by. A save written
// before this feature must still read its real ACT history back correctly
// after upgrading, not silently reset to 0.
test("a legacy flat practiceTests save shape migrates into practiceTests.act", () => {
  localStorage.removeItem("act-quest-save-v1");
  const legacy = {
    version: 1,
    practiceTests: {
      bestComposite: 24,
      history: [{ date: 1700000000000, composite: 24, sectionResults: [] }],
    },
  };
  localStorage.setItem("act-quest-save-v1", JSON.stringify(legacy));
  const gs = new GameState();
  assertEqual(gs.getPracticeTestBest("act"), 24);
  assertEqual(gs.getPracticeTestHistory("act").length, 1);
  assertEqual(gs.getPredictedScore("act").score, 24);
  assertEqual(gs.getPredictedScore("act").source, "practiceTest");
  // The upgrade shouldn't invent SAT/PSAT history out of nowhere.
  assertEqual(gs.getPracticeTestBest("sat"), 0);
  assertEqual(gs.getPracticeTestBest("psat"), 0);
  localStorage.removeItem("act-quest-save-v1");
});
