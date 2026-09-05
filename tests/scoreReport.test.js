// Regression tests for the Score Report's shareable-link encoding
// (encodeReportPayload/decodeReportPayload), the payload it builds from
// live game state (buildReportPayload), and — critically — that a
// `?report=` link's decoded data can never inject real markup into the
// page. A share link is untrusted input by construction (anyone can hand-
// craft one and send it to someone else), and decodeReportPayload used to
// pass whatever it decoded straight through to the renderer with no
// escaping or type checking at all.
import { GameState, gameState, percentileForTestScore } from "../js/state.js";
import { encodeReportPayload, decodeReportPayload, buildReportPayload, renderSharedReport, renderScoreReport } from "../js/ui/scoreReport.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  const fresh = new GameState();
  gameState.data = fresh.data;
  return gameState;
}

test("encodeReportPayload/decodeReportPayload round-trips valid data through to the same sanitized shape", () => {
  const original = { name: "Alex", predictedScore: 24, latestTest: null, essayBest: 8, masteredCount: 5, totalSkills: 59 };
  const decoded = decodeReportPayload(encodeReportPayload(original));
  assertEqual(decoded.name, "Alex");
  assertEqual(decoded.predictedScore, 24);
  assertEqual(decoded.latestTest, null);
  assertEqual(decoded.essayBest, 8);
  assertEqual(decoded.masteredCount, 5);
  assertEqual(decoded.totalSkills, 59);
});

test("encodeReportPayload/decodeReportPayload round-trip non-ASCII names safely", () => {
  const original = { name: "Zoë 🐲", predictedScore: 30 };
  const decoded = decodeReportPayload(encodeReportPayload(original));
  assertEqual(decoded.name, "Zoë 🐲");
});

test("decodeReportPayload throws on garbage input rather than silently returning something wrong", () => {
  let threw = false;
  try {
    decodeReportPayload("not-valid-base64-json!!!");
  } catch {
    threw = true;
  }
  assertTrue(threw, "expected decodeReportPayload to throw on malformed input");
});

test("decodeReportPayload sanitizes a hand-crafted payload instead of trusting its shape", () => {
  // Nothing stops someone from building a `?report=` link whose JSON
  // doesn't match what buildReportPayload() would ever actually produce —
  // decodeReportPayload has to defend against that on its own.
  const malicious = {
    name: 123, // not even a string
    predictedScore: "99999; DROP TABLE", // wildly out of range and non-numeric
    latestTest: { composite: -50, sectionResults: "not an array" },
    essayBest: 500,
    masteredCount: -10,
    totalSkills: "sixty",
  };
  const decoded = decodeReportPayload(encodeReportPayload(malicious));
  assertEqual(decoded.name, "Explorer"); // non-string falls back cleanly
  assertEqual(decoded.predictedScore, null); // non-numeric falls back to null, not a garbage string
  assertEqual(decoded.latestTest, null); // sectionResults wasn't an array, so the whole test is dropped
  assertTrue(decoded.essayBest <= 12, "essayBest should be clamped to the real 2-12 scale");
  assertTrue(decoded.masteredCount >= 0, "masteredCount should be clamped to a non-negative number");
  assertEqual(decoded.totalSkills, 0); // non-numeric falls back to 0
});

test("decodeReportPayload caps an absurdly long name instead of passing it through unbounded", () => {
  const longName = "a".repeat(5000);
  const decoded = decodeReportPayload(encodeReportPayload({ name: longName }));
  assertTrue(decoded.name.length <= 30, `expected name to be capped at 30 chars, got ${decoded.name.length}`);
});

test("renderSharedReport never injects a malicious name as a real DOM element", () => {
  const maliciousName = '<img src=x onerror="window.__scoreReportXssFired = true">';
  window.__scoreReportXssFired = false;
  const encoded = encodeReportPayload({ name: maliciousName, predictedScore: 20 });
  const root = document.createElement("div");
  renderSharedReport(root, encoded);
  assertTrue(!root.querySelector("img"), "the malicious <img> tag must not become a real element in the DOM");
  assertTrue(!window.__scoreReportXssFired, "the injected onerror handler must never have run");
  const heading = root.querySelector("h1");
  assertTrue(!!heading && heading.textContent.includes("<img"), "the escaped markup should still be visible as literal text");
});

test("renderSharedReport also escapes a malicious section label from a hand-crafted payload", () => {
  const encoded = encodeReportPayload({
    predictedScore: 20,
    latestTest: {
      composite: 22,
      sectionResults: [{ subjectId: "english", label: '<script>window.__scoreReportXssFired2 = true</script>', correctCount: 50, totalCount: 75, subscore: 22 }],
    },
  });
  window.__scoreReportXssFired2 = false;
  const root = document.createElement("div");
  renderSharedReport(root, encoded);
  assertTrue(!root.querySelector("script"), "the malicious <script> tag must not become a real element in the DOM");
  assertTrue(!window.__scoreReportXssFired2, "the injected script must never have run");
});

test("buildReportPayload reflects a fresh player's actual (empty) state", () => {
  localStorage.removeItem("act-quest-save-v1");
  const fresh = new GameState();
  // buildReportPayload reads the module-level `gameState` singleton, not
  // an arbitrary instance — mirror its data onto the singleton the same
  // way a real page load would populate it, then build.
  gameState.data = fresh.data;
  const payload = buildReportPayload();
  assertEqual(payload.latestTest, null);
  assertEqual(payload.essayBest, null);
  assertEqual(payload.masteredCount, 0);
});

test("buildReportPayload picks up a recorded practice test composite and essay best", () => {
  localStorage.removeItem("act-quest-save-v1");
  const fresh = new GameState();
  gameState.data = fresh.data;
  gameState.recordPracticeTestResult({
    sectionResults: [{ subjectId: "english", label: "English", correctCount: 60, totalCount: 75, subscore: 24 }],
    composite: 24,
    starsEarned: 10,
    coinsEarned: 30,
  });
  gameState.recordEssayResult({
    promptId: "school-schedules",
    wordCount: 300,
    domainScores: { ideas: 4, development: 4, organization: 4, language: 4 },
    totalScore: 8,
    starsEarned: 16,
    coinsEarned: 54,
  });
  const payload = buildReportPayload();
  assertEqual(payload.latestTest.composite, 24);
  assertEqual(payload.essayBest, 8);
});

// --- multi-test (SAT/PSAT) Score Report support ---

test("percentileForTestScore('act', ...) delegates to the real ACT lookup table", () => {
  assertEqual(percentileForTestScore("act", 30), 95);
  assertEqual(percentileForTestScore("act", 36), 100);
  assertEqual(percentileForTestScore("act", 1), 1);
});

test("percentileForTestScore approximates SAT/PSAT with a monotonic curve over each test's own range", () => {
  assertEqual(percentileForTestScore("sat", 400), 1);
  assertEqual(percentileForTestScore("sat", 1600), 99);
  assertTrue(percentileForTestScore("sat", 1200) > percentileForTestScore("sat", 1000), "a higher SAT score must never score a lower percentile");
  assertEqual(percentileForTestScore("psat", 320), 1);
  assertEqual(percentileForTestScore("psat", 1520), 99);
});

test("percentileForTestScore returns null for a test with no percentile curve (State Assessments, or an unknown id)", () => {
  assertEqual(percentileForTestScore("stateAssessments", 50), null);
  assertEqual(percentileForTestScore("not-a-real-test", 50), null);
});

test("buildReportPayload('sat') is scoped to SAT: no essay (ACT-only), mastery counted from SAT's own subjects only", () => {
  const gs = freshGameState();
  gs.cheatSetSubjectMastered("sat-math", true);
  gs.recordEssayResult({
    promptId: "school-schedules",
    wordCount: 300,
    domainScores: { ideas: 4, development: 4, organization: 4, language: 4 },
    totalScore: 8,
    starsEarned: 0,
    coinsEarned: 0,
  });
  const payload = buildReportPayload("sat");
  assertEqual(payload.testId, "sat");
  assertEqual(payload.essayBest, null, "SAT has no Writing section, even though this player has an ACT essay score");
  assertTrue(payload.masteredCount > 0 && payload.masteredCount < payload.totalSkills, "expected sat-math mastered but not every SAT skill");
  // The ACT report must not see SAT's mastered subject either.
  assertEqual(buildReportPayload("act").masteredCount, 0);
});

test("buildReportPayload('act') keeps essayBest when the player has a real Writing score", () => {
  const gs = freshGameState();
  gs.recordEssayResult({
    promptId: "school-schedules",
    wordCount: 300,
    domainScores: { ideas: 5, development: 5, organization: 5, language: 5 },
    totalScore: 10,
    starsEarned: 0,
    coinsEarned: 0,
  });
  assertEqual(buildReportPayload("act").essayBest, 10);
});

test("decodeReportPayload falls back to 'act' for a testId with no practiceTest config, instead of trusting it far enough to crash", () => {
  const encoded = encodeReportPayload({ testId: "stateAssessments", predictedScore: 20 });
  const decoded = decodeReportPayload(encoded);
  assertEqual(decoded.testId, "act");
});

test("decodeReportPayload clamps a SAT payload's scores to SAT's own 400-1600 range, not ACT's 1-36", () => {
  const encoded = encodeReportPayload({ testId: "sat", predictedScore: 9999 });
  const decoded = decodeReportPayload(encoded);
  assertEqual(decoded.testId, "sat");
  assertEqual(decoded.predictedScore, 1600);
});

test("renderScoreReport renders a distinct, correctly-labeled report for act/sat/psat with no crash", () => {
  for (const testId of ["act", "sat", "psat"]) {
    freshGameState();
    const root = document.createElement("div");
    renderScoreReport(root, () => {}, { testId });
    const heading = root.querySelector("h1")?.textContent || "";
    assertTrue(heading.includes(testId === "act" ? "ACT" : testId === "sat" ? "SAT" : "PSAT"), `expected ${testId}'s own name in the heading, got "${heading}"`);
  }
});

test("renderScoreReport falls back to 'act' for an unrecognized/missing testId instead of crashing", () => {
  freshGameState();
  const root = document.createElement("div");
  renderScoreReport(root, () => {}, { testId: "not-a-real-test" });
  assertTrue(root.querySelector("h1").textContent.includes("ACT"));
});
