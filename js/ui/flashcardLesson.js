// Shared "reference lesson" screen: a table of contents, sections of
// topics with paragraphs + flip-through flashcards, and a quiz button per
// topic. Used by both the Science Background lesson and the Vocabulary
// Builder — same shape of content, different data and destinations.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function renderFlashcardLesson(root, navigate, { data, backScreen, backParams, quizScreen, quizParamsExtra = {} }) {
  let openTopicId = null;
  let cardIndex = 0;
  let flipped = false;

  function findTopic(topicId) {
    for (const s of data.sections) {
      const t = s.topics.find((t) => t.id === topicId);
      if (t) return t;
    }
    return null;
  }

  function flashcardPanelHTML(topic) {
    const cards = topic.flashcards || [];
    if (cards.length === 0) return "";
    const card = cards[cardIndex];
    return `
      <div class="flashcard-panel">
        <div class="flashcard ${flipped ? "is-flipped" : ""}" data-flip>
          <div class="flashcard-inner">
            <div class="flashcard-face flashcard-front">${card.front}</div>
            <div class="flashcard-face flashcard-back">${card.back}</div>
          </div>
        </div>
        <p class="flashcard-hint">Tap the card to flip it</p>
        <div class="flashcard-controls">
          <button class="btn-secondary" data-card-prev>&larr; Prev</button>
          <span class="flashcard-counter">${cardIndex + 1} / ${cards.length}</span>
          <button class="btn-secondary" data-card-next>Next &rarr;</button>
        </div>
      </div>
    `;
  }

  function topicHTML(topic) {
    const isOpen = openTopicId === topic.id;
    const hasCards = (topic.flashcards || []).length > 0;
    return `
      <div class="bg-topic">
        <h3 class="bg-topic-title">${topic.title}</h3>
        ${topic.paragraphs.map((p) => `<p class="bg-topic-paragraph">${p}</p>`).join("")}
        <div class="bg-topic-actions">
          ${
            hasCards
              ? `<button class="btn-secondary bg-flashcard-btn" data-flashcard-toggle="${topic.id}">🗂️ ${
                  isOpen ? "Hide Flashcards" : `Flashcards (${topic.flashcards.length})`
                }</button>`
              : ""
          }
          <button class="btn-secondary bg-quiz-btn" data-quiz-topic="${topic.id}" data-quiz-title="${topic.title}">📝 Quiz (10 Questions)</button>
        </div>
        ${isOpen ? flashcardPanelHTML(topic) : ""}
      </div>
    `;
  }

  function render() {
    const tocHTML = data.sections
      .map((s) => `<a class="bg-toc-link" href="#${slugify(s.domain)}">${s.icon} ${s.domain}</a>`)
      .join("");

    const sectionsHTML = data.sections
      .map(
        (s) => `
        <section class="bg-section" id="${slugify(s.domain)}">
          <h2 class="bg-domain-title">${s.icon} ${s.domain}</h2>
          ${s.topics.map((t) => topicHTML(t)).join("")}
        </section>
      `
      )
      .join("");

    root.innerHTML = `
      ${hudHTML("map")}
      <main class="screen background-screen">
        <button class="back-btn" data-back>&larr; Back</button>
        <div class="lesson-card bg-card">
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 90 })}</div>
          <h1 class="lesson-title">${data.title}</h1>
          <p class="lesson-blurb">${data.subtitle}</p>
          <nav class="bg-toc">${tocHTML}</nav>
          ${sectionsHTML}
          <button class="btn-primary lesson-start-btn" data-back-bottom>Back &rarr;</button>
        </div>
      </main>
    `;

    wireHud(root, navigate);
    const goBack = () => navigate(backScreen, backParams);
    root.querySelector("[data-back]").addEventListener("click", goBack);
    root.querySelector("[data-back-bottom]").addEventListener("click", goBack);

    root.querySelectorAll("[data-flashcard-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const topicId = btn.dataset.flashcardToggle;
        openTopicId = openTopicId === topicId ? null : topicId;
        cardIndex = 0;
        flipped = false;
        render();
        if (openTopicId) {
          const panel = root.querySelector(".flashcard-panel");
          if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    root.querySelectorAll("[data-quiz-topic]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate(quizScreen, {
          topicId: btn.dataset.quizTopic,
          topicTitle: btn.dataset.quizTitle,
          ...quizParamsExtra,
        });
      });
    });

    const flipCard = root.querySelector("[data-flip]");
    if (flipCard) {
      flipCard.addEventListener("click", () => {
        flipped = !flipped;
        render();
      });
    }

    const prevBtn = root.querySelector("[data-card-prev]");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const topic = findTopic(openTopicId);
        const count = topic.flashcards.length;
        cardIndex = (cardIndex - 1 + count) % count;
        flipped = false;
        render();
      });
    }

    const nextBtn = root.querySelector("[data-card-next]");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const topic = findTopic(openTopicId);
        const count = topic.flashcards.length;
        cardIndex = (cardIndex + 1) % count;
        flipped = false;
        render();
      });
    }
  }

  render();
}
