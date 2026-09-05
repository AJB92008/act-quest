// ACT Reading's "hub" island, Athenaeum Reef — the same walkable-hub
// treatment as English's Wordwood Isle (islandHub.js) and Math's Numeria
// Peaks (mathHub.js): a big walkable island, one trail per skill, a
// central Vocabulary Builder landmark, WASD-or-joystick movement that
// auto-opens whatever the player's monster walks onto. Replaces
// island.js's usual scrollable skill list for this subject only — see
// island.js's own dispatch at the top of renderIsland(). The underlying
// "big walkable world" mechanics (world/camera geometry, movement,
// fullscreen toggle) live in hubWorld.js; this file owns only what's
// specific to Reading's own hub: the reef-themed zones and the
// Vocabulary Builder landmark (also the reference lesson on Reading's
// plain island list — see island.js's referenceLinkHTML).
//
// Structurally different from Wordwood Isle on purpose: not another
// curved ribbon, but a cluster of five rounded lobes (see hubWorld.js's
// own computeLobeLayout/renderLobeIsland) fused together around a shared
// ring, like petals grown into one landmass rather than a coastline you
// could walk end to end.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";
import {
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  computeLobeLayout,
  renderWorldSvg,
  renderLobeIsland,
  wireMovement,
  wireFullscreenToggle,
  joystickHTML,
} from "./hubWorld.js";

const SKILL_TRIGGER_RADIUS = 58;
const LANDMARK_TRIGGER_RADIUS = 150;

// Sized to stay clear of the boss's own dark clearing to the south
// (BOSS_POS, well below RING.y + RING.lobeRadius + RING.ringRadius) and
// the world's top edge — see the arithmetic in hubWorld.js's own
// renderLobeIsland doc comment for why a lobe cluster's circular
// footprint needs this kind of headroom check that an elongated ribbon
// doesn't.
const RING = { center: { x: 1100, y: 650 }, ringRadius: 230, lobeRadius: 230 };

// Five lobes, one per reef zone, fused into one landmass rather than
// five separate islets — order here is order around RING (see
// computeLobeLayout/renderLobeIsland in hubWorld.js), starting straight
// up from the ring's own center and going clockwise; every skill stays
// in the exact same zone it's always been in regardless of how this
// array is ordered. `description` is what the legend shows for each zone
// — computeLobeLayout splits Reading's 10 skills into these 5 zones by
// plain index order (2 per zone), not by reportingCategory, so each
// description below just names whatever those two skills actually are
// (see js/data/skills.js's reading skill list), same reasoning as
// islandHub.js's own zone descriptions.
const ZONES = [
  { id: "stacks", name: "Coral Stacks", fill: "#7fd9c4", description: "Main ideas & key details", decorations: ["🪸", "📚", "🐠"] },
  { id: "tidepool", name: "Tide Pool Terrace", fill: "#a7e0d8", description: "Sequence & comparison", decorations: ["🌊", "🦀", "🐚"] },
  { id: "lighthouse", name: "Lighthouse Point", fill: "#e8d29a", description: "Cause/effect & vocabulary", decorations: ["🧭", "⛵", "🐟"] },
  { id: "archive", name: "Sunken Archive", fill: "#6fb8c9", description: "Generalizing & author's craft", decorations: ["📜", "🐙", "🦑"] },
  { id: "driftwood", name: "Driftwood Cove", fill: "#c9a887", description: "Claims & multiple texts", decorations: ["🪵", "🐬", "🐳"] },
];

function renderLegend() {
  return `
    <div class="hub-legend" aria-hidden="true">
      <p class="hub-legend-title">Island regions</p>
      ${ZONES.map(
        (zone) => `
        <div class="hub-legend-row">
          <span class="hub-legend-swatch" style="background:${zone.fill}"></span>
          <span>
            <span class="hub-legend-name">${zone.name}</span><br>
            <span class="hub-legend-desc">${zone.description}</span>
          </span>
        </div>
      `
      ).join("")}
    </div>
  `;
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

export function renderReadingHub(root, navigate, subject) {
  const layout = computeLobeLayout(subject.skills, ZONES, { ringCenter: RING.center, ringRadius: RING.ringRadius, lobeRadius: RING.lobeRadius });
  // The Vocabulary Builder sits right where every lobe overlaps —
  // the ring's own shared center — same "one clear landmark, easy to
  // find" role Wordwood Isle's own spine-midpoint landmark plays.
  const landmarkPos = { x: RING.center.x, y: RING.center.y };

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  const sceneSvg = renderWorldSvg(layout, {
    ariaLabel:
      "Athenaeum Reef, five rounded reef lobes fused into one landmass around a shared center — coral stacks, a tide pool terrace, a lighthouse point, a sunken archive, and a driftwood cove — each with its own trail of reading skills, plus a dark path south to the boss lair",
    landmass: () => "",
    regionShapes: (zoneGroups) => renderLobeIsland(zoneGroups, { ringCenter: RING.center, ringRadius: RING.ringRadius, lobeRadius: RING.lobeRadius }),
  });

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen reef-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD (or the joystick) through the stacks, tide pool, lighthouse, archive, and cove — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        ${renderLegend()}
        ${joystickHTML("hubJoystick")}
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${sceneSvg}
          <div class="hub-marker-wrap" style="left:${landmarkPos.x}px;top:${landmarkPos.y}px;">
            <button class="hub-landmark" data-landmark aria-label="ACT Vocabulary Builder">
              <span class="hub-landmark-icon">🔤</span>
            </button>
            <span class="hub-skill-name hub-landmark-name">Vocabulary Builder</span>
          </div>
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderBossMarker(boss, bossStateClass, subject)}
          <div class="hub-avatar" id="hubAvatar" aria-hidden="true">${monsterSVG(gameState.getDisplayAvatar(), { size: 64 })}</div>
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
  root.querySelector("[data-landmark]").addEventListener("click", () => goTo("vocabulary", {}));
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  const unwireFullscreen = wireFullscreenToggle(root.querySelector("#hubViewport"), root.querySelector("#hubFullscreenBtn"));

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    hintEl: root.querySelector("#hubHint"),
    joystickEl: root.querySelector("#hubJoystick"),
    // Straight out from the shared center, past the landmark's own
    // 150px trigger radius, so a single step at spawn can never yank
    // the player straight into the Vocabulary Builder.
    spawn: { x: RING.center.x, y: RING.center.y + 220 },
    targets: [
      { x: landmarkPos.x, y: landmarkPos.y, radius: LANDMARK_TRIGGER_RADIUS, onArrive: () => goTo("vocabulary", {}) },
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
