import { VOCAB_QUESTIONS } from "../data/vocabQuestions.js";
import { renderTopicQuiz } from "./topicQuiz.js";

export function renderVocabQuiz(root, navigate, { topicId, topicTitle }) {
  renderTopicQuiz(root, navigate, {
    questions: VOCAB_QUESTIONS[topicId] || [],
    title: topicTitle,
    coinsPerCorrect: 4,
    backScreen: "vocabulary",
    backParams: {},
    retryScreen: "vocabQuiz",
    retryParams: { topicId, topicTitle },
  });
}
