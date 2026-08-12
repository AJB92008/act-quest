// Regression tests for the mastery -> evolution stage thresholds
// (EVOLUTION_STAGE_THRESHOLDS in state.js): [0, 0.25, 0.5, 0.75, 1].
// Skill count is read dynamically via allSkillIds() instead of hardcoded,
// so this stays correct if skills are ever added/removed.
import { GameState, EVOLUTION_STAGE_NAMES } from "../js/state.js";
import { allSkillIds } from "../js/data/skills.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const ids = allSkillIds();
const total = ids.length;

test("0% mastery is stage 0 (Hatchling)", () => {
  const gs = new GameState();
  assertEqual(gs.getEvolutionStage(), 0);
  assertEqual(gs.getEvolutionStageName(), EVOLUTION_STAGE_NAMES[0]);
});

test("100% mastery is the top stage (Legendary)", () => {
  const gs = new GameState();
  ids.forEach((id) => (gs.data.skillProgress[id].mastered = true));
  assertEqual(gs.getEvolutionStage(), EVOLUTION_STAGE_NAMES.length - 1);
  assertEqual(gs.getEvolutionStageName(), "Legendary");
});

test("mastery just below the 25% threshold stays at stage 0", () => {
  const gs = new GameState();
  const count = Math.max(0, Math.ceil(total * 0.25) - 1);
  ids.slice(0, count).forEach((id) => (gs.data.skillProgress[id].mastered = true));
  assertTrue(gs.getMasteryPct() < 0.25, `expected mastery < 25%, got ${gs.getMasteryPct()}`);
  assertEqual(gs.getEvolutionStage(), 0);
});

test("mastery at/above the 25% threshold advances to stage 1 (Adept)", () => {
  const gs = new GameState();
  const count = Math.ceil(total * 0.25);
  ids.slice(0, count).forEach((id) => (gs.data.skillProgress[id].mastered = true));
  assertTrue(gs.getMasteryPct() >= 0.25, `expected mastery >= 25%, got ${gs.getMasteryPct()}`);
  assertEqual(gs.getEvolutionStage(), 1);
  assertEqual(gs.getEvolutionStageName(), "Adept");
});

test("mastery at/above the 75% threshold reaches stage 3 (Master)", () => {
  const gs = new GameState();
  const count = Math.ceil(total * 0.75);
  ids.slice(0, count).forEach((id) => (gs.data.skillProgress[id].mastered = true));
  assertTrue(gs.getMasteryPct() >= 0.75, `expected mastery >= 75%, got ${gs.getMasteryPct()}`);
  assertEqual(gs.getEvolutionStage(), 3);
  assertEqual(gs.getEvolutionStageName(), "Master");
});
