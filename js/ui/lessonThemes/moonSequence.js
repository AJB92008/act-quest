// Athenaeum Reef's own theme for Time Order, Tide Pool Terrace's first
// skill (see lessonTerrain.js for the shared engine every lesson-path
// theme renders through). Time Order is about following a passage's own
// sequence of events, so the scene leans on the one sequence everyone
// already knows by heart: the moon's real phases, in their real order —
// new, waxing crescent, first quarter, waxing gibbous, full, waning
// gibbous, last quarter, waning crescent — lit against a night sky over
// the reef. Not an arbitrary substitute motif either: tides (the whole
// reason this zone is tide *pools*) are caused by the moon in the first
// place. One moon every other lesson, sitting directly on the trail
// itself (beads on a string) rather than a moon at every single stop
// zigzagged to alternating sides — see renderMoons' own comment for why
// that first pass read as confusing rather than as a clean sequence.
//
// Replaces an earlier version of this theme (a chain of pools connected
// by spill-channels) that didn't work visually even after fixing a real
// rendering bug in it — a different concept entirely, not a patch.
import { COL_W, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const MOON_LIT = "#f3ecd6";
const MOON_DARK = "#1c2947";

// Ratio of (distance between two same-size circles' centers) to their
// shared radius, one entry per real lunar phase in real order. New
// moon's two circles don't overlap at all (nothing lit); full moon's
// sit exactly on top of each other (everything lit); the phases between
// step through it symmetrically on the way out and back. This is the
// classic "two overlapping circles, clipped to the disc" trick for a
// recognizable phase icon — not an astronomically exact terminator
// curve, but correct in the way that actually matters here: it steps
// through the real 8 phases in the real order. The gibbous/crescent
// ratios (indices 1,3,5,7) are spaced further from their neighbors than
// a straight linear/cosine progression would put them — at this icon's
// actual render size a "barely there" sliver (an earlier version used
// ±0.25 for the gibbous phases, a sliver under 7px wide on a 26px-radius
// moon) reads as indistinguishable from full/new rather than as its own
// distinct phase.
const PHASE_DX_RATIO = [2.05, 1.5, 0.95, 0.45, 0, -0.45, -0.95, -1.5];

// clipPath ids only need to be unique *within one render*, and every
// moon already has its own exact position — deriving the id from that
// (rather than a shared module-level counter) keeps this function pure,
// with nothing to reset between renders.
function renderMoon(cx, cy, r, phaseIndex) {
  const id = `moonClip-${Math.round(cx)}-${Math.round(cy)}`;
  const dx = PHASE_DX_RATIO[phaseIndex % PHASE_DX_RATIO.length] * r;
  return `
    <defs>
      <clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${MOON_DARK}" stroke="#0d1730" stroke-width="2" />
    <g clip-path="url(#${id})">
      <circle cx="${cx + dx}" cy="${cy}" r="${r}" fill="${MOON_LIT}" />
    </g>
  `;
}

// One moon every other lesson, not every single one — the first pass
// put a moon (each a different phase, zigzagged to alternating sides of
// the trail) at *every* lesson, which was two things changing on every
// single stop at once — position and appearance — with no rest between
// them, plus an awkward not-quite-second-cycle for any skill whose
// lesson count doesn't divide evenly into 8. Halving the count and
// sitting each moon directly on the trail itself (beads on a string,
// not a separate zigzag layered on top of it) leaves exactly one thing
// changing from stop to stop: the phase. The boss/champion stop (always
// the last position) is explicitly excluded regardless of parity —
// `i % 2 === 0` alone would put a moon there too whenever the lesson
// count happens to be an odd multiple of 5 (a 5, 15, or 25-lesson
// skill's boss sits at an even index), rendering right on top of the
// champion's own clearing.
function renderMoons(positions) {
  const bossIndex = positions.length - 1;
  return positions
    .filter((_, i) => i % 2 === 0 && i !== bossIndex)
    .map((p, i) => renderMoon(p.x, p.y, 30, i))
    .join("");
}

// A light, sparse scatter — enough to read as "night sky" without
// competing with the moons themselves for attention. Deterministic (no
// Math.random, same reasoning every other theme's ambient scatter uses).
function renderStars(totalHeight) {
  const count = Math.max(14, Math.round((totalHeight / COL_W) * 16));
  return Array.from({ length: count }, (_, i) => {
    const y = (i * 191) % totalHeight;
    const x = (i * 137) % COL_W;
    const r = 1 + (i % 2) * 0.5;
    const opacity = (0.3 + ((i * 13) % 40) / 100).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${MOON_LIT}" opacity="${opacity}" />`;
  }).join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#2a3d63" stroke="${MOON_LIT}" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Tide Pool Terrace at night: the moon shown at each of its 8 real phases in real order, one per stop, connecting every Time Order lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#0f1a33" />
      <g>${renderStars(totalHeight)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="${MOON_LIT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.7" />
      <g>${renderMoons(positions)}</g>
    </svg>
  `;
}

export const moonSequenceTheme = {
  trailBand: BAND,
  mapBg: "#0f1a33",
  hintColor: "rgba(243, 236, 214, 0.9)",
  renderScene,
};
