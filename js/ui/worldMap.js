import { getTest, getTestSubjects, isSubjectPlayable } from "../data/tests.js";
import { getState, getStateSubjects } from "../data/stateTests.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 200;

// This screen is a solar system's own planet-picker: each subject/category
// is a planet (see data/tests.js), and picking one hands off to island.js,
// which plays the same role one level down (each skill within that
// subject is an island). State Assessments is the one planet-picker this
// screen never actually renders — see the testId==="stateAssessments"
// branch below, which redirects to the rocket-themed state picker instead,
// since that solar system's planets are the 50 states, not a fixed
// subject list.
//
// Shortcut nodes above the planet path — styled like the planets
// themselves (circular icon + colored ring + label) rather than generic
// list cards, so they read as part of the same map instead of a bolted-on
// menu. Each gets its own accent color, distinct from every planet's and
// from each other, so they stay visually distinguishable at a glance.
const SHORTCUTS = [
  { screen: "diagnostic", icon: "🧪", name: "Placement Diagnostic", blurb: "A quick cross-subject sample", color: "#2a6df5", bg: "#eaf1ff" },
  { screen: "weakReview", icon: "🎯", name: "Weak Skill Review", blurb: "Your lowest-accuracy skills", color: "#22b8a3", bg: "#e8fbf7" },
  { screen: "adaptivePractice", icon: "🧭", name: "Adaptive Practice", blurb: "Your weakest question patterns", color: "#c2410c", bg: "#fff1e8" },
  { screen: "reviewQueue", icon: "🧠", name: "Review Queue", blurb: "Spaced repetition, due now", color: "#7c5cff", bg: "#f1eeff" },
  { screen: "drillBuilder", icon: "🎛️", name: "Custom Drill", blurb: "Pick your own skills", color: "#ff9f38", bg: "#fff4e6" },
];

export function renderWorldMap(root, navigate, { testId } = {}) {
  // Arriving here *with* a testId (from the Solar System screen picking a
  // planet) switches the player's current planet; arriving without one
  // (every existing "Back to Map"/HUD "Map" click across the whole app)
  // just stays on whichever planet was already current — so none of those
  // ~15 call sites needed to change to keep working.
  if (testId) gameState.setCurrentTestId(testId);
  const activeTestId = testId || gameState.currentTestId;
  // State Assessments has no single fixed set of planets — which two show
  // up depends on which state the player lives in (see
  // data/stateTests.js). Redirect to the rocket-themed picker instead of
  // rendering an empty/wrong map when that hasn't been chosen yet; once it
  // has, show that state's own two planets instead of the solar system's
  // full 50-state subject list (getTestSubjects would return all 100 —
  // see tests.js's own comment on why that flat list exists).
  if (activeTestId === "stateAssessments" && !gameState.homeState) {
    navigate("statePicker", { returnTo: "map" });
    return;
  }
  const test = getTest(activeTestId);
  const subjects = activeTestId === "stateAssessments" ? getStateSubjects(gameState.homeState) : getTestSubjects(activeTestId);
  const isReady = subjects.some(isSubjectPlayable);

  const positions = pathPositions(subjects.length, { rowHeight: ROW_HEIGHT, leftPct: 26, rightPct: 74 });
  const totalHeight = pathHeight(subjects.length, ROW_HEIGHT);

  const stats = subjects.map((subject) => gameState.getSubjectStats(subject.id));
  const reviewQueueDueCount = gameState.getDueQuestionKeys(99).length + gameState.getDueVocabWords(99).length;
  // Point the mascot at the first subject that isn't fully cleared yet, so
  // the map always shows "here's where to pick back up."
  let currentIndex = stats.findIndex((s) => s.masteredCount < s.totalSkills);
  if (currentIndex === -1) currentIndex = subjects.length - 1;

  const planets = subjects.map((subject, i) => {
    const { x, y } = positions[i];
    const stat = stats[i];
    const pct = stat.totalSkills > 0 ? Math.round((stat.masteredCount / stat.totalSkills) * 100) : 0;
    const isCurrent = i === currentIndex;
    return `
      <div class="map-node-wrap" style="left:${x}%;top:${y}px;">
        ${isCurrent ? `<div class="map-mascot">${monsterSVG(gameState.getDisplayAvatar(), { size: 69 })}</div>` : ""}
        <button class="map-island-node" data-subject="${subject.id}" aria-label="${subject.name} planet: ${stat.masteredCount} of ${stat.totalSkills} islands mastered" style="--island-color:${subject.color};--island-bg:${subject.bg};--ring-pct:${pct}%">
          <span class="map-island-ring"></span>
          <span class="map-island-icon" aria-hidden="true">${subject.icon}</span>
        </button>
        <div class="map-island-label">
          <h3>${subject.name}</h3>
          <p class="map-island-place">${subject.place}</p>
          <p class="map-island-progress">${stat.masteredCount} / ${stat.totalSkills} mastered</p>
        </div>
      </div>
    `;
  }).join("");

  // The shortcut modes (diagnostic, weak review, adaptive practice, review
  // queue, custom drill) all draw from real question content behind a
  // solar system's planets — showing them on a solar system with nothing
  // playable yet would just be a row of buttons into empty screens, so
  // they only appear once at least one planet has real content (isReady),
  // same gate this screen itself uses to decide "real path" vs. "coming
  // soon" banner.
  const shortcuts =
    isReady
      ? SHORTCUTS.map((s) => {
          const badge = s.screen === "reviewQueue" && reviewQueueDueCount > 0 ? `<span class="map-shortcut-badge">${reviewQueueDueCount}</span>` : "";
          return `
            <button class="map-shortcut" data-shortcut="${s.screen}" style="--island-color:${s.color};--island-bg:${s.bg}">
              <span class="map-island-node map-shortcut-node">
                <span class="map-island-ring" style="--ring-pct:100%"></span>
                <span class="map-island-icon">${s.icon}</span>
                ${badge}
              </span>
              <span class="map-island-label">
                <h3>${s.name}</h3>
                <p class="map-island-place">${s.blurb}</p>
              </span>
            </button>
          `;
        }).join("")
      : "";

  const homeStateName = activeTestId === "stateAssessments" ? getState(gameState.homeState)?.name : null;

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen map-screen">
      <button class="back-btn" data-solar-system>&larr; Galaxy</button>
      ${homeStateName ? `<button class="back-btn" data-change-state>🗺️ Change State (${homeStateName})</button>` : ""}
      <h1 class="map-title">Choose a Planet to Explore</h1>
      <p class="map-subtitle">${
        activeTestId === "act"
          ? "Acto is ready to study. Pick a planet to begin the path."
          : activeTestId === "stateAssessments"
          ? `${test.planetName} &mdash; ${homeStateName}'s own mandated assessments.`
          : `${test.planetName} (${test.name}) &mdash; pick a planet to begin the path.`
      }</p>
      ${!isReady ? `<p class="map-coming-soon-banner">🚧 ${test.name} content is still being built &mdash; pick a planet below to see what's planned.</p>` : ""}
      ${shortcuts ? `<div class="map-shortcuts-row">${shortcuts}</div>` : ""}
      <div class="map-path-container" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: "#b6aeff" })}
        <div class="path-decorations">${renderDecorations(totalHeight, 1)}</div>
        ${planets}
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-solar-system]").addEventListener("click", () => navigate("solarSystem"));
  root.querySelector("[data-change-state]")?.addEventListener("click", () => navigate("statePicker", { returnTo: "map" }));
  root.querySelectorAll("[data-subject]").forEach((node) => {
    node.addEventListener("click", () => navigate("island", { subjectId: node.dataset.subject }));
  });
  root.querySelectorAll("[data-shortcut]").forEach((node) => {
    node.addEventListener("click", () => navigate(node.dataset.shortcut, { testId: activeTestId }));
  });
}
