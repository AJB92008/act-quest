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
// composite scene, a brief run of mountains right at the top giving way
// to plains dominating the rest (a comma's own brief pause between two
// things — plains-dominant so the scene still reads as Sunny Meadow),
// Apostrophe Ally gets a plains scene built entirely from paired/twin
// features (ponds, hills, grass tufts, flowers — an "ally," always in
// twos — denser than a first pass at the idea, so the field doesn't
// read as empty between pairs),
// Semicolon Signal gets a plains scene centered on a windmill landmark
// (now with a proper base and roof) with more frequent signal flags
// along the trail and ambient wheat texture filling the field, Colon
// Call gets a plains
// scene full of calling birds and a bell tower (a colon "calls out"
// what follows), Dash Dash gets a windswept prairie whose trail is
// drawn in long chunky dashes instead of dots, Full Stop gets its own
// hushed swamp variant meeting the coast — one still cove reaching in
// from the edge instead of a landlocked pool, and a fully unbroken
// trail line (a period is one definitive stop, echoed by the one
// singular body of water too), and Case Closed gets a wide-open grassy
// field (no water feature) with a suitcase abandoned in the grass (a
// literal "case"). The hillside zone: Who's There? gets one continuous
// mountain wall (not alternating blocks) with one deliberate low pass
// guarded by a watchtower, receding into a small clearing near the
// bottom, and a narrow sliver of sea along the opposite edge the whole
// way down (coast with mountains, one coherent scene); Match Makers
// gets an all-mountain valley lined with
// matching peak PAIRS, each pair sharing the same height and the same
// colored pennant; Clear Antecedent gets an all-mountain scene where
// the exact same landmark peak recurs, identical, with signposts
// pointing back to it every time; Time Traveler gets a mountain wall
// whose cliff strata visibly age from weathered to vivid down its
// length (the mountain showing its own past, present, and future),
// with only a narrow, quiet sliver of sea along the opposite edge —
// enough to read as coastal without competing with the strata for
// attention;
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
// deliberately rather than at random). Numeria Peaks' own Ironroot
// Algebra zone: Line Crossing gets an Ironroot valley crossed again and
// again by the same dead-straight diagonal line, the same slope every
// time, each crossing spanned by a plank bridge (linear — a constant
// rate of change, unlike every wandering trail/wall edge elsewhere);
// Curve Ball gets two actual parabolic ridgelines sweeping wall to
// wall, their genuine intersection points (solved algebraically, not
// guessed) each marked with a boulder — up to two per pair, the same
// as a real quadratic system; Algebra Toolkit gets a mining valley
// worked with a different tool at every stop (pickaxe, crate, ore
// cart, lantern, coiled rope) rather than one repeated prop, a toolkit
// holding several different tools rather than five of the same one;
// Root Cause goes underground into a mine cavern threaded with the
// peaks' own roots reaching down from above and braced by wooden shaft
// supports, digging past the surface for what's actually at the root
// of things; and Final Five gets one continuous wall carrying exactly
// five numbered peaks, each taller and darker than the last, right up
// to the boss's own clearing — the ACT's own toughest final stretch,
// getting harder one peak at a time. Numeria Peaks' own Shalefoot
// Geometry zone: Angle Anchor gets a valley anchored at intervals by a
// real square-on-each-side Pythagorean proof (an actual a²+b²=c²
// picture, not an icon) plus smaller angle-tick marks between them;
// Round Trip gets a valley where the trail itself breaks off through a
// real stone ring and back at every stop, a genuine loop rather than a
// circle drawn nearby; Triangle Mastery gets a valley floor scattered
// with crystal shards cut into a different triangle type at every
// stop — right, equilateral, isosceles, scalene — fluency across all
// of them rather than one shape repeated; Shape Shifter gets a valley
// where the same landmark polygon reappears with a different vertex
// count every time (a square, then a pentagon, a hexagon, and on);
// Angle & Arc gets a valley where a real stone circle and a genuine
// secant line (drawn from two actual points on the circle's own
// circumference, not eyeballed) cross at every stop; and Solid Ground
// gets a valley planted with a different real 3D solid at every
// stop — a cube, a cylinder, a cone, a sphere — each shaded with real
// faces so it reads as a volume, not a flat icon. Numeria Peaks' own
// Skyline Functions zone flips its own hub map's balance: the hub
// itself leads with spires and treats purple trees as a secondary
// accent, but every one of these four lesson paths leads with a real
// purple forest instead, the spires only a faint distant skyline above
// the canopy. Coordinate Compass gets that forest laid over a faint
// coordinate grid, a compass rose at intervals, and small plotted-point
// markers along the trail itself; Graph Architect gets trees planted
// into real conic shapes rather than scattered at random — a circle, an
// ellipse, a parabola's own arc, built from trees instead of drawn;
// Grid & Log gets trees arranged into an actual row-by-column grid
// between real matrix brackets at some stops, and a real logarithmic
// spiral (r = ae^(bθ)) growing through the trees at others; and Trig
// Trailhead opens at a real trailhead signpost planted at the very
// first lesson, threaded the rest of the way by a real sine wave and
// marked at intervals by a circle split into its four quadrants, each
// carrying its own sign. Numeria Peaks' own Goldtally Flats zone keeps
// its hub map's own low-profile identity here too — no rock walls, no
// forest canopy, just open flat gold-flecked ground with cracked-earth
// texture, the same "Flats" logic the hub's own nugget-and-tally motif
// already follows. Power Surge gets a nugget cluster whose own count
// doubles at every stop (two, then four, then eight, then sixteen — an
// actual exponential surge, not a fixed pile) plus real lightning-
// shaped cracks in the dry earth; Odds & Ends gets a genuinely varied
// assortment at every stop — a die, a coin, a tally mark, never the
// same one twice in a row — "odds" and "ends" both at once; and Number
// Detective gets a real footprint trail alongside the path, numbered
// evidence tags (circled if the number's prime) planted at intervals,
// and one magnifying glass over the biggest piece of evidence. Add a
// new skill here (plus one line in skillPath.js's dispatch) rather
// than writing a whole new file — that's the point of the shared
// engine.
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
import { faultLineTheme } from "./lessonThemes/faultLine.js";
import { archCrossingTheme } from "./lessonThemes/archCrossing.js";
import { minersCacheTheme } from "./lessonThemes/minersCache.js";
import { rootCavernTheme } from "./lessonThemes/rootCavern.js";
import { fivePeaksTheme } from "./lessonThemes/fivePeaks.js";
import { pythagoreanAnchorTheme } from "./lessonThemes/pythagoreanAnchor.js";
import { roundTripLoopTheme } from "./lessonThemes/roundTripLoop.js";
import { triangleGalleryTheme } from "./lessonThemes/triangleGallery.js";
import { shapeShifterTheme } from "./lessonThemes/shapeShifter.js";
import { angleArcTheme } from "./lessonThemes/angleArc.js";
import { solidGroundGeoTheme } from "./lessonThemes/solidGroundGeo.js";
import { coordinateForestTheme } from "./lessonThemes/coordinateForest.js";
import { graphArchitectForestTheme } from "./lessonThemes/graphArchitectForest.js";
import { gridLogForestTheme } from "./lessonThemes/gridLogForest.js";
import { trigTrailheadTheme } from "./lessonThemes/trigTrailhead.js";
import { powerSurgeFlatsTheme } from "./lessonThemes/powerSurgeFlats.js";
import { oddsEndsFlatsTheme } from "./lessonThemes/oddsEndsFlats.js";
import { numberDetectiveFlatsTheme } from "./lessonThemes/numberDetectiveFlats.js";

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
  "ma-linear": faultLineTheme,
  "ma-quadratics": archCrossingTheme,
  "ma-toolbox": minersCacheTheme,
  "ma-alg2": rootCavernTheme,
  "ma-finalfive": fivePeaksTheme,
  "ma-angles": pythagoreanAnchorTheme,
  "ma-circles": roundTripLoopTheme,
  "ma-trianglemastery": triangleGalleryTheme,
  "ma-polygons": shapeShifterTheme,
  "ma-linescircles": angleArcTheme,
  "ma-volume": solidGroundGeoTheme,
  "ma-coordinate": coordinateForestTheme,
  "ma-conics": graphArchitectForestTheme,
  "ma-matrixlog": gridLogForestTheme,
  "ma-trig": trigTrailheadTheme,
  "ma-exponents": powerSurgeFlatsTheme,
  "ma-stats": oddsEndsFlatsTheme,
  "ma-numbersense": numberDetectiveFlatsTheme,
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
