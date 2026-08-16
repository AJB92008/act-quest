// Regression test for a prose-style rule: this app's own UI copy and code
// comments consistently use an em dash ("—" / &mdash;) wherever a dash-as-
// punctuation is called for (see nearly every other file in this project).
// A "bare" en dash ("–" / &ndash;) — one not sitting between two digits —
// reads as a typo/inconsistency if it sneaks into that prose. An en dash
// *between* two digits (e.g. "3–5", "1–36 scale") is left alone: that's
// the typographically correct dash for a numeric range, not a mistake.
// The question banks are exempt outright, on top of that: a real
// ACT-style question can reasonably use either dash as part of its actual
// content, which isn't this test's business to police.
import { test, assertTrue } from "./assert.js";

// Matches a literal en dash or its HTML entity, capturing the character
// immediately on each side so callers can tell a numeric range (both
// sides digits) from a bare dash (anything else, including string start/end).
const EN_DASH_WITH_CONTEXT = /(.)?(–|&ndash;)(.)?/g;

function findBareEnDashes(text) {
  const bare = [];
  for (const [whole, before, dash, after] of text.matchAll(EN_DASH_WITH_CONTEXT)) {
    const isNumericRange = before && after && /\d/.test(before) && /\d/.test(after);
    if (!isNumericRange) bare.push(whole);
  }
  return bare;
}

async function fetchText(path) {
  const res = await fetch(path);
  return res.text();
}

// python http.server (used for both local dev and this Playwright-driven
// CI run — see scripts/run-tests.mjs) auto-generates a plain
// `<a href="name">name</a>` directory listing for any folder without its
// own index.html. Crawling that, instead of hand-maintaining a file list,
// means this test keeps covering every file even as new ones are added —
// a hardcoded list would silently stop covering whatever's added after it.
async function listDir(path) {
  const html = await fetchText(path);
  return [...html.matchAll(/<a href="([^"]+)">/g)].map((m) => decodeURIComponent(m[1]));
}

async function collectJsFiles(dir, skipDirs) {
  const entries = await listDir(dir);
  let files = [];
  for (const entry of entries) {
    if (entry.startsWith("..") || entry.startsWith("/")) continue; // parent-dir links some listings include
    const full = dir + entry;
    if (entry.endsWith("/")) {
      if (skipDirs.some((skip) => full.endsWith(skip))) continue;
      files = files.concat(await collectJsFiles(full, skipDirs));
    } else if (entry.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

test("no bare en dash (–) appears outside the question banks (numeric ranges like \"1–36\" are fine)", async () => {
  const jsFiles = await collectJsFiles("../js/", ["../js/data/questions/"]);
  const files = [...jsFiles, "../index.html", "../css/style.css"];
  const offenders = [];
  for (const file of files) {
    const text = await fetchText(file);
    if (findBareEnDashes(text).length > 0) offenders.push(file.replace("../", ""));
  }
  assertTrue(offenders.length === 0, `bare en dash (not part of a numeric range) found outside the question banks in: ${offenders.join(", ")}`);
});
