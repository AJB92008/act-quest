// Teaching intros shown before each skill's quiz begins.
// Each entry is an array of paragraphs; length scales with topic complexity.
export const LESSONS = {
  // ---------------- ENGLISH ----------------
  "en-commas": [
    "Commas are the most common punctuation mark tested on the ACT English section, and most comma questions boil down to a handful of clear rules rather than \"where it feels right to pause.\" Use a comma before the final item in a list of three or more (the Oxford comma), and use a comma before a coordinating conjunction (and, but, or, so) when it joins two complete sentences.",
    "Commas also set off information that isn't essential to the sentence's core meaning: nonessential clauses starting with \"who\" or \"which,\" introductory phrases at the start of a sentence, and names used in direct address. If you can remove the phrase and the sentence still makes complete sense, it almost always needs commas around it (or before it, if it's introductory).",
    "A frequent ACT trap is placing only one comma around a phrase that needs two, or adding a comma where none is needed, such as between two adjectives that don't independently modify the noun. When in doubt, try reading the sentence with the comma-set-off phrase removed. If the sentence still works and makes sense, the commas are probably placed correctly.",
  ],
  "en-apostrophes": [
    "Apostrophes do two main jobs in English: they show possession, and they mark missing letters in a contraction. Confusing the two is the source of almost every apostrophe error the ACT tests, especially with words like \"its\" (possessive) versus \"it's\" (a contraction of \"it is\").",
    "For possession, add apostrophe and \"s\" to singular nouns (the dog's bone), and add just an apostrophe to plural nouns that already end in \"s\" (the students' project). Irregular plurals that don't end in \"s,\" like \"children\" or \"women,\" still take apostrophe and \"s\" (the children's toys).",
    "Watch for two special cases: a plain plural noun never needs an apostrophe just because it ends in \"s\" (the Smiths, not the Smith's), and decades written as numbers don't take one either (the 1980s). Save the apostrophe for genuine possession or contraction.",
  ],
  "en-colons": [
    "A colon introduces something: a list, an explanation, or a dramatic final detail. The one rule that matters most on the ACT is that whatever comes before the colon must be a complete sentence on its own. If you can't put a period where the colon is and still have a full sentence, the colon is wrong.",
    "This rule catches two common ACT traps. First, a colon should never directly follow a verb like \"include\" or \"are,\" since the verb is already doing the job of introducing the list. Second, a colon can't follow a dependent clause like \"Because he was tired,\" since that clause isn't complete on its own.",
  ],
  "en-semicolons": [
    "A semicolon's main job is to join two independent clauses (two complete sentences) that are closely related in meaning, without using a coordinating conjunction like \"and\" or \"but.\" If you can split the sentence into two separate, grammatically complete sentences at the semicolon, it's being used correctly.",
    "Semicolons also team up with conjunctive adverbs like \"however,\" \"therefore,\" and \"moreover\" to join two independent clauses; the pattern is semicolon, then the adverb, then a comma. And when a list's items already contain commas (like a series of city and state pairs), semicolons separate the items so the list doesn't become a confusing pileup of commas.",
    "The most common ACT trap is using a semicolon before a phrase that isn't a complete sentence, such as a dependent clause or a verb phrase with no subject. If what follows the semicolon can't stand alone as a sentence, the semicolon is the wrong choice.",
  ],
  "en-dashes": [
    "A dash (technically an \"em dash\" in formal typography) can do almost anything commas or parentheses can do: it can set off a nonessential aside, introduce a list or explanation, or add a dramatic pause before a final word. The key rule the ACT tests is consistency: if a dash opens an interrupting phrase, a matching dash must close it. Mixing a dash with a comma around the same interruption is always wrong.",
    "Dashes are especially useful when the interrupting phrase already contains commas of its own; using dashes instead avoids a confusing pileup of commas that makes it hard to tell where the aside begins and ends.",
    "A single dash can also stand alone, usually right before a word or phrase that restates, explains, or dramatically emphasizes what came before it, similar to how a colon works.",
  ],
  "en-endpunct": [
    "End punctuation signals what kind of sentence you just read: a period for a statement, a question mark for a direct question, and an exclamation point for genuine surprise, urgency, or strong emotion. A common ACT trap is an indirect question, a sentence that mentions a question without actually asking one out loud, like \"I wonder if it will rain.\" Even though the word \"wonder\" hints at a question, the sentence itself is a statement and needs a period.",
    "Formal writing, including most ACT passages, uses exclamation points sparingly. If a sentence is simply stating a fact or describing an event without real urgency, a period is almost always the better, more professional choice, even if the event described is exciting.",
    "When a quotation ends a sentence, the placement of the question mark depends on what's actually being asked. If the quoted words themselves form the question, the question mark goes inside the closing quotation mark. If the quotation is just a phrase and the sentence around it is what's asking the question, the question mark goes outside.",
  ],
  "en-subobjpronouns": [
    "Pronouns change form depending on whether they're doing the action (subject pronouns: I, he, she, we, they) or receiving it (object pronouns: me, him, her, us, them). The ACT loves to test this in compound subjects and objects, like \"Jake and I\" versus \"Jake and me,\" because people often guess wrong once a second name is added.",
    "The fastest way to check is to mentally remove the other person from the sentence: you wouldn't say \"Me went to the store,\" so \"My friend and I went to the store\" is correct. Likewise, you wouldn't say \"The teacher gave the award to I,\" so \"the award to Jake and me\" is correct, since both names are objects of the preposition \"to.\"",
    "The same logic applies after words like \"than\" and \"as\" in comparisons. Formal English treats these as introducing an implied clause, so \"she is taller than he\" (meaning \"than he is\") is the technically correct form, even though \"than him\" is extremely common in casual speech.",
  ],
  "en-thatwho": [
    "Use \"who\" (or \"whom\") for people and \"that\" or \"which\" for things, animals, and groups referred to as a collective unit. Mixing these up, such as calling a person \"that,\" is one of the most common relative pronoun errors the ACT tests.",
    "Between \"that\" and \"which\" for things, the ACT follows a simple pattern: \"that\" introduces essential information with no surrounding commas, while \"which\" introduces nonessential, extra information set off by commas on both sides. If you could delete the clause without losing necessary meaning, it should use \"which\" and commas.",
    "\"Who\" and \"whom\" split the same way subject and object pronouns do: \"who\" acts as the subject of its own clause, while \"whom\" acts as the object. And don't confuse \"whose\" (showing possession) with the contraction \"who's\" (short for \"who is\").",
  ],
  "en-pronounagreement": [
    "A pronoun has to agree in number and gender with the specific noun it refers to, called its antecedent. Singular nouns need singular pronouns, and plural nouns need plural pronouns, even when other words in the sentence make the number less obvious.",
    "Collective nouns like \"team,\" \"committee,\" or \"company\" are usually treated as a single, singular unit, so they pair with \"it\" and \"its\" rather than \"they\" and \"their,\" unless the sentence is clearly emphasizing the individual members. And indefinite pronouns like \"everyone\" or \"each\" are grammatically singular, even though they refer to a group of people.",
    "Watch for sentences that start with one pronoun and then switch to another referring to the same antecedent, such as using \"her\" and then \"they\" for the same person. Consistency throughout the sentence matters just as much as matching the original noun.",
  ],
  "en-ambiguous": [
    "A pronoun needs a single, clear antecedent, the specific noun it's replacing. When a sentence includes two people or things a pronoun could logically refer to, that pronoun is ambiguous, and the ACT will ask you to fix it, usually by replacing the pronoun with the specific name or noun it should refer to.",
    "Watch especially for sentences with two same-gender people (\"When Tom met with Jake, he shared his research\"), or vague uses of \"it,\" \"this,\" or \"which\" that could refer to an entire preceding idea rather than one specific noun. If a reader would have to guess what a pronoun means, the sentence needs to be rewritten for clarity, even if the grammar is technically correct.",
  ],
  "en-verbtense": [
    "Verb tense tells your reader when an action happened, and the ACT tests whether that timeline stays logical and consistent throughout a sentence or passage. If a sentence starts in the past tense, it generally needs to stay in the past tense, unless there's a clear reason for a shift.",
    "When one event happened before another past event, use the past perfect tense (\"had\" plus a past participle) for the earlier action, to make the sequence clear: \"By the time the movie started, we had already eaten dinner.\" And for hypothetical situations, a past-tense \"if\" clause pairs with \"would,\" not \"will,\" in the result.",
    "Two exceptions are worth knowing: general truths and scientific facts stay in the present tense even inside a past-tense sentence (\"She explained that the sun rises in the east\"), and when summarizing the plot of a book, movie, or play, writers conventionally use the present tense throughout, even though the work itself was created in the past.",
  ],
  "en-svagreement": [
    "A verb has to agree in number with its subject: singular subjects take singular verbs and plural subjects take plural verbs, but the ACT often buries the true subject behind a long phrase to make this harder to spot. Cross out prepositional phrases and other interruptions between the subject and verb to find the word the verb actually needs to match.",
    "Indefinite pronouns like \"each,\" \"everyone,\" and \"neither\" are always singular, even when they're followed by a plural noun in a prepositional phrase (\"each of the students has,\" not \"have\"). With \"either/or\" and \"neither/nor,\" the verb agrees with whichever subject is closer to it.",
    "Inverted sentences that begin with \"there is\" or \"there are\" can be tricky because the true subject comes after the verb; find that subject to decide whether \"is\" or \"are\" is correct. And gerund phrases (an \"-ing\" word acting as a noun) count as a single, singular subject, even when they describe more than one activity.",
  ],
  "en-comparisons": [
    "When comparing exactly two things, use the comparative form (taller, more interesting); when comparing three or more, use the superlative form (tallest, most interesting). Mixing these up, or doubling up on a comparison (\"more taller\"), is a common ACT error.",
    "A comparison also has to compare logically equivalent things. A sentence that says \"Her essay was better than her classmates\" illogically compares an essay to people; it needs to compare the essay to her classmates' essays instead, usually by adding a possessive or repeating the noun.",
    "A few standard phrases are worth memorizing: \"different from\" (not \"different than\") in formal writing, and \"between\" for exactly two things versus \"among\" for three or more.",
  ],
  "en-wordchoice": [
    "Some of the most common ACT English errors involve words that sound identical or nearly identical but mean completely different things. \"Its\" shows possession, while \"it's\" is always a contraction of \"it is\" or \"it has\"; mixing them up is one of the most frequently tested errors on the whole exam.",
    "\"Their\" shows possession, \"there\" refers to a location, and \"they're\" is a contraction of \"they are.\" \"To\" is part of an infinitive or shows direction, while \"too\" means \"also\" or \"excessively,\" and \"two\" is the number. \"Then\" refers to sequence in time, while \"than\" is used only for comparisons.",
    "One phrase to watch closely: \"might have\" (or the contraction \"might've\") is always correct, while \"might of\" is never correct, it's simply a common misspelling that comes from how the contraction sounds when spoken aloud.",
  ],
  "en-idioms": [
    "Idioms are fixed expressions, especially preposition pairings, that don't follow a predictable grammatical rule; they're simply the standard way native speakers phrase something, like \"capable of,\" \"consist of,\" or \"responsible for.\" The ACT tests whether you recognize the one preposition that idiomatically belongs with a given word.",
    "There's no shortcut formula for idioms the way there is for comma or apostrophe rules; recognizing the right preposition mostly comes down to familiarity with how these phrases are conventionally used in standard written English. When in doubt, try reading each answer choice aloud and trust which pairing sounds like natural, standard English rather than an awkward translation.",
  ],
  "en-verbalphrases": [
    "Verbal phrases are built from verbs but act as other parts of speech: a gerund phrase (ending in \"-ing\") acts as a noun, an infinitive phrase (\"to\" plus a verb) can act as a noun, adjective, or adverb, and a participial phrase acts as an adjective describing a nearby noun.",
    "Certain verbs conventionally pair with a gerund (\"enjoy painting\") while others pair with an infinitive (\"decided to go\"); this is closely related to idiom knowledge, since the correct pairing is mostly a matter of standard usage rather than a rule you can derive logically. A verb following a preposition, meanwhile, must always be a gerund (\"excellent at solving,\" never \"excellent at solve\").",
    "When a verbal phrase opens a sentence, make sure the following construction uses the correct participle form (having finished, not having finish) and that the phrase logically connects to the subject that follows it.",
  ],
  "en-fragments": [
    "A complete sentence needs both a subject and a verb and must express a complete thought on its own. A fragment is missing one of these pieces, often because it's actually a dependent clause (starting with a word like \"because,\" \"although,\" or \"when\") being punctuated as if it were a full sentence.",
    "A run-on or comma splice is the opposite problem: two complete sentences jammed together with no punctuation, or joined by only a comma, when they actually need a period, a semicolon, or a comma plus a coordinating conjunction (and, but, or, so) to be correctly connected.",
    "To test whether something is a complete sentence, check that it has a subject, a verb, and doesn't start with a subordinating word that would make it dependent on another clause. If it fails any of these checks, it can't stand alone.",
  ],
  "en-parallel": [
    "Items joined in a list, or connected by paired words like \"both...and,\" \"either...or,\" or \"not only...but also,\" need to share the same grammatical form. If one item in a list is a gerund (\"hiking\"), every item in that list should be a gerund too, not a mix of gerunds and infinitives.",
    "This same rule applies to comparisons: \"Swimming is more relaxing than running\" keeps both activities as gerunds, while \"than to run\" breaks the parallel structure. Reading a sentence with each list item plugged in separately is a reliable way to catch a parallelism error, since the mismatched item will suddenly sound wrong on its own.",
  ],
  "en-modifiers": [
    "A modifier, especially an opening phrase, needs a logical subject to describe, and that subject should appear immediately after it. A dangling modifier has no logical subject at all: \"Walking to school, the rain began to fall\" accidentally implies that the rain was walking, since \"the rain\" is the first noun after the comma.",
    "A misplaced modifier has a logical subject somewhere in the sentence, but it's placed too far from the word it's meant to describe, creating confusion or an unintended meaning, like \"I read that a shark attacked a swimmer in the newspaper,\" which briefly suggests the shark was in the newspaper.",
    "To fix either problem, move the modifier next to the word it's actually describing, or rewrite the sentence so the subject immediately follows the introductory phrase.",
  ],
  "en-relevance": [
    "Every sentence in a well-focused paragraph should support that paragraph's central topic. A relevance question asks whether a specific sentence, even if it's well written and factually true, actually belongs in the paragraph it's placed in.",
    "To answer these, identify the paragraph's main focus first, then check whether the sentence in question directly supports, illustrates, or extends that focus. A sentence that shifts to a related but different topic, like a personal anecdote in the middle of a scientific explanation, should usually be cut, even if it's interesting on its own.",
  ],
  "en-authorintent": [
    "These questions describe a specific goal the writer is trying to achieve, such as emphasizing urgency, showing rather than telling, or introducing a topic without giving away the conclusion, and ask which choice best accomplishes that exact goal.",
    "The trap is choosing an answer that's well written or factually accurate but doesn't actually match the stated goal. Always reread the goal carefully and eliminate any choice that accomplishes a different purpose, even a good one, before picking the answer that most precisely does what was asked.",
  ],
  "en-transitions": [
    "Transition words signal the logical relationship between two ideas: contrast (however, nevertheless), cause and effect (therefore, as a result), addition (moreover, in addition), or similarity (likewise, similarly). Choosing the right one requires understanding how the two surrounding sentences actually relate, not just picking a transition that sounds formal.",
    "A reliable strategy is to cover up the transition word, read the sentences around it, and ask yourself: do these two ideas agree, disagree, or does one cause the other? Once you know the relationship, only one category of transition word will correctly fit.",
  ],
  "en-macrologic": [
    "Beyond individual sentences, the ACT also tests whether an essay's paragraphs and sentences are organized in the most logical order, often chronological, cause before effect, or general point before specific example.",
    "For sequencing questions, look for logical dependencies: an event that causes another must come first, and a sentence that refers back to \"this\" or \"these\" needs its antecedent to appear earlier. For placement questions, a sentence that summarizes a broader point usually works best as an introduction, while a sentence that adds a specific supporting detail usually works best woven into the body or as a closing thought.",
  ],
  "en-concision": [
    "Concise writing says the same thing in fewer words, without losing any meaning. The ACT frequently tests redundant phrases, ones that repeat the same idea twice, like \"in my own personal opinion\" or \"returned back,\" where a single simple word or phrase already covers the same ground.",
    "When comparing answer choices, the shortest option isn't automatically correct, but if two choices communicate the exact same idea, the more concise one almost always wins. Watch especially for wordy filler phrases like \"due to the fact that\" or \"at this point in time,\" which can almost always be replaced by a single word like \"because\" or \"now.\"",
  ],
  "en-tone": [
    "Formal writing, like an essay, a business memo, or a legal document, maintains a consistent, professional register throughout. Slang, casual filler (\"kind of,\" \"honestly,\" \"no cap\"), and overly dramatic word choices don't fit that register, even if they express the same basic idea as a more formal phrase.",
    "These questions usually ask you to identify which word or phrase best matches the surrounding formal tone. The correct answer is typically the most precise, neutral, professional option, not necessarily the fanciest-sounding one, and not the casual, conversational one that would fit better in a text message.",
  ],

  // ---------------- MATH ----------------
  "ma-linear": [
    "A linear equation involves variables raised only to the first power, no exponents, no square roots of variables, which means its graph is always a straight line. Solving one is a matter of isolating the variable: undo addition and subtraction first, then undo multiplication and division, always applying the same operation to both sides of the equation.",
    "Linear inequalities work almost exactly the same way, with one crucial exception: multiplying or dividing both sides by a negative number flips the direction of the inequality sign. Forgetting this single rule is the most common way students miss an otherwise easy inequality question.",
    "The slope-intercept form of a line, y = mx + b, packs two useful pieces of information into one equation: m is the slope (how steep the line is), and b is the y-intercept (where the line crosses the y-axis). Given any two points on a line, the slope is the change in y divided by the change in x.",
  ],
  "ma-exponents": [
    "Exponent rules let you simplify expressions without ever expanding them out by hand. When multiplying powers with the same base, add the exponents; when dividing, subtract them; and when raising a power to another power, multiply the exponents.",
    "A negative exponent means \"take the reciprocal\": x to the power of negative n equals 1 divided by x to the power of n. A fractional exponent represents a root: raising a number to the power of one half is the same as taking its square root, and a power of one third is a cube root.",
    "Scientific notation writes very large or very small numbers as a number between 1 and 10 multiplied by a power of 10; the exponent tells you how many places to move the decimal point.",
  ],
  "ma-angles": [
    "The angles inside any triangle always add up to 180 degrees, a fact that lets you find a missing angle whenever you know the other two. Right triangles follow the Pythagorean theorem, a squared plus b squared equals c squared, where c is always the hypotenuse, the longest side, opposite the right angle.",
    "A handful of Pythagorean triples show up constantly on the ACT (3-4-5, 5-12-13, 8-15-17), and recognizing them, along with their multiples, lets you skip the algebra and jump straight to the answer. When two parallel lines are cut by a third line (a transversal), the angles formed follow predictable congruence and supplementary relationships that are worth memorizing.",
  ],
  "ma-circles": [
    "A circle's area (pi times the radius squared) and circumference (pi times the diameter) are two of the most frequently used formulas on the ACT, and most circle questions are really just testing whether you can plug the right value into the right formula. Because the radius is squared in the area formula but not in the circumference formula, doubling a circle's radius doubles its circumference but quadruples its area.",
    "Volume formulas extend these same ideas into three dimensions: a rectangular box's volume is length times width times height, and a cylinder's volume is the circle's area formula multiplied by its height.",
  ],
  "ma-quadratics": [
    "A quadratic equation contains a squared variable and can be solved by factoring into two binomials whose constant terms multiply to give the equation's last term and add to give its middle term's coefficient.",
    "A system of two linear equations can be solved by substitution (solving one equation for a variable and plugging it into the other) or elimination (adding or subtracting the equations to cancel out a variable). A quadratic written in vertex form, y = a(x − h)² + k, directly reveals its vertex at the point (h, k).",
  ],
  "ma-stats": [
    "The mean is the sum of all values divided by how many values there are; the median is the middle value once everything is sorted in order (or the average of the two middle values, if there's an even number of them); and the mode is whichever value appears most often.",
    "Basic probability is a fraction: the number of favorable outcomes divided by the total number of possible outcomes. For independent events, like two separate coin flips, multiply the individual probabilities together to find the probability that both events happen.",
  ],
  "ma-numbersense": [
    "A handful of number properties come up again and again on the ACT: the number 1 is not prime, 2 is the only even prime number, and the product of two odd numbers is always odd while the product of two even numbers is always even.",
    "Consecutive integers are written as x, x+1, x+2, and so on; consecutive even or odd integers skip by twos instead (x, x+2, x+4). A remainder is always smaller than the divisor and is never expressed as a decimal. And percent change is always calculated as the amount of change divided by the original starting value, not the new value.",
  ],
  "ma-toolbox": [
    "Solving an inequality follows the same steps as solving an equation, with one key exception: multiplying or dividing both sides by a negative number flips the inequality sign. Factoring a trinomial in the form x² + bx + c means finding two numbers that multiply to c and add to b; a difference of squares, x² − y², always factors into (x + y)(x − y).",
    "An absolute value equation like |ax + b| = c splits into two separate equations, one where the inside expression equals c and one where it equals negative c. In direct variation, y = kx, both variables increase or decrease together; in inverse variation, y = k/x, one increases as the other decreases.",
  ],
  "ma-trianglemastery": [
    "Beyond the basic angle sum rule, triangles follow the triangle inequality theorem: the sum of any two sides must be greater than the third side, or the triangle simply couldn't close up. In an isosceles triangle, the two base angles across from the two equal sides are also equal to each other.",
    "The exterior angle of a triangle (formed by extending one side) always equals the sum of the two interior angles that aren't next to it. And you can classify any triangle as acute, right, or obtuse just by comparing the sum of the squares of its two shorter sides to the square of its longest side.",
    "Two special right triangles are worth memorizing outright: in a 45-45-90 triangle, the hypotenuse equals a leg times the square root of 2, and in a 30-60-90 triangle, the three sides are always in the ratio 1 to the square root of 3 to 2.",
  ],
  "ma-polygons": [
    "A parallelogram has two pairs of parallel, congruent sides, and its diagonals always bisect each other. Rectangles add the rule that all angles are right angles; rhombi add the rule that all sides are equal length and the diagonals are perpendicular; and a square combines both sets of rules at once.",
    "The interior angles of any polygon with n sides add up to 180 times (n − 2) degrees, and in a regular polygon, where every side and angle is equal, each individual angle measures 360 divided by n. Similar shapes have proportional sides and identical angles; their areas scale with the square of their ratio of similarity.",
  ],
  "ma-linescircles": [
    "Angles formed by intersecting lines follow strict rules: vertical angles are always congruent, angles on a straight line are supplementary (they add to 180 degrees), and angles around a single point add up to 360 degrees. When two parallel lines are cut by a transversal, corresponding angles are congruent, alternate interior angles are congruent, and same-side interior angles are supplementary.",
    "Inside a circle, an arc's length or a sector's area is just a fraction of the whole circle, calculated using the central angle divided by 360 degrees. An inscribed angle (formed by two chords meeting at the circle's edge) is always exactly half the measure of the arc it intercepts, and any angle inscribed in a semicircle is always exactly 90 degrees.",
  ],
  "ma-volume": [
    "Beyond boxes and cylinders, a sphere's volume is four-thirds pi times the radius cubed, and a cone's volume is one-third pi times the radius squared times the height, exactly one-third of a cylinder with the same base and height. Surface area adds up the area of every face of a solid; for a rectangular box, that means doubling the sum of its three pairs of matching faces.",
    "Two handy geometric relationships often show up together: when a circle is inscribed inside a square, the circle's diameter equals the square's side length, and when a square is inscribed inside a circle, the square's diagonal equals the circle's diameter.",
  ],
  "ma-coordinate": [
    "The midpoint of a segment is simply the average of its endpoints' x-coordinates and the average of their y-coordinates. The distance between two points comes from the Pythagorean theorem applied to the coordinate plane: the square root of the horizontal distance squared plus the vertical distance squared.",
    "Slope relationships are just as important as the slope formula itself: parallel lines always have equal slopes, perpendicular lines have slopes that are negative reciprocals of each other, a line reflected over the x-axis has its slope's sign flipped, and a line reflected over the line y = x has its slope inverted (flipped as a fraction).",
  ],
  "ma-conics": [
    "A circle centered at the origin follows the equation x² + y² = r²; shifting the center to a point (h, k) changes the equation to (x − h)² + (y − k)² = r², where r is still the radius. A parabola in vertex form, y = a(x − h)² + k, has its vertex at (h, k), opens upward if a is positive, and opens downward if a is negative.",
    "A line can be written in slope-intercept form (y = mx + b), point-slope form (y − y₁ = m(x − x₁)), or general form (Ax + By = C); a parallel line keeps the same A and B with a different constant, while a perpendicular line swaps and negates them. An ellipse centered at (h, k) has a major axis and minor axis determined by whichever denominator under the squared terms is larger.",
  ],
  "ma-alg2": [
    "For any quadratic equation in the form ax² + bx + c = 0, the discriminant (b² − 4ac) reveals the nature of its roots without requiring you to actually solve the equation: a negative discriminant means the roots are imaginary, a discriminant of exactly zero means there's one repeated real root, and a positive discriminant means two real roots, which are rational if the discriminant is a perfect square and irrational if it isn't.",
    "Two shortcuts are worth memorizing: the sum of a quadratic's roots always equals negative b divided by a, and the product of its roots always equals c divided by a. The axis of symmetry of any parabola in standard form sits at x equals negative b divided by 2a.",
    "Complex numbers are built from i, defined as the square root of negative 1, so i squared equals negative 1. To simplify any higher power of i, divide the exponent by 4 and use only the remainder, since every fourth power of i cycles back to 1.",
  ],
  "ma-matrixlog": [
    "A matrix's dimensions are written as rows by columns. Two matrices can only be added or subtracted if they share identical dimensions, and two matrices can only be multiplied if the number of columns in the first matches the number of rows in the second; the resulting matrix takes the outer dimensions from that pairing. For a 2 by 2 matrix, the determinant is calculated as the product of the diagonal from top left to bottom right, minus the product of the other diagonal.",
    "A logarithm answers the question \"what exponent do I need?\": log base b of a number n is the power you'd have to raise b to in order to get n. Logarithms follow rules that mirror exponent rules: the log of a product is the sum of the logs, the log of a quotient is the difference of the logs, and the log of a power can be pulled out front as a multiplier.",
  ],
  "ma-trig": [
    "In a right triangle, the three basic trig ratios compare two of its sides relative to a given angle: sine is opposite over hypotenuse, cosine is adjacent over hypotenuse, and tangent is opposite over adjacent (often remembered with the acronym SOHCAHTOA). Cosecant, secant, and cotangent are simply the reciprocals of sine, cosine, and tangent, respectively.",
    "The Pythagorean identity, sine squared plus cosine squared equals 1, holds true for every possible angle, and related identities follow directly from it. Tangent can always be rewritten as sine divided by cosine.",
    "The sign (positive or negative) of each trig function depends on which quadrant of the coordinate plane the angle falls in, a pattern often remembered with the phrase \"All Students Take Calculus\": all functions are positive in quadrant one, only sine in quadrant two, only tangent in quadrant three, and only cosine in quadrant four.",
  ],
  "ma-finalfive": [
    "These questions are deliberately written to match the difficulty of the toughest problems near the end of a real ACT math section, the ones that combine multiple topics into a single question rather than testing one skill in isolation. There's no single new concept to learn here; success comes from confidently combining skills you've already practiced elsewhere on this island: functions and inverses, complex numbers, matrices, advanced trigonometry, logarithms, sequences, probability, and coordinate geometry.",
    "When a problem feels unfamiliar, look for a smaller, more familiar problem hiding inside it. An intimidating function composition question is still just \"plug this value in, then plug that result into the next function.\" A complicated probability question is still just counting favorable outcomes over total outcomes; it just takes an extra step or two to get there.",
  ],

  // ---------------- READING ----------------
  "re-mainidea": [
    "The main idea is the single central point a passage is making, the idea that every paragraph and detail ultimately supports. It's usually broader than any one supporting fact, but narrower than \"the topic\" alone; a passage's topic might be octopuses, but its main idea is a specific claim about octopus intelligence.",
    "A reliable way to find it is to ask what the passage's specific details are all working together to prove or explain. The correct answer choice will be broad enough to cover the whole passage but specific enough that it couldn't apply equally well to a completely different piece of writing on the same general topic.",
  ],
  "re-detail": [
    "Detail questions ask you to locate a specific piece of information that's directly and explicitly stated in the passage, no interpretation required. The answer is always there in the text; your job is to find the exact sentence that states it and match it precisely.",
    "The most common trap is choosing an answer that's true in general or that sounds plausible, but wasn't actually the number, date, or fact the passage stated. Always go back and confirm the specific wording in the passage rather than relying on memory or a general impression of what it probably said.",
  ],
  "re-sequence": [
    "Sequence questions ask you to track when events happened relative to each other, whether that means picking which event came first, or putting a full list of events into the correct chronological order. Passages don't always present events in the order they actually occurred, especially historical or biographical passages that might jump backward to give context before returning to the main timeline.",
    "Look for explicit time markers (dates, ages, words like \"before,\" \"after,\" \"then,\" and \"eventually\") and use them to build a timeline as you read. When a question asks for a full ordering, it's often fastest to identify just the first or last event and eliminate any answer choices that get that one placement wrong.",
  ],
  "re-compare": [
    "Comparison questions ask how two people, things, ideas, or time periods discussed in a passage are alike or different. The comparison is always based on specific details stated in the text, not on outside knowledge or assumptions you might bring to the topic.",
    "When a passage discusses two sides of an issue, two historical periods, or two individuals, pay attention to the specific point of contrast the passage draws, since a comparison question will usually target that exact distinction rather than a more general or different similarity.",
  ],
  "re-causeeffect": [
    "These questions ask you to identify why something happened (the cause) or what happened as a result of something else (the effect). Passages often signal these relationships with words like \"because,\" \"since,\" \"as a result,\" \"caused,\" or \"led to,\" but the relationship can also be implied without any single signal word.",
    "Be careful not to confuse simple sequence (one event merely happening after another) with true causation (one event actually bringing about the other). The correct answer will reflect a relationship the passage actually states or clearly implies, not just two events that happen to appear near each other in the text.",
  ],
  "re-vocab": [
    "These questions ask what a word, phrase, or short statement means specifically as it's used in the passage, which can be different from that word's most common dictionary definition. Context, the surrounding sentences, is always the key to choosing correctly.",
    "A reliable strategy is to cover up the actual word or phrase, read the sentence around it, and predict your own replacement before looking at the answer choices. Then pick whichever choice most closely matches your prediction; the ACT often includes a choice that reflects a common but wrong meaning of the word to catch readers who rely on memory instead of context.",
  ],
  "re-generalize": [
    "A generalization question asks you to draw a broader conclusion that reasonably follows from the passage's specific details, even though that exact conclusion is never directly stated in so many words. This is different from a detail question, where the answer is explicitly written out.",
    "The correct generalization has to be strongly supported by what the passage actually says; it can go slightly beyond the literal text, but it can never contradict it or introduce an idea the passage gives no real support for. Eliminate any choice that's too extreme, too narrow, or unsupported by the evidence the passage provides.",
  ],
  "re-voice": [
    "These questions ask about how a passage is written, not just what it says: its point of view (first, second, or third person), its tone (the author's attitude toward the subject, such as admiring, critical, or neutral), and its rhetorical method (why the author chose to include a specific detail, example, or structural choice).",
    "To identify tone, pay attention to the connotation of the specific words an author chooses, since word choice reveals attitude even when a passage never states an opinion directly. To identify method, ask what a specific sentence, comparison, or piece of evidence accomplishes for the passage as a whole, beyond just adding information.",
  ],
  "re-claims": [
    "An argumentative passage makes a central claim and supports it with evidence: facts, statistics, studies, or expert testimony. These questions ask you to identify that claim, recognize the evidence used to support it, and sometimes evaluate how strong that support actually is.",
    "Strong arguments often acknowledge a counterargument and then respond to it, rather than ignoring opposing views entirely; noticing this structure helps you follow the author's full line of reasoning. \"Strengthen\" and \"weaken\" questions ask you to identify new information that would make the existing evidence more or less convincing, without changing the claim itself.",
  ],
  "re-integrate": [
    "When a question set gives you two related passages instead of one, you're being asked to understand each text individually and also see how they relate to each other: where they agree, where they diverge in focus or emphasis, and what a reader would only learn by reading both.",
    "A helpful approach is to briefly summarize each passage's main focus separately before comparing them. Questions might ask what one passage includes that the other omits, how their tones differ, or what a combined understanding of both texts reveals that neither passage fully provides on its own.",
  ],

  // ---------------- SCIENCE ----------------
  "sc-datarep": [
    "Data Representation passages present information visually, through tables, line graphs, bar graphs, or scatter plots, with little to no narrative explanation. The questions test whether you can accurately read specific values directly off a chart or table, without needing outside scientific knowledge.",
    "Before answering any question, take a moment to identify what each axis or column represents and what units are being used. Most mistakes on these passages come from misreading a label or accidentally looking at the wrong row or column, not from the underlying science being difficult.",
  ],
  "sc-interpret": [
    "Interpreting data goes one step beyond simply reading values: it means noticing trends (does a value consistently rise, fall, or peak somewhere in the middle?), calculating differences and ratios between values, and comparing patterns across two related data sets.",
    "A useful habit is to scan an entire table or graph once before answering questions, noting the overall shape of the trend and any values that stand out. Many trend questions can be answered just by knowing whether the pattern generally increases, generally decreases, or rises and then falls, without needing to calculate anything precisely.",
  ],
  "sc-research": [
    "A Research Summary passage describes one or more experiments in detail: what the researchers did, what they measured, and what they found. These passages often include multiple related experiments run by the same researchers to test slightly different questions, so read carefully to keep each experiment's specific setup separate from the others.",
    "Questions on these passages often ask about the sequence of an experiment's steps or how results compare between two different experiments described in the same passage. Pay attention to what's explicitly stated as the same between experiments and what's different, since that contrast is often exactly what the questions will focus on.",
  ],
  "sc-investigation": [
    "Every well-designed experiment has an independent variable (the one factor the researcher deliberately changes), one or more dependent variables (the outcomes that get measured), and controlled variables (everything else that's deliberately kept the same across every group, so it can't explain any difference in results).",
    "If a controlled variable were allowed to differ between groups instead, the experiment would no longer prove that the independent variable alone caused the observed effect, since some other uncontrolled factor could be responsible instead. Questions in this category often ask you to identify one of these three roles directly, or to explain why a specific variable needed to be controlled in the first place.",
  ],
  "sc-conflicting": [
    "A Conflicting Viewpoints passage presents two or more scientists, students, or theories that explain the same phenomenon in different, often incompatible, ways. Your job isn't to decide which viewpoint is \"right\"; it's to understand each viewpoint's specific claim and the evidence it offers on its own terms.",
    "Look for what the viewpoints agree on despite their disagreement, since they often share the same basic premise and differ only in what they claim causes it. Also notice each viewpoint's specific supporting evidence, since questions frequently ask which observation would strengthen one viewpoint or weaken the other.",
  ],
  "sc-evaluate": [
    "These questions ask you to reason beyond the data that's directly given: predicting what a result would likely be under a new, untested condition, identifying an unstated assumption a claim depends on, or judging which piece of new evidence would most strengthen or weaken a specific hypothesis.",
    "A reliable approach is to extend whatever pattern the data already shows, rather than guessing randomly. If a trend has been consistently increasing, decreasing, or leveling off, the most reasonable prediction continues that same pattern rather than assuming a sudden, unexplained reversal. For strengthen and weaken questions, ask what new fact would make a hypothesis's specific claim either more believable or directly contradicted.",
  ],
};
