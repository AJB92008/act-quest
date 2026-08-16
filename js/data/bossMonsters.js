// A unique, subject-themed "boss" monster guarding the bottom of each
// island's path, rendered with the same procedural monsterSVG() renderer
// as the player's own monster (so it's just another avatar config — no
// separate art pipeline, and it automatically inherits every alignment fix
// made to monster.js's per-shape accessory anchors). `level` is intentionally
// left out of these configs — getBossMonster() fills it in relative to the
// player's own level, so the boss keeps feeling like a real step up instead
// of freezing at a fixed size that a high-level player quickly outgrows.
export const BOSS_MONSTERS = {
  english: {
    name: "The Grammar Golem",
    avatar: {
      bodyColor: "#8a6a3a",
      bodyShape: "treant",
      limbs: 4,
      eyeType: 3,
      mouthType: 1,
      skin: "bark",
      spots: false,
      head: "wizardHat",
      face: "studyGlasses",
      back: "none",
      tail: "none",
      outfit: "none",
      scar: "none",
    },
  },
  math: {
    name: "The Peak Sentinel",
    avatar: {
      bodyColor: "#6a5cff",
      bodyShape: "crystalline",
      limbs: 4,
      eyeType: 5,
      mouthType: 2,
      skin: "crystal",
      spots: false,
      head: "crown",
      face: "none",
      back: "none",
      tail: "none",
      outfit: "none",
      scar: "none",
    },
  },
  reading: {
    name: "The Reef Archivist",
    avatar: {
      bodyColor: "#22b8a3",
      bodyShape: "aquatic",
      limbs: 4,
      eyeType: 0,
      mouthType: 0,
      skin: "scales",
      spots: false,
      head: "none",
      face: "studyGlasses",
      back: "none",
      tail: "fishTail",
      outfit: "none",
      scar: "none",
    },
  },
  science: {
    name: "The Lab Overseer",
    avatar: {
      bodyColor: "#ffb238",
      bodyShape: "mechanical",
      limbs: 4,
      eyeType: 5,
      mouthType: 2,
      skin: "metal",
      spots: false,
      head: "none",
      face: "none",
      back: "none",
      tail: "none",
      outfit: "none",
      scar: "none",
    },
  },
  "sat-rw": {
    name: "The Archive Owl",
    avatar: {
      bodyColor: "#2a9d8f",
      bodyShape: "avian",
      limbs: 2,
      eyeType: 3,
      mouthType: 1,
      skin: "fur",
      spots: false,
      head: "none",
      face: "studyGlasses",
      back: "none",
      tail: "none",
      outfit: "none",
      scar: "none",
    },
  },
};

// A boss always renders a few levels ahead of the player — enough to read
// as "still a real challenge" even once mastery makes the fight itself
// trivial — but never below BOSS_LEVEL_MIN, so it stays imposing for a
// player who's just unlocked the fight at a low level too. The level-based
// growth curve (see levelSizeBonus in ui/monster.js) is asymptotic, so
// this scales the boss's *apparent* size without ever letting it run away
// unboundedly at very high player levels.
export const BOSS_LEVEL_BONUS = 3;
export const BOSS_LEVEL_MIN = 8;

export function getBossMonster(subjectId, playerLevel = 1) {
  const boss = BOSS_MONSTERS[subjectId];
  if (!boss) return boss;
  const level = Math.max(BOSS_LEVEL_MIN, playerLevel + BOSS_LEVEL_BONUS);
  return { ...boss, avatar: { ...boss.avatar, level } };
}
