// The "solar system" layer above the World Map: each real standardized
// test is its own planet, and a planet's islands are just that test's
// subjects — same shape (`{ id, name, place, color, colorDark, bg, icon,
// blurb, skills }`) the World Map/island/skill-path screens already know
// how to render, so a planet with real content needs zero new UI code.
//
// ACT is the only planet with real content right now — its subjects are
// skills.js's existing SUBJECTS, included here by reference (not copied),
// so nothing about the live ACT experience changes by a single byte. The
// other three planets are infrastructure only: their subjects exist (so
// the map/island screens have something real to render and a "coming
// soon" empty state to exercise) but every one of them has `skills: []`
// — no lessons, no question banks, no boss. Writing that content is
// future work; this just makes sure there's somewhere for it to go.
//
// Subject/skill ids across every planet have to stay globally unique
// (e.g. "sat-math", not "math") since getSubject()/getSkill() below
// search across all planets at once rather than needing a testId thread
// through every screen that calls them — see the comment above those
// functions for why that's the one hard rule extending a planet has to
// follow.
import { SUBJECTS as ACT_SUBJECTS } from "./skills.js";

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
    subjects: [
      {
        id: "sat-rw",
        name: "Reading & Writing",
        place: "Lexicon Shoals",
        color: "#2a9d8f",
        colorDark: "#1c6f65",
        bg: "#e8f6f4",
        icon: "📘",
        blurb: "SAT-style passage reading, grammar, and rhetoric — coming soon.",
        skills: [],
      },
      {
        id: "sat-math",
        name: "Math",
        place: "Function Fields",
        color: "#e07a5f",
        colorDark: "#b3563e",
        bg: "#fdeee9",
        icon: "📐",
        blurb: "Algebra, problem-solving, and data analysis, SAT-style — coming soon.",
        skills: [],
      },
    ],
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
    subjects: [
      {
        id: "psat-rw",
        name: "Reading & Writing",
        place: "Preface Point",
        color: "#8d6ae8",
        colorDark: "#5f3fc4",
        bg: "#f2eefd",
        icon: "📗",
        blurb: "PSAT-style passage reading, grammar, and rhetoric — coming soon.",
        skills: [],
      },
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

// A planet is "ready" once at least one of its subjects actually has
// lessons to offer — the signal the Solar System/World Map screens use to
// decide between a real island layout and a "coming soon" empty state.
export function isTestReady(testId) {
  return getTestSubjects(testId).some((s) => s.skills.length > 0);
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
