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

function allFlashcards(data) {
  const cards = [];
  for (const section of data.sections) {
    for (const topic of section.topics) {
      for (const card of topic.flashcards || []) cards.push(card);
    }
  }
  return cards;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Opens a small, self-contained print-friendly document in a new tab (its
// own window rather than reusing this screen's DOM) so the main app's
// layout/CSS never has to account for print media at all — just build a
// simple word/definition list and hand it straight to the browser's own
// print dialog.
function openPrintableFlashcards(data) {
  const cards = allFlashcards(data);
  const rows = cards
    .map((c) => `<div class="card"><div class="front">${escapeHtml(c.front)}</div><div class="back">${escapeHtml(c.back)}</div></div>`)
    .join("");
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(data.title)}: Flashcards</title>
        <style>
          body { font-family: Georgia, serif; max-width: 720px; margin: 24px auto; padding: 0 16px; }
          h1 { font-family: sans-serif; }
          .card { break-inside: avoid; border-bottom: 1px solid #ccc; padding: 10px 0; }
          .front { font-weight: bold; font-size: 1.05rem; }
          .back { color: #444; margin-top: 2px; }
          @media print { h1, p.hint { display: none; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(data.title)}</h1>
        <p class="hint">${cards.length} flashcards. Use your browser's Print (Cmd/Ctrl+P) to print or save as PDF.</p>
        ${rows}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function downloadVocabCsv(data) {
  const cards = allFlashcards(data);
  const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = ["front,back", ...cards.map((c) => `${csvEscape(c.front)},${csvEscape(c.back)}`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(data.title)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function renderFlashcardLesson(root, navigate, { data, backScreen, backParams, quizScreen, quizParamsExtra = {}, enableExport = false }) {
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
          <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 110 })}</div>
          <h1 class="lesson-title">${data.title}</h1>
          <p class="lesson-blurb">${data.subtitle}</p>
          ${
            enableExport
              ? `
                <div class="vocab-export-actions">
                  <button class="btn-secondary" data-print-cards>🖨️ Print Flashcards</button>
                  <button class="btn-secondary" data-export-csv>⬇️ Export CSV</button>
                </div>
              `
              : ""
          }
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
    root.querySelector("[data-print-cards]")?.addEventListener("click", () => openPrintableFlashcards(data));
    root.querySelector("[data-export-csv]")?.addEventListener("click", () => downloadVocabCsv(data));

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
