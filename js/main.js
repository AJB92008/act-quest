import { gameState } from "./state.js";
import { renderWorldMap } from "./ui/worldMap.js";
import { renderIsland } from "./ui/island.js";
import { renderSkillPath } from "./ui/skillPath.js";
import { renderQuiz } from "./ui/quiz.js";
import { renderBossQuiz } from "./ui/bossQuiz.js";
import { renderWeakReview } from "./ui/weakReview.js";
import { renderShop } from "./ui/shop.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderAvatarCreator } from "./ui/avatarCreator.js";
import { renderBackgroundLesson } from "./ui/background.js";
import { renderBackgroundQuiz } from "./ui/backgroundQuiz.js";
import { renderVocabulary } from "./ui/vocabulary.js";
import { renderVocabQuiz } from "./ui/vocabQuiz.js";
import { renderEndlessMode } from "./ui/endlessMode.js";

const root = document.getElementById("app");

const SCREENS = {
  map: (r, nav) => renderWorldMap(r, nav),
  island: (r, nav, params) => renderIsland(r, nav, params),
  skillPath: (r, nav, params) => renderSkillPath(r, nav, params),
  quiz: (r, nav, params) => renderQuiz(r, nav, params),
  bossQuiz: (r, nav, params) => renderBossQuiz(r, nav, params),
  weakReview: (r, nav) => renderWeakReview(r, nav),
  shop: (r, nav) => renderShop(r, nav),
  dashboard: (r, nav) => renderDashboard(r, nav),
  avatarCreator: (r, nav, params) => renderAvatarCreator(r, nav, params),
  background: (r, nav, params) => renderBackgroundLesson(r, nav, params),
  backgroundQuiz: (r, nav, params) => renderBackgroundQuiz(r, nav, params),
  vocabulary: (r, nav) => renderVocabulary(r, nav),
  vocabQuiz: (r, nav, params) => renderVocabQuiz(r, nav, params),
  endless: (r, nav) => renderEndlessMode(r, nav),
};

function navigate(screen, params = {}) {
  window.scrollTo(0, 0);
  const renderFn = SCREENS[screen];
  renderFn(root, navigate, params);
}

document.documentElement.dataset.theme = gameState.darkMode ? "dark" : "light";

if (!gameState.data.onboarded) {
  navigate("avatarCreator", { onboarding: true });
} else {
  navigate("map");
}
