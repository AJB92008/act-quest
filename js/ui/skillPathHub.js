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
// hushed swamp variant meeting the coast — one still cove reaching in
// from the edge instead of a landlocked pool, and a fully unbroken
// trail line (a period is one definitive stop, echoed by the one
// singular body of water too), and Case Closed gets a wide-open grassy
// field (no water feature) with a suitcase abandoned in the grass (a
// literal "case"). The hillside zone: Who's There? gets a
// mountain-weighted scene, sandy clearings between ranges instead of
// plains, and a narrow sliver of sea hugging the same edge the whole
// way down (coast with mountains) with one deliberate low pass in
// each range, guarded by a watchtower; Match Makers gets an
// all-mountain valley lined with
// matching peak PAIRS, each pair sharing the same height and the same
// colored pennant; Clear Antecedent gets an all-mountain scene where
// the exact same landmark peak recurs, identical, with signposts
// pointing back to it every time; Time Traveler gets coastal water
// along one edge and a mountain wall along the other, whose cliff
// strata visibly age from weathered to vivid down its length (the
// mountain showing its own past, present, and future);
// Number Match gets a plain all-mountain valley, same template as Match
// Makers and Clear Antecedent, its walls topped with recurring ridge
// silhouettes and foothill scree instead of any water feature;
// Apples to Apples gets a rocky mountain wall mirrored to the other
// side (no water feature either), with matching pairs of twin rock
// arches carved from the wall and a few literal apple trees;
// and Sound-Alike Showdown flips the coastal balance entirely — open
// water dominates, with matching cliffs (and mountain peaks cresting
// above them) on both the left and right edges, sound-wave arcs echoing
// between them. The dock zone: Bridge Builder gets sandy plains crossed
// again and again by dry gullies spanned with built plank bridges
// (transitions between ideas, one deliberate crossing at a time); Big
// Picture Builder gets a sandy mountain valley with built overlook
// platforms recurring up both walls (seeing the whole structure at
// once); Trim the Fat gets a stark, bleached desert with pruned cacti
// and almost nothing else (concision — everything unnecessary cut
// away); and Tone Tuner gets a dune desert meeting the sea along one
// edge — finally giving Tidewater Dock some actual tidewater — whose
// light, dune color, AND the water itself all shift once from warm
// sunrise gold to cool dusk purple down its whole length, with a tuning
// dial recurring along the trail (matching tone consistently, retuned
// deliberately rather than at random). Add a new skill here (plus one
// line in skillPath.js's dispatch) rather than writing a whole new
// file — that's the point of the shared engine.
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
import { sentryPassTheme } from "./lessonThemes/sentryPass.js";
import { matchedPeaksTheme } from "./lessonThemes/matchedPeaks.js";
import { clearPeakTheme } from "./lessonThemes/clearPeak.js";
import { strataPeaksTheme } from "./lessonThemes/strataPeaks.js";
import { seaStacksTheme } from "./lessonThemes/seaStacks.js";
import { twinCliffsTheme } from "./lessonThemes/twinCliffs.js";
import { echoBayTheme } from "./lessonThemes/echoBay.js";
import { causewayTheme } from "./lessonThemes/causeway.js";
import { vistaPeakTheme } from "./lessonThemes/vistaPeak.js";
import { barrensTheme } from "./lessonThemes/barrens.js";
import { duneShiftTheme } from "./lessonThemes/duneShift.js";

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
  "en-thatwho": sentryPassTheme,
  "en-pronounagreement": matchedPeaksTheme,
  "en-ambiguous": clearPeakTheme,
  "en-verbtense": strataPeaksTheme,
  "en-svagreement": seaStacksTheme,
  "en-comparisons": twinCliffsTheme,
  "en-wordchoice": echoBayTheme,
  "en-transitions": causewayTheme,
  "en-macrologic": vistaPeakTheme,
  "en-concision": barrensTheme,
  "en-tone": duneShiftTheme,
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
