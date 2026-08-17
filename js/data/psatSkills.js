// Skill-tree definitions for the PSAT/NMSQT's Reading and Writing and Math
// sections — same shape data/skills.js and data/satSkills.js use (see
// either file's own header comment for the general pattern this mirrors),
// just for the PSAT planet instead (see data/tests.js).
//
// Both sections test the exact same content domains, in the same
// two-module structure, as their digital SAT counterparts — College
// Board's own published specs define PSAT/NMSQT and SAT as covering
// identical skills and knowledge per section, just calibrated to a
// slightly easier difficulty band for the 10th/11th-grade PSAT/NMSQT
// population rather than a different set of skills entirely. So rather
// than inventing separate skill lists that wouldn't reflect what the real
// exam actually tests, both trees below mirror data/satSkills.js's own
// domain breakdowns skill-for-skill:
//   - psat-rw: sat-rw's 17 skills, 5/5/3/4 split across its four domains,
//     under new psatrw- prefixed ids.
//   - psat-math: sat-math's 19 skills, 5/3/7/4 split across its four
//     domains, under new psatmath- prefixed ids.
// New ids keep every skill id globally unique across every planet.
//
// Question content for both subjects lives in data/questions/psatRw.js and
// data/questions/psatMath.js (a full 100-question bank per skill each,
// same as sat-rw's and sat-math's own banks) — freshly generated for
// PSAT/NMSQT's easier difficulty band rather than reworded/reused from the
// SAT banks, per each of those files' own header comments.
export const PSAT_REPORTING_CATEGORIES = {
  "psat-rw": [
    { id: "ii", name: "Information and Ideas", weight: 0.26 },
    { id: "cs", name: "Craft and Structure", weight: 0.28 },
    { id: "eoi", name: "Expression of Ideas", weight: 0.2 },
    { id: "sec", name: "Standard English Conventions", weight: 0.26 },
  ],
  "psat-math": [
    { id: "algebra", name: "Algebra", weight: 0.35 },
    { id: "advmath", name: "Advanced Math", weight: 0.35 },
    { id: "psda", name: "Problem-Solving and Data Analysis", weight: 0.15 },
    { id: "geotrig", name: "Geometry and Trigonometry", weight: 0.15 },
  ],
};

export const PSAT_SUBJECTS = [
  {
    id: "psat-rw",
    name: "Reading & Writing",
    place: "Preface Point",
    color: "#8d6ae8",
    colorDark: "#5f3fc4",
    bg: "#f2eefd",
    icon: "📗",
    blurb: "Passage reading, vocabulary, rhetoric, and grammar, PSAT/NMSQT-style.",
    skills: [
      // --- Information and Ideas (~26%) ---
      {
        id: "psatrw-centralidea",
        name: "Core Idea Finder",
        blurb: "Pin down a text's central idea and the details that support it.",
        reportingCategory: "ii",
      },
      {
        id: "psatrw-evidence-text",
        name: "Evidence Hunter",
        blurb: "Find the textual evidence that best supports or weakens a claim.",
        reportingCategory: "ii",
      },
      {
        id: "psatrw-evidence-data",
        name: "Chart Reader",
        blurb: "Match claims to data in tables, bar graphs, and line graphs.",
        reportingCategory: "ii",
      },
      {
        id: "psatrw-inference",
        name: "Read Between the Lines",
        blurb: "Draw logical inferences a text implies but never states outright.",
        reportingCategory: "ii",
      },
      {
        id: "psatrw-detailsort",
        name: "Detail Sorter",
        blurb: "Separate the details that actually support a claim from ones that just sound related.",
        reportingCategory: "ii",
      },

      // --- Craft and Structure (~28%) ---
      {
        id: "psatrw-wordsincontext",
        name: "Context Clues",
        blurb: "Choose the precise meaning of a word or phrase from how it's used.",
        reportingCategory: "cs",
      },
      {
        id: "psatrw-textstructure",
        name: "Blueprint Reader",
        blurb: "Analyze how a text is built and why the author structured it that way.",
        reportingCategory: "cs",
      },
      {
        id: "psatrw-purpose",
        name: "Author's Angle",
        blurb: "Identify an author's purpose and the rhetorical choices behind it.",
        reportingCategory: "cs",
      },
      {
        id: "psatrw-crosstext",
        name: "Paired Passage Bridge",
        blurb: "Compare and connect ideas across two related passages.",
        reportingCategory: "cs",
      },
      {
        id: "psatrw-figurative",
        name: "Figure It Out",
        blurb: "Interpret figurative language and tone in context.",
        reportingCategory: "cs",
      },

      // --- Expression of Ideas (~20%) ---
      {
        id: "psatrw-transitions",
        name: "Transition Tracker",
        blurb: "Choose the transition word or phrase that best connects two ideas.",
        reportingCategory: "eoi",
      },
      {
        id: "psatrw-rhetoricalsynth",
        name: "Bullet Point Builder",
        blurb: "Combine notes into one sentence that meets a specific rhetorical goal.",
        reportingCategory: "eoi",
      },
      {
        id: "psatrw-organization",
        name: "Logical Order",
        blurb: "Revise sentence and paragraph order for the clearest logic.",
        reportingCategory: "eoi",
      },

      // --- Standard English Conventions (~26%) ---
      {
        id: "psatrw-boundaries",
        name: "Sentence Boundaries",
        blurb: "Fix fragments, run-ons, and comma splices.",
        reportingCategory: "sec",
      },
      {
        id: "psatrw-punctuation",
        name: "Punctuation Precision",
        blurb: "Apply commas, semicolons, colons, and dashes correctly within a sentence.",
        reportingCategory: "sec",
      },
      {
        id: "psatrw-agreement",
        name: "Agreement Check",
        blurb: "Match subjects with verbs and pronouns with their antecedents.",
        reportingCategory: "sec",
      },
      {
        id: "psatrw-verbforms",
        name: "Verb Form Fix",
        blurb: "Choose the correct verb tense, form, and modifier placement.",
        reportingCategory: "sec",
      },
    ],
  },
  {
    id: "psat-math",
    name: "Math",
    place: "Starter Slopes",
    color: "#e6a13c",
    colorDark: "#b87a1f",
    bg: "#fdf2e2",
    icon: "📏",
    blurb: "Algebra, problem-solving, and data analysis, PSAT/NMSQT-style.",
    skills: [
      // --- Algebra (~35%) ---
      {
        id: "psatmath-linear1var",
        name: "Equation Solver",
        blurb: "Solve linear equations in one variable.",
        reportingCategory: "algebra",
      },
      {
        id: "psatmath-linearfunc",
        name: "Line Reader",
        blurb: "Interpret and build linear functions from tables, graphs, and words.",
        reportingCategory: "algebra",
      },
      {
        id: "psatmath-linear2var",
        name: "Graph Plotter",
        blurb: "Work with linear equations in two variables and their graphs.",
        reportingCategory: "algebra",
      },
      {
        id: "psatmath-systems",
        name: "Crossing Point",
        blurb: "Solve systems of two linear equations in two variables.",
        reportingCategory: "algebra",
      },
      {
        id: "psatmath-linineq",
        name: "Boundary Setter",
        blurb: "Solve and graph linear inequalities in one or two variables.",
        reportingCategory: "algebra",
      },

      // --- Advanced Math (~35%) ---
      {
        id: "psatmath-nonlinearfunc",
        name: "Curve Shaper",
        blurb: "Analyze nonlinear functions, including quadratics and exponentials.",
        reportingCategory: "advmath",
      },
      {
        id: "psatmath-nonlineareq",
        name: "Root Finder",
        blurb: "Solve nonlinear equations and systems pairing a line with a curve.",
        reportingCategory: "advmath",
      },
      {
        id: "psatmath-equivexpr",
        name: "Expression Rebuilder",
        blurb: "Rewrite and simplify expressions into equivalent forms.",
        reportingCategory: "advmath",
      },

      // --- Problem-Solving and Data Analysis (~15%) ---
      {
        id: "psatmath-ratios",
        name: "Rate Tracker",
        blurb: "Solve problems involving ratios, rates, proportions, and unit conversions.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-percentages",
        name: "Percent Play",
        blurb: "Apply percentages, percent change, and percent error.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-onevardata",
        name: "Spread Sense",
        blurb: "Describe a single data set's center, spread, and shape.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-twovardata",
        name: "Scatter Scout",
        blurb: "Interpret models and scatterplots relating two variables.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-probability",
        name: "Odds Maker",
        blurb: "Calculate probability and conditional probability.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-inference",
        name: "Sample Says",
        blurb: "Draw conclusions from sample statistics and margin of error.",
        reportingCategory: "psda",
      },
      {
        id: "psatmath-statclaims",
        name: "Study Skeptic",
        blurb: "Evaluate statistical claims from observational studies and experiments.",
        reportingCategory: "psda",
      },

      // --- Geometry and Trigonometry (~15%) ---
      {
        id: "psatmath-areavolume",
        name: "Space Filler",
        blurb: "Calculate area, surface area, and volume.",
        reportingCategory: "geotrig",
      },
      {
        id: "psatmath-linesangles",
        name: "Angle Chase",
        blurb: "Work with lines, angles, and triangle relationships.",
        reportingCategory: "geotrig",
      },
      {
        id: "psatmath-righttri",
        name: "Triangle Ratios",
        blurb: "Apply right-triangle relationships and trigonometric ratios.",
        reportingCategory: "geotrig",
      },
      {
        id: "psatmath-circles",
        name: "Circle Logic",
        blurb: "Solve problems involving circles: arcs, angles, and equations.",
        reportingCategory: "geotrig",
      },
    ],
  },
];
