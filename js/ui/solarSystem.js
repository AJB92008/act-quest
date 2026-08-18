// The top-level "universe" screen: each standardized test is its own solar
// system (see data/tests.js) — picking one hands off to the World Map,
// which now plays the role of that solar system's own planet-picker (each
// subject/category is a planet; see worldMap.js's own header comment).
// State Assessments is the one exception: its "planets" are the 50 US
// states themselves, reached via a rocket-themed picker (see
// ui/statePicker.js) rather than a fixed subject list, since which test
// applies depends on where the player lives, not a single national exam.
// A solar system with no lessons written yet still fully round-trips
// through every screen, it just has nothing in it.
import { TESTS, isTestReady } from "../data/tests.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 210;

export function renderSolarSystem(root, navigate) {
  const positions = pathPositions(TESTS.length, { rowHeight: ROW_HEIGHT, leftPct: 26, rightPct: 74 });
  const totalHeight = pathHeight(TESTS.length, ROW_HEIGHT);

  const planets = TESTS.map((test, i) => {
    const { x, y } = positions[i];
    const ready = isTestReady(test.id);
    const isCurrent = test.id === gameState.currentTestId;
    // State Assessments' subjects list is all 50 states' islands flattened
    // together (see data/tests.js's own comment on why) — the real
    // "planet" count for that solar system is the 50 states themselves,
    // not that flattened subject list, so it gets its own label.
    const planetLabel = test.id === "stateAssessments" ? "50 planets" : `${test.subjects.length} planet${test.subjects.length === 1 ? "" : "s"}`;
    return `
      <div class="map-node-wrap" style="left:${x}%;top:${y}px;">
        <button class="map-island-node planet-node ${ready ? "" : "is-coming-soon"}" data-test="${test.id}"
          aria-label="${test.name} solar system: ${test.planetName}${ready ? "" : ", coming soon"}${isCurrent ? ", current solar system" : ""}"
          style="--island-color:${test.color};--island-bg:${test.bg};--ring-pct:100%">
          <span class="map-island-ring"></span>
          <span class="map-island-icon" aria-hidden="true">${test.icon}</span>
          ${isCurrent ? `<span class="planet-current-badge" title="Current solar system">📍</span>` : ""}
        </button>
        <div class="map-island-label">
          <h3>${test.planetName}</h3>
          <p class="map-island-place">${test.name} &middot; ${planetLabel}</p>
          <p class="map-island-progress">${ready ? "Ready to explore" : "🚧 Coming soon"}</p>
        </div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("solarSystem")}
    <main class="screen map-screen solar-system-screen">
      <h1 class="map-title">🌌 Choose a Solar System</h1>
      <p class="map-subtitle">Every standardized test is its own solar system, full of planets to explore. Pick one to start.</p>
      <div class="map-path-container" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: "#b6aeff" })}
        <div class="path-decorations">${renderDecorations(totalHeight, 2)}</div>
        ${planets}
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelectorAll("[data-test]").forEach((node) => {
    node.addEventListener("click", () => navigate("map", { testId: node.dataset.test }));
  });
}
