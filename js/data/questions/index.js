import { SUBJECTS, allSkillIds, REPORTING_CATEGORIES } from "../skills.js";
import { getQuestionPatterns, PATTERN_DEFS } from "./patterns.js";

// Each skill's bank is chunked into fixed-size mini-lessons — bite-sized
// stops on that skill's path rather than one long quiz — matching how
// "Teach Your Monster" paces its games.
export const LESSON_SIZE = 5;

// Most skills' question banks are exactly 100 questions, so lesson count is
// normally a fixed constant rather than something derived from the loaded
// bank's length. That matters beyond just avoiding a redundant computation:
// it means `getLessonCount` — called constantly from state.js's mastery
// tracking and from every skill-path/island screen — never needs a
// subject's question data loaded at all, which is what makes lazy-loading
// each subject's ~300-600KB file (only when the player actually heads
// toward it) possible without a much bigger rewrite of the UI layer.
//
// A handful of skills have since been extended with bonus lessons beyond
// the original 100 — this map records each one's real bank size by hand
// (kept in sync with the actual data file whenever a skill is extended) so
// getLessonCount can still answer correctly without loading anything.
// Anything not listed here is assumed to be the standard 100.
const BANK_SIZE_OVERRIDES = {
  "en-commas": 105,
  "en-apostrophes": 105,
  "en-colons": 105,
  "en-semicolons": 105,
  "en-dashes": 105,
  "en-endpunct": 105,
  "en-subobjpronouns": 105,
  "en-thatwho": 105,
  "en-pronounagreement": 105,
  "en-ambiguous": 105,
  "en-verbtense": 105,
  "en-svagreement": 105,
  "en-comparisons": 105,
  "en-wordchoice": 105,
  "en-idioms": 105,
  "en-verbalphrases": 105,
  "en-fragments": 105,
  "en-parallel": 105,
  "en-modifiers": 105,
  "en-transitions": 105,
  "en-concision": 105,
  "en-tone": 105,
  "re-mainidea": 140,
  "re-detail": 140,
  "re-sequence": 140,
  "re-compare": 140,
  "re-causeeffect": 140,
  "re-vocab": 140,
  "re-generalize": 140,
  "re-voice": 140,
  "re-claims": 140,
  "re-integrate": 140,
  "sc-datarep": 140,
  "sc-interpret": 140,
  "sc-research": 140,
  "sc-investigation": 140,
  "sc-conflicting": 140,
  "sc-evaluate": 140,
};
const KNOWN_SKILL_IDS = new Set(allSkillIds());

export function getLessonCount(skillId) {
  if (!KNOWN_SKILL_IDS.has(skillId)) return 1;
  return Math.ceil((BANK_SIZE_OVERRIDES[skillId] ?? 100) / LESSON_SIZE);
}

// skillId -> { skillName, subjectId }, built once from the skill tree —
// this never needs question data, just the (tiny, always-loaded) skill
// tree in data/skills.js.
const SKILL_META = {};
// skillId -> reportingCategory id, same construction — feeds the
// Practice Test's category-proportional sampling and score breakdown
// below without needing question data loaded either.
const SKILL_CATEGORY = {};
for (const subject of SUBJECTS) {
  subject.skills.forEach((skill) => {
    SKILL_META[skill.id] = { skillName: skill.name, subjectId: subject.id };
    SKILL_CATEGORY[skill.id] = skill.reportingCategory;
  });
}

// The four question banks are the large part of this app's payload (each
// several hundred KB to over a megabyte for English) — loading all of them
// upfront, before the player has even picked an island, was pure waste on
// first paint. Each is now fetched via dynamic import() only once the
// player actually heads toward that subject, and cached here after that.
const SUBJECT_LOADERS = {
  english: () => import("./english.js").then((m) => ({ questions: m.english })),
  math: () => import("./math.js").then((m) => ({ questions: m.math })),
  reading: () => import("./reading.js").then((m) => ({ questions: m.reading, passages: m.passages })),
  science: () => import("./science.js").then((m) => ({ questions: m.science, stimuli: m.stimuli })),
};

const loadedSubjects = {}; // subjectId -> { questions, passages?, stimuli? }
const loadingPromises = {}; // subjectId -> in-flight promise, so concurrent callers share one fetch

// Kicks off (or reuses) a subject's data fetch and resolves once it's
// cached. Safe to call repeatedly/redundantly — screens call this as soon
// as the player heads toward a subject (e.g. opening its island) so the
// fetch has a head start in the background while they browse, well before
// they actually need a question rendered.
export function preloadSubject(subjectId) {
  if (loadedSubjects[subjectId]) return Promise.resolve(loadedSubjects[subjectId]);
  if (!loadingPromises[subjectId]) {
    const loader = SUBJECT_LOADERS[subjectId];
    if (!loader) return Promise.resolve(null);
    loadingPromises[subjectId] = loader().then((entry) => {
      loadedSubjects[subjectId] = entry;
      return entry;
    });
  }
  return loadingPromises[subjectId];
}

export function preloadSubjectForSkill(skillId) {
  const meta = SKILL_META[skillId];
  return meta ? preloadSubject(meta.subjectId) : Promise.resolve(null);
}

// Every screen that can draw from more than one subject at once (Endless
// Mode, Weak Skill Review, the full-length Practice Test) needs all four
// loaded — there's no meaningful "lazy" subset for those.
export function preloadAllSubjects() {
  return Promise.all(Object.keys(SUBJECT_LOADERS).map(preloadSubject));
}

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Every getter below assumes the relevant subject(s) are already loaded —
// callers must await preloadSubject()/preloadSubjectForSkill()/
// preloadAllSubjects() first. Returns [] / null rather than throwing if
// called too early, so a stray render doesn't hard-crash the screen.
export function getFullBank(skillId) {
  const meta = SKILL_META[skillId];
  if (!meta) return [];
  return loadedSubjects[meta.subjectId]?.questions?.[skillId] || [];
}

// Individual questions aren't hand-tagged with a difficulty rating, so this
// is a lightweight proxy, not a guarantee: longer question/choice text and
// ACT's classic "trap" negation words (NOT/EXCEPT/LEAST, which require
// double-checking every choice against an inverted condition) read as
// harder. Good enough to gently order a skill's own 100 questions from
// simplest to toughest without needing to hand-author a difficulty score
// for every question — and it's only ever the *starting point* now; see
// calibratedDifficulty() below for how real attempt data overrides it once
// there's enough of it.
function questionDifficulty(q) {
  const stemLen = q.q.length;
  const choicesLen = q.choices.reduce((sum, c) => sum + c.length, 0);
  const hasNegation = /\b(NOT|EXCEPT|LEAST)\b/.test(q.q);
  let score = stemLen + choicesLen * 0.4;
  if (hasNegation) score += 60;
  return score;
}

// A question needs this many of *this player's own* attempts before their
// personal accuracy is trusted to override the text-heuristic guess —
// otherwise one lucky or unlucky early answer could yank a question to the
// wrong end of the order. Below this, the bank is exactly the static
// heuristic sort it always was; at or above it, the heuristic is
// discarded in favor of what actually happened.
const MIN_ATTEMPTS_FOR_CALIBRATION = 3;

// This is the actual "attempt-calibrated item bank" the heuristic alone
// could never be: once a question has enough of this player's own answers
// on record, its measured accuracy replaces the text-length/negation guess
// entirely, so a question that *reads* simple but that this player
// consistently misses sorts into later lessons, and vice versa. Scaled to
// the same rough numeric range questionDifficulty() produces (fixed
// endpoints, not fit to any one skill's actual spread) so it can
// meaningfully outweigh the heuristic rather than being a rounding error
// next to it. `stat` is this player's own {attempts, correct} for the
// question, or undefined if they've never seen it.
function calibratedDifficulty(q, stat) {
  if (!stat || stat.attempts < MIN_ATTEMPTS_FOR_CALIBRATION) return questionDifficulty(q);
  const personalAccuracy = stat.correct / stat.attempts;
  return 500 * (1 - personalAccuracy);
}

// Sorted per skill and cached — sorting a skill's whole bank on every
// lesson render would be wasted work when nothing about it has changed.
// "Nothing has changed" is the load-bearing detail: the cache key folds in
// a signature (this player's total recorded attempts across the skill's
// questions), so the very first calibrated answer past
// MIN_ATTEMPTS_FOR_CALIBRATION on any question invalidates it and the next
// call re-sorts with the new data — the bank actually recalibrates itself
// as it's played, rather than freezing at whatever the heuristic guessed
// on day one. Within an unchanged signature (the overwhelmingly common
// case: most calls happen between answers, not between them) it's a pure
// cache hit, and lesson boundaries stay put for the length of a session.
const sortedBankCache = {};
function getDifficultySortedBank(skillId, getQuestionStat) {
  const bank = getFullBank(skillId);
  // Has to fingerprint *which* questions have *which* exact stats, not just
  // a total attempt count — two different players (or two different points
  // in the same player's history) can easily land on the same total while
  // having entirely different questions calibrated, and a sum alone would
  // silently hand back one of theirs to the other.
  let signature = "";
  if (getQuestionStat) {
    const parts = [];
    for (let i = 0; i < bank.length; i++) {
      const stat = getQuestionStat(skillId, i);
      if (stat && stat.attempts > 0) parts.push(`${i}:${stat.attempts}:${stat.correct}`);
    }
    signature = parts.join(",");
  }
  const cacheKey = `${skillId}:${signature}`;
  if (sortedBankCache[cacheKey]) return sortedBankCache[cacheKey];
  const sorted = bank
    .map((q, originalIndex) => ({ q, originalIndex, stat: getQuestionStat?.(skillId, originalIndex) }))
    .sort((a, b) => calibratedDifficulty(a.q, a.stat) - calibratedDifficulty(b.q, b.stat) || a.originalIndex - b.originalIndex)
    // bankIndex is the question's *original* (pre-sort) position in this
    // skill's bank — stable across app restarts since the source file's
    // array order never changes at runtime, which is what lets
    // gameState.recordQuestionAnswer()/getQuestionStat() key personal
    // per-question stats off it regardless of which lesson surfaces the
    // question or how the difficulty sort reorders things.
    .map((entry) => ({ ...entry.q, bankIndex: entry.originalIndex }));
  sortedBankCache[cacheKey] = sorted;
  return sorted;
}

// A handful of random adjacent swaps nudge the presentation order on every
// attempt (so a repeat lesson doesn't always show the exact same sequence)
// without undoing the easy-to-hard trend a full shuffle would erase.
function gentleReorder(arr) {
  const copy = arr.slice();
  for (let i = 0; i < copy.length - 1; i++) {
    if (Math.random() < 0.3) [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
  }
  return copy;
}

// A mini-lesson's question *content* is a fixed slice of the skill's
// difficulty-sorted bank (so it's a stable, repeatable curriculum stop, not
// a random grab-bag) — lesson 1 draws from the skill's easiest questions,
// the last lesson from its toughest, and presentation order within that
// slice is only gently reshuffled rather than fully randomized, so early
// questions in a lesson still tend to be a bit easier than the later ones.
// `getQuestionStat` is the same optional injected callback every other
// personalized getter in this file takes; omitting it (as every call site
// did before this player-calibration feature existed) falls back to the
// pure text heuristic, unchanged.
export function getLessonQuestions(skillId, lessonIndex, { getQuestionStat } = {}) {
  const bank = getDifficultySortedBank(skillId, getQuestionStat);
  const start = lessonIndex * LESSON_SIZE;
  return gentleReorder(bank.slice(start, start + LESSON_SIZE));
}

export function getPassageById(id) {
  for (const entry of Object.values(loadedSubjects)) {
    const found = entry.passages?.find((p) => p.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getStimulusById(id) {
  for (const entry of Object.values(loadedSubjects)) {
    const found = entry.stimuli?.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

// A single flat list of every question across all four subjects, each
// tagged with which skill/subject it came from, for Endless Mode's mixed
// question stream. Built once and cached, since it never changes at
// runtime (within a session — the cache is keyed off nothing because all
// four subjects are always loaded together by the time this is called).
//
// Each question also gets a `difficultyPct` (0-1): questions have no
// individual difficulty rating, but every subject's skill list is itself
// ordered roughly easy-to-hard (e.g. Math ends in "Final Five", explicitly
// its toughest skill), so a skill's position within its own subject is used
// as a stand-in for how hard its questions are, scaled to the same 0-1
// range regardless of how long that subject's skill list is.
let allQuestionsFlatCache = null;
export function getAllQuestionsFlat() {
  if (allQuestionsFlatCache) return allQuestionsFlatCache;
  const flat = [];
  for (const subject of SUBJECTS) {
    const lastIndex = Math.max(1, subject.skills.length - 1);
    subject.skills.forEach((skill, skillIndex) => {
      const qs = loadedSubjects[subject.id]?.questions?.[skill.id] || [];
      const difficultyPct = skillIndex / lastIndex;
      qs.forEach((q, bankIndex) => {
        flat.push({ ...q, skillId: skill.id, skillName: skill.name, subjectId: subject.id, difficultyPct, bankIndex });
      });
    });
  }
  allQuestionsFlatCache = flat;
  return flat;
}

// A big (default 20-question), no-repeat sample from every skill in one
// subject — the Boss Quiz capstone, unlocked once every skill on an island
// is mastered.
export function getBossQuizQuestions(subjectId, count = 20) {
  const pool = getAllQuestionsFlat().filter((q) => q.subjectId === subjectId);
  return shuffled(pool).slice(0, count);
}

// Builds one Practice Test section, sampled proportionally across that
// subject's real ACT reporting categories (see REPORTING_CATEGORIES in
// data/skills.js) rather than uniformly across every skill regardless of
// category — the same section-length uniform-random draw getBossQuizQuestions
// uses would, by chance, sometimes load a Reading section with mostly
// Key Ideas & Details questions and barely any Integration of Knowledge &
// Ideas, which a real ACT section never does. Each returned question is
// tagged with `reportingCategory` (the category id) so the results screen
// can break the section score down the same way a real ACT score report does.
export function getPracticeTestSectionQuestions(subjectId, count) {
  const categories = REPORTING_CATEGORIES[subjectId];
  const pool = getAllQuestionsFlat().filter((q) => q.subjectId === subjectId);
  if (!categories || pool.length === 0) return shuffled(pool).slice(0, count);

  const byCategory = {};
  categories.forEach((c) => (byCategory[c.id] = []));
  pool.forEach((q) => {
    const catId = SKILL_CATEGORY[q.skillId];
    if (byCategory[catId]) byCategory[catId].push({ ...q, reportingCategory: catId });
  });

  // A category with an explicit real-ACT `weight` uses it; one without
  // (currently just Math, whose official categories overlap in a way that
  // doesn't translate into a clean sampling split) falls back to how much
  // of the subject's skill tree that category actually covers.
  const totalSkills = SUBJECTS.find((s) => s.id === subjectId).skills.length;
  const weights = categories.map((c) => {
    if (c.weight != null) return c.weight;
    return byCategory[c.id].length / totalSkills || 0.01;
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const picks = [];
  const used = new Set();
  categories.forEach((cat, i) => {
    const catCount = Math.round((weights[i] / weightSum) * count);
    const catPicks = shuffled(byCategory[cat.id]).slice(0, catCount);
    catPicks.forEach((q) => used.add(`${q.skillId}:${q.bankIndex}`));
    picks.push(...catPicks);
  });
  // Independently rounding each category's share can land the total a
  // question or two short of `count` — top up from the rest of the
  // subject's pool rather than shipping a section that's short.
  if (picks.length < count) {
    const rest = pool.filter((q) => !used.has(`${q.skillId}:${q.bankIndex}`)).map((q) => ({ ...q, reportingCategory: SKILL_CATEGORY[q.skillId] }));
    picks.push(...shuffled(rest).slice(0, count - picks.length));
  }
  return shuffled(picks.slice(0, count));
}

// A question needs at least this many personal attempts before its own
// accuracy overrides the skill-level weight below — enough to not overreact
// to a single lucky guess or careless slip, not so many that a genuinely
// tricky question waits a long time to get prioritized.
const MIN_ATTEMPTS_FOR_PERSONAL_WEIGHT = 2;

// Builds a review session weighted toward the weakest skills' questions —
// and, adaptively, toward the *specific* questions this player has
// personally struggled with most, not just a uniform weight across every
// question in a weak skill. `weakSkills` is [{ id, accuracy }] (worst-
// accuracy first, as returned by gameState.getWeakSkills).
// `getQuestionStat(skillId, bankIndex)` is an optional injected callback
// (rather than importing gameState directly — state.js already imports
// *this* module, so a direct import back would be circular) returning that
// player's own {attempts, correct} for one specific question, or undefined
// if they've never seen it; omitting it just falls back to the flat
// skill-level weighting every question in a weak skill used to get.
// Shared by getWeakReviewQuestions and getAdaptivePracticeQuestions below:
// draws `count` items from `pool` (each needing a `.weight`) without
// replacement, re-normalizing the remaining weights after every pick so
// already-picked items can't be drawn again and heavier items stay more
// likely throughout, not just on the first draw.
function weightedSampleWithoutReplacement(pool, count) {
  const used = new Set();
  const picks = [];
  for (let i = 0; i < count && used.size < pool.length; i++) {
    let totalWeight = 0;
    pool.forEach((q, idx) => {
      if (!used.has(idx)) totalWeight += q.weight;
    });
    let roll = Math.random() * totalWeight;
    for (let idx = 0; idx < pool.length; idx++) {
      if (used.has(idx)) continue;
      roll -= pool[idx].weight;
      if (roll <= 0) {
        used.add(idx);
        picks.push(pool[idx]);
        break;
      }
    }
  }
  return picks;
}

export function getWeakReviewQuestions(weakSkills, count = 10, { getQuestionStat } = {}) {
  const pool = [];
  for (const { id, accuracy } of weakSkills) {
    const meta = SKILL_META[id];
    if (!meta) continue;
    const skillWeight = Math.max(0.15, 1 - accuracy);
    getFullBank(id).forEach((q, bankIndex) => {
      let weight = skillWeight;
      const stat = getQuestionStat?.(id, bankIndex);
      if (stat && stat.attempts >= MIN_ATTEMPTS_FOR_PERSONAL_WEIGHT) {
        const personalAccuracy = stat.correct / stat.attempts;
        weight = Math.max(0.15, 1 - personalAccuracy);
      }
      pool.push({ ...q, skillId: id, skillName: meta.skillName, subjectId: meta.subjectId, weight, bankIndex });
    });
  }
  if (pool.length === 0) return [];
  return weightedSampleWithoutReplacement(pool, count);
}

// A pattern needs at least this many combined attempts, *and* at least
// this many distinct questions contributing them, before it's considered
// "read" at all. Attempts alone isn't enough of a guard: drilling one
// stubborn question five times in Custom Drill would hit an attempts
// threshold instantly while only ever describing that single question,
// not a real cross-skill pattern in this player's understanding.
const MIN_PATTERN_ATTEMPTS = 6;
const MIN_PATTERN_QUESTIONS = 3;

// Aggregates this player's own recorded per-question stats (already being
// tracked for every question they've ever answered, via
// gameState.recordQuestionAnswer -> questionStats) by *pattern* rather than
// by skill — the actual "psychometric-style signal derived from real
// attempt data" this player generates just by playing normally, with zero
// new save-data schema: every input here already exists, this just reads
// it through a different lens. `getQuestionStat(skillId, bankIndex)` is the
// same injected callback getWeakReviewQuestions takes, for the same
// circular-import reason. Returns the `count` lowest-accuracy patterns
// with enough data to be meaningful, worst first.
export function getWeakPatterns(getQuestionStat, { minAttempts = MIN_PATTERN_ATTEMPTS, minQuestions = MIN_PATTERN_QUESTIONS, count = 5 } = {}) {
  const flat = getAllQuestionsFlat();
  const agg = {};
  for (const q of flat) {
    const stat = getQuestionStat(q.skillId, q.bankIndex);
    if (!stat || stat.attempts === 0) continue;
    for (const patternId of getQuestionPatterns(q)) {
      const entry = agg[patternId] || { attempts: 0, correct: 0, questionCount: 0 };
      entry.attempts += stat.attempts;
      entry.correct += stat.correct;
      entry.questionCount += 1;
      agg[patternId] = entry;
    }
  }
  return Object.entries(agg)
    .filter(([, s]) => s.attempts >= minAttempts && s.questionCount >= minQuestions)
    .map(([id, s]) => ({
      id,
      label: PATTERN_DEFS[id].label,
      hint: PATTERN_DEFS[id].hint,
      accuracy: s.correct / s.attempts,
      attempts: s.attempts,
      questionCount: s.questionCount,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count);
}

// Builds a practice session from across *every* subject and skill, pulling
// only questions that actually match one of the player's weak patterns —
// the adaptive engine's actual payoff: two players who are both "weak at
// re-claims" might need completely different practice if one's problem is
// negation traps and the other's is cross-passage synthesis, and this
// targets the specific pattern instead of the whole skill. Weight is driven
// by the weakest pattern a question matches, then nudged further by this
// player's own history with that exact question, same as getWeakReviewQuestions.
export function getAdaptivePracticeQuestions(weakPatterns, count = 10, { getQuestionStat } = {}) {
  if (weakPatterns.length === 0) return [];
  const weakPatternIds = new Set(weakPatterns.map((p) => p.id));
  const pool = [];
  for (const q of getAllQuestionsFlat()) {
    const matched = getQuestionPatterns(q).filter((id) => weakPatternIds.has(id));
    if (matched.length === 0) continue;
    const weakestMatch = weakPatterns.filter((p) => matched.includes(p.id)).sort((a, b) => a.accuracy - b.accuracy)[0];
    let weight = Math.max(0.15, 1 - weakestMatch.accuracy);
    const stat = getQuestionStat?.(q.skillId, q.bankIndex);
    if (stat && stat.attempts >= MIN_ATTEMPTS_FOR_PERSONAL_WEIGHT) {
      weight = Math.max(0.15, weight * (2 - stat.correct / stat.attempts));
    }
    pool.push({ ...q, weight, matchedPatterns: matched });
  }
  if (pool.length === 0) return [];
  return weightedSampleWithoutReplacement(pool, count);
}

// Picks a question from the full mixed pool, weighted toward a target
// difficulty (0 = easiest skills, 1 = hardest), avoiding an immediate
// back-to-back repeat of the previous question when possible. Weighting
// (not a hard cutoff) means nothing is ever fully off-limits, just less
// likely, so the pool never runs dry for subjects with few skills.
// `getQuestionStat`, when supplied, extends the same self-calibrating
// signal getLessonQuestions uses to Endless Mode: a question this player
// has enough personal history with blends its base skill-position
// difficulty with how it's actually gone for them, so a run doesn't keep
// escalating toward "Final Five"-tier questions this specific player has
// already shown they've got solid, or stay stuck serving up "Comma Sense"
// questions they've personally always missed.
export function getEndlessQuestion(previousQuestion, difficultyLevel = 0, { getQuestionStat } = {}) {
  const flat = getAllQuestionsFlat();
  if (flat.length === 0) return null;
  const target = 0.1 + Math.max(0, Math.min(1, difficultyLevel)) * 0.8;
  const spread = 0.35;

  const effectiveDifficulty = (q) => {
    const stat = getQuestionStat?.(q.skillId, q.bankIndex);
    if (!stat || stat.attempts < MIN_ATTEMPTS_FOR_PERSONAL_WEIGHT) return q.difficultyPct;
    const personalDifficulty = 1 - stat.correct / stat.attempts;
    // Blended, not replaced: a question's skill still carries real
    // information (a Final Five question is probably still harder than a
    // Comma Sense one even if this player has aced the one they've seen),
    // personal history just nudges the estimate rather than overriding it.
    return q.difficultyPct * 0.5 + personalDifficulty * 0.5;
  };

  const weights = flat.map((q) => Math.max(0.03, 1 - Math.abs(effectiveDifficulty(q) - target) / spread));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const pickOne = () => {
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < flat.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return flat[i];
    }
    return flat[flat.length - 1];
  };

  let pick = pickOne();
  if (flat.length > 1 && previousQuestion) {
    let attempts = 0;
    while (pick.q === previousQuestion.q && attempts < 10) {
      pick = pickOne();
      attempts++;
    }
  }
  return pick;
}
