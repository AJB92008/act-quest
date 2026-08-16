// The Solar System: one level above the World Map. Each standardized test
// is a planet; picking one hands off to the exact same World Map/island/
// skill-path/quiz screens ACT already uses, just scoped to that planet's
// own subjects (see data/tests.js) — a planet with no lessons written yet
// still fully round-trips through every screen, it just has nothing in it.
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
    const subjectCount = test.subjects.length;
    return `
      <div class="map-node-wrap" style="left:${x}%;top:${y}px;">
        <button class="map-island-node planet-node ${ready ? "" : "is-coming-soon"}" data-test="${test.id}"
          aria-label="${test.name} on ${test.planetName}${ready ? "" : ", coming soon"}${isCurrent ? ", current planet" : ""}"
          style="--island-color:${test.color};--island-bg:${test.bg};--ring-pct:100%">
          <span class="map-island-ring"></span>
          <span class="map-island-icon" aria-hidden="true">${test.icon}</span>
          ${isCurrent ? `<span class="planet-current-badge" title="Current planet">📍</span>` : ""}
        </button>
        <div class="map-island-label">
          <h3>${test.planetName}</h3>
          <p class="map-island-place">${test.name} &middot; ${subjectCount} subject${subjectCount === 1 ? "" : "s"}</p>
          <p class="map-island-progress">${ready ? "Ready to explore" : "🚧 Coming soon"}</p>
        </div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("solarSystem")}
    <main class="screen map-screen solar-system-screen">
      <h1 class="map-title">🌌 Choose a Planet</h1>
      <p class="map-subtitle">Every standardized test is its own world. Pick one to start exploring.</p>
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
