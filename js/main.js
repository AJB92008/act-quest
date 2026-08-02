import { gameState } from "./state.js";
import { renderWorldMap } from "./ui/worldMap.js";
import { renderIsland } from "./ui/island.js";
import { renderQuiz } from "./ui/quiz.js";
import { renderShop } from "./ui/shop.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderAvatarCreator } from "./ui/avatarCreator.js";
import { renderBackgroundLesson } from "./ui/background.js";
import { renderBackgroundQuiz } from "./ui/backgroundQuiz.js";

const root = document.getElementById("app");

const SCREENS = {
  map: (r, nav) => renderWorldMap(r, nav),
  island: (r, nav, params) => renderIsland(r, nav, params),
  quiz: (r, nav, params) => renderQuiz(r, nav, params),
  shop: (r, nav) => renderShop(r, nav),
  dashboard: (r, nav) => renderDashboard(r, nav),
  avatarCreator: (r, nav, params) => renderAvatarCreator(r, nav, params),
  background: (r, nav, params) => renderBackgroundLesson(r, nav, params),
  backgroundQuiz: (r, nav, params) => renderBackgroundQuiz(r, nav, params),
};

function navigate(screen, params = {}) {
  window.scrollTo(0, 0);
  const renderFn = SCREENS[screen];
  renderFn(root, navigate, params);
}

if (!gameState.data.onboarded) {
  navigate("avatarCreator", { onboarding: true });
} else {
  navigate("map");
}
