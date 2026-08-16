# Acto's ACT Quest

[![Tests](https://github.com/AJB92008/act-quest/actions/workflows/tests.yml/badge.svg)](https://github.com/AJB92008/act-quest/actions/workflows/tests.yml)

A "Teach Your Monster to Read"-style game for studying the ACT: customize a
monster companion, explore a world map with one island per ACT section
(English, Math, Reading, Science), and clear skill-path levels by answering
ACT-style practice questions. Earn stars and coins, unlock the next skill on
each island, and spend coins on accessories for your monster in the shop.

No build step, no dependencies — just static HTML/CSS/JS (ES modules).

## Run it

From this directory:

```
python3 -m http.server 8080
```

Then open http://localhost:8080 in a browser. (Opening `index.html` directly
via `file://` won't work — ES modules require serving over http.)

Progress (avatar, coins, stars, per-skill mastery) is saved to the browser's
`localStorage`, so it's per-browser/per-device.

## Structure

- `index.html`, `css/style.css` — shell and styling
- `js/state.js` — save/load game state (localStorage)
- `js/data/skills.js` — the 4 subjects and their skill trees
- `js/data/questions/` — question banks (English, Math, Reading, Science),
  plus Reading passages and Science data tables/viewpoints
- `js/ui/` — screens: world map, island skill-path, quiz mini-game, avatar
  creator, shop, dashboard
- `js/main.js` — simple screen router

## Tests

There's no Node/npm in this project's toolchain, so tests run directly
against the real ES modules in a browser tab instead of a separate test
runner. With the dev server above running, open
http://localhost:8080/tests/run.html — it covers the level/xp growth curve,
evolution-stage thresholds, boss level scaling, and a bounding-box sweep
that catches monster-rendering clipping regressions across every body
shape/limb/accessory combo.

`tests/audit-duplicates.html` is a separate report (not pass/fail) that
flags question stems repeated within a skill's bank — useful after bulk
content edits, since it's easy for near-duplicate questions to sneak in.
It auto-clears pairs whose `passageId`/`stimulusId` differ (legitimate
reuse of a question template against different content) and flags the
rest for a human read.

### CI

The app itself still has no Node/npm dependency, but `package.json` and
`scripts/run-tests.mjs` exist so GitHub Actions (`.github/workflows/tests.yml`)
can run the exact same `tests/run.html` suite headlessly via Playwright on
every push/PR to `main`, instead of only running when someone happens to
open the page manually. To run that same headless pass locally:

```
npm install
npx playwright install --with-deps chromium
npm test
```

## Adding content

Each skill's questions live in `js/data/questions/<subject>.js`, keyed by
skill id (see `js/data/skills.js` for the id list). A question is
`{ q, choices, answer (index), explain }`; Reading questions add
`passageId`, Science questions add `stimulusId`.

`tools/admin_server.py` runs a small local content-editing tool — a
drop-in replacement for the plain `python3 -m http.server` above (same
port, same static files, plus it disables browser caching, which avoids
the "stale JS after an edit" confusion a plain static server can cause
during active development):

```
python3 tools/admin_server.py 8080
```

Then open http://localhost:8080/tools/admin/ to browse every skill's
question bank, see which questions are flagged as likely duplicates or
have unusually low personal accuracy, and edit a question's text/choices/
explanation in place — saves write straight back into the real
`js/data/questions/*.js` source files (a precise in-place replacement of
just that one question, not a full-file rewrite), so review the git diff
afterward like any other change. It only edits existing questions in
place; it never adds or removes one.

Most skills have exactly 100 questions (20 regular lessons), but a skill's
bank *can* be extended beyond that in multiples of `LESSON_SIZE` (5) — the
ten Reading and six Science skills have each gotten four extra
10-question/2-lesson batches so far, referencing new passages/stimuli,
for exactly this reason (currently 140 questions / 28 regular lessons
each). Every skill's path also ends in a 15-question "boss lesson" —
always lesson 21 (`BOSS_LESSON_INDEX` in `js/data/questions/index.js`),
regardless of how many regular lessons the skill has, drawing a fresh
mixed-difficulty sample from that skill's whole bank rather than one more
graduated slice of it, and required to pass (same 70% threshold as any
other lesson) to master the skill. `getLessonCount()` always reports one
more than the regular-lesson count above to account for it. Extending
a skill takes two steps: append the new questions to its array in
`js/data/questions/<subject>.js` (a multiple of 5), then add or update
that skill's entry in `BANK_SIZE_OVERRIDES` in
`js/data/questions/index.js` so `getLessonCount` reports the real total —
it's a hand-maintained map specifically so lesson counts stay knowable
without loading a subject's question data first (see the comment there).
Forgetting that second step leaves the extra questions unreachable via
the normal lesson path (they'd still show up in Weak Review, Boss Quiz,
Endless Mode, the Drill Builder, and the SRS Review Queue, which all read
the full bank directly).

## Dev bootstrap

For fast manual testing, `js/devBootstrap.js` reads a handful of URL query
params (only when `?dev=1` is present, so it never affects a normal link)
to seed game state and jump straight to a screen in one page load instead
of clicking through the UI each time. For example:

```
http://localhost:8080/?dev=1&onboarded=1&xp=2000&mastered=english&screen=island&subjectId=math
```

See the comment at the top of `js/devBootstrap.js` for the full list of
recognized params.
