// Original prompts written for this app in the real ACT Writing format: an
// issue statement followed by three distinct perspectives on it, each
// deliberately different enough from the other two (not just a "for/against/
// neutral" template) that a strong response has to actually engage with the
// specific reasoning in each one rather than restating a side. None of
// these are real ACT prompts — the format is public knowledge, the content
// here is new.
export const essayPrompts = [
  {
    id: "school-schedules",
    title: "Later School Start Times",
    issueStatement:
      "Many school districts are considering pushing back the start of the school day for teenagers, citing research on adolescent sleep needs. Later start times could mean better-rested, more attentive students, but they also ripple into after-school jobs, sports schedules, and family routines built around the old timetable.",
    perspectives: [
      { label: "Perspective One", text: "Sleep science should drive the schedule. If teenagers biologically can't fall asleep early, forcing an early start time just guarantees a chronically tired student body, no matter how well-intentioned the rest of the school day is." },
      { label: "Perspective Two", text: "Schedules exist to serve the whole community, not just the science of one group. Parents' work hours, bus routes shared with younger kids, and after-school commitments were all built around the current schedule, and changing it just shifts the burden onto other people." },
      { label: "Perspective Three", text: "The real fix isn't the clock, it's everything competing for a teenager's evening: homework load, jobs, sports, and screens. Moving the start time treats a symptom while leaving the actual causes of lost sleep untouched." },
    ],
  },
  {
    id: "ai-in-classrooms",
    title: "AI Tools in the Classroom",
    issueStatement:
      "AI writing and research tools are now common enough that most students have access to them, whether or not a school formally allows their use. Some educators want to teach with these tools directly; others worry that doing so undercuts the very skills school is supposed to build.",
    perspectives: [
      { label: "Perspective One", text: "Banning tools that exist in the real world doesn't prepare students for it. Teaching students to use AI well, including its limits, is a more honest and more useful skill than pretending the tool doesn't exist." },
      { label: "Perspective Two", text: "Some struggle is the point. If a tool can do the hard part of an assignment for you, the assignment stops teaching what it was designed to teach, no matter how useful that tool might be later in life." },
      { label: "Perspective Three", text: "This isn't a yes-or-no question, it's a question of which tasks. Using a tool to brainstorm is different from using it to write a final draft, and treating every use the same way misses that distinction entirely." },
    ],
  },
  {
    id: "public-monuments",
    title: "Renaming and Removing Public Monuments",
    issueStatement:
      "Communities across the country have debated whether to remove, relocate, or add context to public monuments honoring historical figures whose legacies are now seen as more complicated than when the monument was built. Supporters and opponents of removal often agree the history matters; they disagree about what a monument is actually for.",
    perspectives: [
      { label: "Perspective One", text: "A monument is an honor, not a history lesson. Keeping one standing for a figure a community no longer wants to honor sends an active message about whose legacy is celebrated today, regardless of what that figure did in the past." },
      { label: "Perspective Two", text: "Removing a monument doesn't erase what it commemorates, it just removes the physical reminder and the conversation that comes with encountering it. Adding context alongside the monument teaches more than an empty pedestal ever could." },
      { label: "Perspective Three", text: "These decisions are being made monument by monument, community by community, with no shared standard for what crosses the line. Without one, the same debate just repeats endlessly with no resolution either side finds fair." },
    ],
  },
  {
    id: "social-media-minimum-age",
    title: "A Minimum Age for Social Media",
    issueStatement:
      "Several proposals would require government-verified age checks before anyone can create a social media account, aiming to keep younger children off platforms linked to mental health concerns. The proposals raise a real tension between protecting kids and how much verification a platform should be able to demand of everyone.",
    perspectives: [
      { label: "Perspective One", text: "Protecting kids from a documented harm is worth the inconvenience. Other products, from movies to driving, already require age verification, and social media's effects on young users are serious enough to deserve the same treatment." },
      { label: "Perspective Two", text: "Verifying everyone's age to protect a fraction of users trades away privacy for the whole platform's user base. There are narrower ways to protect kids that don't require every adult to hand over identifying information first." },
      { label: "Perspective Three", text: "Age checks address who's logging in, not what happens once they're on the platform. The actual harms come from how these platforms are designed to hold attention, and that design doesn't change just because a birthdate was verified." },
    ],
  },
  {
    id: "four-day-school-week",
    title: "The Four-Day School Week",
    issueStatement:
      "A growing number of districts, particularly in rural areas, have shifted to a four-day school week, usually adding time to the remaining four days to preserve total instructional hours. Districts report savings on transportation and staffing, but the change also reshapes what families do with the freed-up day.",
    perspectives: [
      { label: "Perspective One", text: "If the total instructional hours stay the same, the number of days they're spread across is a scheduling detail, not an educational one. Districts under real budget pressure should be free to make that trade without being told it harms learning." },
      { label: "Perspective Two", text: "A longer school day asks more of younger students' attention spans than a standard day already does, and an extra day off doesn't make up for material that was harder to absorb in the first place." },
      { label: "Perspective Three", text: "The fifth day doesn't disappear, it just becomes someone else's responsibility, usually a working parent's. A schedule that looks efficient on a district budget can still create a real childcare gap for the families it serves." },
    ],
  },
  {
    id: "internships-for-credit",
    title: "Required Work Experience for Graduation",
    issueStatement:
      "Some high schools now require students to complete an internship, apprenticeship, or other structured work experience to graduate, arguing that classroom learning alone doesn't prepare students for life after school. Others worry the requirement adds a burden that not every student and not every community can meet equally.",
    perspectives: [
      { label: "Perspective One", text: "Classroom learning and real work experience teach different things, and only one of them is currently required. A diploma should certify that a student is actually ready for what comes next, not just that they passed their classes." },
      { label: "Perspective Two", text: "Not every student has equal access to internships. Students in well-connected families or well-resourced areas will always find placements more easily, turning a graduation requirement into an advantage some students simply don't have." },
      { label: "Perspective Three", text: "A required placement, done badly, teaches less than an elective one a student actually chose. Motivation matters as much as access, and a requirement can't manufacture the first even if a school solves the second." },
    ],
  },
];
