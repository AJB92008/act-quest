import { SUBJECTS, allSkillIds } from "../skills.js";

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
  "re-mainidea": 120,
  "re-detail": 120,
  "re-sequence": 120,
  "re-compare": 120,
  "re-causeeffect": 120,
  "re-vocab": 120,
  "re-generalize": 120,
  "re-voice": 120,
  "re-claims": 120,
  "re-integrate": 120,
  "sc-datarep": 120,
  "sc-interpret": 120,
  "sc-research": 120,
  "sc-investigation": 120,
  "sc-conflicting": 120,
  "sc-evaluate": 120,
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
for (const subject of SUBJECTS) {
  subject.skills.forEach((skill) => {
    SKILL_META[skill.id] = { skillName: skill.name, subjectId: subject.id };
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
// for every question.
function questionDifficulty(q) {
  const stemLen = q.q.length;
  const choicesLen = q.choices.reduce((sum, c) => sum + c.length, 0);
  const hasNegation = /\b(NOT|EXCEPT|LEAST)\b/.test(q.q);
  let score = stemLen + choicesLen * 0.4;
  if (hasNegation) score += 60;
  return score;
}

// Sorted once per skill and cached (sorting 100 questions on every lesson
// render would be wasted work — the bank itself never changes at runtime).
const sortedBankCache = {};
function getDifficultySortedBank(skillId) {
  if (sortedBankCache[skillId]) return sortedBankCache[skillId];
  const sorted = getFullBank(skillId)
    .map((q, originalIndex) => ({ q, originalIndex }))
    .sort((a, b) => questionDifficulty(a.q) - questionDifficulty(b.q) || a.originalIndex - b.originalIndex)
    // bankIndex is the question's *original* (pre-sort) position in this
    // skill's bank — stable across app restarts since the source file's
    // array order never changes at runtime, which is what lets
    // gameState.recordQuestionAnswer()/getQuestionStat() key personal
    // per-question stats off it regardless of which lesson surfaces the
    // question or how the difficulty sort reorders things.
    .map((entry) => ({ ...entry.q, bankIndex: entry.originalIndex }));
  sortedBankCache[skillId] = sorted;
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
export function getLessonQuestions(skillId, lessonIndex) {
  const bank = getDifficultySortedBank(skillId);
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

// Picks a question from the full mixed pool, weighted toward a target
// difficulty (0 = easiest skills, 1 = hardest), avoiding an immediate
// back-to-back repeat of the previous question when possible. Weighting
// (not a hard cutoff) means nothing is ever fully off-limits, just less
// likely, so the pool never runs dry for subjects with few skills.
export function getEndlessQuestion(previousQuestion, difficultyLevel = 0) {
  const flat = getAllQuestionsFlat();
  if (flat.length === 0) return null;
  const target = 0.1 + Math.max(0, Math.min(1, difficultyLevel)) * 0.8;
  const spread = 0.35;

  const weights = flat.map((q) => Math.max(0.03, 1 - Math.abs(q.difficultyPct - target) / spread));
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
