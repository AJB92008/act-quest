import { english } from "./english.js";
import { math } from "./math.js";
import { reading, passages } from "./reading.js";
import { science, stimuli } from "./science.js";

const ALL_QUESTIONS = { ...english, ...math, ...reading, ...science };

export function getQuestions(skillId) {
  return ALL_QUESTIONS[skillId] || [];
}

export function getPassageById(id) {
  return passages.find((p) => p.id === id);
}

export function getStimulusById(id) {
  return stimuli.find((s) => s.id === id);
}
