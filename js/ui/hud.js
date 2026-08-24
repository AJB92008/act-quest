import { gameState } from "../state.js";
import { monsterSVG } from "./monster.js";
import { toggleDevPanel } from "./devPanel.js";

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

export function hudHTML(activeScreen) {
  const avatar = gameState.getDisplayAvatar();
  // Stats and account access live behind the avatar button (data-nav
  // wires it up the same as any other nav button, see wireHud below) —
  // "Progress" isn't a separate top-level nav item, and there's no
  // standalone logout shortcut either; the dashboard's own Cloud Account
  // card is the one place to sign in/out.
  // One tab, not two: "Map" goes to the current planet's World Map, which
  // already has its own "← Solar System" link back up to the planet
  // picker (see worldMap.js) — no separate top-level "Planets" tab needed
  // for what's a rare action (switching planets) next to a frequent one
  // (getting back to where you're studying).
  const nav = [
    { id: "map", icon: "🗺️", label: "Map" },
    { id: "endless", icon: "🔁", label: "Endless" },
    { id: "shop", icon: "🛍️", label: "Shop" },
    { id: "avatarCreator", icon: "🐲", label: "Monster" },
  ];
  // The Solar System (planet picker) is a sub-screen of Map now, not its
  // own tab — still highlight "Map" while there instead of leaving the
  // whole nav looking unselected.
  const navActiveScreen = activeScreen === "solarSystem" ? "map" : activeScreen;
  return `
    <header class="hud">
      <button type="button" class="hud-avatar ${activeScreen === "dashboard" ? "is-active" : ""}" data-nav="dashboard" title="Level ${gameState.level} · ${gameState.getEvolutionStageName()} · ${Math.round(gameState.getMasteryPct() * 100)}% mastery" aria-label="View progress, stats, and account">${monsterSVG(avatar, { size: 59 })}<span class="hud-level-badge">${gameState.level}</span></button>
      <nav class="hud-nav">
        ${nav
          .map(
            (n) =>
              `<button class="hud-btn ${navActiveScreen === n.id ? "is-active" : ""}" data-nav="${n.id}"><span class="hud-btn-icon">${n.icon}</span><span class="hud-btn-label">${n.label}</span></button>`
          )
          .join("")}
        ${
          gameState.devModeUnlocked
            ? `<button class="hud-btn" id="devToggleBtn"><span class="hud-btn-icon">🛠️</span><span class="hud-btn-label">Dev</span></button>`
            : ""
        }
      </nav>
      <div class="hud-stats">
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
}
