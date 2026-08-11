// Quiz banks for the vocabulary flashcard decks in vocabulary.js, keyed by
// topic id. Same {q, choices, answer, explain} shape as every other
// question bank in the app.

export const VOCAB_QUESTIONS = {
  "vocab-tone": [
    {
      q: "Which word best describes someone who has mixed, conflicting feelings about a decision?",
      choices: ["vehement", "ambivalent", "candid", "nostalgic"],
      answer: 1,
      explain: "Ambivalent means holding mixed or conflicting feelings about something at the same time.",
    },
    {
      q: "\"Despite years of promises, the senator remained ___ about whether the new policy would actually work.\" Which word fits best?",
      choices: ["skeptical", "nostalgic", "conciliatory", "earnest"],
      answer: 0,
      explain: "Skeptical describes doubt that a claim is true until shown solid evidence — a good fit for withholding belief in a promise.",
    },
    {
      q: "A reviewer who gives blunt, honest feedback even when it's unwelcome is being:",
      choices: ["cynical", "wry", "candid", "ambivalent"],
      answer: 2,
      explain: "Candid means openly and directly honest, even about uncomfortable things.",
    },
    {
      q: "After the heated debate, the mediator's ___ tone helped both sides find common ground.",
      choices: ["vehement", "conciliatory", "indignant", "cynical"],
      answer: 1,
      explain: "Conciliatory describes language meant to smooth over disagreement and make peace.",
    },
    {
      q: "Which word describes speech delivered with intense, forceful emotion?",
      choices: ["wry", "earnest", "vehement", "ambivalent"],
      answer: 2,
      explain: "Vehement means expressed with intense, forceful feeling.",
    },
    {
      q: "The comedian's ___ remark pointed out the irony of the situation without being outright mocking.",
      choices: ["wry", "vehement", "indignant", "nostalgic"],
      answer: 0,
      explain: "Wry describes dry, understated humor that often highlights irony.",
    },
    {
      q: "A student who sincerely means every word of their apology, without any sarcasm, is being:",
      choices: ["cynical", "skeptical", "wry", "earnest"],
      answer: 3,
      explain: "Earnest means sincere and serious, the opposite of joking or halfhearted.",
    },
    {
      q: "Someone who assumes politicians are only ever motivated by self-interest holds a ___ view of politics.",
      choices: ["candid", "cynical", "conciliatory", "nostalgic"],
      answer: 1,
      explain: "Cynical describes distrust that assumes people act mainly out of self-interest.",
    },
    {
      q: "Looking through old photos of her childhood home, she felt a ___ pang.",
      choices: ["skeptical", "indignant", "nostalgic", "ambivalent"],
      answer: 2,
      explain: "Nostalgic describes a sentimental longing for a fondly remembered past.",
    },
    {
      q: "Which word means feeling angry because something seems unfair?",
      choices: ["indignant", "ambivalent", "wry", "conciliatory"],
      answer: 0,
      explain: "Indignant describes anger provoked by something that seems unjust.",
    },
  ],
  "vocab-change": [
    {
      q: "A change that happens slowly, in small steps rather than all at once, is best described as:",
      choices: ["transient", "gradual", "stagnant", "arbitrary"],
      answer: 1,
      explain: "Gradual means happening slowly, in small increments.",
    },
    {
      q: "\"A sudden drop in prices acted as a ___ for the industry's rapid transformation.\" Which word fits?",
      choices: ["catalyst", "discrepancy", "inference", "stagnant"],
      answer: 0,
      explain: "A catalyst is something that triggers or speeds up a change.",
    },
    {
      q: "Years of small conflicts finally ___ in a full-scale strike. Which word fits?",
      choices: ["waned", "derived", "culminated", "mitigated"],
      answer: 2,
      explain: "Culminate means to build up over time and reach a climactic final point.",
    },
    {
      q: "The word \"derive\" most nearly means:",
      choices: ["to obtain from an earlier source", "to slow down sharply", "to spread rapidly", "to stay the same"],
      answer: 0,
      explain: "Derive means to trace or obtain something from an earlier origin.",
    },
    {
      q: "New regulations were introduced to ___ the environmental damage caused by the factory.",
      choices: ["proliferate", "mitigate", "wane", "culminate"],
      answer: 1,
      explain: "Mitigate means to make a harmful effect less severe.",
    },
    {
      q: "Which word describes something increasing rapidly in number?",
      choices: ["stagnant", "transient", "proliferating", "waning"],
      answer: 2,
      explain: "Proliferate means to increase rapidly in number, spreading quickly.",
    },
    {
      q: "A pond with no fresh water flowing in or out, where nothing changes, is best described as:",
      choices: ["stagnant", "gradual", "transient", "evolving"],
      answer: 0,
      explain: "Stagnant describes something not growing, developing, or changing — stuck in place.",
    },
    {
      q: "The tour was in town only briefly, its presence entirely ___.",
      choices: ["ubiquitous", "transient", "coherent", "empirical"],
      answer: 1,
      explain: "Transient means lasting only a short time before passing through.",
    },
    {
      q: "As interest in the fad ___, fewer and fewer people attended the events.",
      choices: ["proliferated", "culminated", "waned", "derived"],
      answer: 2,
      explain: "Wane means to gradually decrease in strength or importance.",
    },
    {
      q: "Over millions of years, the species ___ to survive in a colder climate.",
      choices: ["evolved", "waned", "substantiated", "discerned"],
      answer: 0,
      explain: "Evolve means to develop gradually, often becoming better adapted over time.",
    },
  ],
  "vocab-logic": [
    {
      q: "A sentence that could reasonably be read two different ways is:",
      choices: ["coherent", "ambiguous", "plausible", "redundant"],
      answer: 1,
      explain: "Ambiguous means open to more than one interpretation.",
    },
    {
      q: "A rule applied with no clear reasoning behind it, seemingly by whim, is:",
      choices: ["arbitrary", "coherent", "tangential", "substantiated"],
      answer: 0,
      explain: "Arbitrary means based on random choice or personal whim rather than a clear system.",
    },
    {
      q: "An essay whose ideas logically connect from one paragraph to the next is:",
      choices: ["redundant", "ambiguous", "coherent", "arbitrary"],
      answer: 2,
      explain: "Coherent means logically consistent, with the parts fitting clearly together.",
    },
    {
      q: "\"Independent lab results ___ the scientist's original findings.\" Which word fits best?",
      choices: ["corroborated", "contradicted itself with", "were tangential to", "were redundant with"],
      answer: 0,
      explain: "Corroborate means to support or confirm a claim with additional evidence.",
    },
    {
      q: "A noticeable mismatch between what was reported and what actually happened is a:",
      choices: ["inference", "discrepancy", "catalyst", "nuance"],
      answer: 1,
      explain: "Discrepancy is a difference or mismatch between two things that should agree.",
    },
    {
      q: "A conclusion you reach from evidence, without it being stated directly, is an:",
      choices: ["inference", "arbitrary claim", "discrepancy", "empirical study"],
      answer: 0,
      explain: "Inference is a conclusion reached through reasoning rather than direct statement.",
    },
    {
      q: "\"It's ___ that the delay was caused by weather, though we can't be fully certain.\" Which word fits?",
      choices: ["redundant", "tangential", "plausible", "arbitrary"],
      answer: 2,
      explain: "Plausible means reasonable and believable, even without full proof.",
    },
    {
      q: "Saying \"a free gift, given at no cost\" is an example of being:",
      choices: ["redundant", "coherent", "ambiguous", "empirical"],
      answer: 0,
      explain: "Redundant means needlessly repeating something without adding new meaning — 'free' already means 'no cost.'",
    },
    {
      q: "To ___ a claim means to provide solid evidence proving it true.",
      choices: ["substantiate", "discern", "wane", "mitigate"],
      answer: 0,
      explain: "Substantiate means to provide solid evidence that supports or proves a claim.",
    },
    {
      q: "A detail that's only loosely related to the main topic, more of a side note, is:",
      choices: ["coherent", "empirical", "tangential", "plausible"],
      answer: 2,
      explain: "Tangential describes something only loosely connected to the main point.",
    },
  ],
  "vocab-academic": [
    {
      q: "A report that covers every relevant aspect of a topic thoroughly is:",
      choices: ["comprehensive", "superficial", "subjective", "tangential"],
      answer: 0,
      explain: "Comprehensive means covering something completely, including all or nearly all relevant parts.",
    },
    {
      q: "To notice a subtle distinction that's easy to miss is to:",
      choices: ["derive", "discern", "proliferate", "mitigate"],
      answer: 1,
      explain: "Discern means to notice or recognize something, especially something subtle.",
    },
    {
      q: "A conclusion based on direct observation or experiment, not just theory, is described as:",
      choices: ["empirical", "arbitrary", "nostalgic", "redundant"],
      answer: 0,
      explain: "Empirical means based on observation or experiment rather than theory alone.",
    },
    {
      q: "An analysis that carefully distinguishes subtle shades of meaning, rather than treating a topic as simple, is:",
      choices: ["superficial", "nuanced", "arbitrary", "ubiquitous"],
      answer: 1,
      explain: "Nuanced means showing careful, subtle distinctions rather than an oversimplified view.",
    },
    {
      q: "A leader who focuses on what will actually work rather than sticking to abstract ideals is:",
      choices: ["pragmatic", "cynical", "candid", "ambivalent"],
      answer: 0,
      explain: "Pragmatic means focused on practical results rather than theory or ideals.",
    },
    {
      q: "A style of dress that is common nearly everywhere in a region is:",
      choices: ["transient", "prevalent", "tangential", "coherent"],
      answer: 1,
      explain: "Prevalent means widespread or common in a particular place or time.",
    },
    {
      q: "A review based on the critic's personal taste rather than agreed-upon standards is:",
      choices: ["subjective", "empirical", "comprehensive", "viable"],
      answer: 0,
      explain: "Subjective means based on personal feelings or opinions rather than objective facts.",
    },
    {
      q: "An analysis that only skims the surface without digging into real causes is:",
      choices: ["comprehensive", "nuanced", "superficial", "empirical"],
      answer: 2,
      explain: "Superficial means only concerned with the surface, not deep or thorough.",
    },
    {
      q: "Smartphones have become so common they're now practically:",
      choices: ["ubiquitous", "transient", "arbitrary", "subjective"],
      answer: 0,
      explain: "Ubiquitous means seeming to be everywhere at once; extremely common.",
    },
    {
      q: "A backup plan that could realistically be carried out is described as:",
      choices: ["viable", "redundant", "ambiguous", "superficial"],
      answer: 0,
      explain: "Viable means capable of working successfully — a realistic option.",
    },
  ],
};
