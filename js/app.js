(() => {
  'use strict';

  const BANK = window.SAT_QUESTIONS;
  const V = window.SAT_VOCAB;
  const bankById = Object.fromEntries(BANK.map(q => [q.id, q]));

  const SECTIONS = { rw: 'Reading & Writing', math: 'Math' };
  const DOMAINS = {
    rw: ['Craft & Structure', 'Information & Ideas', 'Standard English Conventions', 'Expression of Ideas'],
    math: ['Algebra', 'Advanced Math', 'Problem-Solving & Data Analysis', 'Geometry & Trigonometry']
  };
  const ALL_DOMAINS = [...DOMAINS.rw, ...DOMAINS.math];
  // Official College Board skills within each domain.
  const SKILLS = {
    'Craft & Structure': ['Words in context', 'Text structure and purpose', 'Cross-text connections'],
    'Information & Ideas': ['Central ideas and details', 'Command of evidence: textual', 'Command of evidence: quantitative', 'Inferences'],
    'Standard English Conventions': ['Boundaries', 'Form, structure and sense'],
    'Expression of Ideas': ['Rhetorical synthesis', 'Transitions'],
    'Algebra': ['Linear equations in one variable', 'Linear functions', 'Linear equations in two variables', 'Systems of linear equations', 'Linear inequalities'],
    'Advanced Math': ['Equivalent expressions', 'Nonlinear equations', 'Nonlinear functions'],
    'Problem-Solving & Data Analysis': ['Ratios, rates and proportions', 'Percentages', 'One-variable data', 'Two-variable data', 'Probability', 'Inference from samples', 'Evaluating statistical claims'],
    'Geometry & Trigonometry': ['Area and volume', 'Lines, angles and triangles', 'Right triangles and trigonometry', 'Circles']
  };
  // The specific question patterns the real test uses, with how often each appears
  // (share: percent of its section's questions) and, where known, how often it repeats
  // across test dates (repeat) and how often it is hard (hard). English repeat rates and
  // math shares come from The Test Advantage's analysis of 2024–2026 question banks
  // (thetestadvantage.com); shares marked "est." are estimates within the official domain weights.
  const PATTERNS = [
    // Reading & Writing: Craft & Structure (28%)
    { id: 'wic', domain: 'Craft & Structure', skill: 'Words in context', share: 14.4, repeat: 0.41, label: 'Words in context',
      guide: 'Test one precise, moderately advanced word (like "tentative", "corroborate", "undermine", "novel", "conventional", "arbitrary") whose meaning is pinned down by a contrast ("Although…", "but") or a restatement after a colon. Wrong choices fit the topic but not the logic, and one is a near-synonym with the wrong shade of meaning.' },
    { id: 'purpose', domain: 'Craft & Structure', skill: 'Text structure and purpose', share: 9.6, label: 'Main purpose, structure or function of a sentence',
      guide: 'Wrong choices are too broad, too narrow, or describe something the text does not do.' },
    { id: 'crosstext', domain: 'Craft & Structure', skill: 'Cross-text connections', share: 4, label: 'Cross-text response',
      guide: 'Text 2 qualifies, challenges or extends a specific claim in Text 1; the right answer names that exact relationship.' },
    // Information & Ideas (26%)
    { id: 'central', domain: 'Information & Ideas', skill: 'Central ideas and details', share: 6, label: 'Main idea or stated detail',
      guide: 'Wrong choices repeat words from the text but distort its point, or state a detail as if it were the main idea.' },
    { id: 'evidence-text', domain: 'Information & Ideas', skill: 'Command of evidence: textual', share: 7, label: 'Finding that supports or weakens a claim',
      guide: 'A researcher states a hypothesis; the right finding directly tests its key prediction. Wrong choices are related but irrelevant to that prediction. If you use a literary quotation, write your own original excerpt and attribute it only to "a novel" or "a poem", never to a real author.' },
    { id: 'evidence-quant', domain: 'Information & Ideas', skill: 'Command of evidence: quantitative', share: 6.5, label: 'Data from a table completes a claim',
      guide: 'Exactly one choice is both accurate to the table and relevant to the claim. Include one choice that is accurate but irrelevant and one that misreads the table.' },
    { id: 'inference', domain: 'Information & Ideas', skill: 'Inferences', share: 6.5, label: 'Most logical completion',
      guide: 'The blank completes a chain of reasoning in the passage. Wrong choices go beyond the evidence or reverse it.' },
    // Standard English Conventions (26%)
    { id: 'b-clauses', domain: 'Standard English Conventions', skill: 'Boundaries', share: 5, label: 'Joining two independent clauses',
      guide: 'Test semicolon or period versus a comma splice or run-on, often with a transition word ("however", "therefore") after the boundary.' },
    { id: 'b-supplement', domain: 'Standard English Conventions', skill: 'Boundaries', share: 4.5, label: 'Supplementary elements and appositives',
      guide: 'A nonessential phrase must be set off by a matching pair: two commas or two dashes. The other half of the pair already appears in the sentence.' },
    { id: 'b-colon', domain: 'Standard English Conventions', skill: 'Boundaries', share: 2.5, label: 'Colons before a list or explanation',
      guide: 'A colon must follow a complete independent clause.' },
    { id: 'b-none', domain: 'Standard English Conventions', skill: 'Boundaries', share: 2, label: 'No punctuation needed',
      guide: 'The right answer has no punctuation: between subject and verb, before a restrictive element, or between a title and a name ("author Toni Morrison").' },
    { id: 'f-agree', domain: 'Standard English Conventions', skill: 'Form, structure and sense', share: 4, label: 'Subject-verb agreement',
      guide: 'Separate the subject from its verb with a long prepositional phrase whose noun has the other number.' },
    { id: 'f-pronoun', domain: 'Standard English Conventions', skill: 'Form, structure and sense', share: 2.5, label: 'Pronoun agreement',
      guide: 'Test its/their/it\'s/they\'re with a clearly singular or plural antecedent.' },
    { id: 'f-verb', domain: 'Standard English Conventions', skill: 'Form, structure and sense', share: 3, label: 'Verb tense and finite verbs',
      guide: 'Either the sentence needs a main (finite) verb and three choices are -ing or "to" forms, or the tense must match a time marker.' },
    { id: 'f-possessive', domain: 'Standard English Conventions', skill: 'Form, structure and sense', share: 1.5, label: 'Plurals and possessives',
      guide: 'Choices differ only by apostrophes and the letter s.' },
    { id: 'f-modifier', domain: 'Standard English Conventions', skill: 'Form, structure and sense', share: 1, label: 'Dangling modifiers',
      guide: 'An opening modifying phrase must be followed directly by the noun it describes.' },
    // Expression of Ideas (20%)
    { id: 't-contrast', domain: 'Expression of Ideas', skill: 'Transitions', share: 2.8, repeat: 0.52, label: 'Transition: contrast',
      guide: 'The right answer is a contrast word ("However,", "In contrast,", "Nevertheless,"). Wrong choices show cause, addition or example.' },
    { id: 't-cause', domain: 'Expression of Ideas', skill: 'Transitions', share: 2.1, repeat: 0.43, label: 'Transition: cause and effect',
      guide: 'The right answer shows a result ("Therefore,", "As a result,", "Consequently,"). Wrong choices show contrast, addition or example.' },
    { id: 't-example', domain: 'Expression of Ideas', skill: 'Transitions', share: 1.6, repeat: 0.48, label: 'Transition: example or illustration',
      guide: 'The sentence after the blank gives a specific instance of the general claim before it ("For example,", "For instance,").' },
    { id: 't-addition', domain: 'Expression of Ideas', skill: 'Transitions', share: 1.5, label: 'Transition: addition (est.)',
      guide: 'The sentence adds a further point in the same direction ("Moreover,", "Additionally,", "Furthermore,").' },
    { id: 't-other', domain: 'Expression of Ideas', skill: 'Transitions', share: 1.5, label: 'Transition: similarity, sequence or concession (est.)',
      guide: 'Use "Similarly,", "Likewise,", "Later,", "Finally,", "Granted," or "Still," as the right answer.' },
    { id: 'synthesis', domain: 'Expression of Ideas', skill: 'Rhetorical synthesis', share: 10.5, label: 'Rhetorical synthesis from notes',
      guide: 'Goals like "emphasize a similarity", "emphasize a difference", "introduce the study to an unfamiliar audience" or "present the findings". Every choice is true to the notes; only one does the stated goal.' },
    // Math: Algebra
    { id: 'lin-model', domain: 'Algebra', skill: 'Linear functions', share: 8, hard: 0.29, label: 'Linear models: slope and intercept in context',
      guide: 'Interpret m and b in y = mx + b for a real situation, or build the model from a table or two points.' },
    { id: 'lin-lines', domain: 'Algebra', skill: 'Linear equations in two variables', share: 6, hard: 0.29, label: 'Lines: slope, intercepts, parallel and perpendicular',
      guide: 'Use slope = (y₂ − y₁)/(x₂ − x₁), standard form slope −A/B, equal slopes for parallel lines and negative reciprocals for perpendicular.' },
    { id: 'lin-eq', domain: 'Algebra', skill: 'Linear equations in one variable', share: 7, hard: 0.19, label: 'Linear equations and number of solutions',
      guide: 'Solve, or decide whether an equation like ax + 3 = 5x − b has one, no or infinitely many solutions.' },
    { id: 'ineq', domain: 'Algebra', skill: 'Linear inequalities', share: 5, hard: 0.38, label: 'Inequalities in context',
      guide: '"At least" means ≥, "at most" means ≤; flip the sign when multiplying or dividing by a negative.' },
    { id: 'systems', domain: 'Algebra', skill: 'Systems of linear equations', share: 5, hard: 0.4, label: 'Systems of equations',
      guide: 'Solve a system, or use slopes: different slopes give one solution, same slope with different intercepts none, the same line infinitely many.' },
    // Math: Advanced Math
    { id: 'exp', domain: 'Advanced Math', skill: 'Nonlinear functions', share: 7.7, hard: 0.41, label: 'Exponential growth and decay',
      guide: 'Use y = a·bˣ, y = a(1 + r)ᵗ or y = a(1 − r)ᵗ; interpret a and b; compare a fixed-amount (linear) change with a fixed-factor (exponential) change; percent change over several periods.' },
    { id: 'quad-func', domain: 'Advanced Math', skill: 'Nonlinear functions', share: 6.6, hard: 0.44, label: 'Quadratic functions and graphs',
      guide: 'Vertex form gives vertex (h, k), factored form gives x-intercepts, c is the y-intercept, axis of symmetry x = −b/(2a); maximum or minimum values.' },
    { id: 'expr', domain: 'Advanced Math', skill: 'Equivalent expressions', share: 5.4, hard: 0.26, label: 'Expressions and polynomials',
      guide: 'Exponent rules, difference of squares, perfect-square expansion, or matching coefficients of equivalent expressions.' },
    { id: 'quad-eq', domain: 'Advanced Math', skill: 'Nonlinear equations', share: 5.3, hard: 0.66, label: 'Quadratic equations',
      guide: 'Factoring, the quadratic formula, the discriminant (2, 1 or 0 real solutions), or the sum of roots −b/a and product c/a.' },
    { id: 'func', domain: 'Advanced Math', skill: 'Nonlinear functions', share: 4.7, hard: 0.11, label: 'Function notation and transformations',
      guide: 'Evaluate f(a), compose values, or shift graphs: f(x) + k moves up k, f(x − h) moves right h.' },
    { id: 'extraneous', domain: 'Advanced Math', skill: 'Nonlinear equations', share: 3, hard: 0.7, label: 'Radical or rational equations and extraneous solutions',
      guide: 'Solve by squaring or clearing denominators, then check for extraneous solutions; or count how many solutions a system or equation has.' },
    // Math: Problem-Solving & Data Analysis
    { id: 'percent', domain: 'Problem-Solving & Data Analysis', skill: 'Percentages', share: 4, hard: 0.58, label: 'Percentages and percent change',
      guide: 'Percent change = (new − original)/original; a 20% increase multiplies by 1.2 and undoing it divides by 1.2; successive changes multiply.' },
    { id: 'ratio', domain: 'Problem-Solving & Data Analysis', skill: 'Ratios, rates and proportions', share: 3.5, label: 'Ratios, rates and unit conversion (est.)',
      guide: 'Proportions and multi-step unit conversions.' },
    { id: 'one-var', domain: 'Problem-Solving & Data Analysis', skill: 'One-variable data', share: 3, label: 'Mean, median, range and spread (est.)',
      guide: 'Effects of adding or removing a value or an outlier on mean and median; comparing spread.' },
    { id: 'two-var', domain: 'Problem-Solving & Data Analysis', skill: 'Two-variable data', share: 2, label: 'Lines of best fit and models from data (est.)',
      guide: 'Interpret a best-fit line from a table or equation, or choose linear versus exponential.' },
    { id: 'prob', domain: 'Problem-Solving & Data Analysis', skill: 'Probability', share: 1.5, label: 'Probability from two-way tables (est.)',
      guide: 'Conditional probability: watch which group is the denominator.' },
    { id: 'sampling', domain: 'Problem-Solving & Data Analysis', skill: 'Inference from samples', share: 0.8, label: 'Estimating from a sample and margin of error (est.)',
      guide: 'Scale a sample proportion up to a population, or read what a margin of error does and does not say.' },
    { id: 'inference-stats', domain: 'Problem-Solving & Data Analysis', skill: 'Evaluating statistical claims', share: 0.7, label: 'Which conclusion a study supports (est.)',
      guide: 'Random sampling allows generalizing to the population sampled; random assignment allows cause-and-effect claims.' },
    // Math: Geometry & Trigonometry
    { id: 'area', domain: 'Geometry & Trigonometry', skill: 'Area and volume', share: 5.1, hard: 0.52, label: 'Area, perimeter and volume',
      guide: 'Includes scaling: multiplying lengths by k multiplies area by k² and volume by k³.' },
    { id: 'triangles', domain: 'Geometry & Trigonometry', skill: 'Lines, angles and triangles', share: 4.1, label: 'Triangles, angles and similarity',
      guide: 'Angle relationships with parallel lines, triangle angle sums, and similar-triangle ratios.' },
    { id: 'trig', domain: 'Geometry & Trigonometry', skill: 'Right triangles and trigonometry', share: 2.7, label: 'Right triangles and trigonometry',
      guide: '30-60-90 sides x, x√3, 2x; 45-45-90 sides s, s, s√2; SOH-CAH-TOA; sin x° = cos(90 − x)°.' },
    { id: 'circles', domain: 'Geometry & Trigonometry', skill: 'Circles', share: 2.4, label: 'Circle equations, arcs and sectors',
      guide: '(x − h)² + (y − k)² = r², often after completing the square; arc length and sector area as fractions of the circle; radians.' }
  ];
  const PATTERN = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
  // AI questions carry their pattern; built-in ones get the most common pattern of their skill.
  const patternOf = q => q.pattern || PATTERNS.find(p => p.skill === q.skill)?.id || null;

  // For each pattern: the shortcut that finds the answer fast (tip), the fastest Desmos
  // route for math (desmos, with what to type in backticks), and the classic wrong answer (trap).
  const TRICKS = {
    'wic': { tip: 'Cover the choices, find the clue (a contrast word or a restatement after a colon), and say your own word for the blank first.', trap: 'A word that fits the topic but not the logic, or one stronger than the passage supports.' },
    'purpose': { tip: 'Name what the author is doing with one verb (argues, describes, explains, compares, challenges), then match it.', trap: 'A choice that is true of one part of the text but not the whole.' },
    'crosstext': { tip: 'Find what Text 2 says about the exact claim in Text 1, then predict the response before reading the choices.', trap: 'A choice where Text 2 agrees or disagrees more strongly than it actually does.' },
    'central': { tip: 'The main idea usually sits after a turn word ("but", "however", "yet") or in the last sentence.', trap: 'A true detail dressed up as the main idea.' },
    'evidence-text': { tip: 'Turn the claim into a prediction ("if this is true, we should see…"). The right finding matches that prediction exactly.', trap: 'A finding about the right topic that does not actually test the claim.' },
    'evidence-quant': { tip: 'Check every number in a choice against the table first, then ask whether it supports this specific claim.', trap: 'Accurate data that supports a different claim.' },
    'inference': { tip: 'Pick the most limited statement the passage forces you to accept.', trap: 'Extreme words such as "always", "proves" or "all".' },
    'b-clauses': { tip: 'A semicolon works exactly like a period. Two full sentences need one of them, or a comma plus and/but/so.', trap: 'A comma splice that sounds fine read aloud.' },
    'b-supplement': { tip: 'Match the opener: an interruption that starts with a dash ends with a dash; one that starts with a comma ends with a comma.', trap: 'A choice mixing a comma and a dash around the same phrase.' },
    'b-colon': { tip: 'Cover everything after the colon: what is left must be a complete sentence.', trap: 'A colon right after "such as", "including" or a verb.' },
    'b-none': { tip: 'No punctuation between a subject and its verb, a verb and its object, or a title and a name ("author Toni Morrison").', trap: 'An extra comma that feels like a pause.' },
    'f-agree': { tip: 'Cross out "of …" and other prepositional phrases, then match the verb to the real subject.', trap: 'A verb that matches the nearest noun instead of the subject.' },
    'f-pronoun': { tip: 'Find the noun the pronoun replaces. Company, team, group and committee are singular, so they take "its".', trap: '"Their" for a singular noun, or "it\'s" (it is) for "its".' },
    'f-verb': { tip: 'Every sentence needs one main verb, and -ing or "to" forms are not main verbs. Match tense to time words like "since" or "last year".', trap: 'An -ing choice that leaves the sentence without a main verb.' },
    'f-possessive': { tip: 'Ask whether the word owns the next word. Plural owners take s\', single owners \'s, plain plurals take no apostrophe.', trap: '"It\'s" or an apostrophe on a plain plural.' },
    'f-modifier': { tip: 'Whoever is doing the opening phrase\'s action must come right after the comma.', trap: 'A passive choice that puts the wrong noun first.' },
    't-contrast': { tip: 'Say "but" between the two sentences. If it fits, pick the contrast word (However, Nevertheless, In contrast).', trap: 'A cause or addition word when the ideas pull against each other.' },
    't-cause': { tip: 'Say "so" between the sentences. If the second follows from the first, pick Therefore, As a result or Consequently.', trap: 'A contrast word when both ideas point the same way.' },
    't-example': { tip: 'If the second sentence is one specific case of the first sentence\'s general claim, it is "For example".', trap: '"In addition" when the sentence is really an instance.' },
    't-addition': { tip: 'Say "also". If it fits and the sentence adds a new point in the same direction, pick Moreover or Additionally.', trap: '"For example" when the sentence is a new point, not an instance.' },
    't-other': { tip: 'Similarity mirrors the first idea (Similarly). Sequence follows time (Later, Finally). Concession admits a point, then pushes back (Granted, Still).', trap: 'Two choices that mean the same thing: neither can be the answer.' },
    'synthesis': { tip: 'Skip the notes. Read the goal, then cross out every choice that does not do exactly that goal.', trap: 'The choice packed with the most facts but aimed at a different goal.' },
    'lin-model': { tip: 'Units tell you the meaning: the number multiplied by x is "per x", and the constant is the starting amount.', desmos: 'Put two given points in a table and type `y_1~mx_1+b` to get the slope and intercept.' },
    'lin-lines': { tip: 'Rewrite in y = mx + b to read the slope. Perpendicular slopes are negative reciprocals.', desmos: 'Graph the line and click its intercepts. Type a candidate line to see whether it runs parallel or crosses at a right angle.' },
    'lin-eq': { tip: 'Same x-coefficient on both sides: same constant means infinitely many solutions, different constant means none.', desmos: 'Type `y=(left side)-(right side)`. One crossing is the solution; a flat line off the axis means no solution; a line on the axis means infinitely many.' },
    'ineq': { tip: 'Translate the words first: "at least" is ≥, "no more than" is ≤. Then test a choice with real numbers.', desmos: 'Type the inequality to shade the region, then type each answer point like `(2,9)` to see which falls inside.' },
    'systems': { tip: 'Elimination is usually faster than substitution. If they ask for x + y, add or subtract the equations directly.', desmos: 'Type both equations and click the point where they cross.' },
    'exp': { tip: 'The growth factor is 1 + rate. "Doubles every 3 hours" means 2 to the power t/3.', desmos: 'Rename t to x, graph the model, and click the curve at the x value you need. For data, use `y_1~ab^(x_1)`.' },
    'quad-func': { tip: 'Vertex form gives the vertex, factored form the x-intercepts, standard form the y-intercept.', desmos: 'Graph it and click the curve: Desmos marks the vertex, the zeros and the y-intercept.' },
    'expr': { tip: 'Pick a number for x (avoid 0 and 1), evaluate the original, and keep the choice that gives the same value.', desmos: 'Graph the original and each choice. The equivalent one lands exactly on top of it.' },
    'quad-eq': { tip: 'Sum of roots is −b/a and product is c/a, so you often never need to solve.', desmos: 'Type `y=` the quadratic and click the zeros. For "exactly one solution", put a slider on the constant.' },
    'func': { tip: 'f(x − h) moves the graph right h; f(x) + k moves it up k.', desmos: 'Define `f(x)=…`, then type `f(3)`, or graph `f(x-2)` next to `f(x)`.' },
    'extraneous': { tip: 'Always plug answers back into the original equation.', desmos: 'Type `y=(left side)-(right side)`. Only real solutions cross the x-axis, so extraneous ones never show up.' },
    'percent': { tip: 'Turn changes into factors and multiply: up 20% is ×1.2, down 20% is ×0.8.', desmos: 'Type the chain of factors, like `100*1.2*0.8`, and read off the net change.' },
    'ratio': { tip: 'Write every rate as a fraction with units and cancel units until only the ones you want remain.', desmos: 'Type the whole conversion at once, like `60*5280/3600`.' },
    'one-var': { tip: 'Outliers drag the mean but barely move the median. More spread-out data has a larger standard deviation.', desmos: 'Type `mean([4,8,10])`, `median([…])` or `stdev([…])`.' },
    'two-var': { tip: 'The slope of a best-fit line is the predicted change per unit; the intercept is the predicted value at 0.', desmos: 'Enter the points in a table and type `y_1~mx_1+b`.' },
    'prob': { tip: 'Find the "given" group first: it is the denominator.' },
    'sampling': { tip: 'Sample proportion × population size gives the estimate. A margin of error describes the population value, not individuals.' },
    'inference-stats': { tip: 'Random assignment lets you claim cause. A random sample lets you generalize, but only to the population sampled.' },
    'area': { tip: 'Scaling lengths by k multiplies area by k² and volume by k³.', desmos: 'Use Desmos as a calculator: `pi*3^2*8`.' },
    'triangles': { tip: 'Parallel lines make equal corresponding and alternate angles; similar triangles have equal side ratios.' },
    'trig': { tip: 'sin x° = cos(90 − x)°, and know 30-60-90 and 45-45-90 side ratios.', desmos: 'Switch Desmos to degrees with the wrench icon before typing `sin(30)`.' },
    'circles': { tip: 'Complete the square: add (half the x-coefficient)² and (half the y-coefficient)² to both sides.', desmos: 'Graph the equation as given to check the center and radius you found.' }
  };
  for (const p of PATTERNS) Object.assign(p, TRICKS[p.id] || {});

  // The Desmos moves that save the most time, each with a worked example.
  const DESMOS_TRICKS = [
    { id: 'zeros', title: 'Solve any equation in one line', when: ['lin-eq', 'quad-eq', 'extraneous'],
      steps: 'Move everything to one side and type it as y. The x-values where the graph crosses the x-axis are the solutions. Click the gray points to read them.',
      example: { q: '\\(\\sqrt{3x + 4} = x\\). What is the solution?', type: 'y=sqrt(3x+4)-x', result: 'Only one crossing, at x = 4. The extraneous solution x = −1 never shows up.' } },
    { id: 'intersect', title: 'Systems: click the crossing', when: ['systems', 'lin-lines'],
      steps: 'Type each equation on its own line. Click where the graphs cross to read the solution. No crossing means no solution; lines on top of each other mean infinitely many.',
      example: { q: '\\(2x + 3y = 12\\) and \\(x - y = 1\\). What is \\((x, y)\\)?', type: '2x+3y=12', type2: 'x-y=1', result: 'They cross at (3, 2).' } },
    { id: 'quad', title: 'Quadratic features for free', when: ['quad-func', 'quad-eq'],
      steps: 'Graph the quadratic and click the curve. Desmos marks the vertex, the zeros and the y-intercept as gray points.',
      example: { q: 'What is the minimum value of \\(y = x^2 - 6x + 5\\)?', type: 'y=x^2-6x+5', result: 'The vertex is (3, −4), so the minimum is −4. The zeros are 1 and 5.' } },
    { id: 'slider', title: 'Find a constant with a slider', when: ['quad-eq', 'systems', 'lin-eq'],
      steps: 'Type the equation with the unknown constant. Desmos offers to add a slider; drag it until the condition holds, then type each answer choice (like c=9) to confirm.',
      example: { q: 'For what value of \\(c\\) does \\(y = x^2 - 6x + c\\) touch the x-axis at exactly one point?', type: 'y=x^2-6x+c', result: 'At c = 9 the vertex sits on the x-axis.' } },
    { id: 'count', title: 'Count solutions by counting crossings', when: ['extraneous', 'quad-eq', 'systems'],
      steps: 'Graph each side of the equation as its own y. The number of crossings is the number of real solutions.',
      example: { q: 'How many real solutions does \\(x^2 = 2x - 1\\) have?', type: 'y=x^2', type2: 'y=2x-1', result: 'The line just touches the parabola once, at x = 1: one solution.' } },
    { id: 'equiv', title: 'Equivalent expressions: look for the overlap', when: ['expr'],
      steps: 'Graph the original expression, then each choice. The equivalent one lands exactly on top of the original.',
      example: { q: 'Which is equivalent to \\(\\frac{x^2 - 25}{x + 5}\\)?', type: 'y=(x^2-25)/(x+5)', type2: 'y=x-5', result: 'The two graphs overlap completely, so x − 5 is the answer.' } },
    { id: 'rename', title: 'Rename variables to x', when: ['exp', 'func', 'lin-model'],
      steps: 'Desmos graphs y against x and turns any other letter into a slider. Rewrite t, n or m as x, graph, and click the curve at the value you need.',
      example: { q: '\\(P(t) = 500(2)^{\\frac{t}{3}}\\). What is \\(P(9)\\)?', type: 'y=500*2^(x/3)', result: 'At x = 9, y = 4,000.' } },
    { id: 'regress', title: 'Fit data with a regression', when: ['two-var', 'lin-model', 'exp'],
      steps: 'Add a table and enter the points as x₁ and y₁. Type y_1~mx_1+b for a line or y_1~ab^(x_1) for exponential. Desmos reports the values.',
      example: { q: 'A table shows (0, 3), (1, 6), (2, 12). Which exponential model fits?', type: 'y_1~ab^(x_1)', result: 'a = 3 and b = 2, so y = 3(2)ˣ.' } },
    { id: 'stats', title: 'Mean, median and spread instantly', when: ['one-var'],
      steps: 'Type a list in square brackets inside mean, median or stdev.',
      example: { q: 'What is the mean of 4, 8, 10, 14 and 19?', type: 'mean([4,8,10,14,19])', result: '11.' } },
    { id: 'shade', title: 'Inequalities: shade and test points', when: ['ineq'],
      steps: 'Type the inequality to shade its region. Type each answer choice as a point and see which lands in the shading.',
      example: { q: 'Which point satisfies \\(y > 2x + 3\\)?', type: 'y>2x+3', type2: '(1,6)', result: '(1, 6) sits in the shaded region, since 6 > 5.' } },
    { id: 'functions', title: 'Function notation without algebra', when: ['func'],
      steps: 'Define the function once, then evaluate it or graph shifted versions next to it.',
      example: { q: '\\(f(x) = x^2 - 3x + 2\\). What is \\(f(4)\\)?', type: 'f(x)=x^2-3x+2', type2: 'f(4)', result: '6.' } },
    { id: 'degrees', title: 'Trig: switch to degrees first', when: ['trig'],
      steps: 'Desmos starts in radians. Open the wrench icon and choose Degrees before typing sin, cos or tan of an angle in degrees.',
      example: { q: 'What is \\(\\sin 30^\\circ\\)?', type: 'sin(30)', result: '0.5 once Desmos is in degrees.' } }
  ];
  const SECTION_OF = Object.fromEntries(ALL_DOMAINS.map(d => [d, DOMAINS.rw.includes(d) ? 'rw' : 'math']));
  const DIFF = { easy: -1, medium: 0, hard: 1 };
  const WEIGHT = { easy: 1, medium: 1.5, hard: 2 };
  // Seconds per question on the real digital SAT: R&W 64 min / 54 q, Math 70 min / 44 q.
  const SEC_PER_Q = { rw: 71, math: 95 };
  // Questions per module on the real digital SAT.
  const MODULE_SIZE = { rw: 27, math: 22 };
  const DAY = 864e5;
  // After a miss, a similar question comes back 2 questions later, then after these many days.
  // Getting it right at every step marks the concept mastered.
  const REVIEW_DAYS = [1, 3, 7];

  // ---------- Storage ----------

  const KEY = 'satstat:v1';
  const defaults = () => ({
    profile: { name: '', testDate: '', dailyGoal: 10, targetScore: 1400, report: null },  // report: { rw, math, bands: { domain: [low, high] } }
    attempts: [],         // { id, ok, t, m, s, d, k, f }  m = practice | daily | exam | adaptive
    review: [],           // flagged question ids
    vocab: {},            // word -> 'learning' | 'known'
    exams: [],            // { t, section, size, correct, total, score, elapsed }
    tasksDone: {},        // 'YYYY-MM-DD' -> [taskId]
    daily: null,          // { day, resp }
    generated: {},        // id -> AI-written question
    aiTopics: [],         // recent AI question topics, to keep them varied
    mistakes: {},         // id of a missed question -> { d, k, f, stage, misses, due, last, mastered }
    adaptive: null,       // the adaptive session in progress
    adaptiveHistory: []   // { t, section, correct, total }
  });

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s) return defaults();
      return { ...defaults(), ...s, profile: { ...defaults().profile, ...s.profile } };
    } catch {
      return defaults();
    }
  }

  let state = load();

  // Drops the oldest saved AI questions beyond `keep`, never ones flagged or still in the mistake memory.
  function pruneGenerated(keep) {
    const ids = Object.keys(state.generated).filter(id => !state.review.includes(id) && !(state.mistakes[id] && !state.mistakes[id].mastered));
    for (const id of ids.slice(0, Math.max(0, ids.length - keep))) delete state.generated[id];
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Usually a full quota: free space by halving the saved AI questions, then retry once.
      pruneGenerated(Math.floor(Object.keys(state.generated).length / 2));
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
    }
  }

  // ---------- Helpers ----------

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Math is LaTeX between \( \) (inline) or \[ \] (on its own line), typeset with KaTeX.
  const MATH_RE = /\\\((.+?)\\\)|\\\[(.+?)\\\]/gs;
  const texHTML = (src, display) => window.katex.renderToString(src, { displayMode: display, throwOnError: true });
  // Escapes text and typesets its math. Without KaTeX (offline), shows the raw formula.
  // `big` typesets inline math at full size (fractions in answer choices, like the SAT).
  function rich(text, big = false) {
    const s = String(text ?? '');
    let out = '', last = 0;
    for (const m of s.matchAll(MATH_RE)) {
      out += esc(s.slice(last, m.index));
      const src = m[1] ?? m[2];
      try { out += texHTML(big && m[2] == null ? '\\displaystyle ' + src : src, m[2] != null); } catch { out += `<span class="tex-raw">${esc(src)}</span>`; }
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  // Text where `backticked` parts are Desmos input: shown as code with a Copy button.
  const codeText = text => String(text ?? '').split('`').map((part, i) => i % 2
    ? `<code class="dz">${esc(part)}</code><button class="copy" type="button" data-copy="${esc(part)}" aria-label="Copy ${esc(part)}">Copy</button>`
    : rich(part)).join('');

  // Rough plain-text version of a formula, for short previews.
  const plainTex = t => t
    .replace(/\\(?:begin|end)\{[a-z*]+\}/gi, ' ').replace(/\\\\/g, ', ').replace(/&/g, '')
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\sqrt/g, '√').replace(/\\pi\b/g, 'π').replace(/\^\\circ/g, '°')
    .replace(/\\(?:le|leq)\b/g, '≤').replace(/\\(?:ge|geq)\b/g, '≥').replace(/\\(?:ne|neq)\b/g, '≠')
    .replace(/\\(?:times|cdot)\b/g, '×').replace(/\\(sin|cos|tan|log|ln)\b/g, '$1 ')
    .replace(/\\[a-z]+/gi, ' ').replace(/[{}]/g, '');
  const plain = text => String(text ?? '').replace(MATH_RE, (_, a, b) => plainTex(a ?? b))
    .replace(/\s+/g, ' ').replace(/\s+([,.?;:])/g, '$1').trim();
  const words = text => plain(text).split(/\s+/).filter(Boolean).length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const weighted = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };

  const dayKey = (d = new Date()) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtTime = s => {
    s = Math.max(0, s);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const fmtDate = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fmtWhen = t => {
    const d = Math.round((new Date(dayKey(t) + 'T00:00') - new Date(dayKey() + 'T00:00')) / DAY);
    return d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  };

  function daysUntilTest() {
    if (!state.profile.testDate) return null;
    return Math.round((new Date(state.profile.testDate + 'T00:00') - new Date(dayKey() + 'T00:00')) / DAY);
  }

  const getQ = id => bankById[id] || state.generated[id];

  // Attempts carry their question's section/domain/skill/difficulty, so stats
  // survive even after an old AI question is trimmed from storage.
  function meta(x) {
    if (x.d) return x;
    const q = getQ(x.id);
    return q ? { s: q.section, d: q.domain, k: q.skill, f: q.difficulty, p: patternOf(q) } : null;
  }

  // Records an answer and updates the mistake memory. `origin` is the missed question a
  // similar question was written for. Returns what's needed to undo it if the question is reported.
  function record(q, ok, mode, origin) {
    const id = origin || q.id;
    const prev = state.mistakes[id] ? { ...state.mistakes[id] } : null;
    const now = Date.now();
    state.attempts.push({ id: q.id, ok, t: now, m: mode, s: q.section, d: q.domain, k: q.skill, f: q.difficulty, p: patternOf(q) });
    if (!ok) {
      state.mistakes[id] = { d: q.domain, k: q.skill, f: q.difficulty, p: patternOf(q), stage: 0, misses: (prev?.misses || 0) + 1, due: now + DAY, last: now };
    } else if (prev && !prev.mastered && (origin || prev.due <= now)) {
      // Right on a reinforcement or a due review: space the next one further out.
      const stage = prev.stage + 1;
      state.mistakes[id] = stage > REVIEW_DAYS.length
        ? { ...prev, stage, last: now, mastered: true, due: null }
        : { ...prev, stage, last: now, due: now + REVIEW_DAYS[stage - 1] * DAY };
    }
    save();
    return { id, prev };
  }

  function undoRecord(qid, undo) {
    for (let i = state.attempts.length - 1; i >= 0; i--) {
      if (state.attempts[i].id === qid) { state.attempts.splice(i, 1); break; }
    }
    if (undo) {
      if (undo.prev) state.mistakes[undo.id] = undo.prev; else delete state.mistakes[undo.id];
    }
    save();
  }

  const dueMistakes = () => Object.entries(state.mistakes)
    .filter(([, m]) => !m.mastered && m.due <= Date.now())
    .sort((a, b) => a[1].due - b[1].due);

  function toNum(s) {
    s = String(s ?? '').replace(/\s+/g, '').replace(/−/g, '-');
    if (/^-?\d*\.?\d+\/\d*\.?\d+$/.test(s)) {
      const [a, b] = s.split('/');
      return Number(a) / Number(b);
    }
    return s !== '' && !isNaN(s) ? Number(s) : NaN;
  }

  function isCorrect(q, resp) {
    if (q.type === 'spr') {
      const r = toNum(resp);
      if (isNaN(r)) return false;
      // Like the real SAT, a decimal that fills all 5 spaces (6 with a minus sign) may be
      // rounded or cut off: for 2/3, .6666, .6667, 0.666 and 0.667 are all correct.
      const typed = String(resp).replace(/\s+/g, '').replace(/^[-−]/, '');
      const dec = typed.includes('.') ? typed.split('.')[1].length : 0;
      const f = 10 ** dec;
      return q.accept.some(a => {
        const x = toNum(a);
        if (Math.abs(x - r) < 1e-6) return true;
        return dec > 0 && typed.length >= 5 &&
          (Math.abs(r - Math.trunc(x * f) / f) < 1e-9 || Math.abs(r - Math.round(x * f) / f) < 1e-9);
      });
    }
    return resp === q.answer;
  }

  const answered = r => r !== null && r !== undefined && r !== '';

  // ---------- Stats & the learner model ----------

  function sectionScore(sec) {
    const a = state.attempts.filter(x => meta(x)?.s === sec).slice(-40);
    if (a.length < 5) return null;
    let w = 0, s = 0;
    for (const x of a) {
      const k = WEIGHT[meta(x).f] || 1;
      w += k;
      if (x.ok) s += k;
    }
    return Math.round((200 + 600 * s / w) / 10) * 10;
  }

  function groupStats(key) {
    const m = {};
    for (const x of state.attempts) {
      const v = meta(x)?.[key];
      if (!v) continue;
      const g = m[v] ||= { n: 0, ok: 0 };
      g.n++;
      if (x.ok) g.ok++;
    }
    return m;
  }
  const domainStats = () => {
    const m = groupStats('d');
    for (const d of ALL_DOMAINS) m[d] ||= { n: 0, ok: 0 };
    return m;
  };
  const skillStats = () => groupStats('k');

  // Elo-style ability per domain, replayed from every answer ever given.
  // A correct answer on a question harder than your level raises it more.
  // A PSAT/SAT score report sets where each domain starts: a domain's score band if given,
  // else its section score. 500 maps to level 0 and every 150 points is one step.
  function reportScore(d) {
    const rep = state.profile.report;
    if (!rep) return null;
    const band = rep.bands?.[d];
    if (band) return (band[0] + band[1]) / 2;
    return rep[SECTION_OF[d]] || (rep.total ? rep.total / 2 : null);
  }
  const startLevel = d => {
    const v = reportScore(d);
    return v ? Math.max(-2, Math.min(2, (v - 500) / 150)) : 0;
  };

  function abilities() {
    const r = Object.fromEntries(ALL_DOMAINS.map(d => [d, startLevel(d)]));
    for (const x of state.attempts) {
      const m = meta(x);
      if (!m || !(m.d in r) || !(m.f in DIFF)) continue;
      const p = 1 / (1 + Math.exp(-1.5 * (r[m.d] - DIFF[m.f])));
      r[m.d] = Math.max(-2, Math.min(2, r[m.d] + 0.4 * ((x.ok ? 1 : 0) - p)));
    }
    return r;
  }
  // Chance of answering a medium question correctly.
  const mastery = r => 1 / (1 + Math.exp(-1.5 * r));
  // A higher target score pushes questions harder sooner: 1500+ scores are won on hard questions.
  const stretch = () => {
    const t = state.profile.targetScore || 1400;
    return t >= 1500 ? 0.3 : t >= 1350 ? 0.15 : 0;
  };
  // Module 2 level: students who already reach the harder second module (PSAT/SAT around
  // 1300+, or aiming for 1450+) gain most from its hard questions, so practice skips easy ones.
  function module2() {
    const level = state.profile.level || 'auto';
    if (level !== 'auto') return level === 'module2';
    const r = state.profile.report;
    const total = r ? (r.total || (r.rw && r.math ? r.rw + r.math : 0)) : 0;
    return total >= 1300 || (state.profile.targetScore || 0) >= 1450;
  }
  const pickLevel = r => {
    if (!module2()) return levelFor(r);
    const hard = Math.max(0.6, 1 / (1 + Math.exp(-2.5 * (r - 0.8))));
    return Math.random() < hard ? 'hard' : 'medium';
  };

  // A mix of difficulties centered on your level: around level 0 mostly medium, a strong
  // domain mostly hard with some medium, a weak one mostly easy and medium.
  const levelFor = r => {
    const hard = 1 / (1 + Math.exp(-2.5 * (r - 0.8)));
    const easy = 1 / (1 + Math.exp(-2.5 * (-r - 0.8)));
    const x = Math.random();
    return x < hard ? 'hard' : x < hard + easy ? 'easy' : 'medium';
  };

  // How much a domain needs work: low mastery, and a big gap between its implied score and
  // half the target score, both raise it.
  function need(d, ab) {
    const implied = 500 + 150 * ab[d];
    const gap = Math.max(0, (state.profile.targetScore || 1400) / 2 - implied) / 100;
    return (1.3 - mastery(ab[d])) * (1 + gap);
  }

  // Picks a question pattern: common and often-repeated patterns first, weighted toward the
  // domains that need work and the patterns you miss. `final` leans harder on repeats.
  function pickPattern(domains, usable, ab, recent = [], final = false) {
    const ps = PATTERNS.filter(p => domains.includes(p.domain) && usable(p));
    if (!ps.length) return null;
    const stats = groupStats('p');
    return weighted(ps, ps.map(p => {
      const st = stats[p.id];
      const rep = 1 + (p.repeat ?? 0.28);
      let w = p.share * rep * (final ? rep : 1) * need(p.domain, ab) * (1.3 - (st?.n ? st.ok / st.n : 0.5));
      if (recent[recent.length - 1] === p.domain) w *= recent.length === 2 && recent[0] === p.domain ? 0.1 : 0.5;
      return w;
    }));
  }

  // Weakest first; untried domains come first so they get explored.
  function weakDomains() {
    const s = domainStats();
    return ALL_DOMAINS.slice().sort((a, b) => {
      const ra = s[a].n ? s[a].ok / s[a].n : -1;
      const rb = s[b].n ? s[b].ok / s[b].n : -1;
      return ra - rb;
    });
  }

  function lastResults() {
    const m = {};
    for (const x of state.attempts) m[x.id] = x.ok;
    return m;
  }

  function streak() {
    const days = new Set(state.attempts.map(x => dayKey(x.t)));
    let d = new Date();
    if (!days.has(dayKey(d))) d = addDays(d, -1);
    let n = 0;
    while (days.has(dayKey(d))) { n++; d = addDays(d, -1); }
    return n;
  }

  const todayCount = () => {
    const k = dayKey();
    return state.attempts.filter(x => dayKey(x.t) === k).length;
  };

  // Picks the best bank question for a target skill and difficulty:
  // never-seen and previously-missed questions first, ones you got right last.
  function bankPick(t, used = new Set()) {
    const last = lastResults();
    let pool = BANK.filter(q => q.skill === t.skill && !used.has(q.id));
    if (!pool.length) pool = BANK.filter(q => q.domain === t.domain && !used.has(q.id));
    if (!pool.length) return null;
    const scored = pool.map(q => [q, -Math.abs(DIFF[q.difficulty] - DIFF[t.difficulty || 'medium']) * 1.5 +
      (q.id in last ? (last[q.id] ? -2.5 : 1.6) : 1.5) + Math.random() * 0.6]);
    return scored.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }

  // ---------- AI question writer (Claude, on the viewer's own account) ----------

  const ai = { fn: null, state: 'checking', cooldownUntil: 0, listeners: new Set() };
  const AI_OFF_CODES = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired']);
  const aiUsable = () => ai.state === 'ready' && Date.now() > ai.cooldownUntil;

  (async () => {
    try { ai.fn = window.claude?.use ? await window.claude.use('sample') : null; } catch { ai.fn = null; }
    ai.state = ai.fn ? 'ready' : 'off';
    ai.listeners.forEach(f => f());
  })();

  function aiFailed(code) {
    if (AI_OFF_CODES.has(code)) { ai.state = 'off'; ai.listeners.forEach(f => f()); }
    if (code === 'rate_limited') ai.cooldownUntil = Date.now() + 60000;
    return {
      not_granted: 'Claude access was declined, so questions come from the built-in bank.',
      rate_limited: 'Claude is busy or you reached a usage limit. Using the built-in bank for a minute.',
      session_expired: 'Your Claude sign-in expired. Using the built-in bank.'
    }[code] || '';
  }

  // The official question wording for skills whose stem never changes on the test.
  const FIXED_STEMS = {
    'Words in context': 'Which choice completes the text with the most logical and precise word or phrase?',
    'Boundaries': 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    'Form, structure and sense': 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    'Transitions': 'Which choice completes the text with the most logical transition?',
    'Inferences': 'Which choice most logically completes the text?'
  };
  const SKILL_GUIDE = {
    'Words in context': 'A passage of 1–3 sentences (25–70 words) with one blank written as ______. The four choices are single words or short phrases of the same part of speech.',
    'Text structure and purpose': 'A passage of 60–150 words (science, history, social science, the arts, or a literary excerpt you write yourself). Ask "Which choice best states the main purpose of the text?", "Which choice best describes the overall structure of the text?", or "Which choice best describes the function of the [ordinal] sentence in the overall structure of the text?". The choices are full sentences.',
    'Cross-text connections': 'Two short texts in the passage, labeled "Text 1" and "Text 2" on their own lines (40–90 words each), taking different positions on one topic. Ask "Based on the texts, how would the author of Text 2 most likely respond to [a specific claim] in Text 1?" or a close variant. The choices are full sentences.',
    'Central ideas and details': 'A passage of 60–150 words. Ask "Which choice best states the main idea of the text?" or "According to the text, ...". The choices are full sentences.',
    'Command of evidence: textual': 'A passage of 60–150 words presenting a claim or hypothesis. Ask "Which finding, if true, would most directly support [weaken] the [researcher\'s] claim?" or "Which quotation from [a literary work] most effectively illustrates the claim?". The choices are full sentences or quotations.',
    'Command of evidence: quantitative': 'A passage of 50–120 words that refers to a data table, plus the table itself in the "table" field (2–4 columns, 3–6 rows, realistic made-up data with a clear caption). Ask "Which choice most effectively uses data from the table to complete the [example / statement / claim]?" with the passage ending in a blank ______, or "Which choice best describes data from the table that support the claim?". Exactly one choice is both accurate to the table and relevant to the claim; include a choice that is accurate but irrelevant.',
    'Inferences': 'A passage of 60–150 words whose final sentence ends with a blank ______. The choices are clauses that complete that sentence.',
    'Boundaries': 'One or two sentences (20–60 words) with a blank ______ at a punctuation boundary. The choices are the same words with different punctuation (commas, semicolons, colons, dashes or periods).',
    'Form, structure and sense': 'One or two sentences (20–60 words) with a blank ______ testing subject-verb agreement, pronoun agreement, verb tense or form, plural versus possessive nouns, or modifier placement.',
    'Transitions': 'A passage of 2–4 sentences (30–90 words) with a blank ______ at the start of a sentence. The choices are four transition words or phrases, each ending in a comma, and only one fits the logic.',
    'Rhetorical synthesis': 'The passage is "While researching a topic, a student has taken the following notes:" followed by 4–6 notes, each on its own line starting with "• ". The prompt is "The student wants to [specific goal]. Which choice most effectively uses relevant information from the notes to accomplish this goal?" All four choices are accurate to the notes, but only one achieves the goal.'
  };
  const MATH_GUIDE = 'A math question testing this skill, written like a real SAT stem: 1–3 sentences, with a realistic context only if it adds something. Leave "passage" empty unless a short context paragraph is needed. Use the "table" field for data tables. A graphing calculator is allowed on the real test.';
  const DIFF_GUIDE = {
    easy: 'Routine: one or two steps; most students get it right.',
    medium: 'Two or three steps or one common trap; about half of students get it right.',
    hard: 'As hard as the hardest questions in the second, harder module of the real test: multi-step reasoning, subtle wording or an unusual setup, with every wrong choice built from a specific common mistake.'
  };
  const compactQ = q => ({
    passage: q.passage || '', table: q.table || null, prompt: q.prompt,
    ...(q.type === 'spr' ? { type: 'spr', accept: q.accept } : { choices: q.choices, answer: q.answer }),
    explanation: q.explanation
  });

  function buildPrompt(t, format) {
    const section = SECTION_OF[t.domain];
    const examples = t.ref ? [] : shuffle(BANK.filter(q => q.skill === t.skill)).slice(0, 2).map(q => JSON.stringify(compactQ(q)));
    const shape = format === 'spr'
      ? '{"topic": "2–5 word topic label", "passage": "" or text, "table": null or {"caption": "...", "head": ["..."], "rows": [["..."]]}, "prompt": "...", "solution": "your full step-by-step solution", "type": "spr", "accept": ["the answer as a number, e.g. 7.5", "any equivalent form, e.g. 15/2"], "explanation": "1–3 sentences", "desmos": "the fastest way to solve this exact question in the Desmos calculator: what to type, inside backticks like \`y=x^2-4\`, and what to click; empty string if Desmos does not help"}'
      : '{"topic": "2–5 word topic label", "passage": "" or text, "table": null or {"caption": "...", "head": ["..."], "rows": [["..."]]}, "prompt": "...", "solution": "your full step-by-step solution", "choices": ["...", "...", "...", "..."], "answer": index 0-3 of the correct choice, "why": ["one sentence on why the first choice is right or wrong", "... second", "... third", "... fourth"], "explanation": "1–3 sentences on the key idea and the main trap", "desmos": "math only: the fastest way to solve this exact question in the Desmos calculator, with what to type inside backticks like \`y=x^2-4\` and what to click; empty string if Desmos does not help or for Reading and Writing", "shortcut": "Reading and Writing only: the one-sentence pattern shortcut that finds the answer fast; empty string for math"}';
    return [
      `Write ONE question for the digital SAT, ${SECTIONS[section]} section, exactly as it would appear on the real test.`,
      `Domain: ${t.domain}`,
      `Skill: ${t.skill}`,
      `Difficulty: ${t.difficulty}. ${DIFF_GUIDE[t.difficulty] || DIFF_GUIDE.medium}`,
      `Format: ${SKILL_GUIDE[t.skill] || MATH_GUIDE}`,
      PATTERN[t.pattern] ? `Question pattern (one that recurs on recent tests): ${PATTERN[t.pattern].label}. ${PATTERN[t.pattern].guide}` : '',
      FIXED_STEMS[t.skill] ? `The prompt must be exactly: "${FIXED_STEMS[t.skill]}"` : '',
      section === 'math'
        ? (format === 'spr'
          ? 'This is a student-produced response question: no answer choices, and the answer is a single number (integer, decimal or fraction).'
          : 'This is a multiple-choice question with exactly 4 choices.')
        : 'One passage and one question, as on the real test.',
      t.ref ? [
        '',
        'The student just got the question below wrong. Write a NEW question that tests the same specific concept and the same trap at the same difficulty, so they practice exactly what they missed. Change the context, names and numbers; do not reuse its wording or answers.',
        'The missed question: ' + JSON.stringify(compactQ(t.ref))
      ].join('\n') : '',
      '',
      'Rules:',
      '- Only content that appears on the real SAT: the passage (if any), the question stem and the choices. The prompt is the question stem alone: no notes, hints, tips, caveats or instructions about how to answer.',
      '- Write entirely new content. Never copy real SAT or College Board questions.',
      '- Facts about real people, places, events and science must be accurate. If you are not certain of a fact, use a generic or clearly fictional subject instead (for example "a team of researchers").',
      '- Exactly one answer is correct. Each wrong choice must be tempting for a specific reason (a common mistake or misreading) but clearly wrong on careful reading.',
      '- No Markdown. Write ALL math (variables, expressions, equations, fractions, roots, exponents, angles) in LaTeX: inline between \\( and \\), and an equation or system shown on its own line between \\[ and \\] (use \\begin{aligned} ... \\end{aligned} for a system). Example shape: "\\[ equation \\]What is the value of \\(x\\)?" Never use $ for math; dollar amounts are plain text like $40.',
      '- This is JSON, so write every backslash twice: "\\\\(\\\\frac{3}{4}x\\\\)", "\\\\[x^2 - 5 = 0\\\\]".',
      '- The explanation and the "why" lines must refer to choices by their content, never by letter, because choices get reordered.',
      `- Choose a topic different from these recent ones: ${state.aiTopics.slice(-25).join('; ') || 'none yet'}.`,
      '- Work out "solution" before "answer", then check that exactly one choice is correct. If not, fix the question before replying.',
      '',
      examples.length ? 'Examples of the format (do not reuse their topics):\n' + examples.join('\n') : '',
      '',
      'Reply with only one JSON object of this shape:',
      shape
    ].join('\n');
  }

  // A LaTeX command written with a single backslash in JSON turns into a control
  // character (\frac -> form feed + "rac", \times -> tab + "imes"). Put the backslash back.
  const fixTex = s => s.replace(/\f/g, '\\f').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
    .replace(/\n(?=(?:eq|e|ot|otin|u|abla|eg|i|mid)\b)/g, '\\n');
  const fixAll = v => typeof v === 'string' ? fixTex(v) : Array.isArray(v) ? v.map(fixAll)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fixAll(x)])) : v;

  // Recovers a reply whose JSON broke on single backslashes such as "\(" or "\sqrt".
  function recoverJSON(text) {
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    // In a reply that failed to parse, every backslash is literal LaTeX except one escaping a quote.
    const doubled = text.slice(a, b + 1).replace(/\\(?!")/g, '\\\\');
    try {
      // After doubling, a real newline escape reads as a literal "\n": turn it back into a newline
      // unless it starts a LaTeX command such as \neq.
      return fixAll(JSON.parse(doubled, (k, v) => typeof v === 'string'
        ? v.replace(/\\n(?!(?:eq|e|ot|otin|u|abla|eg|i|mid)\b)/g, '\n') : v));
    } catch { return null; }
  }

  // Every formula must typeset, and delimiters must pair up.
  function mathOK(s) {
    if (typeof s !== 'string') return true;
    if ((s.match(/\\\(/g) || []).length !== (s.match(/\\\)/g) || []).length) return false;
    if ((s.match(/\\\[/g) || []).length !== (s.match(/\\\]/g) || []).length) return false;
    if (!window.katex) return true;
    for (const m of s.matchAll(MATH_RE)) {
      try { texHTML(m[1] ?? m[2], m[2] != null); } catch { return false; }
    }
    return true;
  }

  // The number a math choice stands for (3, -1.5, \frac{4}{3}, $34), or NaN.
  function choiceValue(c) {
    let s = c.trim();
    const m = /^\\\((.*)\\\)$/s.exec(s);
    if (m) s = m[1].trim();
    s = s.replace(/^\\?\$/, '').replace(/\{,\}|,/g, '').replace(/\\(?:d|t)?frac/, '\\frac');
    const f = /^(-)?\\frac\{(-?\d*\.?\d+)\}\{(\d*\.?\d+)\}$/.exec(s);
    if (f) return (f[1] ? -1 : 1) * Number(f[2]) / Number(f[3]);
    return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
  }

  // Text that never appears in a real SAT question.
  const META_RE = /\b(note|hint|tip|remember|reminder)\s*:|\((?:note|hint)\b|extraneous solutions? (?:arise|exist|occur)|round your answer|enter your answer|show your work/i;

  function validateAI(r, t, format) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
    r = fixAll(r);
    const section = SECTION_OF[t.domain];
    const str = (v, max) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null);
    let prompt = str(r.prompt, 1200);
    const explanation = str(r.explanation, 1500);
    if (!prompt || !explanation) return null;
    const passage = typeof r.passage === 'string' ? r.passage.trim() : '';
    if (META_RE.test(prompt) || META_RE.test(passage)) return null;
    if (section === 'rw') {
      // One passage of real-test length and a one-line question.
      const limit = t.skill === 'Cross-text connections' ? 230 : t.skill === 'Rhetorical synthesis' ? 200 : 170;
      if (!passage || words(passage) > limit || words(prompt) > 60) return null;
      if (FIXED_STEMS[t.skill]) {
        if (!passage.includes('___')) return null;
        prompt = FIXED_STEMS[t.skill];
      }
      if (t.skill === 'Rhetorical synthesis' && !passage.includes('•')) return null;
    } else if (words(prompt) + words(passage) > 140) {
      return null;
    }
    const q = {
      id: 'ai-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      source: 'ai', section, domain: t.domain, skill: t.skill, pattern: t.pattern || null, difficulty: t.difficulty || 'medium',
      passage, prompt, explanation,
      topic: str(r.topic, 80) || t.skill,
      solution: typeof r.solution === 'string' ? r.solution.trim().slice(0, 3000) : '',
      desmos: section === 'math' && typeof r.desmos === 'string' && r.desmos.trim().length > 8 ? r.desmos.trim().slice(0, 600) : '',
      shortcut: section === 'rw' && typeof r.shortcut === 'string' && r.shortcut.trim().length > 8 ? r.shortcut.trim().slice(0, 400) : ''
    };
    const tb = r.table;
    if (tb && Array.isArray(tb.head) && Array.isArray(tb.rows) && tb.head.length && tb.rows.length && tb.rows.length <= 12 &&
        tb.rows.every(row => Array.isArray(row) && row.length === tb.head.length)) {
      q.table = { caption: typeof tb.caption === 'string' ? tb.caption : '', head: tb.head.map(String), rows: tb.rows.map(row => row.map(String)) };
    }
    if (t.skill === 'Command of evidence: quantitative' && !q.table) return null;
    if (format === 'spr') {
      const accept = Array.isArray(r.accept) ? r.accept.map(a => String(a).trim()).filter(a => !isNaN(toNum(a))) : [];
      if (!accept.length) return null;
      q.type = 'spr';
      q.accept = accept;
    } else {
      const choices = Array.isArray(r.choices) ? r.choices.map(c => String(c).trim().replace(/^\(?[A-D][).:]\s+/, '')) : [];
      const letter = typeof r.answer === 'string' && /^\s*\(?([A-D])\)?\s*$/i.exec(r.answer);
      const ans = letter ? 'ABCD'.indexOf(letter[1].toUpperCase()) : Number(r.answer);
      if (choices.length !== 4 || choices.some(c => !c || c.length > 700) || new Set(choices).size !== 4 ||
          !Number.isInteger(ans) || ans < 0 || ans > 3) return null;
      const why = Array.isArray(r.why) && r.why.length === 4 && r.why.every(w => typeof w === 'string' && w.trim() && w.length <= 400) ? r.why.map(w => w.trim()) : null;
      // Numeric choices go smallest to largest, as on the SAT; others are shuffled.
      const values = choices.map(choiceValue);
      const order = values.every(v => !isNaN(v)) ? [0, 1, 2, 3].sort((a, b) => values[a] - values[b]) : shuffle([0, 1, 2, 3]);
      q.choices = order.map(i => choices[i]);
      q.answer = order.indexOf(ans);
      if (why) q.why = order.map(i => why[i]);
    }
    const texts = [q.passage, q.prompt, q.explanation, q.solution, ...(q.choices || []), ...(q.why || []),
      ...(q.table ? [q.table.caption, ...q.table.head, ...q.table.rows.flat()] : [])];
    if (!texts.every(mathOK)) return null;
    return q;
  }

  // A second, independent Claude call solves the question from scratch before a student
  // sees it. Returns false if its answer differs from the key or it judges the question unsound.
  async function verify(q, signal) {
    const shown = {
      passage: q.passage || '', table: q.table || null, question: q.prompt,
      ...(q.type === 'spr' ? { format: 'grid-in: the answer is a single number' } : { choices: q.choices.map((c, i) => `${'ABCD'[i]}) ${c}`) })
    };
    let r;
    try {
      r = await ai.fn.json([
        'You are checking a practice question written for the digital SAT before a student sees it. Solve it yourself from scratch, then judge it.',
        'It is "sound" only if: it reads like a real SAT question, the passage and question make sense, any facts are accurate, it can be answered from what is given, and exactly one choice is clearly best (for a grid-in, exactly one number).',
        'Reply with only JSON: {"answer": "the letter A-D, or the number for a grid-in", "sound": true or false, "issue": "one sentence if not sound"}',
        '',
        JSON.stringify(shown)
      ].join('\n'), { signal, cache: false, modelTier: 'default', effort: 'low' });
    } catch (e) {
      if (e?.code === 'cancelled' || AI_OFF_CODES.has(e?.code)) throw e;
      return true;   // the check itself failed: don't throw away a question that passed validation
    }
    if (!r || r.sound === false) return false;
    if (q.type === 'spr') return isCorrect(q, String(r.answer ?? ''));
    const letter = String(r.answer ?? '').toUpperCase().match(/[A-D]/);
    return !!letter && 'ABCD'.indexOf(letter[0]) === q.answer;
  }

  async function writeQuestion(t, format, signal) {
    let raw;
    try {
      raw = await ai.fn.json(buildPrompt(t, format), { signal, cache: false, modelTier: 'default', effort: 'low' });
    } catch (e) {
      if (e?.code !== 'invalid_json' || !e.text) throw e;
      raw = recoverJSON(e.text);
    }
    return validateAI(raw, t, format);
  }

  // Writes a question, checks it independently, and rewrites it once if the check fails.
  async function generate(t, signal) {
    const format = t.ref ? (t.ref.type === 'spr' ? 'spr' : 'mc')
      : SECTION_OF[t.domain] === 'math' && Math.random() < 0.25 ? 'spr' : 'mc';
    let q = null;
    for (let tries = 0; tries < 2 && !q; tries++) {
      const draft = await writeQuestion(t, format, signal);
      if (draft && await verify(draft, signal)) q = draft;
    }
    if (!q) throw { code: 'invalid_question' };
    state.generated[q.id] = q;
    pruneGenerated(200);
    state.aiTopics = [...state.aiTopics, q.topic].slice(-40);
    save();
    return q;
  }

  // ---------- Question rendering & interaction ----------

  // Difficulty as filled answer bubbles: one for easy, two for medium, three for hard.
  const diffHTML = d => `<span class="diff" title="${esc(d)}"><span class="sr">${esc(d)}</span>${[0, 1, 2].map(i => `<i class="${i <= (DIFF[d] ?? 0) + 1 ? 'on' : ''}"></i>`).join('')}</span>`;
  const FLAG_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4h11l-1.5 4L16 12H5"/></svg>';

  // Renders a question the way the test lays it out. `st` is { resp, revealed, elim }.
  // Options: num (question number for the header), flag (true/false shows the review marker).
  function questionHTML(q, st, o = {}) {
    const elim = st.elim || [];
    const head = `<header class="q-head">
      ${o.num != null ? `<span class="q-num">${o.num}</span>` : ''}
      ${o.flag != null ? `<button class="mark ${o.flag ? 'on' : ''}" data-act="flag" aria-pressed="${!!o.flag}">${FLAG_SVG}<span>${o.flag ? 'Marked for review' : 'Mark for review'}</span></button>` : ''}
      <span class="spacer"></span>
      <span class="q-meta">${esc(q.skill || q.domain)}</span>${diffHTML(q.difficulty)}
    </header>`;
    const passage = q.passage ? `<div class="passage">${rich(q.passage)}</div>` : '';
    const table = q.table ? `<div class="table-wrap q-table"><table>${q.table.caption ? `<caption>${rich(q.table.caption)}</caption>` : ''}<thead><tr>${q.table.head.map(h => `<th>${rich(h)}</th>`).join('')}</tr></thead><tbody>${q.table.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    let answer;
    if (q.type === 'spr') {
      answer = `<div class="spr"><input class="input" data-spr value="${esc(st.resp ?? '')}" ${st.revealed ? 'disabled' : ''} placeholder="Your answer, e.g. 7.5 or 15/2" autocomplete="off" inputmode="decimal" aria-label="Your answer"></div>`;
    } else {
      answer = '<div class="choices">' + q.choices.map((c, i) => {
        const L = 'ABCD'[i];
        let cls = 'choice-row';
        if (st.resp === i) cls += ' selected';
        if (!st.revealed && elim.includes(i)) cls += ' out';
        if (st.revealed) cls += i === q.answer ? ' correct' : st.resp === i ? ' wrong' : ' dim';
        return `<div class="${cls}">
          <button class="choice" data-choice="${i}" ${st.revealed ? 'disabled' : ''} aria-label="Choice ${L}"><span class="letter">${L}</span><span class="choice-text">${rich(c, true)}</span></button>
          ${st.revealed ? '' : `<button class="elim" data-elim="${i}" title="Cross out ${L}" aria-label="Cross out choice ${L}"><s>${L}</s></button>`}
          ${st.revealed && q.why ? `<div class="why-line">${rich(q.why[i])}</div>` : ''}
        </div>`;
      }).join('') + '</div>';
    }
    let fb = '';
    if (st.revealed) {
      const ok = isCorrect(q, st.resp);
      const ans = q.type === 'spr' && !ok ? `The answer is ${esc(q.accept[0])}. ` : '';
      const pat = PATTERN[patternOf(q)];
      const desmos = q.section === 'math' ? (q.desmos || pat?.desmos) : null;
      const tip = q.section === 'rw' ? (q.shortcut || pat?.tip) : pat?.tip;
      const trick = pat || desmos ? `<div class="trick">
          <div class="trick-head">${pat ? `Pattern: ${esc(pat.label.replace(' (est.)', ''))}` : 'Faster way'}${pat ? `<a class="small" href="#/practice?pattern=${pat.id}">Drill this pattern</a>` : ''}</div>
          ${tip ? `<p><strong>Shortcut:</strong> ${codeText(tip)}</p>` : ''}
          ${desmos ? `<p><strong>Desmos:</strong> ${codeText(desmos)}</p>` : ''}
          ${pat?.trap ? `<p><strong>Trap:</strong> ${codeText(pat.trap)}</p>` : ''}
        </div>` : '';
      fb = `<div class="feedback ${ok ? 'ok' : 'bad'}"><strong>${ok ? 'Correct.' : answered(st.resp) ? 'Not quite.' : 'Not answered.'}</strong> ${ans}${rich(q.explanation)}</div>` + trick +
        (q.solution ? `<details class="solution"><summary>Full worked solution</summary><div>${rich(q.solution)}</div></details>` : '');
    }
    const stem = `<div class="prompt">${rich(q.prompt)}</div>`;
    const split = q.section === 'rw' && (q.passage || q.table);
    const body = split
      ? `<div class="q-body split"><div class="q-left">${passage}${table}</div><div class="q-right">${stem}${answer}${fb}</div></div>`
      : `<div class="q-body"><div class="q-single">${passage}${table}${stem}${answer}${fb}</div></div>`;
    return `<article class="question">${head}${body}</article>`;
  }

  // Selecting and crossing out choices, shared by every view that shows a question.
  // Updates `st` and repaints in place; returns true if the click was a choice action.
  function choiceClick(e, st, root) {
    if (!st || st.revealed) return false;
    const x = e.target.closest('[data-elim]');
    const c = !x && e.target.closest('[data-choice]');
    if (!x && !c) return false;
    const i = Number((x || c).dataset[x ? 'elim' : 'choice']);
    const elim = st.elim || [];
    if (x) {
      st.elim = elim.includes(i) ? elim.filter(j => j !== i) : [...elim, i];
      if (st.resp === i) st.resp = null;
    } else {
      st.resp = i;
      st.elim = elim.filter(j => j !== i);
    }
    paintChoices(root, st);
    return true;
  }

  function paintChoices(root, st) {
    root.querySelectorAll('.choice-row').forEach((row, i) => {
      row.classList.toggle('selected', st.resp === i);
      row.classList.toggle('out', (st.elim || []).includes(i));
    });
  }

  // Keyboard: A–D or 1–4 choose, Enter checks or moves on. Returns a cleanup function.
  function keys(h) {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = e.target.matches('input, select, textarea');
      if (e.key === 'Enter') {
        if (typing && !e.target.matches('[data-spr]')) return;
        e.preventDefault();
        h.enter();
        return;
      }
      if (typing) return;
      const k = 'abcd'.indexOf(e.key.toLowerCase()) >= 0 ? 'abcd'.indexOf(e.key.toLowerCase()) : '1234'.indexOf(e.key);
      if (k >= 0) h.choose(k);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }

  function chooseKey(q, st, root, k) {
    if (!q || !st || st.revealed || q.type === 'spr') return;
    st.resp = k;
    st.elim = (st.elim || []).filter(j => j !== k);
    paintChoices(root, st);
  }

  const loadingHTML = text => `<div class="loading"><span class="spinner" aria-hidden="true"></span><span>${esc(text)}</span></div>`;
  const desmosLink = '<a class="btn" href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Desmos</a>';

  // ---------- Views ----------

  function home(el) {
    const p = state.profile;
    const rw = sectionScore('rw'), m = sectionScore('math');
    const total = rw != null && m != null ? rw + m : null;
    const today = todayCount();
    const goal = p.dailyGoal || 10;
    const all = state.attempts.length;
    const correct = state.attempts.filter(x => x.ok).length;
    const days = daysUntilTest();
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const st = streak();
    const due = dueMistakes().length;

    // Daily question: same for everyone on a given day.
    const dk = dayKey();
    let h = 0;
    for (const c of dk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const dq = BANK[h % BANK.length];
    const daily = state.daily?.day === dk ? { resp: state.daily.resp, revealed: true } : { resp: null, revealed: false, elim: [] };

    // Activity heatmap: 16 weeks ending this week.
    const counts = {};
    for (const x of state.attempts) { const k = dayKey(x.t); counts[k] = (counts[k] || 0) + 1; }
    const now = new Date();
    const start = addDays(now, -(7 * 15 + now.getDay()));
    let cells = '';
    for (let i = 0; i < 16 * 7; i++) {
      const d = addDays(start, i);
      const n = counts[dayKey(d)] || 0;
      const lvl = n === 0 ? '' : n < 5 ? 'l1' : n < 10 ? 'l2' : n < 20 ? 'l3' : 'l4';
      cells += `<span class="${d > now ? 'future' : lvl}" title="${fmtDate(d)}: ${plural(n, 'question')}"></span>`;
    }

    const ds = domainStats();
    const focus = weakDomains().slice(0, 3).map(d => {
      const s = ds[d];
      const a = pct(s.ok, s.n);
      const cls = !s.n ? '' : a >= 80 ? 'ok' : a >= 50 ? 'warn' : 'bad';
      return `<div class="focus-item">
        <div class="row"><strong class="small">${esc(d)}</strong><span class="small muted">${s.n ? `${a}% of ${s.n}` : 'Not started'}</span></div>
        <div class="row"><div class="bar ${cls}" style="flex:1"><span style="width:${s.n ? a : 0}%"></span></div>
        <a class="btn sm" href="#/practice?domain=${encodeURIComponent(d)}">Practice</a></div>
      </div>`;
    }).join('');

    const resume = state.adaptive && state.adaptive.items.filter(i => !i.void).length < state.adaptive.length;

    // Position on the 400–1600 score scale, as a percentage of its width.
    const onScale = v => Math.max(0, Math.min(100, (v - 400) / 12));
    const testDate = days == null ? '<a href="#/settings">Set a date</a>' : days > 0 ? plural(days, 'day') : days === 0 ? 'Today' : '<a href="#/settings">Passed</a>';
    const needs = '<span class="muted small">5 answers needed</span>';

    el.innerHTML = `
      ${days != null && days >= 0 && days <= 7 ? `<a class="card due-card testday-banner" href="#/testday"><span><strong>${days === 0 ? 'Your SAT is today.' : `Your SAT is in ${plural(days, 'day')}.`}</strong> Your final plan is ready: what to review, what to pack and how to pace it.</span><span class="btn primary">Open plan</span></a>` : ''}
      <section class="report">
        <div class="report-main">
          <h1 class="report-hello">${hello}${p.name ? ', ' + esc(p.name) : ''}</h1>
          <p class="report-label">Predicted SAT score</p>
          <div class="score-xl">${total ?? '<span class="score-none">No score yet</span>'}</div>
          <div class="scale" role="img" aria-label="${total ? `Predicted ${total}, goal ${p.targetScore}, on the 400 to 1600 scale` : `Goal ${p.targetScore} on the 400 to 1600 scale`}">
            ${total ? `<span class="scale-mark you" style="left:${onScale(total)}%"><b>You</b></span>` : ''}
            <span class="scale-mark goal" style="left:${onScale(p.targetScore)}%"><b>Goal ${p.targetScore}</b></span>
            <span class="scale-end">400</span><span class="scale-end right">1600</span>
          </div>
          <dl class="parts">
            <div><dt>Reading and Writing</dt><dd>${rw ?? needs}</dd></div>
            <div><dt>Math</dt><dd>${m ?? needs}</dd></div>
            <div><dt>Test date</dt><dd>${testDate}</dd></div>
          </dl>
        </div>
        <div class="report-actions">
          <a class="btn primary big" href="#/adaptive">${resume ? 'Resume studying' : 'Start studying'}</a>
          ${due ? `<a class="btn big" href="#/adaptive?start=review">Review ${plural(due, 'mistake')}</a>` : '<a class="btn big" href="#/exams">Take a mock exam</a>'}
          <p class="small muted">${total ? 'Your score updates from your last 40 answers in each section, weighted by difficulty.' : 'Answer at least 5 questions in each section to see a predicted score.'}</p>
        </div>
      </section>

      <dl class="ledger">
        <div><dt>Streak</dt><dd>${st}<small>${st === 1 ? 'day' : 'days'}</small></dd></div>
        <div><dt>Today</dt><dd>${today}<small>of ${goal}</small></dd></div>
        <div><dt><a href="#/review">Mistakes due</a></dt><dd>${due}</dd></div>
        <div><dt>Accuracy</dt><dd>${all ? pct(correct, all) + '<small>%</small>' : '<small>None yet</small>'}</dd></div>
      </dl>

      <div class="grid two home-cols">
        <div class="card" id="daily">
          <div class="card-head"><h2>Question of the day</h2><span class="muted small">${fmtDate(Date.now())}</span></div>
          <div id="daily-q">${questionHTML(dq, daily)}</div>
          ${daily.revealed ? '' : '<div class="q-actions"><button class="btn primary" id="daily-check">Check answer</button></div>'}
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h2>Activity</h2><span class="muted small">Last 16 weeks</span></div>
            <div class="heatmap">${cells}</div>
            <div class="legend">Fewer <span class="sw"></span><span class="sw l1"></span><span class="sw l2"></span><span class="sw l3"></span><span class="sw l4"></span> More</div>
          </div>
          <div class="card">
            <div class="card-head"><h2>Focus areas</h2><a class="small" href="#/diagnostics">Diagnostics</a></div>
            ${focus}
          </div>
        </div>
      </div>`;

    if (daily.revealed) return;
    const box = $('#daily', el);
    box.addEventListener('click', e => {
      if (choiceClick(e, daily, box)) return;
      if (e.target.id === 'daily-check') {
        if (dq.type === 'spr') daily.resp = $('[data-spr]', box).value.trim();
        if (!answered(daily.resp)) return;
        record(dq, isCorrect(dq, daily.resp), 'daily');
        state.daily = { day: dk, resp: daily.resp };
        save();
        render();
      }
    });
  }

  function adaptive(el, params) {
    let s = state.adaptive;
    let opts = { section: 'mix', length: 20 };
    let cur = null;          // { q, origin, followup }
    let st = null;           // { resp, revealed, elim }
    let pending = null;      // promise of the next { q, origin, followup }
    let failure = '';        // shown when no next question could be produced
    let note = '';           // shown when Claude fell back to the bank, or after a report
    let summary = null;
    let started = Date.now();
    const ctls = new Set();
    const twins = new Map(); // follow-up key -> promise of the similar question written right after a miss

    const sectionDomains = () => (s.section === 'rw' || s.section === 'math' ? DOMAINS[s.section] : ALL_DOMAINS);
    const answeredCount = () => s.items.filter(i => !i.void).length;
    const usedIds = () => new Set([...s.items.map(i => i.id), ...(cur ? [cur.q.id] : [])]);

    function aiCall(t) {
      const ctl = new AbortController();
      ctls.add(ctl);
      const p = generate(t, ctl.signal).finally(() => ctls.delete(ctl));
      p.catch(() => {});   // a cancelled request nobody waits for is not an error
      return p;
    }

    // Chooses what comes at question number `pos`, in this order: a similar question for a miss
    // from earlier in this session, a mistake from an earlier day that is due again, then a new
    // question weighted toward the skills worth the most points that you're weakest at.
    function planNext(pos) {
      const domains = sectionDomains();
      const used = usedIds();
      const useAI = aiUsable();
      const ok = d => useAI || BANK.some(q => q.domain === d && !used.has(q.id));
      const ab = abilities();

      const f = s.followups.find(x => x.due <= pos && ok(x.d));
      if (f) return { followup: f, origin: f.origin, domain: f.d, skill: f.k, pattern: f.p, difficulty: f.f, ref: getQ(f.ref) };

      const inSession = id => s.items.some(i => i.origin === id || i.id === id) || (cur && (cur.origin === id || cur.q.id === id));
      const due = dueMistakes().filter(([id, m]) => domains.includes(m.d) && !inSession(id));
      if (due.length && (s.section === 'review' || pos % 3 === 0 || Math.random() < 0.15)) {
        const [id, m] = due[0];
        const orig = getQ(id);
        // Without Claude, the original question itself comes back once it's due.
        if (!useAI && orig && !used.has(id)) return { q: orig, origin: id };
        if (ok(m.d)) return { origin: id, domain: m.d, skill: m.k, pattern: m.p, difficulty: m.f || 'medium', ref: orig };
      }
      if (s.section === 'review') return null;

      const recent = s.items.slice(-2).map(i => i.d);
      const final = s.section === 'final';
      const p = pickPattern(domains, p => useAI || BANK.some(q => q.skill === p.skill && !used.has(q.id)), ab, recent, final);
      if (!p) return null;
      // Just before the test: a notch easier, to consolidate rather than strain.
      return { domain: p.domain, skill: p.skill, pattern: p.id, difficulty: pickLevel(ab[p.domain] + (final && !module2() ? -0.3 : stretch())) };
    }

    // Turns a plan into a question: Claude writes it when available, otherwise the bank supplies one.
    function realize(t, bankOnly = false) {
      if (t.q) return Promise.resolve(t);
      const used = usedIds();
      const fromBank = msg => { const q = bankPick(t, used); return q ? { ...t, q, note: msg } : null; };
      if (!aiUsable() || bankOnly) return Promise.resolve(fromBank(''));
      const p = (t.followup && twins.get(t.followup.key)) || aiCall(t);
      return p.then(q => ({ ...t, q }), e => {
        if (e?.code === 'cancelled') throw e;
        const r = fromBank(aiFailed(e?.code));
        if (!r) throw e;
        return r;
      });
    }

    // Prepares the next question while the current one is on screen, so there's no wait.
    function prefetch() {
      if (pending || !s) return;
      const onScreen = cur && st && !st.revealed ? 1 : 0;
      if (answeredCount() + onScreen >= s.length) return;
      const t = planNext(s.shown + 1);
      pending = t ? realize(t) : Promise.resolve(null);
      pending.catch(() => {});
    }

    async function advance() {
      if (!s) return;
      if (answeredCount() >= s.length) return finish();
      prefetch();
      const p = pending;
      cur = null; st = null; failure = ''; note = '';
      draw();
      let next;
      try {
        next = await p;
      } catch (e) {
        if (p !== pending) return;
        pending = null;
        if (e?.code === 'cancelled') return;
        failure = 'Couldn\'t get the next question. Check your connection and try again.';
        return draw();
      }
      if (p !== pending || !s) return;
      pending = null;
      if (!next) return finish();
      if (next.followup) s.followups = s.followups.filter(x => x.key !== next.followup.key);
      s.shown++;
      save();
      cur = next;
      st = { resp: null, revealed: false, elim: [] };
      started = Date.now();
      draw();
      prefetch();
    }

    // Swaps a slow AI question for a built-in one.
    function useBankNow() {
      ctls.forEach(c => c.abort());
      const t = planNext(s.shown + 1);
      pending = t ? realize(t, true) : Promise.resolve(null);
      pending.catch(() => {});
      advance();
    }

    function begin(section, length) {
      s = state.adaptive = { section, length, items: [], followups: [], shown: 0, before: abilities(), started: Date.now() };
      save();
      // Start instantly with a fresh built-in question while Claude writes the next one.
      if (aiUsable() && section !== 'review') {
        const t = planNext(1);
        const q = t && !t.q && !t.origin && bankPick(t);
        if (q && lastResults()[q.id] !== true) { pending = Promise.resolve({ ...t, q }); }
      }
      advance();
    }

    function check() {
      if (!cur || !st || st.revealed) return;
      const q = cur.q;
      if (q.type === 'spr') st.resp = $('[data-spr]', el)?.value.trim() ?? '';
      if (!answered(st.resp)) return;
      st.revealed = true;
      const ok = isCorrect(q, st.resp);
      const undo = record(q, ok, 'adaptive', cur.origin);
      s.items.push({ id: q.id, origin: cur.origin, ok, resp: st.resp, d: q.domain, k: q.skill, f: q.difficulty, secs: Math.round((Date.now() - started) / 1000), undo });
      if (!ok) {
        // Reinforce quietly: a similar question comes back two questions from now.
        const f = { key: q.id + ':' + s.shown, origin: cur.origin || q.id, ref: q.id, d: q.domain, k: q.skill, p: patternOf(q), f: q.difficulty, due: s.shown + 3 };
        s.followups.push(f);
        if (aiUsable()) twins.set(f.key, aiCall({ domain: f.d, skill: f.k, pattern: f.p, difficulty: f.f, ref: q }));
      }
      save();
      draw();
    }

    function report() {
      const item = s.items[s.items.length - 1];
      if (!item || item.void) return;
      item.void = true;
      undoRecord(item.id, item.undo);
      s.followups = s.followups.filter(f => f.ref !== item.id);
      save();
      note = 'Thanks. This question won\'t count toward your stats.';
      draw();
    }

    function finish() {
      ctls.forEach(c => c.abort());
      pending = null;
      const items = s.items.filter(i => !i.void);
      summary = { ...s, items, after: abilities() };
      if (items.length) state.adaptiveHistory.push({ t: Date.now(), section: s.section, correct: items.filter(i => i.ok).length, total: items.length });
      state.adaptive = null;
      s = null;
      save();
      draw();
    }

    function levelBars(domains, ab, highlight) {
      return domains.map(d => {
        const m = Math.round(mastery(ab[d]) * 100);
        const cls = m >= 70 ? 'ok' : m >= 45 ? 'warn' : 'bad';
        return `<div class="level ${d === highlight ? 'current' : ''}"><div class="row"><span class="small">${esc(d)}</span><span class="small muted">${m}%</span></div><div class="bar ${cls}"><span style="width:${m}%"></span></div></div>`;
      }).join('');
    }

    function aiLine() {
      if (ai.state === 'checking') return '<p class="ai-line muted small">Checking whether Claude is available…</p>';
      if (ai.state === 'ready') return '<p class="ai-line small">Claude writes a new SAT question for you each time, aimed at your weak spots and your target score. The first time, Claude asks for permission, and each question uses a little of your Claude usage.</p>';
      return `<p class="ai-line muted small">Questions come from the built-in bank of ${BANK.length}. Open SatStat on claude.ai to get unlimited questions written by Claude.</p>`;
    }

    function draw() {
      if (summary) return drawSummary();
      if (!s) return drawSetup();
      drawRunning();
    }

    function drawSetup() {
      const ab = abilities();
      const ss = skillStats();
      const due = dueMistakes().length;
      const memory = Object.values(state.mistakes);
      const weakSkills = Object.entries(ss).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 4);
      const opt = (k, v, title, sub) => `<button class="option ${opts[k] === v ? 'active' : ''}" data-opt="${k}" data-v="${v}"><strong>${title}</strong><span>${sub}</span></button>`;
      const hist = state.adaptiveHistory.slice(-8).reverse().map(x => `<tr><td>${fmtDate(x.t)}</td><td>${{ mix: 'Mixed', review: 'Mistake review', final: 'Final review' }[x.section] || SECTIONS[x.section]}</td><td class="num">${x.correct}/${x.total}</td><td class="num">${pct(x.correct, x.total)}%</td></tr>`).join('');
      el.innerHTML = `
        <div class="page-head"><div><h1>Study</h1><p>A test that adapts as you go: every answer is checked right away, and every next question is picked for you.</p></div></div>
        ${due ? `<div class="card due-card"><div><strong>${plural(due, 'mistake')} due for review.</strong> <span class="muted">You'll get a similar question for each one.</span></div><button class="btn primary" data-act="review">Review now</button></div>` : ''}
        <div class="grid two">
          <div class="card stack">
            <h2>Section</h2>
            <div class="option-grid list">
              ${opt('section', 'mix', 'Mixed', 'Both sections')}
              ${opt('section', 'rw', SECTIONS.rw, 'Reading & Writing only')}
              ${opt('section', 'math', SECTIONS.math, 'Math only')}
            </div>
            <h2 style="margin-top:20px">Level</h2>
            <div class="option-grid list">
              <button class="option ${module2() ? 'active' : ''}" data-level="module2"><strong>Module 2 level</strong><span>Mostly hard questions, never easy. For 1300+ scorers.</span></button>
              <button class="option ${module2() ? '' : 'active'}" data-level="match"><strong>Match my level</strong><span>Easy to hard, following your answers</span></button>
            </div>
            <h2 style="margin-top:20px">Length</h2>
            <div class="option-grid list">
              ${opt('length', 10, '10 questions', 'About 15 minutes')}
              ${opt('length', 20, '20 questions', 'About 30 minutes')}
              ${opt('length', 30, '30 questions', 'About 45 minutes')}
            </div>
            ${aiLine()}
            <div class="row">
              <span class="small muted">Keys: A–D to choose, Enter to check</span>
              <span class="spacer"></span>
              <button class="btn primary" data-act="begin">Start</button>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h2>What SatStat knows about you</h2><a class="small" href="#/review">${plural(memory.filter(m => !m.mastered).length, 'concept')} in memory</a></div>
            ${levelBars(ALL_DOMAINS, ab)}
            ${weakSkills.length ? `<p class="small muted" style="margin:16px 0 6px">Weakest skills so far</p><div class="chips">${weakSkills.map(([k, v]) => `<span class="chip diff-hard">${esc(k)} <b>${pct(v.ok, v.n)}%</b></span>`).join('')}</div>` : ''}
            <p class="small muted">Each bar is your chance of getting a medium question right. Anything you miss comes back as a similar question later in the session, then again after 1, 3 and 7 days.</p>
          </div>
        </div>
        ${hist ? `<div class="card"><div class="card-head"><h2>Past sessions</h2></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Section</th><th class="num">Correct</th><th class="num">Accuracy</th></tr></thead><tbody>${hist}</tbody></table></div></div>` : ''}`;
    }

    function drawRunning() {
      const items = s.items.filter(i => !i.void);
      const correct = items.filter(i => i.ok).length;
      let run = 0;
      for (let i = items.length - 1; i >= 0 && items[i].ok; i--) run++;
      const num = items.length + (st && !st.revealed ? 1 : 0);
      const domains = sectionDomains();
      const last = st?.revealed && s.items[s.items.length - 1];
      const isLast = items.length >= s.length;
      const aiWriting = aiUsable() && !cur;

      let main;
      if (failure) {
        main = `<div class="empty"><p>${esc(failure)}</p><button class="btn primary" data-act="retry">Try again</button></div>`;
      } else if (!cur) {
        main = loadingHTML(aiWriting ? 'Claude is writing your next question…' : 'Picking your next question…') +
          (aiWriting ? '<div class="q-actions" style="justify-content:center"><button class="btn sm" data-act="bank-now">Use a built-in question instead</button></div>' : '');
      } else {
        main = `
          ${questionHTML(cur.q, st, { num: Math.max(1, num), flag: state.review.includes(cur.q.id) })}
          <div class="q-actions">
            ${st.revealed
              ? `<button class="btn primary" data-act="next">${isLast ? 'See results' : 'Next question'}</button>`
              : '<button class="btn primary" data-act="check">Check answer</button>'}
            <span class="spacer"></span>
            ${cur.q.section === 'math' ? desmosLink : ''}
            ${st.revealed && cur.q.source === 'ai' && !last?.void ? '<button class="btn ghost" data-act="report">Report a problem</button>' : ''}
          </div>`;
      }

      el.innerHTML = `
        <div class="exam-bar">
          <strong>${{ review: 'Mistake review', final: 'Final review' }[s.section] || 'Study'}</strong>
          <span class="muted">${Math.min(Math.max(1, num), s.length)} of ${s.length}</span>
          <div class="bar" style="flex:1;min-width:80px"><span style="width:${pct(items.length, s.length)}%"></span></div>
          <span class="small"><strong>${correct}/${items.length}</strong> correct</span>
          ${run >= 3 ? `<span class="run">${run} in a row</span>` : ''}
          <button class="btn sm" data-act="end">End</button>
        </div>
        ${note || cur?.note ? `<div class="notice">${esc(note || cur.note)}</div>` : ''}
        <div class="adaptive-layout">
          <div class="card q-card">${main}</div>
          <aside class="card levels">
            <div class="card-head"><h3>Your levels</h3><span class="muted small">Live</span></div>
            ${levelBars(domains, abilities(), cur?.q.domain)}
          </aside>
        </div>`;
    }

    function drawSummary() {
      const items = summary.items;
      const correct = items.filter(i => i.ok).length;
      const domains = [...new Set(items.map(i => i.d))];
      const rows = domains.map(d => {
        const di = items.filter(i => i.d === d);
        const b = Math.round(mastery(summary.before[d]) * 100), a = Math.round(mastery(summary.after[d]) * 100);
        return `<tr><td>${esc(d)}</td><td class="num">${di.filter(i => i.ok).length}/${di.length}</td><td class="num">${b}% → <strong>${a}%</strong> <span class="${a >= b ? 'up' : 'down'}">${a >= b ? '+' : ''}${a - b}</span></td></tr>`;
      }).join('');
      const missed = items.filter(i => !i.ok && getQ(i.id));
      const concepts = new Set(items.filter(i => !i.ok).map(i => i.origin || i.id)).size;
      const reinforced = items.filter(i => i.origin && i.ok).length;
      const weakest = (summary.section === 'rw' || summary.section === 'math' ? DOMAINS[summary.section] : ALL_DOMAINS).slice().sort((a, b) => summary.after[a] - summary.after[b])[0];
      el.innerHTML = `
        <div class="page-head"><div><h1>Session complete</h1><p>${concepts ? `Similar questions for the ${plural(concepts, 'concept')} you missed will come back tomorrow. ` : ''}Next time, SatStat will lean toward ${esc(weakest)}.</p></div>
          <div class="row"><a class="btn" href="#/review">Mistakes</a><button class="btn primary" data-act="again">Study again</button></div></div>
        <div class="grid two">
          <div class="card"><div class="stat-label">Score</div><div class="score-big">${correct}<span class="muted" style="font-size:20px"> / ${items.length}</span></div>
            <p class="small muted">${pct(correct, items.length)}% correct.${reinforced ? ` You got ${plural(reinforced, 'earlier mistake')} right this time.` : ''}</p></div>
          <div class="card"><div class="card-head"><h2>How your levels moved</h2></div>
            ${rows ? `<div class="table-wrap"><table><thead><tr><th>Domain</th><th class="num">Correct</th><th class="num">Level</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No answers recorded.</p>'}</div>
        </div>
        <div class="card"><div class="card-head"><h2>Questions you missed</h2><span class="muted">${missed.length}</span></div>
          ${missed.length ? missed.map((i, n) => `<details class="review"><summary><span class="dot bad"></span>${n + 1}. ${esc(i.k || i.d)}</summary>${questionHTML(getQ(i.id), { resp: i.resp, revealed: true })}</details>`).join('') : '<div class="empty"><p>None. Clean sweep.</p></div>'}
        </div>`;
    }

    el.addEventListener('click', e => {
      const o = e.target.closest('[data-opt]');
      if (o) { opts[o.dataset.opt] = o.dataset.opt === 'length' ? Number(o.dataset.v) : o.dataset.v; return drawSetup(); }
      const lv = e.target.closest('[data-level]');
      if (lv) { state.profile.level = lv.dataset.level; save(); return drawSetup(); }
      if (cur && choiceClick(e, st, el)) return;
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'begin') begin(opts.section, opts.length);
      if (act === 'review') begin('review', Math.min(20, dueMistakes().length));
      if (act === 'check') check();
      if (act === 'next') advance();
      if (act === 'retry') { pending = null; advance(); }
      if (act === 'bank-now') useBankNow();
      if (act === 'report') report();
      if (act === 'end') finish();
      if (act === 'again') { summary = null; drawSetup(); }
      if (act === 'flag' && cur) {
        const id = cur.q.id;
        state.review = state.review.includes(id) ? state.review.filter(x => x !== id) : [...state.review, id];
        save();
        drawRunning();
      }
    });

    const unkey = keys({
      choose: k => chooseKey(cur?.q, st, el, k),
      enter: () => { if (!s || !cur) return; st.revealed ? advance() : check(); }
    });
    const onAI = () => { if (!s && !summary) drawSetup(); };
    ai.listeners.add(onAI);

    if (s) advance();
    else if (params.get('start') === 'final') begin('final', Math.min(40, Number(params.get('n')) || 20));
    else if (params.get('start') === 'review' && dueMistakes().length) begin('review', Math.min(20, dueMistakes().length));
    else draw();
    return () => { unkey(); ai.listeners.delete(onAI); ctls.forEach(c => c.abort()); };
  }

  function practice(el, params) {
    const direct = getQ(params.get('q'));   // a specific question to retry
    const f = {
      source: aiUsable() && !params.get('mode') && !direct ? 'ai' : 'bank',
      section: params.get('section') || 'all',
      domain: params.get('domain') || 'all',
      skill: params.get('skill') || 'all',
      pattern: PATTERN[params.get('pattern')] ? params.get('pattern') : 'all',
      desmos: params.get('desmos') === 'yes' ? 'yes' : 'all',
      difficulty: params.get('difficulty') || 'all',
      mode: params.get('mode') || 'all'
    };
    if (f.pattern !== 'all') Object.assign(f, { domain: PATTERN[f.pattern].domain, skill: PATTERN[f.pattern].skill });
    if (f.desmos === 'yes') f.section = 'math';
    if (f.domain !== 'all') f.section = SECTION_OF[f.domain];
    const patternOk = p => (f.skill === 'all' || p.skill === f.skill) && (f.pattern === 'all' || p.id === f.pattern) && (f.desmos === 'all' || !!p.desmos);

    const seen = new Set();
    const session = { n: 0, ok: 0 };
    let pool = [], cur = null, st = null, undo = null;
    let pending = null, ctl = null, note = '';

    function buildPool() {
      const last = lastResults();
      const base = f.mode === 'missed' || f.mode === 'flagged' ? BANK.concat(Object.values(state.generated)) : BANK;
      pool = base.filter(q =>
        (f.section === 'all' || q.section === f.section) &&
        (f.domain === 'all' || q.domain === f.domain) &&
        (f.skill === 'all' || q.skill === f.skill) &&
        (f.pattern === 'all' && f.desmos === 'all' || (PATTERN[patternOf(q)] && patternOk(PATTERN[patternOf(q)]))) &&
        (f.difficulty === 'all' || q.difficulty === f.difficulty) &&
        (f.mode === 'all' ||
          (f.mode === 'new' && !(q.id in last)) ||
          (f.mode === 'missed' && last[q.id] === false) ||
          (f.mode === 'flagged' && state.review.includes(q.id))));
    }

    function aiTarget() {
      const ab = abilities();
      const domains = f.domain !== 'all' ? [f.domain] : f.section === 'all' ? ALL_DOMAINS : DOMAINS[f.section];
      const p = pickPattern(domains, patternOk, ab) || pickPattern(domains, () => true, ab) || PATTERNS[0];
      return { domain: p.domain, skill: p.skill, pattern: p.id, difficulty: f.difficulty !== 'all' ? f.difficulty : pickLevel(ab[p.domain] + stretch()) };
    }

    // Writes the next question in the background while the current one is on screen.
    function requestAI() {
      ctl?.abort();
      ctl = new AbortController();
      const t = aiTarget();
      const p = generate(t, ctl.signal).catch(e => {
        if (e?.code === 'cancelled') throw e;
        note = aiFailed(e?.code);
        return bankPick(t, seen);
      });
      p.catch(() => {});   // a cancelled request nobody waits for is not an error
      pending = p;
      return p;
    }

    async function pick() {
      st = { resp: null, revealed: false, elim: [] };
      undo = null;
      if (f.source === 'ai' && aiUsable()) {
        const p = pending || requestAI();
        cur = null;
        draw();
        let q;
        try { q = await p; } catch { return; }
        if (p !== pending) return;
        pending = null;
        cur = q;
        if (q) seen.add(q.id);
        draw();
        if (q) requestAI();
        return;
      }
      const fresh = pool.filter(q => !seen.has(q.id));
      const from = fresh.length ? fresh : pool;
      cur = from.length ? from[Math.floor(Math.random() * from.length)] : null;
      if (cur) seen.add(cur.id);
      draw();
    }

    function reset() {
      ctl?.abort();
      pending = null;
      buildPool();
      pick();
    }

    function draw() {
      const domains = f.section === 'all' ? ALL_DOMAINS : DOMAINS[f.section];
      const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`;
      const useAI = f.source === 'ai' && aiUsable();
      let body;
      if (cur) {
        body = `
          ${questionHTML(cur, st, { num: session.n + (st.revealed ? 0 : 1), flag: state.review.includes(cur.id) })}
          <div class="q-actions">
            ${st.revealed ? '<button class="btn primary" data-act="next">Next question</button>' : '<button class="btn primary" data-act="check">Check answer</button><button class="btn" data-act="next">Skip</button>'}
            <span class="spacer"></span>
            ${cur.section === 'math' ? desmosLink : ''}
            ${st.revealed && cur.source === 'ai' && undo ? '<button class="btn ghost" data-act="report">Report a problem</button>' : ''}
          </div>`;
      } else if (useAI && pending) {
        body = loadingHTML('Claude is writing a question for you…');
      } else {
        body = '<div class="empty"><p>No questions match these filters.</p><button class="btn" data-act="clear">Clear filters</button></div>';
      }
      el.innerHTML = `
        <div class="page-head">
          <div><h1>Practice</h1><p>${aiUsable() ? 'Pick a skill and drill it. Claude writes new questions as fast as you answer them.' : `${BANK.length} questions across all 8 SAT domains, with instant explanations.`}</p></div>
          <div class="muted">${session.n ? `This session: ${session.ok}/${session.n} correct` : ''}</div>
        </div>
        <div class="filters">
          ${ai.state === 'ready' ? `<select class="input" data-f="source" aria-label="Question source">${opt('ai', 'New questions by Claude', f.source)}${opt('bank', 'Built-in bank', f.source)}</select>` : ''}
          <select class="input" data-f="section" aria-label="Section">${opt('all', 'All sections', f.section)}${opt('rw', SECTIONS.rw, f.section)}${opt('math', SECTIONS.math, f.section)}</select>
          <select class="input" data-f="domain" aria-label="Domain">${opt('all', 'All domains', f.domain)}${domains.map(d => opt(d, d, f.domain)).join('')}</select>
          ${f.domain !== 'all' ? `<select class="input" data-f="skill" aria-label="Skill">${opt('all', 'All skills', f.skill)}${SKILLS[f.domain].map(k => opt(k, k, f.skill)).join('')}</select>` : ''}
          ${f.skill !== 'all' && PATTERNS.filter(x => x.skill === f.skill).length > 1 ? `<select class="input" data-f="pattern" aria-label="Pattern">${opt('all', 'All patterns', f.pattern)}${PATTERNS.filter(x => x.skill === f.skill).map(x => opt(x.id, x.label.replace(' (est.)', ''), f.pattern)).join('')}</select>` : ''}
          ${f.section !== 'rw' ? `<select class="input" data-f="desmos" aria-label="Desmos">${opt('all', 'Any math question', f.desmos)}${opt('yes', 'Desmos-friendly only', f.desmos)}</select>` : ''}
          <select class="input" data-f="difficulty" aria-label="Difficulty">${opt('all', useAI ? (module2() ? 'Module 2 level' : 'Match my level') : 'Any difficulty', f.difficulty)}${opt('easy', 'Easy', f.difficulty)}${opt('medium', 'Medium', f.difficulty)}${opt('hard', 'Hard', f.difficulty)}</select>
          ${useAI ? '' : `<select class="input" data-f="mode" aria-label="Which questions">${opt('all', 'All questions', f.mode)}${opt('new', 'Not yet answered', f.mode)}${opt('missed', 'Last answer wrong', f.mode)}${opt('flagged', 'Flagged for review', f.mode)}</select>`}
        </div>
        ${note ? `<div class="notice">${esc(note)}</div>` : ''}
        <div class="card q-card">${body}</div>`;
    }

    el.addEventListener('change', e => {
      const k = e.target.dataset.f;
      if (!k) return;
      f[k] = e.target.value;
      if (k === 'section') { f.domain = 'all'; f.skill = 'all'; f.pattern = 'all'; if (f.section === 'rw') f.desmos = 'all'; }
      if (k === 'domain') { f.skill = 'all'; f.pattern = 'all'; }
      if (k === 'skill') f.pattern = 'all';
      if (k === 'desmos' && f.desmos === 'yes' && f.section === 'all') f.section = 'math';
      note = '';
      reset();
    });

    el.addEventListener('click', e => {
      if (cur && choiceClick(e, st, el)) return;
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'check') check();
      if (act === 'next') { note = ''; pick(); }
      if (act === 'flag' && cur) {
        state.review = state.review.includes(cur.id) ? state.review.filter(id => id !== cur.id) : [...state.review, cur.id];
        save(); draw();
      }
      if (act === 'report' && undo) {
        undoRecord(cur.id, undo);
        undo = null;
        session.n--;
        if (isCorrect(cur, st.resp)) session.ok--;
        note = 'Thanks. This question won\'t count toward your stats.';
        draw();
      }
      if (act === 'clear') { Object.assign(f, { section: 'all', domain: 'all', skill: 'all', pattern: 'all', desmos: 'all', difficulty: 'all', mode: 'all' }); reset(); }
    });

    function check() {
      if (!cur || st.revealed) return;
      if (cur.type === 'spr') st.resp = $('[data-spr]', el).value.trim();
      if (!answered(st.resp)) return;
      st.revealed = true;
      const ok = isCorrect(cur, st.resp);
      undo = record(cur, ok, 'practice');
      session.n++;
      if (ok) session.ok++;
      draw();
    }

    const unkey = keys({
      choose: k => chooseKey(cur, st, el, k),
      enter: () => { if (!cur) return; st.revealed ? (note = '', pick()) : check(); }
    });
    const onAI = () => {
      if (ai.state === 'ready' && f.source === 'bank' && !session.n && !direct && !f.mode.match(/missed|flagged/) && !(st && answered(st.resp))) {
        f.source = 'ai';
        return reset();
      }
      draw();
    };
    ai.listeners.add(onAI);

    buildPool();
    if (direct) { cur = direct; st = { resp: null, revealed: false, elim: [] }; seen.add(direct.id); draw(); } else pick();
    return () => { unkey(); ai.listeners.delete(onAI); ctl?.abort(); };
  }

  function exams(el) {
    let phase = 'setup';
    let opts = { section: 'full', size: 'mini' };
    let ex = null, timer = null;

    const countFor = (s, size) => Math.min(size === 'mini' ? 10 : MODULE_SIZE[s], BANK.filter(q => q.section === s).length);
    const plan = (section, size) => {
      const secs = section === 'full' ? ['rw', 'math'] : [section];
      let n = 0, sec = 0;
      for (const s of secs) {
        const count = countFor(s, size);
        n += count;
        sec += count * SEC_PER_Q[s];
      }
      return { n, sec };
    };

    function start() {
      const secs = opts.section === 'full' ? ['rw', 'math'] : [opts.section];
      const order = { easy: 0, medium: 1, hard: 2 };
      let qs = [];
      for (const s of secs) {
        const pool = shuffle(BANK.filter(q => q.section === s)).slice(0, countFor(s, opts.size));
        qs = qs.concat(pool.sort((a, b) => order[a.difficulty] - order[b.difficulty]));
      }
      ex = { qs, st: qs.map(() => ({ resp: null, revealed: false, elim: [] })), flags: new Set(), i: 0, started: Date.now(), limit: plan(opts.section, opts.size).sec, confirm: 0 };
      phase = 'running';
      timer = setInterval(tick, 1000);
      draw();
    }

    function tick() {
      const left = ex.limit - Math.floor((Date.now() - ex.started) / 1000);
      const t = $('#timer', el);
      if (t) { t.textContent = fmtTime(left); t.classList.toggle('low', left < 120); }
      if (left <= 0) finish();
    }

    function finish() {
      clearInterval(timer);
      ex.elapsed = Math.min(ex.limit, Math.round((Date.now() - ex.started) / 1000));
      const per = {};
      ex.qs.forEach((q, i) => {
        const r = ex.st[i].resp;
        const ok = answered(r) && isCorrect(q, r);
        record(q, ok, 'exam');
        const s = per[q.section] ||= { n: 0, ok: 0, w: 0, wok: 0 };
        s.n++; s.w += WEIGHT[q.difficulty];
        if (ok) { s.ok++; s.wok += WEIGHT[q.difficulty]; }
      });
      ex.per = per;
      ex.score = Object.values(per).reduce((t, s) => t + Math.round((200 + 600 * s.wok / s.w) / 10) * 10, 0);
      const correct = Object.values(per).reduce((t, s) => t + s.ok, 0);
      state.exams.push({ t: Date.now(), section: opts.section, size: opts.size, correct, total: ex.qs.length, score: ex.score, elapsed: ex.elapsed });
      save();
      phase = 'results';
      draw();
    }

    function draw() {
      if (phase === 'setup') return drawSetup();
      if (phase === 'running') return drawRunning();
      drawResults();
    }

    function drawSetup() {
      const p = plan(opts.section, opts.size);
      const opt = (k, v, title, sub) => `<button class="option ${opts[k] === v ? 'active' : ''}" data-opt="${k}" data-v="${v}"><strong>${title}</strong><span>${sub}</span></button>`;
      const hist = state.exams.slice().reverse().map(x => `
        <tr><td>${fmtDate(x.t)}</td><td>${x.section === 'full' ? 'Full test' : SECTIONS[x.section]}${x.size === 'mini' ? ' (mini)' : ''}</td>
        <td class="num">${x.correct}/${x.total}</td><td class="num">${fmtTime(x.elapsed)}</td><td class="num"><strong>${x.score}</strong></td></tr>`).join('');
      el.innerHTML = `
        <div class="page-head"><div><h1>Mock exams</h1><p>Timed at real SAT pacing, with a score estimate and full review. Uses the built-in bank.</p></div></div>
        <div class="card stack">
          <h2>Section</h2>
          <div class="option-grid">
            ${opt('section', 'full', 'Full test', 'Reading & Writing, then Math')}
            ${opt('section', 'rw', SECTIONS.rw, 'Reading & Writing only')}
            ${opt('section', 'math', SECTIONS.math, 'Math only, Desmos allowed')}
          </div>
          <h2 style="margin-top:20px">Length</h2>
          <div class="option-grid">
            ${opt('size', 'mini', 'Mini', 'Up to 10 questions per section')}
            ${opt('size', 'module', 'Full module', 'Up to 27 R&W and 22 Math questions, like one real SAT module')}
          </div>
          <div class="row" style="margin-top:20px">
            <span class="muted">${p.n} questions in ${Math.round(p.sec / 60)} minutes, at real SAT pacing</span>
            <span class="spacer"></span>
            <button class="btn primary" data-act="start">Start exam</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Past exams</h2></div>
          ${hist ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Exam</th><th class="num">Correct</th><th class="num">Time</th><th class="num">Score</th></tr></thead><tbody>${hist}</tbody></table></div>` : '<div class="empty"><p>No exams yet. Your results will show up here.</p></div>'}
        </div>`;
    }

    function drawRunning() {
      const q = ex.qs[ex.i];
      const left = ex.limit - Math.floor((Date.now() - ex.started) / 1000);
      const nav = ex.qs.map((_, i) => {
        const cls = [answered(ex.st[i].resp) ? 'answered' : '', i === ex.i ? 'current' : '', ex.flags.has(i) ? 'flagged' : ''].join(' ');
        return `<button class="${cls}" data-go="${i}">${i + 1}</button>`;
      }).join('');
      el.innerHTML = `
        <div class="exam-bar">
          <strong>${SECTIONS[q.section]}</strong>
          <span class="muted">${ex.i + 1} of ${ex.qs.length}</span>
          <span class="spacer"></span>
          <span class="timer ${left < 120 ? 'low' : ''}" id="timer">${fmtTime(left)}</span>
          ${q.section === 'math' ? desmosLink.replace('class="btn"', 'class="btn sm"') : ''}
          <button class="btn sm primary" data-act="submit">Submit</button>
        </div>
        ${ex.confirm ? `<div class="card row" style="margin-bottom:16px"><span>You have ${plural(ex.confirm, 'unanswered question')}. Submit anyway?</span><span class="spacer"></span>
          <button class="btn sm" data-act="cancel-submit">Keep working</button><button class="btn sm primary" data-act="submit">Submit now</button></div>` : ''}
        <div class="card q-card">
          ${questionHTML(q, ex.st[ex.i], { num: ex.i + 1, flag: ex.flags.has(ex.i) })}
          <div class="q-actions">
            <button class="btn" data-act="prev" ${ex.i === 0 ? 'disabled' : ''}>Back</button>
            <button class="btn primary" data-act="next" ${ex.i === ex.qs.length - 1 ? 'disabled' : ''}>Next</button>
          </div>
          <div class="qnav">${nav}</div>
        </div>`;
    }

    function drawResults() {
      const rows = Object.entries(ex.per).map(([s, v]) =>
        `<div class="row" style="justify-content:space-between"><span>${SECTIONS[s]}</span><span><strong>${Math.round((200 + 600 * v.wok / v.w) / 10) * 10}</strong> <span class="muted">(${v.ok}/${v.n})</span></span></div>`).join('');
      const review = ex.qs.map((q, i) => {
        const r = ex.st[i].resp;
        const ok = answered(r) && isCorrect(q, r);
        return `<details class="review"><summary><span class="dot ${ok ? 'ok' : 'bad'}"></span>Question ${i + 1} <span class="muted small">${esc(q.skill || q.domain)}</span>${answered(r) ? '' : '<span class="chip">Unanswered</span>'}</summary>${questionHTML(q, { resp: r, revealed: true })}</details>`;
      }).join('');
      const max = Object.keys(ex.per).length * 800;
      el.innerHTML = `
        <div class="page-head"><div><h1>Exam results</h1><p>Finished in ${fmtTime(ex.elapsed)} of ${fmtTime(ex.limit)}. Questions you missed are now in your mistake memory.</p></div>
          <div class="row"><button class="btn" data-act="again">Back to exams</button></div></div>
        <div class="grid two">
          <div class="card"><div class="stat-label">Estimated score</div><div class="score-big">${ex.score}<span class="muted" style="font-size:20px"> / ${max}</span></div>
            <p class="small muted">Weighted by difficulty. This is a rough estimate from a small bank, not an official score.</p></div>
          <div class="card stack"><h2>By section</h2>${rows}</div>
        </div>
        <div class="card"><div class="card-head"><h2>Review answers</h2></div>${review}</div>`;
    }

    el.addEventListener('click', e => {
      const o = e.target.closest('[data-opt]');
      if (o) { opts[o.dataset.opt] = o.dataset.v; return drawSetup(); }
      if (phase === 'running') {
        if (choiceClick(e, ex.st[ex.i], el)) return drawRunning();
        const g = e.target.closest('[data-go]');
        if (g) { ex.i = Number(g.dataset.go); return drawRunning(); }
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'start') start();
      if (act === 'prev' && ex.i > 0) { ex.i--; drawRunning(); }
      if (act === 'next' && ex.i < ex.qs.length - 1) { ex.i++; drawRunning(); }
      if (act === 'flag' && phase === 'running') { ex.flags.has(ex.i) ? ex.flags.delete(ex.i) : ex.flags.add(ex.i); drawRunning(); }
      if (act === 'submit') {
        const blank = ex.st.filter(x => !answered(x.resp)).length;
        if (blank && !ex.confirm) { ex.confirm = blank; drawRunning(); } else finish();
      }
      if (act === 'cancel-submit') { ex.confirm = 0; drawRunning(); }
      if (act === 'again') { phase = 'setup'; ex = null; drawSetup(); }
    });

    el.addEventListener('input', e => {
      if (phase === 'running' && e.target.matches('[data-spr]')) {
        ex.st[ex.i].resp = e.target.value.trim();
        el.querySelectorAll('.qnav button')[ex.i].classList.toggle('answered', ex.st[ex.i].resp !== '');
      }
    });

    const unkey = keys({
      choose: k => { if (phase === 'running') { chooseKey(ex.qs[ex.i], ex.st[ex.i], el, k); drawRunning(); } },
      enter: () => { if (phase === 'running' && ex.i < ex.qs.length - 1) { ex.i++; drawRunning(); } }
    });

    draw();
    return () => { clearInterval(timer); unkey(); };
  }

  function review(el) {
    const now = Date.now();
    const all = Object.entries(state.mistakes);
    const due = all.filter(([, m]) => !m.mastered && m.due <= now).sort((a, b) => a[1].due - b[1].due);
    const later = all.filter(([, m]) => !m.mastered && m.due > now).sort((a, b) => a[1].due - b[1].due);
    const mastered = all.filter(([, m]) => m.mastered).sort((a, b) => b[1].last - a[1].last);
    const row = ([id, m]) => {
      const q = getQ(id);
      const step = m.mastered ? 'Mastered' : m.due <= now ? 'Due now' : `Next ${fmtWhen(m.due)}`;
      return `<tr>
        <td><strong class="small">${esc(m.k || m.d)}</strong><br><span class="muted small">${q ? esc(plain(q.passage || q.prompt).slice(0, 90)) + '…' : 'Question no longer saved'}</span></td>
        <td class="num small">${m.misses} ${m.misses === 1 ? 'miss' : 'misses'}</td>
        <td class="num small">${step}${m.mastered ? '' : `<br><span class="muted">${Math.min(m.stage, REVIEW_DAYS.length + 1)}/${REVIEW_DAYS.length + 1} steps</span>`}</td>
        <td class="num">${q ? `<a class="btn sm" href="#/practice?q=${encodeURIComponent(id)}">Retry</a>` : ''}</td>
      </tr>`;
    };
    const table = list => `<div class="table-wrap"><table><tbody>${list.map(row).join('')}</tbody></table></div>`;
    el.innerHTML = `
      <div class="page-head"><div><h1>Mistakes</h1><p>Every question you miss is remembered here. Study sessions bring back a similar question two questions later, then after 1, 3 and 7 days. Get it right each time and the concept is mastered.</p></div>
        ${due.length ? '<a class="btn primary" href="#/adaptive?start=review">Review due mistakes</a>' : ''}</div>
      <div class="grid stats">
        <div class="card"><div class="stat-label">Due now</div><div class="stat-value">${due.length}</div><div class="stat-sub">Mixed into your next study session</div></div>
        <div class="card"><div class="stat-label">Scheduled</div><div class="stat-value">${later.length}</div><div class="stat-sub">Coming back on a spaced schedule</div></div>
        <div class="card"><div class="stat-label">Mastered</div><div class="stat-value">${mastered.length}</div><div class="stat-sub">Right at every review step</div></div>
      </div>
      ${all.length ? '' : '<div class="card empty"><p>No mistakes yet. Questions you miss anywhere in SatStat will show up here.</p><a class="btn primary" href="#/adaptive">Start studying</a></div>'}
      ${due.length ? `<div class="card"><div class="card-head"><h2>Due now</h2></div>${table(due)}</div>` : ''}
      ${later.length ? `<div class="card"><div class="card-head"><h2>Scheduled</h2></div>${table(later)}</div>` : ''}
      ${mastered.length ? `<div class="card"><div class="card-head"><h2>Mastered</h2></div>${table(mastered.slice(0, 30))}</div>` : ''}`;
  }

  // The last two days before the test, then test morning: a checklist built from the most
  // common question patterns and the domains that need the most work.
  function testday(el) {
    const p = state.profile;
    const days = daysUntilTest();
    const due = dueMistakes().length;
    const ab = abilities();
    const focus = ALL_DOMAINS.slice().sort((a, b) => need(b, ab) - need(a, ab)).slice(0, 3);
    const doneKey = 'testday:' + (p.testDate || 'none');
    const done = new Set(state.tasksDone[doneKey] || []);
    const practiceLink = d => `#/practice?domain=${encodeURIComponent(d)}`;

    const stages = [
      { when: 2, title: 'Two days before', items: [
        { id: 'final25', title: 'Final review: 25 questions', sub: `The question patterns that come up most on recent tests, weighted toward ${focus.join(', ')}${module2() ? ', at module 2 level' : ''}.`, href: '#/adaptive?start=final&n=25', go: 'Start' },
        { id: 'mistakes', title: 'Go through your mistakes', sub: due ? `${plural(due, 'mistake')} due. Read each explanation, then retry it.` : 'Read the explanation for each one, then retry it.', href: due ? '#/adaptive?start=review' : '#/review', go: 'Open' },
        ...focus.map((d, i) => ({ id: 'drill' + i, title: `Drill ${d}: 10 questions`, sub: i === 0 ? 'Your biggest gap to your target score.' : 'One of your three weakest areas.', href: practiceLink(d), go: 'Drill' })),
        { id: 'desmos', title: 'Desmos drill: 10 questions', sub: 'Math questions where Desmos is fastest. After each one you see the exact keystrokes.', href: '#/practice?desmos=yes', go: 'Drill' },
        { id: 'pace', title: 'Time one module', sub: 'Mock exams, Full module: get a feel for about 71 seconds per Reading and Writing question and 95 per Math question.', href: '#/exams', go: 'Open' },
        { id: 'bluebook', title: 'Finish exam setup in Bluebook', sub: 'Update Bluebook on the device you will test on and complete exam setup, which gives you your admission ticket.', href: 'https://bluebook.collegeboard.org', go: 'Bluebook', external: true }
      ] },
      { when: 1, title: 'The day before', items: [
        { id: 'final15', title: 'Light review: 15 questions', sub: `Mostly the patterns that repeat most: transitions, words in context, linear and exponential functions${module2() ? ', at module 2 level' : ''}. Nothing new.`, href: '#/adaptive?start=final&n=15', go: 'Start' },
        { id: 'rules', title: 'Read the rules sheet below and skim Strategies', sub: 'About 15 minutes. The rules decide most Standard English Conventions and Advanced Math questions; Strategies has every Desmos trick and pattern shortcut.', href: '#/tricks', go: 'Strategies' },
        { id: 'pack', title: 'Pack tonight', sub: 'Admission ticket, photo ID, your device fully charged and its charger, pencils or pens for scratch work, water and a snack for the break.' },
        { id: 'sleep', title: 'Stop by early evening and sleep 8 or more hours', sub: 'A rested brain is worth more than one more practice set.' }
      ] },
      { when: 0, title: 'Test morning', items: [
        { id: 'warm', title: 'Breakfast, then a 5-question warm-up', sub: 'Easy questions only, just to switch on.', href: '#/practice?difficulty=easy', go: 'Warm up' },
        { id: 'arrive', title: 'Arrive by 7:45 a.m.', sub: 'Your admission ticket has your test center address and any instructions from your center.' }
      ] }
    ];

    const stageHTML = st => {
      const isToday = days === st.when || (st.when === 2 && days > 2);
      return `<section class="card stage ${isToday ? 'now' : ''} ${days != null && days < st.when ? 'past' : ''}">
        <div class="card-head"><h2>${st.title}</h2>${isToday ? `<span class="chip today-chip">${days > 2 ? `Start now: ${plural(days, 'day')} left` : 'Today'}</span>` : ''}</div>
        ${st.items.map(t => `<label class="task ${done.has(t.id) ? 'done' : ''}">
          <input type="checkbox" data-task="${t.id}" ${done.has(t.id) ? 'checked' : ''}>
          <div style="flex:1"><div class="task-title">${esc(t.title)}</div><div class="small muted">${esc(t.sub)}</div></div>
          ${t.href ? `<a class="btn sm" href="${t.href}"${t.external ? ' target="_blank" rel="noopener"' : ''}>${t.go}</a>` : ''}
        </label>`).join('')}
      </section>`;
    };

    const top = sec => PATTERNS.filter(x => SECTION_OF[x.domain] === sec)
      .sort((a, b) => b.share * (1 + (b.repeat ?? 0.28)) - a.share * (1 + (a.repeat ?? 0.28))).slice(0, 5);
    const nov7 = new Date('2026-11-07T00:00') >= new Date(dayKey() + 'T00:00');
    const when = days == null ? 'Set your test date to get your plan.'
      : days > 0 ? `Your SAT is in ${plural(days, 'day')}.` : days === 0 ? 'Your SAT is today.' : 'Your test date has passed.';

    el.innerHTML = `
      <div class="page-head"><div><h1>Test day plan</h1><p>${when} ${p.report ? '' : '<a href="#/settings">Add your PSAT score report</a> so the plan targets your weakest areas.'}</p></div>
        <div class="row">
          ${nov7 ? '<button class="btn" data-date="2026-11-07">My SAT is Nov 7</button>' : ''}
          <button class="btn" data-date="2026-12-05">My SAT is Dec 5</button>
          <input class="input" type="date" id="td-date" value="${esc(p.testDate)}" aria-label="Test date">
        </div></div>
      <div class="focus-band card"><strong>Your focus:</strong> ${focus.map(d => `<a href="${practiceLink(d)}">${esc(d)}</a>`).join(', ')}.
        <span class="muted">${p.report ? 'From your score report and your answers since.' : 'From your answers so far.'}</span></div>
      <div class="stages">${stages.map(stageHTML).join('')}</div>

      <div class="grid two">
        <section class="card">
          <div class="card-head"><h2>During the test</h2></div>
          <ul class="tips">
            <li><strong>Answer every question.</strong> Wrong answers cost nothing, so never leave one blank.</li>
            <li><strong>Bank module 1, win module 2.</strong> A strong first module sends you to the harder second module, which top scores need, so don't rush module 1 into careless mistakes. If module 2 feels harder, that is a good sign: it means you got there.</li>
            <li><strong>Keep moving.</strong> Mark for review and move on after about 1.5 minutes in Reading and Writing or 2.5 in Math, then come back.</li>
            <li><strong>Use Desmos.</strong> Graph both sides of an equation, find intersections of a system, read a vertex.</li>
            <li><strong>Reading and Writing:</strong> read the question first, then predict the answer from the passage before looking at the choices.</li>
            <li><strong>Use the 10-minute break</strong> to eat, drink and reset before Math.</li>
          </ul>
        </section>
        <section class="card">
          <div class="card-head"><h2>Pacing</h2></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Section</th><th class="num">Per module</th><th class="num">Time</th><th class="num">Per question</th></tr></thead>
            <tbody>
              <tr><td>Reading and Writing, 2 modules</td><td class="num">27</td><td class="num">32 min</td><td class="num">71 s</td></tr>
              <tr><td>Math, 2 modules</td><td class="num">22</td><td class="num">35 min</td><td class="num">95 s</td></tr>
            </tbody>
          </table></div>
          <p class="small muted">A 10-minute break comes between the two sections.</p>
        </section>
      </div>

      <div class="grid two" id="rules">
        <section class="card rules">
          <div class="card-head"><h2>Reading and Writing rules</h2></div>
          <ul class="tips">
            <li><strong>Transitions:</strong> name the relationship first. Contrast: However, Nevertheless, In contrast. Cause: Therefore, As a result, Consequently. Example: For example, For instance. Addition: Moreover, Additionally. Similarity: Similarly, Likewise.</li>
            <li><strong>Two complete sentences</strong> need a period or a semicolon; a comma alone is a comma splice. Between them, write <em>; however,</em>.</li>
            <li><strong>Colons</strong> come only after a complete sentence.</li>
            <li><strong>Extra information</strong> takes a matching pair: two commas or two dashes, never one of each.</li>
            <li><strong>No comma</strong> between a subject and its verb, or in "author Toni Morrison".</li>
            <li><strong>Agreement:</strong> find the real subject (skip the "of …" phrase). <em>Its</em> is singular, <em>their</em> is plural. A sentence needs a main verb; an <em>-ing</em> word alone is not one.</li>
            <li><strong>Opening phrases</strong> describe the noun that comes right after the comma.</li>
            <li><strong>Words in context:</strong> find the clue in the passage and predict a word before reading the choices.</li>
            <li><strong>Notes questions:</strong> read the goal first, then pick the choice that does that goal, not the one with the most facts.</li>
          </ul>
        </section>
        <section class="card rules">
          <div class="card-head"><h2>Math rules</h2></div>
          <ul class="tips">
            <li>${rich('Slope \\(m = \\frac{y_2 - y_1}{x_2 - x_1}\\). In \\(y = mx + b\\), \\(b\\) is the starting value and \\(m\\) the change per unit. Parallel lines share a slope; perpendicular slopes multiply to \\(-1\\).')}</li>
            <li>${rich('\\(ax + b = cx + d\\) has no solution when \\(a = c\\) and \\(b \\neq d\\), and infinitely many when \\(a = c\\) and \\(b = d\\).')}</li>
            <li>${rich('Exponential: growth \\(y = a(1 + r)^t\\), decay \\(y = a(1 - r)^t\\). Linear adds a fixed amount; exponential multiplies by a fixed factor.')}</li>
            <li>${rich('Vertex form \\(y = a(x - h)^2 + k\\) has vertex \\((h, k)\\). Axis of symmetry \\(x = -\\frac{b}{2a}\\).')}</li>
            <li>${rich('Discriminant \\(b^2 - 4ac\\): positive gives 2 real solutions, zero gives 1, negative gives none. Sum of roots \\(-\\frac{b}{a}\\), product \\(\\frac{c}{a}\\).')}</li>
            <li>${rich('Radical equations: square both sides, then check every answer in the original equation.')}</li>
            <li>${rich('Percent change \\(= \\frac{\\text{new} - \\text{original}}{\\text{original}}\\). Undo a 20% increase by dividing by 1.2.')}</li>
            <li>${rich('30-60-90 sides \\(x, x\\sqrt{3}, 2x\\); 45-45-90 sides \\(s, s, s\\sqrt{2}\\); \\(\\sin x^\\circ = \\cos(90 - x)^\\circ\\).')}</li>
            <li>${rich('Circle: \\((x - h)^2 + (y - k)^2 = r^2\\). Scaling lengths by \\(k\\) scales area by \\(k^2\\) and volume by \\(k^3\\).')}</li>
          </ul>
        </section>
      </div>

      <section class="card due-card desmos-cta">
        <span><strong>Desmos tricks and pattern shortcuts.</strong> ${DESMOS_TRICKS.length} Desmos moves with worked examples, plus the shortcut and trap for all ${PATTERNS.length} question patterns.</span>
        <a class="btn primary" href="#/tricks">Open Strategies</a>
      </section>

      <section class="card">
        <div class="card-head"><h2>What comes up most</h2><span class="small muted">From The Test Advantage's analysis of 2024–2026 question banks</span></div>
        <div class="grid two">
          ${['rw', 'math'].map(sec => `<div><h3 style="margin-bottom:8px">${SECTIONS[sec]}</h3><div class="table-wrap"><table><tbody>${top(sec).map(x => `<tr><td>${esc(x.label.replace(' (est.)', ''))}</td><td class="num">${x.share}%</td><td class="num small muted">${x.repeat ? `repeats ${Math.round(x.repeat * 100)}%` : ''}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}
        </div>
        <p class="small"><strong>Repeat most often on recent tests:</strong> ${PATTERNS.filter(x => x.repeat).sort((a, b) => b.repeat - a.repeat).map(x => `${esc(x.label.replace('Transition: ', 'Transitions: '))} (${Math.round(x.repeat * 100)}%)`).join(', ')}, against 28% for English questions overall.</p>
        <p class="small muted">Share is the percent of that section's questions. Exact repeats are uncommon, and most change the numbers, so learning each pattern's rule matters more than memorizing questions.</p>
      </section>`;

    el.addEventListener('change', e => {
      const id = e.target.dataset.task;
      if (id) {
        const set = new Set(state.tasksDone[doneKey] || []);
        e.target.checked ? set.add(id) : set.delete(id);
        state.tasksDone[doneKey] = [...set];
        save();
        e.target.closest('.task').classList.toggle('done', e.target.checked);
      }
      if (e.target.id === 'td-date' && e.target.value) { p.testDate = e.target.value; save(); render(); }
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-date]');
      if (b) { p.testDate = b.dataset.date; save(); render(); }
    });
  }

  // Desmos tricks and every question pattern's shortcut and trap, each with a drill.
  function tricks(el) {
    const drill = p => `<a class="btn sm" href="#/practice?pattern=${p}">Drill</a>`;
    const typeBox = t => `<span class="typed"><code class="dz">${esc(t)}</code><button class="copy" type="button" data-copy="${esc(t)}" aria-label="Copy ${esc(t)}">Copy</button></span>`;
    const card = t => `<article class="card trick-card" id="dz-${t.id}">
        <h3>${esc(t.title)}</h3>
        <p class="small muted">Cracks: ${t.when.map(id => `<a href="#/practice?pattern=${id}">${esc(PATTERN[id].label.replace(' (est.)', ''))}</a>`).join(', ')}</p>
        <p>${esc(t.steps)}</p>
        <div class="worked">
          <div class="small muted">Example</div>
          <div class="worked-q">${rich(t.example.q)}</div>
          <div class="row">Type ${typeBox(t.example.type)}${t.example.type2 ? ` and ${typeBox(t.example.type2)}` : ''}</div>
          <div class="worked-a">${rich(t.example.result)}</div>
        </div>
        <div class="q-actions"><a class="btn sm primary" href="#/practice?pattern=${t.when[0]}">Drill ${esc(PATTERN[t.when[0]].label.replace(' (est.)', '').toLowerCase())}</a></div>
      </article>`;
    const patternRow = x => `<li class="pattern">
        <div class="pattern-head"><strong>${esc(x.label.replace(' (est.)', ''))}</strong>
          <span class="small muted">${x.share}% of the section${x.repeat ? `, repeats ${Math.round(x.repeat * 100)}%` : ''}${x.hard ? `, ${Math.round(x.hard * 100)}% hard` : ''}</span>
          <span class="spacer"></span>${drill(x.id)}</div>
        ${x.tip ? `<p><strong>Shortcut:</strong> ${codeText(x.tip)}</p>` : ''}
        ${x.desmos ? `<p><strong>Desmos:</strong> ${codeText(x.desmos)}</p>` : ''}
        ${x.trap ? `<p><strong>Trap:</strong> ${codeText(x.trap)}</p>` : ''}
      </li>`;
    const group = sec => DOMAINS[sec].map(d => `<section class="card">
        <div class="card-head"><h3>${esc(d)}</h3><a class="small" href="#/practice?domain=${encodeURIComponent(d)}">Practice all</a></div>
        <ul class="patterns">${PATTERNS.filter(x => x.domain === d).sort((a, b) => b.share * (1 + (b.repeat ?? 0.28)) - a.share * (1 + (a.repeat ?? 0.28))).map(patternRow).join('')}</ul>
      </section>`).join('');

    el.innerHTML = `
      <div class="page-head"><div><h1>Strategies</h1><p>Desmos moves that turn hard math into a few keystrokes, and the shortcut and trap for every question pattern on the test. Every one has a drill.</p></div>
        <div class="row"><a class="btn" href="#" data-jump="desmos">Desmos</a><a class="btn" href="#" data-jump="math">Math patterns</a><a class="btn" href="#" data-jump="rw">Reading and Writing</a></div></div>

      <section class="card due-card desmos-cta">
        <span><strong>Desmos drill.</strong> Math questions where Desmos is the fastest route. After each one you see the exact keystrokes.</span>
        <a class="btn primary" href="#/practice?desmos=yes">Start Desmos drill</a>
      </section>

      <h2 class="section-title" id="desmos">Desmos tricks</h2>
      <p class="muted section-sub">Bluebook has Desmos built in for the whole Math section. Copy any input below and paste it into Desmos to try it.</p>
      <div class="trick-grid">${DESMOS_TRICKS.map(card).join('')}</div>

      <h2 class="section-title" id="math">Math patterns</h2>
      <p class="muted section-sub">Sorted by how often each comes up. Exact repeats are rare in math, so the rule is what carries over.</p>
      <div class="grid two">${group('math')}</div>

      <h2 class="section-title" id="rw">Reading and Writing patterns</h2>
      <p class="muted section-sub">Transitions and words in context repeat most often across test dates, well above the 28% average for English questions.</p>
      <div class="grid two">${group('rw')}</div>`;

    el.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]');
      if (!j) return;
      e.preventDefault();
      document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  function vocab(el) {
    let filter = 'unknown';
    let deck = [], i = 0, flipped = false;

    function build() {
      deck = shuffle(V.filter(([w]) => {
        const s = state.vocab[w];
        return filter === 'all' || (filter === 'unknown' ? s !== 'known' : s === filter);
      }));
      i = 0;
      flipped = false;
    }

    function draw() {
      const known = V.filter(([w]) => state.vocab[w] === 'known').length;
      const learning = V.filter(([w]) => state.vocab[w] === 'learning').length;
      const card = deck[i];
      const tab = (v, label) => `<button class="btn sm ${filter === v ? 'active' : ''}" data-filter="${v}">${label}</button>`;
      el.innerHTML = `
        <div class="page-head"><div><h1>Vocab</h1><p>${V.length} words that show up in SAT Words in Context questions. Flip a card, then sort it.</p></div></div>
        <div class="grid stats">
          <div class="card"><div class="stat-label">Mastered</div><div class="stat-value">${known} <span class="muted" style="font-size:18px">/ ${V.length}</span></div><div class="bar ok"><span style="width:${pct(known, V.length)}%"></span></div></div>
          <div class="card"><div class="stat-label">Still learning</div><div class="stat-value">${learning}</div><div class="stat-sub">Cards you've marked to review again</div></div>
          <div class="card"><div class="stat-label">New</div><div class="stat-value">${V.length - known - learning}</div><div class="stat-sub">Cards you haven't sorted yet</div></div>
        </div>
        <div class="row" style="margin-bottom:14px">${tab('unknown', 'To study')}${tab('learning', 'Learning')}${tab('known', 'Mastered')}${tab('all', 'All')}
          <span class="spacer"></span><span class="muted small">${deck.length ? `Card ${i + 1} of ${deck.length}` : ''}</span></div>
        ${card ? `
          <button class="flashcard" data-act="flip">
            <div class="word">${esc(card[0])}</div>
            <div class="pos">${esc(card[1])}</div>
            ${flipped ? `<div class="def">${esc(card[2])}</div><div class="ex">“${esc(card[3])}”</div>` : '<div class="hint">Tap to see the definition</div>'}
          </button>
          <div class="q-actions" style="justify-content:center">
            <button class="btn" data-act="learning">Still learning</button>
            <button class="btn primary" data-act="known">I know it</button>
          </div>` : `
          <div class="card empty"><p>${filter === 'unknown' ? 'You\'ve mastered every word. Nice work.' : 'No cards here yet.'}</p><button class="btn" data-filter="all">Show all cards</button></div>`}`;
    }

    el.addEventListener('click', e => {
      const fb = e.target.closest('[data-filter]');
      if (fb) { filter = fb.dataset.filter; build(); return draw(); }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'flip') { flipped = !flipped; return draw(); }
      if ((act === 'learning' || act === 'known') && deck[i]) {
        state.vocab[deck[i][0]] = act;
        save();
        i = (i + 1) % deck.length;
        if (i === 0) build(); else flipped = false;
        draw();
      }
    });

    build();
    draw();
  }

  function diagnostics(el) {
    if (!state.attempts.length) {
      el.innerHTML = `<div class="page-head"><div><h1>Diagnostics</h1><p>See exactly where you lose points.</p></div></div>
        <div class="card empty"><p>Answer a few questions and your breakdown will appear here.</p><a class="btn primary" href="#/adaptive">Start studying</a></div>`;
      return;
    }
    const ds = domainStats();
    const bar = (label, s, link) => {
      const a = pct(s.ok, s.n);
      const cls = !s.n ? '' : a >= 80 ? 'ok' : a >= 50 ? 'warn' : 'bad';
      return `<div class="focus-item"><div class="row"><span class="small"><strong>${esc(label)}</strong></span><span class="small muted">${s.n ? `<b class="num-strong">${a}%</b> ${s.ok} of ${s.n}` : 'No data'}</span></div>
        <div class="row"><div class="bar ${cls}" style="flex:1"><span style="width:${s.n ? a : 0}%"></span></div>${link ? `<a class="btn sm" href="${link}">Practice</a>` : ''}</div></div>`;
    };
    const sectionCard = sec => {
      const a = state.attempts.filter(x => meta(x)?.s === sec);
      const ok = a.filter(x => x.ok).length;
      const score = sectionScore(sec);
      return `<div class="card">
        <div class="card-head"><h2>${SECTIONS[sec]}</h2><span class="muted">${score ? `Est. ${score}` : 'Need 5+ answers for an estimate'}</span></div>
        <div class="stat-value">${pct(ok, a.length)}%</div><div class="stat-sub" style="margin-bottom:16px">${ok} of ${a.length} correct</div>
        ${DOMAINS[sec].map(d => bar(d, ds[d], `#/practice?domain=${encodeURIComponent(d)}`)).join('')}
      </div>`;
    };
    const byDiff = { easy: { n: 0, ok: 0 }, medium: { n: 0, ok: 0 }, hard: { n: 0, ok: 0 } };
    for (const x of state.attempts) {
      const m = meta(x);
      if (!m || !byDiff[m.f]) continue;
      byDiff[m.f].n++;
      if (x.ok) byDiff[m.f].ok++;
    }
    const skills = Object.entries(skillStats()).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
    const recent = state.attempts.slice(-30);
    const recentAcc = pct(recent.filter(x => x.ok).length, recent.length);

    el.innerHTML = `
      <div class="page-head"><div><h1>Diagnostics</h1><p>Accuracy by section, domain, skill and difficulty. Your last ${recent.length} answers: ${recentAcc}% correct.</p></div>
        <a class="btn" href="#/review">Mistakes</a></div>
      <div class="grid two">${sectionCard('rw')}${sectionCard('math')}</div>
      <div class="grid two" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>By skill</h2><span class="muted">Weakest first</span></div>
          ${skills.map(([k, v]) => bar(k, v)).join('')}</div>
        <div class="card"><div class="card-head"><h2>By difficulty</h2></div>
          ${['easy', 'medium', 'hard'].map(d => bar(d[0].toUpperCase() + d.slice(1), byDiff[d])).join('')}
          <p class="small muted">Scores above 1450 depend on hard questions: on the real test, doing well in the first module unlocks a harder second module.</p></div>
      </div>`;
  }

  function schedule(el) {
    const today = dayKey();
    const goal = state.profile.dailyGoal || 10;
    const weak = weakDomains();
    const days = daysUntilTest();
    const due = dueMistakes().length;
    const isSat = new Date().getDay() === 6;

    const tasks = [
      { id: 'goal', title: `Answer ${goal} questions`, sub: `${todayCount()} done so far today`, auto: todayCount() >= goal, href: '#/adaptive' },
      { id: 'focus', title: `Focus drill: ${weak[0]}`, sub: 'Your weakest area right now', href: `#/practice?domain=${encodeURIComponent(weak[0])}` }
    ];
    if (due) tasks.push({ id: 'review', title: `Review ${plural(due, 'mistake')}`, sub: 'Similar questions for what you missed before', href: '#/adaptive?start=review' });
    if (isSat) tasks.push({ id: 'exam', title: 'Take a mini mock exam', sub: 'Weekly timed check-in', href: '#/exams' });

    const done = new Set(state.tasksDone[today] || []);
    const taskHTML = tasks.map(t => {
      const checked = t.auto || done.has(t.id);
      return `<label class="task ${checked ? 'done' : ''}">
        <input type="checkbox" data-task="${t.id}" ${checked ? 'checked' : ''} ${t.auto ? 'disabled' : ''}>
        <div style="flex:1"><div class="task-title">${esc(t.title)}</div><div class="small muted">${esc(t.sub)}</div></div>
        <a class="btn sm" href="${t.href}">Go</a></label>`;
    }).join('');

    let week = '';
    for (let k = 0; k < 7; k++) {
      const d = addDays(new Date(), k);
      const dow = d.getDay();
      const what = dow === 6 ? 'Mini mock exam + review every mistake'
        : dow === 0 ? 'Light day: mistake review and flagged questions'
        : `Drill ${weak[k % weak.length]}, then a study session`;
      week += `<div class="week-day ${k === 0 ? 'today' : ''}"><div class="d">${k === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</div><div>${esc(what)}</div></div>`;
    }

    const phase = days == null ? null
      : days > 56 ? ['Foundations', 'Cover every domain and build steady habits. Untimed practice is fine.']
      : days > 21 ? ['Targeted practice', 'Spend most of your time on your two weakest domains. Take a mock every week.']
      : days >= 0 ? ['Exam simulation', 'Take timed mocks, review every mistake, and keep your pace up.']
      : null;
    const doneCount = tasks.filter(t => t.auto || done.has(t.id)).length;

    el.innerHTML = `
      <div class="page-head"><div><h1>Schedule</h1><p>${days == null ? 'Add your test date in <a href="#/settings">Settings</a> for a phased plan.' : days >= 0 ? `${plural(days, 'day')} to go.` : 'Your test date has passed. <a href="#/settings">Update it</a>.'}</p></div></div>
      ${phase ? `<div class="card phase"><strong>Phase: ${phase[0]}.</strong> <span class="muted">${phase[1]}</span></div>` : ''}
      <div class="grid two" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>Today's plan</h2><span class="muted">${doneCount}/${tasks.length} done</span></div>${taskHTML}</div>
        <div class="card"><div class="card-head"><h2>This week</h2><span class="muted">Adapts to your weak spots</span></div>${week}</div>
      </div>`;

    el.addEventListener('change', e => {
      const id = e.target.dataset.task;
      if (!id) return;
      const s = new Set(state.tasksDone[today] || []);
      e.target.checked ? s.add(id) : s.delete(id);
      state.tasksDone[today] = [...s];
      save();
      render();
    });
  }

  function settings(el) {
    const p = state.profile;
    const rep = p.report;
    el.innerHTML = `
      <div class="page-head"><div><h1>Settings</h1><p>Everything is stored in this browser. No account needed.</p></div></div>
      <form class="card" id="profile">
        <div class="card-head"><h2>Your goals</h2></div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
          <label class="field">Name<input class="input" id="f-name" name="name" value="${esc(p.name)}" placeholder="Optional"></label>
          <label class="field">Test date<input class="input" id="f-date" type="date" name="testDate" value="${esc(p.testDate)}"></label>
          <label class="field">Target score<input class="input" id="f-target" type="number" name="targetScore" min="400" max="1600" step="10" value="${esc(p.targetScore)}"></label>
          <label class="field">Daily question goal<input class="input" id="f-goal" type="number" name="dailyGoal" min="1" max="200" value="${esc(p.dailyGoal)}"></label>
        </div>
        <p class="small muted">A target of 1350 or more makes study sessions reach for harder questions sooner.</p>
        <div class="q-actions"><button class="btn primary" type="submit">Save</button><span class="muted small" id="saved"></span></div>
      </form>
      <form class="card" id="report">
        <div class="card-head"><h2>Your PSAT or SAT score report</h2></div>
        <p class="small muted" style="margin-top:0">Study starts from these levels and focuses on the areas furthest below your target score, until your own answers take over. Type each band as it appears on your report, like 610-670. Leave out anything you don't have.</p>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
          <label class="field">Total score<input class="input" id="r-total" name="total" type="number" min="400" max="1600" step="10" value="${esc(rep?.total ?? '')}" placeholder="e.g. 1380"></label>
          <label class="field">Reading and Writing score<input class="input" id="r-rw" name="rw" type="number" min="200" max="800" step="10" value="${esc(rep?.rw ?? '')}" placeholder="e.g. 640"></label>
          <label class="field">Math score<input class="input" id="r-math" name="math" type="number" min="200" max="800" step="10" value="${esc(rep?.math ?? '')}" placeholder="e.g. 680"></label>
        </div>
        <div class="grid two" style="margin-top:14px">
          ${['rw', 'math'].map(sec => `<div class="stack">${DOMAINS[sec].map(d => `<label class="field">${esc(d)}<input class="input" id="band-${ALL_DOMAINS.indexOf(d)}" name="band:${esc(d)}" value="${rep?.bands?.[d] ? rep.bands[d].join('-') : ''}" placeholder="Score band, e.g. 610-670" autocomplete="off"></label>`).join('')}</div>`).join('')}
        </div>
        <div class="q-actions"><button class="btn primary" type="submit">Save score report</button><button class="btn ghost" type="button" id="report-clear">Clear</button><span class="small" id="report-saved"></span></div>
      </form>
      <div class="card">
        <div class="card-head"><h2>Your data</h2></div>
        <p class="muted small" style="margin-top:0">${state.attempts.length} answers, ${Object.keys(state.mistakes).length} remembered mistakes, ${state.exams.length} exams, ${Object.keys(state.generated).length} saved AI questions. Export a backup to move your progress to another device.</p>
        <div class="row">
          <button class="btn" id="export">Export progress</button>
          <label class="btn">Import progress<input type="file" id="import" accept="application/json" hidden></label>
          <span class="spacer"></span>
          <button class="btn danger" id="reset">Reset everything</button>
        </div>
        <p class="small" id="data-msg" style="color:var(--bad)"></p>
      </div>`;

    $('#profile', el).addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.profile = {
        ...state.profile,
        name: fd.get('name').trim().slice(0, 40),
        testDate: fd.get('testDate'),
        targetScore: Math.min(1600, Math.max(400, Number(fd.get('targetScore')) || 1400)),
        dailyGoal: Math.min(200, Math.max(1, Number(fd.get('dailyGoal')) || 10))
      };
      save();
      $('#saved', el).textContent = 'Saved.';
    });

    const score = v => {
      const n = Number(v);
      return n >= 200 && n <= 800 ? Math.round(n / 10) * 10 : null;
    };
    $('#report', el).addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const bands = {};
      for (const d of ALL_DOMAINS) {
        const m = String(fd.get('band:' + d) || '').match(/(\d{3})(?:\s*(?:-|–|to)\s*(\d{3}))?/);
        if (!m) continue;
        const lo = score(m[1]), hi = score(m[2] || m[1]);
        if (lo && hi) bands[d] = [Math.min(lo, hi), Math.max(lo, hi)];
      }
      const rw = score(fd.get('rw')), math = score(fd.get('math'));
      const t = Number(fd.get('total'));
      const total = t >= 400 && t <= 1600 ? Math.round(t / 10) * 10 : (rw && math ? rw + math : null);
      state.profile.report = total || rw || math || Object.keys(bands).length ? { total, rw, math, bands } : null;
      save();
      const ab = abilities();
      const focus = ALL_DOMAINS.slice().sort((a, b) => need(b, ab) - need(a, ab)).slice(0, 3);
      $('#report-saved', el).textContent = state.profile.report ? `Saved. Study will focus most on ${focus.join(', ')}.` : 'Cleared.';
    });
    $('#report-clear', el).addEventListener('click', () => {
      state.profile.report = null;
      save();
      render();
    });

    $('#export', el).addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `satstat-progress-${dayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $('#import', el).addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data.attempts)) throw new Error('bad file');
        state = { ...defaults(), ...data, profile: { ...defaults().profile, ...data.profile } };
        save();
        render();
      } catch {
        $('#data-msg', el).textContent = 'That file doesn\'t look like a SatStat export.';
      }
    });

    $('#reset', el).addEventListener('click', e => {
      if (!e.target.dataset.armed) {
        e.target.dataset.armed = '1';
        e.target.textContent = 'Click again to delete all progress';
        return;
      }
      state = defaults();
      save();
      render();
    });
  }

  // ---------- Router & shell ----------

  const routes = { home, testday, tricks, adaptive, practice, review, exams, vocab, diagnostics, schedule, settings };
  const app = $('#app');
  const main = $('#main');
  let cleanup = null;
  // Kept in a variable rather than read from location.hash, so navigation still
  // works where the page runs in a frame that doesn't expose its hash.
  let route = location.hash;

  function go(href) {
    route = href;
    try { history.pushState(null, '', href); } catch { /* ignore */ }
    render();
  }

  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    const [path, qs] = route.replace(/^#\/?/, '').split('?');
    const name = routes[path] ? path : 'home';
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === name));
    const badge = $('#due-badge');
    if (badge) { const n = dueMistakes().length; badge.textContent = n; badge.hidden = !n; }
    // A fresh container per render drops the previous view's listeners.
    const view = document.createElement('div');
    main.replaceChildren(view);
    cleanup = routes[name](view, new URLSearchParams(qs || '')) || null;
    app.classList.remove('drawer');
    window.scrollTo(0, 0);
  }

  $('#menu').addEventListener('click', () => app.classList.add('drawer'));
  $('#scrim').addEventListener('click', () => app.classList.remove('drawer'));

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', () => { route = location.hash; render(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const text = b.dataset.copy;
    const done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); };
    const select = () => {
      const code = b.previousElementSibling;
      if (!code) return;
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      b.textContent = 'Selected';
    };
    try { navigator.clipboard.writeText(text).then(done, select); } catch { select(); }
  });
  render();
})();
