// Shared "winding path" layout used by the World Map (subject islands),
// each subject's skill path, and a skill's mini-lesson path, so all three
// levels of navigation share the same "stops connected by a bridge" look.
//
// Positions alternate left/right down the page; a single SVG overlay draws
// a soft curved line connecting them in order.

export function pathPositions(count, { rowHeight = 132, leftPct = 24, rightPct = 76 } = {}) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: i % 2 === 0 ? leftPct : rightPct,
      y: rowHeight * i + rowHeight / 2,
    });
  }
  return positions;
}

export function pathHeight(count, rowHeight = 132) {
  return count * rowHeight;
}

// Renders the connecting line as one continuous SVG path, with a soft S
// curve between each consecutive pair of stops. x values are in the 0-100
// viewBox range (matching the nodes' `left:{x}%` positioning); y values are
// real pixels, matching the nodes' `top:{y}px` positioning.
export function renderPathSvg(positions, totalHeight, { color = "#6a5cff" } = {}) {
  if (positions.length < 2) return "";
  const segments = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i];
    const b = positions[i + 1];
    const midY = (a.y + b.y) / 2;
    segments.push(`M ${a.x} ${a.y} Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY} Q ${b.x} ${midY} ${b.x} ${b.y}`);
  }
  return `
    <svg class="path-trail-svg" viewBox="0 0 100 ${totalHeight}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${segments.join(" ")}" fill="none" stroke="${color}" stroke-width="3"
        stroke-linecap="round" stroke-dasharray="1.5 6" opacity="0.55" vector-effect="non-scaling-stroke"/>
    </svg>
  `;
}

// A handful of decorative background blobs (clouds/rocks/foliage) scattered
// behind the path, purely for visual texture on the "colorful map" feel.
export function renderDecorations(totalHeight, seed = 0, shapes = ["☁️", "🌿", "🪨", "✨", "🌊"]) {
  const count = Math.max(3, Math.round(totalHeight / 220));
  let out = "";
  for (let i = 0; i < count; i++) {
    const shape = shapes[(i + seed) % shapes.length];
    const x = (i * 37 + seed * 13) % 100;
    const y = ((i * 0.9 + 0.3) / count) * totalHeight;
    const size = 20 + ((i * 7) % 14);
    out += `<span class="path-decoration" style="left:${x}%;top:${y}px;font-size:${size}px;">${shape}</span>`;
  }
  return out;
}
