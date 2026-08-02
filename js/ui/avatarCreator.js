import { gameState } from "../state.js";
import {
  monsterSVG,
  BODY_COLORS,
  BODY_SHAPES,
  SIZES,
  LIMB_OPTIONS,
  EYE_NAMES,
  MOUTH_NAMES,
  CATEGORIES,
  SHOP_ITEMS,
  itemsByCategory,
} from "./monster.js";
import { hudHTML, wireHud } from "./hud.js";

const TABS = [
  { id: "body", name: "Body", icon: "🧬" },
  { id: "face", name: "Face", icon: "👀" },
  { id: "extras", name: "Extras", icon: "✨" },
  { id: "outfit", name: "Outfit", icon: "🎽" },
];

const SHAPE_FLAVOR = {
  round: "Simple, friendly, and always smiling.",
  humanoid: "Two arms, two legs, big study energy.",
  insect: "Skittery, many-legged, and a little bit spooky.",
  reptile: "Scaly and sly, with a snout built for mischief.",
  amorphous: "A wobbly blob with a mind of its own.",
  serpent: "Long, sinuous, and impossible to pin down.",
  arachnid: "Eight-legged, quick, and just a little unsettling.",
  avian: "Feathered, alert, and always ready to take flight.",
  aquatic: "Sleek, finned, and built for the deep end.",
  crystalline: "Faceted, sharp-edged, and gleaming all over.",
  crab: "Armored, side-stepping, and armed with big claws.",
  mechanical: "Bolted together, sturdy, and powered by gears.",
  spectral: "Wispy, translucent, and drifting like a ghost.",
  treant: "Rooted, sturdy, and growing a little every day.",
  centipede: "Long, low, and covered in scurrying legs.",
};

const RANDOM_QUIPS = [
  "Ta-da! A brand new look.",
  "Whoa, fancy!",
  "Now that's a glow-up.",
  "Fresh out of the lab.",
  "Looking sharp!",
];

function traitButton(active, label, dataAttr, value) {
  return `<button class="trait-btn ${active ? "is-selected" : ""}" data-${dataAttr}="${value}">${label}</button>`;
}

function itemRow(category) {
  const avatar = gameState.getAvatar();
  const current = avatar[category] ?? "none";
  const options = [{ id: "none", name: "None", cost: 0 }, ...itemsByCategory(category)];
  return options
    .map((item) => {
      const owned = gameState.ownsItem(item.id);
      const selected = current === item.id;
      return `
        <button class="accessory-btn ${selected ? "is-selected" : ""} ${owned ? "" : "is-locked"}"
          data-category="${category}" data-item="${item.id}" ${owned ? "" : "disabled"}>
          ${item.name}${owned ? "" : " 🔒"}
        </button>
      `;
    })
    .join("");
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function renderAvatarCreator(root, navigate, { onboarding = false } = {}) {
  let activeTab = "body";
  let quip = "";

  function randomize() {
    const ownedByCategory = (cat) => ["none", ...itemsByCategory(cat).filter((i) => gameState.ownsItem(i.id)).map((i) => i.id)];
    gameState.setAvatar({
      bodyColor: randomChoice(BODY_COLORS),
      bodyShape: randomChoice(BODY_SHAPES).id,
      monsterSize: randomChoice(SIZES).id,
      limbs: randomChoice(LIMB_OPTIONS).id,
      eyeType: Math.floor(Math.random() * EYE_NAMES.length),
      mouthType: Math.floor(Math.random() * MOUTH_NAMES.length),
      spots: Math.random() < 0.5,
      head: randomChoice(ownedByCategory("head")),
      face: randomChoice(ownedByCategory("face")),
      back: randomChoice(ownedByCategory("back")),
      tail: randomChoice(ownedByCategory("tail")),
      skin: randomChoice(ownedByCategory("skin")),
      outfit: randomChoice(ownedByCategory("outfit")),
      scar: randomChoice(ownedByCategory("scar")),
    });
    quip = randomChoice(RANDOM_QUIPS);
    render();
  }

  function reset() {
    gameState.setAvatar({
      bodyColor: BODY_COLORS[0],
      bodyShape: "round",
      monsterSize: "medium",
      limbs: 2,
      eyeType: 0,
      mouthType: 0,
      spots: false,
      head: "none",
      face: "none",
      back: "none",
      tail: "none",
      skin: "none",
      outfit: "none",
      scar: "none",
    });
    quip = "Back to basics!";
    render();
  }

  function render() {
    const avatar = gameState.getAvatar();

    const colorSwatches = BODY_COLORS.map(
      (c) =>
        `<button class="swatch ${avatar.bodyColor === c ? "is-selected" : ""}" data-color="${c}" style="background:${c}"></button>`
    ).join("");

    const shapeButtons = BODY_SHAPES.map((s) => traitButton(avatar.bodyShape === s.id, s.name, "shape", s.id)).join("");
    const sizeButtons = SIZES.map((s) => traitButton(avatar.monsterSize === s.id, s.name, "size", s.id)).join("");
    const limbButtons = LIMB_OPTIONS.map((l) => traitButton(avatar.limbs === l.id, l.name, "limbs", l.id)).join("");
    const ownedCount = gameState.ownedItems.length;

    const tabNav = TABS.map(
      (t) => `<button class="avatar-tab-btn ${activeTab === t.id ? "is-active" : ""}" data-tab="${t.id}">
        <span class="avatar-tab-icon">${t.icon}</span>${t.name}
      </button>`
    ).join("");

    const bodyPane = `
      <div class="control-group">
        <h4>Color</h4>
        <div class="swatch-row">${colorSwatches}</div>
      </div>
      <div class="control-group">
        <h4>Body Shape</h4>
        <div class="trait-row">${shapeButtons}</div>
        <p class="trait-flavor">${SHAPE_FLAVOR[avatar.bodyShape] || ""}</p>
      </div>
      <div class="control-group">
        <h4>Size</h4>
        <div class="trait-row">${sizeButtons}</div>
      </div>
      <div class="control-group">
        <h4>Limbs</h4>
        <div class="trait-row">${limbButtons}</div>
      </div>
      <div class="control-group">
        <h4>Skin</h4>
        <div class="accessory-row">${itemRow("skin")}</div>
      </div>
    `;

    const facePane = `
      <div class="control-group">
        <h4>Eyes: ${EYE_NAMES[avatar.eyeType] || EYE_NAMES[0]}</h4>
        <button class="btn-secondary" data-cycle="eyeType">Try Different Eyes 👀</button>
      </div>
      <div class="control-group">
        <h4>Mouth: ${MOUTH_NAMES[avatar.mouthType] || MOUTH_NAMES[0]}</h4>
        <button class="btn-secondary" data-cycle="mouthType">Try Different Mouth 😄</button>
      </div>
      <div class="control-group">
        <h4>Spots</h4>
        <label class="toggle-label">
          <input type="checkbox" id="spotsToggle" ${avatar.spots ? "checked" : ""} />
          Give it spots
        </label>
      </div>
      <div class="control-group">
        <h4>Head</h4>
        <div class="accessory-row">${itemRow("head")}</div>
      </div>
      <div class="control-group">
        <h4>Face</h4>
        <div class="accessory-row">${itemRow("face")}</div>
      </div>
    `;

    const extrasPane = `
      <div class="control-group">
        <h4>Back</h4>
        <div class="accessory-row">${itemRow("back")}</div>
      </div>
      <div class="control-group">
        <h4>Tail</h4>
        <div class="accessory-row">${itemRow("tail")}</div>
      </div>
      <div class="control-group">
        <h4>Scars</h4>
        <div class="accessory-row">${itemRow("scar")}</div>
      </div>
    `;

    const outfitPane = `
      <div class="control-group">
        <h4>Outfit</h4>
        <div class="accessory-row">${itemRow("outfit")}</div>
      </div>
    `;

    const panes = { body: bodyPane, face: facePane, extras: extrasPane, outfit: outfitPane };

    root.innerHTML = `
      ${onboarding ? "" : hudHTML("avatarCreator")}
      <main class="screen avatar-screen">
        <h1>${onboarding ? "Meet Your Monster" : "Customize Your Monster"}</h1>
        <p class="avatar-subtitle">${
          onboarding
            ? "This little guy will study alongside you. Make it yours, and you can always add more from the shop later."
            : "Free traits below; shop items (🔒) are unlocked with coins from the Shop."
        }</p>
        <div class="avatar-layout">
          <div class="avatar-preview-col">
            <div class="avatar-preview">${monsterSVG(avatar, { size: 220 })}</div>
            ${quip ? `<p class="avatar-quip">${quip}</p>` : ""}
            <div class="avatar-fun-actions">
              <button class="btn-secondary" data-randomize>🎲 Surprise Me!</button>
              <button class="btn-ghost" data-reset>↺ Reset</button>
            </div>
            ${
              onboarding
                ? ""
                : `<p class="avatar-collection-stat">🎒 ${ownedCount} / ${SHOP_ITEMS.length} shop items collected</p>`
            }
          </div>
          <div class="avatar-controls">
            <div class="avatar-tabs">${tabNav}</div>
            <div class="avatar-tab-pane">${panes[activeTab]}</div>
            ${
              onboarding
                ? `
              <div class="control-group">
                <h4>Name your monster's trainer (you!)</h4>
                <input type="text" id="nameInput" placeholder="Your name" maxlength="20" />
              </div>
              <button class="btn-primary" id="startBtn">Begin the Quest &rarr;</button>
            `
                : `<button class="btn-primary" data-done>Done</button>`
            }
          </div>
        </div>
      </main>
    `;

    if (!onboarding) wireHud(root, navigate);
    wireEvents(avatar);
  }

  function wireEvents(avatar) {
    root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    root.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.setAvatar({ bodyColor: btn.dataset.color });
        quip = "";
        render();
      });
    });

    root.querySelectorAll("[data-shape]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.setAvatar({ bodyShape: btn.dataset.shape });
        quip = "";
        render();
      });
    });

    root.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.setAvatar({ monsterSize: btn.dataset.size });
        quip = "";
        render();
      });
    });

    root.querySelectorAll("[data-limbs]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameState.setAvatar({ limbs: Number(btn.dataset.limbs) });
        quip = "";
        render();
      });
    });

    root.querySelectorAll("[data-cycle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.cycle;
        const max = key === "eyeType" ? EYE_NAMES.length : MOUTH_NAMES.length;
        gameState.setAvatar({ [key]: (avatar[key] + 1) % max });
        quip = "";
        render();
      });
    });

    const spotsToggle = root.querySelector("#spotsToggle");
    if (spotsToggle) {
      spotsToggle.addEventListener("change", () => {
        gameState.setAvatar({ spots: spotsToggle.checked });
        quip = "";
        render();
      });
    }

    root.querySelectorAll("[data-category]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        gameState.setAvatar({ [btn.dataset.category]: btn.dataset.item });
        quip = "";
        render();
      });
    });

    const randomizeBtn = root.querySelector("[data-randomize]");
    if (randomizeBtn) randomizeBtn.addEventListener("click", randomize);

    const resetBtn = root.querySelector("[data-reset]");
    if (resetBtn) resetBtn.addEventListener("click", reset);

    const doneBtn = root.querySelector("[data-done]");
    if (doneBtn) doneBtn.addEventListener("click", () => navigate("map"));

    const startBtn = root.querySelector("#startBtn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const nameInput = root.querySelector("#nameInput");
        const name = nameInput.value.trim() || "Explorer";
        gameState.setName(name);
        navigate("map");
      });
    }
  }

  render();
}
