import { gameState } from "../state.js";
import { getCloudStatus, onCloudSyncChange, signUp, signIn, resolveConflict } from "../cloudSync.js";

// Shown before onboarding (avatar creation) so a player either has an
// account backing up their progress from the very first monster they make,
// or explicitly chooses to skip and play as a guest — rather than silently
// defaulting to guest play the way the app used to. Once onboarding is
// done (gameState.data.onboarded), main.js never routes back through this
// screen again; an account can still be created later from the dashboard's
// Cloud Account card either way.
function cloudErrorMessage(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return `That email already has an account. Try "I Already Have One" instead.`;
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("weak-password")) return "Password is too weak. Use at least 6 characters.";
  if (code.includes("invalid-email")) return "That doesn't look like a valid email address.";
  return "Something went wrong. Please try again.";
}

function nextScreenAfterGate(navigate) {
  if (gameState.data.onboarded) navigate("map");
  else navigate("avatarCreator", { onboarding: true });
}

export function renderAuthGate(root, navigate) {
  function cardInnerHTML() {
    const status = getCloudStatus();
    if (!status.ready) {
      return `<p class="lesson-paragraph">Connecting…</p>`;
    }
    if (status.conflict) {
      const date = new Date(status.conflict.remoteUpdatedAt).toLocaleString();
      return `
        <p class="lesson-paragraph">Found saved progress on this account from <strong>${date}</strong> that's different from what's on this device.</p>
        <div class="results-actions">
          <button class="btn-secondary" data-cloud-use-remote>⬇️ Load That Progress</button>
          <button class="btn-secondary" data-cloud-keep-local>💾 Keep This Device's Progress</button>
        </div>
        <p class="backup-status is-error">Choosing one replaces the other. There's no automatic merge.</p>
      `;
    }
    if (status.signedIn) {
      return `<p class="lesson-paragraph">Signed in as <strong>${status.email}</strong>. ${status.syncing ? "Syncing your progress…" : "Continuing…"}</p>`;
    }
    return `
      <form class="cloud-auth-form" data-gate-form>
        <input type="email" name="email" placeholder="Email" required autocomplete="email" />
        <input type="password" name="password" placeholder="Password (6+ characters)" required minlength="6" autocomplete="new-password" />
        <div class="results-actions">
          <button type="submit" class="btn-primary" data-gate-action="signUp">Create Account</button>
          <button type="button" class="btn-secondary" data-gate-action="signIn">I Already Have One</button>
        </div>
      </form>
      <p class="backup-status" id="gateAuthStatus" hidden></p>
      <button class="btn-ghost" data-gate-skip>Skip for now</button>
    `;
  }

  function wireCard(container) {
    const useRemoteBtn = container.querySelector("[data-cloud-use-remote]");
    if (useRemoteBtn) {
      // resolveConflict() triggers notify() internally, which re-renders
      // this card via the onCloudSyncChange subscription below — that
      // re-render is what actually routes onward (status.signedIn branch),
      // so no need to navigate again here.
      useRemoteBtn.addEventListener("click", () => resolveConflict("useCloud"));
      container.querySelector("[data-cloud-keep-local]").addEventListener("click", () => resolveConflict("keepLocal"));
      return;
    }
    // Wait for `syncing` to clear before routing onward — `signedIn` alone
    // flips true as soon as auth resolves, before the Firestore pull (and
    // any resulting import of a remote save) has actually finished; acting
    // on it immediately previously sent accounts with real cloud progress
    // straight to avatar creation instead of their already-onboarded map.
    const cloudStatus = getCloudStatus();
    if (cloudStatus.signedIn && !cloudStatus.syncing) {
      nextScreenAfterGate(navigate);
      return;
    }
    const form = container.querySelector("[data-gate-form]");
    if (!form) return;
    const status = container.querySelector("#gateAuthStatus");
    const runAuth = async (action) => {
      const email = form.email.value.trim();
      const password = form.password.value;
      if (!email || password.length < 6) {
        status.hidden = false;
        status.className = "backup-status is-error";
        status.textContent = "Enter a valid email and a password of at least 6 characters.";
        return;
      }
      status.hidden = false;
      status.className = "backup-status";
      status.textContent = "Working…";
      try {
        if (action === "signUp") await signUp(email, password);
        else await signIn(email, password);
        // onCloudSyncChange re-renders this card; wireCard() then routes
        // onward once status.signedIn is true (or shows a conflict).
      } catch (err) {
        status.className = "backup-status is-error";
        status.textContent = cloudErrorMessage(err);
      }
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runAuth("signUp");
    });
    container.querySelector('[data-gate-action="signIn"]').addEventListener("click", () => runAuth("signIn"));
    container.querySelector("[data-gate-skip]").addEventListener("click", () => {
      navigate("avatarCreator", { onboarding: true });
    });
  }

  root.innerHTML = `
    <main class="screen avatar-screen auth-gate-screen">
      <h1>Welcome to Acto's ACT Quest!</h1>
      <p class="avatar-subtitle">Create a free account so your monster and progress can follow you to any device, or skip for now and play as a guest.</p>
      <div class="dash-history-card auth-gate-card" data-gate-card></div>
    </main>
  `;

  const container = root.querySelector("[data-gate-card]");
  const renderCard = () => {
    if (!container.isConnected) {
      unsubscribe();
      return;
    }
    container.innerHTML = cardInnerHTML();
    wireCard(container);
  };
  const unsubscribe = onCloudSyncChange(renderCard);
  renderCard();
}
