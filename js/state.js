import { SUBJECTS, allSkillIds } from "./data/skills.js";

const STORAGE_KEY = "act-quest-save-v1";
const PASS_THRESHOLD = 0.7; // score needed to count a skill as mastered

function defaultSave() {
  const skillProgress = {};
  for (const subject of SUBJECTS) {
    subject.skills.forEach((skill) => {
      skillProgress[skill.id] = {
        mastered: false,
        attempts: 0,
        correct: 0,
        bestScore: 0,
        stars: 0,
      };
    });
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
    onboarded: false,
    settings: {
      timerEnabled: true,
    },
    endless: {
      bestRun: 0,
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
      for (const id of allSkillIds()) {
        if (parsed.skillProgress && parsed.skillProgress[id]) {
          fresh.skillProgress[id] = { ...fresh.skillProgress[id], ...parsed.skillProgress[id] };
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

  // --- endless mode ---
  get endlessBest() {
    return this.data.endless.bestRun;
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

  /** Record the outcome of a finished quiz round for a skill. */
  recordQuizResult(skillId, { correctCount, totalCount, starsEarned, coinsEarned }) {
    const progress = this.data.skillProgress[skillId];
    if (!progress) return;
    progress.attempts += totalCount;
    progress.correct += correctCount;
    const score = totalCount > 0 ? correctCount / totalCount : 0;
    progress.bestScore = Math.max(progress.bestScore, score);
    progress.stars += starsEarned;
    this.data.totalStars += starsEarned;
    this.data.coins += coinsEarned;

    let justMastered = false;
    if (score >= PASS_THRESHOLD && !progress.mastered) {
      progress.mastered = true;
      justMastered = true;
    }

    this.save();
    return { score, justMastered };
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
