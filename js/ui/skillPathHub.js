// Idiom Instinct's own lesson path — a small, zoomed-in illustration of
// just a corner of Wordwood Isle's own terrain (a couple of grassy
// hills, a strip of coastline) rather than the whole island: one winding
// trail curving around those features connects every lesson in order,
// ending at a little clearing for the skill's own "champion" (its boss
// lesson — always the last one, see isBossLessonIndex in
// data/questions/index.js). Replaces skillPath.js's usual straight-
// zigzag list for this one skill only; every other skill's lesson path
// still renders that original list unchanged — see skillPath.js's own
// dispatch near the top of renderSkillPath(). Plain click-to-navigate,
// no WASD/camera — this scene is meant to read as a small, contained
// close-up, not another big walkable world.
import { gameState } from "../state.js";
import { hudHTML, wireHud } from "./hud.js";
import { monsterSVG } from "./monster.js";
import { getSkillBossName } from "../data/skills.js";
import { getSkill } from "../data/tests.js";
import { getLessonCount } from "../data/questions/index.js";
import { LESSONS } from "../data/lessons.js";
import { glowVars } from "./pathTrail.js";
import { getSubjectTheme } from "./subjectTheme.js";

const COL_W = 680;
const ROW_H = 140;
const TOP_MARGIN = 70;
const BOTTOM_MARGIN = 100;

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// One continuous wandering trail rather than four separate zone trails —
// a slow sine wave (the wide swings a path takes around a hill) plus a
// touch of faster wobble (so it never reads as a mechanical zigzag), in
// design pixels. Flatter stretches near each wave's peak are where the
// trail "hugs the coastline" instead of cutting straight across.
function computeTrail(count) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const wander = 0.34 * Math.sin(i * 0.85) + 0.09 * Math.sin(i * 2.3 + 1.4);
    const x = clamp(COL_W * (0.5 + wander), COL_W * 0.16, COL_W * 0.84);
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

// A couple of soft hill mounds, each placed on the opposite side of the
// canvas from wherever the trail happens to be at that height — so the
// trail always reads as skirting around the near edge of one, rather
// than the two overlapping by coincidence.
function computeHills(positions, totalHeight) {
  return [0.22, 0.52, 0.8].map((f, i) => {
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
    const side = nearest.x < COL_W / 2 ? 1 : -1;
    const hx = COL_W / 2 + side * COL_W * 0.32;
    return { x: hx, y: hy, r: 130 + (i % 2) * 24 };
  });
}

// A handful of idiom/language-themed details (books, a scroll, a quill,
// an owl) rather than generic nature scenery — "the features of the
// area" relating to this specific skill, Idiom Instinct, not just any
// island terrain. Sits near every third or so stop, offset to whichever
// side the trail isn't using right there.
const DECOR_EMOJI = ["📖", "🔖", "🖋️", "📜", "🦉", "🔍"];
function renderDecorations(positions) {
  return positions
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => {
      const side = p.x < COL_W / 2 ? 1 : -1;
      const dx = clamp(p.x + side * 78, 30, COL_W - 30);
      const dy = p.y - 14;
      return `<text x="${dx}" y="${dy}" font-size="30" text-anchor="middle">${DECOR_EMOJI[i % DECOR_EMOJI.length]}</text>`;
    })
    .join("");
}

function renderTerrainSvg(positions, totalHeight, bossName) {
  const hills = computeHills(positions, totalHeight)
    .map(
      ({ x, y, r }) => `
        <ellipse cx="${x}" cy="${y + 18}" rx="${r}" ry="${r * 0.58}" fill="rgba(20,45,30,0.14)" />
        <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#9fbf78" />
        <ellipse cx="${x - r * 0.25}" cy="${y - r * 0.12}" rx="${r * 0.55}" ry="${r * 0.32}" fill="#b3d18c" opacity="0.7" />
      `
    )
    .join("");

  // A wavy strip of water hugging the left edge — width oscillates down
  // the page so its border reads as a real, irregular shoreline rather
  // than a straight-edged panel. Enough steps (scaled to the page's own
  // height, not a fixed count) and two overlapping sine frequencies so
  // the curve keeps visibly bending throughout — a single slow sine
  // sampled too coarsely flattens out for long stretches near its own
  // peaks and troughs, which is exactly what read as "a straight line."
  const steps = Math.max(24, Math.round(totalHeight / 70));
  const shoreline = Array.from({ length: steps + 1 }, (_, i) => {
    const y = (totalHeight / steps) * i;
    const w = 70 + 26 * Math.sin(i * 0.55) + 14 * Math.sin(i * 1.3 + 0.6);
    return `${w},${y}`;
  }).join(" L");

  const bossClearing = `<circle cx="${positions[positions.length - 1].x}" cy="${positions[positions.length - 1].y}" r="86" fill="#efe4cf" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Wordwood Isle: grassy hills and a strip of coastline, with a winding trail connecting every Idiom Instinct lesson up to ${bossName}'s own clearing">
      <rect x="-120" y="-60" width="${COL_W + 240}" height="${totalHeight + 120}" fill="#e3c98f" />
      <path d="M0,0 L${shoreline} L0,${totalHeight} Z" fill="#7fa8b8" opacity="0.6" />
      <g>${hills}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${renderDecorations(positions)}</g>
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

export function renderIdiomHub(root, navigate, { skillId, subjectId }) {
  const { subject, skill } = getSkill(skillId);
  const totalLessons = getLessonCount(skillId);
  const bossIndex = totalLessons - 1;
  const bossName = getSkillBossName(skill.name);
  const paragraphs = LESSONS[skillId] || [];
  const progress = gameState.getSkillProgress(skillId);

  const positions = computeTrail(totalLessons);
  const totalHeight = totalHeightFor(totalLessons);
  const theme = getSubjectTheme(subjectId);

  const nodesHTML = positions
    .slice(0, bossIndex)
    .map((p, i) => renderLessonMarker(p, i, totalHeight, skillId, subject))
    .join("");
  const bossHTML = renderBossLessonMarker(positions[bossIndex], totalHeight, skillId, bossIndex, bossName);

  root.innerHTML = `
    ${hudHTML("map")}
    <main class="screen skillpath-screen topic-${theme.kind}" style="--island-color:${subject.color};--island-bg:${subject.bg};${glowVars(subject.color)}">
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
      <div class="lesson-map-area">
        <p class="skillpath-hint lesson-map-hint">${progress.mastered ? "🏅 Skill mastered! Revisit any lesson to practice." : "Clear each lesson to unlock the next."}</p>
        <div class="lesson-terrain-scene" style="aspect-ratio:${COL_W}/${totalHeight}">
          ${renderTerrainSvg(positions, totalHeight, bossName)}
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
