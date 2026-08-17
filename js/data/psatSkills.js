// Skill-tree definition for the PSAT/NMSQT's Reading and Writing section —
// same shape data/skills.js and data/satSkills.js use (see either file's
// own header comment for the general pattern this mirrors), just for the
// PSAT planet instead (see data/tests.js).
//
// The digital PSAT/NMSQT's Reading and Writing section tests the exact
// same four content domains, in the same two-module/54-question structure
// (32 minutes per 27-question module), as the digital SAT's own R&W
// section — College Board's own published specs define PSAT/NMSQT and SAT
// Reading and Writing as covering identical skills and knowledge, just
// calibrated to a slightly easier difficulty band for the 10th/11th-grade
// PSAT/NMSQT population rather than a different set of skills entirely.
// So rather than inventing a separate skill list that wouldn't reflect
// what the real exam actually tests, this tree mirrors data/satSkills.js's
// sat-rw domain breakdown skill-for-skill (same 17 skills, same 5/5/3/4
// split across the four domains), under new psatrw- prefixed ids so every
// skill id still stays globally unique across every planet.
//
// This is infrastructure only, the same "tree before content" stage
// sat-rw and sat-math both went through before their question banks were
// written: a real skill tree exists here so the World Map/island/
// skill-path screens have something real to navigate, but no lesson/
// question content is behind any of it yet — see data/tests.js's
// `contentPending: true` on the psat-rw subject this feeds.
export const PSAT_REPORTING_CATEGORIES = {
  "psat-rw": [
    { id: "ii", name: "Information and Ideas", weight: 0.26 },
    { id: "cs", name: "Craft and Structure", weight: 0.28 },
    { id: "eoi", name: "Expression of Ideas", weight: 0.2 },
    { id: "sec", name: "Standard English Conventions", weight: 0.26 },
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
    blurb: "Passage reading, vocabulary, rhetoric, and grammar, PSAT/NMSQT-style. Skill tree is ready; lessons and questions are still being written.",
    contentPending: true,
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
];
