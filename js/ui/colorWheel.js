// A custom, self-contained color-wheel picker for the Color Wheel shop
// unlock. Built instead of a native <input type="color">: that native
// popup silently closes the instant the page underneath it re-renders —
// and live-updating the monster preview on every drag tick, the entire
// point of picking a color visually, does exactly that on every tick. So
// this picker owns its own DOM subtree, appended directly to
// document.body rather than into a screen's own root.innerHTML, and the
// caller's re-renders never touch it while it's open. It only closes via
// its own exit button or Escape — not by clicking the backdrop, and not
// as a side effect of anything the caller does with onChange.

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

const WHEEL_SIZE = 220;

/** Opens the picker. `onChange(hex)` fires live on every drag tick and
 * every lightness-slider tick; `onClose()` fires once, after the picker
 * has already removed itself, when the player exits via the Done button
 * or Escape. */
export function openColorWheel({ initialColor, onChange, onClose }) {
  const initial = hexToHsl(initialColor || "#7fd1ae");
  let hue = initial.h;
  let sat = initial.s;
  // A starting lightness of 0 or 100 would render a wheel that's entirely
  // black or white regardless of hue/saturation, which looks broken —
  // nudge into the wheel's usable range instead.
  let light = initial.l <= 2 || initial.l >= 98 ? 50 : initial.l;

  const overlay = document.createElement("div");
  overlay.className = "color-wheel-overlay";
  overlay.innerHTML = `
    <div class="color-wheel-panel" role="dialog" aria-label="Pick a custom color">
      <h3>🎨 Pick a Color</h3>
      <div class="color-wheel-canvas-wrap">
        <canvas class="color-wheel-canvas" width="${WHEEL_SIZE}" height="${WHEEL_SIZE}"></canvas>
        <div class="color-wheel-cursor"></div>
      </div>
      <label class="color-wheel-lightness-label">
        Lightness
        <input type="range" class="color-wheel-lightness" min="5" max="95" value="${Math.round(light)}" />
      </label>
      <div class="color-wheel-footer">
        <div class="color-wheel-preview-row">
          <span class="color-wheel-preview"></span>
          <span class="color-wheel-hex"></span>
        </div>
      </div>
      <button type="button" class="btn-secondary color-wheel-exit">✕ Done</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector(".color-wheel-canvas");
  const ctx = canvas.getContext("2d");
  const cursor = overlay.querySelector(".color-wheel-cursor");
  const lightnessInput = overlay.querySelector(".color-wheel-lightness");
  const preview = overlay.querySelector(".color-wheel-preview");
  const hexLabel = overlay.querySelector(".color-wheel-hex");
  const exitBtn = overlay.querySelector(".color-wheel-exit");

  function drawWheel() {
    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const r = WHEEL_SIZE / 2;
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    // Hue sweeps clockwise starting from straight up (12 o'clock).
    const conic = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    for (let i = 0; i <= 360; i += 30) {
      conic.addColorStop(i / 360, `hsl(${i}, 100%, ${light}%)`);
    }
    ctx.fillStyle = conic;
    ctx.fillRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    // Saturation fades from neutral gray at the center (0%) to the full
    // hue color at the rim (100%).
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    radial.addColorStop(0, `hsl(0, 0%, ${light}%)`);
    radial.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    ctx.restore();
  }

  function updateCursor() {
    const angleRad = ((hue - 90) * Math.PI) / 180;
    const radius = (sat / 100) * (WHEEL_SIZE / 2);
    const x = WHEEL_SIZE / 2 + radius * Math.cos(angleRad);
    const y = WHEEL_SIZE / 2 + radius * Math.sin(angleRad);
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.style.background = hslToHex(hue, sat, light);
  }

  function refreshPreview() {
    const hex = hslToHex(hue, sat, light);
    preview.style.background = hex;
    hexLabel.textContent = hex.toUpperCase();
    return hex;
  }

  function commitColor() {
    onChange(refreshPreview());
  }

  function pointToHueSat(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - WHEEL_SIZE / 2;
    const y = clientY - rect.top - WHEEL_SIZE / 2;
    const radius = WHEEL_SIZE / 2;
    const dist = Math.min(Math.sqrt(x * x + y * y), radius);
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    hue = angle;
    sat = (dist / radius) * 100;
  }

  let dragging = false;
  function handlePointer(e) {
    pointToHueSat(e.clientX, e.clientY);
    updateCursor();
    commitColor();
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    handlePointer(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) handlePointer(e);
  });
  canvas.addEventListener("pointerup", (e) => {
    dragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  lightnessInput.addEventListener("input", () => {
    light = Number(lightnessInput.value);
    drawWheel();
    updateCursor();
    commitColor();
  });

  function close() {
    document.removeEventListener("keydown", onKeydown);
    overlay.remove();
    onClose?.();
  }
  function onKeydown(e) {
    if (e.key === "Escape") close();
  }
  document.addEventListener("keydown", onKeydown);
  exitBtn.addEventListener("click", close);
  // Deliberately no backdrop click-to-close: the exit button and Escape
  // are the only ways out, so an accidental click while dragging near the
  // wheel's edge can't dismiss the picker mid-pick.

  drawWheel();
  updateCursor();
  refreshPreview();
}
