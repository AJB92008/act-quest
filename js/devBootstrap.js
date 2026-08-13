// A URL-query-param bootstrap for fast manual (and automated) testing —
// sets up a specific game state and jumps straight to a chosen screen in
// one page load, instead of the usual "open the console, import state.js,
// call a handful of cheats, click through several screens to reach the one
// you actually want to look at" dance. Only runs when the URL has
// `?dev=1`, so a normal player following any old shared link is never
// affected. This doesn't add any capability a curious player couldn't
// already reach via devtools/localStorage — it's purely a shortcut to
// what's already there, for faster iteration during development.
//
// Recognized params (all optional except dev=1):
//   dev=1              required to activate anything below
//   reset=1            gameState.reset() first, before anything else
//   onboarded=1        skip onboarding (name defaults to "Tester")
//   name=X             player name (implies onboarded=1)
//   xp=N               cheatAddXp(N)
//   coins=N            cheatAddCoins(N)
//   stars=N            cheatAddStars(N)
//   mastered=a,b,c     cheatSetSubjectMastered(true) for each listed subject id
//   screen=X           navigate here instead of the normal map/onboarding route
//   subjectId=X        forwarded to screens that need one (island, bossQuiz)
//   skillId=X          forwarded to screens that need one (quiz, skillPath)
//   lessonIndex=N      forwarded to quiz
//
// Example — jump straight into a Math lesson with English already
// mastered and level pushed up via xp:
//   /?dev=1&onboarded=1&xp=2000&mastered=english&screen=island&subjectId=math
export function runDevBootstrap(gameState) {
  const params = new URLSearchParams(location.search);
  if (params.get("dev") !== "1") return null;

  if (params.get("reset") === "1") gameState.reset();

  const name = params.get("name");
  if (name || params.get("onboarded") === "1") {
    gameState.setName(name || gameState.data.createdName || "Tester");
    gameState.data.onboarded = true;
  }

  const xp = Number(params.get("xp"));
  if (xp) gameState.cheatAddXp(xp);

  const coins = Number(params.get("coins"));
  if (coins) gameState.cheatAddCoins(coins);

  const stars = Number(params.get("stars"));
  if (stars) gameState.cheatAddStars(stars);

  const mastered = params.get("mastered");
  if (mastered) {
    mastered
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((subjectId) => gameState.cheatSetSubjectMastered(subjectId, true));
  }

  gameState.save();

  const screen = params.get("screen");
  if (!screen) return null;

  const screenParams = {};
  for (const key of ["subjectId", "skillId", "onboarding"]) {
    if (params.has(key)) screenParams[key] = params.get(key);
  }
  if (params.has("lessonIndex")) screenParams.lessonIndex = Number(params.get("lessonIndex"));

  return { screen, params: screenParams };
}
