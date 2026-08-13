import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function renderAchievements(root, navigate) {
  const achievements = gameState.getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

  const rows = achievements
    .map(
      (a) => `
        <div class="achievement-row ${a.unlockedAt !== null ? "is-unlocked" : "is-locked"}">
          <span class="achievement-icon">${a.unlockedAt !== null ? a.icon : "🔒"}</span>
          <div class="achievement-info">
            <strong>${a.name}</strong>
            <p>${a.desc}</p>
          </div>
          ${a.unlockedAt !== null ? `<span class="achievement-date">${formatDate(a.unlockedAt)}</span>` : ""}
        </div>
      `
    )
    .join("");

  root.innerHTML = `
    ${hudHTML("dashboard")}
    <main class="screen dashboard-screen">
      <button class="back-btn" data-back>&larr; Back to Progress</button>
      <h1>🏅 Achievements</h1>
      <p class="lesson-blurb">${unlockedCount} / ${achievements.length} unlocked</p>
      <div class="achievement-list">${rows}</div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
}
