// A one-off, hand-authored SVG illustration for the ACT English island
// specifically (its "hub" concept — see the design brief this was built
// from): a rounded central landmass with a couple of gentle hills, a
// stone archway landmark carved with a book emblem at its center, a
// handful of worn paths radiating out toward the coastline like spokes,
// and a few small scattered details (trees, lantern posts, a bench,
// flags at path's end) — all built from plain SVG primitives (paths,
// rects, circles, and a few emoji glyphs for iconography that would
// otherwise take dozens of hand-drawn points), consistent with the rest
// of this app's "no image assets" approach. Purely decorative — it sits
// above the real skill list, which keeps working exactly as it already
// did; this doesn't wire into skill state at all.
//
// Warm sand/stone/olive palette, deliberately more saturated than the
// cool ocean-scene background around it (see .ocean-scene in style.css,
// reused here as this island's own backdrop) so it reads as "home base"
// against the water. Dark mode is handled by a single CSS filter on the
// container (style.css's .island-hub-art dark override) rather than a
// second copy of every color here.
export function renderEnglishHubIsland() {
  return `
    <div class="island-hub-art">
      <svg viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wordwood Isle's central hub, with paths leading out to its grammar islands">
        <!-- soft shadow where the island meets the water -->
        <ellipse cx="360" cy="398" rx="255" ry="26" fill="rgba(20,45,55,0.18)" />

        <!-- landmass -->
        <path d="M360,40 C480,45 570,95 600,180 C625,250 605,320 540,365 C470,410 380,415 300,400 C200,382 130,330 120,245 C112,165 170,90 260,55 C290,44 325,38 360,40 Z"
          fill="#e3c98f" stroke="#c9a668" stroke-width="3" />

        <!-- gentle hills -->
        <ellipse cx="245" cy="205" rx="88" ry="46" fill="#9cb576" opacity="0.4" />
        <ellipse cx="445" cy="305" rx="102" ry="52" fill="#7f9c5c" opacity="0.32" />

        <!-- worn paths radiating from the center plaza -->
        <g stroke="#b98a52" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11" fill="none" opacity="0.85">
          <path d="M355,286 C325,318 258,344 192,367" />
          <path d="M365,286 C402,323 462,349 519,371" />
          <path d="M303,231 C240,226 180,223 132,239" />
          <path d="M419,231 C480,223 538,226 582,207" />
          <path d="M345,176 C320,131 291,96 267,69" />
          <path d="M379,176 C405,131 434,96 460,67" />
        </g>

        <!-- small docks where three paths meet the coastline -->
        <g stroke="#a9987a" stroke-width="7" stroke-linecap="round">
          <path d="M192,367 L172,382" />
          <path d="M519,371 L538,387" />
          <path d="M132,239 L110,234" />
        </g>

        <!-- central plaza -->
        <circle cx="360" cy="232" r="58" fill="#c9a668" opacity="0.55" />

        <!-- stone archway landmark -->
        <rect x="330" y="170" width="16" height="75" rx="4" fill="#a9987a" />
        <rect x="374" y="170" width="16" height="75" rx="4" fill="#a9987a" />
        <path d="M330,170 C330,138 390,138 390,170" stroke="#a9987a" stroke-width="16" fill="none" stroke-linecap="round" />
        <rect x="321" y="244" width="78" height="10" rx="3" fill="#a9987a" />
        <circle cx="360" cy="150" r="17" fill="#efe4cf" stroke="#a9987a" stroke-width="2" />
        <text x="360" y="157" font-size="17" text-anchor="middle">📖</text>

        <!-- lantern posts -->
        <g>
          <line x1="298" y1="292" x2="298" y2="322" stroke="#a9987a" stroke-width="3" stroke-linecap="round" />
          <circle cx="298" cy="286" r="6" fill="#f4d879" opacity="0.9" />
          <line x1="424" y1="292" x2="424" y2="322" stroke="#a9987a" stroke-width="3" stroke-linecap="round" />
          <circle cx="424" cy="286" r="6" fill="#f4d879" opacity="0.9" />
        </g>

        <!-- bench near the plaza -->
        <rect x="333" y="271" width="54" height="7" rx="2" fill="#b98a52" />
        <rect x="337" y="278" width="5" height="10" fill="#a9987a" />
        <rect x="378" y="278" width="5" height="10" fill="#a9987a" />

        <!-- flags marking two of the paths down to the docks -->
        <g>
          <line x1="192" y1="367" x2="192" y2="343" stroke="#a9987a" stroke-width="3" stroke-linecap="round" />
          <path d="M192,344 L212,351 L192,358 Z" fill="#8c3b3b" />
          <line x1="519" y1="371" x2="519" y2="347" stroke="#a9987a" stroke-width="3" stroke-linecap="round" />
          <path d="M519,348 L539,355 L519,362 Z" fill="#8c3b3b" />
        </g>

        <!-- scattered trees -->
        <text x="205" y="270" font-size="22">🌳</text>
        <text x="475" y="262" font-size="24">🌳</text>
        <text x="248" y="352" font-size="17">🌳</text>
        <text x="428" y="118" font-size="19">🌳</text>
      </svg>
    </div>
  `;
}
