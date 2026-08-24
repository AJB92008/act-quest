// Shared engine behind every skill that gets its own zoomed-in lesson
// path (first built for English's Idiom Instinct, reused as-is for
// Phrase Finder) — a small, contained illustration of just a corner of
// Wordwood Isle's own terrain: a river confined to its own band on one
// side (both banks wavy, never touching the canvas edges), a winding
// trail through the other band connecting every lesson in order,
// hills the trail skirts around, and a little clearing at the end for
// the skill's own "champion" (its boss lesson). Everything here is
// generic over *how it looks* — every color and decoration comes from a
// theme object (see skillPathHub.js's LESSON_THEMES) — but the layout
// itself (band widths, spacing, trail wander shape) stays identical
// across skills so they all read as the same kind of place.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getSkillBossName } from "../data/skills.js";
import { getSkill } from "../data/tests.js";
import { getLessonCount } from "../data/questions/index.js";
import { LESSONS } from "../data/lessons.js";
import { glowVars } from "./pathTrail.js";
import { getSubjectTheme } from "./subjectTheme.js";

export const COL_W = 680;
const ROW_H = 140;
const TOP_MARGIN = 70;
const BOTTOM_MARGIN = 100;

// The river lives entirely inside this band; the trail/hills/lessons
// live entirely inside the other, so the two never fight for the same
// ground and the river never needs to reach a canvas edge to "go
// somewhere" — it just winds within its own strip of the picture.
const RIVER_BAND = { min: 30, max: 210 };
const LAND_BAND = { min: 260, max: COL_W - 40 };

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// A smooth curve through a column of {x,y} points (quadratic beziers
// meeting at each midpoint) — hand-drawn-looking rather than faceted
// straight segments. Returns just the segment commands, no leading "M",
// so callers can stitch several edges into one closed shape.
function edgeSegments(points) {
  return points
    .slice(0, -1)
    .map((a, i) => {
      const b = points[i + 1];
      const midY = (a.y + b.y) / 2;
      return `Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY}`;
    })
    .join(" ");
}

// A closed band between two columns of same-height points: down the
// right edge, across the bottom, back up the left edge (reversed), and
// closed straight across the top.
function bandPath(leftPts, rightPts) {
  const top = rightPts[0];
  const bottomLeft = leftPts[leftPts.length - 1];
  return `M${top.x},${top.y} ${edgeSegments(rightPts)} L${bottomLeft.x},${bottomLeft.y} ${edgeSegments([...leftPts].reverse())} Z`;
}

// One continuous wandering trail (not four separate zone trails) through
// the land band only — a slow sine wave (the wide swings a path takes
// around a hill) plus a touch of faster wobble so it never reads as a
// mechanical zigzag.
function computeTrail(count) {
  const mid = (LAND_BAND.min + LAND_BAND.max) / 2;
  const amp = (LAND_BAND.max - LAND_BAND.min) / 2;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const wander = 0.78 * Math.sin(i * 0.85) + 0.22 * Math.sin(i * 2.3 + 1.4);
    const x = clamp(mid + amp * wander, LAND_BAND.min, LAND_BAND.max);
    const y = TOP_MARGIN + i * ROW_H;
    positions.push({ x, y });
  }
  return positions;
}

function totalHeightFor(count) {
  return TOP_MARGIN + (count - 1) * ROW_H + BOTTOM_MARGIN;
}

// A smooth curve through every waypoint (quadratic beziers meeting at
// each midpoint) rather than plain straight segments — same technique
// pathTrail.js's renderPathSvg uses, just in real design-px here instead
// of that helper's 0-100/preserveAspectRatio:none coordinate system,
// which would otherwise squash the terrain shapes drawn alongside it.
function renderTrailPath(positions) {
  return positions
    .slice(0, -1)
    .map((a, i) => {
      const b = positions[i + 1];
      const midY = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY} Q ${b.x} ${midY} ${b.x} ${b.y}`;
    })
    .join(" ");
}

// A self-contained wavy ribbon of water, confined to RIVER_BAND — both
// banks bulge in and out down the whole page, at a large enough
// amplitude relative to the band's own width that it reads unmistakably
// as a winding river rather than a straight-edged panel, and the ribbon
// never touches the canvas's left edge (so there's always dry ground
// visible on both sides of it, not a hard cut at the frame boundary).
function computeRiver(totalHeight) {
  const steps = Math.max(20, Math.round(totalHeight / 110));
  const mid = (RIVER_BAND.min + RIVER_BAND.max) / 2;
  const swing = (RIVER_BAND.max - RIVER_BAND.min) / 2 - 34;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const center = mid + swing * Math.sin(i * 0.5 + 0.4) + swing * 0.45 * Math.sin(i * 1.3 + 2.0);
    const halfWidth = 32 + 14 * Math.sin(i * 0.85 + 1.1);
    return {
      y,
      left: clamp(center - halfWidth, RIVER_BAND.min, RIVER_BAND.max),
      right: clamp(center + halfWidth, RIVER_BAND.min, RIVER_BAND.max),
    };
  });
}

function renderRiver(totalHeight) {
  const banks = computeRiver(totalHeight);
  const leftPts = banks.map((b) => ({ x: b.left, y: b.y }));
  const rightPts = banks.map((b) => ({ x: b.right, y: b.y }));
  return bandPath(leftPts, rightPts);
}

// A couple of soft hill mounds within the land band, each placed on the
// opposite side of the trail from wherever the trail happens to be at
// that height — so the trail always reads as skirting around the near
// edge of one, rather than the two overlapping by coincidence.
function computeHills(positions, totalHeight) {
  const mid = (LAND_BAND.min + LAND_BAND.max) / 2;
  return [0.2, 0.48, 0.76].map((f, i) => {
    const hy = f * totalHeight;
    let nearest = positions[0];
    let bestDist = Infinity;
    for (const p of positions) {
      const d = Math.abs(p.y - hy);
      if (d < bestDist) {
        bestDist = d;
        nearest = p;
      }
    }
    const side = nearest.x < mid ? 1 : -1;
    const hx = clamp(mid + side * (LAND_BAND.max - LAND_BAND.min) * 0.32, LAND_BAND.min + 55, LAND_BAND.max - 15);
    return { x: hx, y: hy, r: 90 + (i % 2) * 18 };
  });
}

// Skill-word-related details (Idiom Instinct's books/quills/scrolls,
// Phrase Finder's jungle fauna) sit right at the lesson stops. A looser
// ambient texture (Idiom Instinct's wheat, Phrase Finder's leaves)
// scatters independent of the stops, just to give the ground itself some
// life. Both take their emoji list from the theme.
function renderDecorations(positions, emoji) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < (LAND_BAND.min + LAND_BAND.max) / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 70, LAND_BAND.min + 20, LAND_BAND.max - 5);
      const dy = p.y - 14;
      return `<text x="${dx}" y="${dy}" font-size="30" text-anchor="middle">${emoji[i % emoji.length]}</text>`;
    })
    .join("");
}

function renderAmbientTexture(totalHeight, emoji) {
  const count = Math.max(6, Math.round(totalHeight / 260));
  return Array.from({ length: count }, (_, i) => {
    const y = 60 + ((totalHeight - 100) / (count - 1 || 1)) * i;
    const x = clamp(LAND_BAND.min + 25 + ((i * 73) % (LAND_BAND.max - LAND_BAND.min - 50)), LAND_BAND.min + 10, LAND_BAND.max - 10);
    return `<text x="${x}" y="${y}" font-size="22" opacity="0.8" text-anchor="middle">${emoji[i % emoji.length]}</text>`;
  }).join("");
}

function renderTerrainSvg(positions, totalHeight, bossName, theme) {
  const hills = computeHills(positions, totalHeight)
    .map(
      ({ x, y, r }) => `
        <ellipse cx="${x}" cy="${y + 16}" rx="${r}" ry="${r * 0.58}" fill="${theme.hillShadow}" />
        <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="${theme.hillMain}" />
        <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.12}" rx="${r * 0.55}" ry="${r * 0.32}" fill="${theme.hillHighlight}" opacity="0.75" />
      `
    )
    .join("");

  const bossClearing = `<circle cx="${positions[positions.length - 1].x}" cy="${positions[positions.length - 1].y}" r="86" fill="${theme.bossClearingFill}" stroke="${theme.bossClearingStroke}" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: ${theme.terrainDescription} with a winding river down one side, hills, and a trail connecting every ${theme.skillLabel} lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${theme.ground}" />
      <g>${renderAmbientTexture(totalHeight, theme.ambientEmoji)}</g>
      <path d="${renderRiver(totalHeight)}" fill="${theme.riverColor}" opacity="${theme.riverOpacity}" />
      <g>${hills}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="${theme.trailColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions, theme.decorEmoji)}</g>
    </svg>
  `;
}

function renderLessonMarker({ x, y }, index, totalHeight, skillId, subject) {
  const progress = gameState.getSkillProgress(skillId);
  const unlocked = gameState.isLessonUnlocked(skillId, index);
  const done = index < progress.lessonsCompleted;
  const stateClass = done ? "is-mastered" : unlocked ? "is-open" : "is-locked";
  const badge = done ? "✓" : unlocked ? String(index + 1) : "🔒";
  return `
    <div class="hub-marker-wrap" style="left:${(x / COL_W) * 100}%;top:${(y / totalHeight) * 100}%;">
      <button class="hub-skill-marker node-circle node-circle-small ${stateClass}" data-lesson="${index}" ${unlocked ? "" : "disabled"}
        style="--node-color:${subject.color}"
        aria-label="Lesson ${index + 1}${done ? ", complete" : unlocked ? "" : ", locked"}">
        ${badge}
      </button>
      <span class="hub-skill-name">Lesson ${index + 1}</span>
    </div>
  `;
}

function renderBossLessonMarker({ x, y }, totalHeight, skillId, bossIndex, bossName) {
  const progress = gameState.getSkillProgress(skillId);
  const unlocked = gameState.isLessonUnlocked(skillId, bossIndex);
  const done = bossIndex < progress.lessonsCompleted;
  const stateClass = done ? "is-cleared" : unlocked ? "is-unlocked" : "is-locked";
  const locked = stateClass === "is-locked";
  return `
    <div class="hub-marker-wrap" style="left:${(x / COL_W) * 100}%;top:${(y / totalHeight) * 100}%;">
      <button class="hub-boss-marker ${stateClass}" data-lesson="${bossIndex}" ${locked ? "disabled" : ""}
        aria-label="${bossName}${done ? " (cleared)" : locked ? ": locked until every earlier lesson is complete" : ""}">
        <span class="hub-boss-emoji">👑</span>
        ${done ? `<span class="hub-boss-crown">👑</span>` : locked ? `<span class="hub-boss-lock">🔒</span>` : ""}
      </button>
      <span class="hub-skill-name hub-boss-name">${locked ? "🔒 " : ""}${bossName}</span>
    </div>
  `;
}

// The full screen: lesson-card (title/blurb/paragraphs/timer toggle) on
// top, unchanged from skillPath.js's own generic version, followed by
// this skill's own zoomed-in terrain scene instead of skillPath.js's
// usual straight-zigzag winding list. Plain click-to-navigate, no WASD/
// camera — this scene is meant to read as a small, contained close-up,
// not another big walkable world.
export function renderLessonTerrainPath(root, navigate, { skillId, subjectId }, theme) {
  const { subject, skill } = getSkill(skillId);
  const totalLessons = getLessonCount(skillId);
  const bossIndex = totalLessons - 1;
  const bossName = getSkillBossName(skill.name);
  const paragraphs = LESSONS[skillId] || [];
  const progress = gameState.getSkillProgress(skillId);

  const positions = computeTrail(totalLessons);
  const totalHeight = totalHeightFor(totalLessons);
  const subjectTheme = getSubjectTheme(subjectId);

  const nodesHTML = positions
    .slice(0, bossIndex)
    .map((p, i) => renderLessonMarker(p, i, totalHeight, skillId, subject))
    .join("");
  const bossHTML = renderBossLessonMarker(positions[bossIndex], totalHeight, skillId, bossIndex, bossName);

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen skillpath-screen topic-${subjectTheme.kind}" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
      <button class="back-btn" data-back>&larr; Back to Island</button>
      <div class="lesson-card">
        <div class="lesson-monster">${monsterSVG(gameState.getDisplayAvatar(), { size: 98 })}</div>
        <h1 class="lesson-title">${skill.name}</h1>
        <p class="lesson-blurb">${skill.blurb}</p>
        ${paragraphs.map((p) => `<p class="lesson-paragraph">${p}</p>`).join("")}
        <div class="lesson-timer-setting">
          <label class="toggle-label">
            <input type="checkbox" id="timerToggle" ${gameState.timerEnabled ? "checked" : ""} />
            ⏱️ Timed questions
          </label>
          <p class="lesson-timer-hint">Turn off if you'd rather take your time on each question.</p>
        </div>
      </div>
      <div class="lesson-map-area" style="--lesson-map-bg:${theme.mapBg};--lesson-map-hint-color:${theme.hintColor}">
        <p class="skillpath-hint lesson-map-hint">${progress.mastered ? "🏅 Skill mastered! Revisit any lesson to practice." : "Clear each lesson to unlock the next."}</p>
        <div class="lesson-terrain-scene" style="aspect-ratio:${COL_W}/${totalHeight}">
          ${renderTerrainSvg(positions, totalHeight, bossName, { ...theme, skillLabel: skill.name })}
          ${nodesHTML}
          ${bossHTML}
        </div>
      </div>
    </main>
  `;

  wireHud(root, navigate);
  root.querySelector("[data-back]").addEventListener("click", () => navigate("island", { subjectId }));
  root.querySelector("#timerToggle").addEventListener("change", (e) => {
    gameState.setTimerEnabled(e.target.checked);
  });
  root.querySelectorAll("[data-lesson]:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => navigate("quiz", { skillId, subjectId, lessonIndex: Number(btn.dataset.lesson) }));
  });
}
