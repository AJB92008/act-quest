// Regression tests from a broader XSS sweep prompted by the Score Report
// fix (see scoreReport.test.js): every other screen with a free-text
// input, or that renders a field capable of holding an imported/cloud-
// synced value, needed the same "escape before interpolating into HTML"
// treatment. Covers: the Mistake Journal's search box (confirmed
// exploitable — typing a `"` breaks out of the value="..." attribute),
// and the type-guards added to state.js's load path (protects
// studyPlan.testDate/targetScore and createdName against a malicious
// imported/cloud-pulled save, not just this app's own UI, which already
// constrains what a player can type).
import { GameState, gameState } from "../js/state.js";
import { preloadAllSubjects } from "../js/data/questions/index.js";
import { renderMistakeJournal } from "../js/ui/mistakeJournal.js";
import { renderStudyPlan } from "../js/ui/studyPlan.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  return new GameState();
}

test("Mistake Journal search box escapes a value= attribute break-out attempt", async () => {
  await preloadAllSubjects();

  // Other test files in this suite share this same gameState singleton
  // and run concurrently (assert.js's test() doesn't await one test
  // before starting the next) — a couple of them reassign
  // `gameState.data` wholesale too, which can stomp the mistake entry
  // this test just added during its own async gaps. Re-asserting it in a
  // short retry loop makes this robust to that interference instead of
  // being flaky, without changing anything about what's actually under
  // test (the escaping behavior itself).
  let root, input;
  for (let attempt = 0; attempt < 10 && !input; attempt++) {
    localStorage.removeItem("act-quest-save-v1");
    gameState.data = new GameState().data;
    gameState.recordQuestionAnswer("en-commas", 1, false, 0);
    root = document.createElement("div");
    renderMistakeJournal(root, () => {});
    await new Promise((r) => setTimeout(r, 100));
    input = root.querySelector("#journalSearch");
  }
  assertTrue(!!input, "expected the search input to exist once there's at least one mistake logged");

  const malicious = '" onmouseover="window.__mistakeJournalXssFired = true';
  window.__mistakeJournalXssFired = false;
  input.value = malicious;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));

  const reRenderedInput = root.querySelector("#journalSearch");
  assertTrue(!!reRenderedInput, "expected the search input to still exist after re-render");
  assertTrue(!reRenderedInput.hasAttribute("onmouseover"), "the injected onmouseover attribute must not have attached to the input");
  assertEqual(reRenderedInput.value, malicious, "the input's actual value should still be exactly what was typed, just safely attribute-encoded in the markup");
});

test("state.js's load path coerces a non-string createdName from an imported/cloud-pulled save instead of carrying it through", () => {
  const gs = freshGameState();
  const result = gs.importSave(
    JSON.stringify({
      avatar: { bodyShape: "round" },
      skillProgress: {},
      createdName: { toString: () => "<img src=x onerror=alert(1)>" }, // not a real string
    })
  );
  assertTrue(result.ok, "expected the import to still succeed overall");
  assertEqual(typeof gs.data.createdName, "string");
});

test("state.js's load path caps an absurdly long createdName from an imported save", () => {
  const gs = freshGameState();
  const result = gs.importSave(
    JSON.stringify({
      avatar: { bodyShape: "round" },
      skillProgress: {},
      createdName: "a".repeat(5000),
    })
  );
  assertTrue(result.ok);
  assertTrue(gs.data.createdName.length <= 40, `expected createdName capped at 40 chars, got ${gs.data.createdName.length}`);
});

test("state.js's load path resets a non-string studyPlan.testDate from an imported save instead of carrying it through", () => {
  const gs = freshGameState();
  const result = gs.importSave(
    JSON.stringify({
      avatar: { bodyShape: "round" },
      skillProgress: {},
      studyPlan: { testDate: { malicious: true }, targetScore: "30 OR 1=1" },
    })
  );
  assertTrue(result.ok);
  assertEqual(gs.data.studyPlan.testDate, null);
  assertEqual(gs.data.studyPlan.targetScore, null);
});

test("Study Plan screen escapes a malicious testDate value pulled in from a tampered/imported save", async () => {
  localStorage.removeItem("act-quest-save-v1");
  gameState.data = new GameState().data;
  // Bypasses the real <input type="date"> (which the normal UI would
  // never let hold this), simulating what a cloud-synced or imported save
  // could still carry — setStudyPlanSettings itself does no validation,
  // by design; the load-path guard (tested above) is what normally
  // prevents this, so this test exercises the render-time escaping
  // directly as a second, independent layer.
  gameState.data.studyPlan.testDate = '"><img src=x onerror="window.__studyPlanXssFired = true">';
  window.__studyPlanXssFired = false;

  const root = document.createElement("div");
  renderStudyPlan(root, () => {});
  await new Promise((r) => setTimeout(r, 50));

  assertTrue(!root.querySelector("img"), "the malicious <img> tag must not become a real element in the DOM");
  assertTrue(!window.__studyPlanXssFired, "the injected onerror handler must never have run");
});
