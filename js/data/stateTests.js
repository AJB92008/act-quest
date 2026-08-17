// Data for the State Assessments planet's per-state flow: unlike ACT/SAT/
// PSAT (each one fixed, global test), "state testing" isn't one test at
// all — every state mandates its own standardized assessment program, so
// this planet's islands depend on which state the player actually lives
// in. The flow (see ui/statePicker.js and worldMap.js's own handling of
// testId "stateAssessments"): picking a planet with no home state set yet
// redirects to a one-time state picker; once gameState.homeState is set,
// the World Map shows that state's own two islands (ELA + Math) instead
// of a generic placeholder.
//
// Every program name below is that state's real, currently-published K-12
// summative assessment (the equivalent of a single number for what's
// usually a small family of grade-band exams under one brand) — sourced
// from each state Department of Education's own current branding. States
// rename/replace these programs every several years (STAAR, FAST, and
// Smarter Balanced are all rebrands of older programs themselves), so
// treat this as "the well-known, stable name as of when this was written,"
// the same honesty caveat this app already applies to ACT's score curves
// and percentile tables in state.js — not a live feed of each state DOE's
// current site.
//
// This is infrastructure only: every subject below has `skills: []`, so
// isSubjectPlayable() (data/tests.js) reports every one of them as
// "coming soon" — same transitional stage state-ela/state-math started
// in before this file existed, just now split out per state with its own
// real program name instead of one generic placeholder pair.
const STATE_PROGRAMS = [
  ["AL", "Alabama", "ACAP"],
  ["AK", "Alaska", "AK STAR"],
  ["AZ", "Arizona", "AASA"],
  ["AR", "Arkansas", "ATLAS"],
  ["CA", "California", "CAASPP"],
  ["CO", "Colorado", "CMAS"],
  ["CT", "Connecticut", "CT Summative Assessments"],
  ["DE", "Delaware", "DeSSA"],
  ["FL", "Florida", "FAST"],
  ["GA", "Georgia", "Georgia Milestones"],
  ["HI", "Hawaii", "HSA"],
  ["ID", "Idaho", "ISAT"],
  ["IL", "Illinois", "IAR"],
  ["IN", "Indiana", "ILEARN"],
  ["IA", "Iowa", "ISASP"],
  ["KS", "Kansas", "KAP"],
  ["KY", "Kentucky", "KSA"],
  ["LA", "Louisiana", "LEAP 2025"],
  ["ME", "Maine", "MEA"],
  ["MD", "Maryland", "MCAP"],
  ["MA", "Massachusetts", "MCAS"],
  ["MI", "Michigan", "M-STEP"],
  ["MN", "Minnesota", "MCA"],
  ["MS", "Mississippi", "MAAP"],
  ["MO", "Missouri", "MAP"],
  ["MT", "Montana", "MontCAS"],
  ["NE", "Nebraska", "NSCAS"],
  ["NV", "Nevada", "Nevada SBAC"],
  ["NH", "New Hampshire", "NH SAS"],
  ["NJ", "New Jersey", "NJSLA"],
  ["NM", "New Mexico", "NM-MSSA"],
  ["NY", "New York", "NYS Testing Program"],
  ["NC", "North Carolina", "NC EOG/EOC"],
  ["ND", "North Dakota", "NDSA"],
  ["OH", "Ohio", "Ohio State Tests"],
  ["OK", "Oklahoma", "OSTP"],
  ["OR", "Oregon", "OSAS"],
  ["PA", "Pennsylvania", "PSSA"],
  ["RI", "Rhode Island", "RICAS"],
  ["SC", "South Carolina", "SC READY"],
  ["SD", "South Dakota", "SD STARS"],
  ["TN", "Tennessee", "TCAP"],
  ["TX", "Texas", "STAAR"],
  ["UT", "Utah", "RISE"],
  ["VT", "Vermont", "VTCAP"],
  ["VA", "Virginia", "SOL"],
  ["WA", "Washington", "Smarter Balanced"],
  ["WV", "West Virginia", "WVGSA"],
  ["WI", "Wisconsin", "Forward Exam"],
  ["WY", "Wyoming", "WY-TOPP"],
];

export const STATES = STATE_PROGRAMS.map(([abbr, name]) => ({ abbr, name }));
export const STATE_ABBRS = new Set(STATES.map((s) => s.abbr));

export function getState(abbr) {
  return STATES.find((s) => s.abbr === abbr);
}

// Every ELA island uses the same color/icon across every state (and every
// Math island its own shared pair) rather than 50 hand-picked palettes —
// a player looking at any state's map can tell an ELA island from a Math
// one by color alone, same as a legend, and it keeps this file's real
// content (the program names) the thing that actually varies per state.
const ELA_STYLE = { color: "#3d8f5f", colorDark: "#296b44", bg: "#e9f6ee", icon: "📖" };
const MATH_STYLE = { color: "#4a7fc9", colorDark: "#2f5a99", bg: "#eaf1fb", icon: "🧮" };

export const STATE_SUBJECTS = {};
for (const [abbr, name, program] of STATE_PROGRAMS) {
  const idPrefix = `state-${abbr.toLowerCase()}`;
  STATE_SUBJECTS[abbr] = [
    {
      id: `${idPrefix}-ela`,
      name: `${program} ELA`,
      place: name,
      ...ELA_STYLE,
      blurb: `${name}'s ${program} English Language Arts assessment — coming soon.`,
      skills: [],
    },
    {
      id: `${idPrefix}-math`,
      name: `${program} Math`,
      place: name,
      ...MATH_STYLE,
      blurb: `${name}'s ${program} Mathematics assessment — coming soon.`,
      skills: [],
    },
  ];
}

export function getStateSubjects(abbr) {
  return STATE_SUBJECTS[abbr] || [];
}

// Every state's subjects flattened — folded into the "stateAssessments"
// planet's own `subjects` list in data/tests.js so every state-specific
// subject id is globally discoverable via getSubject()/getSkill()/
// allSubjects() like any other planet's, the one hard rule for extending
// a planet (see that file's header comment). The World Map/Dashboard
// screens still only ever *display* the player's own chosen state's two
// islands (via getStateSubjects/gameState.homeState) — this flat list is
// for that cross-planet bookkeeping, not for rendering all 50 states at once.
export const ALL_STATE_SUBJECTS = Object.values(STATE_SUBJECTS).flat();
