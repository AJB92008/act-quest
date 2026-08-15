import { gameState } from "./state.js";
import { initCloudSync } from "./cloudSync.js";
import { renderWorldMap } from "./ui/worldMap.js";
import { renderIsland } from "./ui/island.js";
import { renderSkillPath } from "./ui/skillPath.js";
import { renderQuiz } from "./ui/quiz.js";
import { renderBossQuiz } from "./ui/bossQuiz.js";
import { renderWeakReview } from "./ui/weakReview.js";
import { renderAdaptivePractice } from "./ui/adaptivePractice.js";
import { renderDiagnostic } from "./ui/diagnostic.js";
import { renderReviewQueue } from "./ui/reviewQueue.js";
import { renderDrillBuilder } from "./ui/drillBuilder.js";
import { renderStudyPlan } from "./ui/studyPlan.js";
import { renderShop } from "./ui/shop.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderAchievements } from "./ui/achievements.js";
import { renderAvatarCreator } from "./ui/avatarCreator.js";
import { renderAuthGate } from "./ui/authGate.js";
import { renderBackgroundLesson } from "./ui/background.js";
import { renderBackgroundQuiz } from "./ui/backgroundQuiz.js";
import { renderVocabulary } from "./ui/vocabulary.js";
import { renderVocabQuiz } from "./ui/vocabQuiz.js";
import { renderEndlessMode } from "./ui/endlessMode.js";
import { renderPracticeTest } from "./ui/practiceTest.js";
import { renderEssay } from "./ui/essay.js";
import { renderMistakeJournal } from "./ui/mistakeJournal.js";
import { renderScoreReport, renderSharedReport } from "./ui/scoreReport.js";
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
  adaptivePractice: (r, nav) => renderAdaptivePractice(r, nav),
  diagnostic: (r, nav, params) => renderDiagnostic(r, nav, params),
  reviewQueue: (r, nav) => renderReviewQueue(r, nav),
  drillBuilder: (r, nav) => renderDrillBuilder(r, nav),
  studyPlan: (r, nav) => renderStudyPlan(r, nav),
  shop: (r, nav) => renderShop(r, nav),
  dashboard: (r, nav) => renderDashboard(r, nav),
  achievements: (r, nav) => renderAchievements(r, nav),
  avatarCreator: (r, nav, params) => renderAvatarCreator(r, nav, params),
  authGate: (r, nav) => renderAuthGate(r, nav),
  background: (r, nav, params) => renderBackgroundLesson(r, nav, params),
  backgroundQuiz: (r, nav, params) => renderBackgroundQuiz(r, nav, params),
  vocabulary: (r, nav) => renderVocabulary(r, nav),
  vocabQuiz: (r, nav, params) => renderVocabQuiz(r, nav, params),
  endless: (r, nav) => renderEndlessMode(r, nav),
  practiceTest: (r, nav) => renderPracticeTest(r, nav),
  essay: (r, nav, params) => renderEssay(r, nav, params),
  mistakeJournal: (r, nav) => renderMistakeJournal(r, nav),
  scoreReport: (r, nav) => renderScoreReport(r, nav),
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

// A `?report=<encoded>` link (see ui/scoreReport.js's "Copy Share Link")
// is a self-contained, read-only view of *someone else's* score snapshot
// — it needs no save data, no auth, no cloud sync, and must work even for
// a visitor with nothing stored on this device/browser, so it's checked
// before any of that spins up and short-circuits the entire rest of
// bootstrap when present.
const reportParam = new URLSearchParams(location.search).get("report");
if (reportParam) {
  renderSharedReport(root, reportParam);
} else {
  initCloudSync();

  const devTarget = runDevBootstrap(gameState);
  if (devTarget) {
    navigate(devTarget.screen, devTarget.params);
  } else if (!gameState.data.onboarded) {
    // Account creation (or an explicit "skip for now") gates onboarding —
    // see ui/authGate.js. Once onboarded flips true, this branch is never
    // reached again for this save, so returning players go straight to the
    // map without re-prompting.
    navigate("authGate");
  } else {
    navigate("map");
  }

  // If dev mode was unlocked in a previous session, the floating panel
  // should already be there on load rather than waiting for another unlock
  // tap sequence.
  ensureDevPanel(navigate);
}
