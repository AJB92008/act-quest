// Number Detective's own theme (see lessonTerrain.js for the shared
// engine every lesson-path theme renders through) — open, flat
// gold-flecked ground (matching Numeria Peaks' own Goldtally Flats
// zone, deliberately low rather than the rock walls or forest the
// other three zones lean on), worked like an actual crime scene: a
// footprint trail alongside the path, a numbered evidence tag planted
// at intervals — its own number circled if prime, the skill's own
// primes/even-odd work turned into a real clue rather than told — and
// one magnifying glass planted over the biggest piece of evidence.
import { COL_W, clamp, nearestPosition, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 55, max: COL_W - 55 };
const GROUND = "#dcc48f";
const CRACK_COLOR = "#8a6d1f";

function computeCracks(totalHeight) {
  const count = Math.max(14, Math.round(totalHeight / 220));
  return Array.from({ length: count }, (_, i) => {
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hy = Math.abs(Math.sin(i * 78.233 + 4.1) * 12543.789) % 1;
    return { x: clamp(hx * COL_W, 20, COL_W - 20), y: hy * totalHeight, rot: (i * 47) % 360 };
  });
}

function renderCrack(x, y, rot) {
  return `<path d="M0,0 L14,-3 M14,-3 L24,4 M14,-3 L10,-14" stroke="${CRACK_COLOR}" stroke-width="1.5" fill="none" opacity="0.4" transform="translate(${x},${y}) rotate(${rot})" />`;
}

function renderFootprint(x, y, rot) {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">
    <ellipse cx="0" cy="0" rx="6" ry="10" fill="#8a6d1f" opacity="0.35" />
    <ellipse cx="1" cy="-11" rx="3.5" ry="4.5" fill="#8a6d1f" opacity="0.35" />
  </g>`;
}

function computeFootprints(positions) {
  const mid = (BAND.min + BAND.max) / 2;
  return positions.flatMap((p) => {
    const side = p.x < mid ? 1 : -1;
    const baseX = clamp(p.x + side * 30, BAND.min + 12, BAND.max - 12);
    return [
      { x: baseX - 6, y: p.y - 18, rot: -8 },
      { x: baseX + 6, y: p.y + 6, rot: 8 },
    ];
  });
}

function renderFootprints(positions) {
  return computeFootprints(positions)
    .map(({ x, y, rot }) => renderFootprint(x, y, rot))
    .join("");
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

// A numbered evidence tag — a real number, circled if it's prime, so
// the skill's own prime-spotting work shows up in the scene itself.
function renderEvidenceTag(x, y, n) {
  const prime = isPrime(n);
  return `
    <line x1="${x.toFixed(1)}" y1="${(y - 30).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#6b5233" stroke-width="2.5" />
    <rect x="${(x - 15).toFixed(1)}" y="${(y - 46).toFixed(1)}" width="30" height="18" rx="2" fill="#f0e6c4" stroke="#6b5233" stroke-width="1.5" transform="rotate(-4 ${x} ${(y - 37).toFixed(1)})" />
    <text x="${x.toFixed(1)}" y="${(y - 34).toFixed(1)}" font-size="13" font-weight="700" fill="${prime ? "#b3453f" : "#453a1f"}" text-anchor="middle" transform="rotate(-4 ${x} ${(y - 37).toFixed(1)})">${n}</text>
    ${prime ? `<circle cx="${x.toFixed(1)}" cy="${(y - 37).toFixed(1)}" r="16" fill="none" stroke="#b3453f" stroke-width="1.5" opacity="0.7" transform="rotate(-4 ${x} ${(y - 37).toFixed(1)})" />` : ""}
  `;
}

function computeTags(positions) {
  return positions
    .filter((_, i) => i % 2 === 1)
    .map((p, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const dx = clamp(p.x + side * 58, BAND.min + 25, BAND.max - 25);
      return { x: dx, y: p.y, n: i * 3 + 2 };
    });
}

function renderTags(positions) {
  return computeTags(positions)
    .map(({ x, y, n }) => renderEvidenceTag(x, y, n))
    .join("");
}

function renderMagnifyingGlass(x, y, s) {
  return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="rgba(200,224,230,0.35)" stroke="#453a1f" stroke-width="4" />
    <line x1="${(x + s * 0.72).toFixed(1)}" y1="${(y + s * 0.72).toFixed(1)}" x2="${(x + s * 1.35).toFixed(1)}" y2="${(y + s * 1.35).toFixed(1)}" stroke="#453a1f" stroke-width="6" stroke-linecap="round" />
  `;
}

function computeMagnifier(positions, totalHeight) {
  const p = positions[Math.floor(positions.length * 0.58)];
  const side = p.x < (BAND.min + BAND.max) / 2 ? -1 : 1;
  const x = clamp(p.x + side * 70, BAND.min + 40, BAND.max - 40);
  return { x, y: p.y };
}

function renderScene(positions, totalHeight, bossName) {
  const cracks = computeCracks(totalHeight)
    .map((c) => renderCrack(c.x, c.y, c.rot))
    .join("");
  const footprints = renderFootprints(positions);
  const tags = renderTags(positions);
  const mag = computeMagnifier(positions, totalHeight);
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f0e6c4" stroke="#c9a668" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A close-up corner of Numeria Peaks: open flat gold-flecked ground worked like a crime scene, a footprint trail and numbered evidence tags — circled if prime — leading to a magnifying glass, connecting every Number Detective lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="${GROUND}" />
      <g>${cracks}</g>
      <g>${footprints}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#8a6d1f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.85" />
      <g>${tags}</g>
      ${renderMagnifyingGlass(mag.x, mag.y, 30)}
    </svg>
  `;
}

export const numberDetectiveFlatsTheme = {
  trailBand: BAND,
  mapBg: GROUND,
  hintColor: "rgba(45, 35, 10, 0.78)",
  renderScene,
};
