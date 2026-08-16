// Cloud sync via Firebase (Auth + Firestore) — a stopgap "account system"
// layered on top of the existing localStorage save, not a replacement for
// it. localStorage stays the source of truth for gameplay reads/writes
// (see state.js); this module only pushes a copy to Firestore after every
// save and pulls it back down when a player signs in on a new device.
//
// Every visitor gets a Firebase anonymous account automatically on first
// load, so sync starts working before anyone creates a real account. Email/
// password sign-up "upgrades" that anonymous account in place (via
// linkWithCredential) so its uid — and whatever's already synced under it —
// carries over, rather than starting a fresh, disconnected account.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { gameState } from "./state.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9b9j6359BjKqHDc2V7Am-DPtI0LP6FUw",
  authDomain: "act-quest.firebaseapp.com",
  projectId: "act-quest",
  storageBucket: "act-quest.firebasestorage.app",
  messagingSenderId: "455348497948",
  appId: "1:455348497948:web:54e30f004aaa35e3aff9d9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tracks the newest cloud `updatedAt` this device has actually seen/applied
// (distinct from gameState.data itself, so it never gets swept into the
// synced payload). Lets a normal same-device reload skip the "which copy
// do you want?" prompt — it's only shown when the cloud has moved on
// without this device knowing, i.e. a genuine second-device conflict.
const REMOTE_MARKER_KEY = "act-quest-last-known-remote-update";

let currentUser = null;
let pendingConflict = null; // { remoteData, remoteUpdatedAt } while awaiting the player's choice
let isSyncing = false;
let pushTimer = null;
let unsubscribeSave = null;
const listeners = new Set();
// Set whenever the anonymous sign-in every visitor gets automatically (or
// the auth listener itself) fails — a blocked network request, an
// over-restricted API key, Anonymous auth disabled in the Firebase
// console, etc. Without this, `ready` (currentUser !== null) never
// becomes true and both the auth gate and the dashboard's Cloud Account
// card are stuck showing "Connecting…" forever, with no way for the
// player to even continue as a guest — see getCloudStatus()/retryCloudInit().
let initError = null;

function notify() {
  const status = getCloudStatus();
  listeners.forEach((cb) => cb(status));
}

/** Subscribes to cloud-sync status changes (sign-in state, pending
 * conflicts). Returns an unsubscribe function. */
export function onCloudSyncChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCloudStatus() {
  return {
    ready: currentUser !== null,
    signedIn: !!currentUser && !currentUser.isAnonymous,
    email: currentUser?.email ?? null,
    conflict: pendingConflict,
    // True from the moment a user is authenticated until the initial
    // Firestore pull (and any resulting import/push) has actually
    // settled. Callers that route based on signedIn — the auth gate,
    // notably — need to wait for this to clear first: `signedIn` alone
    // flips true before gameState has had a chance to absorb a pulled
    // remote save, which previously sent brand-new devices straight to
    // avatar creation instead of the account's real, already-onboarded data.
    syncing: isSyncing,
    // Set when the automatic anonymous sign-in (or the auth listener
    // itself) failed and `ready` is never going to become true on its
    // own. Callers should offer a way past "Connecting…" once this is
    // set, not keep showing it indefinitely.
    initError,
  };
}

/** Re-attempts the automatic anonymous sign-in after initCloudSync()'s
 * first try failed — offered to the player as "Retry" wherever
 * `status.initError` is shown, rather than requiring a full page reload. */
export function retryCloudInit() {
  initError = null;
  notify();
  signInAnonymously(auth).catch((err) => {
    console.error("Anonymous sign-in retry failed:", err);
    initError = err;
    notify();
  });
}

function saveDocRef(uid) {
  return doc(db, "saves", uid);
}

async function pushNow() {
  if (!currentUser) return;
  const updatedAt = Date.now();
  await setDoc(saveDocRef(currentUser.uid), { data: gameState.data, updatedAt });
  localStorage.setItem(REMOTE_MARKER_KEY, String(updatedAt));
}

function scheduleSync() {
  if (!currentUser || pendingConflict) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushNow().catch((err) => console.error("Cloud sync push failed:", err));
  }, 1500);
}

async function handleSignedIn(user) {
  currentUser = user;
  isSyncing = true;
  // Notify immediately once authenticated, before the Firestore round-trip
  // below — otherwise a Firestore-side failure (bad rules, no network)
  // leaves the dashboard's cloud card stuck on "Connecting…" forever,
  // since the only other notify() calls are past that await. `syncing`
  // stays true through this whole call, though, so callers that route
  // based on `signedIn` (the auth gate) know not to act on this first
  // notification alone.
  notify();
  if (!unsubscribeSave) unsubscribeSave = gameState.onSave(scheduleSync);

  try {
    const snap = await getDoc(saveDocRef(user.uid));
    if (!snap.exists()) {
      await pushNow();
      return;
    }

    const remote = snap.data();
    const lastKnown = Number(localStorage.getItem(REMOTE_MARKER_KEY) || 0);
    const remoteChangedElsewhere = remote.updatedAt > lastKnown;
    const remoteDiffersFromLocal = JSON.stringify(remote.data) !== JSON.stringify(gameState.data);
    // A local save that hasn't been onboarded yet (no monster made, nothing
    // played) has nothing worth protecting — this is the common "signing
    // into an existing account on a brand-new device" case, most notably
    // right at the auth gate before onboarding. Adopt the remote save
    // outright instead of interrupting a first-time sign-in with a choice
    // that isn't really a choice.
    const localHasProgress = gameState.data.onboarded;

    if (remoteChangedElsewhere && remoteDiffersFromLocal && localHasProgress) {
      pendingConflict = { remoteData: remote.data, remoteUpdatedAt: remote.updatedAt };
    } else {
      if (remoteDiffersFromLocal && !localHasProgress) {
        gameState.importSave(JSON.stringify(remote.data));
      }
      localStorage.setItem(REMOTE_MARKER_KEY, String(remote.updatedAt));
      await pushNow();
    }
  } finally {
    isSyncing = false;
    notify();
  }
}

/** Resolves a pending cloud/local conflict per the player's explicit
 * choice — there's no automatic merge (skill progress, SRS timers, and
 * question stats are all deeply nested and order-sensitive enough that a
 * silent field-by-field merge would be more likely to corrupt progress
 * than help). `choice` is "useCloud" or "keepLocal". */
export function resolveConflict(choice) {
  if (!pendingConflict) return;
  const { remoteData, remoteUpdatedAt } = pendingConflict;
  if (choice === "useCloud") {
    gameState.importSave(JSON.stringify(remoteData));
    localStorage.setItem(REMOTE_MARKER_KEY, String(remoteUpdatedAt));
  } else {
    pushNow().catch((err) => console.error("Cloud sync push failed:", err));
  }
  pendingConflict = null;
  notify();
}

// signUp/signIn call handleSignedIn directly rather than waiting on
// onAuthStateChanged: linkWithCredential (the anonymous-account upgrade
// path below) keeps the same uid/session, so Firebase doesn't reliably
// re-fire that listener for it, which left the dashboard's cloud card
// stuck showing "Working…" after a successful sign-up. Calling it
// explicitly here works for all three paths (link, create, sign-in) and
// is harmless if onAuthStateChanged also happens to fire — handleSignedIn
// just re-checks the same doc.
export async function signUp(email, password) {
  if (currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(currentUser, credential);
    await handleSignedIn(result.user);
    return result.user;
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await handleSignedIn(result.user);
  return result.user;
}

export async function signIn(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await handleSignedIn(result.user);
  return result.user;
}

export async function signOutCloud() {
  if (unsubscribeSave) {
    unsubscribeSave();
    unsubscribeSave = null;
  }
  clearTimeout(pushTimer);
  pendingConflict = null;
  await firebaseSignOut(auth);
  currentUser = null;
  notify();
  // Immediately re-establish an anonymous session so sync keeps working on
  // this device without requiring the player to sign back in.
  signInAnonymously(auth).catch((err) => console.error("Anonymous sign-in failed:", err));
}

/** Call once at app startup. */
export function initCloudSync() {
  // Belt-and-suspenders against every failure mode leaving `ready` stuck
  // false forever with nothing telling the player why: if neither a real
  // auth state nor an explicit error has arrived within a few seconds
  // (blocked network request, an over-restricted API key, etc.), treat
  // that itself as an error rather than spinning indefinitely.
  const readyTimeout = setTimeout(() => {
    if (currentUser === null && !initError) {
      initError = new Error("Cloud sync is taking longer than expected — check your connection, or continue without an account.");
      notify();
    }
  }, 8000);

  onAuthStateChanged(
    auth,
    (user) => {
      clearTimeout(readyTimeout);
      if (user) {
        handleSignedIn(user).catch((err) => {
          console.error("Cloud sync init failed:", err);
          initError = err;
          notify();
        });
      } else {
        currentUser = null;
        notify();
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
          initError = err;
          notify();
        });
      }
    },
    (err) => {
      // onAuthStateChanged's own error path — fires if Auth can't even
      // determine a signed-in/signed-out state (e.g. the request that
      // would answer that is what's actually blocked).
      clearTimeout(readyTimeout);
      console.error("Auth state listener failed:", err);
      initError = err;
      notify();
    }
  );
}
