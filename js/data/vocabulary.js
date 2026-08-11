// A reference vocabulary deck for English/Reading: words that show up
// again and again in ACT passages, answer choices, and question stems.
// Structured to match js/data/scienceBackground.js (sections of topics,
// each with flashcards) so it can share the same flashcard/quiz UI pattern.

export const VOCABULARY = {
  title: "ACT Vocabulary Builder",
  subtitle: "Words that keep showing up in ACT Reading passages, English answer choices, and question stems.",
  sections: [
    {
      domain: "Tone & Argument",
      icon: "🗣️",
      topics: [
        {
          id: "vocab-tone",
          title: "Describing Tone & Argument",
          paragraphs: [
            "ACT Reading questions often ask you to identify an author's tone or attitude, and English questions sometimes ask which word choice best fits a passage's tone. These words describe the flavor of how someone is arguing or feeling, not just what they're saying.",
          ],
          flashcards: [
            { front: "ambivalent", back: "Having mixed or conflicting feelings about something, not clearly for or against it." },
            { front: "skeptical", back: "Not easily convinced; doubtful that a claim is true until shown solid evidence." },
            { front: "candid", back: "Openly honest and direct, even about things that might be uncomfortable to admit." },
            { front: "conciliatory", back: "Intended to smooth over a disagreement and make peace rather than fight further." },
            { front: "vehement", back: "Expressed with intense, forceful feeling; strongly emphatic." },
            { front: "wry", back: "Dryly humorous, often in a way that points out something ironic." },
            { front: "earnest", back: "Sincere and serious about what you mean; not joking or halfhearted." },
            { front: "cynical", back: "Assuming people are motivated mainly by self-interest; distrustful of good intentions." },
            { front: "nostalgic", back: "Feeling a sentimental longing for a fondly remembered time in the past." },
            { front: "indignant", back: "Feeling or showing anger because something seems unfair or wrong." },
          ],
        },
      ],
    },
    {
      domain: "Change & Process",
      icon: "🔄",
      topics: [
        {
          id: "vocab-change",
          title: "Describing Change & Process",
          paragraphs: [
            "Science and Reading passages frequently describe how something changes over time — a population, a technology, an idea. These words let you describe the shape and pace of that change precisely instead of just saying 'it changed.'",
          ],
          flashcards: [
            { front: "gradual", back: "Happening slowly, in small steps, rather than all at once." },
            { front: "catalyst", back: "Something that triggers or speeds up a change, without necessarily being changed itself." },
            { front: "culminate", back: "To build up over time and reach a final, climactic point." },
            { front: "derive", back: "To obtain or trace something from an earlier source or origin." },
            { front: "mitigate", back: "To make a harmful effect less severe or less serious." },
            { front: "proliferate", back: "To increase rapidly in number, spreading quickly." },
            { front: "stagnant", back: "Not growing, developing, or changing; stuck in place." },
            { front: "transient", back: "Lasting only a short time; passing through quickly." },
            { front: "wane", back: "To gradually decrease in strength, size, or importance." },
            { front: "evolve", back: "To develop gradually, often becoming more complex or better adapted over time." },
          ],
        },
      ],
    },
    {
      domain: "Precision & Logic",
      icon: "🧩",
      topics: [
        {
          id: "vocab-logic",
          title: "Precision & Logic Words",
          paragraphs: [
            "ACT English and Reading both reward noticing exactly how solid (or shaky) a piece of reasoning is. These words describe how clear, consistent, or well-supported a claim or piece of writing is.",
          ],
          flashcards: [
            { front: "ambiguous", back: "Open to more than one interpretation; not clearly one specific meaning." },
            { front: "arbitrary", back: "Based on random choice or personal whim, rather than a clear reason or system." },
            { front: "coherent", back: "Logically consistent and easy to follow; the parts fit together clearly." },
            { front: "corroborate", back: "To support or confirm a claim with additional evidence." },
            { front: "discrepancy", back: "A difference or mismatch between two things that should otherwise agree." },
            { front: "inference", back: "A conclusion reached from evidence and reasoning, rather than stated directly." },
            { front: "plausible", back: "Reasonable and believable, even if not proven for certain." },
            { front: "redundant", back: "Needlessly repetitive; saying the same thing again without adding anything new." },
            { front: "substantiate", back: "To provide solid evidence that proves or supports a claim." },
            { front: "tangential", back: "Only loosely related to the main topic; a side point rather than the core one." },
          ],
        },
      ],
    },
    {
      domain: "Academic Description",
      icon: "📚",
      topics: [
        {
          id: "vocab-academic",
          title: "Academic Description Words",
          paragraphs: [
            "These words appear constantly in the academic and journalistic writing the ACT draws its passages from. Knowing them cold saves you from getting stuck decoding vocabulary instead of focusing on the actual question.",
          ],
          flashcards: [
            { front: "comprehensive", back: "Covering something completely, including all or nearly all relevant parts." },
            { front: "discern", back: "To notice or recognize something, especially something subtle or hard to see clearly." },
            { front: "empirical", back: "Based on observation or experiment, rather than theory alone." },
            { front: "nuanced", back: "Showing subtle, careful distinctions rather than treating something as simple or one-sided." },
            { front: "pragmatic", back: "Focused on practical results rather than theory or ideals." },
            { front: "prevalent", back: "Widespread; common in a particular place or at a particular time." },
            { front: "subjective", back: "Based on personal feelings or opinions, rather than objective facts." },
            { front: "superficial", back: "Only concerned with or affecting the surface; not deep or thorough." },
            { front: "ubiquitous", back: "Seeming to be everywhere at once; extremely common." },
            { front: "viable", back: "Capable of working successfully; a realistic option." },
          ],
        },
      ],
    },
  ],
};
