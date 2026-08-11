import { getBackgroundQuestions } from "../data/questions/backgroundIndex.js";
import { renderTopicQuiz } from "./topicQuiz.js";

export function renderBackgroundQuiz(root, navigate, { topicId, topicTitle, subjectId = "science" }) {
  renderTopicQuiz(root, navigate, {
    questions: getBackgroundQuestions(topicId),
    title: topicTitle,
    coinsPerCorrect: 4,
    backScreen: "background",
    backParams: { subjectId },
    retryScreen: "backgroundQuiz",
    retryParams: { topicId, topicTitle, subjectId },
  });
}
