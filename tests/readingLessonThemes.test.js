// Regression tests for Athenaeum Reef's lesson-path terrain themes (see
// skillPathHub.js's own LESSON_THEMES map and js/ui/lessonThemes/ for
// each skill's bespoke scene). Two things worth protecting here: every
// Reading skill actually has a theme (so a future skill added to
// data/skills.js doesn't silently fall back to the plain generic path
// without anyone noticing), and every one of those themes actually
// renders a real SVG scene without throwing, across a range of lesson
// counts (a skill's bank size isn't fixed — see BANK_SIZE_OVERRIDES in
// data/questions/index.js — so a theme's own geometry has to hold up at
// more than just whatever count it happened to be eyeballed at).
import { GameState, gameState } from "../js/state.js";
import { SUBJECTS } from "../js/data/skills.js";
import { computeTrail, totalHeightFor } from "../js/ui/lessonTerrain.js";
import { LESSON_THEMES, renderThemedLessonPath } from "../js/ui/skillPathHub.js";
import { test, assertEqual, assertTrue } from "./assert.js";

function freshGameState() {
  localStorage.removeItem("act-quest-save-v1");
  const fresh = new GameState();
  fresh.data.onboarded = true;
  gameState.data = fresh.data;
  return gameState;
}

const READING_SKILL_IDS = SUBJECTS.find((s) => s.id === "reading").skills.map((s) => s.id);

test("every one of Reading's 10 skills has its own lesson-path theme", () => {
  assertEqual(READING_SKILL_IDS.length, 10);
  READING_SKILL_IDS.forEach((id) => {
    assertTrue(id in LESSON_THEMES, `expected a LESSON_THEMES entry for Reading skill "${id}"`);
  });
});

test("every Reading theme renders through the full screen (real lesson count from the actual question bank) without throwing", () => {
  READING_SKILL_IDS.forEach((skillId) => {
    freshGameState();
    const root = document.createElement("div");
    renderThemedLessonPath(root, () => {}, { skillId, subjectId: "reading" });
    const svg = root.querySelector(".lesson-terrain-svg");
    assertTrue(!!svg, `expected a rendered <svg> for skill "${skillId}"`);
    assertTrue((svg.getAttribute("viewBox") || "").length > 0, `expected a real viewBox for skill "${skillId}"`);
  });
});

// A skill's own bank size isn't fixed (see BANK_SIZE_OVERRIDES in
// data/questions/index.js — several skills already run well past the
// usual 20 lessons), so each theme's own geometry has to hold up at
// more than just whatever count the bank happens to be today. Calling
// renderScene directly (bypassing gameState/getLessonCount entirely)
// lets this test that across a spread of counts cheaply, real bank size
// notwithstanding.
test("every Reading theme's renderScene holds up across a spread of lesson counts (1, 5, 20, 28)", () => {
  READING_SKILL_IDS.forEach((skillId) => {
    const theme = LESSON_THEMES[skillId];
    [1, 5, 20, 28].forEach((count) => {
      const positions = computeTrail(count, theme.trailBand);
      const totalHeight = totalHeightFor(count);
      let svgString;
      try {
        svgString = theme.renderScene(positions, totalHeight, "The Reef Archivist");
      } catch (e) {
        throw new Error(`${skillId}'s theme threw at lesson count ${count}: ${e.message}`);
      }
      assertTrue(typeof svgString === "string" && svgString.includes("<svg"), `expected "${skillId}" to render a real <svg> at lesson count ${count}`);
    });
  });
});

test("each Coral Stacks / Driftwood Cove / Tide Pool / Lighthouse / Sunken Archive theme is visually distinct (no two Reading skills share a theme object)", () => {
  const themeObjects = READING_SKILL_IDS.map((id) => LESSON_THEMES[id]);
  const uniqueThemes = new Set(themeObjects);
  assertEqual(uniqueThemes.size, READING_SKILL_IDS.length, "expected every Reading skill to have its own distinct theme, not a shared/reused one");
});
