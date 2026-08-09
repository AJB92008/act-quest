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

// A question can carry either a passageId (Reading) or a stimulusId
// (Science); resolve whichever applies, or "" for plain questions.
export function renderQuestionStimulus(q) {
  if (q.passageId) return renderPassage(q.passageId);
  if (q.stimulusId) return renderStimulus(q.stimulusId);
  return "";
}
