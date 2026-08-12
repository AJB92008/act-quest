// A unique, subject-themed "boss" monster guarding the bottom of each
// island's path, rendered with the same procedural monsterSVG() renderer
// as the player's own monster (so it's just another avatar config — no
// separate art pipeline, and it automatically inherits every alignment fix
// made to monster.js's per-shape accessory anchors).
export const BOSS_MONSTERS = {
  english: {
    name: "The Grammar Golem",
    avatar: {
      bodyColor: "#8a6a3a",
      bodyShape: "treant",
      level: 8, // imposing size via the same level-based growth curve players get
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
      level: 8, // imposing size via the same level-based growth curve players get
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
      level: 8, // imposing size via the same level-based growth curve players get
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
      level: 8, // imposing size via the same level-based growth curve players get
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
};

export function getBossMonster(subjectId) {
  return BOSS_MONSTERS[subjectId];
}
