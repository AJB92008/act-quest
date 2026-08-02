// A single comprehensive reference lesson covering the outside background
// knowledge ACT Science passages assume you already have, organized by
// subject. This is not tied to the skill tree; it's pure teaching content,
// with its own flashcards and quiz per topic (see backgroundQuestions/index.js).
export const SCIENCE_BACKGROUND = {
  title: "ACT Science Background Knowledge",
  subtitle:
    "ACT Science doesn't test memorized facts directly, but its passages and questions assume you already know this background. Here are all 18 core concepts, plus the calculator-free math skills, in one place.",
  sections: [
    {
      domain: "Biology",
      icon: "🧬",
      topics: [
        {
          id: "bio-organelles",
          title: "Cell Organelles and Their Functions",
          paragraphs: [
            "The nucleus houses the cell's DNA and controls its activities, acting as the cell's control center. Mitochondria are the \"powerhouses\" of the cell, breaking down glucose through cellular respiration to produce ATP, the cell's usable energy currency.",
            "Chloroplasts, found only in plant cells and some protists, capture light energy and convert it into chemical energy through photosynthesis. Lysosomes contain digestive enzymes that break down waste, worn out organelles, and foreign material.",
            "The cell membrane is a selectively permeable barrier that controls what enters and exits the cell, built from a phospholipid bilayer. Ribosomes, found either floating in the cytoplasm or attached to the endoplasmic reticulum, are the sites where proteins are assembled from amino acids.",
          ],
          flashcards: [
            { front: "What does the mitochondria do?", back: "Breaks down glucose through cellular respiration to produce ATP, the cell's energy currency, earning it the nickname \"powerhouse of the cell.\"" },
            { front: "What does the nucleus do?", back: "Houses the cell's DNA and controls the cell's activities, acting as its control center." },
            { front: "What do chloroplasts do, and where are they found?", back: "Found in plant cells (and some protists), they capture light energy and convert it into chemical energy through photosynthesis." },
            { front: "What do lysosomes and ribosomes do?", back: "Lysosomes digest waste and worn out organelles using enzymes. Ribosomes assemble proteins from amino acids." },
          ],
        },
        {
          id: "bio-dna-rna",
          title: "DNA vs. RNA",
          paragraphs: [
            "DNA (deoxyribonucleic acid) stores an organism's genetic instructions in a double stranded helix, using the bases adenine, thymine, guanine, and cytosine, where A pairs with T and G pairs with C.",
            "RNA (ribonucleic acid) is single stranded, uses the sugar ribose instead of deoxyribose, and swaps thymine for uracil, so A pairs with U instead. While DNA stays safely stored in the nucleus, RNA carries genetic instructions out to the ribosomes, where proteins are actually built.",
          ],
          flashcards: [
            { front: "Name three structural differences between DNA and RNA.", back: "DNA is double stranded, uses deoxyribose sugar, and pairs A with T. RNA is single stranded, uses ribose sugar, and pairs A with U instead of T." },
            { front: "Where does DNA stay, and what does RNA do?", back: "DNA stays in the nucleus; RNA carries genetic instructions out to the ribosomes where proteins are built." },
          ],
        },
        {
          id: "bio-protein-synthesis",
          title: "Protein Synthesis: Transcription and Translation",
          paragraphs: [
            "Making a protein happens in two main steps. Transcription happens in the nucleus, where an enzyme called RNA polymerase copies a gene's DNA sequence into a strand of messenger RNA (mRNA).",
            "Translation happens at the ribosome, where the mRNA sequence is read three bases at a time (each three base unit is called a codon), and transfer RNA (tRNA) brings in the matching amino acid for each codon, building a chain that folds into a functional protein.",
          ],
          flashcards: [
            { front: "What happens during transcription, and where?", back: "In the nucleus, RNA polymerase copies a gene's DNA sequence into a strand of messenger RNA (mRNA)." },
            { front: "What happens during translation, and where?", back: "At the ribosome, mRNA is read three bases (a codon) at a time, and tRNA brings in the matching amino acid to build a protein chain." },
          ],
        },
        {
          id: "bio-natural-selection",
          title: "Natural Selection",
          paragraphs: [
            "Natural selection is the process by which organisms with traits better suited to their environment survive and reproduce at higher rates, passing those traits to their offspring. Over many generations, this shifts a population's traits toward whatever helps it survive and reproduce, a mechanism Charles Darwin proposed to explain how species change, or evolve, over time.",
            "It requires three ingredients: variation in traits within a population, that variation being heritable (passed from parent to offspring), and that variation actually affecting survival or reproductive success.",
          ],
          flashcards: [
            { front: "What three ingredients does natural selection require?", back: "Variation in traits within a population, that variation being heritable, and that variation affecting survival or reproduction." },
            { front: "Who proposed natural selection as the mechanism of evolution?", back: "Charles Darwin." },
          ],
        },
        {
          id: "bio-greenhouse-gases",
          title: "Greenhouse Gases",
          paragraphs: [
            "Greenhouse gases, like carbon dioxide, methane, and water vapor, trap heat in Earth's atmosphere by absorbing and re-emitting infrared radiation that would otherwise escape into space.",
            "This natural greenhouse effect keeps Earth warm enough to support life, but rising concentrations of these gases, largely from burning fossil fuels, are trapping additional heat and driving global climate change. ACT Science passages on this topic often present data on rising CO2 levels alongside rising global temperatures.",
          ],
          flashcards: [
            { front: "Name three greenhouse gases.", back: "Carbon dioxide, methane, and water vapor." },
            { front: "How do greenhouse gases warm the atmosphere?", back: "They trap heat by absorbing and re-emitting infrared radiation that would otherwise escape into space." },
          ],
        },
        {
          id: "bio-photo-respiration",
          title: "Photosynthesis vs. Cellular Respiration",
          paragraphs: [
            "Photosynthesis and cellular respiration are essentially opposite reactions. Photosynthesis, which happens in chloroplasts, uses carbon dioxide, water, and light energy to produce glucose and oxygen: 6CO2 + 6H2O + light energy makes C6H12O6 + 6O2.",
            "Cellular respiration, which happens in mitochondria, uses glucose and oxygen to release stored energy as ATP, producing carbon dioxide and water as byproducts: C6H12O6 + 6O2 makes 6CO2 + 6H2O + ATP (energy). Notice that the reactants of one reaction are exactly the products of the other.",
          ],
          flashcards: [
            { front: "Write the photosynthesis equation.", back: "6CO2 + 6H2O + light energy makes C6H12O6 + 6O2." },
            { front: "Write the cellular respiration equation.", back: "C6H12O6 + 6O2 makes 6CO2 + 6H2O + ATP (energy)." },
            { front: "Where do photosynthesis and cellular respiration each happen?", back: "Photosynthesis happens in chloroplasts; cellular respiration happens in mitochondria." },
          ],
        },
        {
          id: "bio-taxonomy",
          title: "Taxonomic Ranks",
          paragraphs: [
            "Biologists classify living things using a nested hierarchy of ranks, from broadest to most specific: Domain, Kingdom, Phylum, Class, Order, Family, Genus, and Species, often remembered with a mnemonic like \"Dear King Philip Came Over For Good Soup.\"",
            "Each rank groups organisms that share more and more specific characteristics; species is the most specific rank, referring to a group of organisms that can interbreed and produce fertile offspring.",
          ],
          flashcards: [
            { front: "List the 8 taxonomic ranks from broadest to most specific.", back: "Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species." },
            { front: "What defines a species?", back: "A group of organisms that can interbreed and produce fertile offspring." },
          ],
        },
        {
          id: "bio-genetics",
          title: "Basic Genetics: Dominant and Recessive Alleles",
          paragraphs: [
            "Genes come in different versions called alleles; an organism typically inherits one allele from each parent. A dominant allele, usually written with a capital letter like B, determines the organism's observable trait (its phenotype) whenever it's present, masking a recessive allele, usually written with a lowercase letter like b.",
            "A recessive trait only shows up when an organism inherits two copies of the recessive allele (bb). An organism's actual pair of alleles is its genotype: homozygous dominant (BB), homozygous recessive (bb), or heterozygous (Bb, which displays the dominant trait since B masks b).",
          ],
          flashcards: [
            { front: "What's the difference between genotype and phenotype?", back: "Genotype is an organism's actual pair of alleles (like Bb); phenotype is the observable trait that results." },
            { front: "In a heterozygous pair (Bb), which trait shows?", back: "The dominant trait, since the dominant allele (B) masks the recessive allele (b)." },
          ],
        },
      ],
    },
    {
      domain: "Chemistry",
      icon: "⚗️",
      topics: [
        {
          id: "chem-molecules",
          title: "Basic Molecular Structures",
          paragraphs: [
            "Carbohydrates (sugars and starches) are built from carbon, hydrogen, and oxygen and serve as the body's primary energy source. Fats (lipids) are built from glycerol and fatty acid chains; they store energy long term and also form cell membranes.",
            "Proteins are built from chains of amino acids folded into specific shapes, and they carry out most of the actual work in cells, from enzymes to structural material. Nucleic acids (DNA and RNA) are built from repeating units called nucleotides, each made of a sugar, a phosphate group, and a nitrogen containing base, and they store and transmit genetic information.",
          ],
          flashcards: [
            { front: "What are carbohydrates made of, and what's their job?", back: "Carbon, hydrogen, and oxygen; they're the body's primary energy source." },
            { front: "What are proteins built from?", back: "Chains of amino acids folded into specific shapes." },
            { front: "What are nucleic acids built from?", back: "Repeating units called nucleotides, each made of a sugar, a phosphate group, and a nitrogen containing base." },
          ],
        },
        {
          id: "chem-water-temps",
          title: "Freezing and Boiling Points of Water",
          paragraphs: [
            "At standard atmospheric pressure, water freezes at 0 degrees Celsius and boils at 100 degrees Celsius. These two fixed points are exactly what the Celsius scale was originally built around, and ACT Science graphs involving temperature almost always use Celsius, so it's worth having these two benchmarks memorized cold.",
          ],
          flashcards: [
            { front: "What are water's freezing and boiling points in Celsius?", back: "Freezes at 0 degrees C, boils at 100 degrees C, at standard atmospheric pressure." },
          ],
        },
        {
          id: "chem-ph",
          title: "The pH Scale",
          paragraphs: [
            "The pH scale runs from 0 to 14 and measures how acidic or basic (alkaline) a solution is, based on the concentration of hydrogen ions it contains. A pH of 7 is neutral, like pure water; values below 7 are acidic, with lower numbers being more acidic (like stomach acid or lemon juice); and values above 7 are basic, with higher numbers being more basic (like bleach or ammonia).",
            "Each whole step on the pH scale represents a tenfold change in acidity, so a solution with pH 4 is ten times more acidic than one with pH 5.",
          ],
          flashcards: [
            { front: "What pH is neutral, and what does above or below it mean?", back: "pH 7 is neutral. Below 7 is acidic (lower means more acidic); above 7 is basic (higher means more basic)." },
            { front: "How much does each whole pH step change acidity?", back: "By a factor of ten; each step is a tenfold change." },
          ],
        },
        {
          id: "chem-molar-mass",
          title: "Molar Mass Concepts",
          paragraphs: [
            "A mole is a fixed count of particles, roughly 6.022 times 10 to the 23rd power of them, and a substance's molar mass is the mass, in grams, of one mole of that substance. It's numerically equal to the substance's atomic or molecular weight found on the periodic table.",
            "Molar mass is the conversion factor that lets chemists translate between a measurable quantity (grams) and a countable quantity (moles of atoms or molecules), which matters whenever an ACT Science passage compares amounts of different substances.",
          ],
          flashcards: [
            { front: "What is a mole?", back: "A fixed count of particles, about 6.022 times 10 to the 23rd power of them." },
            { front: "What does molar mass let you convert between?", back: "Grams (a measurable quantity) and moles of atoms or molecules (a countable quantity)." },
          ],
        },
        {
          id: "chem-atomic-particles",
          title: "Atomic Particles and Charge Interactions",
          paragraphs: [
            "Atoms are built from three particles: protons (positively charged, found in the nucleus), neutrons (no charge, also found in the nucleus), and electrons (negatively charged, found in a cloud surrounding the nucleus).",
            "An atom with equal protons and electrons is electrically neutral; gaining or losing electrons creates a charged ion. A negative ion (anion) has gained electrons, while a positive ion (cation) has lost electrons. Opposite charges attract each other, and like charges repel, which is the basis for how ions bond and how charged particles interact in general.",
          ],
          flashcards: [
            { front: "What are the charges of protons, neutrons, and electrons?", back: "Protons are positive, neutrons are neutral, electrons are negative." },
            { front: "What's the difference between a cation and an anion?", back: "A cation is a positive ion that lost electrons; an anion is a negative ion that gained electrons." },
          ],
        },
        {
          id: "chem-phase-changes",
          title: "Phase Changes: Solid, Liquid, and Gas",
          paragraphs: [
            "Matter shifts between the solid, liquid, and gas phases as energy, usually heat, is added or removed. Adding energy melts a solid into a liquid, then boils or evaporates that liquid into a gas; removing energy condenses a gas into a liquid, then freezes that liquid into a solid.",
            "Solids have a fixed shape and volume, liquids have a fixed volume but take the shape of their container, and gases have neither a fixed shape nor a fixed volume, expanding to fill whatever space they're in.",
          ],
          flashcards: [
            { front: "What phase change happens when you add energy to a solid, then to that liquid?", back: "Solid to liquid is melting; liquid to gas is boiling or evaporating." },
            { front: "Which phase or phases have a fixed volume?", back: "Solids and liquids have a fixed volume; gases do not, they expand to fill their container." },
          ],
        },
      ],
    },
    {
      domain: "Physics",
      icon: "🧲",
      topics: [
        {
          id: "phys-gravity",
          title: "Gravity",
          paragraphs: [
            "Gravity is the force of attraction between any two objects with mass; the more mass an object has, the stronger its gravitational pull, and that pull weakens the farther apart two objects are.",
            "On Earth's surface, gravity accelerates falling objects at a roughly constant rate, about 9.8 meters per second squared, which is why, ignoring air resistance, a heavy object and a light object dropped from the same height hit the ground at the same time.",
          ],
          flashcards: [
            { front: "What determines the strength of gravity between two objects?", back: "Their masses (more mass means a stronger pull) and the distance between them (farther apart means a weaker pull)." },
            { front: "Ignoring air resistance, which falls faster: a heavy object or a light object?", back: "Neither, they fall at the same rate (about 9.8 m/s^2) and hit the ground at the same time." },
          ],
        },
        {
          id: "phys-density-formula",
          title: "The Density Formula",
          paragraphs: [
            "Density measures how much mass is packed into a given amount of space, calculated as Density = Mass / Volume. Two objects can have the same volume but very different densities if one has more mass packed into that same space, like a brick versus a foam block of the same size.",
            "ACT Science tables often ask you to calculate or compare densities directly from given mass and volume data, so being comfortable rearranging this formula (to solve for mass or volume instead) is worth practicing.",
          ],
          flashcards: [
            { front: "What is the density formula?", back: "Density = Mass / Volume." },
          ],
        },
        {
          id: "phys-density-rules",
          title: "Density Rules: Floating vs. Sinking",
          paragraphs: [
            "An object floats in a fluid if the object's density is less than the fluid's density, and it sinks if its density is greater than the fluid's. This is why ice, which is slightly less dense than liquid water, floats, while a metal coin, much denser than water, sinks.",
            "When comparing two liquids that don't mix, the less dense liquid will always float on top of the denser one, a pattern that shows up often in ACT Science layered liquid diagrams.",
          ],
          flashcards: [
            { front: "When does an object float versus sink in a fluid?", back: "It floats if its density is less than the fluid's density, and sinks if its density is greater." },
            { front: "When two non-mixing liquids are layered, which one ends up on top?", back: "The less dense liquid floats on top of the denser one." },
          ],
        },
        {
          id: "phys-energy",
          title: "Kinetic vs. Potential Energy",
          paragraphs: [
            "Kinetic energy is the energy of motion; any moving object has kinetic energy, and it increases with both mass and speed, specifically with the square of speed. Potential energy is stored energy based on an object's position or condition, most commonly gravitational potential energy, which depends on an object's height above the ground.",
            "As an object falls, its potential energy converts into kinetic energy; the total mechanical energy (kinetic plus potential) stays constant if no energy is lost to friction or air resistance.",
          ],
          flashcards: [
            { front: "What is kinetic energy, and what does it depend on?", back: "The energy of motion; it increases with mass and with the square of speed." },
            { front: "What happens to potential energy as an object falls?", back: "It converts into kinetic energy; total mechanical energy stays constant without friction or air resistance." },
          ],
        },
      ],
    },
    {
      domain: "Math for ACT Science",
      icon: "🔢",
      topics: [
        {
          id: "math-sci-notation",
          title: "Scientific Notation",
          paragraphs: [
            "Scientific notation writes a number as a value between 1 and 10 multiplied by a power of 10, making very large or very small numbers easier to read and compare, like 3.2 times 10 to the 6th power instead of 3,200,000.",
            "To compare two numbers in scientific notation quickly, compare the exponents first; a bigger exponent means a bigger number, as long as the leading value is between 1 and 10. Only compare the leading digits directly if the exponents match.",
          ],
          flashcards: [
            { front: "How do you quickly compare two numbers in scientific notation?", back: "Compare the exponents first; a bigger exponent means a bigger number (as long as the leading value is between 1 and 10)." },
          ],
        },
        {
          id: "math-estimation",
          title: "Mental Multiplication and Estimation",
          paragraphs: [
            "Since the ACT Science section doesn't allow a calculator, it helps to estimate rather than calculate exactly. Round each number to one or two significant figures, multiply those simpler numbers, and use that estimate to quickly eliminate answer choices that are clearly too big or too small, rather than grinding through exact long multiplication.",
          ],
          flashcards: [
            { front: "Why estimate on ACT Science instead of calculating exactly?", back: "No calculator is allowed, so rounding to 1 or 2 significant figures and estimating lets you quickly eliminate clearly wrong answer choices." },
          ],
        },
        {
          id: "math-ratios",
          title: "Ratios",
          paragraphs: [
            "A ratio compares two quantities directly, like 3 red marbles to 5 blue marbles, written 3 to 5 or as the fraction 3/5. ACT Science ratio questions often ask you to read two values off a table or graph and simplify their ratio, or to scale a ratio up or down to answer \"what if\" questions about the data.",
          ],
          flashcards: [
            { front: "How is a ratio of 3 red to 5 blue marbles written?", back: "3 to 5, or as the fraction 3/5." },
          ],
        },
        {
          id: "math-percentages",
          title: "Percentages",
          paragraphs: [
            "A percentage is a fraction out of 100. To find what percent one number is of another, divide the part by the whole and multiply by 100.",
            "Percent change, how much a value increased or decreased, is always calculated as the amount of change divided by the original starting value, then multiplied by 100, never divided by the new value.",
          ],
          flashcards: [
            { front: "How do you calculate percent change?", back: "Amount of change divided by the original starting value, multiplied by 100. Never divided by the new value." },
          ],
        },
        {
          id: "math-interpreting-data",
          title: "Interpreting Graphs, Tables, and Experimental Data",
          paragraphs: [
            "Before answering any question, take a moment to identify what each axis or column actually represents and what units are being used, since misreading a label is the most common source of careless errors on ACT Science.",
            "Look for the overall trend in the data (does a value consistently increase, decrease, or peak somewhere in the middle?) before trying to pull an exact number, since many questions can be answered just by knowing the general shape of a trend.",
          ],
          flashcards: [
            { front: "What should you check first before answering any data question?", back: "What each axis or column represents and what units are being used, since misreading a label is the most common source of errors." },
            { front: "What should you look for before pulling an exact number from a graph?", back: "The overall trend: whether the value increases, decreases, or peaks somewhere in the middle." },
          ],
        },
      ],
    },
  ],
};
