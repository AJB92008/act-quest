// Cross-subject, cross-skill *question patterns* — a second axis of
// classification alongside skill/subject, aimed at answering a different
// question than "which skill is this player weak at?" A player can be
// individually fine at re-claims, sc-evaluate, en-fragments, and still
// reliably stumble on any question that happens to hinge on a NOT/EXCEPT
// inversion, because that's a *pattern* that cuts across skill boundaries,
// not a skill itself. getWeakSkills() (state.js) can't see that; the
// functions in this file can.
//
// Patterns are detected heuristically from each question's own stem/choice
// text — there's no hand-authored tagging step to keep in sync as the bank
// grows, matching how questionDifficulty() in index.js is also a derived
// proxy rather than a hand-entered rating. Same honesty applies: these are
// pattern *signals*, not a verified taxonomy.
export const PATTERN_DEFS = {
  negationTrap: {
    label: "Negation traps (NOT/EXCEPT/LEAST)",
    hint: "Questions that invert the usual logic: the right answer is the one that DOESN'T fit.",
  },
  vocabInContext: {
    label: "Vocabulary in context",
    hint: "\"Most nearly means\" questions: context clues, not dictionary definitions.",
  },
  inference: {
    label: "Inference & generalization",
    hint: "Reading between the lines rather than finding an explicit answer.",
  },
  evidenceStrengthenWeaken: {
    label: "Evaluating evidence",
    hint: "Judging whether a claim is well supported, or what would strengthen/weaken it.",
  },
  pairedSource: {
    label: "Comparing two sources",
    hint: "Paired passages or competing viewpoints: synthesizing across two texts, not just one.",
  },
  dataTableReading: {
    label: "Reading tables & figures",
    hint: "Pulling specific values out of a table, figure, or experiment description.",
  },
  rhetoricalEffect: {
    label: "Tone & rhetorical effect",
    hint: "Why an author made a specific stylistic or structural choice.",
  },
  computation: {
    label: "Multi-step computation",
    hint: "Getting to the answer takes actual arithmetic, not just recognition.",
  },
};

const DETECTORS = [
  { id: "negationTrap", test: (q) => /\b(NOT|EXCEPT|LEAST)\b/.test(q.q) },
  { id: "vocabInContext", test: (q) => /most nearly means/i.test(q.q) },
  { id: "inference", test: (q) => /\b(can (reasonably )?be inferred|it can be assumed|most likely (that|means))\b/i.test(q.q) },
  { id: "evidenceStrengthenWeaken", test: (q) => /(if true, would|well supported|strengthen|weaken|is this claim)/i.test(q.q) },
  {
    id: "pairedSource",
    test: (q) => /(Passage [AB]\b|Scientist [12]\b|Researcher [12]\b|Paleontologist [12]\b)/.test(q.q),
  },
  { id: "dataTableReading", test: (q) => /according to (the )?(table|figure|experiment)/i.test(q.q) },
  { id: "rhetoricalEffect", test: (q) => /\b(rhetorical|tone|effect of)\b/i.test(q.q) },
  {
    id: "computation",
    // Numeric choices alone matched ~90% of every Math question (real
    // count, checked against the loaded banks) — useless as a *pattern*
    // signal since it was really just re-detecting "this is Math" with
    // extra steps, and Weak Skill Review already gives that read at the
    // skill level. Requiring a longer stem too (calibrated against the
    // banks' actual length distribution, not guessed) narrows it to
    // roughly the longest third of Math/Science questions — the ones
    // with enough setup to plausibly need more than one step — while
    // leaving English/Reading's rare qualifying items alone.
    test: (q) => Array.isArray(q.choices) && q.choices.length > 0 && q.choices.every((c) => /\d/.test(c)) && q.q.length >= 75,
  },
];

/** Every pattern id a question matches (usually 0-2, occasionally more). */
export function getQuestionPatterns(q) {
  return DETECTORS.filter((d) => d.test(q)).map((d) => d.id);
}
