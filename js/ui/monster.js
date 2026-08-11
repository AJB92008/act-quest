// Renders a fully customizable SVG monster from an avatar config. Pure
// shapes only, no external image assets. Everything (body shape, size,
// limbs, eyes, mouth, skin texture, and 50 shop accessories across 7
// categories) is drawn procedurally so the whole game stays a handful of
// files.

let instanceCounter = 0;
function uid() {
  instanceCounter += 1;
  return `mon${instanceCounter}`;
}

// Lighten/darken a #rrggbb color by `percent` (-100..100).
function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
  let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/* ---------------------------------------------------------------------- */
/* Evolution decorations                                                   */
/* Each body shape has 5 stages (0=Hatchling..4=Legendary): the silhouette,  */
/* clip path, and every anchor point stay identical across stages so       */
/* accessories never lose alignment — only these additive decorations      */
/* (rendered behind or on top of the base fill) change, growing in count   */
/* and intricacy, with a shared gold "Legendary" trim at stage 4.          */
/* ---------------------------------------------------------------------- */

// Soft glow behind the body. The one evolution cue every shape shares —
// intensifying at stage 2+ and shifting to a warm gold at the final stage,
// so "Legendary" reads instantly even before looking at shape-specific
// decoration.
function evolutionAura(cx, cy, rx, ry, color, stage) {
  if (stage < 2) return "";
  const opacity = stage === 2 ? 0.14 : stage === 3 ? 0.2 : 0.3;
  const auraColor = stage >= 4 ? "#ffd25f" : color;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${auraColor}" opacity="${opacity}"/>`;
}

// Small four-point sparkle accent — used by several shapes at higher
// stages to read as "gaining a magical/energetic quality."
function sparkle(x, y, s, color) {
  return `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="${color}"/>`;
}

// Small faceted gem, used as a growing "power core" motif for a few shapes.
function gem(x, y, r, color, colorDark) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${colorDark}" stroke-width="1.5"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.32}" fill="#fff" opacity="0.55"/>`;
}

function leafBud(x, y, rot, color) {
  return `<path transform="rotate(${rot} ${x} ${y})" d="M${x} ${y} Q${x + 3} ${y - 8} ${x} ${y - 14} Q${x - 3} ${y - 8} ${x} ${y} Z" fill="${color}" stroke="${shade(color, -25)}" stroke-width="1"/>`;
}

function blossom(x, y, petalColor) {
  return (
    [-1, 0, 1]
      .map((dx) => `<circle cx="${x + dx * 3}" cy="${y - Math.abs(dx)}" r="2.1" fill="${petalColor}"/>`)
      .join("") + `<circle cx="${x}" cy="${y - 1}" r="1.2" fill="#ffd25f"/>`
  );
}

function rivet(x, y, color) {
  return `<circle cx="${x}" cy="${y}" r="1.7" fill="${color}"/>`;
}

// A stage's gold "Legendary" trim color, else null (used to recolor a
// shape's signature accessory — spikes, fins, a crest — at stage 4).
function legendaryTrim(stage) {
  return stage >= 4 ? "#ffd25f" : null;
}

/* ---------------------------------------------------------------------- */
/* Body shapes                                                             */
/* ---------------------------------------------------------------------- */

const ROUND_PATH =
  "M50 6 C 14 6 6 34 8 58 C 10 84 26 100 50 100 C 74 100 90 84 92 58 C 94 34 86 6 50 6 Z";
const AMORPHOUS_PATH =
  "M50 10 C 20 8 5 30 12 50 C 4 65 15 90 40 98 C 60 105 85 92 90 70 C 98 55 92 30 75 15 C 65 5 60 12 50 10 Z";

// Ten additional body shapes, each paired with its own limb renderer below.
const SERPENT_PATH =
  "M42 10 Q66 8 64 26 Q62 40 44 46 Q20 52 24 68 Q26 82 48 84 Q64 85 60 98 Q57 108 44 104 Q32 100 34 90 Q36 80 20 74 Q4 66 10 48 Q14 32 36 28 Q50 25 46 16 Q44 12 42 10 Z";
const AVIAN_PATH =
  "M50 8 C 30 8 20 30 24 52 C 18 76 30 102 50 104 C 70 102 82 76 76 52 C 80 30 70 8 50 8 Z";
const AQUATIC_PATH =
  "M50 10 C 24 10 14 34 20 54 C 10 66 18 88 34 96 Q50 106 66 96 C 82 88 90 66 80 54 C 86 34 76 10 50 10 Z";
const CRYSTAL_PATH = "M50 8 L74 30 L82 62 L64 100 L36 100 L18 62 L26 30 Z";
const CRAB_PATH = "M14 50 Q10 20 50 16 Q90 20 86 50 Q90 70 70 80 L30 80 Q10 70 14 50 Z";
const SPECTRAL_PATH =
  "M50 10 C 20 10 14 34 16 55 L16 90 Q22 78 28 90 Q34 100 40 88 Q46 100 50 90 Q54 100 60 88 Q66 100 72 90 Q78 78 84 90 L84 55 C 86 34 80 10 50 10 Z";
const TREANT_TRUNK_PATH =
  "M36 30 Q30 30 28 44 L24 96 Q24 104 34 104 L66 104 Q76 104 76 96 L72 44 Q70 30 64 30 Z";
const CENTIPEDE_PATH =
  "M12 50 Q8 30 30 28 L70 28 Q92 30 88 50 Q92 70 70 72 L30 72 Q8 70 12 50 Z";

// Humanoid torso: rounded shoulders tapering to a slightly narrower waist,
// sitting below the head with a small neck gap, rather than a plain rectangle.
const HUMANOID_TORSO_PATH =
  "M28 42 Q20 42 20 52 L24 90 Q25 100 35 100 L65 100 Q75 100 76 90 L80 52 Q80 42 72 42 Z";
// Reptile snout: a rounded jaw bump around the mouth, like a lizard's
// lower jaw, with two small nostril dots.
const REPTILE_SNOUT_PATH = "M36 58 Q50 84 64 58 Q62 74 50 79 Q38 74 36 58 Z";
// Amorphous blob with a couple of drips hanging off the bottom, like ooze.
const AMORPHOUS_DRIPS = `
  <path d="M32 92 Q30 104 36 108 Q42 104 38 92 Z" />
  <path d="M60 96 Q60 108 66 111 Q71 106 66 96 Z" />
`;

function bodyShapeMarkup(shape, color, colorDark, stage = 0) {
  switch (shape) {
    case "humanoid": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1)
        decor += `<ellipse cx="30" cy="45" rx="7" ry="5" fill="${trim || colorDark}" opacity="${trim ? 1 : 0.85}"/><ellipse cx="70" cy="45" rx="7" ry="5" fill="${trim || colorDark}" opacity="${trim ? 1 : 0.85}"/>`;
      if (stage >= 2) decor += gem(50, 62, 4, shade(color, 30), colorDark);
      if (stage >= 3) decor += `<rect x="27" y="82" width="46" height="6" rx="3" fill="${trim || colorDark}" opacity="${trim ? 1 : 0.7}"/>`;
      if (stage >= 4) decor += sparkle(18, 30, 4, "#ffd25f") + sparkle(82, 30, 4, "#ffd25f");
      return {
        fill: `
          ${evolutionAura(50, 55, 50, 58, color, stage)}
          <path d="${HUMANOID_TORSO_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <circle cx="50" cy="23" r="16" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${HUMANOID_TORSO_PATH}"/><circle cx="50" cy="23" r="16"/>`,
        faceCenter: [50, 23],
        faceScale: 0.6,
        outfitAnchor: [50, 70],
        outfitScale: 1,
        headScale: 1,
        tailAnchor: [74, 90],
        tailScale: 0.9,
      };
    }
    case "insect": {
      const trim = legendaryTrim(stage);
      const wingColor = shade(color, 35);
      let decor = "";
      if (stage >= 1)
        decor += `<ellipse cx="26" cy="44" rx="6" ry="4" fill="${wingColor}" opacity="0.55" transform="rotate(-20 26 44)"/><ellipse cx="74" cy="44" rx="6" ry="4" fill="${wingColor}" opacity="0.55" transform="rotate(20 74 44)"/>`;
      if (stage >= 2)
        decor += `<path d="M50 44 Q22 28 15 48 Q30 55 50 46 Z" fill="${wingColor}" opacity="0.45" stroke="${trim || colorDark}" stroke-width="1"/><path d="M50 44 Q78 28 85 48 Q70 55 50 46 Z" fill="${wingColor}" opacity="0.45" stroke="${trim || colorDark}" stroke-width="1"/>`;
      if (stage >= 3) decor += `<path d="M24 40 L42 46" stroke="${trim || colorDark}" stroke-width="1" opacity="0.6"/><path d="M76 40 L58 46" stroke="${trim || colorDark}" stroke-width="1" opacity="0.6"/>`;
      if (stage >= 4) decor += `<circle cx="34" cy="4" r="2.4" fill="#ffd25f"/><circle cx="66" cy="4" r="2.4" fill="#ffd25f"/>`;
      return {
        fill: `
          ${evolutionAura(50, 50, 42, 46, color, stage)}
          <path d="M50 58 C 72 60 80 82 64 100 Q50 109 36 100 C 20 82 28 60 50 58 Z" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <ellipse cx="50" cy="57" rx="6" ry="5" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <ellipse cx="50" cy="40" rx="17" ry="14" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <circle cx="50" cy="16" r="13" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="M50 58 C 72 60 80 82 64 100 Q50 109 36 100 C 20 82 28 60 50 58 Z"/><ellipse cx="50" cy="40" rx="17" ry="14"/><circle cx="50" cy="16" r="13"/>`,
        faceCenter: [50, 16],
        faceScale: 0.52,
        outfitAnchor: [50, 78],
        outfitScale: 0.8,
        headScale: 0.8,
        tailAnchor: [78, 88],
        tailScale: 0.75,
      };
    }
    case "reptile": {
      const trim = legendaryTrim(stage);
      const spikeXs = stage >= 2 ? [18, 30, 42, 50, 58, 70, 82] : [26, 38, 50, 62, 74];
      const spikeHeight = 9 + stage * 1.8;
      const spikesMarkup = spikeXs
        .map((x) => spike(x, 24 - Math.abs(x - 50) * 0.25, 4, spikeHeight, trim || color, colorDark))
        .join("");
      const frill =
        stage >= 3
          ? `<path d="M30 34 Q20 14 30 6 Q40 20 42 30 Q50 10 58 30 Q60 20 70 6 Q80 14 70 34 Z" fill="${shade(color, 20)}" opacity="0.75" stroke="${trim || colorDark}" stroke-width="1.5"/>`
          : "";
      return {
        fill: `
          ${evolutionAura(50, 52, 48, 34, color, stage)}
          <ellipse cx="50" cy="52" rx="44" ry="30" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${frill}
          ${spikesMarkup}
          <path d="${REPTILE_SNOUT_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <circle cx="44" cy="60" r="1.3" fill="${colorDark}"/>
          <circle cx="56" cy="60" r="1.3" fill="${colorDark}"/>
        `,
        clip: `<ellipse cx="50" cy="52" rx="44" ry="30"/><path d="${REPTILE_SNOUT_PATH}"/>`,
        faceCenter: [50, 46],
        faceScale: 0.75,
        outfitAnchor: [50, 66],
        outfitScale: 0.9,
        headScale: 0.95,
        tailAnchor: [78, 74],
        tailScale: 0.9,
      };
    }
    case "amorphous": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<circle cx="60" cy="45" r="5" fill="#fff" opacity="0.25"/><circle cx="45" cy="65" r="4" fill="#fff" opacity="0.2"/>`;
      if (stage >= 2)
        decor += `<path d="M46 90 Q45 100 50 104 Q55 100 51 90 Z" fill="${color}" stroke="${colorDark}" stroke-width="3"/><circle cx="30" cy="55" r="4" fill="#fff" opacity="0.22"/>`;
      if (stage >= 3) decor += `<circle cx="60" cy="45" r="5" fill="#fff" opacity="0.42"/>`;
      if (stage >= 4) decor += `<circle cx="50" cy="55" r="9" fill="${trim}" opacity="0.35"/><circle cx="50" cy="55" r="4" fill="${trim}" opacity="0.85"/>`;
      return {
        fill: `
          ${evolutionAura(50, 55, 48, 52, color, stage)}
          <path d="${AMORPHOUS_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <g fill="${color}" stroke="${colorDark}" stroke-width="3">${AMORPHOUS_DRIPS}</g>
          <ellipse cx="35" cy="28" rx="12" ry="8" fill="#fff" opacity="0.2"/>
          ${decor}
        `,
        clip: `<path d="${AMORPHOUS_PATH}"/>`,
        faceCenter: [50, 52],
        faceScale: 1,
        outfitAnchor: [50, 55],
        outfitScale: 0.85,
        headScale: 1,
        tailAnchor: [86, 78],
        tailScale: 0.85,
      };
    }
    case "serpent": {
      const trim = legendaryTrim(stage);
      const finColor = shade(color, 15);
      let decor = "";
      if (stage >= 1) decor += spike(46, 14, 3, 8, finColor, colorDark) + spike(22, 66, 3, 7, finColor, colorDark);
      if (stage >= 2)
        decor += spike(48, 82, 3, 7, finColor, colorDark) + `<path d="M42 10 Q30 -2 34 14 Q40 8 44 16 Z" fill="${finColor}" opacity="0.8" stroke="${colorDark}" stroke-width="1"/>`;
      if (stage >= 3) decor += `<path d="M20 74 Q4 82 10 92 Q20 84 26 76 Z" fill="${finColor}" opacity="0.7" stroke="${colorDark}" stroke-width="1"/>`;
      if (stage >= 4) decor += `<path d="M42 10 Q30 -2 34 14 Q40 8 44 16 Z" fill="none" stroke="${trim}" stroke-width="1.5"/>`;
      return {
        fill: `
          ${evolutionAura(45, 55, 40, 55, color, stage)}
          <path d="${SERPENT_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${SERPENT_PATH}"/>`,
        faceCenter: [48, 22],
        faceScale: 0.6,
        outfitAnchor: [35, 55],
        outfitScale: 0.42,
        headScale: 0.65,
        tailAnchor: [44, 100],
        tailScale: 0.6,
      };
    }
    case "arachnid": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<circle cx="40" cy="28" r="1.8" fill="${colorDark}"/><circle cx="60" cy="28" r="1.8" fill="${colorDark}"/>`;
      if (stage >= 2) decor += `<path d="M50 58 L44 66 L50 74 L56 66 Z" fill="${shade(color, -15)}" opacity="0.5"/>`;
      if (stage >= 3) decor += `<circle cx="34" cy="32" r="1.4" fill="${colorDark}"/><circle cx="66" cy="32" r="1.4" fill="${colorDark}"/>`;
      if (stage >= 4) decor += `<path d="M50 58 L44 66 L50 74 L56 66 Z" fill="${trim}" opacity="0.9"/>`;
      return {
        fill: `
          ${evolutionAura(50, 55, 38, 42, color, stage)}
          <ellipse cx="50" cy="66" rx="30" ry="26" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <ellipse cx="50" cy="34" rx="18" ry="16" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<ellipse cx="50" cy="66" rx="30" ry="26"/><ellipse cx="50" cy="34" rx="18" ry="16"/>`,
        faceCenter: [50, 34],
        faceScale: 0.85,
        outfitAnchor: [50, 66],
        outfitScale: 0.85,
        headScale: 0.95,
        tailAnchor: [76, 86],
        tailScale: 0.7,
      };
    }
    case "avian": {
      const trim = legendaryTrim(stage);
      const crestColor = trim || shade(color, 20);
      let decor = "";
      if (stage >= 1) decor += `<path d="M50 8 Q46 -4 50 -10 Q54 -4 50 8 Z" fill="${crestColor}"/>`;
      if (stage >= 2)
        decor += `<path d="M44 6 Q40 -6 44 -12 Q48 -4 46 6 Z" fill="${crestColor}" opacity="0.9"/><path d="M56 6 Q60 -6 56 -12 Q52 -4 54 6 Z" fill="${crestColor}" opacity="0.9"/>`;
      if (stage >= 3)
        decor += `<path d="M50 100 Q40 112 44 122 Q50 112 50 100 Z" fill="${crestColor}" opacity="0.85"/><path d="M50 100 Q60 112 56 122 Q50 112 50 100 Z" fill="${crestColor}" opacity="0.85"/>`;
      if (stage >= 4) decor += `<path d="M50 100 Q50 116 50 126 Z" stroke="${trim}" stroke-width="2" fill="none"/>`;
      return {
        fill: `
          ${evolutionAura(50, 55, 32, 50, color, stage)}
          <path d="${AVIAN_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${AVIAN_PATH}"/>`,
        faceCenter: [50, 46],
        faceScale: 0.9,
        outfitAnchor: [50, 55],
        outfitScale: 0.85,
        headScale: 0.92,
        tailAnchor: [66, 96],
        tailScale: 0.8,
      };
    }
    case "aquatic": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<path d="M50 10 Q46 -2 50 -8 Q54 -2 50 10 Z" fill="${shade(color, -10)}" stroke="${colorDark}" stroke-width="1.5"/>`;
      if (stage >= 2) decor += `<path d="M44 8 L50 -14 L56 8 Z" fill="${shade(color, -10)}" stroke="${colorDark}" stroke-width="1.5"/>`;
      if (stage >= 3)
        decor += [
          [30, 40],
          [70, 40],
          [35, 70],
          [65, 70],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#7fffea" opacity="0.85"/>`)
          .join("");
      if (stage >= 4) decor += `<path d="M44 8 L50 -14 L56 8 Z" fill="none" stroke="${trim}" stroke-width="1.5"/>`;
      return {
        fill: `
          ${evolutionAura(50, 52, 40, 48, color, stage)}
          <path d="${AQUATIC_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${AQUATIC_PATH}"/>`,
        faceCenter: [50, 48],
        faceScale: 0.95,
        outfitAnchor: [50, 58],
        outfitScale: 0.9,
        headScale: 0.95,
        tailAnchor: [88, 80],
        tailScale: 0.85,
      };
    }
    case "crystalline": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<path d="M50 8 L44 -6 L50 -12 L56 -6 Z" fill="${shade(color, 20)}" stroke="${colorDark}" stroke-width="1.5"/>`;
      if (stage >= 2)
        decor += `<path d="M26 30 L14 22 L20 34 Z" fill="${shade(color, 20)}" stroke="${colorDark}" stroke-width="1.5"/><path d="M74 30 L86 22 L80 34 Z" fill="${shade(color, 20)}" stroke="${colorDark}" stroke-width="1.5"/>`;
      if (stage >= 3) decor += `<path d="M50 8 L50 55 M26 30 L64 62 M74 30 L36 62" stroke="#fff" stroke-width="1" opacity="0.4"/>`;
      if (stage >= 4) decor += `<circle cx="50" cy="55" r="6" fill="${trim}" opacity="0.6"/>`;
      return {
        fill: `
          ${evolutionAura(50, 55, 42, 50, color, stage)}
          <path d="${CRYSTAL_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3" stroke-linejoin="round"/>
          ${decor}
        `,
        clip: `<path d="${CRYSTAL_PATH}"/>`,
        faceCenter: [50, 52],
        faceScale: 0.85,
        outfitAnchor: [50, 58],
        outfitScale: 0.72,
        headScale: 0.92,
        tailAnchor: [80, 72],
        tailScale: 0.65,
      };
    }
    case "crab": {
      const trim = legendaryTrim(stage);
      const spikeColor = shade(color, 10);
      let decor = "";
      if (stage >= 1) decor += `<path d="M25 40 Q50 30 75 40" stroke="${colorDark}" stroke-width="1.5" fill="none" opacity="0.5"/>`;
      if (stage >= 2) decor += spike(20, 30, 3, 7, spikeColor, colorDark) + spike(80, 30, 3, 7, spikeColor, colorDark);
      if (stage >= 3) decor += `<path d="M30 50 Q50 42 70 50" stroke="${colorDark}" stroke-width="1.5" fill="none" opacity="0.5"/>` + spike(50, 22, 3, 8, spikeColor, colorDark);
      if (stage >= 4) decor += `<circle cx="30" cy="44" r="1.6" fill="${trim}"/><circle cx="70" cy="44" r="1.6" fill="${trim}"/>`;
      return {
        fill: `
          ${evolutionAura(50, 50, 42, 36, color, stage)}
          <path d="${CRAB_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${CRAB_PATH}"/>`,
        faceCenter: [50, 46],
        faceScale: 0.85,
        outfitAnchor: [50, 46],
        outfitScale: 0.78,
        headScale: 0.85,
        tailAnchor: [88, 64],
        tailScale: 0.75,
      };
    }
    case "mechanical": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<line x1="50" y1="20" x2="50" y2="8" stroke="${colorDark}" stroke-width="2"/><circle cx="50" cy="6" r="2.5" fill="${shade(color, 20)}"/>`;
      if (stage >= 2)
        decor +=
          [26, 74].map((x) => rivet(x, 26, colorDark)).join("") +
          [26, 74].map((x) => rivet(x, 94, colorDark)).join("") +
          `<circle cx="50" cy="6" r="2.5" fill="#7fffea"/>`;
      if (stage >= 3) decor += `<rect x="18" y="45" width="6" height="18" rx="2" fill="${colorDark}" opacity="0.5"/><rect x="76" y="45" width="6" height="18" rx="2" fill="${colorDark}" opacity="0.5"/>`;
      if (stage >= 4) decor += `<rect x="30" y="30" width="40" height="6" fill="${trim}" opacity="0.8"/><circle cx="50" cy="60" r="6" fill="${trim}" opacity="0.5"/>`;
      return {
        fill: `
          ${evolutionAura(50, 60, 40, 48, color, stage)}
          <rect x="22" y="20" width="56" height="80" rx="10" ry="10" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <rect x="30" y="30" width="40" height="6" fill="${colorDark}" opacity="0.3"/>
          <rect x="30" y="88" width="40" height="6" fill="${colorDark}" opacity="0.3"/>
          ${decor}
        `,
        clip: `<rect x="22" y="20" width="56" height="80" rx="10" ry="10"/>`,
        faceCenter: [50, 50],
        faceScale: 0.85,
        outfitAnchor: [50, 55],
        outfitScale: 0.9,
        headScale: 0.9,
        tailAnchor: [82, 90],
        tailScale: 0.85,
      };
    }
    case "spectral": {
      const trim = legendaryTrim(stage);
      let decor = "";
      if (stage >= 1) decor += `<path d="M30 88 Q28 100 32 106 Q36 100 34 88 Z" fill="${color}" opacity="0.6"/>`;
      if (stage >= 2) decor += `<path d="M50 90 Q48 104 52 110 Q56 104 54 90 Z" fill="${color}" opacity="0.6"/>`;
      if (stage >= 3) decor += `<path d="M70 88 Q72 100 68 106 Q64 100 66 88 Z" fill="${color}" opacity="0.6"/>`;
      if (stage >= 4) decor += `<ellipse cx="50" cy="8" rx="14" ry="4" fill="none" stroke="${trim}" stroke-width="2" opacity="0.9"/>`;
      return {
        fill: `
          ${evolutionAura(50, 50, 40, 48, color, stage)}
          <path d="${SPECTRAL_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3" opacity="0.92"/>
          ${decor}
        `,
        clip: `<path d="${SPECTRAL_PATH}"/>`,
        faceCenter: [50, 46],
        faceScale: 0.85,
        outfitAnchor: [50, 55],
        outfitScale: 0.85,
        headScale: 0.9,
        tailAnchor: [88, 78],
        tailScale: 0.8,
      };
    }
    case "treant": {
      const leafColor = shade(color, 25);
      let decor = "";
      if (stage >= 1) decor += leafBud(38, 12, -20, leafColor) + leafBud(62, 12, 20, leafColor);
      if (stage >= 2) decor += leafBud(50, 4, 0, leafColor) + `<path d="M28 40 Q18 36 16 44" stroke="${shade(color, -20)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (stage >= 3)
        decor += leafBud(24, 36, -30, leafColor) + leafBud(76, 36, 30, leafColor) + `<path d="M72 40 Q82 36 84 44" stroke="${shade(color, -20)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (stage >= 4) decor += blossom(38, 12, "#ffb3d1") + blossom(62, 12, "#ffb3d1") + blossom(50, 4, "#ffb3d1");
      return {
        fill: `
          ${evolutionAura(50, 55, 40, 55, color, stage)}
          <path d="${TREANT_TRUNK_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          <circle cx="50" cy="24" r="15" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${TREANT_TRUNK_PATH}"/><circle cx="50" cy="24" r="15"/>`,
        faceCenter: [50, 24],
        faceScale: 0.62,
        outfitAnchor: [50, 65],
        outfitScale: 0.58,
        headScale: 0.95,
        tailAnchor: [80, 96],
        tailScale: 0.55,
      };
    }
    case "centipede": {
      const trim = legendaryTrim(stage);
      const ridgeColor = shade(color, -10);
      let decor = "";
      if (stage >= 1) decor += [30, 50, 70].map((x) => `<ellipse cx="${x}" cy="30" rx="4" ry="3" fill="${ridgeColor}" opacity="0.6"/>`).join("");
      if (stage >= 2) decor += [20, 40, 60, 80].map((x) => `<ellipse cx="${x}" cy="30" rx="4" ry="3" fill="${ridgeColor}" opacity="0.6"/>`).join("");
      if (stage >= 3) decor += [20, 35, 50, 65, 80].map((x) => `<circle cx="${x}" cy="30" r="1.5" fill="#7fffea" opacity="0.8"/>`).join("");
      if (stage >= 4) decor += `<circle cx="14" cy="50" r="2" fill="${trim}"/><circle cx="86" cy="50" r="2" fill="${trim}"/>`;
      return {
        fill: `
          ${evolutionAura(50, 50, 44, 26, color, stage)}
          <path d="${CENTIPEDE_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${CENTIPEDE_PATH}"/>`,
        faceCenter: [32, 50],
        faceScale: 0.6,
        outfitAnchor: [58, 48],
        outfitScale: 0.5,
        headScale: 0.55,
        tailAnchor: [84, 56],
        tailScale: 0.55,
      };
    }
    case "round":
    default: {
      const trim = legendaryTrim(stage);
      const shineColor = shade(color, 45);
      let decor = "";
      if (stage >= 1) decor += gem(50, 95, 3.5, shade(color, 35), colorDark);
      if (stage >= 2) decor += sparkle(16, 48, 4, shineColor);
      if (stage >= 3) decor += sparkle(84, 48, 4, shineColor);
      if (stage >= 4) decor += `<circle cx="50" cy="95" r="5" fill="${trim}" stroke="#c9971c" stroke-width="1.5"/>` + sparkle(16, 48, 4.5, trim) + sparkle(84, 48, 4.5, trim);
      return {
        fill: `
          ${evolutionAura(50, 55, 46, 50, color, stage)}
          <path d="${ROUND_PATH}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
          ${decor}
        `,
        clip: `<path d="${ROUND_PATH}"/>`,
        faceCenter: [50, 46],
        faceScale: 1,
        outfitAnchor: [50, 70],
        outfitScale: 1,
        headScale: 1,
        tailAnchor: [82, 82],
        tailScale: 1,
      };
    }
  }
}

export const BODY_SHAPES = [
  { id: "round", name: "Round" },
  { id: "humanoid", name: "Humanoid" },
  { id: "insect", name: "Insect" },
  { id: "reptile", name: "Reptile" },
  { id: "amorphous", name: "Amorphous" },
  { id: "serpent", name: "Serpent" },
  { id: "arachnid", name: "Arachnid" },
  { id: "avian", name: "Avian" },
  { id: "aquatic", name: "Aquatic" },
  { id: "crystalline", name: "Crystalline" },
  { id: "crab", name: "Crab" },
  { id: "mechanical", name: "Mechanical" },
  { id: "spectral", name: "Spectral" },
  { id: "treant", name: "Treant" },
  { id: "centipede", name: "Centipede" },
];

export const SIZES = [
  { id: "tiny", name: "Tiny", scale: 0.72 },
  { id: "medium", name: "Medium", scale: 1 },
  { id: "giant", name: "Giant", scale: 1.18 },
];

export const LIMB_OPTIONS = [
  { id: 0, name: "None" },
  { id: 2, name: "Arms" },
  { id: 4, name: "Arms + Legs" },
  { id: 6, name: "Six Legs" },
];

/* ---------------------------------------------------------------------- */
/* Eyes & mouth                                                            */
/* ---------------------------------------------------------------------- */

const EYE_VARIANTS = [
  () => `
    <circle cx="38" cy="46" r="11" fill="#fff"/>
    <circle cx="62" cy="46" r="11" fill="#fff"/>
    <circle cx="40" cy="47" r="5" fill="#2b2b3a"/>
    <circle cx="64" cy="47" r="5" fill="#2b2b3a"/>
    <circle cx="42" cy="45" r="1.6" fill="#fff"/>
    <circle cx="66" cy="45" r="1.6" fill="#fff"/>
  `,
  () => `
    <path d="M28 46 Q38 38 48 46" stroke="#2b2b3a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M52 46 Q62 38 72 46" stroke="#2b2b3a" stroke-width="4" fill="none" stroke-linecap="round"/>
  `,
  () => `
    <circle cx="36" cy="45" r="13" fill="#fff"/>
    <circle cx="66" cy="48" r="7" fill="#fff"/>
    <circle cx="38" cy="46" r="6" fill="#2b2b3a"/>
    <circle cx="67" cy="49" r="3" fill="#2b2b3a"/>
  `,
  () => `
    <circle cx="50" cy="46" r="15" fill="#fff"/>
    <circle cx="50" cy="47" r="7" fill="#2b2b3a"/>
    <circle cx="53" cy="44" r="2" fill="#fff"/>
  `,
  () => `
    ${[
      [30, 40],
      [44, 36],
      [56, 36],
      [70, 40],
      [50, 50],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff"/><circle cx="${x}" cy="${y}" r="2" fill="#2b2b3a"/>`)
      .join("")}
  `,
  (id) => `
    <defs>
      <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="38" cy="46" r="8" fill="#7fffea" filter="url(#${id}-glow)"/>
    <circle cx="62" cy="46" r="8" fill="#7fffea" filter="url(#${id}-glow)"/>
    <circle cx="38" cy="46" r="3" fill="#0d3b36"/>
    <circle cx="62" cy="46" r="3" fill="#0d3b36"/>
  `,
  () => `
    <path d="M30 47 L46 47" stroke="#2b2b3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M54 47 L70 47" stroke="#2b2b3a" stroke-width="4" stroke-linecap="round"/>
  `,
];
export const EYE_NAMES = ["Round", "Sleepy", "Goofy", "Cyclops", "Many Eyes", "Glowing", "Hidden"];

const MOUTH_VARIANTS = [
  () => `
    <path d="M35 66 Q50 82 65 66 Q50 74 35 66 Z" fill="#3a2020"/>
    <path d="M44 68 L44 74 L48 68 Z" fill="#fff"/>
    <path d="M56 68 L56 74 L52 68 Z" fill="#fff"/>
  `,
  () => `<path d="M36 65 Q50 78 64 65" stroke="#3a2020" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  () => `<ellipse cx="50" cy="70" rx="9" ry="11" fill="#3a2020"/>`,
  () => `
    <path d="M38 66 Q50 72 62 66" stroke="#3a2020" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M42 67 L39 78 L45 69 Z" fill="#fff" stroke="#c9c4d8" stroke-width="1"/>
    <path d="M58 67 L61 78 L55 69 Z" fill="#fff" stroke="#c9c4d8" stroke-width="1"/>
  `,
  () => `
    <path d="M38 63 Q50 60 62 63 Q56 78 50 80 Q44 78 38 63 Z" fill="#e8a23a" stroke="#c9821e" stroke-width="2"/>
    <path d="M40 65 L60 65" stroke="#c9821e" stroke-width="1.5"/>
  `,
  () => `
    <ellipse cx="50" cy="70" rx="5" ry="6" fill="#3a2020"/>
    <path d="M30 68 Q40 60 46 70" stroke="#2b2b3a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M70 68 Q60 60 54 70" stroke="#2b2b3a" stroke-width="4" fill="none" stroke-linecap="round"/>
  `,
];
export const MOUTH_NAMES = ["Toothy Grin", "Smile", "Surprised", "Fangs", "Beak", "Mandibles"];

/* ---------------------------------------------------------------------- */
/* Skin textures                                                           */
/* ---------------------------------------------------------------------- */


function skinOverlay(skin, clipD, colorDark) {
  if (!skin || skin === "none" || skin === "smooth") return "";
  const clipId = `${uid()}-skinclip`;
  let inner = "";
  if (skin === "scales") {
    const rows = [22, 36, 50, 64, 78, 92];
    inner = rows
      .map((y, ri) =>
        [16, 30, 44, 58, 72, 86]
          .map((x) => (x + (ri % 2 === 0 ? 0 : 7)))
          .map((x) => `<path d="M${x - 6} ${y} Q${x} ${y + 8} ${x + 6} ${y}" fill="none" stroke="${colorDark}" stroke-width="1.5" opacity="0.55"/>`)
          .join("")
      )
      .join("");
  } else if (skin === "fur") {
    const tufts = [];
    for (let y = 18; y < 98; y += 9) {
      for (let x = 14; x < 90; x += 9) {
        tufts.push(`<path d="M${x} ${y} l-2 6" stroke="${colorDark}" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>`);
      }
    }
    inner = tufts.join("");
  } else if (skin === "bark") {
    inner = [18, 32, 46, 60, 74, 88]
      .map((x) => `<path d="M${x} 8 Q${x + 4} 40 ${x - 3} 70 Q${x + 3} 90 ${x} 105" fill="none" stroke="${colorDark}" stroke-width="1.5" opacity="0.5"/>`)
      .join("");
  } else if (skin === "crystal") {
    inner = `
      <path d="M30 25 L45 15 L50 35 L32 42 Z" fill="#fff" opacity="0.25"/>
      <path d="M55 20 L75 30 L68 48 L52 40 Z" fill="#fff" opacity="0.2"/>
      <path d="M25 60 L42 55 L45 78 L28 82 Z" fill="#fff" opacity="0.22"/>
      <path d="M58 62 L80 58 L82 82 L62 85 Z" fill="#fff" opacity="0.18"/>
      <path d="M30 25 L45 15 L50 35 L32 42 Z M55 20 L75 30 L68 48 L52 40 Z M25 60 L42 55 L45 78 L28 82 Z M58 62 L80 58 L82 82 L62 85 Z"
        fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>
    `;
  } else if (skin === "metal") {
    inner = `
      <path d="M15 30 L85 15" stroke="#fff" stroke-width="4" opacity="0.18"/>
      <path d="M12 60 L88 50" stroke="#fff" stroke-width="4" opacity="0.15"/>
      <path d="M18 90 L82 82" stroke="#fff" stroke-width="4" opacity="0.15"/>
      ${[24, 42, 60, 78].map((x) => `<circle cx="${x}" cy="30" r="2" fill="${colorDark}" opacity="0.6"/>`).join("")}
      ${[24, 42, 60, 78].map((x) => `<circle cx="${x}" cy="88" r="2" fill="${colorDark}" opacity="0.6"/>`).join("")}
    `;
  } else if (skin === "slime") {
    inner = `
      <ellipse cx="50" cy="50" rx="45" ry="48" fill="#fff" opacity="0.12"/>
      <path d="M30 90 Q30 100 26 106" stroke="${colorDark}" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
      <path d="M52 95 Q52 104 48 110" stroke="${colorDark}" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
      <path d="M70 88 Q72 98 68 104" stroke="${colorDark}" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
      <ellipse cx="38" cy="30" rx="8" ry="5" fill="#fff" opacity="0.3"/>
    `;
  }
  return `<defs><clipPath id="${clipId}">${clipD}</clipPath></defs><g clip-path="url(#${clipId})">${inner}</g>`;
}

/* ---------------------------------------------------------------------- */
/* Limbs                                                                    */
/* ---------------------------------------------------------------------- */

// Every limb function below draws a "root dot" at the point where the limb
// meets the body, sized so it's guaranteed to sit inside that shape's
// silhouette (verified against each shape's actual geometry, not just
// eyeballed); this bridges any small gap between the limb graphic and the
// body edge so limbs never look like they're floating disconnected.
function rootDot(x, y, color, colorDark, r = 6) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${colorDark}" stroke-width="2"/>`;
}

// Round: simple stubby nubs, anchored just inside the blob's edge.
function roundLimbs(count, color, colorDark) {
  const stub = (cx, cy, rx, ry) =>
    rootDot(cx, cy, color, colorDark, 4) +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" stroke="${colorDark}" stroke-width="3"/>`;
  let out = "";
  if (count >= 2) out += stub(20, 64, 6, 9) + stub(80, 64, 6, 9);
  if (count >= 4) out += stub(32, 100, 7, 9) + stub(68, 100, 7, 9);
  if (count >= 6) out += stub(17, 84, 7, 8) + stub(83, 84, 7, 8);
  return out;
}

// Humanoid: elongated capsule arms/legs with a small hand/foot. Start points
// are checked against the torso path to sit clearly inside it.
function humanoidLimbs(count, color, colorDark) {
  const limb = (x1, y1, x2, y2, w) => `
    ${rootDot(x1, y1, color, colorDark, w / 2 + 2)}
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colorDark}" stroke-width="${w + 3}" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
    <circle cx="${x2}" cy="${y2}" r="${w / 2 + 1}" fill="${color}" stroke="${colorDark}" stroke-width="2"/>
  `;
  let out = "";
  if (count >= 2) out += limb(27, 50, 9, 80, 9) + limb(73, 50, 91, 80, 9);
  if (count >= 4) out += limb(38, 90, 34, 114, 9) + limb(62, 90, 66, 114, 9);
  if (count >= 6) out += limb(28, 68, 12, 88, 8) + limb(72, 68, 88, 88, 8);
  return out;
}

// Insect: thin jointed legs (two segments + a foot point) rooted on the
// thorax (front/middle pairs) and the narrow abdomen waist (back pair),
// matching real insect anatomy; legs attach at the thorax, not the belly.
function insectLegs(count, colorDark) {
  const leg = (x1, y1, xm, ym, x2, y2) => `
    ${rootDot(x1, y1, colorDark, colorDark, 2.5)}
    <path d="M${x1} ${y1} L${xm} ${ym} L${x2} ${y2}" stroke="${colorDark}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x2}" cy="${y2}" r="2" fill="${colorDark}"/>
  `;
  let out = "";
  if (count >= 2) out += leg(36, 36, 18, 48, 9, 64) + leg(64, 36, 82, 48, 91, 64);
  if (count >= 4) out += leg(37, 47, 17, 62, 10, 82) + leg(63, 47, 83, 62, 90, 82);
  if (count >= 6) out += leg(46, 59, 26, 74, 18, 96) + leg(54, 59, 74, 74, 82, 96);
  return out;
}

// Reptile: short stubby clawed legs along the underside of the wide oval
// body, positioned so each leg's center sits inside the body ellipse.
function reptileLegs(count, color, colorDark) {
  const leg = (cx, cy) => `
    ${rootDot(cx, cy - 4, color, colorDark, 5)}
    <ellipse cx="${cx}" cy="${cy}" rx="7" ry="9" fill="${color}" stroke="${colorDark}" stroke-width="3"/>
    <path d="M${cx - 5} ${cy + 6} L${cx - 5} ${cy + 10} M${cx} ${cy + 7} L${cx} ${cy + 11} M${cx + 5} ${cy + 6} L${cx + 5} ${cy + 10}"
      stroke="${colorDark}" stroke-width="1.5" stroke-linecap="round"/>
  `;
  let out = "";
  if (count >= 2) out += leg(30, 78) + leg(70, 78);
  if (count >= 4) out += leg(20, 72) + leg(80, 72);
  if (count >= 6) out += leg(13, 66) + leg(87, 66);
  return out;
}

// Amorphous: tapered pseudopod blobs instead of discrete jointed limbs,
// rooted well inside the wobbly blob outline.
function amorphousLimbs(count, color, colorDark) {
  const pod = (cx, cy, rot) => `
    ${rootDot(cx, cy, color, colorDark, 6)}
    <path transform="rotate(${rot} ${cx} ${cy})" d="M${cx - 7} ${cy} Q${cx - 7} ${cy + 14} ${cx} ${cy + 18} Q${cx + 7} ${cy + 14} ${cx + 7} ${cy} Z"
      fill="${color}" stroke="${colorDark}" stroke-width="3"/>
  `;
  let out = "";
  if (count >= 2) out += pod(16, 42, -25) + pod(84, 38, 25);
  if (count >= 4) out += pod(8, 72, -15) + pod(92, 68, 15);
  if (count >= 6) out += pod(28, 98, -8) + pod(64, 100, 8);
  return out;
}

// Serpent: small clawed forelimb stubs along the tube's visible curve,
// anchored at points hand-checked to sit on the tube's body.
function serpentLimbs(count, color, colorDark) {
  const stub = (cx, cy, angle) => `
    ${rootDot(cx, cy, color, colorDark, 4)}
    <g transform="rotate(${angle} ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy + 8}" rx="4" ry="6" fill="${color}" stroke="${colorDark}" stroke-width="2"/>
      <path d="M${cx - 3} ${cy + 12} L${cx - 3} ${cy + 15} M${cx} ${cy + 13} L${cx} ${cy + 16} M${cx + 3} ${cy + 12} L${cx + 3} ${cy + 15}"
        stroke="${colorDark}" stroke-width="1" stroke-linecap="round"/>
    </g>
  `;
  let out = "";
  if (count >= 2) out += stub(52, 24, 40);
  if (count >= 4) out += stub(16, 52, -90);
  if (count >= 6) out += stub(44, 92, 160);
  return out;
}

// Arachnid: long jointed legs fanning out from the abdomen, anchor points
// verified to fall inside the abdomen ellipse (cx50 cy66 rx30 ry26).
function arachnidLegs(count, colorDark) {
  const leg = (x1, y1, xm, ym, x2, y2) => `
    ${rootDot(x1, y1, colorDark, colorDark, 3)}
    <path d="M${x1} ${y1} L${xm} ${ym} L${x2} ${y2}" stroke="${colorDark}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x2}" cy="${y2}" r="2" fill="${colorDark}"/>
  `;
  let out = "";
  if (count >= 2) out += leg(35, 44, 14, 34, 2, 44) + leg(65, 44, 86, 34, 98, 44);
  if (count >= 4) out += leg(22, 58, 2, 54, -8, 68) + leg(78, 58, 98, 54, 108, 68);
  if (count >= 6) out += leg(26, 72, 8, 78, -2, 94) + leg(74, 72, 92, 78, 102, 94);
  return out;
}

// Avian: thin legs with three-toe feet close together at the belly, with
// small wing-arm stubs at the widest part of the body for 4+.
function avianLegs(count, color, colorDark) {
  const leg = (x, yTop, yBottom) => `
    ${rootDot(x, yTop, color, colorDark, 4)}
    <line x1="${x}" y1="${yTop}" x2="${x}" y2="${yBottom}" stroke="${colorDark}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x - 6} ${yBottom + 5} L${x} ${yBottom} L${x + 6} ${yBottom + 5} M${x} ${yBottom} L${x} ${yBottom + 6}"
      stroke="#e8a23a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  `;
  const wing = (cx, cy, flip) => `
    ${rootDot(cx, cy, color, colorDark, 5)}
    <path transform="scale(${flip},1) translate(${flip < 0 ? -2 * cx : 0},0)" d="M${cx} ${cy} Q${cx - 16} ${cy + 4} ${cx - 14} ${cy + 20} Q${cx - 4} ${cy + 10} ${cx} ${cy + 4} Z"
      fill="${color}" stroke="${colorDark}" stroke-width="2.5"/>
  `;
  let out = "";
  if (count >= 2) out += leg(42, 92, 106) + leg(58, 92, 106);
  if (count >= 4) out += wing(24, 54, 1) + wing(76, 54, -1);
  if (count >= 6) out += leg(30, 88, 100) + leg(70, 88, 100);
  return out;
}

// Aquatic: triangular fins instead of limbs, anchored on the widest part of
// the fish-like body (pectoral fins) and lower sides (pelvic fins).
function aquaticLimbs(count, color, colorDark) {
  const fin = (cx, cy, dir) => `
    ${rootDot(cx, cy, color, colorDark, 4)}
    <path d="M${cx} ${cy - 14} L${cx + dir * 22} ${cy} L${cx} ${cy + 14} Q${cx + dir * 8} ${cy} ${cx} ${cy - 14} Z"
      fill="${color}" stroke="${colorDark}" stroke-width="2.5"/>
  `;
  const tailFin = (cx, cy) => `
    ${rootDot(cx, cy, color, colorDark, 4)}
    <path d="M${cx - 14} ${cy} L${cx} ${cy + 22} L${cx + 14} ${cy} Q${cx} ${cy + 8} ${cx - 14} ${cy} Z"
      fill="${color}" stroke="${colorDark}" stroke-width="2.5"/>
  `;
  let out = "";
  if (count >= 2) out += fin(24, 52, -1) + fin(76, 52, 1);
  if (count >= 4) out += fin(26, 78, -1) + fin(74, 78, 1);
  if (count >= 6) out += tailFin(50, 98);
  return out;
}

// Crystalline: angular crystal shards jutting from the gem body's edges,
// reusing the existing spike() helper for a faceted look.
function crystallineLimbs(count, color, colorDark) {
  let out = "";
  if (count >= 2) out += rootDot(22, 46, color, colorDark, 4) + spike(20, 46, 6, 20, color, colorDark, -100) + rootDot(78, 46, color, colorDark, 4) + spike(80, 46, 6, 20, color, colorDark, 100);
  if (count >= 4) out += rootDot(27, 81, color, colorDark, 4) + spike(25, 82, 6, 18, color, colorDark, -130) + rootDot(73, 81, color, colorDark, 4) + spike(75, 82, 6, 18, color, colorDark, 130);
  if (count >= 6) out += rootDot(50, 8, color, colorDark, 4) + spike(46, 10, 5, 14, color, colorDark, -150) + spike(54, 10, 5, 14, color, colorDark, 150);
  return out;
}

// Crab: big pincer claws for arms, small stubby legs along the shell's
// tapered underside for legs.
function crabLimbs(count, color, colorDark) {
  const claw = (cx, cy, flip) => `
    ${rootDot(cx, cy, color, colorDark, 6)}
    <path d="M${cx} ${cy} L${cx + flip * 16} ${cy - 6} L${cx + flip * 22} ${cy + 6}" stroke="${colorDark}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M${cx + flip * 22} ${cy + 6} L${cx + flip * 30} ${cy - 2} M${cx + flip * 22} ${cy + 6} L${cx + flip * 30} ${cy + 12}"
      stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M${cx + flip * 22} ${cy + 6} L${cx + flip * 30} ${cy - 2} M${cx + flip * 22} ${cy + 6} L${cx + flip * 30} ${cy + 12}"
      stroke="${colorDark}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
  `;
  const leg = (cx, cy) => `
    ${rootDot(cx, cy, color, colorDark, 3.5)}
    <path d="M${cx} ${cy} L${cx} ${cy + 10}" stroke="${colorDark}" stroke-width="4" stroke-linecap="round"/>
  `;
  let out = "";
  if (count >= 2) out += claw(20, 48, -1) + claw(80, 48, 1);
  if (count >= 4) out += leg(28, 74) + leg(72, 74);
  if (count >= 6) out += leg(40, 78) + leg(60, 78);
  return out;
}

// Mechanical: blocky piston limbs with round joints, anchored inside the
// rounded-rect chassis.
function mechanicalLimbs(count, color, colorDark) {
  const piston = (x1, y1, x2, y2, w) => `
    ${rootDot(x1, y1, colorDark, colorDark, w / 2 + 2)}
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colorDark}" stroke-width="${w + 3}" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
    <circle cx="${x2}" cy="${y2}" r="${w / 2 + 2}" fill="${colorDark}"/>
  `;
  let out = "";
  if (count >= 2) out += piston(26, 50, 8, 78, 9) + piston(74, 50, 92, 78, 9);
  if (count >= 4) out += piston(34, 96, 30, 116, 9) + piston(66, 96, 70, 116, 9);
  if (count >= 6) out += piston(24, 64, 2, 58, 7) + piston(76, 64, 98, 58, 7);
  return out;
}

// Spectral: thin wavy trailing wisps instead of solid limbs, semi-transparent
// to read as ghostly rather than physical.
function spectralLimbs(count, color, colorDark) {
  const wisp = (cx, cy, rot) => `
    ${rootDot(cx, cy, color, colorDark, 5)}
    <path transform="rotate(${rot} ${cx} ${cy})" d="M${cx} ${cy} Q${cx - 4} ${cy + 16} ${cx + 2} ${cy + 26} Q${cx + 8} ${cy + 16} ${cx} ${cy} Z"
      fill="${color}" stroke="${colorDark}" stroke-width="2" opacity="0.75"/>
  `;
  let out = "";
  if (count >= 2) out += wisp(16, 48, -10) + wisp(84, 48, 10);
  if (count >= 4) out += wisp(16, 64, -20) + wisp(84, 64, 20);
  if (count >= 6) out += wisp(16, 80, -30) + wisp(84, 80, 30);
  return out;
}

// Treant: forked branch arms, small triangular root nubs for legs.
function treantLimbs(count, color, colorDark) {
  const branch = (cx, cy, flip) => `
    ${rootDot(cx, cy, color, colorDark, 5)}
    <path d="M${cx} ${cy} L${cx + flip * 20} ${cy - 8}" stroke="${colorDark}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M${cx + flip * 20} ${cy - 8} L${cx + flip * 30} ${cy - 18} M${cx + flip * 20} ${cy - 8} L${cx + flip * 30} ${cy}"
      stroke="${colorDark}" stroke-width="4" fill="none" stroke-linecap="round"/>
  `;
  const root = (cx, cy) => `
    ${rootDot(cx, cy, color, colorDark, 4)}
    <path d="M${cx - 6} ${cy + 10} L${cx} ${cy} L${cx + 6} ${cy + 10} Z" fill="${color}" stroke="${colorDark}" stroke-width="2.5"/>
  `;
  let out = "";
  if (count >= 2) out += branch(30, 50, -1) + branch(70, 50, 1);
  if (count >= 4) out += root(34, 98) + root(66, 98);
  if (count >= 6) out += root(42, 100) + root(58, 100);
  return out;
}

// Centipede: many small legs all hanging down from the belly, spread along
// the body's length like a real many-legged bug rather than pointing into
// the face from the top edge.
function centipedeLimbs(count, color, colorDark) {
  const leg = (x, y) => `
    ${rootDot(x, y, color, colorDark, 3)}
    <path d="M${x} ${y} L${x} ${y + 10}" stroke="${colorDark}" stroke-width="3" stroke-linecap="round"/>
  `;
  let out = "";
  if (count >= 2) out += leg(35, 70) + leg(65, 70);
  if (count >= 4) out += leg(24, 68) + leg(76, 68);
  if (count >= 6) out += leg(46, 72) + leg(54, 72);
  return out;
}

function limbsMarkup(count, shape, color, colorDark) {
  if (!count) return "";
  switch (shape) {
    case "humanoid":
      return humanoidLimbs(count, color, colorDark);
    case "insect":
      return insectLegs(count, colorDark);
    case "reptile":
      return reptileLegs(count, color, colorDark);
    case "amorphous":
      return amorphousLimbs(count, color, colorDark);
    case "serpent":
      return serpentLimbs(count, color, colorDark);
    case "arachnid":
      return arachnidLegs(count, colorDark);
    case "avian":
      return avianLegs(count, color, colorDark);
    case "aquatic":
      return aquaticLimbs(count, color, colorDark);
    case "crystalline":
      return crystallineLimbs(count, color, colorDark);
    case "crab":
      return crabLimbs(count, color, colorDark);
    case "mechanical":
      return mechanicalLimbs(count, color, colorDark);
    case "spectral":
      return spectralLimbs(count, color, colorDark);
    case "treant":
      return treantLimbs(count, color, colorDark);
    case "centipede":
      return centipedeLimbs(count, color, colorDark);
    case "round":
    default:
      return roundLimbs(count, color, colorDark);
  }
}

/* ---------------------------------------------------------------------- */
/* Accessory renderers                                                     */
/* Each receives an anchor { x, y, scale } and returns SVG markup.         */
/* ---------------------------------------------------------------------- */

function spike(x, y, w, h, fill, stroke, rotate = 0) {
  return `<path transform="rotate(${rotate} ${x} ${y})" d="M${x - w} ${y} L${x} ${y - h} L${x + w} ${y} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

const HEAD_RENDERERS = {
  partyHat: (a) => `
    <path d="M${a.x - 20} ${a.y} L${a.x} ${a.y - 34} L${a.x + 20} ${a.y} Z" fill="#ffb238" stroke="#cc8a1c" stroke-width="2"/>
    <circle cx="${a.x}" cy="${a.y - 34}" r="5" fill="#fff6de"/>
    <rect x="${a.x - 24}" y="${a.y - 4}" width="48" height="8" rx="4" fill="#ffb238" stroke="#cc8a1c" stroke-width="2"/>
  `,
  wizardHat: (a) => `
    <path d="M${a.x - 22} ${a.y} Q${a.x - 6} ${a.y - 20} ${a.x + 4} ${a.y - 46} Q${a.x + 10} ${a.y - 20} ${a.x + 22} ${a.y} Z" fill="#5a48c9" stroke="#392f8a" stroke-width="2"/>
    <ellipse cx="${a.x}" cy="${a.y}" rx="26" ry="7" fill="#5a48c9" stroke="#392f8a" stroke-width="2"/>
    <path d="M${a.x - 4} ${a.y - 32} l3 3 l3 -3 l-3 -3 Z" fill="#ffd25f"/>
  `,
  topHat: (a) => `
    <rect x="${a.x - 16}" y="${a.y - 34}" width="32" height="30" fill="#2b2b3a"/>
    <ellipse cx="${a.x}" cy="${a.y - 34}" rx="16" ry="5" fill="#3a3a4d"/>
    <ellipse cx="${a.x}" cy="${a.y - 4}" rx="24" ry="7" fill="#2b2b3a"/>
    <rect x="${a.x - 16}" y="${a.y - 12}" width="32" height="6" fill="#c94747"/>
  `,
  crown: (a) => `
    <path d="M${a.x - 20} ${a.y} L${a.x - 20} ${a.y - 16} L${a.x - 10} ${a.y - 4} L${a.x} ${a.y - 20} L${a.x + 10} ${a.y - 4} L${a.x + 20} ${a.y - 16} L${a.x + 20} ${a.y} Z" fill="#ffd25f" stroke="#c9971c" stroke-width="2"/>
    <circle cx="${a.x}" cy="${a.y - 10}" r="3" fill="#c94747"/>
  `,
  halo: (a) => `<ellipse cx="${a.x}" cy="${a.y - 18}" rx="16" ry="5" fill="none" stroke="#ffe9a8" stroke-width="4"/>`,
  singleHorn: (a) => spike(a.x, a.y, 8, 24, "#f6e4c1", "#c9a468"),
  twinHorns: (a) => spike(a.x - 14, a.y + 4, 6, 18, "#f6e4c1", "#c9a468", -12) + spike(a.x + 14, a.y + 4, 6, 18, "#f6e4c1", "#c9a468", 12),
  ramHorns: (a) => `
    <path d="M${a.x - 14} ${a.y} Q${a.x - 34} ${a.y - 6} ${a.x - 24} ${a.y - 24} Q${a.x - 18} ${a.y - 10} ${a.x - 14} ${a.y}" fill="#c9a468" stroke="#8f6f38" stroke-width="2"/>
    <path d="M${a.x + 14} ${a.y} Q${a.x + 34} ${a.y - 6} ${a.x + 24} ${a.y - 24} Q${a.x + 18} ${a.y - 10} ${a.x + 14} ${a.y}" fill="#c9a468" stroke="#8f6f38" stroke-width="2"/>
  `,
  antennae: (a) => `
    <path d="M${a.x - 8} ${a.y} L${a.x - 16} ${a.y - 26}" stroke="#2b2b3a" stroke-width="2.5" fill="none"/>
    <path d="M${a.x + 8} ${a.y} L${a.x + 16} ${a.y - 26}" stroke="#2b2b3a" stroke-width="2.5" fill="none"/>
    <circle cx="${a.x - 16}" cy="${a.y - 26}" r="4" fill="#ff9f6e"/>
    <circle cx="${a.x + 16}" cy="${a.y - 26}" r="4" fill="#ff9f6e"/>
  `,
  bandana: (a) => `
    <path d="M${a.x - 22} ${a.y - 6} Q${a.x} ${a.y - 20} ${a.x + 22} ${a.y - 6} L${a.x + 20} ${a.y + 6} Q${a.x} ${a.y - 6} ${a.x - 20} ${a.y + 6} Z" fill="#e1594f" stroke="#a13a30" stroke-width="2"/>
    <path d="M${a.x + 18} ${a.y - 2} l10 10 l-4 4 Z" fill="#e1594f" stroke="#a13a30" stroke-width="1.5"/>
  `,
  pirateHat: (a) => `
    <path d="M${a.x - 26} ${a.y - 2} Q${a.x} ${a.y - 26} ${a.x + 26} ${a.y - 2} Q${a.x} ${a.y - 12} ${a.x - 26} ${a.y - 2} Z" fill="#2b2b3a" stroke="#111" stroke-width="2"/>
    <circle cx="${a.x}" cy="${a.y - 12}" r="3" fill="#e8e8e8"/>
  `,
  flowerCrown: (a) =>
    [-22, -11, 0, 11, 22]
      .map(
        (dx, i) =>
          `<circle cx="${a.x + dx}" cy="${a.y - 6 - Math.abs(dx) * 0.15}" r="5" fill="${["#ff9fc7", "#ffd25f", "#ff9f6e", "#a8e6a1", "#9fc7ff"][i]}" stroke="#fff" stroke-width="1"/>`
      )
      .join(""),
};

const FACE_RENDERERS = {
  studyGlasses: (a) => `
    <circle cx="${a.x - 12}" cy="${a.y}" r="13" fill="none" stroke="#2b2b3a" stroke-width="3.5"/>
    <circle cx="${a.x + 14}" cy="${a.y}" r="13" fill="none" stroke="#2b2b3a" stroke-width="3.5"/>
    <path d="M${a.x + 1} ${a.y} L${a.x + 1} ${a.y}" stroke="#2b2b3a" stroke-width="3.5"/>
    <path d="M${a.x - 25} ${a.y} L${a.x - 32} ${a.y - 3}" stroke="#2b2b3a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M${a.x + 27} ${a.y} L${a.x + 34} ${a.y - 3}" stroke="#2b2b3a" stroke-width="3.5" stroke-linecap="round"/>
  `,
  sunglasses: (a) => `
    <path d="M${a.x - 26} ${a.y - 6} Q${a.x - 12} ${a.y - 14} ${a.x} ${a.y - 6} Q${a.x + 12} ${a.y - 14} ${a.x + 26} ${a.y - 6}
      L${a.x + 26} ${a.y + 6} Q${a.x + 12} ${a.y + 12} ${a.x} ${a.y + 6} Q${a.x - 12} ${a.y + 12} ${a.x - 26} ${a.y + 6} Z"
      fill="#1a1a24" stroke="#000" stroke-width="1.5"/>
  `,
  monocle: (a) => `
    <circle cx="${a.x + 13}" cy="${a.y}" r="12" fill="none" stroke="#c9971c" stroke-width="3"/>
    <path d="M${a.x + 13} ${a.y + 12} Q${a.x + 18} ${a.y + 26} ${a.x + 14} ${a.y + 38}" stroke="#c9971c" stroke-width="1.5" fill="none"/>
  `,
  eyepatch: (a) => `
    <ellipse cx="${a.x - 12}" cy="${a.y}" rx="13" ry="14" fill="#2b2b3a"/>
    <path d="M${a.x - 24} ${a.y - 10} L${a.x + 30} ${a.y - 18}" stroke="#2b2b3a" stroke-width="3"/>
  `,
  faceMask: (a) => `<rect x="${a.x - 20}" y="${a.y + 12}" width="40" height="20" rx="10" fill="#3a6ea5" stroke="#274a70" stroke-width="2"/>`,
  thirdEyeGem: (a) => `
    <path d="M${a.x} ${a.y - 30} L${a.x + 6} ${a.y - 24} L${a.x} ${a.y - 18} L${a.x - 6} ${a.y - 24} Z" fill="#a266ff" stroke="#6b3fc9" stroke-width="1.5"/>
  `,
};

// Back accessories render behind the body, so their shapes are sized to
// clearly extend past every body silhouette's edges (max half-width ~47)
// rather than being fully hidden behind it.
const BACK_RENDERERS = {
  batWings: (a) => `
    <path d="M${a.x - 6} ${a.y} Q${a.x - 60} ${a.y - 26} ${a.x - 56} ${a.y + 8} Q${a.x - 42} ${a.y - 4} ${a.x - 28} ${a.y + 14} Q${a.x - 18} ${a.y + 2} ${a.x - 6} ${a.y + 10} Z" fill="#4a3f6b" stroke="#2e2748" stroke-width="2"/>
    <path d="M${a.x + 6} ${a.y} Q${a.x + 60} ${a.y - 26} ${a.x + 56} ${a.y + 8} Q${a.x + 42} ${a.y - 4} ${a.x + 28} ${a.y + 14} Q${a.x + 18} ${a.y + 2} ${a.x + 6} ${a.y + 10} Z" fill="#4a3f6b" stroke="#2e2748" stroke-width="2"/>
  `,
  angelWings: (a) => `
    <path d="M${a.x - 6} ${a.y} Q${a.x - 64} ${a.y - 22} ${a.x - 50} ${a.y + 26} Q${a.x - 36} ${a.y + 4} ${a.x - 6} ${a.y + 10} Z" fill="#fdfaf0" stroke="#e2ddc9" stroke-width="2"/>
    <path d="M${a.x + 6} ${a.y} Q${a.x + 64} ${a.y - 22} ${a.x + 50} ${a.y + 26} Q${a.x + 36} ${a.y + 4} ${a.x + 6} ${a.y + 10} Z" fill="#fdfaf0" stroke="#e2ddc9" stroke-width="2"/>
  `,
  dragonflyWings: (a) => `
    <ellipse cx="${a.x - 42}" cy="${a.y - 12}" rx="24" ry="10" fill="#bfe8ff" opacity="0.8" stroke="#6bb8de" stroke-width="1.5" transform="rotate(-16 ${a.x - 42} ${a.y - 12})"/>
    <ellipse cx="${a.x + 42}" cy="${a.y - 12}" rx="24" ry="10" fill="#bfe8ff" opacity="0.8" stroke="#6bb8de" stroke-width="1.5" transform="rotate(16 ${a.x + 42} ${a.y - 12})"/>
    <ellipse cx="${a.x - 38}" cy="${a.y + 14}" rx="19" ry="8" fill="#bfe8ff" opacity="0.65" stroke="#6bb8de" stroke-width="1.5" transform="rotate(-8 ${a.x - 38} ${a.y + 14})"/>
    <ellipse cx="${a.x + 38}" cy="${a.y + 14}" rx="19" ry="8" fill="#bfe8ff" opacity="0.65" stroke="#6bb8de" stroke-width="1.5" transform="rotate(8 ${a.x + 38} ${a.y + 14})"/>
  `,
  butterflyWings: (a) => `
    <path d="M${a.x - 6} ${a.y - 4} Q${a.x - 58} ${a.y - 38} ${a.x - 54} ${a.y - 2} Q${a.x - 56} ${a.y + 28} ${a.x - 12} ${a.y + 12} Z" fill="#ff9fc7" stroke="#d4679a" stroke-width="2"/>
    <path d="M${a.x + 6} ${a.y - 4} Q${a.x + 58} ${a.y - 38} ${a.x + 54} ${a.y - 2} Q${a.x + 56} ${a.y + 28} ${a.x + 12} ${a.y + 12} Z" fill="#ff9fc7" stroke="#d4679a" stroke-width="2"/>
    <circle cx="${a.x - 36}" cy="${a.y - 12}" r="4" fill="#fff" opacity="0.6"/>
    <circle cx="${a.x + 36}" cy="${a.y - 12}" r="4" fill="#fff" opacity="0.6"/>
  `,
  cape: (a) => `<path d="M${a.x - 32} ${a.y - 14} Q${a.x} ${a.y - 4} ${a.x + 32} ${a.y - 14} L${a.x + 40} ${a.y + 56} Q${a.x} ${a.y + 42} ${a.x - 40} ${a.y + 56} Z" fill="#c94747" stroke="#8f2f2f" stroke-width="2"/>`,
  backpack: (a) => `<rect x="${a.x - 55}" y="${a.y - 10}" width="110" height="34" rx="8" fill="#7a5a3a" stroke="#513a24" stroke-width="2"/>`,
  shell: (a) => `<path d="M${a.x - 54} ${a.y + 20} Q${a.x - 58} ${a.y - 22} ${a.x} ${a.y - 30} Q${a.x + 58} ${a.y - 22} ${a.x + 54} ${a.y + 20} Z" fill="#7a9c5c" stroke="#4e6b38" stroke-width="2"/>`,
  finBack: (a) => `<path d="M${a.x - 5} ${a.y - 15} Q${a.x} ${a.y - 70} ${a.x + 7} ${a.y - 13} Q${a.x + 3} ${a.y - 2} ${a.x - 5} ${a.y - 15} Z" fill="#4fb3c9" stroke="#2f7d8f" stroke-width="2"/>`,
};

const TAIL_RENDERERS = {
  spikeTail: (a) => spike(a.x, a.y, 8, 26, "#f6e4c1", "#c9a468", 100),
  fluffyTail: (a) => `<circle cx="${a.x}" cy="${a.y}" r="14" fill="#fff" stroke="#ddd" stroke-width="2"/>`,
  lizardTail: (a, colorDark, bodyColor) =>
    `<path d="M${a.x - 6} ${a.y - 10} Q${a.x + 24} ${a.y} ${a.x + 8} ${a.y + 22}" stroke-width="14" stroke="${bodyColor}" fill="none" stroke-linecap="round"/>
     <path d="M${a.x - 6} ${a.y - 10} Q${a.x + 24} ${a.y} ${a.x + 8} ${a.y + 22}" stroke-width="14" stroke="${colorDark}" fill="none" stroke-linecap="round" opacity="0.35"/>`,
  fishTail: (a) => `<path d="M${a.x} ${a.y - 14} L${a.x + 22} ${a.y} L${a.x} ${a.y + 14} Q${a.x + 8} ${a.y} ${a.x} ${a.y - 14} Z" fill="#4fb3c9" stroke="#2f7d8f" stroke-width="2"/>`,
  stingerTail: (a) => `
    <path d="M${a.x} ${a.y} Q${a.x + 20} ${a.y - 10} ${a.x + 16} ${a.y - 30}" stroke="#c9a468" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${spike(a.x + 16, a.y - 30, 5, 12, "#8f6f38", "#5c4620", 60)}
  `,
};

const OUTFIT_RENDERERS = {
  bowTie: (a) => `
    <path d="M${a.x} ${a.y} L${a.x - 16} ${a.y - 10} L${a.x - 16} ${a.y + 10} Z" fill="#ff6f5e" stroke="#d9483a" stroke-width="2"/>
    <path d="M${a.x} ${a.y} L${a.x + 16} ${a.y - 10} L${a.x + 16} ${a.y + 10} Z" fill="#ff6f5e" stroke="#d9483a" stroke-width="2"/>
    <circle cx="${a.x}" cy="${a.y}" r="5" fill="#d9483a"/>
  `,
  scarf: (a) => `
    <rect x="${a.x - 22}" y="${a.y - 8}" width="44" height="14" rx="6" fill="#e1594f" stroke="#a13a30" stroke-width="2"/>
    <rect x="${a.x + 8}" y="${a.y + 4}" width="10" height="24" rx="3" fill="#e1594f" stroke="#a13a30" stroke-width="2"/>
  `,
  hoodie: (a) => `<path d="M${a.x - 26} ${a.y - 6} Q${a.x} ${a.y - 18} ${a.x + 26} ${a.y - 6} L${a.x + 24} ${a.y + 30} L${a.x - 24} ${a.y + 30} Z" fill="#6a8caf" stroke="#43607d" stroke-width="2" opacity="0.92"/>`,
  knightArmor: (a) => `
    <path d="M${a.x - 26} ${a.y - 6} L${a.x} ${a.y - 16} L${a.x + 26} ${a.y - 6} L${a.x + 22} ${a.y + 34} L${a.x - 22} ${a.y + 34} Z" fill="#9aa5b1" stroke="#5f6771" stroke-width="2"/>
    <path d="M${a.x} ${a.y - 10} L${a.x} ${a.y + 30}" stroke="#5f6771" stroke-width="2"/>
  `,
  wizardRobe: (a) => `<path d="M${a.x - 26} ${a.y - 4} Q${a.x} ${a.y - 14} ${a.x + 26} ${a.y - 4} L${a.x + 30} ${a.y + 40} L${a.x - 30} ${a.y + 40} Z" fill="#5a48c9" stroke="#392f8a" stroke-width="2"/>`,
  overalls: (a) => `
    <path d="M${a.x - 22} ${a.y} L${a.x + 22} ${a.y} L${a.x + 20} ${a.y + 32} L${a.x - 20} ${a.y + 32} Z" fill="#3a6ea5" stroke="#274a70" stroke-width="2"/>
    <rect x="${a.x - 16}" y="${a.y - 14}" width="8" height="16" fill="#3a6ea5" stroke="#274a70" stroke-width="1.5"/>
    <rect x="${a.x + 8}" y="${a.y - 14}" width="8" height="16" fill="#3a6ea5" stroke="#274a70" stroke-width="1.5"/>
  `,
  tutu: (a) => `<path d="M${a.x - 30} ${a.y + 20} Q${a.x} ${a.y - 14} ${a.x + 30} ${a.y + 20} Q${a.x} ${a.y + 10} ${a.x - 30} ${a.y + 20} Z" fill="#ff9fc7" stroke="#d4679a" stroke-width="2" opacity="0.9"/>`,
  superheroSuit: (a) => `
    <path d="M${a.x - 22} ${a.y - 4} L${a.x + 22} ${a.y - 4} L${a.x + 18} ${a.y + 30} L${a.x - 18} ${a.y + 30} Z" fill="#3a6ea5" stroke="#274a70" stroke-width="2"/>
    <path d="M${a.x} ${a.y - 4} L${a.x - 6} ${a.y + 10} L${a.x} ${a.y + 6} L${a.x + 6} ${a.y + 10} Z" fill="#ffd25f"/>
  `,
};

const SCAR_RENDERERS = {
  eyeScar: (a) => `<path d="M${a.x - 30} ${a.y - 20} L${a.x - 14} ${a.y + 14}" stroke="#a13a30" stroke-width="2.5" opacity="0.75" stroke-linecap="round"/>`,
  stitches: (a) => `
    <path d="M${a.x - 18} ${a.y + 20} L${a.x + 8} ${a.y + 16}" stroke="#7a3a3a" stroke-width="1.5" opacity="0.8"/>
    ${[0, 5, 10, 15, 20].map((i) => `<path d="M${a.x - 18 + i} ${a.y + 20 - i * 0.16} l3 -6" stroke="#7a3a3a" stroke-width="1.5" opacity="0.8"/>`).join("")}
  `,
  burnMarks: (a) => `
    <circle cx="${a.x - 20}" cy="${a.y + 10}" r="5" fill="#2b2b3a" opacity="0.3"/>
    <circle cx="${a.x - 10}" cy="${a.y + 20}" r="3.5" fill="#2b2b3a" opacity="0.3"/>
    <circle cx="${a.x - 26}" cy="${a.y + 22}" r="3" fill="#2b2b3a" opacity="0.3"/>
  `,
  clawMarks: (a) =>
    [0, 6, 12]
      .map((dx) => `<path d="M${a.x + 10 + dx} ${a.y - 16} L${a.x + 4 + dx} ${a.y + 18}" stroke="#a13a30" stroke-width="2" opacity="0.6" stroke-linecap="round"/>`)
      .join(""),
  bandageWrap: (a) => `
    <path d="M${a.x - 22} ${a.y + 6} L${a.x + 6} ${a.y - 4}" stroke="#f0e6d2" stroke-width="9" opacity="0.9" stroke-linecap="round"/>
    <path d="M${a.x - 22} ${a.y + 6} L${a.x + 6} ${a.y - 4}" stroke="#c9bd9e" stroke-width="9" opacity="0.5" stroke-dasharray="2 4" stroke-linecap="round"/>
  `,
};

const RENDERERS_BY_CATEGORY = {
  head: HEAD_RENDERERS,
  face: FACE_RENDERERS,
  back: BACK_RENDERERS,
  tail: TAIL_RENDERERS,
  outfit: OUTFIT_RENDERERS,
  scar: SCAR_RENDERERS,
};

/* ---------------------------------------------------------------------- */
/* Shop catalog: 50 purchasable items across 7 categories                  */
/* ---------------------------------------------------------------------- */

export const SHOP_ITEMS = [
  // Head (12)
  { id: "partyHat", name: "Party Hat", category: "head", cost: 40 },
  { id: "wizardHat", name: "Wizard Hat", category: "head", cost: 55 },
  { id: "topHat", name: "Top Hat", category: "head", cost: 50 },
  { id: "crown", name: "Royal Crown", category: "head", cost: 70 },
  { id: "halo", name: "Halo", category: "head", cost: 65 },
  { id: "singleHorn", name: "Little Horn", category: "head", cost: 30 },
  { id: "twinHorns", name: "Twin Horns", category: "head", cost: 45 },
  { id: "ramHorns", name: "Ram Horns", category: "head", cost: 60 },
  { id: "antennae", name: "Antennae", category: "head", cost: 35 },
  { id: "bandana", name: "Bandana", category: "head", cost: 25 },
  { id: "pirateHat", name: "Pirate Hat", category: "head", cost: 55 },
  { id: "flowerCrown", name: "Flower Crown", category: "head", cost: 45 },
  // Face (6)
  { id: "studyGlasses", name: "Study Glasses", category: "face", cost: 35 },
  { id: "sunglasses", name: "Sunglasses", category: "face", cost: 40 },
  { id: "monocle", name: "Monocle", category: "face", cost: 50 },
  { id: "eyepatch", name: "Eyepatch", category: "face", cost: 30 },
  { id: "faceMask", name: "Face Mask", category: "face", cost: 35 },
  { id: "thirdEyeGem", name: "Third Eye Gem", category: "face", cost: 60 },
  // Back (8)
  { id: "batWings", name: "Bat Wings", category: "back", cost: 70 },
  { id: "angelWings", name: "Angel Wings", category: "back", cost: 80 },
  { id: "dragonflyWings", name: "Dragonfly Wings", category: "back", cost: 65 },
  { id: "butterflyWings", name: "Butterfly Wings", category: "back", cost: 65 },
  { id: "cape", name: "Hero Cape", category: "back", cost: 55 },
  { id: "backpack", name: "Backpack", category: "back", cost: 40 },
  { id: "shell", name: "Turtle Shell", category: "back", cost: 60 },
  { id: "finBack", name: "Dorsal Fin", category: "back", cost: 45 },
  // Tail (5)
  { id: "spikeTail", name: "Spike Tail", category: "tail", cost: 40 },
  { id: "fluffyTail", name: "Fluffy Tail", category: "tail", cost: 45 },
  { id: "lizardTail", name: "Lizard Tail", category: "tail", cost: 40 },
  { id: "fishTail", name: "Fish Tail", category: "tail", cost: 50 },
  { id: "stingerTail", name: "Stinger Tail", category: "tail", cost: 55 },
  // Skin (6)
  { id: "scales", name: "Scaly Skin", category: "skin", cost: 60 },
  { id: "fur", name: "Furry Coat", category: "skin", cost: 55 },
  { id: "bark", name: "Bark Skin", category: "skin", cost: 60 },
  { id: "crystal", name: "Crystal Skin", category: "skin", cost: 75 },
  { id: "metal", name: "Metal Plating", category: "skin", cost: 75 },
  { id: "slime", name: "Slime Coat", category: "skin", cost: 50 },
  // Outfit (8)
  { id: "bowTie", name: "Bow Tie", category: "outfit", cost: 25 },
  { id: "scarf", name: "Cozy Scarf", category: "outfit", cost: 30 },
  { id: "hoodie", name: "Hoodie", category: "outfit", cost: 45 },
  { id: "knightArmor", name: "Knight Armor", category: "outfit", cost: 80 },
  { id: "wizardRobe", name: "Wizard Robe", category: "outfit", cost: 65 },
  { id: "overalls", name: "Overalls", category: "outfit", cost: 40 },
  { id: "tutu", name: "Tutu", category: "outfit", cost: 35 },
  { id: "superheroSuit", name: "Superhero Suit", category: "outfit", cost: 60 },
  // Scars / battle damage (5)
  { id: "eyeScar", name: "Eye Scar", category: "scar", cost: 20 },
  { id: "stitches", name: "Stitches", category: "scar", cost: 25 },
  { id: "burnMarks", name: "Burn Marks", category: "scar", cost: 25 },
  { id: "clawMarks", name: "Claw Marks", category: "scar", cost: 20 },
  { id: "bandageWrap", name: "Bandage Wrap", category: "scar", cost: 20 },
];

export const CATEGORIES = [
  { id: "head", name: "Head" },
  { id: "face", name: "Face" },
  { id: "back", name: "Back" },
  { id: "tail", name: "Tail" },
  { id: "skin", name: "Skin" },
  { id: "outfit", name: "Outfit" },
  { id: "scar", name: "Scars" },
];

export function itemsByCategory(category) {
  return SHOP_ITEMS.filter((i) => i.category === category);
}

export function getShopItem(id) {
  return SHOP_ITEMS.find((i) => i.id === id);
}

/* ---------------------------------------------------------------------- */
/* Main render                                                             */
/* ---------------------------------------------------------------------- */

export const BODY_COLORS = [
  "#7fd1ae",
  "#ff9f6e",
  "#7fa8ff",
  "#d38fff",
  "#ffd25f",
  "#ff7fa8",
  "#6bd4d4",
  "#c9d46b",
  "#b08cff",
  "#ff8c66",
];

export function monsterSVG(config, { size = 160 } = {}) {
  const {
    bodyColor = "#7fd1ae",
    bodyShape = "round",
    monsterSize = "medium",
    limbs = 0,
    eyeType = 0,
    mouthType = 0,
    skin = "smooth",
    spots = false,
    head = "none",
    face = "none",
    back = "none",
    tail = "none",
    outfit = "none",
    scar = "none",
    evolutionStage = 0,
  } = config;

  const id = uid();
  const colorDark = shade(bodyColor, -25);
  const shapeInfo = bodyShapeMarkup(bodyShape, bodyColor, colorDark, evolutionStage);
  const [fx, fy] = shapeInfo.faceCenter;
  const fs = shapeInfo.faceScale;
  // Each evolution stage nudges the monster a little larger on top of the
  // player's own size pick, reinforcing "growing more powerful" alongside
  // the added decoration.
  const stageSizeBonus = [1, 1.04, 1.08, 1.13, 1.18][evolutionStage] ?? 1;
  const sizeScale = (SIZES.find((s) => s.id === monsterSize) || SIZES[1]).scale * stageSizeBonus;

  const faceTransform = `translate(${fx} ${fy}) scale(${fs}) translate(-50 -46)`;
  const eyesMarkup = (EYE_VARIANTS[eyeType] || EYE_VARIANTS[0])(id);
  const mouthMarkup = (MOUTH_VARIANTS[mouthType] || MOUTH_VARIANTS[0])();

  const headAnchor = { x: fx, y: fy - 20 * fs };
  const faceAnchor = { x: fx, y: fy };
  const [ox, oy] = shapeInfo.outfitAnchor || [50, 70];
  const outfitScale = shapeInfo.outfitScale ?? 1;
  const outfitAnchor = { x: ox, y: oy };
  const scarAnchor = { x: fx, y: fy };
  const headScale = shapeInfo.headScale ?? 1;
  // Back accessories (wings, cape, backpack...) mount on the torso just like
  // outfits do, so they share the same per-shape anchor/scale.
  const backAnchor = outfitAnchor;
  const backScale = outfitScale;
  const [tx, ty] = shapeInfo.tailAnchor || [82, 82];
  const tailScale = shapeInfo.tailScale ?? 1;
  const tailAnchor = { x: tx, y: ty };

  const renderItem = (category, itemId, anchor) => {
    if (!itemId || itemId === "none") return "";
    const fn = RENDERERS_BY_CATEGORY[category]?.[itemId];
    return fn ? fn(anchor, colorDark, bodyColor) : "";
  };

  // Wrap a rendered accessory in a scale transform pinned at its own anchor
  // point, so the accessory shrinks/grows to fit the current body shape
  // without shifting off the spot it was anchored to.
  const scaledGroup = (markup, ax, ay, scale) =>
    markup ? `<g transform="translate(${ax} ${ay}) scale(${scale}) translate(${-ax} ${-ay})">${markup}</g>` : "";

  // Outfits, head accessories, back accessories, and tails are all drawn
  // assuming a torso/head roughly the size of the "round"/"humanoid" shapes;
  // scale and re-anchor them per body shape so they sit on the actual
  // silhouette instead of overflowing narrow bodies (treant, serpent) or
  // floating off flat/horizontal ones (centipede, crab). Face and scar
  // accessories reuse faceScale so they line up with the (already-scaled)
  // eyes instead of towering over small faces (insect, serpent, centipede).
  const outfitGroup = scaledGroup(renderItem("outfit", outfit, outfitAnchor), ox, oy, outfitScale);
  const headGroup = scaledGroup(renderItem("head", head, headAnchor), headAnchor.x, headAnchor.y, headScale);
  const backGroup = scaledGroup(renderItem("back", back, backAnchor), ox, oy, backScale);
  const tailGroup = scaledGroup(renderItem("tail", tail, tailAnchor), tx, ty, tailScale);
  const faceGroup = scaledGroup(renderItem("face", face, faceAnchor), fx, fy, fs);
  const scarGroup = scaledGroup(renderItem("scar", scar, scarAnchor), fx, fy, fs);

  // Scatter spots generously across the whole possible body area, then clip
  // to the current body shape's silhouette so they always land on the body
  // no matter how big, small, or oddly shaped it is.
  const spotsHTML = spots
    ? (() => {
        const spotClipId = `${id}-spotclip`;
        const positions = [
          [30, 20, 6],
          [68, 16, 5],
          [18, 40, 5],
          [80, 38, 6],
          [50, 30, 5],
          [24, 62, 6],
          [76, 60, 5],
          [40, 78, 6],
          [60, 80, 5],
          [30, 96, 5],
          [70, 96, 5],
          [50, 62, 4],
        ];
        const dots = positions
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colorDark}" opacity="0.55"/>`)
          .join("");
        return `<defs><clipPath id="${spotClipId}">${shapeInfo.clip}</clipPath></defs><g clip-path="url(#${spotClipId})">${dots}</g>`;
      })()
    : "";

  return `
  <svg width="${size}" height="${size}" viewBox="-18 -28 136 148" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(50 55) scale(${sizeScale}) translate(-50 -55)">
      <ellipse cx="50" cy="103" rx="34" ry="6" fill="#000" opacity="0.08"/>
      ${backGroup}
      ${tailGroup}
      ${shapeInfo.fill}
      ${skinOverlay(skin, shapeInfo.clip, colorDark)}
      ${spotsHTML}
      ${limbsMarkup(limbs, bodyShape, bodyColor, colorDark)}
      ${outfitGroup}
      ${headGroup}
      <g transform="${faceTransform}">
        ${eyesMarkup}
        ${mouthMarkup}
      </g>
      ${faceGroup}
      ${scarGroup}
    </g>
  </svg>`;
}
