// Regression tests for the structural accessibility fixes added in this
// pass. This suite runs from tests/run.html, not index.html, so the
// markup/CSS checks below fetch those real files' source directly rather
// than relying on them being loaded into the current document. Not (and
// can't be, in this harness) a substitute for real assistive-tech testing
// or a full WCAG audit — it just guards the specific pieces those depend
// on from silently regressing.
import { showToast } from "../js/ui/hud.js";
import { test, assertEqual, assertTrue } from "./assert.js";

async function fetchText(path) {
  const res = await fetch(path);
  return res.text();
}

test("index.html has a skip link pointing at #app", async () => {
  const html = await fetchText("../index.html");
  assertTrue(html.includes('class="skip-link"'), "expected a .skip-link element in index.html");
  assertTrue(html.includes('href="#app"'), "expected the skip link to target #app");
});

test("index.html has a visually-hidden aria-live route announcer", async () => {
  const html = await fetchText("../index.html");
  assertTrue(html.includes('id="route-announcer"'), "expected #route-announcer in index.html");
  assertTrue(html.includes('aria-live="polite"'), "expected the announcer to be aria-live=polite");
});

test("showToast renders an aria-live status region, not a silent visual-only element", () => {
  const before = document.querySelectorAll(".toast").length;
  showToast("test toast");
  const toasts = document.querySelectorAll(".toast");
  assertEqual(toasts.length, before + 1);
  const toast = toasts[toasts.length - 1];
  assertEqual(toast.getAttribute("role"), "status");
  assertEqual(toast.getAttribute("aria-live"), "polite");
  toast.remove();
});

test("css/style.css defines a text-safe island-color variant and doesn't use the raw color for text rules", async () => {
  const css = await fetchText("../css/style.css");
  assertTrue(css.includes("--island-color-text"), "expected --island-color-text to be defined");
  // Every remaining bare `color: var(--island-color)` (fallback-free) would
  // be a regression back to the low-contrast raw brand color for text —
  // matched at line-start (with only leading whitespace) so this doesn't
  // false-positive on legitimate `border-color: var(--island-color)` rules.
  const bareTextColorRule = /^\s*color:\s*var\(--island-color\)\s*;/m.test(css);
  assertTrue(!bareTextColorRule, "found a text `color:` rule using the raw --island-color instead of --island-color-text");
});

test("css/style.css's .btn-primary gradient doesn't regress to the low-contrast light stop", async () => {
  const css = await fetchText("../css/style.css");
  assertTrue(!css.includes("#7c6bff"), "the old light gradient stop (#7c6bff, ~3.89:1 against white) should no longer be present");
});
