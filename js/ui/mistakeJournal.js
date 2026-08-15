// Mistake Journal: a persistent, searchable log of every question this
// player has ever gotten wrong, across every mode (lessons, Weak Review,
// Adaptive Practice, Boss Quiz, Endless Mode, the Drill Builder, the
// Practice Test) — not just the current per-question accuracy stats
// recordQuestionAnswer already tracks, but the actual longitudinal history
// of misses over time. gameState logs the raw entry
// ({skillId, bankIndex, chosenIndex, date}) from one single hook point
// (recordQuestionAnswer itself); this screen is what resolves each entry
// back into real question text/choices by loading the relevant subject's
// bank, the same way every other question-rendering screen does.
import { getSkill, getSubject } from "../data/skills.js";
import { getFullBank, preloadAllSubjects } from "../data/questions/index.js";
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";

// A generous but real cap on how many resolved rows get built into the
// DOM at once — the underlying log itself isn't capped this low (see
// MISTAKE_JOURNAL_CAP in state.js), this is purely about not handing the
// browser thousands of list rows to lay out on one screen.
const MAX_RENDERED = 300;

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function renderMistakeJournal(root, navigate) {
  const dataReady = preloadAllSubjects();
  let searchText = "";
  let subjectFilter = "all";

  function renderLoading() {
    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen dashboard-screen">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <h1>📓 Mistake Journal</h1>
        <p class="lesson-blurb">Loading your history…</p>
      </main>
    `;
    wireHud(root, navigate);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
  }

  function resolveEntries() {
    const raw = gameState.getMistakeJournal();
    const resolved = [];
    for (const entry of raw) {
      const meta = getSkill(entry.skillId);
      if (!meta) continue;
      const bank = getFullBank(entry.skillId);
      const q = bank[entry.bankIndex];
      if (!q) continue;
      resolved.push({
        ...entry,
        skillName: meta.skill.name,
        subjectId: meta.subject.id,
        q,
      });
    }
    return resolved;
  }

  function render() {
    const all = resolveEntries();
    const subjects = [...new Set(all.map((e) => e.subjectId))].map((id) => getSubject(id));

    const filtered = all.filter((e) => {
      if (subjectFilter !== "all" && e.subjectId !== subjectFilter) return false;
      if (!searchText) return true;
      const haystack = `${e.skillName} ${e.q.q} ${e.q.choices.join(" ")}`.toLowerCase();
      return haystack.includes(searchText.toLowerCase());
    });

    const shown = filtered.slice(0, MAX_RENDERED);

    const subjectChips = [
      `<button class="choice-btn ${subjectFilter === "all" ? "is-selected" : ""}" data-subject-filter="all">All Subjects</button>`,
      ...subjects.map((s) => `<button class="choice-btn ${subjectFilter === s.id ? "is-selected" : ""}" data-subject-filter="${s.id}">${s.icon} ${s.name}</button>`),
    ].join("");

    const rows = shown
      .map((e) => {
        const subject = getSubject(e.subjectId);
        const chosenText = e.chosenIndex != null && e.chosenIndex >= 0 && e.q.choices[e.chosenIndex] ? e.q.choices[e.chosenIndex] : "(no answer selected)";
        return `
          <div class="dash-history-row mistake-journal-row" style="flex-direction:column;align-items:stretch;gap:6px;">
            <div class="dash-row-label">
              <span>${subject.icon} ${subject.name} &middot; ${e.skillName}</span>
              <span>${formatDate(e.date)}</span>
            </div>
            <p class="question-text" style="text-align:left;font-size:0.95rem;">${e.q.q}</p>
            <p class="dash-monster-substat"><strong>You answered:</strong> ${chosenText}</p>
            <p class="dash-monster-substat"><strong>Correct answer:</strong> ${e.q.choices[e.q.answer]}</p>
            <p class="dash-monster-substat">${e.q.explain}</p>
            <button class="btn-secondary" data-practice-skill="${e.skillId}" data-subject-id="${e.subjectId}" style="align-self:flex-start;">Practice This Skill</button>
          </div>
        `;
      })
      .join("");

    root.innerHTML = `
      ${hudHTML("dashboard")}
      <main class="screen dashboard-screen">
        <button class="back-btn" data-back>&larr; Back to Progress</button>
        <h1>📓 Mistake Journal</h1>
        <p class="lesson-blurb">${all.length} missed question${all.length === 1 ? "" : "s"} logged across your whole history. Not just current accuracy stats &mdash; the actual record of what you got wrong and when.</p>
        ${
          all.length > 0
            ? `
              <input type="text" id="journalSearch" placeholder="Search by skill or question text…" value="${searchText}" style="width:100%;max-width:480px;margin-bottom:12px;font-family:inherit;font-size:1rem;padding:10px 14px;border-radius:12px;border:2px solid var(--border);background:var(--card);color:var(--ink);" />
              <div class="choices" style="margin-bottom:16px;">${subjectChips}</div>
              <p class="dash-monster-substat">${filtered.length === all.length ? `Showing all ${filtered.length}` : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`}${filtered.length > MAX_RENDERED ? ` (most recent ${MAX_RENDERED} shown)` : ""}</p>
              <div class="dash-rows">${rows || `<p class="lesson-paragraph">No mistakes match that search.</p>`}</div>
            `
            : `<p class="lesson-paragraph">Nothing logged yet &mdash; once you miss a question anywhere in the app (a lesson, Weak Review, a Practice Test, anywhere), it'll show up here.</p>`
        }
      </main>
    `;

    wireHud(root, navigate);
    root.querySelector("[data-back]").addEventListener("click", () => navigate("dashboard"));
    const searchInput = root.querySelector("#journalSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchText = searchInput.value;
        const caret = searchInput.selectionStart;
        render();
        const restored = root.querySelector("#journalSearch");
        if (restored) {
          restored.focus();
          restored.setSelectionRange(caret, caret);
        }
      });
    }
    root.querySelectorAll("[data-subject-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        subjectFilter = btn.dataset.subjectFilter;
        render();
      });
    });
    root.querySelectorAll("[data-practice-skill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate("skillPath", { skillId: btn.dataset.practiceSkill, subjectId: btn.dataset.subjectId });
      });
    });
  }

  renderLoading();
  dataReady.then(render);
}
