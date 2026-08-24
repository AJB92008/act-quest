import { gameState } from "./state.js";
import { initCloudSync } from "./cloudSync.js";
import { renderSolarSystem } from "./ui/solarSystem.js";
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
import { renderStatePicker } from "./ui/statePicker.js";
import { renderTiktokMode } from "./ui/tiktokMode.js";
import { ensureDevPanel } from "./ui/devPanel.js";
import { runDevBootstrap } from "./devBootstrap.js";

const root = document.getElementById("app");

const SCREENS = {
  solarSystem: (r, nav) => renderSolarSystem(r, nav),
  map: (r, nav, params) => renderWorldMap(r, nav, params),
  island: (r, nav, params) => renderIsland(r, nav, params),
  skillPath: (r, nav, params) => renderSkillPath(r, nav, params),
  quiz: (r, nav, params) => renderQuiz(r, nav, params),
  bossQuiz: (r, nav, params) => renderBossQuiz(r, nav, params),
  weakReview: (r, nav, params) => renderWeakReview(r, nav, params),
  adaptivePractice: (r, nav, params) => renderAdaptivePractice(r, nav, params),
  diagnostic: (r, nav, params) => renderDiagnostic(r, nav, params),
  reviewQueue: (r, nav, params) => renderReviewQueue(r, nav, params),
  drillBuilder: (r, nav, params) => renderDrillBuilder(r, nav, params),
  studyPlan: (r, nav) => renderStudyPlan(r, nav),
  shop: (r, nav) => renderShop(r, nav),
  dashboard: (r, nav, params) => renderDashboard(r, nav, params),
  achievements: (r, nav) => renderAchievements(r, nav),
  avatarCreator: (r, nav, params) => renderAvatarCreator(r, nav, params),
  authGate: (r, nav) => renderAuthGate(r, nav),
  background: (r, nav, params) => renderBackgroundLesson(r, nav, params),
  backgroundQuiz: (r, nav, params) => renderBackgroundQuiz(r, nav, params),
  vocabulary: (r, nav) => renderVocabulary(r, nav),
  vocabQuiz: (r, nav, params) => renderVocabQuiz(r, nav, params),
  endless: (r, nav, params) => renderEndlessMode(r, nav, params),
  practiceTest: (r, nav, params) => renderPracticeTest(r, nav, params),
  essay: (r, nav, params) => renderEssay(r, nav, params),
  mistakeJournal: (r, nav) => renderMistakeJournal(r, nav),
  scoreReport: (r, nav) => renderScoreReport(r, nav),
  statePicker: (r, nav, params) => renderStatePicker(r, nav, params),
  tiktokMode: (r, nav, params) => renderTiktokMode(r, nav, params),
};

// Every screen swap replaces `root`'s entire innerHTML — invisible to
// assistive tech by default, unlike a real page load or a History-API
// route change most AT already knows how to announce. Fixed once here
// rather than in each of the 30+ screen files: shift focus to the new
// screen's own <main> landmark (so keyboard/AT focus lands somewhere
// sane instead of staying on a button that no longer exists), and update
// a visually-hidden aria-live region with that screen's heading so it
// gets spoken even if focus-shift alone doesn't trigger an announcement
// in a given AT/browser combination.
function announceRouteChange() {
  const main = root.querySelector("main");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
  }
  const announcer = document.getElementById("route-announcer");
  if (announcer) {
    const heading = root.querySelector("h1, h2")?.textContent?.trim();
    announcer.textContent = heading || "Page updated";
  }
}

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
    announceRouteChange();
    return;
  }
  renderFn(root, navigate, params);
  announceRouteChange();
}

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
