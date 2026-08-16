import { SUBJECTS, allSkillIds } from "./data/skills.js";
import { getLessonCount } from "./data/questions/index.js";
import { ACHIEVEMENTS } from "./data/achievements.js";
import { TEST_IDS, getSubject as getAnySubject } from "./data/tests.js";

const STORAGE_KEY = "act-quest-save-v1";
const PASS_THRESHOLD = 0.7; // score needed to pass a mini-lesson / master a skill
const SRS_DAY_MS = 24 * 60 * 60 * 1000;
// A soft ceiling on the Mistake Journal, not a "recent history" window —
// at a few dozen bytes per entry this is still a few hundred KB even at
// the cap, well within localStorage's typical budget, and no realistic
// amount of normal play gets close to it; it exists purely so an
// extremely long-lived save can't grow without bound.
const MISTAKE_JOURNAL_CAP = 10000;

// SM-2 spaced-repetition update, in place on `item` ({efactor, interval,
// repetitions, dueAt}). Quality is collapsed to just two buckets (correct
// vs. incorrect) rather than the full 0-5 self-rated scale SM-2 was
// originally designed around, since nothing in this app captures "correct
// but it was a struggle" — a multiple-choice answer or a flashcard
// self-check is only ever right or wrong.
function sm2Update(item, correct) {
  const quality = correct ? 5 : 2;
  if (quality < 3) {
    item.repetitions = 0;
    item.interval = 1;
  } else {
    if (item.repetitions === 0) item.interval = 1;
    else if (item.repetitions === 1) item.interval = 6;
    else item.interval = Math.round(item.interval * item.efactor);
    item.repetitions += 1;
  }
  item.efactor = Math.max(1.3, item.efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  item.dueAt = Date.now() + item.interval * SRS_DAY_MS;
  item.lastCorrect = correct;
  return item;
}

// Evolution stages tied to overall mastery %: at each threshold monsterSVG
// renders a more elaborate version of the player's own chosen body shape
// (more/bigger thematic decoration, a growing aura, extra size) rather than
// switching to a different shape entirely — see bodyShapeMarkup() in
// ui/monster.js. The base silhouette, clip path, and every accessory
// anchor stay identical across stages, so nothing ever misaligns.
const EVOLUTION_STAGE_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];
export const EVOLUTION_STAGE_NAMES = ["Hatchling", "Adept", "Veteran", "Master", "Legendary"];

// XP needed to reach a given level follows a simple growing curve
// (level 2 @ 20xp, level 3 @ 80xp, level 4 @ 180xp...); xp is granted
// 1-for-1 with stars earned, so leveling tracks overall play without a
// second reward economy to tune.
function levelFromXp(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 20)) + 1;
}
function xpFloorForLevel(level) {
  return Math.pow(level - 1, 2) * 20;
}

// Rough accuracy -> ACT 1-36 scale mapping used by the score predictor when
// all it has to go on is overall lesson accuracy (no section structure to
// build a real per-section table from). Deliberately just a simple linear
// stand-in — see scaledScoreFromRaw() below for the full-length Practice
// Test's more realistic, section-shaped conversion.
export function scoreFromAccuracy(accuracy) {
  return Math.max(1, Math.min(36, Math.round(1 + accuracy * 35)));
}

// Approximates the *shape* of a real ACT raw-score -> scaled-score
// conversion table: steep through the middle (a few more right answers
// swing the scaled score noticeably) and flatter — more forgiving — near
// the extremes, with Math/Science historically more forgiving at the very
// top than English/Reading (missing a handful there can still land a 36,
// missing even one or two in English/Reading more often costs a point).
// This is *not* any single real test form's actual table — ACT scores each
// form against its own unpublished curve, so there's no one true table to
// copy — just a consistently-shaped, honest approximation, built once per
// section into a real lookup table (raw score -> scaled score) rather than
// computed on the fly.
// Real ACT per-question time budget (section minutes / question count),
// used only to give pacing feedback a concrete benchmark to compare
// against — not used anywhere in scoring.
const ACT_PACE_BUDGET_SECONDS = {
  english: Math.round((45 * 60) / 75), // 36s
  math: Math.round((60 * 60) / 60), // 60s
  reading: Math.round((35 * 60) / 40), // 52.5s -> 53s
  science: Math.round((35 * 60) / 40), // 52.5s -> 53s
};

const SECTION_CURVE_PARAMS = {
  english: { maxRaw: 75, p0: 0.5, k: 7 },
  math: { maxRaw: 60, p0: 0.44, k: 7 },
  reading: { maxRaw: 40, p0: 0.5, k: 7 },
  science: { maxRaw: 40, p0: 0.44, k: 7 },
};

function buildScoreTable(maxRaw, p0, k) {
  const logistic = (p) => 1 / (1 + Math.exp(-k * (p - p0)));
  const lo = logistic(0);
  const hi = logistic(1);
  const table = [];
  for (let raw = 0; raw <= maxRaw; raw++) {
    const norm = (logistic(raw / maxRaw) - lo) / (hi - lo);
    table.push(Math.max(1, Math.min(36, Math.round(1 + norm * 35))));
  }
  return table;
}

export const ACT_SCORE_TABLES = Object.fromEntries(
  Object.entries(SECTION_CURVE_PARAMS).map(([subjectId, { maxRaw, p0, k }]) => [subjectId, buildScoreTable(maxRaw, p0, k)])
);

/** Raw correct-answer count for one full-length Practice Test section ->
 * that section's 1-36 scaled score, via ACT_SCORE_TABLES. */
export function scaledScoreFromRaw(subjectId, correctCount) {
  const table = ACT_SCORE_TABLES[subjectId];
  if (!table) return 1;
  const clamped = Math.max(0, Math.min(table.length - 1, Math.round(correctCount)));
  return table[clamped];
}

// National percentile rank by 1-36 composite score. Same honesty as
// ACT_SCORE_TABLES above: ACT re-norms these against each year's actual
// test-taking population and publishes updated tables periodically, so
// there's no single permanent "true" table to copy — this is a
// consistently-shaped approximation based on the general contour of ACT's
// published national percentile ranks in recent years, not a live feed of
// the current official numbers. Composite only; real ACT percentiles also
// vary slightly by section, which this doesn't attempt to model.
const COMPOSITE_PERCENTILES = [
  1, 1, 1, 1, 1, 1, 1, 1, // 1-8
  1, 2, 3, 5, 8, 12, 18, 25, // 9-16
  32, 38, 44, 50, 57, 63, 69, 75, // 17-24
  80, 84, 87, 90, 93, 95, 96, 97, // 25-32
  98, 99, 99, 100, // 33-36
];

/** 1-36 composite -> approximate national percentile (1-100). See
 * COMPOSITE_PERCENTILES above for what this is (and isn't) based on. */
export function percentileForComposite(score) {
  const clamped = Math.max(1, Math.min(36, Math.round(score)));
  return COMPOSITE_PERCENTILES[clamped - 1];
}

function defaultSave() {
  const skillProgress = {};
  const bossCleared = {};
  for (const subject of SUBJECTS) {
    subject.skills.forEach((skill) => {
      skillProgress[skill.id] = {
        mastered: false,
        attempts: 0,
        correct: 0,
        bestScore: 0,
        stars: 0,
        lessonsCompleted: 0,
        questionStats: {},
      };
    });
    bossCleared[subject.id] = false;
  }
  return {
    version: 1,
    createdName: "",
    // Which planet's World Map/island/skill-path the shared navigation
    // spine currently points at (see data/tests.js) — everyone starts on
    // the one planet with real content.
    currentTestId: "act",
    avatar: {
      bodyColor: "#7fd1ae",
      bodyShape: "round",
      limbs: 0,
      eyeType: 0,
      mouthType: 0,
      skin: "none",
      spots: false,
      head: "none",
      face: "none",
      back: "none",
      tail: "none",
      outfit: "none",
      scar: "none",
    },
    coins: 0,
    totalStars: 0,
    ownedItems: [],
    skillProgress,
    bossCleared,
    onboarded: false,
    settings: {
      timerEnabled: true,
      darkMode: false,
      devModeUnlocked: false,
    },
    endless: {
      bestRun: 0,
      timerEnabled: true,
    },
    monster: {
      xp: 0,
    },
    practiceTests: {
      bestComposite: 0,
      history: [],
    },
    essays: {
      bestScore: 0,
      history: [],
    },
    mistakeJournal: [],
    streak: {
      lastActiveDate: null,
      current: 0,
      best: 0,
      activeDates: [],
    },
    achievements: {
      unlocked: {},
    },
    srs: {
      questions: {},
      vocab: {},
      totalReviews: 0,
    },
    pacing: {
      bySubject: {},
    },
    studyPlan: {
      testDate: null,
      targetScore: null,
    },
  };
}

export class GameState {
  constructor() {
    this.data = this._load();
    this._saveListeners = [];
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      // Merge with defaults so newly-added skills/subjects appear for existing saves.
      const fresh = defaultSave();
      fresh.avatar = { ...fresh.avatar, ...parsed.avatar };
      fresh.coins = parsed.coins ?? fresh.coins;
      fresh.totalStars = parsed.totalStars ?? fresh.totalStars;
      fresh.ownedItems = parsed.ownedItems ?? fresh.ownedItems;
      // Type-checked, not just presence-checked: this same merge runs for
      // a cloud-pulled remote save (see cloudSync.js's importSave call),
      // which this device has no control over the contents of — a plain
      // `?? fresh.createdName` would happily carry through a non-string
      // value into a field several screens render as text.
      fresh.createdName = typeof parsed.createdName === "string" ? parsed.createdName.slice(0, 40) : fresh.createdName;
      // Guarded against more than just the wrong type — a stale save could
      // reference a planet id that no longer exists (or never did, if this
      // came from a tampered/imported save), and that id flows straight
      // into data/tests.js lookups downstream with no further checking.
      fresh.currentTestId = typeof parsed.currentTestId === "string" && TEST_IDS.has(parsed.currentTestId) ? parsed.currentTestId : fresh.currentTestId;
      fresh.onboarded = parsed.onboarded ?? fresh.onboarded;
      fresh.settings = { ...fresh.settings, ...parsed.settings };
      fresh.endless = { ...fresh.endless, ...parsed.endless };
      fresh.bossCleared = { ...fresh.bossCleared, ...parsed.bossCleared };
      fresh.monster = { ...fresh.monster, ...parsed.monster };
      fresh.practiceTests = { ...fresh.practiceTests, ...parsed.practiceTests };
      fresh.essays = { ...fresh.essays, ...parsed.essays };
      fresh.mistakeJournal = Array.isArray(parsed.mistakeJournal) ? parsed.mistakeJournal : fresh.mistakeJournal;
      fresh.streak = { ...fresh.streak, ...parsed.streak };
      fresh.achievements = {
        ...fresh.achievements,
        ...parsed.achievements,
        unlocked: { ...fresh.achievements.unlocked, ...parsed.achievements?.unlocked },
      };
      fresh.srs = {
        ...fresh.srs,
        ...parsed.srs,
        questions: { ...fresh.srs.questions, ...parsed.srs?.questions },
        vocab: { ...fresh.srs.vocab, ...parsed.srs?.vocab },
      };
      fresh.pacing = { ...fresh.pacing, ...parsed.pacing, bySubject: { ...fresh.pacing.bySubject, ...parsed.pacing?.bySubject } };
      fresh.studyPlan = { ...fresh.studyPlan, ...parsed.studyPlan };
      if (typeof fresh.studyPlan.testDate !== "string") fresh.studyPlan.testDate = null;
      if (typeof fresh.studyPlan.targetScore !== "number" || !Number.isFinite(fresh.studyPlan.targetScore)) fresh.studyPlan.targetScore = null;
      for (const id of allSkillIds()) {
        if (parsed.skillProgress && parsed.skillProgress[id]) {
          fresh.skillProgress[id] = { ...fresh.skillProgress[id], ...parsed.skillProgress[id] };
        }
        // Saves from before mini-lessons existed may have `mastered: true`
        // from the old single-quiz pass criteria; grandfather those in as
        // fully complete instead of showing a mastered skill with 0 lessons done.
        const p = fresh.skillProgress[id];
        if (p.mastered && p.lessonsCompleted < getLessonCount(id)) {
          p.lessonsCompleted = getLessonCount(id);
        }
      }
      return fresh;
    } catch {
      return defaultSave();
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this._saveListeners.forEach((cb) => cb(this.data));
  }

  /** Subscribes to every future save (e.g. so cloudSync.js can debounce a
   * push without state.js needing to import or know anything about
   * Firebase). Returns an unsubscribe function. */
  onSave(cb) {
    this._saveListeners.push(cb);
    return () => {
      this._saveListeners = this._saveListeners.filter((l) => l !== cb);
    };
  }

  reset() {
    this.data = defaultSave();
    this.save();
  }

  /** The full save as a JSON string, for the player to download as a
   * backup or carry over to another browser/device — the only way
   * progress survives right now, since there's no account/cloud sync. */
  exportSave() {
    return JSON.stringify(this.data, null, 2);
  }

  /** Restores a save from a previously-exported JSON string. Writes it to
   * localStorage and re-runs the normal startup load path (_load()) rather
   * than assigning `parsed` directly, so an import from an older app
   * version — missing fields this version added later — still comes out
   * fully populated via the same defaults-merge every real load already
   * goes through, instead of leaving gaps that crash something down the
   * line. Returns { ok: true } or { ok: false, error } — never throws. */
  importSave(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { ok: false, error: "That doesn't look like a valid save file (not valid JSON)." };
    }
    if (!parsed || typeof parsed !== "object" || !parsed.avatar || !parsed.skillProgress) {
      return { ok: false, error: "That file doesn't look like an Acto's ACT Quest save." };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    this.data = this._load();
    this.save();
    return { ok: true };
  }

  // --- avatar ---
  getAvatar() {
    return this.data.avatar;
  }

  setAvatar(partial) {
    this.data.avatar = { ...this.data.avatar, ...partial };
    this.save();
  }

  setName(name) {
    this.data.createdName = name;
    this.data.onboarded = true;
    this.save();
  }

  get currentTestId() {
    return this.data.currentTestId;
  }

  setCurrentTestId(testId) {
    if (!TEST_IDS.has(testId)) return;
    this.data.currentTestId = testId;
    this.save();
  }

  // --- currency ---
  get coins() {
    return this.data.coins;
  }

  get totalStars() {
    return this.data.totalStars;
  }

  get ownedItems() {
    return this.data.ownedItems;
  }

  // --- settings ---
  get timerEnabled() {
    return this.data.settings.timerEnabled;
  }

  setTimerEnabled(enabled) {
    this.data.settings.timerEnabled = enabled;
    this.save();
  }

  get darkMode() {
    return this.data.settings.darkMode;
  }

  setDarkMode(enabled) {
    this.data.settings.darkMode = enabled;
    this.save();
  }

  get devModeUnlocked() {
    return this.data.settings.devModeUnlocked;
  }

  setDevModeUnlocked(enabled) {
    this.data.settings.devModeUnlocked = enabled;
    this.save();
  }

  // --- monster progression: XP/level and evolution ---
  get xp() {
    return this.data.monster.xp;
  }

  get level() {
    return levelFromXp(this.data.monster.xp);
  }

  /** Level + progress toward the next one, for a progress bar. */
  getLevelProgress() {
    const level = this.level;
    const xp = this.data.monster.xp;
    const floorXp = xpFloorForLevel(level);
    const nextXp = xpFloorForLevel(level + 1);
    const pct = nextXp > floorXp ? (xp - floorXp) / (nextXp - floorXp) : 1;
    return { level, xp, floorXp, nextXp, pct: Math.max(0, Math.min(1, pct)) };
  }

  /** Grants xp 1-for-1 with stars earned (call from each reward-recording
   * method, right after that flow's own starsEarned is known) and reports
   * whether it crossed a level boundary, for a "Level Up!" moment. */
  _grantXp(amount) {
    if (!amount || amount <= 0) return { leveledUp: false, newLevel: this.level };
    const before = this.level;
    this.data.monster.xp += amount;
    const after = this.level;
    return { leveledUp: after > before, newLevel: after };
  }

  /** Fraction (0-1) of all skills mastered across every subject — drives
   * monster evolution stages. */
  getMasteryPct() {
    const ids = allSkillIds();
    if (ids.length === 0) return 0;
    let masteredCount = 0;
    for (const id of ids) {
      if (this.data.skillProgress[id]?.mastered) masteredCount++;
    }
    return masteredCount / ids.length;
  }

  getEvolutionStage() {
    const pct = this.getMasteryPct();
    let stage = 0;
    for (let i = EVOLUTION_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (pct >= EVOLUTION_STAGE_THRESHOLDS[i]) {
        stage = i;
        break;
      }
    }
    return stage;
  }

  getEvolutionStageName() {
    return EVOLUTION_STAGE_NAMES[this.getEvolutionStage()];
  }

  /** The avatar as it actually looks right now: the player's own
   * customization plus the current evolution stage (which monsterSVG uses
   * to render a more elaborate version of that same chosen shape — see
   * bodyShapeMarkup() in ui/monster.js — rather than a different shape)
   * and current level (which drives the monster's automatic size growth,
   * replacing the old manual size picker). */
  getDisplayAvatar() {
    return { ...this.data.avatar, evolutionStage: this.getEvolutionStage(), level: this.level };
  }

  // --- endless mode ---
  get endlessBest() {
    return this.data.endless.bestRun;
  }

  // Endless Mode has its own timer preference, separate from regular
  // lessons' — toggling it also controls the 1.5x timed-run reward bonus,
  // so it shouldn't silently flip a player's unrelated lesson setting.
  get endlessTimerEnabled() {
    return this.data.endless.timerEnabled;
  }

  setEndlessTimerEnabled(enabled) {
    this.data.endless.timerEnabled = enabled;
    this.save();
  }

  /** Record the outcome of a finished Endless Mode run. */
  recordEndlessRun({ correctCount, starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const isNewBest = correctCount > this.data.endless.bestRun;
    if (isNewBest) this.data.endless.bestRun = correctCount;
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { isNewBest, newlyUnlocked, ...levelResult };
  }

  addCoins(n) {
    this.data.coins += n;
    this.save();
  }

  /** Spends coins (e.g. for a hint) if affordable; returns false without
   * effect otherwise. */
  spendCoins(n) {
    if (this.data.coins < n) return false;
    this.data.coins -= n;
    this.save();
    return true;
  }

  ownsItem(id) {
    return id === "none" || this.data.ownedItems.includes(id);
  }

  purchase(id, cost) {
    if (this.data.coins < cost || this.ownsItem(id)) return false;
    this.data.coins -= cost;
    this.data.ownedItems.push(id);
    this.save();
    return true;
  }

  // --- skill progress ---
  getSkillProgress(skillId) {
    return this.data.skillProgress[skillId];
  }

  isMastered(skillId) {
    return !!this.data.skillProgress[skillId]?.mastered;
  }

  /**
   * A skill's mini-lessons unlock one at a time, in order; lesson 0 is
   * always open. Passing lesson N unlocks lesson N+1, but every lesson up
   * to (and including) the next unpassed one stays freely revisitable.
   */
  isLessonUnlocked(skillId, lessonIndex) {
    if (lessonIndex === 0) return true;
    const progress = this.data.skillProgress[skillId];
    return lessonIndex <= (progress?.lessonsCompleted ?? 0);
  }

  /** Record the outcome of a finished mini-lesson (5 questions) for a skill. */
  recordLessonResult(skillId, lessonIndex, { correctCount, totalCount, starsEarned, coinsEarned }) {
    const progress = this.data.skillProgress[skillId];
    if (!progress) return;
    const stageBefore = this.getEvolutionStage();
    progress.attempts += totalCount;
    progress.correct += correctCount;
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    progress.bestScore = Math.max(progress.bestScore, score);
    progress.stars += starsEarned;
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;

    const passed = score >= PASS_THRESHOLD;
    let justAdvanced = false;
    if (passed && lessonIndex === progress.lessonsCompleted) {
      progress.lessonsCompleted += 1;
      justAdvanced = true;
    }

    const totalLessons = getLessonCount(skillId);
    let justMastered = false;
    if (!progress.mastered && progress.lessonsCompleted >= totalLessons) {
      progress.mastered = true;
      justMastered = true;
    }

    const stageAfter = this.getEvolutionStage();
    const justEvolved = stageAfter > stageBefore;
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { score, passed, justAdvanced, justMastered, totalLessons, justEvolved, evolutionStage: stageAfter, newlyUnlocked, ...levelResult };
  }

  /**
   * The skills with the lowest accuracy (correct/attempts), for building a
   * weak-spot review session. Skills need at least `minAttempts` answers
   * before they're considered — otherwise a single unlucky guess on a
   * skill you've barely touched would dominate the "weakest" ranking. Skills
   * at or above `maxAccuracy` are excluded outright, so a genuinely strong
   * skill never gets padded into the list just to fill it out to `count`.
   */
  getWeakSkills(count = 5, minAttempts = 5, maxAccuracy = 0.9) {
    return allSkillIds()
      .map((id) => ({ id, progress: this.data.skillProgress[id] }))
      .filter((s) => s.progress.attempts >= minAttempts)
      .map((s) => ({ id: s.id, accuracy: s.progress.correct / s.progress.attempts }))
      .filter((s) => s.accuracy < maxAccuracy)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, count);
  }

  /** Records one answer from a Weak Skill Review session against that
   * skill's ongoing accuracy stats, without touching lesson progress/mastery
   * (review sessions are optional practice, not part of a skill's path). */
  recordWeakReviewAnswer(skillId, correct) {
    const progress = this.data.skillProgress[skillId];
    if (!progress) return;
    progress.attempts += 1;
    if (correct) progress.correct += 1;
  }

  /** Records one answer against a *specific* question's own stats —
   * identified by its skill plus its stable position in that skill's
   * 100-question bank (`bankIndex`, attached to every question object
   * returned from data/questions/index.js). This is separate from the
   * skill-level attempts/correct tallies above: it's what lets
   * getWeakReviewQuestions() weight by a player's personal history with
   * one specific question, not just their overall accuracy on the skill it
   * belongs to. Sparse by design — most of a skill's 100 questions will
   * never appear here if the player hasn't happened to hit them yet. */
  recordQuestionAnswer(skillId, bankIndex, correct, chosenIndex = null) {
    const progress = this.data.skillProgress[skillId];
    if (!progress || bankIndex == null) return;
    if (!progress.questionStats) progress.questionStats = {};
    const key = String(bankIndex);
    const stat = progress.questionStats[key] || { attempts: 0, correct: 0 };
    stat.attempts += 1;
    if (correct) stat.correct += 1;
    progress.questionStats[key] = stat;
    // Every place a question gets answered (lessons, weak review, boss
    // quiz, endless, practice test) funnels through here, so this single
    // hook is enough to keep the SM-2 review queue up to date everywhere
    // without touching each of those screens individually.
    this._srsTouch(this.data.srs.questions, `${skillId}:${bankIndex}`, correct);
    // Same reasoning extends to the Mistake Journal: this is the one place
    // that sees every missed question regardless of which screen it
    // happened on, so it's a comprehensive longitudinal log for free
    // rather than something each screen would need to opt into
    // separately. Deliberately *not* rolled/capped to a small "recent N"
    // window the way practiceTests/essays history is — the entire point
    // is a full history that's expensive to reconstruct after the fact —
    // just a generous ceiling so an extremely long-lived save can't grow
    // localStorage without bound.
    if (!correct) {
      this.data.mistakeJournal.push({ skillId, bankIndex, chosenIndex, date: Date.now() });
      if (this.data.mistakeJournal.length > MISTAKE_JOURNAL_CAP) this.data.mistakeJournal.shift();
    }
  }

  /** A specific question's own {attempts, correct} (or undefined if the
   * player has never answered it), keyed the same way as
   * recordQuestionAnswer(). */
  getQuestionStat(skillId, bankIndex) {
    return this.data.skillProgress[skillId]?.questionStats?.[bankIndex];
  }

  /** Every logged mistake, newest first. Raw entries only
   * ({skillId, bankIndex, chosenIndex, date}) — resolving the actual
   * question text/choices/explain is the UI's job (ui/mistakeJournal.js),
   * done by loading the relevant subject's bank the same way every other
   * screen does, so this stays a plain data accessor with no dependency on
   * question-bank content. */
  getMistakeJournal() {
    return this.data.mistakeJournal.slice().reverse();
  }

  mistakeJournalCount() {
    return this.data.mistakeJournal.length;
  }

  /** Banks the stars/coins earned from a Weak Skill Review session (call
   * once, at the end — per-question accuracy updates already happened via
   * recordWeakReviewAnswer and just need saving now). */
  finishWeakReview({ starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { newlyUnlocked, ...levelResult };
  }

  isBossCleared(subjectId) {
    return !!this.data.bossCleared[subjectId];
  }

  /** Record the outcome of a finished Boss Quiz for a subject. */
  recordBossQuizResult(subjectId, { correctCount, totalCount, starsEarned, coinsEarned }) {
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    const passed = score >= PASS_THRESHOLD;
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    let justCleared = false;
    if (passed && !this.data.bossCleared[subjectId]) {
      this.data.bossCleared[subjectId] = true;
      justCleared = true;
    }
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { score, passed, justCleared, newlyUnlocked, ...levelResult };
  }

  getSubjectStats(subjectId) {
    // getAnySubject (data/tests.js), not skills.js's ACT-only SUBJECTS —
    // this is called for any planet's subjects from the World Map, and a
    // still-contentless planet's subject (skills: []) needs to resolve to
    // real zeros here, not throw on `.skills` of an undefined lookup.
    const subject = getAnySubject(subjectId);
    let attempts = 0;
    let correct = 0;
    let masteredCount = 0;
    for (const skill of subject.skills) {
      const p = this.data.skillProgress[skill.id];
      attempts += p.attempts;
      correct += p.correct;
      if (p.mastered) masteredCount++;
    }
    return {
      accuracy: attempts > 0 ? correct / attempts : null,
      attempts,
      masteredCount,
      totalSkills: subject.skills.length,
    };
  }

  getOverallStats() {
    const subjectStats = SUBJECTS.map((s) => ({ subject: s, ...this.getSubjectStats(s.id) }));
    const totalSkills = allSkillIds().length;
    const masteredCount = subjectStats.reduce((sum, s) => sum + s.masteredCount, 0);
    return { subjectStats, totalSkills, masteredCount, totalStars: this.data.totalStars, coins: this.data.coins };
  }

  // --- score predictor & practice tests ---
  get practiceTestBest() {
    return this.data.practiceTests.bestComposite;
  }

  getPracticeTestHistory() {
    return this.data.practiceTests.history;
  }

  /** Rough 1-36 composite estimate. A real practice test's composite is a
   * much stronger, apples-to-apples signal than lesson accuracy, so the
   * most recent one wins whenever one exists; otherwise fall back to
   * overall lesson accuracy (once there's enough of it to mean anything). */
  getPredictedScore() {
    const history = this.data.practiceTests.history;
    if (history.length > 0) {
      const latest = history[history.length - 1];
      return { score: latest.composite, source: "practiceTest" };
    }
    let attempts = 0;
    let correct = 0;
    for (const id of allSkillIds()) {
      const p = this.data.skillProgress[id];
      attempts += p.attempts;
      correct += p.correct;
    }
    if (attempts < 20) return { score: null, source: "insufficient" };
    return { score: scoreFromAccuracy(correct / attempts), source: "lessons" };
  }

  /** Records a finished full-length practice test. `sectionResults` is
   * [{ subjectId, label, correctCount, totalCount, subscore }]; composite
   * is the average of the 4 subscores, same as how the real ACT computes
   * its composite from section scores. */
  recordPracticeTestResult({ sectionResults, composite, starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const isNewBest = composite > this.data.practiceTests.bestComposite;
    if (isNewBest) this.data.practiceTests.bestComposite = composite;
    this.data.practiceTests.history.push({ date: Date.now(), composite, sectionResults });
    if (this.data.practiceTests.history.length > 20) this.data.practiceTests.history.shift();
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { isNewBest, newlyUnlocked, ...levelResult };
  }

  // --- optional Writing section ---
  get essayBest() {
    return this.data.essays.bestScore;
  }

  getEssayHistory() {
    return this.data.essays.history;
  }

  /** Records a finished, self-scored essay. `domainScores` is
   * { ideas, development, organization, language }, each 1-6 (this
   * player's own single-rater rubric self-assessment); `totalScore` is the
   * 2-12 scale result the essay screen derives from those the same way the
   * real ACT averages two raters' domain scores into one, just with one
   * rater instead of two. */
  recordEssayResult({ promptId, wordCount, domainScores, totalScore, starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const isNewBest = totalScore > this.data.essays.bestScore;
    if (isNewBest) this.data.essays.bestScore = totalScore;
    this.data.essays.history.push({ date: Date.now(), promptId, wordCount, domainScores, totalScore });
    if (this.data.essays.history.length > 20) this.data.essays.history.shift();
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { isNewBest, newlyUnlocked, ...levelResult };
  }

  // --- daily streak ---
  _todayLocalDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  _addDaysToDateStr(dateStr, days) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }

  /** Marks today as an active study day and rolls the current/best streak
   * forward. Idempotent within a single day, so every "session complete"
   * path can call it freely without double-counting. */
  _recordDailyActivity() {
    const today = this._todayLocalDateStr();
    const s = this.data.streak;
    if (s.lastActiveDate === today) return;
    const yesterday = this._addDaysToDateStr(today, -1);
    s.current = s.lastActiveDate === yesterday ? s.current + 1 : 1;
    s.best = Math.max(s.best, s.current);
    s.lastActiveDate = today;
    s.activeDates.push(today);
    if (s.activeDates.length > 371) s.activeDates.shift();
  }

  /** The streak as it reads *right now* — computed lazily rather than
   * eagerly reset on a timer, so a streak that lapsed a few days ago
   * correctly shows 0 without needing a background job to notice. */
  getStreak() {
    const s = this.data.streak;
    const today = this._todayLocalDateStr();
    const yesterday = this._addDaysToDateStr(today, -1);
    const current = s.lastActiveDate === today || s.lastActiveDate === yesterday ? s.current : 0;
    return { current, best: s.best, activeToday: s.lastActiveDate === today, activeDates: s.activeDates };
  }

  // --- achievements ---
  getAchievements() {
    return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: this.data.achievements.unlocked[a.id] ?? null }));
  }

  /** Re-checks every achievement's condition against the current save and
   * unlocks any newly-met ones. Safe to call as often as needed — already-
   * unlocked badges are skipped, and conditions are pure reads of `this`. */
  _checkAchievements() {
    const newly = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.data.achievements.unlocked[ach.id]) continue;
      if (ach.condition(this)) {
        this.data.achievements.unlocked[ach.id] = Date.now();
        newly.push(ach);
      }
    }
    return newly;
  }

  // --- spaced repetition (SM-2) ---
  _srsTouch(store, key, correct) {
    const item = store[key] || { efactor: 2.5, interval: 0, repetitions: 0, dueAt: Date.now() };
    sm2Update(item, correct);
    store[key] = item;
    this.data.srs.totalReviews += 1;
  }

  /** Questions due for spaced-repetition review right now (or overdue),
   * oldest-due first. Only questions that have actually been answered at
   * least once show up here — SRS tracking starts the first time
   * recordQuestionAnswer sees a question, not before. */
  getDueQuestionKeys(limit = 20) {
    const now = Date.now();
    return Object.entries(this.data.srs.questions)
      .filter(([, item]) => item.dueAt <= now)
      .sort((a, b) => a[1].dueAt - b[1].dueAt)
      .slice(0, limit)
      .map(([key]) => key);
  }

  /** Vocab flashcards are self-graded (there's no multiple-choice to check
   * against), so this is called directly with the player's own "Got it" /
   * "Didn't know it" judgment rather than being inferred from a quiz
   * answer. `word` is the flashcard's front text, unique across the deck. */
  recordVocabReview(word, gotIt) {
    this._srsTouch(this.data.srs.vocab, word, gotIt);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { newlyUnlocked };
  }

  getDueVocabWords(limit = 20) {
    const now = Date.now();
    return Object.entries(this.data.srs.vocab)
      .filter(([, item]) => item.dueAt <= now)
      .sort((a, b) => a[1].dueAt - b[1].dueAt)
      .slice(0, limit)
      .map(([word]) => word);
  }

  /** Banks stars/coins from a Review Queue session (question side — vocab
   * grades itself via recordVocabReview above and doesn't earn currency,
   * matching how flashcard flipping elsewhere in the app is free/ungated). */
  finishSrsReview({ starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { newlyUnlocked, ...levelResult };
  }

  /** Banks stars/coins from a Custom Drill session — same shape as
   * finishWeakReview, since a drill is also "extra reps" that doesn't gate
   * or unlock anything on its own (per-question stats/SRS already updated
   * via recordQuestionAnswer as the drill was played). */
  finishDrill({ starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const levelResult = this._grantXp(starsEarned);
    this._recordDailyActivity();
    const newlyUnlocked = this._checkAchievements();
    this.save();
    return { newlyUnlocked, ...levelResult };
  }

  // --- pacing ---
  /** Rolling per-subject average seconds-per-question, fed by every timed
   * lesson question. Capped sample count (not just a running average) so a
   * few outlier questions (a distraction, a bathroom break) can't
   * permanently skew the read — old samples age out as new ones arrive. */
  recordPaceSample(subjectId, seconds) {
    if (!subjectId || !(seconds > 0)) return;
    const bySubject = this.data.pacing.bySubject;
    const entry = bySubject[subjectId] || { samples: [] };
    entry.samples.push(seconds);
    if (entry.samples.length > 50) entry.samples.shift();
    bySubject[subjectId] = entry;
    this.save();
  }

  /** This subject's average pace vs. the real ACT's per-question time
   * budget for that section, or null if there's no data yet. */
  getPacingStats(subjectId) {
    const entry = this.data.pacing.bySubject[subjectId];
    if (!entry || entry.samples.length === 0) return null;
    const avgSeconds = entry.samples.reduce((a, b) => a + b, 0) / entry.samples.length;
    const budget = ACT_PACE_BUDGET_SECONDS[subjectId] ?? null;
    return { avgSeconds, budgetSeconds: budget, sampleCount: entry.samples.length };
  }

  // --- study plan ---
  getStudyPlanSettings() {
    return { testDate: this.data.studyPlan.testDate, targetScore: this.data.studyPlan.targetScore };
  }

  setStudyPlanSettings({ testDate, targetScore }) {
    if (testDate !== undefined) this.data.studyPlan.testDate = testDate;
    if (targetScore !== undefined) this.data.studyPlan.targetScore = targetScore;
    this.save();
  }

  /** Days remaining until the configured test date (0 on/after test day,
   * null if no date is set). */
  getDaysUntilTest() {
    const testDate = this.data.studyPlan.testDate;
    if (!testDate) return null;
    const today = this._todayLocalDateStr();
    const [ty, tm, td] = today.split("-").map(Number);
    const [y, m, d] = testDate.split("-").map(Number);
    const diffMs = new Date(y, m - 1, d) - new Date(ty, tm - 1, td);
    return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
  }

  // --- developer mode cheats (manual testing only, never called from
  // normal gameplay) ---
  cheatAddCoins(n) {
    this.data.coins = Math.max(0, this.data.coins + n);
    this.save();
  }

  cheatAddStars(n) {
    this.data.totalStars = Math.max(0, this.data.totalStars + n);
    this.save();
  }

  cheatAddXp(n) {
    this.data.monster.xp = Math.max(0, this.data.monster.xp + n);
    this.save();
  }

  /** Forces a single skill's mastered flag, filling in attempts/correct/
   * lessonsCompleted so the rest of the UI (accuracy %, lesson badges) reads
   * consistently rather than showing a mastered skill with 0 lessons done,
   * or vice versa. */
  cheatSetSkillMastered(skillId, mastered) {
    const progress = this.data.skillProgress[skillId];
    if (!progress) return;
    const totalLessons = getLessonCount(skillId);
    if (mastered) {
      progress.mastered = true;
      progress.lessonsCompleted = totalLessons;
      progress.attempts = Math.max(progress.attempts, 20);
      progress.correct = Math.max(progress.correct, Math.round(progress.attempts * 0.9));
      progress.bestScore = Math.max(progress.bestScore, 0.9);
    } else {
      progress.mastered = false;
      progress.lessonsCompleted = 0;
      progress.attempts = 0;
      progress.correct = 0;
      progress.bestScore = 0;
      progress.stars = 0;
    }
    this.save();
  }

  cheatSetSubjectMastered(subjectId, mastered) {
    const subject = SUBJECTS.find((s) => s.id === subjectId);
    if (!subject) return;
    subject.skills.forEach((skill) => this.cheatSetSkillMastered(skill.id, mastered));
  }

  /** Masters/unmasters skills across every subject until overall mastery %
   * lands on `pct`, exercising the real evolution/predictor/dashboard math
   * instead of a separate override — so "jump to a mastery level" cheats
   * behave exactly like actually playing to that point would. */
  cheatSetOverallMasteryPct(pct) {
    const ids = allSkillIds();
    const targetCount = Math.round(ids.length * Math.max(0, Math.min(1, pct)));
    ids.forEach((id, i) => this.cheatSetSkillMastered(id, i < targetCount));
  }

  cheatSetBossCleared(subjectId, cleared) {
    this.data.bossCleared[subjectId] = cleared;
    this.save();
  }

  /** Randomizes every skill's progress (for eyeballing dashboard/weak-review/
   * boss states without hand-crafting a save), plus a plausible coin/star/xp
   * pile. */
  cheatSeedRandomProgress() {
    for (const id of allSkillIds()) {
      const progress = this.data.skillProgress[id];
      const totalLessons = getLessonCount(id);
      const accuracy = 0.3 + Math.random() * 0.65;
      const attempts = 5 + Math.floor(Math.random() * 40);
      const correct = Math.round(attempts * accuracy);
      const mastered = Math.random() < 0.4;
      progress.attempts = attempts;
      progress.correct = correct;
      progress.bestScore = accuracy;
      progress.mastered = mastered;
      progress.lessonsCompleted = mastered ? totalLessons : Math.floor(Math.random() * totalLessons);
      progress.stars = attempts;
    }
    for (const subject of SUBJECTS) {
      this.data.bossCleared[subject.id] = subject.skills.every((s) => this.data.skillProgress[s.id].mastered) && Math.random() < 0.5;
    }
    this.data.coins = 200 + Math.floor(Math.random() * 800);
    this.data.totalStars = 100 + Math.floor(Math.random() * 900);
    this.data.monster.xp = Math.floor(Math.random() * 2000);
    this.save();
  }
}

export const gameState = new GameState();
