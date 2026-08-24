// The dispatch table for every skill with its own zoomed-in lesson-path
// terrain (see lessonTerrain.js for the shared engine they all render
// through, and js/ui/lessonThemes/ for each skill's own "skin" — a
// distinct composition, not a recolor of another one). Each skill's own
// look is meant to match where its node actually sits on Wordwood Isle's
// own map (all of these currently sit in the same green forest zone, so
// each one leans on a different nature metaphor for its own grammar
// concept instead of repeating the same woodland look): Idiom Instinct
// gets open plains with a river, Phrase Finder gets dense jungle, Fix
// the Fracture gets a canyon split by a literal crack, In Formation gets
// an orchard planted in strict rows (parallel structure), Modifier
// Mix-Up gets a tangled bramble thicket (misplaced modifiers), and Stay
// on Topic gets a wide-open, uncluttered clearing with an unusually
// direct trail (staying on topic, not wandering), and Writer's Goal gets
// a misty swamp crossed by a built wooden boardwalk (a clear, deliberate
// path laid straight through otherwise murky terrain). Add a new skill
// here (plus one line in skillPath.js's dispatch) rather than writing a
// whole new file — that's the point of the shared engine.
import { renderLessonTerrainPath } from "./lessonTerrain.js";
import { plainsTheme } from "./lessonThemes/plains.js";
import { jungleTheme } from "./lessonThemes/jungle.js";
import { canyonTheme } from "./lessonThemes/canyon.js";
import { orchardTheme } from "./lessonThemes/orchard.js";
import { brambleTheme } from "./lessonThemes/bramble.js";
import { overlookTheme } from "./lessonThemes/overlook.js";
import { swampTheme } from "./lessonThemes/swamp.js";

export const LESSON_THEMES = {
  "en-idioms": plainsTheme,
  "en-verbalphrases": jungleTheme,
  "en-fragments": canyonTheme,
  "en-parallel": orchardTheme,
  "en-modifiers": brambleTheme,
  "en-relevance": overlookTheme,
  "en-authorintent": swampTheme,
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
