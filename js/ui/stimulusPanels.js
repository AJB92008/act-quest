// Shared renderers for Reading passages and Science stimuli (tables /
// research summaries / conflicting viewpoints), used by both the regular
// quiz screen and Endless Mode so question stimuli render identically
// everywhere they appear.
import { getPassageById, getStimulusById } from "../data/questions/index.js";

export function renderPassage(passageId) {
  const p = getPassageById(passageId);
  if (!p) return "";
  return `
    <div class="stimulus-panel">
      <h4 class="stimulus-title">${p.title}</h4>
      <div class="passage-box">${p.text}</div>
    </div>
  `;
}

function renderTable(table) {
  return `
    <div class="stimulus-table-wrap">
      <table class="stimulus-table">
        <thead><tr>${table.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderStimulus(stimulusId) {
  const s = getStimulusById(stimulusId);
  if (!s) return "";
  let body = `<p class="stimulus-intro">${s.intro}</p>`;
  if (s.tables) {
    body += s.tables
      .map((t) => `${t.label ? `<h5 class="stimulus-subtitle">${t.label}</h5>` : ""}${t.note ? `<p class="stimulus-note">${t.note}</p>` : ""}${renderTable(t)}`)
      .join("");
  } else if (s.table) {
    body += renderTable(s.table);
  }
  if (s.viewpoints) {
    body += `
      <div class="viewpoints">
        ${s.viewpoints
          .map((v) => `<div class="viewpoint-card"><h5>${v.name}</h5><p>${v.text}</p></div>`)
          .join("")}
      </div>
    `;
  }
  return `<div class="stimulus-panel"><h4 class="stimulus-title">${s.title}</h4>${body}</div>`;
}

// SAT Reading & Writing's real format is one short, self-contained text
// per question (not shared across several questions the way ACT Reading's
// passages are) — too short-lived to earn its own id/lookup entry in a
// shared `passages` array, so it just rides along on the question object
// itself and renders in the same panel styling as a real Reading passage.
export function renderInlinePassage(text) {
  if (!text) return "";
  return `
    <div class="stimulus-panel">
      <div class="passage-box">${text}</div>
    </div>
  `;
}

// A question can carry a passageId (ACT Reading), a stimulusId (ACT
// Science), or an inline `passage` (SAT Reading & Writing); resolve
// whichever applies, or "" for a plain question with no stimulus at all.
export function renderQuestionStimulus(q) {
  if (q.passageId) return renderPassage(q.passageId);
  if (q.stimulusId) return renderStimulus(q.stimulusId);
  if (q.passage) return renderInlinePassage(q.passage);
  return "";
}
