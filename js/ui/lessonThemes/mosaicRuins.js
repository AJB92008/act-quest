// Athenaeum Reef's own theme for Big Conclusions, Sunken Archive's
// first skill (see lessonTerrain.js for the shared engine every
// lesson-path theme renders through). Big Conclusions is about drawing
// one reasonable generalization from a passage's own scattered details,
// so the scene is one large sunken urn, cracked into shards that have
// drifted apart down the trail — each shard rendered in the urn's own
// clay color and rim pattern, so even split apart they still visibly
// belong to one whole, the same way scattered details still add up to
// one real conclusion.
import { COL_W, clamp, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 100, max: COL_W - 100 };
const CLAY = "#c9987a";
const CLAY_DARK = "#a8735a";
const PATTERN = "#e8c9a0";

function renderUrn(x, y) {
  return `
    <path d="M${x - 60},${y - 10} Q${x - 70},${y + 70} ${x - 30},${y + 90} L${x + 30},${y + 90} Q${x + 70},${y + 70} ${x + 60},${y - 10} Q${x + 40},${y - 40} ${x + 20},${y - 40} L${x - 20},${y - 40} Q${x - 40},${y - 40} ${x - 60},${y - 10} Z" fill="${CLAY}" stroke="${CLAY_DARK}" stroke-width="4" />
    <ellipse cx="${x}" cy="${y + 10}" rx="52" ry="10" fill="none" stroke="${PATTERN}" stroke-width="4" opacity="0.85" />
    <ellipse cx="${x}" cy="${y + 42}" rx="58" ry="10" fill="none" stroke="${PATTERN}" stroke-width="4" opacity="0.85" />
  `;
}

// Every shard carries the same clay color and the same curved rim-motif
// stroke the urn itself has — proof, on sight, that it came from that
// one whole rather than being generic wreckage.
function renderShard(x, y, seed) {
  const s = 18 + (seed % 3) * 6;
  const rot = (seed * 53) % 360;
  return `
    <g transform="rotate(${rot} ${x} ${y})">
      <path d="M${x - s},${y} L${x},${y - s} L${x + s},${y} L${x},${y + s * 0.6} Z" fill="${CLAY}" stroke="${CLAY_DARK}" stroke-width="2" />
      <path d="M${x - s * 0.4},${y - s * 0.15} Q${x},${y - s * 0.5} ${x + s * 0.4},${y - s * 0.15}" stroke="${PATTERN}" stroke-width="2.5" fill="none" />
    </g>
  `;
}

function renderShards(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions
    .map((p, i) => {
      const side = p.x < mid ? 1 : -1;
      const x = clamp(p.x + side * 75, 30, COL_W - 30);
      return renderShard(x, p.y, i * 3);
    })
    .join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#6fb8c9" stroke-width="4" />`;

  // The urn itself sits near the top of the trail's own vertical
  // midpoint, offset to whichever side the trail isn't using right
  // there — same nearest-position-aware placement plains.js's hills and
  // reefCrown.js's own crown use for one large feature.
  const urnY = totalHeight * 0.35;
  const nearest = positions.reduce((a, b) => (Math.abs(a.y - urnY) < Math.abs(b.y - urnY) ? a : b));
  const mid = (BAND.min + BAND.max) / 2;
  const urnX = clamp(mid + (nearest.x < mid ? 1 : -1) * (BAND.max - BAND.min) * 0.3, 120, COL_W - 120);

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Sunken Archive: one large cracked urn with matching shards scattered down the trail, each in the urn's own pattern, connecting every Big Conclusions lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#5a95a3" />
      <g>${renderShards(positions)}</g>
      ${renderUrn(urnX, urnY)}
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#e8d9b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const mosaicRuinsTheme = {
  trailBand: BAND,
  mapBg: "#5a95a3",
  hintColor: "rgba(10, 30, 35, 0.75)",
  renderScene,
};
