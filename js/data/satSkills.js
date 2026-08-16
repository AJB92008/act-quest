// Skill-tree definitions for the SAT Reading & Writing section — same
// shape data/skills.js uses for ACT's subjects (see that file's own
// header comment for the general pattern this mirrors), just for the SAT
// planet instead (see data/tests.js).
//
// The four domains below are the College Board's own official content
// domains for digital SAT Reading & Writing, and REPORTING_CATEGORIES'
// weights are its published approximate section weightings. Each skill
// carries a `reportingCategory` tying it back to one of the four, same as
// ACT's skills do with REPORTING_CATEGORIES in skills.js — for the same
// reason: so a future full-length Practice Test can sample proportionally
// by domain instead of drawing uniformly across skills regardless of how
// the real test actually weights them.
//
// `skills` here have `id`/`name`/`blurb`/`reportingCategory`, same as
// ACT's — each skill's 100-question bank lives in data/questions/satRw.js
// (Reading & Writing) or data/questions/satMath.js (Math), loaded via
// SUBJECT_LOADERS in data/questions/index.js, each with its own
// BOSS_MONSTERS entry ("The Archive Owl" / "The Vector Wraith") like every
// other playable subject.
export const REPORTING_CATEGORIES = {
  "sat-rw": [
    { id: "ii", name: "Information and Ideas", weight: 0.26 },
    { id: "cs", name: "Craft and Structure", weight: 0.28 },
    { id: "eoi", name: "Expression of Ideas", weight: 0.2 },
    { id: "sec", name: "Standard English Conventions", weight: 0.26 },
  ],
  // The College Board publishes these four content domains with an exact
  // question-count range per module (e.g. Algebra 13-15 of ~44), not the
  // more granular "reporting categories" language R&W's official docs use
  // — but they're the same kind of thing (a fixed set of tested domains
  // each skill belongs to), so they're named REPORTING_CATEGORIES here too
  // for consistency with every other subject. Weights are each domain's
  // question-count range's midpoint (14, 14, 6, 6) normalized to sum to 1.
  "sat-math": [
    { id: "algebra", name: "Algebra", weight: 0.35 },
    { id: "advmath", name: "Advanced Math", weight: 0.35 },
    { id: "psda", name: "Problem-Solving and Data Analysis", weight: 0.15 },
    { id: "geotrig", name: "Geometry and Trigonometry", weight: 0.15 },
  ],
};

export const SAT_SUBJECTS = [
  {
    id: "sat-rw",
    name: "Reading & Writing",
    place: "Lexicon Shoals",
    color: "#2a9d8f",
    colorDark: "#1c6f65",
    bg: "#e8f6f4",
    icon: "📘",
    blurb: "Passage reading, vocabulary, rhetoric, and grammar, SAT-style.",
    skills: [
      // --- Information and Ideas (~26%) ---
      {
        id: "satrw-centralidea",
        name: "Core Idea Finder",
        blurb: "Pin down a text's central idea and the details that support it.",
        reportingCategory: "ii",
      },
      {
        id: "satrw-evidence-text",
        name: "Evidence Hunter",
        blurb: "Find the textual evidence that best supports or weakens a claim.",
        reportingCategory: "ii",
      },
      {
        id: "satrw-evidence-data",
        name: "Chart Reader",
        blurb: "Match claims to data in tables, bar graphs, and line graphs.",
        reportingCategory: "ii",
      },
      {
        id: "satrw-inference",
        name: "Read Between the Lines",
        blurb: "Draw logical inferences a text implies but never states outright.",
        reportingCategory: "ii",
      },
      {
        id: "satrw-detailsort",
        name: "Detail Sorter",
        blurb: "Separate the details that actually support a claim from ones that just sound related.",
        reportingCategory: "ii",
      },

      // --- Craft and Structure (~28%) ---
      {
        id: "satrw-wordsincontext",
        name: "Context Clues",
        blurb: "Choose the precise meaning of a word or phrase from how it's used.",
        reportingCategory: "cs",
      },
      {
        id: "satrw-textstructure",
        name: "Blueprint Reader",
        blurb: "Analyze how a text is built and why the author structured it that way.",
        reportingCategory: "cs",
      },
      {
        id: "satrw-purpose",
        name: "Author's Angle",
        blurb: "Identify an author's purpose and the rhetorical choices behind it.",
        reportingCategory: "cs",
      },
      {
        id: "satrw-crosstext",
        name: "Paired Passage Bridge",
        blurb: "Compare and connect ideas across two related passages.",
        reportingCategory: "cs",
      },
      {
        id: "satrw-figurative",
        name: "Figure It Out",
        blurb: "Interpret figurative language and tone in context.",
        reportingCategory: "cs",
      },

      // --- Expression of Ideas (~20%) ---
      {
        id: "satrw-transitions",
        name: "Transition Tracker",
        blurb: "Choose the transition word or phrase that best connects two ideas.",
        reportingCategory: "eoi",
      },
      {
        id: "satrw-rhetoricalsynth",
        name: "Bullet Point Builder",
        blurb: "Combine notes into one sentence that meets a specific rhetorical goal.",
        reportingCategory: "eoi",
      },
      {
        id: "satrw-organization",
        name: "Logical Order",
        blurb: "Revise sentence and paragraph order for the clearest logic.",
        reportingCategory: "eoi",
      },

      // --- Standard English Conventions (~26%) ---
      {
        id: "satrw-boundaries",
        name: "Sentence Boundaries",
        blurb: "Fix fragments, run-ons, and comma splices.",
        reportingCategory: "sec",
      },
      {
        id: "satrw-punctuation",
        name: "Punctuation Precision",
        blurb: "Apply commas, semicolons, colons, and dashes correctly within a sentence.",
        reportingCategory: "sec",
      },
      {
        id: "satrw-agreement",
        name: "Agreement Check",
        blurb: "Match subjects with verbs and pronouns with their antecedents.",
        reportingCategory: "sec",
      },
      {
        id: "satrw-verbforms",
        name: "Verb Form Fix",
        blurb: "Choose the correct verb tense, form, and modifier placement.",
        reportingCategory: "sec",
      },
    ],
  },
  {
    id: "sat-math",
    name: "Math",
    place: "Function Fields",
    color: "#e07a5f",
    colorDark: "#b3563e",
    bg: "#fdeee9",
    icon: "📐",
    blurb: "Algebra, problem-solving, and data analysis, SAT-style.",
    skills: [
      // --- Algebra (~35%) ---
      {
        id: "satmath-linear1var",
        name: "Equation Solver",
        blurb: "Solve linear equations in one variable.",
        reportingCategory: "algebra",
      },
      {
        id: "satmath-linearfunc",
        name: "Line Reader",
        blurb: "Interpret and build linear functions from tables, graphs, and words.",
        reportingCategory: "algebra",
      },
      {
        id: "satmath-linear2var",
        name: "Graph Plotter",
        blurb: "Work with linear equations in two variables and their graphs.",
        reportingCategory: "algebra",
      },
      {
        id: "satmath-systems",
        name: "Crossing Point",
        blurb: "Solve systems of two linear equations in two variables.",
        reportingCategory: "algebra",
      },
      {
        id: "satmath-linineq",
        name: "Boundary Setter",
        blurb: "Solve and graph linear inequalities in one or two variables.",
        reportingCategory: "algebra",
      },

      // --- Advanced Math (~35%) ---
      {
        id: "satmath-nonlinearfunc",
        name: "Curve Shaper",
        blurb: "Analyze nonlinear functions, including quadratics and exponentials.",
        reportingCategory: "advmath",
      },
      {
        id: "satmath-nonlineareq",
        name: "Root Finder",
        blurb: "Solve nonlinear equations and systems pairing a line with a curve.",
        reportingCategory: "advmath",
      },
      {
        id: "satmath-equivexpr",
        name: "Expression Rebuilder",
        blurb: "Rewrite and simplify expressions into equivalent forms.",
        reportingCategory: "advmath",
      },

      // --- Problem-Solving and Data Analysis (~15%) ---
      {
        id: "satmath-ratios",
        name: "Rate Tracker",
        blurb: "Solve problems involving ratios, rates, proportions, and unit conversions.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-percentages",
        name: "Percent Play",
        blurb: "Apply percentages, percent change, and percent error.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-onevardata",
        name: "Spread Sense",
        blurb: "Describe a single data set's center, spread, and shape.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-twovardata",
        name: "Scatter Scout",
        blurb: "Interpret models and scatterplots relating two variables.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-probability",
        name: "Odds Maker",
        blurb: "Calculate probability and conditional probability.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-inference",
        name: "Sample Says",
        blurb: "Draw conclusions from sample statistics and margin of error.",
        reportingCategory: "psda",
      },
      {
        id: "satmath-statclaims",
        name: "Study Skeptic",
        blurb: "Evaluate statistical claims from observational studies and experiments.",
        reportingCategory: "psda",
      },

      // --- Geometry and Trigonometry (~15%) ---
      {
        id: "satmath-areavolume",
        name: "Space Filler",
        blurb: "Calculate area, surface area, and volume.",
        reportingCategory: "geotrig",
      },
      {
        id: "satmath-linesangles",
        name: "Angle Chase",
        blurb: "Work with lines, angles, and triangle relationships.",
        reportingCategory: "geotrig",
      },
      {
        id: "satmath-righttri",
        name: "Triangle Ratios",
        blurb: "Apply right-triangle relationships and trigonometric ratios.",
        reportingCategory: "geotrig",
      },
      {
        id: "satmath-circles",
        name: "Circle Logic",
        blurb: "Solve problems involving circles: arcs, angles, and equations.",
        reportingCategory: "geotrig",
      },
    ],
  },
];
