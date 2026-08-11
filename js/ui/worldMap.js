import { SUBJECTS } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 200;

export function renderWorldMap(root, navigate) {
  const positions = pathPositions(SUBJECTS.length, { rowHeight: ROW_HEIGHT, leftPct: 26, rightPct: 74 });
  const totalHeight = pathHeight(SUBJECTS.length, ROW_HEIGHT);

  const stats = SUBJECTS.map((subject) => gameState.getSubjectStats(subject.id));
  // Point the mascot at the first subject that isn't fully cleared yet, so
  // the map always shows "here's where to pick back up."
  let currentIndex = stats.findIndex((s) => s.masteredCount < s.totalSkills);
  if (currentIndex === -1) currentIndex = SUBJECTS.length - 1;

  const islands = SUBJECTS.map((subject, i) => {
    const { x, y } = positions[i];
    const stat = stats[i];
    const pct = stat.totalSkills > 0 ? Math.round((stat.masteredCount / stat.totalSkills) * 100) : 0;
    const isCurrent = i === currentIndex;
    return `
      <div class="map-node-wrap" style="left:${x}%;top:${y}px;">
        ${isCurrent ? `<div class="map-mascot">${monsterSVG(gameState.getAvatar(), { size: 56 })}</div>` : ""}
        <button class="map-island-node" data-subject="${subject.id}" style="--island-color:${subject.color};--island-bg:${subject.bg};--ring-pct:${pct}%">
          <span class="map-island-ring"></span>
          <span class="map-island-icon">${subject.icon}</span>
        </button>
        <div class="map-island-label">
          <h3>${subject.name}</h3>
          <p class="map-island-place">${subject.place}</p>
          <p class="map-island-progress">${stat.masteredCount} / ${stat.totalSkills} mastered</p>
        </div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen map-screen">
      <h1 class="map-title">Choose an Island to Explore</h1>
      <p class="map-subtitle">Acto is ready to study. Pick a subject to begin the path.</p>
      <button class="background-lesson-card weak-review-card" data-weak-review>
        <span class="background-lesson-icon">🎯</span>
        <span class="background-lesson-text">
          <strong>Weak Skill Review</strong>
          <span>A quick session auto-built from your lowest-accuracy skills, across every subject.</span>
        </span>
        <span class="background-lesson-arrow">&rarr;</span>
      </button>
      <div class="map-path-container" style="height:${totalHeight}px">
        ${renderPathSvg(positions, totalHeight, { color: "#b6aeff" })}
        <div class="path-decorations">${renderDecorations(totalHeight, 1)}</div>
        ${islands}
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelectorAll("[data-subject]").forEach((node) => {
    node.addEventListener("click", () => navigate("island", { subjectId: node.dataset.subject }));
  });
  root.querySelector("[data-weak-review]").addEventListener("click", () => navigate("weakReview"));
}
