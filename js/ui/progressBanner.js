// Shared "something big just happened" banners for results screens: a
// monster level-up (from the xp/level system, tracked separately from
// stars) and a monster evolution (body shape shift tied to overall mastery
// %). Any reward-recording gameState method that can trigger these returns
// `leveledUp`/`newLevel` and/or `justEvolved`/`evolutionStage` — this just
// turns that into consistent markup wherever it's shown.
import { EVOLUTION_STAGE_NAMES } from "../state.js";

export function renderProgressBanners({ leveledUp, newLevel, justEvolved, evolutionStage } = {}) {
  let out = "";
  if (justEvolved) {
    const name = EVOLUTION_STAGE_NAMES[evolutionStage] ?? "";
    out += `<p class="results-flag results-flag-evolve">🌟 Your monster evolved into its <strong>${name}</strong> form!</p>`;
  }
  if (leveledUp) {
    out += `<p class="results-flag results-flag-levelup">⬆️ Level Up! Your monster reached <strong>Level ${newLevel}</strong>.</p>`;
  }
  return out;
}
