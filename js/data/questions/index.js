import { english } from "./english.js";
import { math } from "./math.js";
import { reading, passages } from "./reading.js";
import { science, stimuli } from "./science.js";
import { SUBJECTS } from "../skills.js";

const ALL_QUESTIONS = { ...english, ...math, ...reading, ...science };

const QUESTIONS_PER_LESSON = 20;

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Each lesson attempt draws a fresh random subset from the full skill bank
// (rather than always presenting every question in the same fixed order),
// so replaying a lesson doesn't feel identical every time.
export function getQuestions(skillId, count = QUESTIONS_PER_LESSON) {
  const all = ALL_QUESTIONS[skillId] || [];
  return shuffled(all).slice(0, count);
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
let allQuestionsFlatCache = null;
export function getAllQuestionsFlat() {
  if (allQuestionsFlatCache) return allQuestionsFlatCache;
  const flat = [];
  for (const subject of SUBJECTS) {
    for (const skill of subject.skills) {
      const qs = ALL_QUESTIONS[skill.id] || [];
      for (const q of qs) {
        flat.push({ ...q, skillId: skill.id, skillName: skill.name, subjectId: subject.id });
      }
    }
  }
  allQuestionsFlatCache = flat;
  return flat;
}

// Picks a random question from the full mixed pool, avoiding an immediate
// back-to-back repeat of the previously shown question when possible.
export function getRandomEndlessQuestion(previousQuestion) {
  const flat = getAllQuestionsFlat();
  if (flat.length === 0) return null;
  let pick = flat[Math.floor(Math.random() * flat.length)];
  if (flat.length > 1 && previousQuestion) {
    let attempts = 0;
    while (pick.q === previousQuestion.q && attempts < 10) {
      pick = flat[Math.floor(Math.random() * flat.length)];
      attempts++;
    }
  }
  return pick;
}
