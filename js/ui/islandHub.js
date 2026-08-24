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
import { hudHTML, wireHud, showToast } from "./hud.js";
import { showDevPanel, toggleDevPanel } from "./devPanel.js";
import { monsterSVG } from "./monster.js";
import { getBossMonster } from "../data/bossMonsters.js";
import { getLessonCount } from "../data/questions/index.js";
import { glowVars } from "./pathTrail.js";

// Dev mode's unlock gesture used to be 10 rapid clicks on the (now
// removed) dark-mode toggle; with that gone, the Rocky Hillside's own
// goat decoration (see computeGoatPos) is the new one — same 10-clicks-
// within-5s mechanic, just moved somewhere only exists on this screen.
const DEV_MODE_CLICKS = 10;
const DEV_MODE_WINDOW_MS = 5000;
// Module-level (not per-render) so rapid clicks keep counting across the
// innerHTML rebuild every navigate() triggers — same reasoning hud.js's
// old toggle-click tracking used.
let goatClickTimestamps = [];

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
// The boss lair sits by itself at the bottom-middle of the island, below
// every zone, reached by its own dark path rather than one of the tan
// trail forks — a deliberately different, more ominous route than the
// ones leading to an everyday skill.
const BOSS_POS = { x: CENTER.x, y: WORLD_H - WALK_MARGIN - 10 };
const BOSS_TRIGGER_RADIUS = 95;
// How long the player can go without pressing a movement key before the
// WASD hint reappears — starts counting on mount, and again every time
// movement stops.
const IDLE_HINT_MS = 5000;

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

// Same placement math the SVG decorations loop below uses, factored out
// so the (secretly clickable) goat can be positioned identically to how
// it would've rendered as a plain decoration, with nothing to give away
// that it's any different from the rocks/mountain next to it.
function decorationPos(avgX, avgY, index, total) {
  const angle = (index / total) * Math.PI * 2 + 0.4;
  const r = 130 + index * 40;
  return { x: avgX + Math.cos(angle) * r, y: avgY + Math.sin(angle) * r * 0.65 };
}

function zoneCenter(points) {
  const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
  const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { avgX, avgY };
}

// The Rocky Hillside sits toward the world's top-right (see ZONES' own
// `dir`), and its goat is the dev-mode unlock: 10 clicks within 5s, same
// mechanic the old theme toggle used before dark mode was removed. Found
// by position (zone id + the emoji itself) rather than a hardcoded index,
// so reordering ZONES' decoration lists later can't silently move it.
function computeGoatPos(layout) {
  const hillside = ZONES.find((z) => z.id === "hillside");
  const points = layout.filter((p) => p.zone === hillside);
  if (!points.length) return null;
  const { avgX, avgY } = zoneCenter(points);
  const index = hillside.decorations.indexOf("🐐");
  return decorationPos(avgX, avgY, index, hillside.decorations.length);
}

function renderSceneSvg(layout) {
  const zoneGroups = ZONES.map((zone) => ({ zone, points: layout.filter((p) => p.zone === zone) }));

  const regionShapes = zoneGroups
    .map(({ zone, points }) => {
      if (!points.length) return "";
      const { avgX, avgY } = zoneCenter(points);
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
      const { avgX, avgY } = zoneCenter(points);
      return zone.decorations
        .map((emoji, i) => {
          // The hillside goat is rendered separately, as a clickable HTML
          // overlay button at this exact same spot — see computeGoatPos.
          if (zone.id === "hillside" && emoji === "🐐") return "";
          const { x: dx, y: dy } = decorationPos(avgX, avgY, i, zone.decorations.length);
          return `<text x="${dx}" y="${dy}" font-size="36" text-anchor="middle">${emoji}</text>`;
        })
        .join("");
    })
    .join("");

  const landRx = WORLD_W / 2 - WALK_MARGIN + 60;
  const landRy = WORLD_H / 2 - WALK_MARGIN + 60;

  // The one dark, deliberately plain path to the boss lair — no zigzag,
  // no dock stub, a different color and dash than every skill trail so it
  // reads as "somewhere more serious" the moment you look at the map.
  const bossPath = `<path d="M${CENTER.x},${CENTER.y} L${BOSS_POS.x},${BOSS_POS.y}" stroke="#3b2a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" fill="none" opacity="0.8" />`;
  const bossLair = `<circle cx="${BOSS_POS.x}" cy="${BOSS_POS.y}" r="118" fill="#2c211c" opacity="0.22" />`;

  return `
    <svg viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg" class="hub-scene-svg" role="img"
      aria-label="Wordwood Isle, a big island with a sunny meadow, a rocky hillside, a whisper grove, and a tidewater dock, each with its own trail of grammar skills, plus a dark path south to the boss lair">
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy + 26}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="rgba(20,45,55,0.16)" />
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="#e3c98f" stroke="#c9a668" stroke-width="6" />
      <g>${regionShapes}</g>
      <circle cx="${CENTER.x}" cy="${CENTER.y}" r="${LANDMARK_CLEARING_R}" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />
      ${bossLair}
      <g>${trails}</g>
      ${bossPath}
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
function wireMovement({
  avatarEl,
  worldEl,
  viewportEl,
  hintEl,
  layout,
  landmarkPos,
  bossPos,
  bossUnlocked,
  onArriveSkill,
  onArriveLandmark,
  onArriveBoss,
}) {
  let x = CENTER.x;
  let y = CENTER.y + LANDMARK_CLEARING_R + 55;
  const held = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
  let stopped = false;
  let rafId = null;
  let lastTriggeredSkillId = null;
  let landmarkTriggered = false;
  let bossTriggered = false;
  let viewportW = 0;
  let viewportH = 0;
  let idleTimer = null;
  let wasMoving = false;

  function scheduleHint() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => hintEl.classList.add("is-visible"), IDLE_HINT_MS);
  }
  function hideHint() {
    clearTimeout(idleTimer);
    hintEl.classList.remove("is-visible");
  }
  scheduleHint();

  function measureViewport() {
    const rect = viewportEl.getBoundingClientRect();
    viewportW = rect.width;
    viewportH = rect.height;
  }
  measureViewport();
  window.addEventListener("resize", measureViewport);
  // Toggling fullscreen changes the viewport's size immediately, before
  // any "resize" event necessarily fires — re-measure right away so the
  // camera doesn't keep clamping to the old (much smaller) dimensions.
  document.addEventListener("fullscreenchange", measureViewport);

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

    if (bossUnlocked && Math.hypot(x - bossPos.x, y - bossPos.y) <= BOSS_TRIGGER_RADIUS) {
      if (!bossTriggered) {
        bossTriggered = true;
        onArriveBoss();
      }
      return;
    }
    bossTriggered = false;

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
      if (!wasMoving) {
        wasMoving = true;
        hideHint();
      }
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
    } else if (wasMoving) {
      wasMoving = false;
      scheduleHint();
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return function stop() {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(idleTimer);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", measureViewport);
    document.removeEventListener("fullscreenchange", measureViewport);
  };
}

export function renderEnglishHub(root, navigate, subject) {
  const layout = computeSkillLayout(subject.skills);
  const landmarkPos = { x: CENTER.x, y: CENTER.y };
  const goatPos = computeGoatPos(layout);

  const allMastered = subject.skills.every((skill) => gameState.isMastered(skill.id));
  const bossCleared = gameState.isBossCleared(subject.id);
  const boss = getBossMonster(subject.id, gameState.level);
  const bossStateClass = bossCleared ? "is-cleared" : allMastered ? "is-unlocked" : "is-locked";

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen island-screen hub-island-screen ocean-scene" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Map</button>
      <h1 class="island-heading">${subject.icon} ${subject.place}</h1>
      <p class="map-subtitle hub-hint" id="hubHint">🧭 Walk your monster with WASD through the meadow, hillside, grove, and dock — every trail leads to a skill</p>
      <div class="hub-viewport" id="hubViewport">
        <button class="hub-fullscreen-btn" id="hubFullscreenBtn" type="button" aria-label="Enter fullscreen">⛶</button>
        <div class="hub-world" id="hubWorld" style="width:${WORLD_W}px;height:${WORLD_H}px;">
          ${renderSceneSvg(layout)}
          <div class="hub-marker-wrap" style="left:${landmarkPos.x}px;top:${landmarkPos.y}px;">
            <button class="hub-landmark" data-landmark aria-label="ACT Vocabulary Builder">
              <span class="hub-landmark-icon">🔤</span>
            </button>
            <span class="hub-skill-name hub-landmark-name">Vocabulary Builder</span>
          </div>
          ${layout.map((p) => renderSkillMarker(p, subject)).join("")}
          ${renderBossMarker(boss, bossStateClass, subject)}
          ${
            goatPos
              ? `<button class="hub-goat-btn" id="hubGoatBtn" type="button" style="left:${goatPos.x}px;top:${goatPos.y}px" aria-label="A goat">🐐</button>`
              : ""
          }
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
  root.querySelector("[data-landmark]").addEventListener("click", () => goTo("vocabulary", {}));
  root.querySelector("[data-boss]")?.addEventListener("click", () => goTo("bossQuiz", { subjectId: subject.id }));

  root.querySelector("#hubGoatBtn")?.addEventListener("click", () => {
    const now = Date.now();
    goatClickTimestamps.push(now);
    goatClickTimestamps = goatClickTimestamps.filter((t) => now - t <= DEV_MODE_WINDOW_MS);
    if (goatClickTimestamps.length < DEV_MODE_CLICKS) return;
    goatClickTimestamps = [];
    if (!gameState.devModeUnlocked) {
      gameState.setDevModeUnlocked(true);
      showToast("🛠️ Developer Mode unlocked!");
      showDevPanel(goTo);
    } else {
      toggleDevPanel(goTo);
    }
  });

  // The Fullscreen API only ever fullscreens one specific element and
  // everything inside it — targeting #hubViewport (not the whole screen)
  // means the map itself fills the entire display while still working
  // like a normal DOM subtree (WASD, clicks, the camera transform all
  // keep working exactly as before, just at full monitor size).
  const viewportEl = root.querySelector("#hubViewport");
  const fullscreenBtn = root.querySelector("#hubFullscreenBtn");
  const isFullscreen = () => document.fullscreenElement === viewportEl;
  const updateFullscreenBtn = () => {
    fullscreenBtn.textContent = isFullscreen() ? "✕" : "⛶";
    fullscreenBtn.setAttribute("aria-label", isFullscreen() ? "Exit fullscreen" : "Enter fullscreen");
  };
  document.addEventListener("fullscreenchange", updateFullscreenBtn);
  fullscreenBtn.addEventListener("click", () => {
    // Browsers (and some embedding contexts) can refuse a fullscreen
    // request for reasons outside this page's control — swallow the
    // rejection rather than leaving an unhandled promise error in the
    // console; the button just silently stays in its current state.
    if (isFullscreen()) {
      document.exitFullscreen().catch(() => {});
    } else {
      viewportEl.requestFullscreen?.().catch(() => {});
    }
  });

  const stopMovement = wireMovement({
    avatarEl: root.querySelector("#hubAvatar"),
    worldEl: root.querySelector("#hubWorld"),
    viewportEl,
    hintEl: root.querySelector("#hubHint"),
    layout,
    landmarkPos,
    bossPos: BOSS_POS,
    bossUnlocked: allMastered,
    onArriveSkill: (skillId) => goTo("skillPath", { skillId, subjectId: subject.id }),
    onArriveLandmark: () => goTo("vocabulary", {}),
    onArriveBoss: () => goTo("bossQuiz", { subjectId: subject.id }),
  });
  stop = () => {
    stopMovement();
    document.removeEventListener("fullscreenchange", updateFullscreenBtn);
    if (isFullscreen()) document.exitFullscreen();
  };
}
