import { english } from "./english.js";
import { math } from "./math.js";
import { reading, passages } from "./reading.js";
import { science, stimuli } from "./science.js";

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
