// One-time gate for the State Assessments planet: unlike ACT/SAT/PSAT,
// "state testing" has no single fixed test — every state mandates its own
// program (see data/stateTests.js) — so the World Map can't show real
// islands for this planet until it knows which state the player lives in.
// worldMap.js redirects here whenever someone reaches testId
// "stateAssessments" with no gameState.homeState set yet; picking one
// saves it and sends them back to the map, which then renders that
// state's own two islands instead of this screen again.
import { STATES } from "../data/stateTests.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

const ACCENT_COLOR = "#3d8f5f";
const ACCENT_BG = "#e9f6ee";

export function renderStatePicker(root, navigate, { returnTo = "map" } = {}) {
  const options = STATES.map((s) => `<option value="${s.abbr}">${s.name}</option>`).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen practice-test-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
      <button class="back-btn" data-back>&larr; Solar System</button>
      <div class="lesson-card">
        <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
        <h1 class="lesson-title">🌍 Which state do you live in?</h1>
        <p class="lesson-blurb">Every state mandates its own standardized tests. Pick yours and Terravale will show what's planned for it.</p>
        <label class="study-plan-field" style="max-width:320px;margin:20px auto;text-align:left;">
          <span>State</span>
          <select id="stateSelect">
            <option value="" disabled selected>Choose a state…</option>
            ${options}
          </select>
        </label>
        <button class="btn-primary lesson-start-btn" id="continueBtn" disabled>Continue &rarr;</button>
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("solarSystem"));
  const select = root.querySelector("#stateSelect");
  const continueBtn = root.querySelector("#continueBtn");
  select.addEventListener("change", () => {
    continueBtn.disabled = !select.value;
  });
  continueBtn.addEventListener("click", () => {
    if (!select.value) return;
    gameState.setHomeState(select.value);
    navigate(returnTo, { testId: "stateAssessments" });
  });
}
