// Skill-tree definitions for each ACT subject "island".
// Skills within a subject unlock in order, left to right, like stepping
// stones on a path. Question banks live in ./questions/<subjectId>.js
// keyed by skill id.

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
      },
      {
        id: "en-apostrophes",
        name: "Apostrophe Ally",
        blurb: "Possessives, contractions, and plural vs. possessive traps.",
      },
      {
        id: "en-colons",
        name: "Colon Call",
        blurb: "Introducing lists, explanations, and emphasis with a colon.",
      },
      {
        id: "en-semicolons",
        name: "Semicolon Signal",
        blurb: "Joining independent clauses and separating complex lists.",
      },
      {
        id: "en-dashes",
        name: "Dash Dash",
        blurb: "Interrupting, emphasizing, and setting off ideas with dashes.",
      },
      {
        id: "en-endpunct",
        name: "Full Stop",
        blurb: "Periods, question marks, and exclamation points.",
      },
      {
        id: "en-subobjpronouns",
        name: "Case Closed",
        blurb: "Choosing between subject and object pronoun forms.",
      },
      {
        id: "en-thatwho",
        name: "Who's There?",
        blurb: "That vs. who vs. which for people, things, and groups.",
      },
      {
        id: "en-pronounagreement",
        name: "Match Makers",
        blurb: "Making pronouns agree in number and gender with their antecedents.",
      },
      {
        id: "en-ambiguous",
        name: "Clear Antecedent",
        blurb: "Spotting pronouns with unclear or multiple possible antecedents.",
      },
      {
        id: "en-verbtense",
        name: "Time Traveler",
        blurb: "Keeping verb tense consistent and logical.",
      },
      {
        id: "en-svagreement",
        name: "Number Match",
        blurb: "Making subjects and verbs agree in number.",
      },
      {
        id: "en-comparisons",
        name: "Apples to Apples",
        blurb: "Comparative and superlative forms, and comparing like things.",
      },
      {
        id: "en-wordchoice",
        name: "Sound-Alike Showdown",
        blurb: "its/it's, their/there/they're, to/too/two, then/than, and more.",
      },
      {
        id: "en-idioms",
        name: "Idiom Instinct",
        blurb: "Correct preposition pairings and standard phrasing.",
      },
      {
        id: "en-verbalphrases",
        name: "Phrase Finder",
        blurb: "Gerunds, infinitives, and participial phrases.",
      },
      {
        id: "en-fragments",
        name: "Fix the Fracture",
        blurb: "Fragments, run-ons, and comma splices.",
      },
      {
        id: "en-parallel",
        name: "In Formation",
        blurb: "Keeping items in a list or comparison grammatically parallel.",
      },
      {
        id: "en-modifiers",
        name: "Modifier Mix-Up",
        blurb: "Dangling and misplaced modifiers.",
      },
      {
        id: "en-relevance",
        name: "Stay on Topic",
        blurb: "Deciding whether a sentence belongs in a paragraph.",
      },
      {
        id: "en-authorintent",
        name: "Writer's Goal",
        blurb: "Matching a revision to the author's stated purpose.",
      },
      {
        id: "en-transitions",
        name: "Bridge Builder",
        blurb: "Transitions and logical connections between ideas.",
      },
      {
        id: "en-macrologic",
        name: "Big Picture Builder",
        blurb: "Paragraph and essay-level organization and sequencing.",
      },
      {
        id: "en-concision",
        name: "Trim the Fat",
        blurb: "Concision, redundancy, and word choice.",
      },
      {
        id: "en-tone",
        name: "Tone Tuner",
        blurb: "Matching word choice and style to a consistent tone.",
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
      },
      {
        id: "ma-exponents",
        name: "Power Surge",
        blurb: "Exponents, radicals, and scientific notation.",
      },
      {
        id: "ma-angles",
        name: "Angle Anchor",
        blurb: "Angles, triangles, and the Pythagorean theorem.",
      },
      {
        id: "ma-circles",
        name: "Round Trip",
        blurb: "Circles, area, and volume.",
      },
      {
        id: "ma-quadratics",
        name: "Curve Ball",
        blurb: "Systems of equations and quadratics.",
      },
      {
        id: "ma-stats",
        name: "Odds & Ends",
        blurb: "Statistics, probability, and averages.",
      },
      {
        id: "ma-numbersense",
        name: "Number Detective",
        blurb: "Primes, even/odd rules, consecutive integers, and percent change.",
      },
      {
        id: "ma-toolbox",
        name: "Algebra Toolkit",
        blurb: "Inequality flips, factoring, absolute value, and variation.",
      },
      {
        id: "ma-trianglemastery",
        name: "Triangle Mastery",
        blurb: "Triangle rules, Pythagorean triples, and special right triangles.",
      },
      {
        id: "ma-polygons",
        name: "Shape Shifter",
        blurb: "Parallelograms, polygon angles, and similar shapes.",
      },
      {
        id: "ma-linescircles",
        name: "Angle & Arc",
        blurb: "Lines, transversals, and circle theorems.",
      },
      {
        id: "ma-volume",
        name: "Solid Ground",
        blurb: "Volume, surface area, and inscribed shapes.",
      },
      {
        id: "ma-coordinate",
        name: "Coordinate Compass",
        blurb: "Midpoint, distance, and slope relationships.",
      },
      {
        id: "ma-conics",
        name: "Graph Architect",
        blurb: "Equations of circles, parabolas, lines, and ellipses.",
      },
      {
        id: "ma-alg2",
        name: "Root Cause",
        blurb: "Discriminants, root sums, and complex numbers.",
      },
      {
        id: "ma-matrixlog",
        name: "Grid & Log",
        blurb: "Matrix operations and logarithm rules.",
      },
      {
        id: "ma-trig",
        name: "Trig Trailhead",
        blurb: "Right-triangle trig, identities, and quadrant signs.",
      },
      {
        id: "ma-finalfive",
        name: "Final Five",
        blurb: "Max-difficulty problems in the style of the ACT's toughest final stretch.",
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
      },
      {
        id: "re-detail",
        name: "Detail Detective",
        blurb: "Locate and interpret significant details.",
      },
      {
        id: "re-sequence",
        name: "Time Order",
        blurb: "Understand the sequence of events in a passage.",
      },
      {
        id: "re-compare",
        name: "Side by Side",
        blurb: "Make comparisons between ideas, people, or things in a passage.",
      },
      {
        id: "re-causeeffect",
        name: "Cause & Effect",
        blurb: "Comprehend cause-and-effect relationships.",
      },
      {
        id: "re-vocab",
        name: "Word Watch",
        blurb: "Determine the meaning of context-dependent words, phrases, and statements.",
      },
      {
        id: "re-generalize",
        name: "Big Conclusions",
        blurb: "Draw reasonable generalizations from a passage.",
      },
      {
        id: "re-voice",
        name: "Voice & Method",
        blurb: "Analyze the author's or narrator's voice and method.",
      },
      {
        id: "re-claims",
        name: "Claim Check",
        blurb: "Analyze claims and evidence in an argument.",
      },
      {
        id: "re-integrate",
        name: "Two Texts, One Story",
        blurb: "Integrate information from multiple texts.",
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
      },
      {
        id: "sc-interpret",
        name: "Data Diver",
        blurb: "Skill: Interpretation of Data. Pull values, spot trends, compare data sets.",
      },
      {
        id: "sc-research",
        name: "Lab Log",
        blurb: "Passage format: Research Summaries. Step-by-step experiments and procedures.",
      },
      {
        id: "sc-investigation",
        name: "Variable Vault",
        blurb: "Skill: Scientific Investigation. Independent/dependent variables and controls.",
      },
      {
        id: "sc-conflicting",
        name: "Theory Throwdown",
        blurb: "Passage format: Conflicting Viewpoints. Opposing theories or hypotheses.",
      },
      {
        id: "sc-evaluate",
        name: "Prediction Station",
        blurb: "Skill: Evaluation of Models and Results. Predict outcomes, assess assumptions.",
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
