// Athenaeum Reef's own theme for Voice & Method, Sunken Archive's
// second skill (see lessonTerrain.js for the shared engine every
// lesson-path theme renders through, and mosaicRuins.js for this zone's
// own first theme). The skill splits cleanly into two things to
// analyze — an author's voice and their method — so the scene keeps
// them visually separate the whole way down: a brass speaking trumpet
// (voice, with real sound-wave rings) recurring on one side of the
// trail, real navigation tools (method: a compass, a spyglass, a
// logbook) recurring on the other.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const BRASS = "#c9974f";
const BRASS_DARK = "#8a672f";

function renderTrumpet(x, y) {
  return `
    <path d="M${x - 4},${y} L${x + 4},${y} L${x + 22},${y - 34} L${x + 6},${y - 34} Z" fill="${BRASS}" stroke="${BRASS_DARK}" stroke-width="2" />
    <ellipse cx="${x + 22}" cy="${y - 34}" rx="4" ry="9" fill="${BRASS_DARK}" />
    <path d="M${x + 30},${y - 40} Q${x + 42},${y - 40} ${x + 48},${y - 48}" stroke="#eafcff" stroke-width="2" fill="none" opacity="0.7" />
    <path d="M${x + 30},${y - 32} Q${x + 46},${y - 30} ${x + 54},${y - 34}" stroke="#eafcff" stroke-width="2" fill="none" opacity="0.5" />
  `;
}

// The three real tools methodically alternate, never the same one twice
// in a row, echoing "method" the same way the trumpet's own sound waves
// echo "voice."
const METHOD_TOOLS = ["🧭", "🔭", "📖"];
function renderTool(x, y, tool) {
  return `<text x="${x}" y="${y}" font-size="24" text-anchor="middle">${tool}</text>`;
}

function renderProps(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .map((p, i) => {
      const voiceSide = i % 2 === 0 ? 1 : -1;
      const voiceX = clamp(mid + voiceSide * 100, 40, COL_W - 40);
      const methodX = clamp(mid - voiceSide * 100, 40, COL_W - 40);
      return renderTrumpet(voiceX, p.y) + renderTool(methodX, p.y, METHOD_TOOLS[i % METHOD_TOOLS.length]);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#6fb8c9" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Sunken Archive: a brass speaking trumpet with sound-wave rings on one side of the trail and real navigation tools -- a compass, a spyglass, a logbook -- on the other, connecting every Voice and Method lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#4f818a" />
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#e8d9b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
      <g>${renderProps(positions)}</g>
    </svg>
  `;
}

export const captainsQuartersTheme = {
  trailBand: BAND,
  mapBg: "#4f818a",
  hintColor: "rgba(15, 30, 30, 0.75)",
  renderScene,
};
