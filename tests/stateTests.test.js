// Regression tests for the State Assessments planet's per-state
// infrastructure: the state data itself (data/stateTests.js), gameState's
// homeState field, and the World Map/Dashboard/state-picker screens'
// handling of "no state chosen yet" vs. "state chosen."
import { STATES, STATE_ABBRS, STATE_SUBJECTS, ALL_STATE_SUBJECTS, getState, getStateSubjects } from "../js/data/stateTests.js";
import { TESTS, getTest, getSubject, isSubjectPlayable, isTestReady } from "../js/data/tests.js";
import { GameState, gameState } from "../js/state.js";
import { renderWorldMap } from "../js/ui/worldMap.js";
import { renderStatePicker } from "../js/ui/statePicker.js";
import { renderDashboard } from "../js/ui/dashboard.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  gameState.data = new GameState().data;
}

// --- data/stateTests.js ---

test("all 50 US states are listed, each with a two-letter abbreviation", () => {
  assertEqual(STATES.length, 50);
  for (const s of STATES) {
    assertEqual(s.abbr.length, 2);
    assertEqual(s.abbr, s.abbr.toUpperCase());
    assertTrue(s.name.length > 0);
  }
  assertEqual(STATE_ABBRS.size, 50);
});

test("no state abbreviation repeats", () => {
  const abbrs = STATES.map((s) => s.abbr);
  assertEqual(new Set(abbrs).size, abbrs.length);
});

test("every state has exactly two subjects (ELA + Math), both still coming-soon scaffolding", () => {
  for (const s of STATES) {
    const subjects = getStateSubjects(s.abbr);
    assertEqual(subjects.length, 2);
    for (const subject of subjects) {
      assertEqual(subject.skills.length, 0);
      assertTrue(!isSubjectPlayable(subject), `expected "${subject.id}" to be a coming-soon placeholder`);
      assertTrue(subject.name.length > 0);
      assertTrue(subject.blurb.includes(s.name), `expected "${subject.id}"'s blurb to mention ${s.name}`);
    }
  }
});

test("getStateSubjects returns [] for an unknown/invalid abbreviation instead of throwing", () => {
  assertEqual(getStateSubjects("ZZ").length, 0);
  assertEqual(getStateSubjects(undefined).length, 0);
});

test("getState resolves a real abbreviation to its full name, and returns undefined for a fake one", () => {
  assertEqual(getState("TX").name, "Texas");
  assertEqual(getState("ZZ"), undefined);
});

test("ALL_STATE_SUBJECTS has exactly 100 entries (50 states x 2 subjects), every id globally unique", () => {
  assertEqual(ALL_STATE_SUBJECTS.length, 100);
  const ids = ALL_STATE_SUBJECTS.map((s) => s.id);
  assertEqual(new Set(ids).size, 100);
  for (const id of ids) {
    assertTrue(id.startsWith("state-"), `expected "${id}" to use the state- prefix`);
  }
});

test("every state subject id resolves via getSubject (data/tests.js), confirming it's folded into the stateAssessments planet", () => {
  for (const abbr of Object.keys(STATE_SUBJECTS)) {
    for (const subject of STATE_SUBJECTS[abbr]) {
      const found = getSubject(subject.id);
      assertTrue(!!found, `expected getSubject("${subject.id}") to resolve`);
      assertEqual(found.id, subject.id);
    }
  }
});

test("no state subject id collides with any ACT/SAT/PSAT subject or skill id", () => {
  const nonStateIds = TESTS.filter((t) => t.id !== "stateAssessments").flatMap((t) => [
    ...t.subjects.map((s) => s.id),
    ...t.subjects.flatMap((s) => s.skills.map((sk) => sk.id)),
  ]);
  const stateIds = new Set(ALL_STATE_SUBJECTS.map((s) => s.id));
  for (const id of nonStateIds) {
    assertTrue(!stateIds.has(id), `id "${id}" collides between a state subject and another planet`);
  }
});

test("stateAssessments planet stays not-ready overall — every one of its 100 subjects is still coming soon", () => {
  assertTrue(!isTestReady("stateAssessments"));
});

// --- gameState.homeState ---

test("a fresh save has no homeState", () => {
  freshGameState();
  assertEqual(gameState.homeState, null);
});

test("setHomeState persists a real state abbreviation", () => {
  freshGameState();
  gameState.setHomeState("CA");
  assertEqual(gameState.homeState, "CA");
});

test("setHomeState silently ignores an unknown/invalid abbreviation instead of corrupting state", () => {
  freshGameState();
  gameState.setHomeState("ZZ");
  assertEqual(gameState.homeState, null);
  gameState.setHomeState("CA");
  gameState.setHomeState("not-a-state");
  assertEqual(gameState.homeState, "CA", "an invalid second call shouldn't overwrite a previously-valid homeState");
});

test("state.js's load path resets a tampered/unknown homeState from an imported save instead of carrying it through", () => {
  localStorage.setItem("act-quest-save-v1", JSON.stringify({ version: 1, homeState: "not-a-real-state" }));
  const gs = new GameState();
  assertEqual(gs.data.homeState, null);
  localStorage.removeItem("act-quest-save-v1");
});

test("state.js's load path carries through a valid saved homeState", () => {
  localStorage.setItem("act-quest-save-v1", JSON.stringify({ version: 1, homeState: "NY" }));
  const gs = new GameState();
  assertEqual(gs.data.homeState, "NY");
  localStorage.removeItem("act-quest-save-v1");
});

// --- worldMap.js: redirect to the state picker until a state is chosen ---

test("visiting the stateAssessments World Map with no homeState redirects to the state picker instead of rendering", () => {
  freshGameState();
  let navigated = null;
  const root = document.createElement("div");
  renderWorldMap(root, (screen, params) => (navigated = { screen, params }), { testId: "stateAssessments" });
  assertEqual(navigated?.screen, "statePicker");
  assertEqual(navigated?.params?.returnTo, "map");
  // Nothing from the real map screen should have rendered.
  assertTrue(!root.querySelector("[data-subject]"), "expected no island buttons — the redirect should happen before any map markup is built");
});

test("visiting the stateAssessments World Map with a homeState set renders that state's two islands", () => {
  freshGameState();
  gameState.setHomeState("FL");
  let navigated = null;
  const root = document.createElement("div");
  renderWorldMap(root, (screen, params) => (navigated = { screen, params }), { testId: "stateAssessments" });
  assertEqual(navigated, null, "should render in place, not redirect, once a state is chosen");
  const subjectButtons = root.querySelectorAll("[data-subject]");
  assertEqual(subjectButtons.length, 2);
  const ids = Array.from(subjectButtons).map((b) => b.dataset.subject).sort();
  assertEqual(ids.join(","), "state-fl-ela,state-fl-math");
});

test("the World Map's Change State button clears nothing itself but routes back to the picker", () => {
  freshGameState();
  gameState.setHomeState("OH");
  const root = document.createElement("div");
  let navigated = null;
  renderWorldMap(root, (screen, params) => (navigated = { screen, params }), { testId: "stateAssessments" });
  const changeBtn = root.querySelector("[data-change-state]");
  assertTrue(!!changeBtn, "expected a Change State button once a homeState is set");
  changeBtn.click();
  assertEqual(navigated?.screen, "statePicker");
  // homeState itself is untouched until the picker's own Continue is clicked.
  assertEqual(gameState.homeState, "OH");
});

// --- statePicker.js ---

test("the state picker lists all 50 states and disables Continue until one is chosen", () => {
  const root = document.createElement("div");
  renderStatePicker(root, () => {}, {});
  const select = root.querySelector("#stateSelect");
  const continueBtn = root.querySelector("#continueBtn");
  assertEqual(select.querySelectorAll("option[value]:not([value=''])").length, 50);
  assertTrue(continueBtn.disabled);
});

test("choosing a state and continuing saves homeState and navigates to returnTo with testId stateAssessments", () => {
  freshGameState();
  const root = document.createElement("div");
  let navigated = null;
  renderStatePicker(root, (screen, params) => (navigated = { screen, params }), { returnTo: "dashboard" });
  const select = root.querySelector("#stateSelect");
  const continueBtn = root.querySelector("#continueBtn");
  select.value = "WA";
  select.dispatchEvent(new Event("change"));
  assertTrue(!continueBtn.disabled, "Continue should enable once a real state is selected");
  continueBtn.click();
  assertEqual(gameState.homeState, "WA");
  assertEqual(navigated?.screen, "dashboard");
  assertEqual(navigated?.params?.testId, "stateAssessments");
});

// --- dashboard.js's Skills by Test tab ---

test("Dashboard's State Assessments tab prompts to choose a state when none is set", () => {
  freshGameState();
  const root = document.createElement("div");
  renderDashboard(root, () => {}, { testId: "stateAssessments" });
  assertTrue(!!root.querySelector("[data-choose-state]"), "expected a Choose Your State button");
  assertEqual(root.querySelectorAll(".dash-row").length, 0);
});

test("Dashboard's State Assessments tab shows the chosen state's two islands once one is set", () => {
  freshGameState();
  gameState.setHomeState("GA");
  const root = document.createElement("div");
  renderDashboard(root, () => {}, { testId: "stateAssessments" });
  assertTrue(!root.querySelector("[data-choose-state]"), "the prompt shouldn't show once a state is chosen");
  const rowLabels = Array.from(root.querySelectorAll(".dash-row-label span:first-child")).map((el) => el.textContent);
  assertTrue(rowLabels.some((t) => t.includes("Georgia Milestones")), "expected Georgia's real program name to appear");
});
