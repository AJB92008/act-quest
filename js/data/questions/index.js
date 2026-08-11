import { english } from "./english.js";
import { math } from "./math.js";
import { reading, passages } from "./reading.js";
import { science, stimuli } from "./science.js";
import { SUBJECTS } from "../skills.js";

const ALL_QUESTIONS = { ...english, ...math, ...reading, ...science };

// Each skill's bank is chunked into fixed-size mini-lessons — bite-sized
// stops on that skill's path rather than one long quiz — matching how
// "Teach Your Monster" paces its games.
export const LESSON_SIZE = 5;

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getFullBank(skillId) {
  return ALL_QUESTIONS[skillId] || [];
}

export function getLessonCount(skillId) {
  return Math.max(1, Math.ceil(getFullBank(skillId).length / LESSON_SIZE));
}

// A mini-lesson's question *content* is a fixed slice of the bank (so it's
// a stable, repeatable curriculum stop, not a random grab-bag), but the
// order they're presented in is reshuffled on every attempt.
export function getLessonQuestions(skillId, lessonIndex) {
  const bank = getFullBank(skillId);
  const start = lessonIndex * LESSON_SIZE;
  return shuffled(bank.slice(start, start + LESSON_SIZE));
}

// skillId -> { skillName, subjectId }, built once from the skill tree.
const SKILL_META = {};
for (const subject of SUBJECTS) {
  subject.skills.forEach((skill) => {
    SKILL_META[skill.id] = { skillName: skill.name, subjectId: subject.id };
  });
}

export function getPassageById(id) {
  return passages.find((p) => p.id === id);
}

export function getStimulusById(id) {
  return stimuli.find((s) => s.id === id);
}

// A single flat list of every question across all four subjects, each
// tagged with which skill/subject it came from, for Endless Mode's mixed
// question stream. Built once and cached, since it never changes at runtime.
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
      const qs = ALL_QUESTIONS[skill.id] || [];
      const difficultyPct = skillIndex / lastIndex;
      for (const q of qs) {
        flat.push({ ...q, skillId: skill.id, skillName: skill.name, subjectId: subject.id, difficultyPct });
      }
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

// Builds a review session weighted toward the weakest skills' questions.
// `weakSkills` is [{ id, accuracy }] (worst-accuracy first, as returned by
// gameState.getWeakSkills) — lower accuracy means a higher chance a given
// question gets drawn, but every weak skill still gets some coverage.
export function getWeakReviewQuestions(weakSkills, count = 10) {
  const pool = [];
  for (const { id, accuracy } of weakSkills) {
    const meta = SKILL_META[id];
    if (!meta) continue;
    const weight = Math.max(0.15, 1 - accuracy);
    for (const q of getFullBank(id)) {
      pool.push({ ...q, skillId: id, skillName: meta.skillName, subjectId: meta.subjectId, weight });
    }
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
