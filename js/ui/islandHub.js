// ACT English's "hub" island — see the design brief this was built from
// (a big walkable island, one trail per skill, a central Vocabulary
// Builder landmark, WASD movement that auto-opens whatever the player's
// monster walks onto). Replaces island.js's usual scrollable skill list
// for this one subject only; every other subject's island still renders
// that original list unchanged — see island.js's own dispatch at the top
// of renderIsland().
//
// Everything here is plain SVG primitives plus emoji glyphs (no image
// assets, matching the rest of this app), laid out in one fixed "world"
// space (WORLD_W x WORLD_H) — every skill marker, the landmark, and the
// avatar are positioned in literal world pixels (1 world unit = 1 CSS
// px), not percentages. The world is much bigger than the visible
// viewport on purpose (25 skills need real room to breathe): a fixed-size
// `.hub-viewport` clips it with overflow:hidden, and `.hub-world` inside
// gets translated every animation frame to keep the avatar centered —
// a classic 2D-game camera. That's what lets trails wind out past the
// edge of the screen and have the player's monster actually travel
// there, rather than everything needing to fit in view at once.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";

const WORLD_W = 2200;
const WORLD_H = 1600;
const CENTER = { x: WORLD_W / 2, y: WORLD_H / 2 };
// Keeps the avatar (and every marker) this far inside the world's outer
// edge — the landmass itself is drawn a little inside this margin too, so
// it reads as the actual coastline rather than an invisible wall.
const WALK_MARGIN = 170;
const LANDMARK_CLEARING_R = 130;
const SKILL_TRIGGER_RADIUS = 58;
const LANDMARK_TRIGGER_RADIUS = 150;
const AVATAR_SPEED = 6.2; // world px per animation frame

// One big island, four differently-themed regions blended into it rather
// than four separate islets — keeps the whole thing walkable as a single
// landmass (matches "island should be very big," singular) while still
// giving each cluster of skills its own distinct look and a handful of
// small scenery details, per the brief. Each zone's `dir` points from the
// world's center out toward that zone's corner; skill trails wind further
// out along that same direction; the four fill colors deliberately land
// far from every other subject's own palette elsewhere in the app.
const ZONES = [
  { id: "meadow", name: "Sunny Meadow", dir: { x: -1, y: -1 }, fill: "#c3dd8f", decorations: ["🌼", "🌸", "🦋", "🐝"] },
  { id: "hillside", name: "Rocky Hillside", dir: { x: 1, y: -1 }, fill: "#c2ab84", decorations: ["🪨", "⛰️", "🐐"] },
  { id: "forest", name: "Whisper Grove", dir: { x: -1, y: 1 }, fill: "#7fa35e", decorations: ["🌳", "🌲", "🦉"] },
  { id: "dock", name: "Tidewater Dock", dir: { x: 1, y: 1 }, fill: "#dcc48f", decorations: ["⚓", "🚤", "🐚"] },
];

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// Splits the subject's skills into contiguous chunks, one per zone, then
// winds each chunk out from the center along that zone's own direction —
// alternating side-to-side (a real trail wanders, it doesn't beeline) so
// markers land with real room between them instead of crowding one ring.
function computeSkillLayout(skills) {
  const perZone = Math.ceil(skills.length / ZONES.length);
  return skills.map((skill, i) => {
    const zoneIndex = Math.min(Math.floor(i / perZone), ZONES.length - 1);
    const zone = ZONES[zoneIndex];
    const indexInZone = i - zoneIndex * perZone;
    const len = Math.hypot(zone.dir.x, zone.dir.y) || 1;
    const dirX = zone.dir.x / len;
    const dirY = zone.dir.y / len;
    const perpX = -dirY;
    const perpY = dirX;
    const along = 300 + indexInZone * 155;
    const side = (indexInZone % 2 === 0 ? 1 : -1) * (100 + (indexInZone % 3) * 35);
    const x = clamp(CENTER.x + dirX * along + perpX * side, WALK_MARGIN, WORLD_W - WALK_MARGIN);
    const y = clamp(CENTER.y + dirY * along + perpY * side, WALK_MARGIN, WORLD_H - WALK_MARGIN);
    return { skill, zone, x, y, dockX: x + dirX * 55, dockY: y + dirY * 55 };
  });
}

function isInsideWorld(x, y) {
  return x >= WALK_MARGIN && x <= WORLD_W - WALK_MARGIN && y >= WALK_MARGIN && y <= WORLD_H - WALK_MARGIN;
}

function renderSceneSvg(layout) {
  const zoneGroups = ZONES.map((zone) => ({ zone, points: layout.filter((p) => p.zone === zone) }));

  const regionShapes = zoneGroups
    .map(({ zone, points }) => {
      if (!points.length) return "";
      const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
      const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
      const angle = (Math.atan2(zone.dir.y, zone.dir.x) * 180) / Math.PI;
      const spread = 210 + points.length * 95;
      return `<ellipse cx="${avgX}" cy="${avgY}" rx="${spread}" ry="${spread * 0.6}" fill="${zone.fill}" opacity="0.55" transform="rotate(${angle} ${avgX} ${avgY})" />`;
    })
    .join("");

  const trails = zoneGroups
    .map(({ points }) => {
      if (!points.length) return "";
      const d = [`M${CENTER.x},${CENTER.y}`, ...points.map((p) => `L${p.x},${p.y}`)].join(" ");
      return `<path d="${d}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />`;
    })
    .join("");

  const docks = layout
    .map(({ x, y, dockX, dockY }) => `<line x1="${x}" y1="${y}" x2="${dockX}" y2="${dockY}" stroke="#a9987a" stroke-width="8" stroke-linecap="round" />`)
    .join("");

  // A few small, fixed emoji details scattered around each region's own
  // center — same "hand-placed decoration" idea as pathTrail.js's
  // renderDecorations, just zone-themed instead of generic.
  const decorations = zoneGroups
    .map(({ zone, points }) => {
      if (!points.length) return "";
      const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
      const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
      return zone.decorations
        .map((emoji, i) => {
          const angle = (i / zone.decorations.length) * Math.PI * 2 + 0.4;
          const r = 130 + i * 40;
          const dx = avgX + Math.cos(angle) * r;
          const dy = avgY + Math.sin(angle) * r * 0.65;
          return `<text x="${dx}" y="${dy}" font-size="36" text-anchor="middle">${emoji}</text>`;
        })
        .join("");
    })
    .join("");

  const landRx = WORLD_W / 2 - WALK_MARGIN + 60;
  const landRy = WORLD_H / 2 - WALK_MARGIN + 60;

  return `
    <svg viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg" class="hub-scene-svg" role="img"
      aria-label="Wordwood Isle, a big island with a sunny meadow, a rocky hillside, a whisper grove, and a tidewater dock, each with its own trail of grammar skills">
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy + 26}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="rgba(20,45,55,0.16)" />
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="#e3c98f" stroke="#c9a668" stroke-width="6" />
      <g>${regionShapes}</g>
      <circle cx="${CENTER.x}" cy="${CENTER.y}" r="${LANDMARK_CLEARING_R}" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />
      <g>${trails}</g>
      <g>${docks}</g>
      <g>${decorations}</g>
    </svg>
  `;
}

function renderSkillMarker({ skill, x, y }, subject) {
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

// Continuous WASD (+ arrow key) movement plus a following camera: a
// single document-level keydown/keyup pair tracks which directions are
// currently held, and a requestAnimationFrame loop moves the avatar
// every frame while any are — same "bind on document, return an unbind
// function, caller must call it before navigating away" shape as
// keyboardNav.js's quiz shortcuts, just continuous instead of discrete.
// Every frame also re-centers `.hub-world` under the avatar (clamped so
// the world's own edges never pull inward past the viewport's edges),
// which is what makes a world several times the viewport's size feel
// like open ground instead of a scrollbar-bound page.
function wireMovement({ avatarEl, worldEl, viewportEl, layout, landmarkPos, onArriveSkill, onArriveLandmark }) {
  let x = CENTER.x;
  let y = CENTER.y + LANDMARK_CLEARING_R + 55;
  const held = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
  let stopped = false;
  let rafId = null;
  let lastTriggeredSkillId = null;
  let landmarkTriggered = false;
  let viewportW = 0;
  let viewportH = 0;

  function measureViewport() {
    const rect = viewportEl.getBoundingClientRect();
    viewportW = rect.width;
    viewportH = rect.height;
  }
  measureViewport();
  window.addEventListener("resize", measureViewport);

  function place() {
    avatarEl.style.left = `${x}px`;
    avatarEl.style.top = `${y}px`;
    const camX = clamp(viewportW / 2 - x, Math.min(0, viewportW - WORLD_W), 0);
    const camY = clamp(viewportH / 2 - y, Math.min(0, viewportH - WORLD_H), 0);
    worldEl.style.transform = `translate(${camX}px, ${camY}px)`;
  }
  place();

  function keyName(e) {
    return e.key.toLowerCase();
  }
  function onKeyDown(e) {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
    const k = keyName(e);
    if (k in held) held[k] = true;
  }
  function onKeyUp(e) {
    const k = keyName(e);
    if (k in held) held[k] = false;
  }
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  function checkArrivals() {
    if (Math.hypot(x - landmarkPos.x, y - landmarkPos.y) <= LANDMARK_TRIGGER_RADIUS) {
      if (!landmarkTriggered) {
        landmarkTriggered = true;
        onArriveLandmark();
      }
      return;
    }
    landmarkTriggered = false;

    const arrived = layout.find((p) => Math.hypot(x - p.x, y - p.y) <= SKILL_TRIGGER_RADIUS);
    if (arrived) {
      if (lastTriggeredSkillId !== arrived.skill.id) {
        lastTriggeredSkillId = arrived.skill.id;
        onArriveSkill(arrived.skill.id);
      }
    } else {
      lastTriggeredSkillId = null;
    }
  }

  function tick() {
    if (stopped) return;
    let dx = 0;
    let dy = 0;
    if (held.w || held.arrowup) dy -= 1;
    if (held.s || held.arrowdown) dy += 1;
    if (held.a || held.arrowleft) dx -= 1;
    if (held.d || held.arrowright) dx += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      const nx = x + (dx / len) * AVATAR_SPEED;
      const ny = y + (dy / len) * AVATAR_SPEED;
      if (isInsideWorld(nx, ny)) {
        x = nx;
        y = ny;
      } else if (isInsideWorld(nx, y)) {
        x = nx;
      } else if (isInsideWorld(x, ny)) {
        y = ny;
      }
      place();
      checkArrivals();
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return function stop() {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", measureViewport);
  };
}

export function renderEnglishHub(root, navigate, subject) {
  const layout = computeSkillLayout(subject.skills);
  const landmarkPos = { x: CENTER.x, y: CENTER.y };

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";
  const bossEncounterHTML = `
    <div class="boss-encounter ${bossStateClass}" style="--island-color:${subject.color}">
      <div class="boss-encounter-monster">
        ${monsterSVG(boss.avatar, { size: 160 })}
        ${bossCleared ? `<span class="boss-encounter-crown">👑</span>` : ""}
      </div>
      <div class="boss-encounter-info">
        <h3>${allMastered ? "" : "🔒 "}${boss.name}</h3>
        <p class="boss-encounter-subtitle">${subject.name} Boss Quiz${bossCleared ? " (Cleared!)" : ""}</p>
        <p class="boss-encounter-blurb">${
          allMastered
            ? "20 mixed questions from every island on this planet. Clear it for a big one-time bonus."
            : `Master all ${subject.skills.length} islands on this planet to unlock.`
        }</p>
        ${allMastered ? `<button class="btn-primary" data-boss>Challenge the Boss &rarr;</button>` : ""}
      </div>
    </div>
  `;

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="island-heading-blurb">${subject.blurb}</p>
      <p class="map-subtitle">🧭 Walk your monster with WASD through the meadow, hillside, grove, and dock — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${renderSceneSvg(layout)}
          <div class="hub-marker-wrap" style="left:${landmarkPos.x}px;top:${landmarkPos.y}px;">
            <button class="hub-landmark" data-landmark aria-label="ACT Vocabulary Builder">
              <span class="hub-landmark-icon">🔤</span>
            </button>
            <span class="hub-skill-name hub-landmark-name">Vocabulary Builder</span>
          </div>
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          <div class="hub-avatar" id="hubAvatar" aria-hidden="true">${monsterSVG(gameState.getDisplayAvatar(), { size: 46 })}</div>
        </div>
      </div>
      ${bossEncounterHTML}
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

  stop = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl: root.querySelector("#hubViewport"),
    layout,
    landmarkPos,
    onArriveSkill: (skillId) => goTo("skillPath", { skillId, subjectId: subject.id }),
    onArriveLandmark: () => goTo("vocabulary", {}),
  });
}
