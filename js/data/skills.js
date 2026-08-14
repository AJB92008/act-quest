// Skill-tree definitions for each ACT subject "island".
// Skills within a subject unlock in order, left to right, like stepping
// stones on a path. Question banks live in ./questions/<subjectId>.js
// keyed by skill id.
//
// Each skill also carries a `reportingCategory` matching one of the real
// ACT's own official score-reporting categories for that subject (see
// REPORTING_CATEGORIES below) — used by the full-length Practice Test to
// sample each section proportionally to how the real test actually weights
// its categories, and to break the results down the same way a real score
// report does, instead of treating a subject as one undifferentiated pool
// of questions.
export const REPORTING_CATEGORIES = {
  english: [
    { id: "cse", name: "Conventions of Standard English", weight: 0.53 },
    { id: "kla", name: "Knowledge of Language", weight: 0.15 },
    { id: "pow", name: "Production of Writing", weight: 0.32 },
  ],
  // The real ACT's Math categories officially overlap (a question can count
  // toward both a content category and "Integrating Essential Skills" at
  // once), which doesn't translate into a clean, non-overlapping sampling
  // split. Rather than fabricate a precise-looking percentage for
  // something that isn't precise on the real test either, Math's five
  // content categories are sampled proportional to how much of the skill
  // tree each one actually covers (see getPracticeTestSectionQuestions in
  // data/questions/index.js) — no `weight` field here, that's the signal
  // to compute it from skill counts instead.
  math: [
    { id: "numquant", name: "Number & Quantity" },
    { id: "algebra", name: "Algebra" },
    { id: "functions", name: "Functions" },
    { id: "geometry", name: "Geometry" },
    { id: "stats", name: "Statistics & Probability" },
  ],
  reading: [
    { id: "kid", name: "Key Ideas & Details", weight: 0.55 },
    { id: "cs", name: "Craft & Structure", weight: 0.25 },
    { id: "iki", name: "Integration of Knowledge & Ideas", weight: 0.2 },
  ],
  science: [
    { id: "iod", name: "Interpretation of Data", weight: 0.4 },
    { id: "sin", name: "Scientific Investigation", weight: 0.3 },
    { id: "emi", name: "Evaluation of Models & Results", weight: 0.3 },
  ],
};

export const SUBJECTS = [
  {
    id: "english",
    name: "English",
    place: "Wordwood Isle",
    color: "#ff6f5e",
    colorDark: "#d9483a",
    bg: "#fff1ee",
    icon: "🍃",
    blurb: "Grammar, punctuation, and sentence-craft challenges.",
    skills: [
      {
        id: "en-commas",
        name: "Comma Sense",
        blurb: "Commas with lists, clauses, and interrupters.",
        reportingCategory: "cse",
      },
      {
        id: "en-apostrophes",
        name: "Apostrophe Ally",
        blurb: "Possessives, contractions, and plural vs. possessive traps.",
        reportingCategory: "cse",
      },
      {
        id: "en-colons",
        name: "Colon Call",
        blurb: "Introducing lists, explanations, and emphasis with a colon.",
        reportingCategory: "cse",
      },
      {
        id: "en-semicolons",
        name: "Semicolon Signal",
        blurb: "Joining independent clauses and separating complex lists.",
        reportingCategory: "cse",
      },
      {
        id: "en-dashes",
        name: "Dash Dash",
        blurb: "Interrupting, emphasizing, and setting off ideas with dashes.",
        reportingCategory: "cse",
      },
      {
        id: "en-endpunct",
        name: "Full Stop",
        blurb: "Periods, question marks, and exclamation points.",
        reportingCategory: "cse",
      },
      {
        id: "en-subobjpronouns",
        name: "Case Closed",
        blurb: "Choosing between subject and object pronoun forms.",
        reportingCategory: "cse",
      },
      {
        id: "en-thatwho",
        name: "Who's There?",
        blurb: "That vs. who vs. which for people, things, and groups.",
        reportingCategory: "cse",
      },
      {
        id: "en-pronounagreement",
        name: "Match Makers",
        blurb: "Making pronouns agree in number and gender with their antecedents.",
        reportingCategory: "cse",
      },
      {
        id: "en-ambiguous",
        name: "Clear Antecedent",
        blurb: "Spotting pronouns with unclear or multiple possible antecedents.",
        reportingCategory: "cse",
      },
      {
        id: "en-verbtense",
        name: "Time Traveler",
        blurb: "Keeping verb tense consistent and logical.",
        reportingCategory: "cse",
      },
      {
        id: "en-svagreement",
        name: "Number Match",
        blurb: "Making subjects and verbs agree in number.",
        reportingCategory: "cse",
      },
      {
        id: "en-comparisons",
        name: "Apples to Apples",
        blurb: "Comparative and superlative forms, and comparing like things.",
        reportingCategory: "cse",
      },
      {
        id: "en-wordchoice",
        name: "Sound-Alike Showdown",
        blurb: "its/it's, their/there/they're, to/too/two, then/than, and more.",
        reportingCategory: "kla",
      },
      {
        id: "en-idioms",
        name: "Idiom Instinct",
        blurb: "Correct preposition pairings and standard phrasing.",
        reportingCategory: "kla",
      },
      {
        id: "en-verbalphrases",
        name: "Phrase Finder",
        blurb: "Gerunds, infinitives, and participial phrases.",
        reportingCategory: "cse",
      },
      {
        id: "en-fragments",
        name: "Fix the Fracture",
        blurb: "Fragments, run-ons, and comma splices.",
        reportingCategory: "cse",
      },
      {
        id: "en-parallel",
        name: "In Formation",
        blurb: "Keeping items in a list or comparison grammatically parallel.",
        reportingCategory: "cse",
      },
      {
        id: "en-modifiers",
        name: "Modifier Mix-Up",
        blurb: "Dangling and misplaced modifiers.",
        reportingCategory: "cse",
      },
      {
        id: "en-relevance",
        name: "Stay on Topic",
        blurb: "Deciding whether a sentence belongs in a paragraph.",
        reportingCategory: "pow",
      },
      {
        id: "en-authorintent",
        name: "Writer's Goal",
        blurb: "Matching a revision to the author's stated purpose.",
        reportingCategory: "pow",
      },
      {
        id: "en-transitions",
        name: "Bridge Builder",
        blurb: "Transitions and logical connections between ideas.",
        reportingCategory: "pow",
      },
      {
        id: "en-macrologic",
        name: "Big Picture Builder",
        blurb: "Paragraph and essay-level organization and sequencing.",
        reportingCategory: "pow",
      },
      {
        id: "en-concision",
        name: "Trim the Fat",
        blurb: "Concision, redundancy, and word choice.",
        reportingCategory: "kla",
      },
      {
        id: "en-tone",
        name: "Tone Tuner",
        blurb: "Matching word choice and style to a consistent tone.",
        reportingCategory: "kla",
      },
    ],
  },
  {
    id: "math",
    name: "Math",
    place: "Numeria Peaks",
    color: "#6a5cff",
    colorDark: "#4433cc",
    bg: "#f0eeff",
    icon: "🔺",
    blurb: "Algebra, geometry, and data-crunching puzzles.",
    skills: [
      {
        id: "ma-linear",
        name: "Line Crossing",
        blurb: "Linear equations and inequalities.",
        reportingCategory: "algebra",
      },
      {
        id: "ma-exponents",
        name: "Power Surge",
        blurb: "Exponents, radicals, and scientific notation.",
        reportingCategory: "numquant",
      },
      {
        id: "ma-angles",
        name: "Angle Anchor",
        blurb: "Angles, triangles, and the Pythagorean theorem.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-circles",
        name: "Round Trip",
        blurb: "Circles, area, and volume.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-quadratics",
        name: "Curve Ball",
        blurb: "Systems of equations and quadratics.",
        reportingCategory: "algebra",
      },
      {
        id: "ma-stats",
        name: "Odds & Ends",
        blurb: "Statistics, probability, and averages.",
        reportingCategory: "stats",
      },
      {
        id: "ma-numbersense",
        name: "Number Detective",
        blurb: "Primes, even/odd rules, consecutive integers, and percent change.",
        reportingCategory: "numquant",
      },
      {
        id: "ma-toolbox",
        name: "Algebra Toolkit",
        blurb: "Inequality flips, factoring, absolute value, and variation.",
        reportingCategory: "algebra",
      },
      {
        id: "ma-trianglemastery",
        name: "Triangle Mastery",
        blurb: "Triangle rules, Pythagorean triples, and special right triangles.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-polygons",
        name: "Shape Shifter",
        blurb: "Parallelograms, polygon angles, and similar shapes.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-linescircles",
        name: "Angle & Arc",
        blurb: "Lines, transversals, and circle theorems.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-volume",
        name: "Solid Ground",
        blurb: "Volume, surface area, and inscribed shapes.",
        reportingCategory: "geometry",
      },
      {
        id: "ma-coordinate",
        name: "Coordinate Compass",
        blurb: "Midpoint, distance, and slope relationships.",
        reportingCategory: "functions",
      },
      {
        id: "ma-conics",
        name: "Graph Architect",
        blurb: "Equations of circles, parabolas, lines, and ellipses.",
        reportingCategory: "functions",
      },
      {
        id: "ma-alg2",
        name: "Root Cause",
        blurb: "Discriminants, root sums, and complex numbers.",
        reportingCategory: "algebra",
      },
      {
        id: "ma-matrixlog",
        name: "Grid & Log",
        blurb: "Matrix operations and logarithm rules.",
        reportingCategory: "functions",
      },
      {
        id: "ma-trig",
        name: "Trig Trailhead",
        blurb: "Right-triangle trig, identities, and quadrant signs.",
        reportingCategory: "functions",
      },
      {
        id: "ma-finalfive",
        name: "Final Five",
        blurb: "Max-difficulty problems in the style of the ACT's toughest final stretch.",
        reportingCategory: "algebra",
      },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    place: "Athenaeum Reef",
    color: "#22b8a3",
    colorDark: "#128071",
    bg: "#e8fbf7",
    icon: "📖",
    blurb: "Short passages, then questions that test how closely you read.",
    skills: [
      {
        id: "re-mainidea",
        name: "Big Picture",
        blurb: "Determine the main idea of a passage.",
        reportingCategory: "kid",
      },
      {
        id: "re-detail",
        name: "Detail Detective",
        blurb: "Locate and interpret significant details.",
        reportingCategory: "kid",
      },
      {
        id: "re-sequence",
        name: "Time Order",
        blurb: "Understand the sequence of events in a passage.",
        reportingCategory: "kid",
      },
      {
        id: "re-compare",
        name: "Side by Side",
        blurb: "Make comparisons between ideas, people, or things in a passage.",
        reportingCategory: "kid",
      },
      {
        id: "re-causeeffect",
        name: "Cause & Effect",
        blurb: "Comprehend cause-and-effect relationships.",
        reportingCategory: "kid",
      },
      {
        id: "re-vocab",
        name: "Word Watch",
        blurb: "Determine the meaning of context-dependent words, phrases, and statements.",
        reportingCategory: "cs",
      },
      {
        id: "re-generalize",
        name: "Big Conclusions",
        blurb: "Draw reasonable generalizations from a passage.",
        reportingCategory: "kid",
      },
      {
        id: "re-voice",
        name: "Voice & Method",
        blurb: "Analyze the author's or narrator's voice and method.",
        reportingCategory: "cs",
      },
      {
        id: "re-claims",
        name: "Claim Check",
        blurb: "Analyze claims and evidence in an argument.",
        reportingCategory: "iki",
      },
      {
        id: "re-integrate",
        name: "Two Texts, One Story",
        blurb: "Integrate information from multiple texts.",
        reportingCategory: "iki",
      },
    ],
  },
  {
    id: "science",
    name: "Science",
    place: "Lab Archipelago",
    color: "#ffb238",
    colorDark: "#cc8a1c",
    bg: "#fff8ea",
    icon: "🧪",
    blurb: "Tables, graphs, and experiments to size up quickly.",
    skills: [
      {
        id: "sc-datarep",
        name: "Graph Gazer",
        blurb: "Passage format: Data Representation. Charts, graphs, and scatter plots.",
        reportingCategory: "iod",
      },
      {
        id: "sc-interpret",
        name: "Data Diver",
        blurb: "Skill: Interpretation of Data. Pull values, spot trends, compare data sets.",
        reportingCategory: "iod",
      },
      {
        id: "sc-research",
        name: "Lab Log",
        blurb: "Passage format: Research Summaries. Step-by-step experiments and procedures.",
        reportingCategory: "sin",
      },
      {
        id: "sc-investigation",
        name: "Variable Vault",
        blurb: "Skill: Scientific Investigation. Independent/dependent variables and controls.",
        reportingCategory: "sin",
      },
      {
        id: "sc-conflicting",
        name: "Theory Throwdown",
        blurb: "Passage format: Conflicting Viewpoints. Opposing theories or hypotheses.",
        reportingCategory: "emi",
      },
      {
        id: "sc-evaluate",
        name: "Prediction Station",
        blurb: "Skill: Evaluation of Models and Results. Predict outcomes, assess assumptions.",
        reportingCategory: "emi",
      },
    ],
  },
];

export function getSubject(subjectId) {
  return SUBJECTS.find((s) => s.id === subjectId);
}

export function getSkill(skillId) {
  for (const subject of SUBJECTS) {
    const skill = subject.skills.find((sk) => sk.id === skillId);
    if (skill) return { subject, skill };
  }
  return null;
}

export function allSkillIds() {
  return SUBJECTS.flatMap((s) => s.skills.map((sk) => sk.id));
}
