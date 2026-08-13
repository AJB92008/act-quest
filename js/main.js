import { gameState } from "./state.js";
import { renderWorldMap } from "./ui/worldMap.js";
import { renderIsland } from "./ui/island.js";
import { renderSkillPath } from "./ui/skillPath.js";
import { renderQuiz } from "./ui/quiz.js";
import { renderBossQuiz } from "./ui/bossQuiz.js";
import { renderWeakReview } from "./ui/weakReview.js";
import { renderReviewQueue } from "./ui/reviewQueue.js";
import { renderDrillBuilder } from "./ui/drillBuilder.js";
import { renderStudyPlan } from "./ui/studyPlan.js";
import { renderShop } from "./ui/shop.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderAchievements } from "./ui/achievements.js";
import { renderAvatarCreator } from "./ui/avatarCreator.js";
import { renderBackgroundLesson } from "./ui/background.js";
import { renderBackgroundQuiz } from "./ui/backgroundQuiz.js";
import { renderVocabulary } from "./ui/vocabulary.js";
import { renderVocabQuiz } from "./ui/vocabQuiz.js";
import { renderEndlessMode } from "./ui/endlessMode.js";
import { renderPracticeTest } from "./ui/practiceTest.js";
import { ensureDevPanel } from "./ui/devPanel.js";
import { runDevBootstrap } from "./devBootstrap.js";

const root = document.getElementById("app");

const SCREENS = {
  map: (r, nav) => renderWorldMap(r, nav),
  island: (r, nav, params) => renderIsland(r, nav, params),
  skillPath: (r, nav, params) => renderSkillPath(r, nav, params),
  quiz: (r, nav, params) => renderQuiz(r, nav, params),
  bossQuiz: (r, nav, params) => renderBossQuiz(r, nav, params),
  weakReview: (r, nav) => renderWeakReview(r, nav),
  reviewQueue: (r, nav) => renderReviewQueue(r, nav),
  drillBuilder: (r, nav) => renderDrillBuilder(r, nav),
  studyPlan: (r, nav) => renderStudyPlan(r, nav),
  shop: (r, nav) => renderShop(r, nav),
  dashboard: (r, nav) => renderDashboard(r, nav),
  achievements: (r, nav) => renderAchievements(r, nav),
  avatarCreator: (r, nav, params) => renderAvatarCreator(r, nav, params),
  background: (r, nav, params) => renderBackgroundLesson(r, nav, params),
  backgroundQuiz: (r, nav, params) => renderBackgroundQuiz(r, nav, params),
  vocabulary: (r, nav) => renderVocabulary(r, nav),
  vocabQuiz: (r, nav, params) => renderVocabQuiz(r, nav, params),
  endless: (r, nav) => renderEndlessMode(r, nav),
  practiceTest: (r, nav) => renderPracticeTest(r, nav),
};

function navigate(screen, params = {}) {
  window.scrollTo(0, 0);
  const renderFn = SCREENS[screen];
  if (!renderFn) {
    // An unrecognized screen name (a typo in a navigate() call, or a bad
    // `?dev=1&screen=...` value) used to hard-crash into a blank page —
    // fall back to the map instead, with a clear pointer in the console
    // for whoever's debugging it.
    console.warn(`navigate(): unknown screen "${screen}", falling back to "map"`);
    SCREENS.map(root, navigate, {});
    return;
  }
  renderFn(root, navigate, params);
}

document.documentElement.dataset.theme = gameState.darkMode ? "dark" : "light";

const devTarget = runDevBootstrap(gameState);
if (devTarget) {
  navigate(devTarget.screen, devTarget.params);
} else if (!gameState.data.onboarded) {
  navigate("avatarCreator", { onboarding: true });
} else {
  navigate("map");
}

// If dev mode was unlocked in a previous session, the floating panel
// should already be there on load rather than waiting for another unlock
// tap sequence.
ensureDevPanel(navigate);
