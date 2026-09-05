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
import { closedBlobPath, jaggedBandPath } from "./lessonTerrain.js";
import {
  BOSS_POS,
  BOSS_TRIGGER_RADIUS,
  WORLD_W,
  WORLD_H,
  computeLobeLayout,
  renderWorldSvg,
  renderLobeIsland,
  organicRingPoints,
  RIBBON_SAND,
  wireMovement,
  wireFullscreenToggle,
  joystickHTML,
} from "./hubWorld.js";

const SKILL_TRIGGER_RADIUS = 58;
// Was 150 — see islandHub.js's own copy of this constant for why 90
// (~2x the landmark's real 42px visual radius) is the right target.
const LANDMARK_TRIGGER_RADIUS = 90;

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
// Lighthouse Point and Driftwood Cove originally used #e8d29a and
// #c9a887 — both close enough to hubWorld.js's own shared sand-base
// color (RIBBON_SAND, #ecdfb8) that those two lobes were nearly
// invisible against it, leaving the island reading as "two colorful
// lobes and a lot of plain sand" instead of five distinct zones. Moved
// to a saturated terracotta (a lighthouse's own warm red/rust, not
// another pale tan) and a real weathered-wood brown (matching
// driftwoodLocker.js's own PYLON_FILL, since it's the same material) —
// both now read clearly against the sand and against each other.
const ZONES = [
  { id: "stacks", name: "Coral Stacks", fill: "#7fd9c4", description: "Main ideas & key details", decorations: ["🪸", "📚", "🐠"] },
  { id: "tidepool", name: "Tide Pool Terrace", fill: "#a7e0d8", description: "Sequence & comparison", decorations: ["🌊", "🦀", "🐚"] },
  { id: "lighthouse", name: "Lighthouse Point", fill: "#e0935f", description: "Cause/effect & vocabulary", decorations: ["🧭", "⛵", "🐟"] },
  { id: "archive", name: "Sunken Archive", fill: "#6fb8c9", description: "Generalizing & author's craft", decorations: ["📜", "🐙", "🦑"] },
  { id: "driftwood", name: "Driftwood Cove", fill: "#8a7259", description: "Claims & multiple texts", decorations: ["🪵", "🐬", "🐳"] },
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

// Reef-appropriate flourish for what was otherwise just a bare dark
// dashed line across a lot of empty open water — bioluminescence, not
// torchlight, since this route is underwater/open sea rather than a
// wooden bridge. Same "sells the path as somewhere more serious" goal
// islandHub.js's own mist+torches serve for its boss bridge (see
// renderBossBridgeMist/renderBossBridgeTorches there), just themed to
// the reef, and folding in the default lair glow ourselves since
// supplying a custom `bossBridge` to renderWorldSvg replaces that too.
// Built from four pieces, assembled by renderBossPathGlow below:
// renderLandBridge (a solid causeway so the route reads as walkable
// ground, not open water), the dashed glow trail across its surface,
// renderBossIslet (the boss's own scrap of land), and renderBossIsletVeins
// (glowing accents tying the islet back to the same light as the trail).

// A solid causeway connecting the reef's own shore to the boss's islet
// — the dashed glow trail on its own still crossed open water, which
// reads as walking on water rather than an actual route. Built the same
// "two wobbled edges, closed into one path" way lessonTerrain.js's own
// river bands are (jaggedBandPath), filled as the same sand as the
// reef's own shore (RIBBON_SAND) rather than dark rock, so the crossing
// reads as a natural extension of the beach rather than a separate dark
// structure — the dashed trail and the islet itself are what mark it as
// leading somewhere serious, not the ground underfoot. Spans well past
// both the sand shore's own outer reach and the islet's own shadow
// radius on purpose — generous overlap on both ends means no visible
// seam, without having to keep this in exact lockstep with
// renderLobeIsland's own baseRadius math over in hubWorld.js.
function renderLandBridge() {
  const topY = 1000;
  const bottomY = 1320;
  const cx = BOSS_POS.x;
  const halfWidth = 60;
  const steps = 7;
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = topY + (bottomY - topY) * t;
    const wobble = Math.sin(t * 8.4) * 9 + Math.sin(t * 3.1 + 1.2) * 5;
    leftPts.push({ x: cx - halfWidth + wobble, y });
    rightPts.push({ x: cx + halfWidth + wobble, y });
  }
  // No stroke — same as every lobe and the shore itself (renderLobeIsland's
  // own shore/lobe paths are plain flat fills with no outline). A stroke
  // here would trace the bridge's own straight-ish edges as a fake seam
  // cutting across the shore's real, borderless coastline wherever the
  // two shapes overlap.
  return `<path d="${jaggedBandPath(leftPts, rightPts)}" fill="${RIBBON_SAND}" />`;
}

// A small dark islet for the boss to actually stand on, built from the
// exact same organicRingPoints/closedBlobPath technique every reef lobe
// already uses (see hubWorld.js's own renderLobeIsland) — just dark
// coral and jagged rock instead of a bright zone fill, so the boss
// reads as standing on its own scrap of land like every other zone
// instead of floating over open water. A single layer, not a base
// shadow plus a smaller rock on top — the outer shadow blob's own
// jitter range was too mild to read as rock at this size, so it just
// looked like a plain dark oval; one layer with a wider jitter range
// (below) reads as jagged instead. Seed (402) is an arbitrary fixed
// constant, not derived from anything — it only needs to be stable
// across renders, the same reasoning renderLobeIsland's own `seed`
// argument follows.
function renderBossIslet() {
  const rock = organicRingPoints(BOSS_POS, 130, 402, 20, [-0.24, 0.18]);
  return `<path d="${closedBlobPath(rock)}" fill="#2a1c2b" stroke="#4a2f3a" stroke-width="3" />`;
}

// Glowing bioluminescent veins across the islet's own rock, echoing the
// path's own glow orbs so the boss's lair reads as part of the same
// underwater light rather than a separate effect.
function renderBossIsletVeins() {
  return [0, 1, 2, 3, 4]
    .map((i) => {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const r = 55 + (i % 2) * 22;
      const vx = BOSS_POS.x + Math.cos(a) * r;
      const vy = BOSS_POS.y + Math.sin(a) * r;
      return `<circle cx="${vx}" cy="${vy}" r="${5 + (i % 2) * 2}" fill="#7fe8d9" opacity="0.5" />`;
    })
    .join("");
}

function renderBossPathGlow() {
  const dx = BOSS_POS.x - RING.center.x;
  const dy = BOSS_POS.y - RING.center.y;
  const midX = RING.center.x + dx / 2;
  const midY = RING.center.y + dy / 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const len = Math.hypot(dx, dy) || 1;
  const mist = `<ellipse cx="${midX}" cy="${midY}" rx="${len / 2 + 60}" ry="90" fill="#04202a" opacity="0.26" transform="rotate(${angle} ${midX} ${midY})" />`;
  const orbs = [0.22, 0.48, 0.74]
    .map((f) => {
      const ox = RING.center.x + dx * f;
      const oy = RING.center.y + dy * f;
      return `
        <circle cx="${ox}" cy="${oy}" r="22" fill="#7fe8d9" opacity="0.2" />
        <circle cx="${ox}" cy="${oy}" r="7" fill="#bdfaf0" opacity="0.92" />
      `;
    })
    .join("");
  // Plain dark stroke, same as every other hub's boss path — reads
  // clearly against the sand-colored land bridge, and keeps this the
  // one visibly "more serious" dark path on the map, same as before the
  // land bridge existed.
  const path = `<path d="M${RING.center.x},${RING.center.y} L${BOSS_POS.x},${BOSS_POS.y}" stroke="#3b2523" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" fill="none" opacity="0.85" />`;
  // Land bridge and path drawn before the islet so the causeway's own
  // tail end and the trail's last dashes read as running up to and
  // disappearing under the rock, not scribbled across its surface.
  return mist + renderLandBridge() + path + renderBossIslet() + renderBossIsletVeins() + orbs;
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
    bossBridge: () => renderBossPathGlow(),
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
