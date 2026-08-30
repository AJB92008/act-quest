// Shared building blocks for this app's "big walkable world" screens —
// first built for English's Wordwood Isle hub (islandHub.js), reused
// as-is for Idiom Instinct's own lesson path (skillPathHub.js). Anything
// here is generic over *what* is being laid out (skills, lessons,
// whatever comes next) and *how* its zones are arranged: a fixed pixel
// "world" bigger than the viewport, with one always-different,
// dark-pathed "boss" spot at the bottom-middle, a following camera,
// continuous WASD-or-joystick movement, an idle hint, and a fullscreen
// toggle. Three zone-layout strategies live here — computeCurveLayout
// (any parametric spine — an S-curve, a spiral, whatever curveFn draws —
// paired with renderRibbonIsland) for a single elongated island,
// computeLobeLayout (paired with renderLobeIsland) for a cluster of
// fused rounded lobes, and each hub's own bespoke layout (Numeria
// Peaks/Lab Archipelago) for separate islands — every caller supplies
// its own zone list/colors/decorations and its own marker HTML either
// way; this module only owns the math, the shared SVG scaffolding, and
// the movement/camera/fullscreen wiring.
import { closedBlobPath } from "./lessonTerrain.js";
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

// The full background SVG: the landmass, each zone's soft region tint,
// every item's winding trail back to the center, its dock stub, the
// zones' decorative emoji, and the one dark path south to the boss spot.
// `centerClearing` (optional) draws an extra circle at CENTER, for a
// screen that also has its own landmark sitting there (Wordwood Isle's
// Vocabulary Builder); `skipDecoration(zone, emoji)` (optional) omits one
// decoration from the SVG because the caller is rendering it separately
// as a real clickable element instead (Wordwood Isle's goat); `landmass`
// (optional) is a zero-arg callback returning the SVG markup for the
// island's own shape/shadow, for a hub whose land shouldn't look like
// Wordwood Isle's own rounded-rect coastline (see mathHub.js's jagged
// ridge) — defaults to that same rounded-rect when omitted; `regionShapes`
// (optional) is a callback taking the computed `zoneGroups` and returning
// its own SVG markup for each zone's tinted region, for a hub whose zones
// shouldn't overlap the way Wordwood Isle's four soft translucent
// ellipses deliberately do (see mathHub.js's own non-overlapping, solid-
// fill regions) — defaults to that same ellipse blend when omitted;
// `trails` (optional) is a callback taking `zoneGroups` and returning its
// own trail markup, for a hub whose zones aren't arranged as spokes
// radiating from CENTER (Wordwood Isle's own layout) and so shouldn't
// draw every trail starting from that one shared point — defaults to
// that same center-radiating line when omitted. All three default to
// their exact prior behavior, so every existing caller renders unchanged.
export function renderWorldSvg(layout, { ariaLabel, centerClearing, skipDecoration, landmass, regionShapes, trails, bossBridge } = {}) {
  const zones = [...new Set(layout.map((p) => p.zone))];
  const zoneGroups = zones.map((zone) => ({ zone, points: layout.filter((p) => p.zone === zone) }));

  const regionShapesMarkup = regionShapes
    ? regionShapes(zoneGroups)
    : zoneGroups
        .map(({ zone, points }) => {
          if (!points.length) return "";
          const { avgX, avgY } = zoneCenter(points);
          const angle = (Math.atan2(zone.dir.y, zone.dir.x) * 180) / Math.PI;
          const spread = 210 + points.length * 95;
          return `<ellipse cx="${avgX}" cy="${avgY}" rx="${spread}" ry="${spread * 0.6}" fill="${zone.fill}" opacity="0.55" transform="rotate(${angle} ${avgX} ${avgY})" />`;
        })
        .join("");

  const trailsMarkup = trails
    ? trails(zoneGroups)
    : zoneGroups
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

  const landmassMarkup = landmass
    ? landmass()
    : (() => {
        const landRx = WORLD_W / 2 - WALK_MARGIN + 60;
        const landRy = WORLD_H / 2 - WALK_MARGIN + 60;
        return `
          <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy + 26}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="rgba(20,45,55,0.16)" />
          <rect x="${CENTER.x - landRx}" y="${CENTER.y - landRy}" width="${landRx * 2}" height="${landRy * 2}" rx="340" fill="#e3c98f" stroke="#c9a668" stroke-width="6" />
        `;
      })();

  // The one dark, deliberately plain path to the boss spot — no zigzag,
  // no dock stub, a different color and dash than every other trail so
  // it reads as "somewhere more serious" the moment you look at the map.
  // `bossBridge` (optional) replaces both pieces entirely, for a hub
  // whose boss route should be an actual bridge structure off the
  // island's own edge rather than a plain line from raw CENTER (see
  // islandHub.js's own renderBossBridge) — every other caller keeps this
  // exact default, unaffected.
  const bossPath = bossBridge ? bossBridge() : `<path d="M${CENTER.x},${CENTER.y} L${BOSS_POS.x},${BOSS_POS.y}" stroke="#3b2a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" fill="none" opacity="0.8" />`;
  const bossLair = bossBridge ? "" : `<circle cx="${BOSS_POS.x}" cy="${BOSS_POS.y}" r="118" fill="#2c211c" opacity="0.22" />`;
  const clearing = centerClearing
    ? `<circle cx="${CENTER.x}" cy="${CENTER.y}" r="${LANDMARK_CLEARING_R}" fill="${centerClearing.fill}" stroke="${centerClearing.stroke}" stroke-width="${centerClearing.strokeWidth}" />`
    : "";

  return `
    <svg viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg" class="hub-scene-svg" role="img" aria-label="${ariaLabel}">
      ${landmassMarkup}
      <g>${regionShapesMarkup}</g>
      ${clearing}
      ${bossLair}
      <g>${trailsMarkup}</g>
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
// `isWalkable(x, y)` (optional) overrides what counts as legal ground —
// for a hub whose land isn't the full walkable rectangle (Numeria
// Peaks' own separate islands, see mathHub.js's own point-in-polygon
// check against its actual rendered shoreline), so the avatar can walk
// right up to an island's own edge but not out into open water instead
// of just the world's outer margin — defaults to the plain rectangle
// check when omitted, so every existing caller is unaffected.
// `joystickEl` (optional) is an on-screen thumbstick base for touch (and
// mouse-drag) devices with no physical keyboard — see wireJoystick below.
// It feeds the exact same tick()/camera loop as WASD, just as a
// continuously-variable direction+magnitude instead of a held key, so
// every caller gets touch support for free by passing this one extra
// element rather than reimplementing movement.
export function wireMovement({ avatarEl, worldEl, viewportEl, hintEl, spawn, targets, isWalkable = isInsideWorld, joystickEl }) {
  let x = spawn.x;
  let y = spawn.y;
  const held = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
  const stick = { x: 0, y: 0 };
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

  // Touch (and mouse-drag) support: dragging from the joystick base sets
  // `stick` to a unit-ish vector toward the pointer, same idea as an
  // on-screen thumbstick in any mobile game. `pointerdown` + setPointerCapture
  // means the drag keeps tracking even once the finger/cursor leaves the
  // small joystick element, without needing a document-level listener.
  const JOYSTICK_RADIUS = 46;
  let activePointerId = null;
  function setStickFromEvent(e) {
    const rect = joystickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / JOYSTICK_RADIUS;
    const dy = (e.clientY - cy) / JOYSTICK_RADIUS;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      stick.x = dx / mag;
      stick.y = dy / mag;
    } else {
      stick.x = dx;
      stick.y = dy;
    }
    joystickEl.style.setProperty("--knob-x", `${stick.x * JOYSTICK_RADIUS}px`);
    joystickEl.style.setProperty("--knob-y", `${stick.y * JOYSTICK_RADIUS}px`);
  }
  function resetStick() {
    stick.x = 0;
    stick.y = 0;
    joystickEl.style.setProperty("--knob-x", "0px");
    joystickEl.style.setProperty("--knob-y", "0px");
  }
  function onPointerDown(e) {
    activePointerId = e.pointerId;
    joystickEl.setPointerCapture(e.pointerId);
    joystickEl.classList.add("is-active");
    setStickFromEvent(e);
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (e.pointerId !== activePointerId) return;
    setStickFromEvent(e);
    e.preventDefault();
  }
  function onPointerUp(e) {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    joystickEl.classList.remove("is-active");
    resetStick();
  }
  if (joystickEl) {
    joystickEl.addEventListener("pointerdown", onPointerDown);
    joystickEl.addEventListener("pointermove", onPointerMove);
    joystickEl.addEventListener("pointerup", onPointerUp);
    joystickEl.addEventListener("pointercancel", onPointerUp);
  }

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
    let speedScale = 1;
    if (held.w || held.arrowup) dy -= 1;
    if (held.s || held.arrowdown) dy += 1;
    if (held.a || held.arrowleft) dx -= 1;
    if (held.d || held.arrowright) dx += 1;
    // Only fall back to the joystick when no key is held, so a keyboard
    // and a touch input can't fight over the same frame — same
    // first-match-wins spirit as checkArrivals' target list below.
    if (!dx && !dy && (stick.x || stick.y)) {
      dx = stick.x;
      dy = stick.y;
      // A stick push is analog (partway to the edge should walk slower),
      // unlike a held key which is always "full speed in this direction" —
      // clamped to 1 so an over-dragged knob can't exceed normal speed.
      speedScale = clamp(Math.hypot(dx, dy), 0, 1);
    }
    if (dx || dy) {
      if (!wasMoving) {
        wasMoving = true;
        hideHint();
      }
      const len = Math.hypot(dx, dy) || 1;
      const nx = x + (dx / len) * AVATAR_SPEED * speedScale;
      const ny = y + (dy / len) * AVATAR_SPEED * speedScale;
      if (isWalkable(nx, ny)) {
        x = nx;
        y = ny;
      } else if (isWalkable(nx, y)) {
        x = nx;
      } else if (isWalkable(x, ny)) {
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
    if (joystickEl) {
      joystickEl.removeEventListener("pointerdown", onPointerDown);
      joystickEl.removeEventListener("pointermove", onPointerMove);
      joystickEl.removeEventListener("pointerup", onPointerUp);
      joystickEl.removeEventListener("pointercancel", onPointerUp);
    }
  };
}

// Markup for the on-screen thumbstick itself — a fixed-position base plus
// a knob whose offset is driven entirely by the `--knob-x`/`--knob-y` CSS
// vars wireMovement's pointer handlers set above, so this file owns both
// halves of the touch control instead of splitting it across callers.
export function joystickHTML(id) {
  return `
    <div class="hub-joystick" id="${id}" aria-hidden="true">
      <div class="hub-joystick-knob"></div>
    </div>
  `;
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

// A curved-ribbon alternative to a landmass radiating out from a shared
// CENTER (computeZoneLayout below, and renderWorldSvg's own default
// `regionShapes` blended ellipses) — one long, sweeping island following
// an S-curve spine, with zones as clean bands along its length instead
// of wedges or blobs around a point. Built for Wordwood Isle and
// Athenaeum Reef; Numeria Peaks/Lab Archipelago stay on their own
// bespoke per-file archipelago rendering (separate islands, not one
// shared landmass to bend into a curve at all).
//
// `computeCurveLayout` replaces computeZoneLayout as the *positions*
// half; `renderRibbonIsland` replaces the default `regionShapes` (pass
// alongside `landmass: () => ""`, same reasoning as any custom
// regionShapes override — this function draws its own shoreline as part
// of the same ribbon outline the zone bands are cut from). Both take the
// *same* `controlPoints` (a cubic Bezier's 4 points) and independently
// derive the identical per-zone t-range from just `zones.length` — an
// equal fifth (or quarter) of the curve's length each, deliberately not
// weighted by skill count, so the two never need to coordinate a shared
// boundary through any other channel.
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 3.7) * 43758.5453;
  return x - Math.floor(x);
}

// Raw (x, y) at parameter t (0..1) along a cubic Bezier through `cps`
// (4 {x,y} control points) — one concrete curve shape callers can pass
// to sampleParametricCurve/computeCurveLayout/renderRibbonIsland below;
// islandHub.js's own spiral is another, unrelated shape using the exact
// same downstream machinery.
export function bezierCurveFn(cps) {
  const [p0, p1, p2, p3] = cps;
  return (t) => {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    };
  };
}

// Samples any parametric curve `curveFn(t) => {x,y}` at n+1 evenly
// spaced *parameter* steps, but also walks the result to attach each
// sample's own cumulative arc length so far as `sNorm` (0..1, fraction
// of the curve's total length) — a cubic Bezier's (or a spiral's) own
// parameter isn't evenly spaced in actual on-screen distance, so reading
// zone/marker positions off raw t alone bunches nodes together wherever
// the curve happens to move fastest and stretches them apart wherever it
// moves slowest. `angle` (the tangent direction) comes from a tiny
// central-difference step rather than an analytic derivative, so this
// works unchanged for *any* curveFn, not just ones whose derivative was
// hand-coded.
const TANGENT_EPS = 1e-4;
export function sampleParametricCurve(curveFn, n = 400) {
  const raw = [];
  let cum = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curveFn(t);
    const pBack = curveFn(Math.max(0, t - TANGENT_EPS));
    const pFwd = curveFn(Math.min(1, t + TANGENT_EPS));
    const angle = Math.atan2(pFwd.y - pBack.y, pFwd.x - pBack.x);
    if (i > 0) cum += Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y);
    raw.push({ x: p.x, y: p.y, angle, s: cum });
  }
  const total = cum || 1;
  return raw.map((p) => ({ ...p, sNorm: p.s / total }));
}

// Binary-searches a sampleParametricCurve result (sorted by `sNorm`,
// ascending) for the sample closest to a given *arc-length* fraction —
// this is what actually turns "zone 2 of 4" into "the point a real
// quarter of the way along the curve," not just "t = 0.5."
function curveIndexAtArcFraction(curve, sFrac) {
  let lo = 0;
  let hi = curve.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (curve[mid].sNorm < sFrac) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Candidate perpendicular offsets a marker can sit at, evenly spaced
// across the ribbon's width. computeCurveLayout picks *which* one each
// marker actually uses via a greedy per-zone search rather than a fixed
// cycle — see that function's own comment for why a fixed cycle isn't
// enough on a curving spine.
const LANE_OFFSETS = Array.from({ length: 7 }, (_, i) => -230 + i * (460 / 6));
// A marker must clear this distance from every earlier marker already
// placed in the same zone (comfortably above 2×any hub's own skill
// trigger radius, so two markers can never overlap) …
const MIN_MARKER_DIST = 100;
// … and among the lanes that clear it, computeCurveLayout prefers
// whichever keeps the gap to the *immediately previous* marker close to
// this value, so consecutive gaps along a zone's own path stay even
// instead of swinging between cramped and sparse.
const TARGET_MARKER_DIST = 140;
// Tie-break weight nudging the choice toward whichever safe lane is
// furthest from this zone's own average lane used so far — without this
// the search settles on just the one or two lanes that are always safe
// (usually the outermost) and never touches the rest of the ribbon's
// width; this term is what makes the path actually sweep across it.
const LANE_DIVERSITY_WEIGHT = 0.4;

// A skill's position: evenly spaced (by actual arc length, not raw
// parameter — see sampleParametricCurve above) along its own zone's own
// share of the curve's length, with a small inset so markers near a zone
// boundary don't crowd it, then offset perpendicular to the spine by
// whichever of LANE_OFFSETS a greedy per-zone search picks (see that
// constant's own comment) — earlier this was a fixed 4-lane cycle, but a
// fixed cycle can't adapt: offsetting toward the curve's *inside* shrinks
// its *effective* radius of curvature by roughly the offset amount, so
// how much room a given lane leaves depends on exactly where along the
// spine it's used, not just which lane it is. Searching per-zone, in
// skill order, against the markers already placed in that same zone,
// makes "don't crowd" and "keep gaps even" the actual inputs instead of
// something to hope a formula produces.
//
// Each zone's own share of arc length is proportional to how many items
// it actually holds (`perZone`'s own last-zone remainder can leave one
// zone with noticeably fewer items than the rest) — a flat 1/n share
// regardless of count would pack a bigger zone's items tighter into the
// same length than a smaller zone's, same reasoning mathHub.js's own
// computeTerritories already sizes its columns by skill count rather
// than splitting the walkable width evenly.
export function computeCurveLayout(items, zones, curveFn) {
  const curve = sampleParametricCurve(curveFn, 800);
  const n = zones.length;
  const perZone = Math.ceil(items.length / n);
  const zoneCounts = zones.map((_, zi) => Math.max(0, Math.min(perZone, items.length - zi * perZone)));
  const boundaries = [0];
  zoneCounts.forEach((count) => boundaries.push(boundaries[boundaries.length - 1] + count / items.length));

  const results = new Array(items.length);
  zones.forEach((zone, zoneIndex) => {
    const itemsInZone = zoneCounts[zoneIndex];
    const sLo = boundaries[zoneIndex];
    const sHi = boundaries[zoneIndex + 1];
    const inset = (sHi - sLo) * 0.12;
    const innerLo = sLo + inset;
    const innerHi = sHi - inset;
    const placed = [];
    for (let indexInZone = 0; indexInZone < itemsInZone; indexInZone++) {
      const i = zoneIndex * perZone + indexInZone;
      const sFrac = itemsInZone > 1 ? innerLo + (indexInZone / (itemsInZone - 1)) * (innerHi - innerLo) : (innerLo + innerHi) / 2;
      const curveIdx = curveIndexAtArcFraction(curve, sFrac);
      const cp = curve[curveIdx];
      const perpX = -Math.sin(cp.angle);
      const perpY = Math.cos(cp.angle);
      const avgUsedSide = placed.length ? placed.reduce((s, p) => s + p.side, 0) / placed.length : 0;
      // Scales every candidate lane by how much the shore itself has
      // tapered at this exact point (renderRibbonIsland's own edgeTaper,
      // same function, same curve) — near either end of the spine the
      // rendered shore narrows toward a point, and a marker offset that
      // ignores that can end up past the *actual* rendered coastline even
      // though it's a perfectly ordinary lane everywhere else. Without
      // this, a marker can land in water no avatar can walk to once
      // isWalkable checks against the real rendered shore (see
      // islandHub.js's own buildShorelinePolygons-based isWalkable).
      const taper = edgeTaper(curveIdx / (curve.length - 1));

      let best = null;
      let bestScore = -Infinity;
      for (const rawSide of LANE_OFFSETS) {
        const side = rawSide * taper;
        const x = clamp(cp.x + perpX * side, WALK_MARGIN, WORLD_W - WALK_MARGIN);
        const y = clamp(cp.y + perpY * side, WALK_MARGIN, WORLD_H - WALK_MARGIN);
        const minDistToPlaced = placed.length ? Math.min(...placed.map((p) => Math.hypot(p.x - x, p.y - y))) : Infinity;
        if (minDistToPlaced < MIN_MARKER_DIST) continue;
        const distToPrev = placed.length ? Math.hypot(placed[placed.length - 1].x - x, placed[placed.length - 1].y - y) : TARGET_MARKER_DIST;
        const score = -Math.abs(distToPrev - TARGET_MARKER_DIST) + LANE_DIVERSITY_WEIGHT * Math.abs(side - avgUsedSide);
        if (score > bestScore) {
          bestScore = score;
          best = { x, y, side };
        }
      }
      if (!best) {
        // Every lane would crowd some earlier marker in this zone (only
        // possible on a very tight stretch) — fall back to whichever
        // lane maximizes the min distance to all of them, even if that
        // still falls short of MIN_MARKER_DIST.
        let fallbackScore = -Infinity;
        for (const rawSide of LANE_OFFSETS) {
          const side = rawSide * taper;
          const x = clamp(cp.x + perpX * side, WALK_MARGIN, WORLD_W - WALK_MARGIN);
          const y = clamp(cp.y + perpY * side, WALK_MARGIN, WORLD_H - WALK_MARGIN);
          const minDistToPlaced = Math.min(...placed.map((p) => Math.hypot(p.x - x, p.y - y)));
          if (minDistToPlaced > fallbackScore) {
            fallbackScore = minDistToPlaced;
            best = { x, y, side };
          }
        }
      }

      placed.push(best);
      results[i] = {
        item: items[i],
        zone,
        x: best.x,
        y: best.y,
        dockX: best.x + Math.cos(cp.angle) * 40,
        dockY: best.y + Math.sin(cp.angle) * 40,
      };
    }
  });
  return results;
}

// The curve's own point at a given *arc-length* fraction (0..1), for a
// caller that wants to place something on the spine itself (a center
// landmark, say) rather than on one of computeCurveLayout's own offset
// skill positions — consistent with computeCurveLayout's own use of
// arc-length fractions rather than raw parameter.
export function pointOnCurve(curveFn, sFrac) {
  const curve = sampleParametricCurve(curveFn, 800);
  return curve[curveIndexAtArcFraction(curve, sFrac)];
}

// A point on the ribbon's own edge (not the spine) at a given arc-length
// fraction — `side: 1` or `-1` picks which of the two edges, `width`
// should match whatever renderRibbonIsland was actually called with, so
// the point this returns sits exactly on that ribbon's real coastline.
// For a caller that wants to anchor something (a bridge, say) to
// wherever an island's own edge actually is, rather than guessing a
// world-coordinate by hand.
export function ribbonEdgePoint(curveFn, sFrac, width, side = 1) {
  const cp = pointOnCurve(curveFn, sFrac);
  const perpX = -Math.sin(cp.angle) * side;
  const perpY = Math.cos(cp.angle) * side;
  return { x: cp.x + perpX * width, y: cp.y + perpY * width, angle: cp.angle };
}

// A small plank-and-rail bridge between two points — two dark rails
// with evenly spaced cross-planks between them, distinct from both a
// shoreline's own sand and a trail's thin dashed line, since a bridge is
// a built structure crossing open space rather than either of those.
// `color` lets a caller reuse this for very different moods (a plain
// wooden bridge to an everyday landmark vs. the dark, ominous one to a
// boss) without duplicating the geometry.
export function renderPlankBridge(
  ax,
  ay,
  bx,
  by,
  { width = 34, color = "#8a6a48", railColor = "#5c4530", plankCount, railThickness = 5, plankThickness = 7 } = {}
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const half = width / 2;
  const rails = `
    <line x1="${(ax + px * half).toFixed(1)}" y1="${(ay + py * half).toFixed(1)}" x2="${(bx + px * half).toFixed(1)}" y2="${(by + py * half).toFixed(1)}" stroke="${railColor}" stroke-width="${railThickness}" stroke-linecap="round" />
    <line x1="${(ax - px * half).toFixed(1)}" y1="${(ay - py * half).toFixed(1)}" x2="${(bx - px * half).toFixed(1)}" y2="${(by - py * half).toFixed(1)}" stroke="${railColor}" stroke-width="${railThickness}" stroke-linecap="round" />
  `;
  const n = plankCount ?? Math.max(4, Math.round(len / 26));
  const planks = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const cx = ax + dx * t;
    const cy = ay + dy * t;
    return `<line x1="${(cx + px * half).toFixed(1)}" y1="${(cy + py * half).toFixed(1)}" x2="${(cx - px * half).toFixed(1)}" y2="${(cy - py * half).toFixed(1)}" stroke="${color}" stroke-width="${plankThickness}" stroke-linecap="round" />`;
  }).join("");
  return rails + planks;
}

function edgeTaper(t) {
  const EDGE = 0.07;
  if (t < EDGE) return t / EDGE;
  if (t > 1 - EDGE) return (1 - t) / EDGE;
  return 1;
}

export const RIBBON_SAND = "#ecdfb8";

// Standard even-odd point-in-polygon test — the shared primitive behind
// every hub's own "keep the avatar off the water" check (see
// buildShorelinePolygons below, and mathHub.js's own private copy of this
// exact function predating this shared one).
export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The avatar's own walkable region is exactly "on a rendered sand
// shore" — sampled straight off the live SVG's own sand-colored path(s)
// after they're already in the DOM, rather than recomputing the same
// seed/jitter/taper math a second time from scratch. Sampling the actual
// rendered path (not just its raw control points) means this can never
// drift out of sync with what's actually drawn — if the art changes, the
// walkable region changes with it automatically. Must run after the
// scene's own innerHTML is set (the paths have to exist in the DOM
// first). Any island shape works here, ribbon or otherwise, as long as
// its shoreline is drawn as one or more filled RIBBON_SAND paths — a
// hub with several separate islands (several sand paths) gets one
// walkable polygon per island for free, same as a hub with just one.
export function buildShorelinePolygons(root, sampleCount = 48) {
  const sandPaths = root.querySelectorAll(`.hub-scene-svg path[fill="${RIBBON_SAND}"]`);
  return Array.from(sandPaths).map((path) => {
    const len = path.getTotalLength();
    return Array.from({ length: sampleCount }, (_, i) => {
      const p = path.getPointAtLength((i / sampleCount) * len);
      return { x: p.x, y: p.y };
    });
  });
}

export function renderRibbonIsland(zoneGroups, curveFn, { seed = 1, baseWidth = 260, shoreRingWidth = 50 } = {}) {
  const curve = sampleParametricCurve(curveFn, 300);
  const total = curve.length;

  // Smooth, interpolated between a fixed number of anchors spread evenly
  // across the coastline's own *arc length* (`sNorm`, 0..1) rather than a
  // fresh random value per raw sample — this curve's own samples aren't
  // evenly spaced in arc length (see sampleParametricCurve's own doc
  // comment: a spiral's tightly-wound end packs many samples into a
  // short physical distance), so jittering by raw sample index gives
  // that tightly-wound stretch many more independent wiggles per pixel
  // than anywhere else on the coastline, reading as a dense, spiky
  // starburst instead of a coastline. Anchoring by arc length instead
  // means nearby samples in a densely-sampled stretch mostly interpolate
  // between the same two anchors — same noise "wavelength" in physical
  // terms everywhere along the coastline, tightly-wound or not.
  const JITTER_ANCHORS = 28;
  function anchoredJitter(sNorm, seedOffset) {
    const pos = sNorm * (JITTER_ANCHORS - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, JITTER_ANCHORS - 1);
    const v0 = pseudoRandom(seedOffset + i0);
    const v1 = pseudoRandom(seedOffset + i1);
    return v0 + (v1 - v0) * (pos - i0);
  }

  // Both boundary rings (outer sand shore, inner zone-color fill) trace
  // the same spine, offset perpendicular to its tangent by a width that
  // tapers to a point at both ends (a real peninsula narrows, it doesn't
  // get cut off square) and jitters organically along the way, same
  // "always a hand-drawn coastline, never a perfect stripe" spirit as
  // mathHub.js's/scienceHub.js's own organicIslandPoints.
  function ring(width) {
    const left = [];
    const right = [];
    curve.forEach((cp, i) => {
      const t = i / (total - 1);
      const jitter = 1 + (anchoredJitter(cp.sNorm, seed * 17) - 0.5) * 0.4;
      const w = Math.max(6, width * edgeTaper(t) * jitter);
      const perpX = -Math.sin(cp.angle);
      const perpY = Math.cos(cp.angle);
      left.push({ x: cp.x + perpX * w, y: cp.y + perpY * w });
      right.push({ x: cp.x - perpX * w, y: cp.y - perpY * w });
    });
    return { left, right };
  }

  function smoothOpenPath(pts) {
    const mid = pts.map((a, j) => (j === pts.length - 1 ? "" : ` Q${a.x.toFixed(1)},${a.y.toFixed(1)} ${((a.x + pts[j + 1].x) / 2).toFixed(1)},${((a.y + pts[j + 1].y) / 2).toFixed(1)}`));
    return `L${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}${mid.join("")}`;
  }

  const outer = ring(baseWidth);
  const shoreD = `M${outer.left[0].x.toFixed(1)},${outer.left[0].y.toFixed(1)} ${smoothOpenPath(outer.left.slice(1))} ${smoothOpenPath([...outer.right].reverse())} Z`;
  const shore = `<path d="${shoreD}" fill="${RIBBON_SAND}" />`;

  const inner = ring(Math.max(20, baseWidth - shoreRingWidth));
  // Band boundaries proportional to each zone's own point count — must
  // match computeCurveLayout's own boundaries exactly (same formula, off
  // the same zoneGroups.points.length), or a band's painted color would
  // end at a different spot than that zone's own markers actually stop.
  const totalPoints = zoneGroups.reduce((sum, g) => sum + g.points.length, 0) || 1;
  const boundaries = [0];
  zoneGroups.forEach((g) => boundaries.push(boundaries[boundaries.length - 1] + g.points.length / totalPoints));
  const bands = zoneGroups
    .map(({ zone }, i) => {
      const loIdx = curveIndexAtArcFraction(curve, boundaries[i]);
      const hiIdx = curveIndexAtArcFraction(curve, boundaries[i + 1]);
      const leftArc = inner.left.slice(loIdx, hiIdx + 1);
      const rightArc = inner.right.slice(loIdx, hiIdx + 1);
      if (leftArc.length < 2) return "";
      const d = `M${leftArc[0].x.toFixed(1)},${leftArc[0].y.toFixed(1)} ${smoothOpenPath(leftArc.slice(1))} ${smoothOpenPath([...rightArc].reverse())} Z`;
      return `<path d="${d}" fill="${zone.fill}" />`;
    })
    .join("");

  return shore + bands;
}

// Pass as `trails` alongside renderRibbonIsland — a curve layout's nodes
// sit near the spine, not radiating from CENTER, so renderWorldSvg's own
// default trail (a straight dashed line from CENTER to every node) would
// zigzag across the whole ribbon instead of following it. Connects each
// zone's own nodes in placement order instead, same idea as mathHub.js's
// own renderMathTrails.
export function renderCurveTrails(zoneGroups) {
  return zoneGroups
    .map(({ points }) => {
      if (points.length < 2) return "";
      const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return `<path d="${d}" stroke="#5c4a3a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />`;
    })
    .join("");
}

// A structurally different shape from a ribbon's single spine: one zone
// per rounded lobe, the lobes arranged around a shared ring so each
// overlaps its two neighbors enough to read as one fused landmass — a
// cluster of petals/islets grown together, not a coastline you could
// walk the length of. Built for Athenaeum Reef, deliberately unrelated
// to Wordwood Isle's spiral ribbon (see islandHub.js) beyond both
// replacing renderWorldSvg's own default blended-ellipse regionShapes.
//
// computeLobeLayout is the *positions* half (pass `ringCenter`/
// `ringRadius`/`lobeRadius` identical to whatever renderLobeIsland below
// gets, so a zone's own markers land inside the same lobe its color
// actually occupies); renderLobeIsland is the *art* half (pass as
// `regionShapes`, alongside `landmass: () => ""` — same reasoning as
// renderRibbonIsland's own doc comment).
export function computeLobeLayout(items, zones, { ringCenter, ringRadius, lobeRadius }) {
  const n = zones.length;
  const perZone = Math.ceil(items.length / n);
  return items.map((item, i) => {
    const zoneIndex = Math.min(Math.floor(i / perZone), n - 1);
    const zone = zones[zoneIndex];
    const indexInZone = i - zoneIndex * perZone;
    const itemsInZone = Math.min(perZone, items.length - zoneIndex * perZone);
    const angle = (zoneIndex / n) * Math.PI * 2 - Math.PI / 2;
    const lobeCx = ringCenter.x + Math.cos(angle) * ringRadius;
    const lobeCy = ringCenter.y + Math.sin(angle) * ringRadius;
    // Markers spread along a short chord across the lobe (perpendicular
    // to its own outward-facing direction), nudged outward a little —
    // same "perpendicular offset from a reference direction" idea
    // computeCurveLayout's own `side` uses, just measured across a lobe
    // instead of along a spine.
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const spread = itemsInZone > 1 ? (indexInZone / (itemsInZone - 1) - 0.5) * 2 : 0;
    const along = spread * (lobeRadius * 0.42);
    const outward = lobeRadius * 0.12 + (indexInZone % 2) * lobeRadius * 0.16;
    const x = clamp(lobeCx + perpX * along + Math.cos(angle) * outward, WALK_MARGIN, WORLD_W - WALK_MARGIN);
    const y = clamp(lobeCy + perpY * along + Math.sin(angle) * outward, WALK_MARGIN, WORLD_H - WALK_MARGIN);
    return { item, zone, x, y, dockX: lobeCx, dockY: lobeCy };
  });
}

// The point on the shared ring a landmark (or anything else) should sit
// at for a given fractional position `at` (0..1 around the ring) — e.g.
// `at: 0` lands exactly on zone 0's own lobe center.
export function pointOnLobeRing(at, { ringCenter, ringRadius }) {
  const angle = at * Math.PI * 2 - Math.PI / 2;
  return { x: ringCenter.x + Math.cos(angle) * ringRadius, y: ringCenter.y + Math.sin(angle) * ringRadius };
}

// An organic ring of points around `center` at roughly `radius`, jittered
// per-point by a seeded amount within `jitterRange` (a fraction of
// radius) — the building block behind renderLobeIsland's own fused
// lobes, exported too for any caller that wants a plain small organic
// islet on its own (see islandHub.js's own Vocabulary Builder islet).
export function organicRingPoints(center, radius, seed, n, jitterRange = [-0.25, 0.25]) {
  const [lo, hi] = jitterRange;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const jitter = 1 + lo + pseudoRandom(seed * 31 + i) * (hi - lo);
    const r = radius * jitter;
    return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r };
  });
}

export function renderLobeIsland(zoneGroups, { ringCenter, ringRadius, lobeRadius = 340, seed = 1 } = {}) {
  const n = zoneGroups.length;
  // One shared sand base wide enough to fully cover every lobe's own
  // outward reach at every angle — jitter here is one-sided (never
  // shrinks below the base radius) specifically so it can't dip inside
  // a lobe's own bulge and leave a gap of open background showing
  // through between two overlapping lobes.
  const baseRadius = ringRadius + lobeRadius + 60;
  const underPts = organicRingPoints(ringCenter, baseRadius, seed, 90, [0, 0.12]);
  const shore = `<path d="${closedBlobPath(underPts)}" fill="${RIBBON_SAND}" />`;

  const lobes = zoneGroups
    .map(({ zone }, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const cx = ringCenter.x + Math.cos(angle) * ringRadius;
      const cy = ringCenter.y + Math.sin(angle) * ringRadius;
      const pts = organicRingPoints({ x: cx, y: cy }, lobeRadius - 40, seed + i * 7 + 3, 44);
      return `<path d="${closedBlobPath(pts)}" fill="${zone.fill}" />`;
    })
    .join("");

  return shore + lobes;
}
