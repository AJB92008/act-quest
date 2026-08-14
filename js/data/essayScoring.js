// Heuristic auto-grader for the optional Writing section. There's no
// backend or model in this app to call a real language model for grading
// (a static site can't hide an API key client-side, and a paid grading
// call is real infrastructure this project doesn't have) — this instead
// scores each of the real ACT's four Writing domains from signals in the
// essay text itself: paragraph/sentence structure, transition and evidence
// markers, vocabulary variety, and how much the essay actually engages
// with the prompt's three given perspectives. It's a genuine algorithm,
// not a placeholder, but it's still a text-heuristic proxy for writing
// quality, not real language understanding — the UI labels it as an
// automated estimate rather than implying a human (or real AI) read it,
// and returns the specific signals it found so a player can see *why* it
// scored what it scored instead of trusting an opaque number.
const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","as","is","are","was","were","be","been","being",
  "this","that","these","those","it","its","at","by","from","into","than","then","so","not","no","if","because",
  "their","they","them","his","her","he","she","you","your","we","our","i","my","me","also","can","could","should",
  "would","will","just","about","which","who","what","when","where","how","have","has","had","do","does","did",
]);

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function paragraphs(text) {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function words(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function distinctiveWords(text, count = 5) {
  return [...new Set(words(text).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")))]
    .filter((w) => w.length >= 6 && !STOPWORDS.has(w))
    .sort((a, b) => b.length - a.length)
    .slice(0, count);
}

function stdev(nums) {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

const OWN_STANCE_RE = /\b(I believe|I think|in my (opinion|view)|my (view|position|perspective) is)\b/i;
const COUNTERARGUMENT_RE = /\b(however|although|while|on the other hand|some (might|may|could) argue|it could be argued|others (believe|argue|think|claim))\b/i;
const EVIDENCE_MARKER_RE = /\b(for example|for instance|such as|specifically|this shows|this demonstrates|as a result|which means)\b/gi;
const TRANSITION_START_RE = /^(first|second|third|next|additionally|furthermore|moreover|however|in addition|meanwhile|overall|ultimately|finally|in conclusion|to conclude|in summary|on the other hand|consequently|therefore)\b/i;
const CONCLUSION_RE = /\b(in conclusion|overall|ultimately|in summary|to conclude|in the end)\b/i;

function clamp16(n) {
  return Math.max(1, Math.min(6, Math.round(n)));
}

function scoreIdeas(text, prompt) {
  const lower = text.toLowerCase();
  const perspectivesEngaged = (prompt?.perspectives || []).filter((p) => {
    // Two independent ways an essay shows it's engaging with a specific
    // given perspective: naming it directly ("Perspective One argues...",
    // "the first perspective") the way the real prompt format invites, or
    // echoing enough of its actual substance (distinctive words from its
    // argument text) to be clearly responding to it without naming it.
    // Either counts — a strong essay might do only one of these per
    // perspective and still genuinely be engaging with it.
    const namedDirectly = lower.includes(p.label.toLowerCase());
    if (namedDirectly) return true;
    const keywords = distinctiveWords(p.text, 4);
    if (keywords.length === 0) return false;
    const hits = keywords.filter((k) => lower.includes(k)).length;
    return hits >= 1;
  }).length;
  const hasOwnStance = OWN_STANCE_RE.test(text);
  const hasCounterargument = COUNTERARGUMENT_RE.test(text);
  const wc = words(text).length;

  let score = 1;
  if (perspectivesEngaged >= 2) score += 2;
  else if (perspectivesEngaged === 1) score += 1;
  if (hasOwnStance) score += 1;
  if (hasCounterargument) score += 1;
  if (wc >= 250) score += 1;

  return {
    score: clamp16(score),
    signals: [
      `Engaged with ${perspectivesEngaged} of ${prompt?.perspectives?.length || 3} given perspectives`,
      hasOwnStance ? "States a clear personal position" : "No clear \"I believe\"/\"my view\"-style stance found",
      hasCounterargument ? "Acknowledges a counterargument or complication" : "No counterargument/complication language found",
    ],
  };
}

function scoreDevelopment(text) {
  const wc = words(text).length;
  const sents = sentences(text);
  const avgSentenceLen = sents.length > 0 ? wc / sents.length : 0;
  const evidenceMarkers = (text.match(EVIDENCE_MARKER_RE) || []).length;

  let score = 1;
  score += Math.min(2, evidenceMarkers);
  if (avgSentenceLen >= 12) score += 1;
  if (wc >= 300) score += 2;
  else if (wc >= 150) score += 1;

  return {
    score: clamp16(score),
    signals: [
      `${evidenceMarkers} evidence/example marker${evidenceMarkers === 1 ? "" : "s"} found (e.g. "for example", "this shows")`,
      `${wc} words total`,
      `Average sentence length: ${avgSentenceLen.toFixed(1)} words`,
    ],
  };
}

function scoreOrganization(text) {
  const paras = paragraphs(text);
  const paraCount = paras.length;
  const transitionParas = paras.slice(1).filter((p) => TRANSITION_START_RE.test(p.trim())).length;
  const transitionRatio = paras.length > 1 ? transitionParas / (paras.length - 1) : 0;
  const hasConclusion = paras.length > 0 && CONCLUSION_RE.test(paras[paras.length - 1]);

  let score = 1;
  if (paraCount >= 4) score += 2;
  else if (paraCount >= 3) score += 1;
  if (transitionRatio >= 0.5) score += 1;
  if (hasConclusion) score += 1;
  if (paraCount >= 2) score += 1;

  return {
    score: clamp16(score),
    signals: [
      `${paraCount} paragraph${paraCount === 1 ? "" : "s"} detected`,
      `Transition words open ${Math.round(transitionRatio * 100)}% of body/closing paragraphs`,
      hasConclusion ? "Closing paragraph signals a conclusion" : "No clear conclusion signal in the final paragraph",
    ],
  };
}

function scoreLanguage(text) {
  const sents = sentences(text);
  const lens = sents.map((s) => words(s).length);
  const lenVariety = stdev(lens);
  const allWords = words(text).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
  const uniqueRatio = allWords.length > 0 ? new Set(allWords).size / allWords.length : 0;
  const properEndCount = sents.filter((s) => /[.!?]['"]?$/.test(s.trim())).length;
  const properEndRatio = sents.length > 0 ? properEndCount / sents.length : 0;
  const longSentences = lens.filter((n) => n > 40).length;

  let score = 1;
  if (lenVariety >= 4) score += 1;
  if (uniqueRatio >= 0.45) score += 2;
  else if (uniqueRatio >= 0.35) score += 1;
  if (properEndRatio >= 0.9) score += 1;
  // Zero long sentences is only a good sign if there were sentences to
  // begin with — an empty draft trivially has "no run-on sentences" and
  // shouldn't get credit for it.
  if (sents.length > 0 && longSentences === 0) score += 1;

  return {
    score: clamp16(score),
    signals: [
      `Sentence length variety (word-count std. dev.): ${lenVariety.toFixed(1)}`,
      `Vocabulary variety: ${Math.round(uniqueRatio * 100)}% of words are unique`,
      longSentences > 0 ? `${longSentences} very long sentence${longSentences === 1 ? "" : "s"} (40+ words) found` : "No run-on-length sentences found",
    ],
  };
}

/** Scores an essay draft against the same four domains the real ACT
 * Writing test reports on, purely from signals in the text — no rater,
 * human or otherwise, involved. Returns `{ domainScores, signals }`, where
 * `domainScores` is `{ ideas, development, organization, language }` (each
 * 1-6, matching the scale a single real-test rater uses) and `signals` is
 * the same shape but with the human-readable evidence behind each score,
 * for the results screen to show its work instead of a black-box number. */
export function scoreEssay(text, prompt) {
  const ideas = scoreIdeas(text, prompt);
  const development = scoreDevelopment(text);
  const organization = scoreOrganization(text);
  const language = scoreLanguage(text);
  return {
    domainScores: {
      ideas: ideas.score,
      development: development.score,
      organization: organization.score,
      language: language.score,
    },
    signals: {
      ideas: ideas.signals,
      development: development.signals,
      organization: organization.signals,
      language: language.signals,
    },
  };
}
