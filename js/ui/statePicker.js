// State Assessments' own planet-picker: unlike ACT/SAT/PSAT, this solar
// system's planets are the 50 US states themselves, not a fixed subject
// list (see data/tests.js's own comment on why) — so instead of the usual
// World Map, the player rides a rocket to whichever state-planet they
// live in. worldMap.js redirects here whenever someone reaches testId
// "stateAssessments" with no gameState.homeState set yet; picking one
// saves it and sends them back to the map, which then renders that
// state's own two islands.
//
// The picker itself (the card holding the <select> + Continue button) is
// unchanged from a plain centered form — the rocket is purely decorative
// scaffolding built around it (see .rocket-wrap/.rocket-* in style.css),
// not a restructuring of the actual picker UI.
import { STATES } from "../data/stateTests.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

const ACCENT_COLOR = "#3d8f5f";
const ACCENT_COLOR_DARK = "#296b44";
const ACCENT_BG = "#e9f6ee";

export function renderStatePicker(root, navigate, { returnTo = "map" } = {}) {
  const options = STATES.map((s) => `<option value="${s.abbr}">${s.name}</option>`).join("");

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen practice-test-screen" style="--island-color:${ACCENT_COLOR};--island-bg:${ACCENT_BG}">
      <button class="back-btn" data-back>&larr; Galaxy</button>
      <h1 class="map-title">🚀 Which planet do you want to fly to?</h1>
      <p class="map-subtitle">Every state mandates its own standardized tests — hop in and pick yours.</p>
      <div class="rocket-wrap" style="--island-color:${ACCENT_COLOR};--island-color-dark:${ACCENT_COLOR_DARK}">
        <div class="rocket-graphic" aria-hidden="true">
          <div class="rocket-nose"></div>
          <div class="rocket-window-ring"></div>
          <div class="rocket-fin rocket-fin-left"></div>
          <div class="rocket-fin rocket-fin-right"></div>
          <div class="rocket-flame"></div>
        </div>
        <div class="lesson-card rocket-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <p class="lesson-blurb">Pick your state and Terravale will show what's planned for it.</p>
          <label class="study-plan-field" style="max-width:320px;margin:20px auto;text-align:left;">
            <span>State</span>
            <select id="stateSelect">
              <option value="" disabled selected>Choose a state…</option>
              ${options}
            </select>
          </label>
          <button class="btn-primary lesson-start-btn" id="continueBtn" disabled>Launch &rarr;</button>
        </div>
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
