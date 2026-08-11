import { SUBJECTS, allSkillIds } from "./data/skills.js";
import { getLessonCount } from "./data/questions/index.js";

const STORAGE_KEY = "act-quest-save-v1";
const PASS_THRESHOLD = 0.7; // score needed to pass a mini-lesson / master a skill

// Must stay in sync with BODY_SHAPES' id order in ui/monster.js — duplicated
// here (rather than imported) so state.js, which everything else depends
// on, doesn't have to depend on the ui layer.
const BODY_SHAPE_ORDER = [
  "round",
  "humanoid",
  "insect",
  "reptile",
  "amorphous",
  "serpent",
  "arachnid",
  "avian",
  "aquatic",
  "crystalline",
  "crab",
  "mechanical",
  "spectral",
  "treant",
  "centipede",
];
// Evolution stages tied to overall mastery %: at each threshold the
// monster's body shape shifts forward by a fixed offset in BODY_SHAPE_ORDER
// (wrapping around), so every monster visibly evolves into something new
// while every other customization choice (color, accessories, limbs...)
// stays exactly as the player set it.
const EVOLUTION_STAGE_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];
const EVOLUTION_STAGE_OFFSETS = [0, 3, 6, 9, 12];
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
      };
    });
    bossCleared[subject.id] = false;
  }
  return {
    version: 1,
    createdName: "",
    avatar: {
      bodyColor: "#7fd1ae",
      bodyShape: "round",
      monsterSize: "medium",
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
  };
}

class GameState {
  constructor() {
    this.data = this._load();
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
      fresh.createdName = parsed.createdName ?? fresh.createdName;
      fresh.onboarded = parsed.onboarded ?? fresh.onboarded;
      fresh.settings = { ...fresh.settings, ...parsed.settings };
      fresh.endless = { ...fresh.endless, ...parsed.endless };
      fresh.bossCleared = { ...fresh.bossCleared, ...parsed.bossCleared };
      fresh.monster = { ...fresh.monster, ...parsed.monster };
      fresh.practiceTests = { ...fresh.practiceTests, ...parsed.practiceTests };
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
  }

  reset() {
    this.data = defaultSave();
    this.save();
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
   * customization (color, accessories, limbs, eyes...) with the body shape
   * swapped in for the current evolution stage. Every accessory anchor in
   * monsterSVG is keyed off body shape already, so this is all that's
   * needed to keep everything aligned as the shape changes. */
  getDisplayAvatar() {
    const stage = this.getEvolutionStage();
    const avatar = this.data.avatar;
    if (stage === 0) return avatar;
    const baseIndex = Math.max(0, BODY_SHAPE_ORDER.indexOf(avatar.bodyShape));
    const shape = BODY_SHAPE_ORDER[(baseIndex + EVOLUTION_STAGE_OFFSETS[stage]) % BODY_SHAPE_ORDER.length];
    return { ...avatar, bodyShape: shape };
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
    this.save();
    return { isNewBest, ...levelResult };
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
    this.save();
    return { score, passed, justAdvanced, justMastered, totalLessons, justEvolved, evolutionStage: stageAfter, ...levelResult };
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

  /** Banks the stars/coins earned from a Weak Skill Review session (call
   * once, at the end — per-question accuracy updates already happened via
   * recordWeakReviewAnswer and just need saving now). */
  finishWeakReview({ starsEarned, coinsEarned }) {
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;
    const levelResult = this._grantXp(starsEarned);
    this.save();
    return levelResult;
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
    this.save();
    return { score, passed, justCleared, ...levelResult };
  }

  getSubjectStats(subjectId) {
    const subject = SUBJECTS.find((s) => s.id === subjectId);
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
}

export const gameState = new GameState();
