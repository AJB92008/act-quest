// Regression tests for the Score Report's shareable-link encoding
// (encodeReportPayload/decodeReportPayload) and the payload it builds from
// live game state (buildReportPayload) — both in ui/scoreReport.js.
import { GameState, gameState } from "../js/state.js";
import { encodeReportPayload, decodeReportPayload, buildReportPayload } from "../js/ui/scoreReport.js";
import { test, assertEqual, assertTrue } from "./assert.js";

test("encodeReportPayload/decodeReportPayload round-trip plain data exactly", () => {
  const original = { name: "Alex", predictedScore: 24, latestTest: null, essayBest: 8, masteredCount: 5, totalSkills: 59 };
  const decoded = decodeReportPayload(encodeReportPayload(original));
  assertEqual(JSON.stringify(decoded), JSON.stringify(original));
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
