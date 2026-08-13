import { VOCABULARY } from "../data/vocabulary.js";
import { renderFlashcardLesson } from "./flashcardLesson.js";

export function renderVocabulary(root, navigate) {
  renderFlashcardLesson(root, navigate, {
    data: VOCABULARY,
    backScreen: "map",
    backParams: {},
    quizScreen: "vocabQuiz",
    quizParamsExtra: {},
    enableExport: true,
  });
}
