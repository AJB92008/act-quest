// The app's own release counter — shown in Developer Mode so a build can
// be identified at a glance. Distinct from package.json's own "version"
// field (that one exists only for the CI test-runner's tooling, per its
// own description, and isn't meant to track releases). Bumped
// automatically by .githooks/pre-commit on every commit to main — never
// hand-edit this file, the hook overwrites it (see that script, and the
// "Versioning" section in README.md for the one-time local setup it
// needs).
export const APP_VERSION = "1.137";
