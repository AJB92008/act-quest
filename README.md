# Acto's ACT Quest

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
place; it never adds or removes one, since several things (lesson counts,
`tests/`) assume every skill stays at exactly 100 questions.

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
