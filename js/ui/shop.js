import { gameState } from "../state.js";
import { CATEGORIES, SHOP_ITEMS, itemsByCategory, monsterSVG } from "./monster.js";
import { hudHTML, wireHud } from "./hud.js";

export function renderShop(root, navigate) {
  const avatar = gameState.getDisplayAvatar();

  const sections = CATEGORIES.map((cat) => {
    const items = itemsByCategory(cat.id)
      .map((item) => {
        const owned = gameState.ownsItem(item.id);
        const affordable = gameState.coins >= item.cost;
        const previewAvatar = { ...avatar, [cat.id]: item.id };
        return `
          <div class="shop-item">
            <div class="shop-item-preview">${monsterSVG(previewAvatar, { size: 110 })}</div>
            <h4>${item.name}</h4>
            ${item.description ? `<p class="shop-item-description">${item.description}</p>` : ""}
            <p class="shop-item-cost">🪙 ${item.cost}</p>
            <button class="btn-primary" data-buy="${item.id}" data-category="${cat.id}" data-cost="${item.cost}" ${
          owned || !affordable ? "disabled" : ""
        }>
              ${owned ? "Owned ✓" : affordable ? "Buy" : "Not enough coins"}
            </button>
          </div>
        `;
      })
      .join("");
    return `
      <section class="shop-section">
        <h2 class="shop-section-title">${cat.name}</h2>
        <div class="shop-grid">${items}</div>
      </section>
    `;
  }).join("");

  root.innerHTML = `
    ${hudHTML("shop")}
    <main class="screen shop-screen">
      <h1>🛍️ Monster Shop</h1>
      <p class="shop-subtitle">Earn coins by clearing quiz levels, then spend them here. ${SHOP_ITEMS.length} items across ${CATEGORIES.length} categories.</p>
      ${sections}
    </main>
  `;

  wireHud(root, navigate);
  root.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.buy;
      const category = btn.dataset.category;
      const cost = Number(btn.dataset.cost);
      if (gameState.purchase(id, cost)) {
        // "color" doesn't equip a fixed trait value like every other
        // category — owning colorWheel just unlocks a free-pick color
        // input in the avatar creator, wired there instead.
        if (category !== "color") gameState.setAvatar({ [category]: id });
        renderShop(root, navigate);
      }
    });
  });
}
