// Regression tests for GameState.getPredictedScore(testId) — the Dashboard's
// "📚 Skills by Test" section calls this once per planet tab (see
// predictedScoreCardHTML in ui/dashboard.js) to show a rough estimated
// score for whichever test is selected. ACT keeps its original two-source
// behavior (a real Practice Test composite wins when one exists, else
// lesson accuracy on the 1-36 scale); SAT and PSAT have no full-length
// Practice Test yet (see ui/practiceTest.js's header comment on why that
// stays ACT-only), so they always fall back to lesson accuracy, just
// mapped onto their own real published score ranges (400-1600 / 320-1520)
// instead of ACT's.
import { GameState } from "../js/state.js";
import { getTestSkillIds } from "../js/data/tests.js";
import { test, assertEqual, assertTrue } from "./assert.js";

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

test("SAT: never reports a practiceTest source — SAT has no full-length practice test yet", () => {
  localStorage.removeItem("act-quest-save-v1");
  const gs = new GameState();
  seedAccuracy(gs, "sat", 1, 20);
  assertTrue(gs.getPredictedScore("sat").source !== "practiceTest");
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
