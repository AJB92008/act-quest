import { gameState } from "../state.js";
import { getCloudStatus, onCloudSyncChange, signUp, signIn, resolveConflict, retryCloudInit } from "../cloudSync.js";

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

// COPPA: creating an account collects an email address (personal
// information) from whoever fills out the form, so *creating* one is
// gated at 13+ — playing as a guest (no form, no email, just the
// anonymous Firebase uid initCloudSync() already set up silently) stays
// open to any age since it collects nothing personal. The birthdate itself
// is never sent anywhere or stored (not to Firestore, not to
// localStorage) — it only exists in memory long enough for this one
// client-side age check, so a signup attempt adds zero PII beyond the
// email/password already required.
function isAtLeast13(dateStr) {
  const dob = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 13;
}

export function renderAuthGate(root, navigate) {
  function cardInnerHTML() {
    const status = getCloudStatus();
    if (!status.ready) {
      if (status.initError) {
        return `
          <p class="lesson-paragraph">Couldn't reach cloud sync. Your progress still saves normally on this device.</p>
          <p class="backup-status is-error">${status.initError.message || "Connection failed."}</p>
          <div class="results-actions">
            <button class="btn-secondary" data-gate-retry>Try Again</button>
            <button class="btn-ghost" data-gate-skip-error>Continue without an account</button>
          </div>
        `;
      }
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
        <label class="visually-hidden" for="gateEmailInput">Email</label>
        <input type="email" id="gateEmailInput" name="email" placeholder="Email" required autocomplete="email" />
        <label class="visually-hidden" for="gatePasswordInput">Password (6+ characters)</label>
        <input type="password" id="gatePasswordInput" name="password" placeholder="Password (6+ characters)" required minlength="6" autocomplete="new-password" />
        <label class="visually-hidden" for="gateBirthdateInput">Birthdate (required to create an account — you must be 13 or older)</label>
        <input type="date" id="gateBirthdateInput" name="birthdate" placeholder="Birthdate" autocomplete="bday" max="${new Date().toISOString().slice(0, 10)}" />
        <p class="auth-gate-hint">You must be 13 or older to create an account. Younger players can still play as a guest below.</p>
        <div class="results-actions">
          <button type="submit" class="btn-primary" data-gate-action="signUp">Create Account</button>
          <button type="button" class="btn-secondary" data-gate-action="signIn">I Already Have One</button>
        </div>
      </form>
      <p class="backup-status" id="gateAuthStatus" hidden></p>
      <button class="btn-ghost" data-gate-skip>Skip for now</button>
      <p class="auth-gate-legal">By creating an account you agree to our <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a> and <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</p>
    `;
  }

  function wireCard(container) {
    const retryBtn = container.querySelector("[data-gate-retry]");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => retryCloudInit());
      container.querySelector("[data-gate-skip-error]").addEventListener("click", () => {
        navigate("avatarCreator", { onboarding: true });
      });
      return;
    }
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
      if (action === "signUp" && !isAtLeast13(form.birthdate.value)) {
        status.hidden = false;
        status.className = "backup-status is-error";
        status.textContent = "You must be 13 or older to create an account. Use “Skip for now” to play as a guest instead.";
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
      <h1>Welcome to PrepQuest!</h1>
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
