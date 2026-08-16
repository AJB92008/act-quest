// Regression tests for the Score Report's shareable-link encoding
// (encodeReportPayload/decodeReportPayload), the payload it builds from
// live game state (buildReportPayload), and — critically — that a
// `?report=` link's decoded data can never inject real markup into the
// page. A share link is untrusted input by construction (anyone can hand-
// craft one and send it to someone else), and decodeReportPayload used to
// pass whatever it decoded straight through to the renderer with no
// escaping or type checking at all.
import { GameState, gameState } from "../js/state.js";
import { encodeReportPayload, decodeReportPayload, buildReportPayload, renderSharedReport } from "../js/ui/scoreReport.js";
import { test, assertEqual, assertTrue } from "./assert.js";

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
