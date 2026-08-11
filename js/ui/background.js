import { SCIENCE_BACKGROUND } from "../data/scienceBackground.js";
import { renderFlashcardLesson } from "./flashcardLesson.js";

export function renderBackgroundLesson(root, navigate, { subjectId = "science" } = {}) {
  renderFlashcardLesson(root, navigate, {
    data: SCIENCE_BACKGROUND,
    backScreen: "island",
    backParams: { subjectId },
    quizScreen: "backgroundQuiz",
    quizParamsExtra: { subjectId },
  });
}
