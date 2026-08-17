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
// Writing) and data/questions/satMath.js (Math). PSAT's Reading & Writing
// (see psatSkills.js) now has real content the same way, in
// data/questions/psatRw.js. Every other subject (PSAT Math, State
// Assessments) is still infrastructure — either a real, named skill tree
// planned out but no lesson/question content behind it yet
// (`contentPending: true` — see isSubjectPlayable below), or still fully
// empty (`skills: []`). Either way the World Map/island screens have
// something real to render and the right "coming soon" state to show.
//
// Subject/skill ids across every planet have to stay globally unique
// (e.g. "sat-math", distinct from ACT's "math") since getSubject()/
// getSkill() below search across all planets at once rather than needing
// a testId thread through every screen that calls them — see the comment above those
// functions for why that's the one hard rule extending a planet has to
// follow.
import { SUBJECTS as ACT_SUBJECTS } from "./skills.js";
import { SAT_SUBJECTS } from "./satSkills.js";
import { PSAT_SUBJECTS } from "./psatSkills.js";

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
    // psat-rw's real skill tree lives in psatSkills.js (see that file's
    // header comment for why it mirrors sat-rw's domain breakdown
    // skill-for-skill) and is folded in by reference here, same pattern
    // SAT's own subjects use above. psat-math is still fully empty
    // scaffolding — no skill tree built for it yet.
    subjects: [
      ...PSAT_SUBJECTS,
      {
        id: "psat-math",
        name: "Math",
        place: "Starter Slopes",
        color: "#e6a13c",
        colorDark: "#b87a1f",
        bg: "#fdf2e2",
        icon: "📏",
        blurb: "Algebra, problem-solving, and data analysis, PSAT-style — coming soon.",
        skills: [],
      },
    ],
  },
  {
    id: "stateAssessments",
    name: "State Assessments",
    planetName: "Terravale",
    tagline: "State end-of-course and graduation exams — a whole cluster of local worlds.",
    icon: "🌍",
    color: "#3d8f5f",
    colorDark: "#296b44",
    bg: "#e9f6ee",
    subjects: [
      {
        id: "state-ela",
        name: "English Language Arts",
        place: "Statute Springs",
        color: "#3d8f5f",
        colorDark: "#296b44",
        bg: "#e9f6ee",
        icon: "📖",
        blurb: "State-standard reading and writing skills — coming soon.",
        skills: [],
      },
      {
        id: "state-math",
        name: "Math",
        place: "Ledger Hills",
        color: "#4a7fc9",
        colorDark: "#2f5a99",
        bg: "#eaf1fb",
        icon: "🧮",
        blurb: "State-standard math skills — coming soon.",
        skills: [],
      },
    ],
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
