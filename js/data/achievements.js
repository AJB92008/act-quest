// Badge definitions for the achievement system. Every condition is a pure
// function of persistent save data (mastery, bosses, tests, streak, level,
// stars, SRS reviews) rather than a one-off session event flag, so
// GameState can just re-check the whole list after any "session complete"
// call and diff against what's already unlocked — no per-screen bookkeeping
// needed to notice a badge was earned.
export const ACHIEVEMENTS = [
  {
    id: "first-mastery",
    icon: "🥇",
    name: "First Mastery",
    desc: "Master your first skill.",
    condition: (gs) => gs.getOverallStats().masteredCount >= 1,
  },
  {
    id: "subject-master",
    icon: "🏝️",
    name: "Island Cleared",
    desc: "Master every skill on one island.",
    condition: (gs) => gs.getOverallStats().subjectStats.some((s) => s.totalSkills > 0 && s.masteredCount >= s.totalSkills),
  },
  {
    id: "grand-master",
    icon: "👑",
    name: "ACT Champion",
    desc: "Master every skill across all four subjects.",
    condition: (gs) => gs.getMasteryPct() >= 1,
  },
  {
    id: "perfect-score",
    icon: "💯",
    name: "Perfect Lesson",
    desc: "Score 100% on a mini-lesson.",
    condition: (gs) => Object.values(gs.data.skillProgress).some((p) => p.bestScore >= 1),
  },
  {
    id: "first-boss",
    icon: "⚔️",
    name: "Boss Slayer",
    desc: "Clear your first Boss Quiz.",
    condition: (gs) => Object.values(gs.data.bossCleared).some(Boolean),
  },
  {
    id: "boss-champion",
    icon: "🛡️",
    name: "Boss Champion",
    desc: "Clear every subject's Boss Quiz.",
    condition: (gs) => Object.values(gs.data.bossCleared).every(Boolean) && Object.values(gs.data.bossCleared).length > 0,
  },
  {
    id: "test-day",
    icon: "📝",
    name: "Test Day",
    desc: "Complete your first full-length practice test.",
    // Any planet's practice test counts — ACT, SAT, and PSAT all have one
    // now (see data/tests.js's practiceTest configs), and this achievement
    // is about the milestone of sitting through a full-length test at all,
    // not which one.
    condition: (gs) => Object.values(gs.data.practiceTests).some((pt) => pt.history.length >= 1),
  },
  {
    id: "solid-score",
    icon: "⭐",
    name: "Solid Score",
    desc: "Score a 25+ composite on a practice test.",
    // ACT-scoped on purpose: "25+" is a 1-36 ACT composite threshold, not a
    // generic "good score" — SAT/PSAT composites (400-1600 / 320-1520)
    // clear it trivially and would make this achievement meaningless.
    condition: (gs) => gs.data.practiceTests.act.bestComposite >= 25,
  },
  {
    id: "standout-score",
    icon: "🌟",
    name: "Standout Score",
    desc: "Score a 30+ composite on a practice test.",
    condition: (gs) => gs.data.practiceTests.act.bestComposite >= 30,
  },
  {
    id: "endless-grinder",
    icon: "🔁",
    name: "Endless Grinder",
    desc: "Answer 25 in a row correctly in Endless Mode.",
    condition: (gs) => Math.max(gs.data.endless.bestRun.act, gs.data.endless.bestRun.sat, gs.data.endless.bestRun.psat) >= 25,
  },
  {
    id: "level-10",
    icon: "📈",
    name: "Level 10",
    desc: "Reach monster Level 10.",
    condition: (gs) => gs.level >= 10,
  },
  {
    id: "level-25",
    icon: "🚀",
    name: "Level 25",
    desc: "Reach monster Level 25.",
    condition: (gs) => gs.level >= 25,
  },
  {
    id: "star-collector",
    icon: "✨",
    name: "Star Collector",
    desc: "Earn 500 total stars.",
    condition: (gs) => gs.data.totalStars >= 500,
  },
  {
    id: "star-hoarder",
    icon: "🌠",
    name: "Star Hoarder",
    desc: "Earn 2,000 total stars.",
    condition: (gs) => gs.data.totalStars >= 2000,
  },
  {
    id: "streak-3",
    icon: "📅",
    name: "3-Day Streak",
    desc: "Study 3 days in a row.",
    condition: (gs) => gs.data.streak.best >= 3,
  },
  {
    id: "streak-7",
    icon: "🗓️",
    name: "Week Warrior",
    desc: "Study 7 days in a row.",
    condition: (gs) => gs.data.streak.best >= 7,
  },
  {
    id: "streak-30",
    icon: "🏆",
    name: "Habit Formed",
    desc: "Study 30 days in a row.",
    condition: (gs) => gs.data.streak.best >= 30,
  },
  {
    id: "dedicated-reviewer",
    icon: "🧠",
    name: "Spaced Out",
    desc: "Complete 50 spaced-repetition reviews.",
    condition: (gs) => gs.data.srs.totalReviews >= 50,
  },
];
