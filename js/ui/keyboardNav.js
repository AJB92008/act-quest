// Keyboard shortcuts shared by every quiz-taking screen: keys 1-4 pick a
// choice, Enter advances (clicks whatever "next" control is on screen).
//
// Every screen re-renders its whole question via innerHTML on each question
// and holds no persistent DOM, so the listener has to live on `document`
// rather than a page element. Returns an unbind function — callers MUST
// call it before binding a new one for the next question, and whenever
// they navigate away, or the listener leaks onto unrelated screens.
export function bindQuizKeys({ onChoice, onNext }) {
  const handler = (e) => {
    if (e.key >= "1" && e.key <= "4") {
      onChoice?.(Number(e.key) - 1);
    } else if (e.key === "Enter") {
      onNext?.();
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
