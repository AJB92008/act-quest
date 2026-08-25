// ACT Math's own "hub" island — Numeria Peaks, the Math equivalent of
// Wordwood Isle (islandHub.js's own header comment has the full English
// brief; this file mirrors its structure but is deliberately its own
// file rather than a parameterized branch of islandHub.js, since the
// two subjects' zones, palette, and landmass are unrelated). Same
// underlying "big walkable world" engine from hubWorld.js (world/camera
// geometry, movement, fullscreen toggle) — this file owns only what's
// specific to Math: a single elongated mountain-ridge landmass instead
// of Wordwood Isle's rounded coastline, and four zones grouped by actual
// math topic (algebra, geometry, functions, number & stats) rather than
// English's positional quadrants, so each zone's terrain flavor matches
// what's actually studied there. No center landmark (Math has no
// Vocabulary-Builder equivalent) and no goat/dev-mode easter egg — that
// unlock lives on Wordwood Isle only; once unlocked there it stays
// unlocked everywhere, so there's nothing to duplicate here.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import {
  CENTER,
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  WALK_MARGIN,
  computeZoneLayout,
  zoneCenter,
  renderWorldSvg,
  wireMovement,
  wireFullscreenToggle,
} from "./hubWorld.js";

const SKILL_TRIGGER_RADIUS = 58;

// Four zones spread mostly left-to-right along the ridge's own long axis
// (not English's four diagonal NW/NE/SW/SE quadrants, which suit a
// roughly round/square blob, not an elongated one) — Algebra anchors the
// far-left end, Number & Stats the far-right, with Geometry and
// Functions zigzagging up and down between them. `categories` (not a
// single `reportingCategory`) is what lets Number & Stats fold together
// two of skills.js's own reporting categories (numquant + stats) into
// one zone, so it isn't a lonely single-skill region next to three much
// bigger ones.
const ZONES = [
  { id: "algebra", name: "Ironroot Algebra", dir: { x: -1, y: -0.15 }, categories: ["algebra"], fill: "#c98a6b", decorations: ["🧮", "⚖️", "➕"] },
  { id: "geometry", name: "Shalefoot Geometry", dir: { x: -0.55, y: 0.3 }, categories: ["geometry"], fill: "#6ea88f", decorations: ["📐", "🔺", "⭕"] },
  { id: "functions", name: "Skyline Functions", dir: { x: 0.55, y: -0.3 }, categories: ["functions"], fill: "#7f8fd8", decorations: ["📈", "🌀", "➰"] },
  { id: "numstats", name: "Goldtally Flats", dir: { x: 1, y: 0.15 }, categories: ["numquant", "stats"], fill: "#d9b25c", decorations: ["🎲", "📊", "#️⃣"] },
];

// computeZoneLayout (hubWorld.js) chunks its `items` array positionally —
// item i lands in whichever zone `Math.floor(i / perZone)` picks out —
// so handing it all 18 Math skills at once in reportingCategory order
// would NOT reliably land each skill in its own topic's zone (a category
// boundary rarely falls on an exact perZone multiple). Calling it once
// per zone with that zone's own skill subset and a single-zone array
// sidesteps this: `perZone` becomes that subset's own length, so every
// item in the call lands at zoneIndex 0 — genuinely topic-grouped
// positioning with zero changes to the shared engine.
function buildLayout(subject) {
  return ZONES.flatMap((zone) => {
    const skills = subject.skills.filter((s) => zone.categories.includes(s.reportingCategory));
    return computeZoneLayout(skills, [zone]);
  });
}

// Numeria Peaks' own landmass, in two full-bleed layers that together
// cover the *entire* WORLD_W x WORLD_H canvas edge to edge — a hazy sky
// tone above, solid rock below — with a jagged mountain-crest line as
// the boundary between them. Unlike Wordwood Isle's rounded-rect
// coastline (sized to comfortably contain the walkable area, with a thin
// margin of plain background outside it that the camera can still pan
// into at the world's extreme corners), covering the whole canvas here
// means there is no seam the camera can ever pan past — no gap where
// the plain .ridge-scene page background would show through, and no
// stray "torn edge" floating over open space. The crest is now purely a
// decorative skyline sitting well inside that solid fill, not the
// landmass's own outer boundary, so it always reads as mountains against
// sky rather than a broken clip.
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 3.7) * 43758.5453;
  return x - Math.floor(x);
}

function ridgeCrestPoints() {
  const peakCount = 11;
  const baseline = WORLD_H * 0.22;
  return Array.from({ length: peakCount + 1 }, (_, i) => {
    const x = (i / peakCount) * WORLD_W;
    const isPeak = i % 2 === 0;
    const jitter = pseudoRandom(i);
    const y = isPeak ? baseline - 45 - jitter * 50 : baseline + jitter * 30;
    return { x, y };
  });
}

function renderMathLandmass() {
  const crest = ridgeCrestPoints();
  const crestLine = crest.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const rockShape = `${crestLine} L${WORLD_W},${WORLD_H} L0,${WORLD_H} Z`;
  const shadowLine = crest.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${(p.y + 40).toFixed(1)}`).join(" ");
  return `
    <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" fill="#ddd6ee" />
    <path d="${rockShape}" fill="#b8aed6" stroke="#7a6ba0" stroke-width="6" stroke-linejoin="round" />
    <path d="${shadowLine}" stroke="#7a6ba0" stroke-width="3" fill="none" opacity="0.45" stroke-dasharray="2 10" />
  `;
}

// Each zone's own region is a solid, non-overlapping rounded box — no
// translucent blending, no ambiguity about which topic a marker near an
// edge belongs to. The box starts as a tight fit around that zone's own
// markers (plus a fixed pad), then gets clamped to at most 42% of the
// distance to its *nearest* neighboring zone's own centroid on every
// side — since two boxes each capped to <=42% of the distance between
// their centers can never sum past that distance, this guarantees zero
// overlap between any pair of zones regardless of how their four
// centroids happen to fall, with no special-casing per zone.
function computeZoneBoxes(zoneGroups) {
  const centroids = zoneGroups.map(({ points }) => (points.length ? zoneCenter(points) : null));
  const PAD = 85;
  return zoneGroups.map(({ zone, points }, i) => {
    if (!points.length) return null;
    const { avgX, avgY } = centroids[i];
    let minDist = Infinity;
    centroids.forEach((c, j) => {
      if (j === i || !c) return;
      minDist = Math.min(minDist, Math.hypot(c.avgX - avgX, c.avgY - avgY));
    });
    const cap = minDist * 0.42;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x0 = Math.max(Math.min(...xs) - PAD, avgX - cap);
    const x1 = Math.min(Math.max(...xs) + PAD, avgX + cap);
    const y0 = Math.max(Math.min(...ys) - PAD, avgY - cap);
    const y1 = Math.min(Math.max(...ys) + PAD, avgY + cap);
    return { zone, points, x0, y0, x1, y1 };
  });
}

// Decoration icons scattered inside their own zone's own box (never
// beyond it), so each one reads as belonging to that topic's region
// instead of floating unattached in open space between zones.
function renderZoneDecorations(box) {
  const { zone, x0, y0, x1, y1 } = box;
  const w = x1 - x0;
  const h = y1 - y0;
  return zone.decorations
    .map((emoji, i) => {
      const fx = (i + 1) / (zone.decorations.length + 1);
      const jitterY = pseudoRandom(i + zone.id.length) * 0.5 + 0.22;
      const x = x0 + fx * w;
      const y = y0 + jitterY * h;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="34" text-anchor="middle">${emoji}</text>`;
    })
    .join("");
}

function renderMathRegions(zoneGroups) {
  const boxes = computeZoneBoxes(zoneGroups).filter(Boolean);
  return boxes
    .map(
      (box) => `
        <rect x="${box.x0.toFixed(1)}" y="${box.y0.toFixed(1)}" width="${(box.x1 - box.x0).toFixed(1)}" height="${(box.y1 - box.y0).toFixed(1)}"
          rx="46" fill="${box.zone.fill}" opacity="0.92" stroke="rgba(20, 15, 35, 0.35)" stroke-width="4" />
        ${renderZoneDecorations(box)}
      `
    )
    .join("");
}

function renderSkillMarker({ item: skill, x, y }, subject) {
  const progress = gameState.getSkillProgress(skill.id);
  const totalLessons = getLessonCount(skill.id);
  const stateClass = progress.mastered ? "is-mastered" : "is-open";
  return `
    <div class="hub-marker-wrap" style="left:${x}px;top:${y}px;">
      <button class="hub-skill-marker node-circle node-circle-small ${stateClass}" data-skill="${skill.id}"
        style="--node-color:${subject.color}"
        aria-label="${skill.name}: ${progress.mastered ? "mastered" : `${progress.lessonsCompleted} of ${totalLessons} lessons complete`}">
        ${progress.mastered ? "✓" : ""}
      </button>
      <span class="hub-skill-name">${skill.name}</span>
    </div>
  `;
}

function renderBossMarker(boss, bossStateClass, subject) {
  const locked = bossStateClass === "is-locked";
  const cleared = bossStateClass === "is-cleared";
  return `
    <div class="hub-marker-wrap" style="left:${BOSS_POS.x}px;top:${BOSS_POS.y}px;">
      <button class="hub-boss-marker ${bossStateClass}" data-boss ${locked ? "disabled" : ""}
        aria-label="${boss.name}, ${subject.name} Boss Quiz${cleared ? " (cleared)" : locked ? `: locked until every skill on this island is mastered` : ""}">
        ${monsterSVG(boss.avatar, { size: 74 })}
        ${cleared ? `<span class="hub-boss-crown">👑</span>` : locked ? `<span class="hub-boss-lock">🔒</span>` : ""}
      </button>
      <span class="hub-skill-name hub-boss-name">${locked ? "🔒 " : ""}${boss.name}</span>
    </div>
  `;
}

export function renderMathHub(root, navigate, subject) {
  const layout = buildLayout(subject);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Numeria Peaks, a long jagged mountain ridge with four separate, solid-colored regions — algebra, geometry, functions, and number & stats — each with its own trail of math skills, plus a dark path south to the boss lair",
    landmass: renderMathLandmass,
    regionShapes: renderMathRegions,
    skipDecoration: () => true,
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ridge-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD along the ridge — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderBossMarker(boss, bossStateClass, subject)}
          <div class="hub-avatar" id="hubAvatar" aria-hidden="true">${monsterSVG(gameState.getDisplayAvatar(), { size: 46 })}</div>
        </div>
      </div>
    </main>
  `;

  let stop = () => {};
  const goTo = (screen, params) => {
    stop();
    navigate(screen, params);
  };

  wireHud(root, goTo);
  root.querySelector("[data-back]").addEventListener("click", () => goTo("map"));
  root.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => goTo("skillPath", { skillId: btn.dataset.skill, subjectId: subject.id }));
  });
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    spawn: { x: CENTER.x, y: CENTER.y },
    targets: [
      { x: BOSS_POS.x, y: BOSS_POS.y, radius: BOSS_TRIGGER_RADIUS, gate: () => allMastered, onArrive: () => goTo("bossQuiz", { subjectId: subject.id }) },
      ...layout.map((p) => ({
        x: p.x,
        y: p.y,
        radius: SKILL_TRIGGER_RADIUS,
        onArrive: () => goTo("skillPath", { skillId: p.item.id, subjectId: subject.id }),
      })),
    ],
  });
  stop = () => {
    stopMovement();
    unwireFullscreen();
  };
}
