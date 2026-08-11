import { gameState } from "../state.js";
import { monsterSVG } from "./monster.js";

export function hudHTML(activeScreen) {
  const avatar = gameState.getDisplayAvatar();
  const nav = [
    { id: "map", icon: "🗺️", label: "Map" },
    { id: "endless", icon: "🔁", label: "Endless" },
    { id: "dashboard", icon: "📊", label: "Progress" },
    { id: "shop", icon: "🛍️", label: "Shop" },
    { id: "avatarCreator", icon: "🐲", label: "Monster" },
  ];
  return `
    <header class="hud">
      <div class="hud-avatar" title="Level ${gameState.level}">${monsterSVG(avatar, { size: 48 })}<span class="hud-level-badge">${gameState.level}</span></div>
      <nav class="hud-nav">
        ${nav
          .map(
            (n) =>
              `<button class="hud-btn ${activeScreen === n.id ? "is-active" : ""}" data-nav="${n.id}"><span class="hud-btn-icon">${n.icon}</span><span class="hud-btn-label">${n.label}</span></button>`
          )
          .join("")}
      </nav>
      <div class="hud-stats">
        <button class="hud-theme-toggle" id="themeToggle" title="Toggle dark mode">${gameState.darkMode ? "☀️" : "🌙"}</button>
        <span class="hud-stat" title="Stars">⭐ ${gameState.totalStars}</span>
        <span class="hud-stat" title="Coins">🪙 ${gameState.coins}</span>
      </div>
    </header>
  `;
}

export function wireHud(root, navigate) {
  root.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
  const themeBtn = root.querySelector("#themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = !gameState.darkMode;
      gameState.setDarkMode(next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      themeBtn.textContent = next ? "☀️" : "🌙";
    });
  }
}
