// Tiny in-browser test harness — no build step, no dependencies, matching
// the rest of this project. Runs directly against the real ES modules via
// tests/run.html, since there's no Node/npm in this project's toolchain.

const results = [];
const pending = [];

// `fn` may be async (return a promise) — its result/rejection is tracked in
// `pending` so getResults() can await everything before the runner reads
// the final list, instead of racing ahead while an async test is mid-flight.
export function test(name, fn) {
  try {
    const ret = fn();
    if (ret && typeof ret.then === "function") {
      pending.push(
        ret.then(
          () => results.push({ name, pass: true }),
          (e) => results.push({ name, pass: false, error: e.message })
        )
      );
    } else {
      results.push({ name, pass: true });
    }
  } catch (e) {
    results.push({ name, pass: false, error: e.message });
  }
}

export function assertEqual(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertClose(actual, expected, tolerance = 0.001, msg = "") {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${msg ? msg + ": " : ""}expected ~${expected} (±${tolerance}), got ${actual}`);
  }
}

export function assertTrue(condition, msg = "") {
  if (!condition) throw new Error(msg || "expected condition to be true");
}

export async function getResults() {
  await Promise.all(pending);
  return results;
}
