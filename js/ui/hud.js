import { gameState } from "../state.js";
import { monsterSVG } from "./monster.js";
import { showDevPanel, toggleDevPanel } from "./devPanel.js";

const DEV_MODE_CLICKS = 10;
const DEV_MODE_WINDOW_MS = 5000;
// Module-level (not per-render) so rapid clicks on the theme toggle keep
// counting across the innerHTML rebuilds that every navigate() triggers.
let toggleClickTimestamps = [];

// A brief bottom-center pill notification. Started as dev-mode-unlock-only
// but the visual (and the "briefly interrupt, then get out of the way"
// behavior) is generic enough to reuse anywhere a screen needs a one-off
// heads-up without a full modal — the Practice Test's 5-minute/1-minute
// time warnings, for one.
export function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function registerThemeToggleClick(navigate) {
  const now = Date.now();
  toggleClickTimestamps.push(now);
  toggleClickTimestamps = toggleClickTimestamps.filter((t) => now - t <= DEV_MODE_WINDOW_MS);
  if (toggleClickTimestamps.length < DEV_MODE_CLICKS) return;
  toggleClickTimestamps = [];
  if (!gameState.devModeUnlocked) {
    gameState.setDevModeUnlocked(true);
    showToast("🛠️ Developer Mode unlocked!");
    showDevPanel(navigate);
  } else {
    toggleDevPanel(navigate);
  }
}

export function hudHTML(activeScreen) {
  const avatar = gameState.getDisplayAvatar();
  // Stats and account access live behind the avatar button (data-nav
  // wires it up the same as any other nav button, see wireHud below) —
  // "Progress" isn't a separate top-level nav item, and there's no
  // standalone logout shortcut either; the dashboard's own Cloud Account
  // card is the one place to sign in/out.
  const nav = [
    { id: "map", icon: "🗺️", label: "Map" },
    { id: "endless", icon: "🔁", label: "Endless" },
    { id: "shop", icon: "🛍️", label: "Shop" },
    { id: "avatarCreator", icon: "🐲", label: "Monster" },
  ];
  return `
    <header class="hud">
      <button type="button" class="hud-avatar ${activeScreen === "dashboard" ? "is-active" : ""}" data-nav="dashboard" title="Level ${gameState.level} · ${gameState.getEvolutionStageName()} · ${Math.round(gameState.getMasteryPct() * 100)}% mastery" aria-label="View progress, stats, and account">${monsterSVG(avatar, { size: 59 })}<span class="hud-level-badge">${gameState.level}</span></button>
      <nav class="hud-nav">
        ${nav
          .map(
            (n) =>
              `<button class="hud-btn ${activeScreen === n.id ? "is-active" : ""}" data-nav="${n.id}"><span class="hud-btn-icon">${n.icon}</span><span class="hud-btn-label">${n.label}</span></button>`
          )
          .join("")}
        ${
          gameState.devModeUnlocked
            ? `<button class="hud-btn" id="devToggleBtn"><span class="hud-btn-icon">🛠️</span><span class="hud-btn-label">Dev</span></button>`
            : ""
        }
      </nav>
      <div class="hud-stats">
        <button class="hud-theme-toggle" id="themeToggle" title="Toggle dark mode" aria-label="${gameState.darkMode ? "Switch to light mode" : "Switch to dark mode"}">${gameState.darkMode ? "☀️" : "🌙"}</button>
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
  const devToggleBtn = root.querySelector("#devToggleBtn");
  if (devToggleBtn) {
    devToggleBtn.addEventListener("click", () => toggleDevPanel(navigate));
  }
  const themeBtn = root.querySelector("#themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = !gameState.darkMode;
      gameState.setDarkMode(next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      themeBtn.textContent = next ? "☀️" : "🌙";
      registerThemeToggleClick(navigate);
    });
  }
}
