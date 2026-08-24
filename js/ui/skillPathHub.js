// The dispatch table for every skill with its own zoomed-in lesson-path
// terrain (see lessonTerrain.js for the shared engine they all render
// through, and js/ui/lessonThemes/ for each skill's own "skin" — a
// distinct composition, not a recolor of another one). Each skill's own
// look is meant to match where its node actually sits on Wordwood Isle's
// own map. The forest zone: Idiom Instinct gets open plains with a
// river, Phrase Finder gets dense jungle, Fix the Fracture gets a canyon
// split by a literal crack, In Formation gets an orchard planted in
// strict rows (parallel structure), Modifier Mix-Up gets a tangled
// bramble thicket (misplaced modifiers), Stay on Topic gets a wide-open,
// uncluttered clearing with an unusually direct trail (staying on
// topic, not wandering), and Writer's Goal gets a misty swamp crossed by
// a built wooden boardwalk (a clear, deliberate path laid straight
// through otherwise murky terrain). The meadow zone: Comma Sense gets a
// composite scene, mountains giving way to plains with the trail
// crossing between (a comma's own brief pause between two things),
// Apostrophe Ally gets a plains scene built entirely from paired/twin
// features (ponds, hills, flowers — an "ally," always in twos),
// Semicolon Signal gets a plains scene centered on a windmill landmark
// with small signal flags along the trail, Colon Call gets a plains
// scene full of calling birds and a bell tower (a colon "calls out"
// what follows), Dash Dash gets a windswept prairie whose trail is
// drawn in long chunky dashes instead of dots, Full Stop gets its own
// hushed swamp variant with one still pool and a fully unbroken trail
// line (a period is one definitive stop), and Case Closed gets a sandy
// beach with swamp water along one edge and a washed-up suitcase (a
// literal "case"). Add a new skill here (plus one line in skillPath.js's
// dispatch) rather than writing a whole new file — that's the point of
// the shared engine.
import { renderLessonTerrainPath } from "./lessonTerrain.js";
import { plainsTheme } from "./lessonThemes/plains.js";
import { jungleTheme } from "./lessonThemes/jungle.js";
import { canyonTheme } from "./lessonThemes/canyon.js";
import { orchardTheme } from "./lessonThemes/orchard.js";
import { brambleTheme } from "./lessonThemes/bramble.js";
import { overlookTheme } from "./lessonThemes/overlook.js";
import { swampTheme } from "./lessonThemes/swamp.js";
import { peaksTheme } from "./lessonThemes/peaks.js";
import { twinPondsTheme } from "./lessonThemes/twinPonds.js";
import { beaconTheme } from "./lessonThemes/beacon.js";
import { birdsongTheme } from "./lessonThemes/birdsong.js";
import { windsweptTheme } from "./lessonThemes/windswept.js";
import { stillwaterTheme } from "./lessonThemes/stillwater.js";
import { shorelineTheme } from "./lessonThemes/shoreline.js";

export const LESSON_THEMES = {
  "en-idioms": plainsTheme,
  "en-verbalphrases": jungleTheme,
  "en-fragments": canyonTheme,
  "en-parallel": orchardTheme,
  "en-modifiers": brambleTheme,
  "en-relevance": overlookTheme,
  "en-authorintent": swampTheme,
  "en-commas": peaksTheme,
  "en-apostrophes": twinPondsTheme,
  "en-semicolons": beaconTheme,
  "en-colons": birdsongTheme,
  "en-dashes": windsweptTheme,
  "en-endpunct": stillwaterTheme,
  "en-subobjpronouns": shorelineTheme,
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
