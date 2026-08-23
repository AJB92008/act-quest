// Developer mode as a floating, draggable panel — mounted once directly on
// document.body (outside the SPA's #app root) so it survives every
// navigate() re-render and stays on screen no matter what page you're
// looking at. Unlocked by tapping the dark/light toggle 10 times within 5
// seconds (see hud.js). Not part of normal gameplay — every control here
// edits the save directly, for fast manual testing rather than playing
// through the real progression to reach a given state.
import { SCIENCE_BACKGROUND } from "../data/scienceBackground.js";
import { VOCABULARY } from "../data/vocabulary.js";
import { STATES } from "../data/stateTests.js";
import { TESTS, isSubjectPlayable } from "../data/tests.js";
import { gameState, EVOLUTION_STAGE_NAMES } from "../state.js";
import { monsterSVG } from "./monster.js";

const firstBgTopic = SCIENCE_BACKGROUND.sections[0].topics[0];
const firstVocabTopic = VOCABULARY.sections[0].topics[0];
const ACT_SUBJECTS = TESTS.find((t) => t.id === "act").subjects;
const firstEnglishSkillId = ACT_SUBJECTS.find((s) => s.id === "english").skills[0].id;

// Every test/planet's subjects with real content — State Assessments'
// 100 subjects are all still `skills: []` scaffolding (see
// data/stateTests.js), so there's nothing there to master/boss-clear or
// jump a skill path/quiz into; that planet gets its own home-state tools
// in the panel body below instead (see buildBodyHTML's "State
// Assessments" section).
const PLAYABLE_TESTS = TESTS.map((test) => ({ test, subjects: test.subjects.filter(isSubjectPlayable) })).filter(
  ({ subjects }) => subjects.length > 0
);

const JUMPS = [
  { label: "Galaxy (Solar System picker)", screen: "solarSystem" },
  ...TESTS.map((t) => ({ label: `World Map: ${t.name}`, screen: "map", params: { testId: t.id } })),
  { label: "State Picker", screen: "statePicker", params: { returnTo: "map" } },
  ...PLAYABLE_TESTS.flatMap(({ test, subjects }) =>
    subjects.map((s) => ({ label: `Island: ${test.name} ${s.name}`, screen: "island", params: { subjectId: s.id } }))
  ),
  { label: "Skill Path (English #1)", screen: "skillPath", params: { skillId: firstEnglishSkillId, subjectId: "english" } },
  { label: "Quiz (English #1, Lesson 1)", screen: "quiz", params: { skillId: firstEnglishSkillId, subjectId: "english", lessonIndex: 0 } },
  ...PLAYABLE_TESTS.flatMap(({ test, subjects }) =>
    subjects.map((s) => ({ label: `Boss Quiz: ${test.name} ${s.name}`, screen: "bossQuiz", params: { subjectId: s.id } }))
  ),
  { label: "Weak Skill Review", screen: "weakReview" },
  { label: "Shop", screen: "shop" },
  { label: "Progress Dashboard", screen: "dashboard" },
  { label: "Avatar Creator", screen: "avatarCreator" },
  { label: "Science Background", screen: "background", params: { subjectId: "science" } },
  {
    label: "Background Quiz",
    screen: "backgroundQuiz",
    params: { topicId: firstBgTopic.id, topicTitle: firstBgTopic.title, subjectId: "science" },
  },
  { label: "Vocabulary Builder", screen: "vocabulary" },
  { label: "Vocab Quiz", screen: "vocabQuiz", params: { topicId: firstVocabTopic.id, topicTitle: firstVocabTopic.title } },
  { label: "Endless Mode", screen: "endless" },
  ...TESTS.filter((t) => t.practiceTest).map((t) => ({ label: `Practice Test: ${t.name}`, screen: "practiceTest", params: { testId: t.id } })),
];

const POSITION_KEY = "act-quest-dev-panel-pos";

let panelEl = null;
let navigateRef = null;
let collapsed = false;

// Secret entry point for TikTok Mode (ui/tiktokMode.js): with the panel
// open, typing the letters T-I-K anywhere (no visible input box — same
// "hidden gesture" spirit as the 10-clicks theme-toggle unlock in hud.js)
// navigates straight there. Registered once at module load rather than
// per-panel-open since the panel can be hidden/shown repeatedly without
// ever being recreated; the handler itself checks visibility and bails
// out of any real text field so it can't hijack typing elsewhere in the
// app just because the panel happens to be open in the background.
let tikBuffer = "";
document.addEventListener("keydown", (e) => {
  if (!panelEl || panelEl.style.display === "none") return;
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
  if (e.key.length !== 1) return;
  tikBuffer = (tikBuffer + e.key).slice(-3).toLowerCase();
  if (tikBuffer === "tik") {
    tikBuffer = "";
    panelEl.style.display = "none"; // out of the way — this card is meant to be recorded clean
    navigateRef?.("tiktokMode", {});
  }
});

function loadPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePosition(x, y) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ x, y }));
  } catch {
    // ignore
  }
}

function clampToViewport(x, y) {
  const width = panelEl.offsetWidth || 360;
  const maxX = Math.max(8, window.innerWidth - width - 8);
  const maxY = Math.max(8, window.innerHeight - 44);
  return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
}

function buildBodyHTML() {
  const levelProgress = gameState.getLevelProgress();
  const stage = gameState.getEvolutionStage();
  const masteryPct = Math.round(gameState.getMasteryPct() * 100);

  // One predicted score per test, not just ACT's — State Assessments has
  // no practiceTest config/skills at all, so getPredictedScore always
  // reports it as "insufficient" (see that method's own comment); shown
  // as "—" rather than "?" so it doesn't look like a bug.
  const predictedHTML = TESTS.map((t) => {
    const predicted = gameState.getPredictedScore(t.id);
    return `<span>${t.name}: ${predicted.score ?? "—"}</span>`;
  }).join("");

  const summaryHTML = `
    <div class="dev-summary">
      <span>Level ${levelProgress.level} (${gameState.xp} xp)</span>
      <span>${EVOLUTION_STAGE_NAMES[stage]} form (${masteryPct}% mastery)</span>
      ${predictedHTML}
      <span>🪙 ${gameState.coins} &nbsp; ⭐ ${gameState.totalStars}</span>
    </div>
  `;

  const masterySubjectRows = PLAYABLE_TESTS.map(
    ({ test, subjects }) => `
      <div class="dev-subgroup-label">${test.name}</div>
      <div class="dev-cheat-row">
        ${subjects
          .map(
            (s) => `
              <button class="dev-btn" data-master-subject="${s.id}">Master ${s.name}</button>
              <button class="dev-btn dev-btn-quiet" data-unmaster-subject="${s.id}">Reset ${s.name}</button>
            `
          )
          .join("")}
      </div>
    `
  ).join("");

  const bossRows = PLAYABLE_TESTS.map(
    ({ test, subjects }) => `
      <div class="dev-subgroup-label">${test.name}</div>
      <div class="dev-cheat-row">
        ${subjects
          .map(
            (s) => `
              <button class="dev-btn" data-boss-clear="${s.id}">Clear ${s.name} Boss</button>
              <button class="dev-btn dev-btn-quiet" data-boss-unclear="${s.id}">Unclear ${s.name} Boss</button>
            `
          )
          .join("")}
      </div>
    `
  ).join("");

  const homeState = gameState.homeState;
  const stateOptions = STATES.map((s) => `<option value="${s.abbr}" ${s.abbr === homeState ? "selected" : ""}>${s.name}</option>`).join("");

  const jumpButtons = JUMPS.map((j, i) => `<button class="dev-btn" data-jump="${i}">${j.label}</button>`).join("");

  return `
    <p class="dev-mode-subtitle">Drag the header to move this panel around. Everything below edits your save directly, for testing, not gameplay.</p>
    <p class="dev-mode-subtitle">🎬 Type <strong>TIK</strong> anywhere while this panel is open to jump into TikTok Mode — a vertical, recording-friendly single-question card for posting clips.</p>
    ${summaryHTML}

    <h3>Currency &amp; XP</h3>
    <div class="dev-cheat-row">
      <button class="dev-btn" data-cheat="coins-100">+100 🪙</button>
      <button class="dev-btn" data-cheat="coins-1000">+1000 🪙</button>
      <button class="dev-btn" data-cheat="stars-100">+100 ⭐</button>
      <button class="dev-btn" data-cheat="stars-1000">+1000 ⭐</button>
      <button class="dev-btn" data-cheat="xp-500">+500 XP</button>
      <button class="dev-btn" data-cheat="xp-5000">+5000 XP</button>
    </div>

    <h3>Overall Mastery / Evolution Stage</h3>
    <div class="dev-cheat-row">
      <button class="dev-btn" data-mastery="0">0%</button>
      <button class="dev-btn" data-mastery="0.26">26%</button>
      <button class="dev-btn" data-mastery="0.51">51%</button>
      <button class="dev-btn" data-mastery="0.76">76%</button>
      <button class="dev-btn" data-mastery="1">100%</button>
    </div>

    <h3>Master / Reset a Subject's Skills</h3>
    ${masterySubjectRows}

    <h3>Boss Quizzes</h3>
    ${bossRows}

    <h3>State Assessments</h3>
    <p class="dev-mode-subtitle">That planet's 100 subjects (50 states &times; ELA/Math) are all still content-free scaffolding — nothing there to master yet, so the only useful cheat is jumping straight past the state picker.</p>
    <div class="dev-cheat-row">
      <select id="devHomeStateSelect" class="dev-btn">${stateOptions}</select>
      <button class="dev-btn" data-set-home-state>Set Home State</button>
      <button class="dev-btn dev-btn-quiet" data-clear-home-state>Clear Home State</button>
    </div>
    <p class="dev-mode-subtitle">Current: ${homeState ? `<strong>${homeState}</strong>` : "none set (World Map redirects to the state picker)"}</p>

    <h3>Screen Jumper</h3>
    <div class="dev-cheat-row">${jumpButtons}</div>

    <h3>Reset / Seed Tools</h3>
    <div class="dev-cheat-row">
      <button class="dev-btn" data-seed-random>🎲 Seed Random Progress</button>
      <button class="dev-btn dev-btn-quiet" data-reset-all>Reset All Progress</button>
    </div>

    <h3>State Inspector <button class="dev-btn dev-btn-quiet" data-refresh-state>🔄 Refresh</button></h3>
    <pre class="dev-state-dump" id="devPanelStateDump">${JSON.stringify(gameState.data, null, 2)}</pre>
  `;
}

// The floating panel lives outside #app, so none of its actions trigger the
// SPA's normal re-render — the always-visible top HUD bar (coins, stars,
// level badge, monster) would otherwise go stale the moment a cheat button
// is clicked, even though the underlying save updated correctly. Patch it
// in place directly, the same way hint.js does for coin spends.
function syncHud() {
  const starEl = document.querySelector('.hud-stat[title="Stars"]');
  if (starEl) starEl.textContent = `⭐ ${gameState.totalStars}`;
  const coinEl = document.querySelector('.hud-stat[title="Coins"]');
  if (coinEl) coinEl.textContent = `🪙 ${gameState.coins}`;
  const avatarWrap = document.querySelector(".hud-avatar");
  if (avatarWrap) {
    avatarWrap.title = `Level ${gameState.level}`;
    avatarWrap.innerHTML = `${monsterSVG(gameState.getDisplayAvatar(), { size: 59 })}<span class="hud-level-badge">${gameState.level}</span>`;
  }
}

function render() {
  if (!panelEl) return;
  const body = panelEl.querySelector("#devPanelBody");
  body.innerHTML = buildBodyHTML();
  wireBody(body);
  syncHud();
}

function wireBody(body) {
  body.querySelectorAll("[data-cheat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [kind, amountStr] = btn.dataset.cheat.split("-");
      const amount = Number(amountStr);
      if (kind === "coins") gameState.cheatAddCoins(amount);
      else if (kind === "stars") gameState.cheatAddStars(amount);
      else if (kind === "xp") gameState.cheatAddXp(amount);
      render();
    });
  });

  body.querySelectorAll("[data-mastery]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.cheatSetOverallMasteryPct(Number(btn.dataset.mastery));
      render();
    });
  });

  body.querySelectorAll("[data-master-subject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.cheatSetSubjectMastered(btn.dataset.masterSubject, true);
      render();
    });
  });
  body.querySelectorAll("[data-unmaster-subject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.cheatSetSubjectMastered(btn.dataset.unmasterSubject, false);
      render();
    });
  });

  body.querySelectorAll("[data-boss-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.cheatSetBossCleared(btn.dataset.bossClear, true);
      render();
    });
  });
  body.querySelectorAll("[data-boss-unclear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.cheatSetBossCleared(btn.dataset.bossUnclear, false);
      render();
    });
  });

  body.querySelector("[data-set-home-state]").addEventListener("click", () => {
    const abbr = body.querySelector("#devHomeStateSelect").value;
    gameState.setHomeState(abbr);
    render();
  });
  body.querySelector("[data-clear-home-state]").addEventListener("click", () => {
    gameState.cheatClearHomeState();
    render();
  });

  body.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const jump = JUMPS[Number(btn.dataset.jump)];
      navigateRef?.(jump.screen, jump.params || {});
    });
  });

  body.querySelector("[data-seed-random]").addEventListener("click", () => {
    gameState.cheatSeedRandomProgress();
    render();
  });

  body.querySelector("[data-reset-all]").addEventListener("click", () => {
    if (confirm("Reset all progress, coins, and your monster's look? This can't be undone.")) {
      gameState.reset();
      navigateRef?.("avatarCreator", { onboarding: true });
      render();
    }
  });

  body.querySelector("[data-refresh-state]").addEventListener("click", () => {
    body.querySelector("#devPanelStateDump").textContent = JSON.stringify(gameState.data, null, 2);
  });
}

function wireDrag(header) {
  let dragging = false;
  let startLeft = 0;
  let startTop = 0;
  let startX = 0;
  let startY = 0;

  header.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    dragging = true;
    startLeft = panelEl.offsetLeft;
    startTop = panelEl.offsetTop;
    startX = e.clientX;
    startY = e.clientY;
    header.setPointerCapture(e.pointerId);
    panelEl.classList.add("is-dragging");
  });

  header.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const { x, y } = clampToViewport(startLeft + (e.clientX - startX), startTop + (e.clientY - startY));
    panelEl.style.left = `${x}px`;
    panelEl.style.top = `${y}px`;
  });

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    panelEl.classList.remove("is-dragging");
    savePosition(panelEl.offsetLeft, panelEl.offsetTop);
  };
  header.addEventListener("pointerup", stopDrag);
  header.addEventListener("pointercancel", stopDrag);
}

function createPanel() {
  panelEl = document.createElement("div");
  panelEl.id = "devPanel";
  panelEl.className = "dev-panel-float";

  const fallback = { x: Math.max(8, window.innerWidth - 380), y: 80 };
  const pos = loadPosition() || fallback;
  panelEl.style.left = `${pos.x}px`;
  panelEl.style.top = `${pos.y}px`;

  panelEl.innerHTML = `
    <div class="dev-panel-header" id="devPanelHeader">
      <span>🛠️ Developer Mode</span>
      <div class="dev-panel-header-actions">
        <button id="devPanelCollapseBtn" title="Collapse" aria-label="Collapse developer panel">▾</button>
        <button id="devPanelCloseBtn" title="Hide" aria-label="Hide developer panel">×</button>
      </div>
    </div>
    <div class="dev-panel-body" id="devPanelBody"></div>
  `;
  document.body.appendChild(panelEl);

  // Now that it's actually in the DOM (and has a real width), re-clamp in
  // case it was positioned from a save made at a different viewport size.
  const reclamped = clampToViewport(panelEl.offsetLeft, panelEl.offsetTop);
  panelEl.style.left = `${reclamped.x}px`;
  panelEl.style.top = `${reclamped.y}px`;

  render();
  wireDrag(panelEl.querySelector("#devPanelHeader"));

  panelEl.querySelector("#devPanelCollapseBtn").addEventListener("click", () => {
    collapsed = !collapsed;
    panelEl.querySelector("#devPanelBody").style.display = collapsed ? "none" : "block";
    panelEl.querySelector("#devPanelCollapseBtn").textContent = collapsed ? "▸" : "▾";
  });
  panelEl.querySelector("#devPanelCloseBtn").addEventListener("click", () => {
    panelEl.style.display = "none";
  });

  window.addEventListener("resize", () => {
    if (!panelEl) return;
    const { x, y } = clampToViewport(panelEl.offsetLeft, panelEl.offsetTop);
    panelEl.style.left = `${x}px`;
    panelEl.style.top = `${y}px`;
  });
}

/** Creates (if needed) and shows the floating panel. Call whenever dev mode
 * is unlocked or re-opened. */
export function showDevPanel(navigate) {
  if (navigate) navigateRef = navigate;
  if (!panelEl) createPanel();
  panelEl.style.display = "flex";
}

/** Shows/hides the panel (creating it first if it doesn't exist yet). */
export function toggleDevPanel(navigate) {
  if (navigate) navigateRef = navigate;
  if (!panelEl) {
    createPanel();
    return;
  }
  panelEl.style.display = panelEl.style.display === "none" ? "flex" : "none";
}

/** Mounts the panel at boot if dev mode was already unlocked in a previous
 * session, so it's there as soon as the page loads rather than only after
 * the next unlock tap sequence. */
export function ensureDevPanel(navigate) {
  if (navigate) navigateRef = navigate;
  if (!gameState.devModeUnlocked) return;
  if (!panelEl) createPanel();
}
