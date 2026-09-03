// TikTok-Mode-only "greatly improved" explanations — natural, step-by-step,
// spoken-friendly narration written to be read aloud by TikTok Mode's TTS
// voice (see ui/tiktokMode.js), layered on top of — never replacing — the
// real question banks used by lessons/quizzes/boss quizzes elsewhere in
// the app. Every entry here carries the exact same math as the base
// bank's own `explain` field (js/data/questions/<file>.js); this only
// changes how it's explained out loud, never the answer or the numbers.
// Keyed by skill id -> array index within that skill's question bank,
// matching bank order position-for-position. A skill/index with no entry
// here just falls back to the base bank's own `explain` — see
// tiktokMode.js's `explainFor()`.
export const TIKTOK_EXPLANATIONS = {
  "ma-linear": [
    // 0: Solve for x: 3x + 7 = 22
    "First, get the x term alone: subtract 7 from both sides, so 3x equals 15. Then divide both sides by 3, and you're left with x equals 5.",
    // 1: Solve for x: 2(x - 4) = 3x + 1
    "Distribute the 2 first: 2x minus 8 equals 3x plus 1. Now gather the x's on one side and the numbers on the other — subtracting 2x and 1 from both sides gives negative 9 equals x.",
    // 2: Which value of x satisfies 5x - 3 < 2x + 9?
    "Move the x's to one side and the numbers to the other: subtract 2x and add 3 to both sides, and you get 3x is less than 12. Divide by 3 — since that's a positive number, the inequality doesn't flip — and x is less than 4. The only choice under 4 is x equals 3.",
    // 3: If y = 2x - 3, what is y when x = 5?
    "Just plug in 5 for x: 2 times 5 is 10, minus 3 leaves 7.",
    // 4: A line passes through (0, 4) and (2, 10). What is its slope?
    "Slope is rise over run: the y-values go from 4 to 10, a rise of 6, while x goes from 0 to 2, a run of 2. 6 divided by 2 gives a slope of 3.",
    // 5: slope -2 through (0, 5)
    "Slope-intercept form is y equals m x plus b, where m is the slope and b is the y-intercept. Here the slope is negative 2 and the line crosses the y-axis at 5, so the equation is y equals negative 2x plus 5.",
    // 6: Solve for x: (x + 3)/2 = 4
    "Clear the fraction first by multiplying both sides by 2: x plus 3 equals 8. Subtract 3, and x equals 5.",
    // 7: If 4x + 2y = 12 and x = 1, what is y?
    "Substitute x equals 1: 4 times 1 is 4, so 4 plus 2y equals 12. Subtract 4 to get 2y equals 8, then divide by 2 — y equals 4.",
    // 8: Solve for x: 4x - 9 = 2x + 11
    "Subtract 2x from both sides to gather the x's: 2x minus 9 equals 11. Add 9 to both sides — 2x equals 20 — then divide by 2 to get x equals 10.",
    // 9: Solve for x: 7 - 2x = 3x - 8
    "Add 2x to both sides and add 8 to both sides to collect everything: 15 equals 5x. Divide by 5, and x equals 3.",
    // 10: Which value of x satisfies 3x + 4 > 5x - 2?
    "Subtract 3x and add 2 to both sides: 6 is greater than 2x. Divide by 2 — a positive number, so the direction stays the same — and x is less than 3. Only x equals 1 fits that.",
    // 11: If y = -3x + 7, what is y when x = -2?
    "Plug in negative 2 for x: negative 3 times negative 2 is positive 6, and 6 plus 7 is 13.",
    // 12: slope through (-1, -2) and (3, 10)
    "Subtract the y-values: 10 minus negative 2 is 12. Subtract the x-values: 3 minus negative 1 is 4. 12 divided by 4 gives a slope of 3.",
    // 13: slope 4 through (0, -3)
    "The slope is 4 and the y-intercept is negative 3, so drop them straight into y equals m x plus b: y equals 4x minus 3.",
    // 14: Solve for x: (2x - 5)/3 = 7
    "Multiply both sides by 3 to clear the fraction: 2x minus 5 equals 21. Add 5 to get 2x equals 26, then divide by 2 — x equals 13.",
    // 15: Solve for x: 5x - 8 = 27
    "Add 8 to both sides: 5x equals 35. Divide by 5, and x equals 7.",
    // 16: Solve for x: 3(2x + 1) = 5x + 10
    "Distribute the 3: 6x plus 3 equals 5x plus 10. Subtract 5x and 3 from both sides, and you're left with x equals 7.",
    // 17: Which value of x satisfies 4x + 5 ≤ 2x + 17?
    "Subtract 2x and 5 from both sides: 2x is less than or equal to 12. Divide by 2, and x is less than or equal to 6 — which matches the choice x equals 6 exactly.",
    // 18: If y = -4x + 9, what is y when x = 3?
    "Substitute 3 for x: negative 4 times 3 is negative 12, and negative 12 plus 9 is negative 3.",
    // 19: slope through (1, 2) and (5, 14)
    "The y-values rise from 2 to 14, a change of 12. The x-values run from 1 to 5, a change of 4. 12 over 4 is a slope of 3.",
    // 20: slope 5 through (0, -2)
    "Slope 5, y-intercept negative 2 — plug those straight into y equals m x plus b to get y equals 5x minus 2.",
    // 21: Solve for x: (3x - 6)/3 = 5
    "Multiply both sides by 3 first: 3x minus 6 equals 15. Add 6 to get 3x equals 21, then divide by 3 — x equals 7.",
    // 22: If 3x + 5y = 20 and x = 5, what is y?
    "Plug in x equals 5: 3 times 5 is 15, so 15 plus 5y equals 20. Subtract 15 to get 5y equals 5, then divide by 5 — y equals 1.",
    // 23: Solve for x: 9x - 4 = 5x + 20
    "Subtract 5x and add 4 to both sides: 4x equals 24. Divide by 4, and x equals 6.",
    // 24: Solve for x: 10 - 3x = 4x - 4
    "Add 3x and 4 to both sides to gather everything: 14 equals 7x. Divide by 7, and x equals 2.",
    // 25: Solve for x: 6x - 11 = 25
    "Add 11 to both sides: 6x equals 36. Divide by 6, and x equals 6.",
    // 26: Solve for x: 3(x + 5) = 2x + 21
    "Distribute the 3: 3x plus 15 equals 2x plus 21. Subtract 2x and 15 from both sides, and x equals 6.",
    // 27: Which value of x satisfies 2x + 9 > 5x - 6?
    "Subtract 2x and add 6 to both sides: 15 is greater than 3x. Divide by 3, and x is less than 5 — the only choice below 5 is x equals 4.",
    // 28: If y = 5x + 2, what is y when x = -3?
    "Plug in negative 3: 5 times negative 3 is negative 15, and negative 15 plus 2 is negative 13.",
    // 29: slope through (1, 5) and (4, 17)
    "The y-values go from 5 to 17, up 12. The x-values go from 1 to 4, over 3. 12 divided by 3 gives a slope of 4.",
    // 30: slope -3 through (0, 8)
    "Slope negative 3 and y-intercept 8 slot directly into y equals m x plus b, giving y equals negative 3x plus 8.",
    // 31: Solve for x: (x - 2)/5 = 3
    "Multiply both sides by 5: x minus 2 equals 15. Add 2, and x equals 17.",
    // 32: If 3x + 4y = 24 and x = 4, what is y?
    "Substitute x equals 4: 3 times 4 is 12, so 12 plus 4y equals 24. Subtract 12 to get 4y equals 12, then divide by 4 — y equals 3.",
    // 33: Solve for x: 6x - 5 = 3x + 16
    "Subtract 3x and add 5 to both sides: 3x equals 21. Divide by 3, and x equals 7.",
    // 34: Solve for x: 9 - 4x = 2x - 9
    "Add 4x and 9 to both sides: 18 equals 6x. Divide by 6, and x equals 3.",
    // 35: Which value of x satisfies 4x - 3 < 7x + 9?
    "Subtract 4x and 9 from both sides: negative 12 is less than 3x. Divide by 3, and negative 4 is less than x — meaning x is greater than negative 4. The only choice above that is x equals negative 3.",
    // 36: If y = -2x + 9, what is y when x = 4?
    "Plug in 4: negative 2 times 4 is negative 8, and negative 8 plus 9 is 1.",
    // 37: slope through (-3, -5) and (1, 3)
    "The y-values run from negative 5 to 3, a change of 8. The x-values run from negative 3 to 1, a change of 4. 8 over 4 gives a slope of 2.",
    // 38: slope 6 through (0, -4)
    "With slope 6 and y-intercept negative 4, y equals m x plus b becomes y equals 6x minus 4.",
    // 39: Solve for x: (4x + 1)/3 = 7
    "Multiply both sides by 3: 4x plus 1 equals 21. Subtract 1 to get 4x equals 20, then divide by 4 — x equals 5.",
    // 40: Solve for x: 7x - 12 = 30
    "Add 12 to both sides: 7x equals 42. Divide by 7, and x equals 6.",
    // 41: Solve for x: 4(2x - 1) = 5x + 8
    "Distribute the 4: 8x minus 4 equals 5x plus 8. Subtract 5x and add 4 to both sides, and 3x equals 12 — so x equals 4.",
    // 42: Which value of x satisfies 5x + 7 ≥ 2x + 22?
    "Subtract 2x and 7 from both sides: 3x is greater than or equal to 15. Divide by 3, and x is greater than or equal to 5 — exactly matching x equals 5.",
    // 43: If y = -5x + 14, what is y when x = 2?
    "Plug in 2: negative 5 times 2 is negative 10, and negative 10 plus 14 is 4.",
    // 44: slope through (2, -1) and (6, 11)
    "The y-values climb from negative 1 to 11, a rise of 12. The x-values run from 2 to 6, a run of 4. 12 over 4 is a slope of 3.",
    // 45: slope -7 through (0, 3)
    "Slope negative 7, y-intercept 3 — straight into y equals m x plus b gives y equals negative 7x plus 3.",
    // 46: Solve for x: (3x - 9)/6 = 2
    "Multiply both sides by 6: 3x minus 9 equals 12. Add 9 to get 3x equals 21, then divide by 3 — x equals 7.",
    // 47: If 2x + 5y = 29 and x = 2, what is y?
    "Substitute x equals 2: 2 times 2 is 4, so 4 plus 5y equals 29. Subtract 4 to get 5y equals 25, then divide by 5 — y equals 5.",
    // 48: Solve for x: 8x - 3 = 5x + 18
    "Subtract 5x and add 3 to both sides: 3x equals 21. Divide by 3, and x equals 7.",
    // 49: Solve for x: 11 - 2x = 5x - 3
    "Add 2x and 3 to both sides: 14 equals 7x. Divide by 7, and x equals 2.",
    // 50: Solve for x: 4x + 11 = 39
    "Subtract 11 from both sides: 4x equals 28. Divide by 4, and x equals 7.",
    // 51: Solve for x: 6x - 5 = 37
    "Add 5 to both sides: 6x equals 42. Divide by 6, and x equals 7.",
    // 52: Solve for x: 9x + 14 = 77
    "Subtract 14 from both sides: 9x equals 63. Divide by 9, and x equals 7.",
    // 53: Solve for x: 3x - 8 = 22
    "Add 8 to both sides: 3x equals 30. Divide by 3, and x equals 10.",
    // 54: Solve for x: 7x + 19 = 61
    "Subtract 19 from both sides: 7x equals 42. Divide by 7, and x equals 6.",
    // 55: Solve for x: 8x - 13 = 51
    "Add 13 to both sides: 8x equals 64. Divide by 8, and x equals 8.",
    // 56: Solve for x: 5x + 3 = 2x + 15
    "Subtract 2x and 3 from both sides: 3x equals 12. Divide by 3, and x equals 4.",
    // 57: Solve for x: 6x - 4 = 3x + 11
    "Subtract 3x and add 4 to both sides: 3x equals 15. Divide by 3, and x equals 5.",
    // 58: Solve for x: 7x + 2 = 4x + 20
    "Subtract 4x and 2 from both sides: 3x equals 18. Divide by 3, and x equals 6.",
    // 59: Solve for x: 8x - 7 = 3x + 13
    "Subtract 3x and add 7 to both sides: 5x equals 20. Divide by 5, and x equals 4.",
    // 60: Solve for x: 9x + 5 = 4x + 25
    "Subtract 4x and 5 from both sides: 5x equals 20. Divide by 5, and x equals 4.",
    // 61: Solve for x: 6x - 9 = 2x + 15
    "Subtract 2x and add 9 to both sides: 4x equals 24. Divide by 4, and x equals 6.",
    // 62: Solve for x: 3(x + 4) = 2x + 17
    "Distribute the 3: 3x plus 12 equals 2x plus 17. Subtract 2x and 12 from both sides, and x equals 5.",
    // 63: Solve for x: 2(x - 5) = 3x + 4
    "Distribute the 2: 2x minus 10 equals 3x plus 4. Subtract 2x and 4 from both sides, and negative 14 equals x.",
    // 64: Solve for x: 4(x + 3) = 2x + 22
    "Distribute the 4: 4x plus 12 equals 2x plus 22. Subtract 2x and 12 from both sides, and 2x equals 10 — so x equals 5.",
    // 65: Solve for x: 5(x - 2) = 3x - 4
    "Distribute the 5: 5x minus 10 equals 3x minus 4. Subtract 3x and add 10 to both sides, and 2x equals 6 — so x equals 3.",
    // 66: Solve for x: 3(x + 7) = 2x + 25
    "Distribute the 3: 3x plus 21 equals 2x plus 25. Subtract 2x and 21 from both sides, and x equals 4.",
    // 67: Solve for x: 6(x - 1) = 4x + 9
    "Distribute the 6: 6x minus 6 equals 4x plus 9. Subtract 4x and add 6 to both sides, and 2x equals 15 — so x equals 15 over 2.",
    // 68: Which value of x satisfies 6x + 1 < 3x + 19?
    "Subtract 3x and 1 from both sides: 3x is less than 18. Divide by 3, and x is less than 6 — only x equals 4 fits.",
    // 69: Which value of x satisfies 7x + 4 > 3x - 8?
    "Subtract 3x and 4 from both sides: 4x is greater than negative 12. Divide by 4, and x is greater than negative 3 — only x equals negative 2 fits.",
    // 70: Which value of x satisfies 5x - 3 < 2x + 15?
    "Subtract 2x and add 3 to both sides: 3x is less than 18. Divide by 3, and x is less than 6 — only x equals 4 works.",
    // 71: Which value of x satisfies 7x + 4 ≤ 3x + 28?
    "Subtract 3x and 4 from both sides: 4x is less than or equal to 24. Divide by 4, and x is less than or equal to 6 — x equals 4 satisfies that.",
    // 72: Which value of x satisfies 8x - 6 ≥ 5x + 9?
    "Subtract 5x and add 6 to both sides: 3x is greater than or equal to 15. Divide by 3, and x is greater than or equal to 5 — matching x equals 5 exactly.",
    // 73: Which value of x satisfies 9x - 3 > 6x - 3?
    "Subtract 6x and add 3 to both sides: 3x is greater than 0. Divide by 3, and x is greater than 0 — the only positive choice is x equals 1.",
    // 74: If y = 3x - 8, what is y when x = 6?
    "Plug in 6: 3 times 6 is 18, and 18 minus 8 is 10.",
    // 75: If y = -4x + 11, what is y when x = 3?
    "Plug in 3: negative 4 times 3 is negative 12, and negative 12 plus 11 is negative 1.",
    // 76: If y = 5x - 2, what is y when x = -3?
    "Plug in negative 3: 5 times negative 3 is negative 15, and negative 15 minus 2 is negative 17.",
    // 77: If y = -2x + 7, what is y when x = 5?
    "Plug in 5: negative 2 times 5 is negative 10, and negative 10 plus 7 is negative 3.",
    // 78: If y = 6x + 1, what is y when x = -4?
    "Plug in negative 4: 6 times negative 4 is negative 24, and negative 24 plus 1 is negative 23.",
    // 79: If y = -5x - 3, what is y when x = -2?
    "Plug in negative 2: negative 5 times negative 2 is positive 10, and 10 minus 3 is 7.",
    // 80: slope through (0, 3) and (4, 19)
    "The y-values rise from 3 to 19, a change of 16. The x-values run from 0 to 4, a change of 4. 16 divided by 4 gives a slope of 4.",
    // 81: slope through (-2, -6) and (2, 10)
    "The y-values go from negative 6 to 10, a rise of 16. The x-values go from negative 2 to 2, a run of 4. 16 over 4 is a slope of 4.",
    // 82: slope through (1, 4) and (6, 29)
    "The y-values climb from 4 to 29, a rise of 25. The x-values run from 1 to 6, a run of 5. 25 divided by 5 gives a slope of 5.",
    // 83: slope through (-3, 8) and (1, -4)
    "The y-values fall from 8 to negative 4, a change of negative 12. The x-values run from negative 3 to 1, a change of 4. Negative 12 over 4 gives a slope of negative 3.",
    // 84: slope through (2, 1) and (7, 26)
    "The y-values rise from 1 to 26, a change of 25. The x-values run from 2 to 7, a change of 5. 25 divided by 5 is a slope of 5.",
    // 85: slope 8 through (0, -6)
    "Slope 8, y-intercept negative 6 — plug straight into y equals m x plus b for y equals 8x minus 6.",
    // 86: slope -9 through (0, 4)
    "Slope negative 9, y-intercept 4 — that's y equals negative 9x plus 4.",
    // 87: slope 2 through (0, -11)
    "Slope 2, y-intercept negative 11 — giving y equals 2x minus 11.",
    // 88: slope -6 through (0, 13)
    "Slope negative 6, y-intercept 13 — that's y equals negative 6x plus 13.",
    // 89: slope 10 through (0, -5)
    "Slope 10, y-intercept negative 5 — giving y equals 10x minus 5.",
    // 90: Solve for x: (3x + 7)/4 = 10
    "Multiply both sides by 4: 3x plus 7 equals 40. Subtract 7 to get 3x equals 33, then divide by 3 — x equals 11.",
    // 91: Solve for x: (5x - 2)/3 = 11
    "Multiply both sides by 3: 5x minus 2 equals 33. Add 2 to get 5x equals 35, then divide by 5 — x equals 7.",
    // 92: Solve for x: (2x + 9)/5 = 7
    "Multiply both sides by 5: 2x plus 9 equals 35. Subtract 9 to get 2x equals 26, then divide by 2 — x equals 13.",
    // 93: Solve for x: (4x - 11)/3 = 3
    "Multiply both sides by 3: 4x minus 11 equals 9. Add 11 to get 4x equals 20, then divide by 4 — x equals 5.",
    // 94: Solve for x: (6x + 5)/4 = 8
    "Multiply both sides by 4: 6x plus 5 equals 32. Subtract 5 to get 6x equals 27, then divide by 6 — x equals 9 over 2.",
    // 95: If 5x + 2y = 28 and x = 2, what is y?
    "Substitute x equals 2: 5 times 2 is 10, so 10 plus 2y equals 28. Subtract 10 to get 2y equals 18, then divide by 2 — y equals 9.",
    // 96: If 3x + 4y = 35 and x = 5, what is y?
    "Substitute x equals 5: 3 times 5 is 15, so 15 plus 4y equals 35. Subtract 15 to get 4y equals 20, then divide by 4 — y equals 5.",
    // 97: If 6x + 3y = 39 and x = 4, what is y?
    "Substitute x equals 4: 6 times 4 is 24, so 24 plus 3y equals 39. Subtract 24 to get 3y equals 15, then divide by 3 — y equals 5.",
    // 98: If 2x + 5y = 41 and x = 3, what is y?
    "Substitute x equals 3: 2 times 3 is 6, so 6 plus 5y equals 41. Subtract 6 to get 5y equals 35, then divide by 5 — y equals 7.",
    // 99: If 7x + 2y = 45 and x = 3, what is y?
    "Substitute x equals 3: 7 times 3 is 21, so 21 plus 2y equals 45. Subtract 21 to get 2y equals 24, then divide by 2 — y equals 12.",
    // 100: taxi $5 flat + $3/mile = $23
    "Set up the equation: 5 plus 3 times the miles equals 23. Subtract 5 to get 3 times miles equals 18, then divide by 3 — 6 miles.",
    // 101: gym $25 sign-up + $15/month = $130
    "Set up the equation: 25 plus 15 times the months equals 130. Subtract 25 to get 15 times months equals 105, then divide by 15 — 7 months.",
    // 102: slope 3 through (2, 5)
    "Use point-slope form: y minus 5 equals 3 times x minus 2. Distribute the 3 to get y minus 5 equals 3x minus 6, then add 5 to both sides — y equals 3x minus 1.",
    // 103: slope -2 through (-1, 4)
    "Use point-slope form: y minus 4 equals negative 2 times x plus 1. Distribute to get y minus 4 equals negative 2x minus 2, then add 4 to both sides — y equals negative 2x plus 2.",
    // 104: x-intercept of 3x + 4y = 24
    "The x-intercept is where the line crosses the x-axis, so y equals 0. Plug that in: 3x equals 24, so x equals 8 — the point is 8, 0.",
    // 105: y-intercept of 5x - 2y = 20
    "The y-intercept is where the line crosses the y-axis, so x equals 0. Plug that in: negative 2y equals 20, so y equals negative 10 — the point is 0, negative 10.",
    // 106: parallel to y = 4x - 7
    "Parallel lines always have the exact same slope, so a line parallel to this one also has slope 4 — no extra math needed.",
    // 107: perpendicular to 2x + 3y = 9
    "First rewrite line k in slope-intercept form: y equals negative two-thirds x plus 3, so its slope is negative two-thirds. A perpendicular line's slope is the negative reciprocal — flip it and switch the sign — giving three-halves.",
    // 108: system x + y = 10, x - y = 4, find x
    "Add the two equations together and the y's cancel out: 2x equals 14. Divide by 2, and x equals 7.",
    // 109: system 2x + y = 13, x - y = 2, find y
    "From the second equation, x equals y plus 2. Substitute that into the first: 2 times y plus 2, plus y, equals 13 — which simplifies to 3y equals 9, so y equals 3.",
    // 110: f(x) = 3x - 5, f(4)
    "Plug 4 in for x: 3 times 4 is 12, minus 5 leaves 7.",
    // 111: f(x) = 2x + 9, f(x) = 21, find x
    "Set the function equal to 21: 2x plus 9 equals 21. Subtract 9 to get 2x equals 12, then divide by 2 — x equals 6.",
    // 112: direct variation, y = 15 at x = 3, find y at x = 8
    "Find the constant of variation first: 15 divided by 3 is 5. Multiply that constant by the new x-value: 5 times 8 is 40.",
    // 113: apples, 4 apples = $6, find 10 apples
    "Find the price per apple: 6 dollars divided by 4 is a dollar fifty each. Multiply by 10 apples, and the total is 15 dollars.",
    // 114: table x = 1..4, y = 5, 8, 11, 14, find slope
    "Look at how y changes each time x goes up by 1: from 5 to 8 is a jump of 3, and it keeps jumping by 3 the whole way — so the slope is 3.",
    // 115: plant 10cm week 1, 22cm week 3, find growth rate
    "The plant grew from 10 to 22 centimeters, a change of 12, over 2 weeks, from week 1 to week 3. 12 divided by 2 gives a growth rate of 6 centimeters per week.",
    // 116: |2x - 3| = 9, positive solution
    "Absolute value splits into two cases: 2x minus 3 equals 9, or 2x minus 3 equals negative 9. The first gives x equals 6, the second gives x equals negative 3 — the positive one is 6.",
    // 117: |x + 4| = 10, sum of solutions
    "Absolute value gives two cases: x plus 4 equals 10, or x plus 4 equals negative 10. That's x equals 6 or x equals negative 14. Add those two solutions together: 6 plus negative 14 is negative 8.",
    // 118: y = 2x + 3 and y = -x + 9, find intersection x
    "Set the two equations equal to each other since that's where they meet: 2x plus 3 equals negative x plus 9. Add x and subtract 3 from both sides — 3x equals 6 — so x equals 2.",
    // 119: C = 500 + 2x, sells for $7, break even
    "Break-even means cost equals revenue, so set 500 plus 2x equal to 7x. Subtract 2x from both sides: 500 equals 5x. Divide by 5, and x equals 100 items.",
    // 120: slope -4 through (3, -2), find y-intercept
    "Start from y equals negative 4x plus b, then plug in the point: negative 2 equals negative 4 times 3, plus b. That's negative 2 equals negative 12 plus b, so b equals 10.",
    // 121: odometer 130mi at 2PM, 310mi at 5PM, find speed
    "From 2 PM to 5 PM is 3 hours, and the odometer went from 130 to 310 miles — a distance of 180 miles. 180 divided by 3 hours gives a speed of 60 miles per hour.",
    // 122: pencils $0.50, pens $1.25 x4, total $8, find pencils
    "The 4 pens cost 1.25 times 4, which is 5 dollars. That leaves 8 minus 5, or 3 dollars, for pencils. At 50 cents each, 3 dollars buys 6 pencils.",
    // 123: parallel to y = -3x + 2 through (0, 7)
    "Parallel lines share the same slope, so this line also has slope negative 3. Since it passes through (0, 7), its y-intercept is 7 — giving y equals negative 3x plus 7.",
    // 124: perpendicular to y = (1/2)x - 4 through (0, -1)
    "A perpendicular slope is the negative reciprocal of the original — flip one-half and switch the sign to get negative 2. With a y-intercept of negative 1, the equation is y equals negative 2x minus 1.",
  ],
};
