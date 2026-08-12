// Regression test formalizing the manual getBBox() clipping sweeps done by
// hand while building the level-based size growth system: renders every
// body shape at every limb option, maxed-out level + evolution stage, with
// the single worst accessory per category (the real ceiling a player could
// reach — only one item per category can be equipped at once), and asserts
// the rendered bounding box never escapes the SVG's own viewBox.
import { monsterSVG, BODY_SHAPES, LIMB_OPTIONS, CATEGORIES, itemsByCategory } from "../js/ui/monster.js";
import { test, assertTrue } from "./assert.js";

// Keep in sync with the actual <svg viewBox="..."> in monsterSVG(). The
// first test below catches drift so this suite doesn't silently check
// against a stale box if that ever changes.
const VIEWBOX = { minX: -54, minY: -80, width: 224, height: 268 };

function measureBBox(container, config) {
  container.innerHTML = monsterSVG(config, { size: 220 });
  const svg = container.querySelector("svg");
  const r = svg.getBBox();
  return { x: r.x, y: r.y, x2: r.x + r.width, y2: r.y + r.height };
}

test("monster viewBox matches the constant this suite checks overflow against", () => {
  const container = document.createElement("div");
  container.innerHTML = monsterSVG({ bodyShape: "round" }, { size: 220 });
  const svg = container.querySelector("svg");
  const vb = svg.getAttribute("viewBox").split(" ").map(Number);
  assertTrue(
    vb[0] === VIEWBOX.minX && vb[1] === VIEWBOX.minY && vb[2] === VIEWBOX.width && vb[3] === VIEWBOX.height,
    `viewBox drifted to ${JSON.stringify(vb)} — update this test's VIEWBOX constant, then re-verify the sweep below still passes`
  );
});

test("no shape/limb/accessory combo clips the viewBox at max level + evolution", () => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  document.body.appendChild(container); // getBBox() needs real layout

  const itemsByCat = {};
  for (const cat of CATEGORIES) itemsByCat[cat.id] = itemsByCategory(cat.id).map((i) => i.id);

  const LEVEL = 60; // effectively maxed out on the asymptotic growth curve
  const STAGE = 4; // Legendary
  const overflow = [];

  for (const shape of BODY_SHAPES.map((s) => s.id)) {
    for (const limbs of LIMB_OPTIONS.map((l) => l.id)) {
      // Find the single worst item per accessory category (holding the
      // rest at "none"), then combine those worst items into one config.
      const bestByCat = {};
      for (const cat of Object.keys(itemsByCat)) {
        let worstItem = null;
        let worstReach = -1;
        for (const item of itemsByCat[cat]) {
          const b = measureBBox(container, {
            bodyShape: shape,
            limbs,
            evolutionStage: STAGE,
            level: LEVEL,
            spots: true,
            [cat]: item,
          });
          const reach = Math.max(Math.abs(b.x), Math.abs(b.x2), Math.abs(b.y), Math.abs(b.y2));
          if (reach > worstReach) {
            worstReach = reach;
            worstItem = item;
          }
        }
        bestByCat[cat] = worstItem;
      }

      const combo = measureBBox(container, {
        bodyShape: shape,
        limbs,
        evolutionStage: STAGE,
        level: LEVEL,
        spots: true,
        ...bestByCat,
      });
      const clips =
        combo.x < VIEWBOX.minX ||
        combo.y < VIEWBOX.minY ||
        combo.x2 > VIEWBOX.minX + VIEWBOX.width ||
        combo.y2 > VIEWBOX.minY + VIEWBOX.height;
      if (clips) overflow.push({ shape, limbs, combo, bestByCat });
    }
  }

  document.body.removeChild(container);
  assertTrue(
    overflow.length === 0,
    `${overflow.length} shape/limb combo(s) clip the viewBox: ${JSON.stringify(overflow.slice(0, 3))}`
  );
});
