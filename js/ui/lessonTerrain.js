// Shared engine behind every skill that gets its own zoomed-in lesson
// path (first built for English's Idiom Instinct) — a small, contained
// illustration of just a corner of Wordwood Isle's own terrain: a
// winding trail connecting every lesson in order, ending at a little
// clearing for the skill's own "champion" (its boss lesson). What this
// file owns is genuinely generic across every skill — the trail's own
// wander shape, lesson/boss markers, and the screen's chrome/wiring.
// What the *terrain itself* looks like (river or none, hills or a dense
// jungle of trees, which decorations) is entirely up to each skill's own
// theme (see skillPathHub.js) — its `renderScene` builds the whole
// `<svg>`, using whichever of the geometry helpers below it needs, so two
// skills sharing this engine don't have to look like reskins of the same
// composition.
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

export function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// A smooth curve through a column of {x,y} points (quadratic beziers
// meeting at each midpoint) — hand-drawn-looking rather than faceted
// straight segments. Returns just the segment commands, no leading "M",
// so callers can stitch several edges into one closed shape (a river
// bank, a lake, whatever a theme's own renderScene needs).
export function edgeSegments(points) {
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
export function bandPath(leftPts, rightPts) {
  const top = rightPts[0];
  const bottomLeft = leftPts[leftPts.length - 1];
  return `M${top.x},${top.y} ${edgeSegments(rightPts)} L${bottomLeft.x},${bottomLeft.y} ${edgeSegments([...leftPts].reverse())} Z`;
}

// One continuous wandering trail through the given band — a slow sine
// wave (the wide swings a path takes around an obstacle) plus a touch of
// faster wobble so it never reads as a mechanical zigzag. `band` is
// entirely up to the theme: Idiom Instinct leaves room on one side for
// its river, Phrase Finder's jungle has no river and uses nearly the
// whole width.
export function computeTrail(count, band) {
  const mid = (band.min + band.max) / 2;
  const amp = (band.max - band.min) / 2;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const wander = 0.78 * Math.sin(i * 0.85) + 0.22 * Math.sin(i * 2.3 + 1.4);
    const x = clamp(mid + amp * wander, band.min, band.max);
    const y = TOP_MARGIN + i * ROW_H;
    positions.push({ x, y });
  }
  return positions;
}

export function totalHeightFor(count) {
  return TOP_MARGIN + (count - 1) * ROW_H + BOTTOM_MARGIN;
}

// A smooth curve through every waypoint (quadratic beziers meeting at
// each midpoint) rather than plain straight segments — same technique
// pathTrail.js's renderPathSvg uses, just in real design-px here instead
// of that helper's 0-100/preserveAspectRatio:none coordinate system,
// which would otherwise squash the terrain shapes drawn alongside it.
export function renderTrailPath(positions) {
  return positions
    .slice(0, -1)
    .map((a, i) => {
      const b = positions[i + 1];
      const midY = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY} Q ${b.x} ${midY} ${b.x} ${b.y}`;
    })
    .join(" ");
}

// Finds whichever waypoint is closest to a given height — the building
// block behind "place this feature on whichever side of the trail it
// isn't using right there" that both Idiom Instinct's hills and Phrase
// Finder's trees use.
export function nearestPosition(positions, y) {
  let nearest = positions[0];
  let bestDist = Infinity;
  for (const p of positions) {
    const d = Math.abs(p.y - y);
    if (d < bestDist) {
      bestDist = d;
      nearest = p;
    }
  }
  return nearest;
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
// not another big walkable world. `theme` supplies `trailBand`,
// `renderScene(positions, totalHeight, bossName)` (the complete `<svg>`),
// `mapBg`, and `hintColor`.
export function renderLessonTerrainPath(root, navigate, { skillId, subjectId }, theme) {
  const { subject, skill } = getSkill(skillId);
  const totalLessons = getLessonCount(skillId);
  const bossIndex = totalLessons - 1;
  const bossName = getSkillBossName(skill.name);
  const paragraphs = LESSONS[skillId] || [];
  const progress = gameState.getSkillProgress(skillId);

  const positions = computeTrail(totalLessons, theme.trailBand);
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
          ${theme.renderScene(positions, totalHeight, bossName)}
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
