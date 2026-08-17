// The "solar system" layer above the World Map: each real standardized
// test is its own planet, and a planet's islands are just that test's
// subjects — same shape (`{ id, name, place, color, colorDark, bg, icon,
// blurb, skills }`) the World Map/island/skill-path screens already know
// how to render, so a planet with real content needs zero new UI code.
//
// ACT is the original planet with playable content — its subjects are
// skills.js's existing SUBJECTS, included here by reference (not copied),
// so nothing about the live ACT experience changes by a single byte. Both
// of SAT's subjects (see satSkills.js) have real content too: a full
// 100-question bank per skill in data/questions/satRw.js (Reading &
// Writing) and data/questions/satMath.js (Math). Both of PSAT's subjects
// (see psatSkills.js) now have real content the same way, in
// data/questions/psatRw.js and data/questions/psatMath.js. State
// Assessments is still fully empty scaffolding (`skills: []`) — a subject
// can also have a real, named skill tree planned out with no
// lesson/question content behind it yet (`contentPending: true` — see
// isSubjectPlayable below), the transitional stage every playable subject
// above went through first. Either way the World Map/island screens have
// something real to render and the right "coming soon" state to show.
//
// Subject/skill ids across every planet have to stay globally unique
// (e.g. "sat-math", distinct from ACT's "math") since getSubject()/
// getSkill() below search across all planets at once rather than needing
// a testId thread through every screen that calls them — see the comment above those
// functions for why that's the one hard rule extending a planet has to
// follow.
import { SUBJECTS as ACT_SUBJECTS, REPORTING_CATEGORIES as ACT_REPORTING_CATEGORIES } from "./skills.js";
import { SAT_SUBJECTS, REPORTING_CATEGORIES as SAT_REPORTING_CATEGORIES } from "./satSkills.js";
import { PSAT_SUBJECTS, PSAT_REPORTING_CATEGORIES } from "./psatSkills.js";
import { ALL_STATE_SUBJECTS } from "./stateTests.js";

// Every planet's REPORTING_CATEGORIES, merged — subjectId keys stay
// globally unique across planets (same rule as skill ids, see file header
// below), so this is a safe flat merge rather than needing a testId to
// disambiguate. Used by the full-length Practice Test's proportional
// sampling and section score-curve building (see data/questions/index.js
// and state.js) so those stay generic over subjectId instead of each
// needing their own per-planet branch.
export const REPORTING_CATEGORIES = { ...ACT_REPORTING_CATEGORIES, ...SAT_REPORTING_CATEGORIES, ...PSAT_REPORTING_CATEGORIES };

export const TESTS = [
  {
    id: "act",
    name: "ACT",
    planetName: "Acto Prime",
    tagline: "Home base — English, Math, Reading, and Science, fully stocked.",
    icon: "🪐",
    color: "#6a5cff",
    colorDark: "#4433cc",
    bg: "#f0eeff",
    subjects: ACT_SUBJECTS,
    // Drives the full-length Practice Test screen (ui/practiceTest.js) and
    // the section-scaled-score tables it uses (ACT_SCORE_TABLES in
    // state.js) — one config per planet instead of a screen hardcoded to
    // ACT's own sections. Real ACT section order, question counts, and
    // official time limits: 215 questions, 2h55m total across the four
    // sections, composite is the *average* of each section's own 1-36
    // scaled score (matching how the real ACT computes it). `scoreStep: 1`
    // because real ACT scores are whole integers, not rounded to a coarser
    // increment. `supportsWriting` gates the screen's optional Writing
    // section flow — the real ACT (and this app's essay.js) has one;
    // SAT/PSAT don't.
    practiceTest: {
      compositeMethod: "average",
      compositeRange: { min: 1, max: 36 },
      scoreStep: 1,
      supportsWriting: true,
      sections: [
        { subjectId: "english", questionCount: 75, timeMinutes: 45 },
        { subjectId: "math", questionCount: 60, timeMinutes: 60 },
        { subjectId: "reading", questionCount: 40, timeMinutes: 35 },
        { subjectId: "science", questionCount: 40, timeMinutes: 35 },
      ],
    },
  },
  {
    id: "sat",
    name: "SAT",
    planetName: "Satura",
    tagline: "Digital SAT prep — Reading & Writing and Math.",
    icon: "🌕",
    color: "#2a9d8f",
    colorDark: "#1c6f65",
    bg: "#e8f6f4",
    subjects: SAT_SUBJECTS,
    // Real digital SAT format: two sections, Reading & Writing (54
    // questions/64 min) then Math (44 questions/70 min), 98 questions and
    // 2h14m total. Composite is the *sum* of the two section scores (each
    // 200-800), not an average — the real SAT computes it that way, unlike
    // the ACT's four-way average above. `scoreStep: 10` because real
    // SAT/PSAT section scores are always reported in increments of 10.
    practiceTest: {
      compositeMethod: "sum",
      compositeRange: { min: 400, max: 1600 },
      scoreStep: 10,
      supportsWriting: false,
      sections: [
        { subjectId: "sat-rw", questionCount: 54, timeMinutes: 64 },
        { subjectId: "sat-math", questionCount: 44, timeMinutes: 70 },
      ],
    },
  },
  {
    id: "psat",
    name: "PSAT",
    planetName: "Prepstar",
    tagline: "PSAT/NMSQT practice — a smaller companion world to Satura.",
    icon: "🌗",
    color: "#8d6ae8",
    colorDark: "#5f3fc4",
    bg: "#f2eefd",
    // Both of PSAT's real skill trees live in psatSkills.js (see that
    // file's header comment for why each mirrors its SAT counterpart's
    // domain breakdown skill-for-skill) and are folded in by reference
    // here, same pattern SAT's own subjects use above.
    subjects: PSAT_SUBJECTS,
    // Same digital two-section format/timing as SAT's own config above —
    // College Board publishes PSAT/NMSQT as testing identical section
    // structure and timing to the digital SAT, just scored on PSAT's own
    // narrower 160-760-per-section (320-1520 composite) range.
    practiceTest: {
      compositeMethod: "sum",
      compositeRange: { min: 320, max: 1520 },
      scoreStep: 10,
      supportsWriting: false,
      sections: [
        { subjectId: "psat-rw", questionCount: 54, timeMinutes: 64 },
        { subjectId: "psat-math", questionCount: 44, timeMinutes: 70 },
      ],
    },
  },
  {
    id: "stateAssessments",
    name: "State Assessments",
    planetName: "Terravale",
    tagline: "Every state mandates its own tests — pick your state to see yours.",
    icon: "🌍",
    color: "#3d8f5f",
    colorDark: "#296b44",
    bg: "#e9f6ee",
    // Unlike every other planet, this one has no single fixed set of
    // islands — which test is "mandated" depends on which state the
    // player lives in (see data/stateTests.js and ui/statePicker.js).
    // `subjects` here is every state's subjects flattened together (100
    // entries, all still-empty `skills: []` scaffolding either way) purely
    // so each state-specific subject/skill id is globally discoverable via
    // getSubject()/getSkill()/allSubjects() below, the one hard rule every
    // planet has to follow (see this file's header comment). The World
    // Map/Dashboard screens never render this full list directly — they
    // call getStateSubjects(gameState.homeState) to show just the
    // player's own state's two islands, redirecting to the state picker
    // first if homeState isn't set yet.
    subjects: ALL_STATE_SUBJECTS,
  },
];

export const TEST_IDS = new Set(TESTS.map((t) => t.id));

export function getTest(testId) {
  return TESTS.find((t) => t.id === testId);
}

export function getTestSubjects(testId) {
  return getTest(testId)?.subjects || [];
}

// Every skill id belonging to one planet — the testId-scoped counterpart to
// allSkillIds() below, for callers (gameState.getWeakSkills, mainly) that
// need "every skill on this planet" rather than "every skill that exists."
export function getTestSkillIds(testId) {
  return getTestSubjects(testId).flatMap((s) => s.skills.map((sk) => sk.id));
}

// A planet is "ready" once at least one of its subjects actually has
// lessons to offer — the signal the Solar System/World Map screens use to
// decide between a real island layout and a "coming soon" empty state.
// A subject can have a real skill tree (see satSkills.js) before it has
// real lesson/question content behind it — `contentPending: true` marks
// that gap explicitly, rather than inferring readiness from `skills.length`
// alone, which would otherwise say "ready" the moment a skill tree exists
// even though data/questions/index.js has no bank, no SUBJECT_LOADER, and
// no BOSS_MONSTERS entry for it yet. Absent entirely (as on every ACT
// subject) counts as ready, so nothing needed to change on skills.js's
// side for ACT to keep working.
export function isSubjectPlayable(subject) {
  return subject.skills.length > 0 && !subject.contentPending;
}

export function isTestReady(testId) {
  return getTestSubjects(testId).some(isSubjectPlayable);
}

// Every subject across every planet, flattened — used where something
// needs to exist (a skillProgress record, mainly) for every skill
// regardless of whether that skill has real lesson content yet, so a
// subject can grow a real skill tree (see satSkills.js) without a save
// crashing on `skillProgress[skillId]` being undefined the moment
// something reads it.
export function allSubjects() {
  return TESTS.flatMap((t) => t.subjects);
}

export function allSkillIds() {
  return allSubjects().flatMap((s) => s.skills.map((sk) => sk.id));
}

// Generalized versions of skills.js's getSubject()/getSkill(): search
// *every* planet's subjects, not just ACT's, so the shared World Map ->
// island -> skill-path -> quiz screens can resolve a subject/skill id
// without needing to know or care which planet it belongs to — the whole
// point of subject/skill ids staying globally unique across planets (see
// the file-level comment). ACT's own screens that only ever deal in ACT
// ids (practice test, essay, score report, adaptive/SRS practice, ...)
// keep using skills.js's originals unchanged; only the cross-planet
// navigation spine imports these.
export function getSubject(subjectId) {
  for (const test of TESTS) {
    const subject = test.subjects.find((s) => s.id === subjectId);
    if (subject) return subject;
  }
  return undefined;
}

export function getSkill(skillId) {
  for (const test of TESTS) {
    for (const subject of test.subjects) {
      const skill = subject.skills.find((sk) => sk.id === skillId);
      if (skill) return { subject, skill };
    }
  }
  return null;
}
