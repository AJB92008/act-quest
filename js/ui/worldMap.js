import { SUBJECTS } from "../data/skills.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { pathPositions, pathHeight, renderPathSvg, renderDecorations } from "./pathTrail.js";

const ROW_HEIGHT = 200;

// Shortcut nodes above the island path — styled like the islands themselves
// (circular icon + colored ring + label) rather than generic list cards, so
// they read as part of the same map instead of a bolted-on menu. Each gets
// its own accent color, distinct from every subject island's and from each
// other, so they stay visually distinguishable at a glance.
const SHORTCUTS = [
  { screen: "weakReview", icon: "🎯", name: "Weak Skill Review", blurb: "Your lowest-accuracy skills", color: "#22b8a3", bg: "#e8fbf7" },
  { screen: "reviewQueue", icon: "🧠", name: "Review Queue", blurb: "Spaced repetition, due now", color: "#7c5cff", bg: "#f1eeff" },
  { screen: "drillBuilder", icon: "🎛️", name: "Custom Drill", blurb: "Pick your own skills", color: "#ff9f38", bg: "#fff4e6" },
];

export function renderWorldMap(root, navigate) {
  const positions = pathPositions(SUBJECTS.length, { rowHeight: ROW_HEIGHT, leftPct: 26, rightPct: 74 });
  const totalHeight = pathHeight(SUBJECTS.length, ROW_HEIGHT);

  const stats = SUBJECTS.map((subject) => gameState.getSubjectStats(subject.id));
  const reviewQueueDueCount = gameState.getDueQuestionKeys(99).length + gameState.getDueVocabWords(99).length;
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
        ${isCurrent ? `<div class="map-mascot">${monsterSVG(gameState.getDisplayAvatar(), { size: 69 })}</div>` : ""}
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

  const shortcuts = SHORTCUTS.map((s) => {
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
  }).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen map-screen">
      <h1 class="map-title">Choose an Island to Explore</h1>
      <p class="map-subtitle">Acto is ready to study. Pick a subject to begin the path.</p>
      <div class="map-shortcuts-row">${shortcuts}</div>
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
  root.querySelectorAll("[data-shortcut]").forEach((node) => {
    node.addEventListener("click", () => navigate(node.dataset.shortcut));
  });
}
