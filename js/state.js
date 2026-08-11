import { SUBJECTS, allSkillIds } from "./data/skills.js";
import { getLessonCount } from "./data/questions/index.js";

const STORAGE_KEY = "act-quest-save-v1";
const PASS_THRESHOLD = 0.7; // score needed to pass a mini-lesson / master a skill

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
    this.save();
    return { isNewBest };
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

    this.save();
    return { score, passed, justAdvanced, justMastered, totalLessons };
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
    this.save();
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
    this.save();
    return { score, passed, justCleared };
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
