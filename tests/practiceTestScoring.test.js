// Regression tests for the full-length Practice Test's raw -> scaled score
// tables (ACT_SCORE_TABLES / scaledScoreFromRaw in state.js), and the
// composite -> national percentile table (percentileForComposite).
import { ACT_SCORE_TABLES, scaledScoreFromRaw, percentileForComposite } from "../js/state.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const SECTION_MAX = { english: 75, math: 60, reading: 40, science: 40 };

for (const [subjectId, maxRaw] of Object.entries(SECTION_MAX)) {
  test(`${subjectId} score table spans raw 0..${maxRaw} inclusive`, () => {
    assertEqual(ACT_SCORE_TABLES[subjectId].length, maxRaw + 1);
  });

  test(`${subjectId}: raw 0 -> scaled 1, raw max -> scaled 36`, () => {
    assertEqual(scaledScoreFromRaw(subjectId, 0), 1);
    assertEqual(scaledScoreFromRaw(subjectId, maxRaw), 36);
  });

  test(`${subjectId} score table is monotonically non-decreasing`, () => {
    const table = ACT_SCORE_TABLES[subjectId];
    for (let i = 1; i < table.length; i++) {
      assertTrue(table[i] >= table[i - 1], `table[${i}]=${table[i]} < table[${i - 1}]=${table[i - 1]}`);
    }
  });

  test(`${subjectId}: every scaled score stays within 1-36`, () => {
    for (const scaled of ACT_SCORE_TABLES[subjectId]) {
      assertTrue(scaled >= 1 && scaled <= 36, `out-of-range scaled score ${scaled}`);
    }
  });
}

test("a half-correct raw score lands close to the ~19-20 national average composite range", () => {
  for (const [subjectId, maxRaw] of Object.entries(SECTION_MAX)) {
    const half = scaledScoreFromRaw(subjectId, Math.round(maxRaw / 2));
    assertTrue(half >= 15 && half <= 25, `${subjectId} half-raw scaled score ${half} is outside a plausible range`);
  }
});

test("scaledScoreFromRaw clamps out-of-range raw counts instead of throwing", () => {
  assertEqual(scaledScoreFromRaw("math", -5), 1);
  assertEqual(scaledScoreFromRaw("math", 9999), 36);
});

test("scaledScoreFromRaw returns a safe fallback for an unknown subject", () => {
  assertEqual(scaledScoreFromRaw("not-a-real-subject", 10), 1);
});

test("percentileForComposite: composite 36 -> 100th percentile, composite 1 -> the floor", () => {
  assertEqual(percentileForComposite(36), 100);
  assertEqual(percentileForComposite(1), 1);
});

test("percentileForComposite: the national-average composite (~20-21) lands near the 50th percentile", () => {
  const p = percentileForComposite(20);
  assertTrue(p >= 45 && p <= 55, `expected composite 20 to land near the 50th percentile, got ${p}`);
});

test("percentileForComposite is monotonically non-decreasing across the full 1-36 range", () => {
  let prev = percentileForComposite(1);
  for (let score = 2; score <= 36; score++) {
    const p = percentileForComposite(score);
    assertTrue(p >= prev, `percentile dropped from ${prev} to ${p} going from composite ${score - 1} to ${score}`);
    prev = p;
  }
});

test("percentileForComposite clamps out-of-range and rounds fractional composites instead of throwing", () => {
  assertEqual(percentileForComposite(-5), percentileForComposite(1));
  assertEqual(percentileForComposite(999), percentileForComposite(36));
  assertEqual(percentileForComposite(20.4), percentileForComposite(20));
});
