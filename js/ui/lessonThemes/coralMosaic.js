// Athenaeum Reef's own theme for Detail Detective, Coral Stacks' second
// skill (see lessonTerrain.js for the shared engine every lesson-path
// theme renders through). Detail Detective is about locating and
// interpreting significant details, so unlike Big Picture's single
// unmissable coral crown right next door, this scene is deliberately the
// opposite composition: no one dominant shape anywhere, just a dense,
// varied mosaic of small anemones, shells, and coral polyps covering the
// whole sandy reef floor — something worth actually looking closely at,
// the same way the skill itself rewards close reading.
import { COL_W, clamp, blobPoints, closedBlobPath, renderTrailPath } from "../lessonTerrain.js";

const BAND = { min: 90, max: COL_W - 90 };

// A small library of mosaic-piece shapes (not one shape repeated) —
// anemones (soft rounded blobs), shells (a small ribbed oval), coral
// polyp clusters (five dots ringing a point) — each `(x, y, seed)` call
// returns one complete piece centered there, `seed` driving its own
// irregular shape so no two pieces of the same kind look identical.
function anemone(x, y, seed, fill) {
  const pts = blobPoints(x, y, 16 + (seed % 5), 10, seed);
  return `<path d="${closedBlobPath(pts)}" fill="${fill}" opacity="0.9" />`;
}
function shell(x, y, seed, fill) {
  const r = 10 + (seed % 4);
  const ribs = Array.from({ length: 4 }, (_, i) => {
    const a = -0.9 + i * 0.6;
    return `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * r).toFixed(1)}" y2="${(y + Math.sin(a) * r).toFixed(1)}" stroke="#a8785a" stroke-width="1.5" opacity="0.6" />`;
  }).join("");
  return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 0.72).toFixed(1)}" fill="${fill}" opacity="0.92" />${ribs}`;
}
function polypCluster(x, y, seed, fill) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + seed;
    const px = (x + Math.cos(a) * 9).toFixed(1);
    const py = (y + Math.sin(a) * 9).toFixed(1);
    return `<circle cx="${px}" cy="${py}" r="5" fill="${fill}" opacity="0.88" />`;
  }).join("");
}

const PIECES = [
  (x, y, s) => anemone(x, y, s, "#e8895f"),
  (x, y, s) => shell(x, y, s, "#f6e2c4"),
  (x, y, s) => polypCluster(x, y, s, "#f0a978"),
  (x, y, s) => anemone(x, y, s, "#7fd9c4"),
  (x, y, s) => polypCluster(x, y, s, "#9be3d2"),
];

// A jittered grid across the whole floor, not a rigid one — every third
// cell skipped so it reads as scattered detail rather than a wallpaper
// pattern, and each kept piece nudged off its grid point by a
// seed-derived offset.
function renderMosaic(totalHeight) {
  const cols = 6;
  const rows = Math.max(10, Math.round(totalHeight / 55));
  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 13 + c * 7;
      if (seed % 3 === 0) continue;
      const jitterX = ((seed * 37) % 40) - 20;
      const jitterY = ((seed * 19) % 30) - 15;
      const x = clamp((COL_W / cols) * (c + 0.5) + jitterX, 20, COL_W - 20);
      const y = clamp((totalHeight / rows) * (r + 0.5) + jitterY, 20, totalHeight - 20);
      pieces.push(PIECES[seed % PIECES.length](x, y, seed));
    }
  }
  return pieces.join("");
}

function renderScene(positions, totalHeight, bossName) {
  const last = positions[positions.length - 1];
  const bossClearing = `<circle cx="${last.x}" cy="${last.y}" r="86" fill="#f3ead6" stroke="#d8b98a" stroke-width="4" />`;

  return `
    <svg viewBox="0 0 ${COL_W} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="lesson-terrain-svg" role="img"
      aria-label="A corner of Athenaeum Reef's Coral Stacks: a sandy reef floor covered edge to edge in a dense mosaic of small anemones, shells, and coral polyps, with a trail connecting every Detail Detective lesson up to ${bossName}'s own clearing">
      <rect x="0" y="0" width="${COL_W}" height="${totalHeight}" fill="#e8d9b8" />
      <g>${renderMosaic(totalHeight)}</g>
      ${bossClearing}
      <path d="${renderTrailPath(positions)}" stroke="#5fb0c4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 14" fill="none" opacity="0.9" />
    </svg>
  `;
}

export const coralMosaicTheme = {
  trailBand: BAND,
  mapBg: "#e8d9b8",
  hintColor: "rgba(50, 35, 15, 0.75)",
  renderScene,
};
