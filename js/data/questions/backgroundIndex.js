import { bgBiology } from "./backgroundBiology.js";
import { bgChemistry } from "./backgroundChemistry.js";
import { bgPhysics } from "./backgroundPhysics.js";
import { bgMath } from "./backgroundMath.js";

const ALL_BACKGROUND_QUESTIONS = { ...bgBiology, ...bgChemistry, ...bgPhysics, ...bgMath };

export function getBackgroundQuestions(topicId) {
  return ALL_BACKGROUND_QUESTIONS[topicId] || [];
}
