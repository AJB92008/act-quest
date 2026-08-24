// Shared building blocks for this app's "big walkable world" screens —
// first built for English's Wordwood Isle hub (islandHub.js), reused
// as-is for Idiom Instinct's own lesson path (skillPathHub.js). Anything
// here is generic over *what* is being laid out (skills, lessons,
// whatever comes next): a fixed pixel "world" bigger than the viewport,
// split into four themed zones radiating out from a center, with one
// always-different, dark-pathed "boss" spot at the bottom-middle, a
// following camera, continuous WASD movement, an idle hint, and a
// fullscreen toggle. Every caller supplies its own zone list/colors/
// decorations and its own marker HTML — this module only owns the math,
// the shared SVG scaffolding, and the movement/camera/fullscreen wiring.
export const WORLD_W = 2200;
export const WORLD_H = 1600;
export const CENTER = { x: WORLD_W / 2, y: WORLD_H / 2 };
// Keeps the avatar (and every marker) this far inside the world's outer
// edge — the landmass itself is drawn a little inside this margin too, so
// it reads as the actual coastline rather than an invisible wall.
export const WALK_MARGIN = 170;
export const LANDMARK_CLEARING_R = 130;
export const AVATAR_SPEED = 6.2; // world px per animation frame
// The "boss" spot always sits by itself at the bottom-middle, below every
// zone, reached by its own dark path rather than one of the tan trail
// forks — a deliberately different, more ominous route than the ones
// leading to an everyday node.
export const BOSS_POS = { x: CENTER.x, y: WORLD_H - WALK_MARGIN - 10 };
export const BOSS_TRIGGER_RADIUS = 95;
// How long the player can go without pressing a movement key before the
// WASD hint reappears — starts counting on mount, and again every time
// movement stops.
export const IDLE_HINT_MS = 5000;

export function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

export function isInsideWorld(x, y) {
  return x >= WALK_MARGIN && x <= WORLD_W - WALK_MARGIN && y >= WALK_MARGIN && y <= WORLD_H - WALK_MARGIN;
}

// Placement math for a zone's own decorative emoji (and anything that
// wants to sit at "the Nth decoration spot" — see islandHub.js's goat,
// clickable but positioned exactly like a plain decoration).
export function decorationPos(avgX, avgY, index, total) {
  const angle = (index / total) * Math.PI * 2 + 0.4;
  const r = 130 + index * 40;
  return { x: avgX + Math.cos(angle) * r, y: avgY + Math.sin(angle) * r * 0.65 };
}

export function zoneCenter(points) {
  const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
  const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { avgX, avgY };
}

// Splits `items` (skills, lessons, whatever) into contiguous chunks, one
// per zone, then winds each chunk out from the world's center along that
// zone's own direction — alternating side-to-side (a real trail wanders,
// it doesn't beeline) so items land with real room between them instead
// of crowding one ring. Every item gets `{item, zone, x, y, dockX, dockY}`.
export function computeZoneLayout(items, zones) {
  const perZone = Math.ceil(items.length / zones.length);
  return items.map((item, i) => {
    const zoneIndex = Math.min(Math.floor(i / perZone), zones.length - 1);
    const zone = zones[zoneIndex];
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
    return { item, zone, x, y, dockX: x + dirX * 55, dockY: y + dirY * 55 };
  });
}

// The full background SVG: the landmass, each zone's soft region tint,
// every item's winding trail back to the center, its dock stub, the
// zones' decorative emoji, and the one dark path south to the boss spot.
// `centerClearing` (optional) draws an extra circle at CENTER, for a
// screen that also has its own landmark sitting there (Wordwood Isle's
// Vocabulary Builder); `skipDecoration(zone, emoji)` (optional) omits one
// decoration from the SVG because the caller is rendering it separately
// as a real clickable element instead (Wordwood Isle's goat).
export function renderWorldSvg(layout, { ariaLabel, centerClearing, skipDecoration } = {}) {
  const zones = [...new Set(layout.map((p) => p.zone))];
  const zoneGroups = zones.map((zone) => ({ zone, points: layout.filter((p) => p.zone === zone) }));

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
          if (skipDecoration && skipDecoration(zone, emoji)) return "";
          const { x: dx, y: dy } = decorationPos(avgX, avgY, i, zone.decorations.length);
          return `<text x="${dx}" y="${dy}" font-size="36" text-anchor="middle">${emoji}</text>`;
        })
        .join("");
    })
    .join("");

  const landRx = WORLD_W / 2 - WALK_MARGIN + 60;
  const landRy = WORLD_H / 2 - WALK_MARGIN + 60;

  // The one dark, deliberately plain path to the boss spot — no zigzag,
  // no dock stub, a different color and dash than every other trail so
  // it reads as "somewhere more serious" the moment you look at the map.
  const bossPath = `<path d="M${CENTER.x},${CENTER.y} L${BOSS_POS.x},${BOSS_POS.y}" stroke="#3b2a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" fill="none" opacity="0.8" />`;
  const bossLair = `<circle cx="${BOSS_POS.x}" cy="${BOSS_POS.y}" r="118" fill="#2c211c" opacity="0.22" />`;
  const clearing = centerClearing
    ? `<circle cx="${CENTER.x}" cy="${CENTER.y}" r="${LANDMARK_CLEARING_R}" fill="${centerClearing.fill}" stroke="${centerClearing.stroke}" stroke-width="${centerClearing.strokeWidth}" />`
    : "";

  return `
    <svg viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg" class="hub-scene-svg" role="img" aria-label="${ariaLabel}">
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy + 26}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="rgba(20,45,55,0.16)" />
      <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="#e3c98f" stroke="#c9a668" stroke-width="6" />
      <g>${regionShapes}</g>
      ${clearing}
      ${bossLair}
      <g>${trails}</g>
      ${bossPath}
      <g>${docks}</g>
      <g>${decorations}</g>
    </svg>
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
//
// `targets` is a flat list of `{x, y, radius, onArrive, gate}` — checked
// in array order, first one the avatar is within `radius` of (and whose
// optional `gate()` returns true, or has no gate) wins for that frame.
// A locked lesson/skill just omits `onArrive` from firing by returning
// false from its own `gate`, exactly like its button being disabled.
export function wireMovement({ avatarEl, worldEl, viewportEl, hintEl, spawn, targets }) {
  let x = spawn.x;
  let y = spawn.y;
  const held = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
  let stopped = false;
  let rafId = null;
  let lastTarget = null;
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
    for (const t of targets) {
      if (t.gate && !t.gate()) continue;
      if (Math.hypot(x - t.x, y - t.y) <= t.radius) {
        if (lastTarget !== t) {
          lastTarget = t;
          t.onArrive();
        }
        return;
      }
    }
    lastTarget = null;
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

// The Fullscreen API only ever fullscreens one specific element and
// everything inside it — targeting the viewport (not the whole screen)
// means the map fills the entire display while still working like a
// normal DOM subtree (WASD, clicks, the camera transform all keep
// working unchanged, just at full monitor size). Returns an unwire
// function; browsers (and some embedding contexts) can refuse a
// fullscreen request for reasons outside this page's control, so both
// directions swallow their rejection instead of leaving an unhandled
// promise error in the console.
export function wireFullscreenToggle(viewportEl, btnEl) {
  const isFullscreen = () => document.fullscreenElement === viewportEl;
  const update = () => {
    btnEl.textContent = isFullscreen() ? "✕" : "⛶";
    btnEl.setAttribute("aria-label", isFullscreen() ? "Exit fullscreen" : "Enter fullscreen");
  };
  document.addEventListener("fullscreenchange", update);
  function onClick() {
    if (isFullscreen()) {
      document.exitFullscreen().catch(() => {});
    } else {
      viewportEl.requestFullscreen?.().catch(() => {});
    }
  }
  btnEl.addEventListener("click", onClick);
  return function unwire() {
    document.removeEventListener("fullscreenchange", update);
    if (isFullscreen()) document.exitFullscreen().catch(() => {});
  };
}
