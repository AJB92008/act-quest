// Per-subject visual theme for island.js (an island's skill picker) and
// skillPath.js (that island's own lesson picker) — gives each subject's
// full-viewport background something that actually evokes its own `place`
// (see the `place` field in skills.js/satSkills.js/psatSkills.js) instead
// of the one generic light/dark gradient every map-style screen used to
// share. `kind` picks which .topic-* pattern (see style.css) renders
// behind the content — subjects that are the "same kind" of place (e.g.
// every math subject's mountain/field/slope) share a pattern shape, but
// each subject still keeps its own hue via the --island-color/-bg vars
// island.js/skillPath.js already set inline, so within a kind a specific
// subject (Math vs. SAT Math vs. PSAT Math) still looks distinct.
// `decorations` replace pathTrail.js's generic cloud/leaf/rock/sparkle/
// wave scatter with a small set of emoji specific to that subject.
const SUBJECT_THEMES = {
  english: { kind: "forest", decorations: ["🍃", "🌳", "🍄", "🌿"] },
  math: { kind: "mountain", decorations: ["🔺", "⛰️", "📐"] },
  reading: { kind: "wave", decorations: ["📖", "🐚", "🌊"] },
  science: { kind: "lab", decorations: ["🧪", "🔬", "⚛️", "🧫"] },
  "sat-rw": { kind: "wave", decorations: ["📘", "🐚", "🌊"] },
  "sat-math": { kind: "mountain", decorations: ["📐", "🌾", "⛰️"] },
  "psat-rw": { kind: "wave", decorations: ["📗", "🌊", "🐚"] },
  "psat-math": { kind: "mountain", decorations: ["📏", "⛰️", "🔺"] },
};

// Falls back to a neutral starfield-ish scatter for any subject not
// listed above (currently just the still-content-free State Assessments
// subjects, which never actually reach a real island/lesson path screen —
// see isSubjectPlayable in data/tests.js — but this keeps a stray call
// from rendering nothing rather than crashing).
const DEFAULT_THEME = { kind: "lab", decorations: ["✨", "🌫️", "🪨"] };

export function getSubjectTheme(subjectId) {
  return SUBJECT_THEMES[subjectId] || DEFAULT_THEME;
}
