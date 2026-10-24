# SatStat

A free SAT prep dashboard. No accounts, no paywall, no backend: it is a static site, and progress is saved in your browser.

## Features

- **Home dashboard**: predicted score, practice streak, daily goal progress, accuracy, a question of the day, a 16-week activity heatmap and your three weakest domains.
- **Adaptive test**: answer like a test and see right away if you got it right. SatStat remembers every answer across sessions (a per-domain skill level plus per-skill accuracy), then picks each next question to match: weak domains and skills come up more, difficulty follows your level, a miss brings a follow-up on the same skill two questions later, and old mistakes come back for review. A live panel shows your levels moving, and the end screen shows how each one changed.
- **Unlimited AI questions**: on the claude.ai version, Claude writes each question on the spot for the exact skill and difficulty the adaptive engine picks (in Adaptive test and Practice). It runs on each student's own Claude account, asks permission once, and solves each question before writing the answer key. The page then checks the format and shuffles the choices. "Report a problem" removes a bad question from your stats. Anywhere Claude isn't available (GitHub Pages, or if a student declines), SatStat uses the built-in bank instead.
- **Practice**: original SAT-style questions covering all 8 digital SAT domains, filterable by section, domain, difficulty, "not yet answered", "last answer wrong" and "flagged". Instant explanations. Supports multiple choice and student-produced (grid-in) answers, including fractions like `15/2`.
- **Mock exams** (built-in bank): mini or full-module length, timed at real SAT pacing (R&W ≈ 71 s per question, Math ≈ 95 s), with a question navigator, mark-for-review, a Desmos link for math, a score estimate and a full answer review. Past results are kept.
- **Vocab**: 62 high-value SAT words as flashcards you sort into "learning" and "mastered".
- **Diagnostics**: accuracy by section, domain and difficulty, plus recent mistakes with one-click retry.
- **Schedule**: a daily checklist and a 7-day plan that adapt to your weakest domains and to how close your test date is.
- **Settings**: name, test date, target score, daily goal, and export/import/reset of your progress.

Works on phones (slide-out menu) and follows your system's light/dark mode.

## Run it locally

Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy for free

**GitHub Pages:** in the repository go to Settings → Pages, choose "Deploy from a branch", pick your branch and `/ (root)`, and save. The site will be live at `https://<username>.github.io/<repo>/`.

Netlify, Vercel and Cloudflare Pages also work: point them at the repository with no build command and the root as the output directory.

## Adding questions

Questions live in `js/questions.js`. Add an object to the array:

```js
{
  id: 'm-alg-7',                 // unique
  section: 'math',               // 'math' or 'rw'
  domain: 'Algebra',             // one of the 8 domains listed in js/app.js
  skill: 'Linear functions',     // one of that domain's skills (SKILLS in js/app.js)
  difficulty: 'medium',          // 'easy' | 'medium' | 'hard'
  passage: 'Optional text…',     // shown above the question
  table: { caption: '…', head: ['…'], rows: [['…']] },   // optional data table
  prompt: 'What is the value of x?',
  choices: ['1', '2', '3', '4'], answer: 2,   // multiple choice (answer is the index)
  // or, for a grid-in: type: 'spr', accept: ['7.5']
  explanation: 'Why the answer is right.'
}
```

Vocabulary lives in `js/vocab.js` as `[word, part of speech, definition, example]`.

The College Board's free [SAT Suite Question Bank](https://satsuitequestionbank.collegeboard.org/) and the [Bluebook](https://bluebook.collegeboard.org/) app (official full-length practice tests) are good companions to this site.

## Notes

- The predicted score is a rough estimate: it weights your last 40 answers per section by difficulty and maps accuracy onto 200–800. It is not an official score.
- Progress lives in `localStorage`, so it is per browser. Use Settings → Export to move it to another device.
