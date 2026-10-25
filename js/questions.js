// Original SAT-style practice questions.
// Math is LaTeX between \( \) (inline) or \[ \] (displayed on its own line), typeset with KaTeX.
// In these JS strings every backslash is doubled, e.g. '\\(x^2\\)'.
// Fields: id, section ("math" | "rw"), domain, difficulty ("easy" | "medium" | "hard"),
// skill (official College Board skill name), optional passage,
// optional table { caption, head: [..], rows: [[..]] }, prompt, and either
//   choices: [4 strings] + answer: index of the correct choice, or
//   type: "spr" + accept: [accepted answers] for student-produced responses.
window.SAT_QUESTIONS = [
  // ---------- Math: Algebra ----------
  {
    id: 'm-alg-1', section: 'math', domain: 'Algebra', difficulty: 'easy', skill: 'Linear equations in one variable',
    prompt: 'If \\(3x + 7 = 22\\), what is the value of \\(x\\)?',
    choices: ['3', '5', '7', '15'], answer: 1,
    explanation: 'Subtract 7 from both sides to get \\(3x = 15\\), then divide by 3: \\(x = 5\\).'
  },
  {
    id: 'm-alg-2', section: 'math', domain: 'Algebra', difficulty: 'easy', skill: 'Linear functions',
    prompt: 'A gym charges a one-time $40 sign-up fee plus $25 per month. Which expression gives the total cost, in dollars, of a membership for \\(m\\) months?',
    choices: ['\\(25m + 40\\)', '\\(40m + 25\\)', '\\(65m\\)', '\\(25(m + 40)\\)'], answer: 0,
    explanation: 'The monthly charge grows with \\(m\\) (that is \\(25m\\)) and the fee is paid once (\\(+40\\)), so the total is \\(25m + 40\\).'
  },
  {
    id: 'm-alg-3', section: 'math', domain: 'Algebra', difficulty: 'medium', skill: 'Linear equations in two variables',
    prompt: 'A line in the \\(xy\\)-plane passes through the points \\((2, 5)\\) and \\((6, 13)\\). What is the \\(y\\)-intercept of the line?',
    choices: ['\\(-1\\)', '1', '2', '3'], answer: 1,
    explanation: 'The slope is \\(\\frac{13 - 5}{6 - 2} = 2\\). Using \\(y = 2x + b\\) with the point \\((2, 5)\\): \\(5 = 4 + b\\), so \\(b = 1\\).'
  },
  {
    id: 'm-alg-4', section: 'math', domain: 'Algebra', difficulty: 'medium', skill: 'Systems of linear equations', type: 'spr',
    prompt: '\\[\\begin{aligned} x + y &= 10 \\\\ x - y &= 4 \\end{aligned}\\]If \\((x, y)\\) is the solution to the system of equations above, what is the value of \\(xy\\)?',
    accept: ['21'],
    explanation: 'Adding the equations gives \\(2x = 14\\), so \\(x = 7\\) and \\(y = 3\\). Then \\(xy = 21\\).'
  },
  {
    id: 'm-alg-5', section: 'math', domain: 'Algebra', difficulty: 'hard', skill: 'Systems of linear equations',
    prompt: '\\[\\begin{aligned} 2x + 3y &= 6 \\\\ 4x + ky &= 15 \\end{aligned}\\]For what value of \\(k\\) does the system of equations above have no solution?',
    choices: ['\\(-6\\)', '3', '6', '12'], answer: 2,
    explanation: 'Doubling the first equation gives \\(4x + 6y = 12\\). If \\(k = 6\\), the left sides match but \\(12 \\neq 15\\), so the lines are parallel and there is no solution.'
  },
  {
    id: 'm-alg-6', section: 'math', domain: 'Algebra', difficulty: 'hard', skill: 'Linear inequalities', type: 'spr',
    prompt: 'A delivery van can safely carry at most 1,200 pounds. The driver weighs 180 pounds, and each box to be loaded weighs 34 pounds. What is the maximum number of boxes the van can carry along with the driver?',
    accept: ['30'],
    explanation: '\\(180 + 34b \\le 1{,}200\\) gives \\(34b \\le 1{,}020\\), so \\(b \\le 30\\). The maximum is 30 boxes.'
  },

  // ---------- Math: Advanced Math ----------
  {
    id: 'm-adv-1', section: 'math', domain: 'Advanced Math', difficulty: 'easy', skill: 'Nonlinear functions',
    prompt: 'The function \\(f\\) is defined by \\(f(x) = x^2 - 3x + 2\\). What is the value of \\(f(4)\\)?',
    choices: ['2', '6', '10', '14'], answer: 1,
    explanation: '\\(f(4) = 4^2 - 3(4) + 2 = 16 - 12 + 2 = 6\\).'
  },
  {
    id: 'm-adv-2', section: 'math', domain: 'Advanced Math', difficulty: 'medium', skill: 'Equivalent expressions',
    prompt: 'Which of the following is a factor of \\(x^2 + x - 12\\)?',
    choices: ['\\(x - 4\\)', '\\(x + 3\\)', '\\(x + 4\\)', '\\(x - 6\\)'], answer: 2,
    explanation: 'Find two numbers that multiply to \\(-12\\) and add to 1: they are 4 and \\(-3\\). So \\(x^2 + x - 12 = (x + 4)(x - 3)\\).'
  },
  {
    id: 'm-adv-3', section: 'math', domain: 'Advanced Math', difficulty: 'medium', skill: 'Nonlinear equations', type: 'spr',
    prompt: '\\[(x + 5)^2 = 49\\]What is the positive solution to the equation above?',
    accept: ['2'],
    explanation: '\\(x + 5 = 7\\) or \\(x + 5 = -7\\), so \\(x = 2\\) or \\(x = -12\\). The positive solution is 2.'
  },
  {
    id: 'm-adv-4', section: 'math', domain: 'Advanced Math', difficulty: 'medium', skill: 'Equivalent expressions',
    prompt: 'If \\(x > 0\\) and \\(x^{\\frac{1}{2}} \\cdot x^{\\frac{3}{2}} = 49\\), what is the value of \\(x\\)?',
    choices: ['\\(\\sqrt{7}\\)', '7', '24.5', '49'], answer: 1,
    explanation: 'When multiplying powers with the same base, add the exponents: \\(x^{\\frac{1}{2} + \\frac{3}{2}} = x^2\\). So \\(x^2 = 49\\) and \\(x = 7\\).'
  },
  {
    id: 'm-adv-5', section: 'math', domain: 'Advanced Math', difficulty: 'hard', skill: 'Nonlinear functions',
    prompt: 'A colony of 500 bacteria doubles in size every 3 hours. Which function \\(P\\) gives the number of bacteria \\(t\\) hours after the colony was first measured?',
    choices: ['\\(P(t) = 500(2)^{\\frac{t}{3}}\\)', '\\(P(t) = 500(2)^{3t}\\)', '\\(P(t) = 500(3)^{\\frac{t}{2}}\\)', '\\(P(t) = 1{,}000^{\\frac{t}{3}}\\)'], answer: 0,
    explanation: 'The population is multiplied by 2 once every 3 hours, so after \\(t\\) hours it has doubled \\(\\frac{t}{3}\\) times: \\(P(t) = 500(2)^{\\frac{t}{3}}\\).'
  },
  {
    id: 'm-adv-6', section: 'math', domain: 'Advanced Math', difficulty: 'hard', skill: 'Nonlinear equations',
    prompt: 'The graph of \\(y = x^2 - 6x + c\\) touches the \\(x\\)-axis at exactly one point. What is the value of \\(c\\)?',
    choices: ['3', '6', '9', '36'], answer: 2,
    explanation: 'Exactly one \\(x\\)-intercept means the discriminant is zero: \\((-6)^2 - 4(1)(c) = 0\\), so \\(36 = 4c\\) and \\(c = 9\\).'
  },

  // ---------- Math: Problem-Solving & Data Analysis ----------
  {
    id: 'm-psda-1', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'easy', skill: 'Percentages',
    prompt: 'A jacket originally priced at $40 is on sale for 15% off. What is the sale price?',
    choices: ['$25', '$34', '$35', '$46'], answer: 1,
    explanation: '15% of $40 is \\(0.15 \\times 40 = 6\\) dollars, so the sale price is $40 − $6 = $34.'
  },
  {
    id: 'm-psda-2', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'easy', skill: 'One-variable data',
    prompt: 'What is the mean of the data set 4, 8, 10, 14, 19?',
    choices: ['10', '11', '12', '13'], answer: 1,
    explanation: 'The sum is 55 and there are 5 values, so the mean is \\(\\frac{55}{5} = 11\\).'
  },
  {
    id: 'm-psda-3', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'medium', skill: 'Ratios, rates and proportions', type: 'spr',
    prompt: 'A recipe uses 3 cups of flour to make 24 cookies. At this rate, how many cups of flour are needed to make 60 cookies?',
    accept: ['7.5'],
    explanation: 'Each cookie uses \\(\\frac{3}{24} = \\frac{1}{8}\\) cup, so 60 cookies need \\(\\frac{60}{8} = 7.5\\) cups (\\(\\frac{15}{2}\\) is also accepted).'
  },
  {
    id: 'm-psda-4', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'medium', skill: 'Inference from samples',
    prompt: 'A school has 1,800 students. In a survey of 200 randomly selected students, 48 said they bike to school. Based on the survey, which is the best estimate of the number of students at the school who bike to school?',
    choices: ['48', '216', '432', '864'], answer: 2,
    explanation: 'The sample proportion is \\(\\frac{48}{200} = 0.24\\). Applying it to the whole school: \\(0.24 \\times 1{,}800 = 432\\).'
  },
  {
    id: 'm-psda-5', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'hard', skill: 'Percentages',
    prompt: 'The price of a stock increased by 20% on Monday and then decreased by 20% on Tuesday. Which describes the overall change in price from the start of Monday to the end of Tuesday?',
    choices: ['No change', 'A 4% decrease', 'A 4% increase', 'A 20% decrease'], answer: 1,
    explanation: 'Multiply the factors: \\(1.20 \\times 0.80 = 0.96\\). The final price is 96% of the original, a 4% decrease.'
  },
  {
    id: 'm-psda-6', section: 'math', domain: 'Problem-Solving & Data Analysis', difficulty: 'hard', skill: 'One-variable data', type: 'spr',
    prompt: 'A data set of 5 numbers has a mean of 12. When a sixth number is added, the mean of the data set becomes 13. What is the sixth number?',
    accept: ['18'],
    explanation: 'The original sum is \\(5 \\times 12 = 60\\). The new sum is \\(6 \\times 13 = 78\\). The sixth number is \\(78 - 60 = 18\\).'
  },

  // ---------- Math: Geometry & Trigonometry ----------
  {
    id: 'm-geo-1', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'easy', skill: 'Right triangles and trigonometry',
    prompt: 'A rectangle has a length of 12 and a width of 5. What is the length of its diagonal?',
    choices: ['13', '15', '17', '\\(\\sqrt{119}\\)'], answer: 0,
    explanation: 'By the Pythagorean theorem, the diagonal is \\(\\sqrt{12^2 + 5^2} = \\sqrt{169} = 13\\).'
  },
  {
    id: 'm-geo-2', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'easy', skill: 'Lines, angles and triangles',
    prompt: 'Two angles of a triangle measure \\(48^\\circ\\) and \\(67^\\circ\\). What is the measure of the third angle?',
    choices: ['\\(55^\\circ\\)', '\\(65^\\circ\\)', '\\(75^\\circ\\)', '\\(115^\\circ\\)'], answer: 1,
    explanation: 'The angles of a triangle sum to \\(180^\\circ\\): \\(180 - 48 - 67 = 65\\).'
  },
  {
    id: 'm-geo-3', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'medium', skill: 'Circles',
    prompt: 'A circle in the \\(xy\\)-plane has equation \\((x - 3)^2 + (y + 2)^2 = 25\\). What are the center and radius of the circle?',
    choices: ['Center \\((3, -2)\\), radius 5', 'Center \\((-3, 2)\\), radius 5', 'Center \\((3, -2)\\), radius 25', 'Center \\((-3, 2)\\), radius 25'], answer: 0,
    explanation: 'The form \\((x - h)^2 + (y - k)^2 = r^2\\) has center \\((h, k)\\) and radius \\(r\\). Here \\(h = 3\\), \\(k = -2\\), and \\(r = \\sqrt{25} = 5\\).'
  },
  {
    id: 'm-geo-4', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'medium', skill: 'Right triangles and trigonometry',
    prompt: 'In right triangle \\(ABC\\), angle \\(C\\) is the right angle and \\(\\sin A = \\frac{3}{5}\\). What is \\(\\cos A\\)?',
    choices: ['\\(\\frac{3}{4}\\)', '\\(\\frac{4}{5}\\)', '\\(\\frac{5}{4}\\)', '\\(\\frac{4}{3}\\)'], answer: 1,
    explanation: 'If the side opposite \\(A\\) is 3 and the hypotenuse is 5, the adjacent side is 4 (a 3-4-5 triangle). So \\(\\cos A = \\frac{4}{5}\\).'
  },
  {
    id: 'm-geo-5', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'hard', skill: 'Area and volume',
    prompt: 'A right circular cylinder has a radius of 3 and a height of 8. What is its volume?',
    choices: ['\\(24\\pi\\)', '\\(48\\pi\\)', '\\(72\\pi\\)', '\\(144\\pi\\)'], answer: 2,
    explanation: '\\(V = \\pi r^2 h = \\pi(3^2)(8) = 72\\pi\\).'
  },
  {
    id: 'm-geo-6', section: 'math', domain: 'Geometry & Trigonometry', difficulty: 'hard', skill: 'Lines, angles and triangles', type: 'spr',
    prompt: 'Two triangles are similar, and the ratio of their corresponding side lengths is \\(2 : 3\\). If the area of the smaller triangle is 20, what is the area of the larger triangle?',
    accept: ['45'],
    explanation: 'Areas of similar figures scale by the square of the side ratio: \\(20 \\times \\left(\\frac{3}{2}\\right)^2 = 20 \\times \\frac{9}{4} = 45\\).'
  },

  // ---------- Reading & Writing: Craft & Structure ----------
  {
    id: 'rw-cs-1', section: 'rw', domain: 'Craft & Structure', difficulty: 'easy', skill: 'Words in context',
    passage: 'Although the bridge\'s design seemed ______ at first glance, consisting of nothing more than a simple pattern of repeated triangles, engineers soon recognized it as one of the strongest structures of its era.',
    prompt: 'Which choice completes the text with the most logical and precise word or phrase?',
    choices: ['unremarkable', 'extravagant', 'hazardous', 'permanent'], answer: 0,
    explanation: '"Although" sets up a contrast with the bridge\'s strength, and "nothing more than a simple pattern" describes something that looks ordinary. "Unremarkable" fits.'
  },
  {
    id: 'rw-cs-2', section: 'rw', domain: 'Craft & Structure', difficulty: 'easy', skill: 'Words in context',
    passage: 'The committee\'s decision was ______: once it was announced, it could not be appealed or revisited.',
    prompt: 'Which choice completes the text with the most logical and precise word or phrase?',
    choices: ['tentative', 'final', 'popular', 'confusing'], answer: 1,
    explanation: 'The colon introduces an explanation: a decision that cannot be appealed or revisited is final.'
  },
  {
    id: 'rw-cs-3', section: 'rw', domain: 'Craft & Structure', difficulty: 'medium', skill: 'Words in context',
    passage: 'The novelist\'s early reviews were mixed, but her reputation grew steadily as readers came to appreciate the ______ of her prose: every sentence seemed carefully weighed, with no word wasted.',
    prompt: 'Which choice completes the text with the most logical and precise word or phrase?',
    choices: ['ambiguity', 'volume', 'precision', 'carelessness'], answer: 2,
    explanation: 'Sentences that are "carefully weighed, with no word wasted" show precision.'
  },
  {
    id: 'rw-cs-4', section: 'rw', domain: 'Craft & Structure', difficulty: 'medium', skill: 'Text structure and purpose',
    passage: 'For decades, researchers assumed that octopuses, being largely solitary, had little need for complex social behavior. Recent underwater footage from a site off the coast of Australia, however, shows groups of octopuses living in close quarters, signaling to one another with color changes and occasionally evicting neighbors from dens. These observations have led some biologists to reconsider how much sociality octopuses are capable of.',
    prompt: 'Which choice best describes the overall structure of the text?',
    choices: [
      'It presents a long-held assumption, describes evidence that challenges it, and notes a resulting shift in thinking.',
      'It describes an experiment and then lists several flaws in how it was conducted.',
      'It compares the social behavior of two species and explains why they differ.',
      'It proposes a new hypothesis and then rejects it based on video evidence.'
    ], answer: 0,
    explanation: 'The text opens with what researchers "assumed," presents footage that contradicts it ("however"), and ends with biologists reconsidering.'
  },
  {
    id: 'rw-cs-5', section: 'rw', domain: 'Craft & Structure', difficulty: 'hard', skill: 'Text structure and purpose',
    passage: 'The city\'s new library was widely praised for its soaring glass atrium. Yet many longtime patrons noted that the building had fewer quiet study rooms than the old library it replaced. For them, the atrium\'s beauty did little to make up for the loss.',
    prompt: 'Which choice best describes the function of the second sentence in the text as a whole?',
    choices: [
      'It provides evidence supporting the praise of the atrium\'s design.',
      'It introduces a criticism that complicates the praise mentioned in the first sentence.',
      'It explains why the city decided to replace the old library.',
      'It summarizes the patrons\' reasons for preferring the new building.'
    ], answer: 1,
    explanation: '"Yet" signals a turn: the second sentence raises a drawback (fewer study rooms) that complicates the praise in the first sentence.'
  },
  {
    id: 'rw-cs-6', section: 'rw', domain: 'Craft & Structure', difficulty: 'hard', skill: 'Cross-text connections',
    passage: 'Text 1\nSome economists argue that a four-day workweek boosts productivity. They point to trials in which employees completed the same amount of work in fewer hours, with no drop in quality.\n\nText 2\nCritics of four-day workweek trials note that most participating companies volunteered, and such firms may already have had flexible cultures that made the transition easy. Results from these companies, the critics argue, may not apply to businesses in general.',
    prompt: 'Based on the texts, how would the critics in Text 2 most likely respond to the economists in Text 1?',
    choices: [
      'By arguing that the trials actually showed a decline in the quality of work',
      'By suggesting that the trial results may not hold for companies that did not volunteer',
      'By agreeing that every business should adopt a four-day workweek',
      'By claiming that employees in the trials worked more hours than reported'
    ], answer: 1,
    explanation: 'Text 2\'s point is that volunteer companies may not be representative, so the positive results may not generalize.'
  },

  // ---------- Reading & Writing: Information & Ideas ----------
  {
    id: 'rw-ii-1', section: 'rw', domain: 'Information & Ideas', difficulty: 'easy', skill: 'Central ideas and details',
    passage: 'In many cities, vacant lots have been transformed into community gardens. Beyond providing fresh produce, these gardens give neighbors a place to meet, share skills, and work together on a common project. Several surveys of urban gardeners have found that participants report feeling more connected to their neighborhoods after joining.',
    prompt: 'Which choice best states the main idea of the text?',
    choices: [
      'Community gardens offer social benefits in addition to providing food.',
      'Vacant lots are the best location for growing vegetables in cities.',
      'Most city residents would prefer gardens to new buildings.',
      'Surveys of urban gardeners are often unreliable.'
    ], answer: 0,
    explanation: 'The text moves "beyond providing fresh produce" to describe meeting, sharing, and connection: social benefits.'
  },
  {
    id: 'rw-ii-2', section: 'rw', domain: 'Information & Ideas', difficulty: 'easy', skill: 'Central ideas and details',
    passage: 'Mae Jemison became the first African American woman to travel to space in 1992, aboard the space shuttle Endeavour. Before joining NASA, she had worked as a physician and served as a medical officer in the Peace Corps in West Africa.',
    prompt: 'According to the text, what did Jemison do before joining NASA?',
    choices: [
      'She designed parts for the space shuttle Endeavour.',
      'She worked as a physician.',
      'She trained other astronauts.',
      'She taught at a university in West Africa.'
    ], answer: 1,
    explanation: 'The text states directly that before joining NASA she "had worked as a physician."'
  },
  {
    id: 'rw-ii-3', section: 'rw', domain: 'Information & Ideas', difficulty: 'medium', skill: 'Inferences',
    passage: 'Gray wolves were reintroduced to Yellowstone National Park in 1995. Afterward, elk began avoiding open river valleys where they could easily be seen by predators. In those valleys, willow and aspen trees, which elk had previously grazed heavily, began to recover. This pattern suggests that ______',
    prompt: 'Which choice most logically completes the text?',
    choices: [
      'elk prefer to eat willow and aspen trees over other plants.',
      'the presence of wolves indirectly helped certain trees by changing elk behavior.',
      'wolves directly feed on young willow and aspen trees.',
      'the river valleys became too cold for elk after 1995.'
    ], answer: 1,
    explanation: 'Wolves changed where elk grazed, and the trees elk had been eating recovered: an indirect effect of wolves on the trees.'
  },
  {
    id: 'rw-ii-4', section: 'rw', domain: 'Information & Ideas', difficulty: 'medium', skill: 'Command of evidence: quantitative',
    passage: 'A student surveyed four classes about the number of hours students spend reading for fun each week. The student claims that students in the class with the highest average read more than twice as much as students in the class with the lowest average.',
    table: { caption: 'Weekly reading for fun', head: ['Class', 'Average hours per week'], rows: [['A', '3.1'], ['B', '4.6'], ['C', '2.4'], ['D', '5.0']] },
    prompt: 'Which choice best describes data from the survey that support the student\'s claim?',
    choices: [
      'Class D averaged 5.0 hours, more than twice Class C\'s average of 2.4 hours.',
      'Class B averaged 4.6 hours, more than Class A\'s average of 3.1 hours.',
      'Class A averaged 3.1 hours, more than twice Class C\'s average of 2.4 hours.',
      'Class D averaged 5.0 hours, slightly more than Class B\'s average of 4.6 hours.'
    ], answer: 0,
    explanation: 'The highest average is Class D (5.0) and the lowest is Class C (2.4). Since 2 × 2.4 = 4.8 and 5.0 > 4.8, choice A supports the claim. Choice C is false.'
  },
  {
    id: 'rw-ii-5', section: 'rw', domain: 'Information & Ideas', difficulty: 'hard', skill: 'Command of evidence: textual',
    passage: 'A researcher hypothesizes that a certain species of songbird learns its song mainly by listening to adult birds rather than relying on instinct alone.',
    prompt: 'Which finding, if true, would most directly support the researcher\'s hypothesis?',
    choices: [
      'Birds of this species sing more frequently in spring than in fall.',
      'Adult birds of this species sing more loudly when predators are nearby.',
      'Young birds raised without contact with adults produced simplified songs lacking the species\' typical features.',
      'Young birds of this species begin singing at about the same age regardless of where they hatch.'
    ], answer: 2,
    explanation: 'If birds raised without adults fail to develop the normal song, listening to adults must matter, which is exactly what the hypothesis predicts.'
  },
  {
    id: 'rw-ii-6', section: 'rw', domain: 'Information & Ideas', difficulty: 'hard', skill: 'Inferences',
    passage: 'Many ocean fish produce their own light through bioluminescence. In the ocean\'s upper layers, where faint sunlight still penetrates, certain fish have light-producing organs on their bellies that match the dim light coming from above. A predator looking up from below therefore has difficulty spotting the fish\'s silhouette. Based on the text, these light-producing organs most likely help the fish by ______',
    prompt: 'Which choice most logically completes the text?',
    choices: [
      'attracting mates from long distances.',
      'luring prey toward their mouths.',
      'making them harder to detect against the light from above.',
      'allowing them to see in total darkness.'
    ], answer: 2,
    explanation: 'The organs match the light from above so predators below cannot see a silhouette: the light works as camouflage.'
  },

  // ---------- Reading & Writing: Standard English Conventions ----------
  {
    id: 'rw-sec-1', section: 'rw', domain: 'Standard English Conventions', difficulty: 'easy', skill: 'Form, structure and sense',
    passage: 'The city orchestra, which was founded in 1921, ______ its centennial with a free concert in the park.',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: ['celebrated', 'celebrating', 'to celebrate', 'having celebrated'], answer: 0,
    explanation: 'The sentence needs a main verb for the subject "orchestra." Only "celebrated" is a finite verb; the others leave the sentence without one.'
  },
  {
    id: 'rw-sec-2', section: 'rw', domain: 'Standard English Conventions', difficulty: 'easy', skill: 'Form, structure and sense',
    passage: 'The company announced that ______ quarterly profits had risen by 12 percent.',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: ['its', 'it\'s', 'their', 'they\'re'], answer: 0,
    explanation: '"Company" is singular and the blank shows possession, so the singular possessive "its" is correct. "It\'s" means "it is."'
  },
  {
    id: 'rw-sec-3', section: 'rw', domain: 'Standard English Conventions', difficulty: 'medium', skill: 'Form, structure and sense',
    passage: 'The collection of rare maps, donated by a retired sea captain, ______ now on display at the museum.',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: ['is', 'are', 'were', 'have been'], answer: 0,
    explanation: 'The subject is "collection" (singular), not "maps," and "now" calls for the present tense: "is."'
  },
  {
    id: 'rw-sec-4', section: 'rw', domain: 'Standard English Conventions', difficulty: 'medium', skill: 'Boundaries',
    passage: 'Engineers tested three materials for the new running ______ rubber, cork, and recycled plastic.',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: ['track:', 'track;', 'track, and', 'track'], answer: 0,
    explanation: 'A colon introduces the list that explains "three materials." A semicolon would need a complete clause after it.'
  },
  {
    id: 'rw-sec-5', section: 'rw', domain: 'Standard English Conventions', difficulty: 'hard', skill: 'Boundaries',
    passage: 'Ruth Asawa\'s looped-wire ______ often hang from ceilings, cast intricate shadows that shift as viewers move around them.',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: ['sculptures, which', 'sculptures which', 'sculptures; which', 'sculptures. Which'], answer: 0,
    explanation: '"Which often hang from ceilings" is a nonessential clause, so it must be set off by a pair of commas. The second comma already appears after "ceilings."'
  },
  {
    id: 'rw-sec-6', section: 'rw', domain: 'Standard English Conventions', difficulty: 'hard', skill: 'Form, structure and sense',
    passage: 'Having studied the ruins for over a decade, ______',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: [
      'a new theory about the city\'s decline was proposed by the archaeologist.',
      'the archaeologist proposed a new theory about the city\'s decline.',
      'the city\'s decline was explained by the archaeologist\'s new theory.',
      'a new theory was proposed about the city\'s decline.'
    ], answer: 1,
    explanation: 'The opening phrase describes someone who studied the ruins, so the word right after the comma must be that person: "the archaeologist."'
  },

  // ---------- Reading & Writing: Expression of Ideas ----------
  {
    id: 'rw-eoi-1', section: 'rw', domain: 'Expression of Ideas', difficulty: 'easy', skill: 'Transitions',
    passage: 'Many common foods were first domesticated in the Americas. ______ tomatoes, potatoes, and corn all originated there before spreading to the rest of the world.',
    prompt: 'Which choice completes the text with the most logical transition?',
    choices: ['For example,', 'However,', 'In contrast,', 'Finally,'], answer: 0,
    explanation: 'Tomatoes, potatoes, and corn are examples of the "common foods" mentioned in the first sentence.'
  },
  {
    id: 'rw-eoi-2', section: 'rw', domain: 'Expression of Ideas', difficulty: 'easy', skill: 'Transitions',
    passage: 'Early bicycles were heavy and difficult to steer. ______ by the 1890s, improvements such as equal-sized wheels and air-filled tires had made cycling popular across Europe and North America.',
    prompt: 'Which choice completes the text with the most logical transition?',
    choices: ['For example,', 'Similarly,', 'However,', 'As a result,'], answer: 2,
    explanation: 'The second sentence contrasts with the first (from difficult to popular), so "However" fits. The heaviness did not cause the popularity, so "As a result" is wrong.'
  },
  {
    id: 'rw-eoi-3', section: 'rw', domain: 'Expression of Ideas', difficulty: 'medium', skill: 'Transitions',
    passage: 'The town\'s population doubled between 1990 and 2010. ______ the number of schools stayed the same, leading to crowded classrooms.',
    prompt: 'Which choice completes the text with the most logical transition?',
    choices: ['For instance,', 'Meanwhile,', 'Therefore,', 'Likewise,'], answer: 1,
    explanation: 'The two facts happened over the same period and together explain crowding. "Meanwhile" shows they occurred at the same time.'
  },
  {
    id: 'rw-eoi-4', section: 'rw', domain: 'Expression of Ideas', difficulty: 'medium', skill: 'Transitions',
    passage: 'Honeybees communicate the location of food through a movement called the waggle dance. ______ a bee that has found a rich patch of flowers can recruit dozens of nestmates to the site within minutes.',
    prompt: 'Which choice completes the text with the most logical transition?',
    choices: ['Nonetheless,', 'In contrast,', 'In this way,', 'Previously,'], answer: 2,
    explanation: 'The second sentence describes what the waggle dance makes possible, so "In this way" connects the method to its result.'
  },
  {
    id: 'rw-eoi-5', section: 'rw', domain: 'Expression of Ideas', difficulty: 'hard', skill: 'Rhetorical synthesis',
    passage: 'While researching a topic, a student has taken the following notes:\n\n• The Great Green Wall is an initiative to restore land across Africa\'s Sahel region.\n• It was launched in 2007.\n• Its goal is to restore 100 million hectares of degraded land by 2030.\n• Participating countries include Senegal, Nigeria, and Ethiopia.',
    prompt: 'The student wants to emphasize the scale of the initiative. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    choices: [
      'Launched in 2007, the Great Green Wall is an initiative in Africa.',
      'Senegal, Nigeria, and Ethiopia are among the countries participating in the Great Green Wall.',
      'The Great Green Wall aims to restore 100 million hectares of degraded land across Africa\'s Sahel region by 2030.',
      'The Great Green Wall, an initiative in the Sahel region, was launched in 2007.'
    ], answer: 2,
    explanation: 'Only choice C mentions the 100 million hectares goal, which is what conveys scale.'
  },
  {
    id: 'rw-eoi-6', section: 'rw', domain: 'Expression of Ideas', difficulty: 'hard', skill: 'Rhetorical synthesis',
    passage: 'While researching a topic, a student has taken the following notes:\n\n• Katherine Johnson was a NASA mathematician.\n• She calculated trajectories for early American spaceflights.\n• In 1962, astronaut John Glenn asked that she personally verify the computer\'s calculations for his orbital flight.\n• She received the Presidential Medal of Freedom in 2015.',
    prompt: 'The student wants to highlight the trust others placed in Johnson\'s work. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    choices: [
      'Katherine Johnson, a NASA mathematician, received the Presidential Medal of Freedom in 2015.',
      'Before his 1962 orbital flight, John Glenn asked that NASA mathematician Katherine Johnson personally verify the computer\'s calculations.',
      'Katherine Johnson calculated trajectories for early American spaceflights.',
      'In 1962, John Glenn completed an orbital flight, and in 2015, Katherine Johnson received an award.'
    ], answer: 1,
    explanation: 'Glenn trusting Johnson over the computer is the clearest evidence of the trust others placed in her work.'
  }
];
