import { gameState } from "../state.js";
import { monsterSVG } from "./monster.js";
import { showDevPanel, toggleDevPanel } from "./devPanel.js";
import { getCloudStatus, onCloudSyncChange, signOutCloud } from "../cloudSync.js";

const DEV_MODE_CLICKS = 10;
const DEV_MODE_WINDOW_MS = 5000;
// Module-level (not per-render) so rapid clicks on the theme toggle keep
// counting across the innerHTML rebuilds that every navigate() triggers.
let toggleClickTimestamps = [];

function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "dev-mode-toast";
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
  const nav = [
    { id: "map", icon: "🗺️", label: "Map" },
    { id: "endless", icon: "🔁", label: "Endless" },
    { id: "dashboard", icon: "📊", label: "Progress" },
    { id: "shop", icon: "🛍️", label: "Shop" },
    { id: "avatarCreator", icon: "🐲", label: "Monster" },
  ];
  return `
    <header class="hud">
      <div class="hud-avatar" title="Level ${gameState.level} · ${gameState.getEvolutionStageName()} · ${Math.round(gameState.getMasteryPct() * 100)}% mastery">${monsterSVG(avatar, { size: 59 })}<span class="hud-level-badge">${gameState.level}</span></div>
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
        <span data-hud-account></span>
      </div>
    </header>
  `;
}

// The account/logout button depends on async cloud-auth state that isn't
// known yet at initial HUD render, and can change while the player stays
// on the same screen (e.g. signing out from a different tab) — so it
// re-renders itself in place via onCloudSyncChange rather than being baked
// into hudHTML's one-shot string, the same self-updating pattern used by
// the dashboard's Cloud Account card and the auth gate.
function hudAccountHTML() {
  const status = getCloudStatus();
  if (!status.signedIn) return "";
  return `<button class="hud-logout-btn" id="hudLogoutBtn" title="Signed in as ${status.email} — log out" aria-label="Log out of ${status.email}">🚪</button>`;
}

function wireHudAccount(root) {
  const container = root.querySelector("[data-hud-account]");
  if (!container) return;
  const render = () => {
    if (!container.isConnected) {
      unsubscribe();
      return;
    }
    container.innerHTML = hudAccountHTML();
    const logoutBtn = container.querySelector("#hudLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Log out? This device keeps backing up progress anonymously, but you'll need to sign in again to reach this account from elsewhere.")) {
          signOutCloud();
        }
      });
    }
  };
  const unsubscribe = onCloudSyncChange(render);
  render();
}

export function wireHud(root, navigate) {
  root.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
  wireHudAccount(root);
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
