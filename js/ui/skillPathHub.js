// Per-skill "skins" for the zoomed-in lesson-path terrain (see
// lessonTerrain.js for the shared engine every one of these renders
// through — the layout is identical across skills, only these colors
// and decorations differ). Each entry's own look is meant to match where
// that skill's node actually sits on Wordwood Isle's own map: Idiom
// Instinct is in the light-green meadow zone, so it gets open plains;
// Phrase Finder is in the darker forest zone, so it gets dense jungle.
// Add a new skill here (plus one line in skillPath.js's dispatch) rather
// than writing a whole new file — that's the point of the shared engine.
import { renderLessonTerrainPath } from "./lessonTerrain.js";

export const LESSON_THEMES = {
  "en-idioms": {
    ground: "#c3dd8f",
    hillShadow: "rgba(20,45,30,0.16)",
    hillMain: "#8db35f",
    hillHighlight: "#a3c777",
    riverColor: "#7fa8b8",
    riverOpacity: 0.75,
    trailColor: "#b98a52",
    bossClearingFill: "#efe4cf",
    bossClearingStroke: "#c9a668",
    decorEmoji: ["📖", "🔖", "🖋️", "📜", "🦉", "🔍"],
    ambientEmoji: ["🌾", "🌿", "🌼"],
    terrainDescription: "open grassy plains",
    mapBg: "#c3dd8f",
    hintColor: "rgba(25, 40, 10, 0.75)",
  },
  "en-verbalphrases": {
    ground: "#3f6b34",
    hillShadow: "rgba(8,18,6,0.3)",
    hillMain: "#2f5626",
    hillHighlight: "#4a7a3a",
    riverColor: "#4f8a8a",
    riverOpacity: 0.8,
    trailColor: "#7a5a35",
    bossClearingFill: "#dfe0c4",
    bossClearingStroke: "#7d8f5c",
    decorEmoji: ["🌴", "🦜", "🐒", "🌺", "🔍", "🍃"],
    ambientEmoji: ["🍃", "🌿", "🦋"],
    terrainDescription: "dense jungle foliage",
    mapBg: "#3f6b34",
    hintColor: "rgba(240, 250, 230, 0.85)",
  },
};

export function renderThemedLessonPath(root, navigate, params) {
  renderLessonTerrainPath(root, navigate, params, LESSON_THEMES[params.skillId]);
}
