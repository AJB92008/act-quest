// Regression tests for the heuristic essay auto-grader (data/essayScoring.js).
// These deliberately avoid asserting exact score values — the heuristic's
// internal weights are free to be retuned later — and instead assert
// relative, structural behavior: a well-formed essay that actually
// exercises the signals the grader looks for should score meaningfully
// higher than a thin one that doesn't, in every domain.
import { scoreEssay } from "../js/data/essayScoring.js";
import { essayPrompts } from "../js/data/essayPrompts.js";
import { test, assertEqual, assertTrue } from "./assert.js";

const prompt = essayPrompts[0];

const STRONG_ESSAY = `
Later school start times are worth adopting, but only alongside real changes to how much students are asked to do after class.

Perspective One is right that biology isn't optional. If teenagers can't fall asleep earlier no matter how hard they try, an early start time just manufactures exhaustion on purpose. However, Perspective Two raises a fair complication: a schedule change ripples into bus routes, work shifts, and family routines that other people built their lives around, and dismissing that cost isn't fair either.

I believe the strongest approach borrows from Perspective Three: a later start time helps, but only if it's paired with lighter homework loads and fewer after-school obligations. For example, a school that shifts its start time by an hour but leaves three hours of nightly homework in place hasn't actually solved the sleep problem, it's just moved it later in the day. This shows that the clock alone was never the whole story.

In conclusion, a later start time is a reasonable first step, not a complete fix, and treating it as the whole solution would repeat the same mistake Perspective Three warns about.
`.trim();

const THIN_ESSAY = "school start times good idea maybe";

test("scoreEssay returns all four domains, each 1-6", () => {
  const { domainScores } = scoreEssay(STRONG_ESSAY, prompt);
  assertEqual(Object.keys(domainScores).sort().join(","), "development,ideas,language,organization");
  for (const score of Object.values(domainScores)) {
    assertTrue(score >= 1 && score <= 6, `domain score ${score} out of 1-6 range`);
  }
});

test("scoreEssay returns a signals explanation for every domain", () => {
  const { domainScores, signals } = scoreEssay(STRONG_ESSAY, prompt);
  for (const id of Object.keys(domainScores)) {
    assertTrue(Array.isArray(signals[id]) && signals[id].length > 0, `missing signals for ${id}`);
  }
});

test("a well-developed, multi-paragraph essay scores at least as high as a thin one-liner in every domain", () => {
  const strong = scoreEssay(STRONG_ESSAY, prompt).domainScores;
  const thin = scoreEssay(THIN_ESSAY, prompt).domainScores;
  for (const id of Object.keys(strong)) {
    assertTrue(strong[id] >= thin[id], `expected strong essay's ${id} score (${strong[id]}) >= thin essay's (${thin[id]})`);
  }
});

test("an essay that explicitly engages multiple given perspectives scores higher on Ideas & Analysis than one that ignores them", () => {
  const engaged = scoreEssay(STRONG_ESSAY, prompt).domainScores.ideas;
  const ignoring = scoreEssay(
    "I like pizza and video games and my favorite color is blue and I want to talk about something totally unrelated to any of this.",
    prompt
  ).domainScores.ideas;
  assertTrue(engaged > ignoring, `expected engaged essay's ideas score (${engaged}) > unrelated essay's (${ignoring})`);
});

test("an empty draft doesn't throw and scores at the floor", () => {
  const { domainScores } = scoreEssay("", prompt);
  for (const score of Object.values(domainScores)) {
    assertEqual(score, 1);
  }
});

test("scoreEssay is deterministic for the same input", () => {
  const a = scoreEssay(STRONG_ESSAY, prompt).domainScores;
  const b = scoreEssay(STRONG_ESSAY, prompt).domainScores;
  assertEqual(JSON.stringify(a), JSON.stringify(b));
});
