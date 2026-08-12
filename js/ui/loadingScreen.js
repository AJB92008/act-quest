import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

// A brief placeholder shown while a subject's question bank (lazy-loaded
// per subject — see preloadSubject() in data/questions/index.js) is still
// being fetched. In practice this almost never renders long enough to
// notice, since the island/map screens already kick that fetch off in the
// background before the player clicks into a lesson; it exists so a very
// fast click or a slow connection has something better than a blank screen
// to show rather than crashing on missing data.
export function renderLoadingScreen(root, { subject, navigate } = {}) {
  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen loading-screen" ${subject ? `style="--island-color:${subject.color};--island-bg:${subject.bg}"` : ""}>
      <div class="lesson-card">
        <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
        <p class="loading-text">Loading questions…</p>
      </div>
    </main>
  `;
  if (navigate) wireHud(root, navigate);
}
