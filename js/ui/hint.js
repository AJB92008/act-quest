// Shared hint UI for quiz screens: spend coins to eliminate one wrong
// choice. One hint per question, and it disappears once the question is
// answered (nothing left to hint about).
import { gameState } from "../state.js";

export const HINT_COST = 10;

export function renderHintButton() {
  const affordable = gameState.coins >= HINT_COST;
  return `
    <button class="hint-btn" id="hintBtn" ${affordable ? "" : "disabled"}
      title="${affordable ? "Eliminate one wrong answer" : "Not enough coins"}">
      💡 Hint (${HINT_COST}🪙)
    </button>
  `;
}

// Wires the hint button for the current question. Call once per question
// render, after the choice buttons exist in the DOM.
export function wireHintButton(root, question) {
  const btn = root.querySelector("#hintBtn");
  if (!btn) return;
  btn.addEventListener(
    "click",
    () => {
      if (!gameState.spendCoins(HINT_COST)) return;
      const wrongBtns = Array.from(root.querySelectorAll("[data-choice]")).filter(
        (b) => Number(b.dataset.choice) !== question.answer && !b.disabled
      );
      if (wrongBtns.length > 0) {
        const target = wrongBtns[Math.floor(Math.random() * wrongBtns.length)];
        target.classList.add("is-eliminated");
        target.disabled = true;
      }
      btn.remove();
      const coinStat = document.querySelector('.hud-stat[title="Coins"]');
      if (coinStat) coinStat.textContent = `🪙 ${gameState.coins}`;
    },
    { once: true }
  );
}

// Called when a question gets answered (any way — click or timeout) so a
// leftover hint button can't be clicked after the fact.
export function removeHintButton(root) {
  root.querySelector("#hintBtn")?.remove();
}
