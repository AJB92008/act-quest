// Developer mode: unlocked by tapping the dark/light toggle 10 times within
// 5 seconds (see hud.js). Not part of normal gameplay — every control here
// edits the save directly, for fast manual testing rather than playing
// through the real progression to reach a given state.
import { SUBJECTS } from "../data/skills.js";
import { SCIENCE_BACKGROUND } from "../data/scienceBackground.js";
import { VOCABULARY } from "../data/vocabulary.js";
import { gameState, EVOLUTION_STAGE_NAMES } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

const firstBgTopic = SCIENCE_BACKGROUND.sections[0].topics[0];
const firstVocabTopic = VOCABULARY.sections[0].topics[0];
const firstEnglishSkillId = SUBJECTS.find((s) => s.id === "english").skills[0].id;

const JUMPS = [
  { label: "World Map", screen: "map" },
  ...SUBJECTS.map((s) => ({ label: `Island: ${s.name}`, screen: "island", params: { subjectId: s.id } })),
  { label: "Skill Path (English #1)", screen: "skillPath", params: { skillId: firstEnglishSkillId, subjectId: "english" } },
  { label: "Quiz (English #1, Lesson 1)", screen: "quiz", params: { skillId: firstEnglishSkillId, subjectId: "english", lessonIndex: 0 } },
  ...SUBJECTS.map((s) => ({ label: `Boss Quiz: ${s.name}`, screen: "bossQuiz", params: { subjectId: s.id } })),
  { label: "Weak Skill Review", screen: "weakReview" },
  { label: "Shop", screen: "shop" },
  { label: "Progress Dashboard", screen: "dashboard" },
  { label: "Avatar Creator", screen: "avatarCreator" },
  { label: "Science Background", screen: "background", params: { subjectId: "science" } },
  {
    label: "Background Quiz",
    screen: "backgroundQuiz",
    params: { topicId: firstBgTopic.id, topicTitle: firstBgTopic.title, subjectId: "science" },
  },
  { label: "Vocabulary Builder", screen: "vocabulary" },
  { label: "Vocab Quiz", screen: "vocabQuiz", params: { topicId: firstVocabTopic.id, topicTitle: firstVocabTopic.title } },
  { label: "Endless Mode", screen: "endless" },
  { label: "Practice Test", screen: "practiceTest" },
];

export function renderDevMode(root, navigate) {
  function render() {
    const levelProgress = gameState.getLevelProgress();
    const stage = gameState.getEvolutionStage();
    const masteryPct = Math.round(gameState.getMasteryPct() * 100);
    const predicted = gameState.getPredictedScore();

    const summaryHTML = `
      <div class="dev-summary">
        <span>Level ${levelProgress.level} (${gameState.xp} xp)</span>
        <span>${EVOLUTION_STAGE_NAMES[stage]} form (${masteryPct}% mastery)</span>
        <span>Predicted score: ${predicted.score ?? "?"}</span>
        <span>🪙 ${gameState.coins} &nbsp; ⭐ ${gameState.totalStars}</span>
      </div>
    `;

    const masterySubjectRows = SUBJECTS.map(
      (s) => `
        <button class="dev-btn" data-master-subject="${s.id}">Master ${s.name}</button>
        <button class="dev-btn dev-btn-quiet" data-unmaster-subject="${s.id}">Reset ${s.name}</button>
      `
    ).join("");

    const bossRows = SUBJECTS.map(
      (s) => `
        <button class="dev-btn" data-boss-clear="${s.id}">Clear ${s.name} Boss</button>
        <button class="dev-btn dev-btn-quiet" data-boss-unclear="${s.id}">Unclear ${s.name} Boss</button>
      `
    ).join("");

    const jumpButtons = JUMPS.map((j, i) => `<button class="dev-btn" data-jump="${i}">${j.label}</button>`).join("");

    root.innerHTML = `
      ${hudHTML("devMode")}
      <main class="screen dev-mode-screen">
        <button class="back-btn" data-back>&larr; Back to Map</button>
        <h1>🛠️ Developer Mode</h1>
        <p class="dev-mode-subtitle">Unlocked via secret tap sequence on the theme toggle. Everything below edits your save directly — for testing, not gameplay.</p>
        ${summaryHTML}

        <section class="dev-panel">
          <h2>Cheat Panel</h2>
          <h3>Currency &amp; XP</h3>
          <div class="dev-cheat-row">
            <button class="dev-btn" data-cheat="coins-100">+100 🪙</button>
            <button class="dev-btn" data-cheat="coins-1000">+1000 🪙</button>
            <button class="dev-btn" data-cheat="stars-100">+100 ⭐</button>
            <button class="dev-btn" data-cheat="stars-1000">+1000 ⭐</button>
            <button class="dev-btn" data-cheat="xp-500">+500 XP</button>
            <button class="dev-btn" data-cheat="xp-5000">+5000 XP</button>
          </div>
          <h3>Overall Mastery / Evolution Stage</h3>
          <div class="dev-cheat-row">
            <button class="dev-btn" data-mastery="0">0%</button>
            <button class="dev-btn" data-mastery="0.25">25%</button>
            <button class="dev-btn" data-mastery="0.5">50%</button>
            <button class="dev-btn" data-mastery="0.75">75%</button>
            <button class="dev-btn" data-mastery="1">100%</button>
          </div>
          <h3>Master / Reset a Subject's Skills</h3>
          <div class="dev-cheat-row">${masterySubjectRows}</div>
          <h3>Boss Quizzes</h3>
          <div class="dev-cheat-row">${bossRows}</div>
        </section>

        <section class="dev-panel">
          <h2>Screen Jumper</h2>
          <div class="dev-cheat-row">${jumpButtons}</div>
        </section>

        <section class="dev-panel">
          <h2>Reset / Seed Tools</h2>
          <div class="dev-cheat-row">
            <button class="dev-btn" data-seed-random>🎲 Seed Random Progress</button>
            <button class="dev-btn dev-btn-quiet" data-reset-all>Reset All Progress</button>
          </div>
        </section>

        <section class="dev-panel">
          <h2>State Inspector <button class="dev-btn dev-btn-quiet" data-refresh-state>🔄 Refresh</button></h2>
          <pre class="dev-state-dump" id="stateDump">${JSON.stringify(gameState.data, null, 2)}</pre>
        </section>
      </main>
    `;

    wireHud(root, navigate);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("map"));

    root.querySelectorAll("[data-cheat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [kind, amountStr] = btn.dataset.cheat.split("-");
        const amount = Number(amountStr);
        if (kind === "coins") gameState.cheatAddCoins(amount);
        else if (kind === "stars") gameState.cheatAddStars(amount);
        else if (kind === "xp") gameState.cheatAddXp(amount);
        render();
      });
    });

    root.querySelectorAll("[data-mastery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.cheatSetOverallMasteryPct(Number(btn.dataset.mastery));
        render();
      });
    });

    root.querySelectorAll("[data-master-subject]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.cheatSetSubjectMastered(btn.dataset.masterSubject, true);
        render();
      });
    });
    root.querySelectorAll("[data-unmaster-subject]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.cheatSetSubjectMastered(btn.dataset.unmasterSubject, false);
        render();
      });
    });

    root.querySelectorAll("[data-boss-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.cheatSetBossCleared(btn.dataset.bossClear, true);
        render();
      });
    });
    root.querySelectorAll("[data-boss-unclear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.cheatSetBossCleared(btn.dataset.bossUnclear, false);
        render();
      });
    });

    root.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const jump = JUMPS[Number(btn.dataset.jump)];
        navigate(jump.screen, jump.params || {});
      });
    });

    root.querySelector("[data-seed-random]").addEventListener("click", () => {
      gameState.cheatSeedRandomProgress();
      render();
    });

    root.querySelector("[data-reset-all]").addEventListener("click", () => {
      if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
        gameState.reset();
        navigate("avatarCreator", { onboarding: true });
      }
    });

    root.querySelector("[data-refresh-state]").addEventListener("click", () => {
      root.querySelector("#stateDump").textContent = JSON.stringify(gameState.data, null, 2);
    });
  }

  render();
}
