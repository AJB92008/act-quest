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

  // ---------------- SAT READING & WRITING ----------------
  "satrw-centralidea": [
    "Every digital SAT passage, however short, is built around a single central idea: the point every sentence in it is ultimately working to support. These questions ask you to name that idea directly, so it helps to treat every detail in the passage as evidence pointing toward one specific claim rather than a loose collection of facts.",
    "The correct answer has to be broad enough to cover the entire passage, not just one sentence of it, but specific enough that it couldn't just as easily summarize a completely different passage on a similar topic. A choice that's true but only describes a supporting detail, or one that's so general it says almost nothing, is the two most common wrong-answer traps.",
  ],
  "satrw-evidence-text": [
    "These questions give you a claim and ask which quoted sentence from the passage best supports it, or which one would most directly weaken it. The claim is always something the passage discusses, so your job isn't to evaluate whether the claim is true; it's to find the specific line of text that backs it up (or undercuts it) most precisely.",
    "Read each answer choice as literally as possible before deciding. A tempting wrong answer is often related to the right general topic but doesn't actually address the specific claim in the question, or it supports a slightly different point the passage also happens to make nearby.",
  ],
  "satrw-evidence-data": [
    "Chart Reader questions pair a short passage or claim with a table, bar graph, or line graph and ask which choice the data actually supports. Since the numbers are given to you directly, these questions test careful reading of the data at least as much as any math skill.",
    "Check every answer choice against the actual figures before picking one; a wrong choice will often flip a comparison (claiming the smaller value is larger), get a trend backward, or make a claim about a total the numbers don't actually support. Only one choice will hold up against every number in the data, so it's worth double-checking your answer against the data one more time before moving on.",
  ],
  "satrw-inference": [
    "An inference is a conclusion that reasonably follows from what a passage describes, even though the passage never states that conclusion outright. These questions reward reading between the lines of a specific action or detail: what does it imply about the people or situation involved?",
    "The correct inference always stays tightly anchored to the text; it can go slightly beyond the literal words, but it can never require an outside assumption the passage gives no support for. Eliminate any choice that's a bigger leap than the evidence justifies, even if it sounds plausible on its own.",
  ],
  "satrw-detailsort": [
    "Not every detail an author includes is there to support the passage's main point. These questions ask you to sort the details that genuinely support a stated claim from the ones that are true, and maybe even interesting, but don't actually do any work for that specific claim.",
    "A detail that's related to the general topic but doesn't connect to the exact claim in question is the classic trap here. Before picking an answer, ask specifically what job each detail is doing: is it evidence for the claim, or is it just color that happens to sit nearby in the passage?",
  ],
  "satrw-wordsincontext": [
    "These questions ask what a word or short phrase means specifically as it's used in that one sentence, which is often a less common meaning than the word's most familiar dictionary definition. Many of the words tested have several unrelated meanings, and the wrong answers are almost always other real definitions of the same word that just don't fit this particular context.",
    "Before looking at the choices, cover the tested word and predict your own replacement based on the surrounding sentence. Then pick whichever answer choice most closely matches that prediction, rather than whichever definition you recognize first.",
  ],
  "satrw-textstructure": [
    "These questions ask how a passage or paragraph is organized as a whole: does it move from a specific example to a broader point, present a problem and then a solution, compare two things, or build toward a single conclusion? Recognizing the shape of a passage matters more here than recalling any individual fact from it.",
    "As you read, briefly notice each paragraph's job: is it introducing an idea, providing evidence, presenting a contrast, or wrapping up? The correct answer will describe that overall shape accurately from start to finish, not just how the passage begins or one section in the middle.",
  ],
  "satrw-purpose": [
    "These questions ask why an author included a specific detail, sentence, or example, not just what that detail says. The same true fact can serve very different purposes depending on context: illustrating a point, creating contrast, building credibility, or setting up a later idea.",
    "The trap is picking an answer that accurately describes the detail itself but misses the reason the author chose to include it. Ask what the sentence accomplishes for the passage as a whole, not just what it means on its own.",
  ],
  "satrw-crosstext": [
    "These questions give you two short, related texts and ask how the second relates to the first: does it support the first text's claim, complicate or contradict it, extend it to a new situation, or simply restate it in different words? Understanding each text individually is only the first step; the real question is about the relationship between them.",
    "Summarize each text's claim in your own words before comparing them. Then ask specifically what Text 2 does to Text 1's claim, since the answer choices usually offer several plausible-sounding relationships and only one accurately describes what's actually happening between the two texts.",
  ],
  "satrw-figurative": [
    "Figurative language, a metaphor or simile, isn't meant to be taken literally; it's a compressed way of conveying an idea, feeling, or comparison. These questions ask what a figurative phrase is really communicating, not what it would mean if taken at face value.",
    "The most common wrong answer takes the image literally instead of interpreting it. If a passage says a crowd \"became an ocean of exhausted travelers,\" the point is the crowd's scale and weary movement, not that the terminal actually filled with water. Ask what feeling or idea the comparison is standing in for.",
  ],
  "satrw-transitions": [
    "Transition questions ask which word or phrase most logically connects two sentences: contrast (however, yet), cause and effect (therefore, as a result), addition (moreover, furthermore), or similarity (similarly, likewise). Picking correctly depends entirely on understanding how the two surrounding ideas actually relate to each other.",
    "Cover the transition, read the two sentences it connects, and ask: do they agree, disagree, does one cause the other, or does one simply add another example? Once you've identified that relationship, only one category of transition word will correctly fit, no matter how sophisticated the other choices sound.",
  ],
  "satrw-rhetoricalsynth": [
    "These questions give you a set of bullet-point notes and a specific goal the writer wants to accomplish, then ask which sentence best uses the notes to meet that exact goal. Every choice will use real information from the notes; the question is which choice actually accomplishes the stated goal, not just which one sounds well written.",
    "Reread the goal carefully before looking at the choices, since it's easy to get pulled toward an answer that's accurate but answers a slightly different question than the one asked. The correct choice usually has to combine two specific pieces of the notes; a choice built from only one note is almost always missing something the goal requires.",
  ],
  "satrw-organization": [
    "These questions present a short, numbered sequence of sentences describing a process or set of events and ask whether one of them is out of order. Since each sentence usually depends on something established earlier, the right placement is often a matter of cause and effect: what has to be true before the next step can happen?",
    "Look for logical dependencies between sentences, like a result that can't occur until its cause is mentioned, or a detail that only makes sense once an earlier step has been established. The sentence that's out of place will usually make more sense once you find the exact point in the sequence it actually belongs.",
  ],
  "satrw-boundaries": [
    "A complete sentence needs a subject, a verb, and a complete thought that can stand entirely on its own. These questions test whether you can spot a fragment, missing one of those pieces, and a run-on or comma splice, two complete sentences incorrectly joined with no punctuation or with only a comma.",
    "To fix a run-on or comma splice, you generally need a period, a semicolon, or a comma paired with a coordinating conjunction like \"and\" or \"but.\" To test whether something is a complete sentence on its own, check that it doesn't start with a subordinating word, like \"because\" or \"although,\" that would make it dependent on another clause.",
  ],
  "satrw-punctuation": [
    "Commas, semicolons, colons, and dashes each have a specific job, and most punctuation questions come down to recognizing which job is actually needed in that sentence rather than guessing based on where a pause feels natural. A colon or semicolon generally requires a complete sentence before it; a comma alone can't join two complete sentences without a conjunction.",
    "Dashes and commas can both set off a nonessential aside, but they can't be mixed within the same pair; if a dash opens an interruption, a matching dash has to close it. When in doubt, identify whether what comes before and after the punctuation mark is a complete sentence on its own, since that single check resolves most punctuation questions.",
  ],
  "satrw-agreement": [
    "A verb has to agree in number with its actual subject, and a pronoun has to agree in number with the noun it refers to, even when other words sit between them and make the true subject harder to spot. Cross out prepositional phrases and other interruptions to find the exact word a verb or pronoun actually needs to match.",
    "Collective nouns like \"team\" or \"committee\" are usually treated as singular, and indefinite pronouns like \"everyone\" or \"each\" are always singular, even though they refer to more than one person. Watch especially for a sentence that starts referring to something one way and then switches partway through.",
  ],
  "satrw-verbforms": [
    "Verb tense has to stay logically consistent with the timeline a sentence or passage establishes, and these questions test whether you can spot a tense that breaks that timeline, an incorrect verb form, or a modifier placed too far from the word it's meant to describe.",
    "When one past event happened before another past event, the earlier one usually needs the past perfect tense (\"had\" plus a past participle) to make the sequence clear. And a modifier at the start of a sentence needs its logical subject to appear immediately after it, or the sentence ends up describing the wrong thing entirely.",
  ],

  // ---------------- SAT MATH ----------------
  "satmath-linear1var": [
    "A linear equation in one variable is solved by isolating that variable: undo addition and subtraction first, then undo multiplication and division, applying the same operation to both sides every time. Digital SAT questions often dress this up by burying the equation inside a word problem, so translating the words into an equation correctly is usually the harder half of the question.",
    "Watch for equations with variables on both sides; combine like terms and move every variable term to one side before isolating it. And when a question describes a real situation, define what the variable actually represents before setting up the equation, since a wrong setup gives a wrong answer no matter how carefully you solve it afterward.",
  ],
  "satmath-linearfunc": [
    "A linear function's graph is a straight line, and its equation, y = mx + b, packs two key values into one expression: m is the slope (the rate the output changes as the input changes), and b is the y-intercept (the value when x is 0). Given two points, the slope is the change in y divided by the change in x.",
    "These questions often describe a linear function in words, a starting value plus a constant rate of change, and ask you to translate that description into an equation or read a specific value off it. The starting value is always the y-intercept, and the rate of change is always the slope, no matter how the scenario is phrased.",
  ],
  "satmath-linear2var": [
    "A linear equation in two variables describes every point on a line, and it can be written in several equivalent forms: slope-intercept (y = mx + b), point-slope (y − y₁ = m(x − x₁)), or standard form (Ax + By = C). Being able to convert between these forms quickly is often the fastest path to an answer.",
    "Two lines are parallel exactly when they share the same slope, and perpendicular exactly when their slopes are negative reciprocals of each other. Questions that describe a line's relationship to another line, or that ask you to write an equation given a point and a slope, almost always reduce to one of these two facts.",
  ],
  "satmath-systems": [
    "A system of two linear equations can be solved by substitution, solving one equation for a variable and plugging that expression into the other, or by elimination, adding or subtracting the equations to cancel out a variable entirely. Both methods always give the same solution; picking whichever is faster for a given system is mostly a matter of practice.",
    "A system has no solution when the two lines are parallel but not identical (same slope, different intercept), and it has infinitely many solutions when the two equations describe the exact same line. Digital SAT questions frequently ask about this special case directly, without ever asking you to actually solve for x and y.",
  ],
  "satmath-linineq": [
    "Solving a linear inequality follows the same steps as solving an equation, with one essential exception: multiplying or dividing both sides by a negative number flips the direction of the inequality sign. Forgetting this single rule is the most common way an otherwise easy inequality question gets missed.",
    "A system of two linear inequalities describes a whole region of the coordinate plane rather than a single line, the overlap of each inequality's own shaded half-plane. Questions that ask which point satisfies a system of inequalities are really just asking which point lands inside that overlapping region.",
  ],
  "satmath-nonlinearfunc": [
    "Nonlinear functions, quadratics, exponentials, and others, don't change at a constant rate the way linear functions do, so their graphs curve instead of forming a straight line. A quadratic's graph is a parabola, and its vertex form, y = a(x − h)² + k, directly reveals the vertex at the point (h, k).",
    "An exponential function, y = a·b^x, grows or shrinks by a constant multiplying factor with every step rather than by a constant added amount; b greater than 1 means growth, and b between 0 and 1 means decay. These questions often ask you to match a real-world description, like a population doubling every year, to the correct type of function and its key values.",
  ],
  "satmath-nonlineareq": [
    "A quadratic equation can be solved by factoring into two binomials whose constant terms multiply to the equation's last term and add to its middle coefficient, or by the quadratic formula when it doesn't factor cleanly. The discriminant, b² − 4ac, tells you how many real solutions to expect before you even solve: positive means two, zero means exactly one, and negative means none.",
    "A system pairing a line with a curve, like a parabola, can be solved by substituting the linear expression into the nonlinear equation, which usually turns the system into a single quadratic equation to solve. Depending on how the line and curve intersect, that system can have zero, one, or two solutions.",
  ],
  "satmath-equivexpr": [
    "Rewriting an expression into an equivalent form, factoring it, expanding it, or simplifying a rational expression, doesn't change its value, only how it's written. These questions test whether you recognize that two differently formatted expressions are actually the same, or can transform one into a more useful form for a specific purpose.",
    "Exponent rules make a lot of this work mechanical: multiplying powers with the same base adds the exponents, dividing subtracts them, and raising a power to another power multiplies them. A difference of squares, x² − y², always factors into (x + y)(x − y), a pattern worth recognizing on sight rather than re-deriving each time.",
  ],
  "satmath-ratios": [
    "A ratio compares two quantities, and a rate compares two quantities with different units, like miles per hour. Most ratio and rate questions can be solved by setting up a proportion, two equal fractions, and cross-multiplying to solve for the unknown value.",
    "Unit conversion questions are really just ratios in disguise: multiplying by a conversion factor written as a fraction (like 60 minutes over 1 hour) lets you cancel out the unit you don't want and keep the one you do. Chaining several conversion factors together handles even multi-step conversions in one continuous calculation.",
  ],
  "satmath-percentages": [
    "A percent is just a ratio out of 100, so \"x percent of y\" always translates directly to (x/100) × y. Percent change is calculated as the amount of change divided by the original starting value, never the new value, which is a distinction the digital SAT tests often.",
    "Percent error follows the same basic structure as percent change: the difference between an estimated and an actual value, divided by the actual value. And when a value increases by one percentage and then decreases by another, the two percentages don't cancel out, since the second percentage applies to a new, already-changed amount.",
  ],
  "satmath-onevardata": [
    "The mean is the sum of all values divided by how many values there are; the median is the middle value once everything is sorted (or the average of the two middle values, for an even-sized data set); and the mode is whichever value appears most often. Each measures the \"center\" of a data set slightly differently, and a question's wording usually signals exactly which one it wants.",
    "The median is far less affected by extreme outliers than the mean, so a data set with one unusually large or small value will often show a mean and median that are noticeably different from each other. Spread, how far values stretch from the center, is often measured by range (the highest value minus the lowest) or by standard deviation, which the digital SAT tests conceptually rather than asking you to calculate directly.",
  ],
  "satmath-twovardata": [
    "A scatterplot shows the relationship between two variables, and these questions ask you to describe that relationship: does it look linear or nonlinear, and if linear, is the association positive (both variables tend to rise together) or negative (one rises as the other falls)? A line of best fit summarizes that overall trend without needing to pass exactly through every point.",
    "Once you have a line of best fit's equation, you can use it to predict a value for any input, even one not directly shown in the data, by plugging that input into the equation like any other function. Questions often ask you to interpret what the slope or y-intercept of that line actually means in the real-world context the scatterplot describes.",
  ],
  "satmath-probability": [
    "Basic probability is a fraction: the number of favorable outcomes divided by the total number of possible outcomes. For two independent events, ones where the outcome of one doesn't affect the other, the probability that both happen is the product of their individual probabilities.",
    "Conditional probability asks for the probability of one event given that another has already happened, which usually means narrowing your total outcomes down to only the ones consistent with that given condition before calculating the fraction. Data presented in a two-way table makes this especially direct: the condition tells you which row or column to restrict your count to.",
  ],
  "satmath-inference": [
    "When a sample is drawn randomly from a larger population, its statistics, like a sample mean or proportion, can be used to estimate the same value for the entire population, as long as the sample was selected in a way that fairly represents that population. A margin of error acknowledges that a sample estimate won't exactly match the true population value, and it defines a range the true value is likely to fall within.",
    "A larger, more carefully selected random sample generally produces a smaller margin of error, meaning a more precise estimate of the true population value. These questions often ask you to interpret what a specific margin of error means in context, or to compare which of two described samples would likely produce the more reliable estimate.",
  ],
  "satmath-statclaims": [
    "An observational study simply records what naturally happens without the researcher assigning any treatment, which means it can reveal a correlation between two variables but can never establish that one directly causes the other. An experiment, by contrast, randomly assigns subjects to different treatment groups, which is what actually allows a causal conclusion to be drawn.",
    "Random assignment is the key ingredient that separates the two: it's specifically what lets researchers rule out other explanations for a difference between groups. These questions often ask you to identify whether a described study can support a causal claim, or only a correlational one, based on whether random assignment was actually used.",
  ],
  "satmath-areavolume": [
    "Area and volume questions are mostly a matter of matching a described shape to its correct formula and plugging in the given values carefully. A rectangular box's volume is length times width times height; a cylinder's volume is its circular base's area multiplied by its height; a sphere's volume is four-thirds pi times the radius cubed.",
    "Because area formulas square a linear dimension like radius or side length, doubling that dimension always quadruples the resulting area, while volume formulas cube a linear dimension, so doubling it multiplies the volume by eight. Questions that ask how a shape's area or volume changes when a dimension scales are really just testing whether you know which power that dimension is raised to.",
  ],
  "satmath-linesangles": [
    "The angles inside any triangle always add up to 180 degrees, a fact that lets you find a missing angle once you know the other two. When two parallel lines are cut by a third line, a transversal, the resulting angles follow predictable relationships: corresponding angles are equal, alternate interior angles are equal, and same-side interior angles add up to 180 degrees.",
    "The triangle inequality theorem requires that the sum of any two sides of a triangle be greater than the third side, or the triangle simply couldn't physically close up; this fact is often used to test which set of three lengths could form a real triangle. And a triangle's exterior angle always equals the sum of the two interior angles that aren't adjacent to it.",
  ],
  "satmath-righttri": [
    "In a right triangle, the Pythagorean theorem, a² + b² = c², relates the two legs to the hypotenuse, the longest side, opposite the right angle. A handful of Pythagorean triples, like 3-4-5 and 5-12-13, show up constantly and let you skip the algebra entirely once you recognize them, along with their multiples.",
    "The three basic trig ratios compare two sides of a right triangle relative to a given angle: sine is opposite over hypotenuse, cosine is adjacent over hypotenuse, and tangent is opposite over adjacent, often remembered with the acronym SOHCAHTOA. Two special right triangles are worth memorizing outright: a 45-45-90 triangle's sides are in the ratio 1 to 1 to the square root of 2, and a 30-60-90 triangle's sides are in the ratio 1 to the square root of 3 to 2.",
  ],
  "satmath-circles": [
    "A circle's area (pi times the radius squared) and circumference (pi times the diameter) are the two most frequently used circle formulas, and most circle questions are really testing whether you plug the right value into the right one. An arc's length or a sector's area is simply a fraction of the whole circle, found by taking the central angle over 360 degrees.",
    "A circle centered at the origin follows the equation x² + y² = r²; shifting its center to the point (h, k) changes the equation to (x − h)² + (y − k)² = r², with r still equal to the radius. An inscribed angle, formed by two chords meeting at the circle's edge, always measures exactly half the arc it intercepts, and any angle inscribed in a semicircle is always exactly 90 degrees.",
  ],
};
