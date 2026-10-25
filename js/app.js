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
  // Approximate share of each section's questions per domain on the digital SAT.
  const DOMAIN_SHARE = {
    'Craft & Structure': 0.28, 'Information & Ideas': 0.26, 'Standard English Conventions': 0.26, 'Expression of Ideas': 0.20,
    'Algebra': 0.35, 'Advanced Math': 0.35, 'Problem-Solving & Data Analysis': 0.15, 'Geometry & Trigonometry': 0.15
  };
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
    profile: { name: '', testDate: '', dailyGoal: 10, targetScore: 1400 },
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
    return q ? { s: q.section, d: q.domain, k: q.skill, f: q.difficulty } : null;
  }

  // Records an answer and updates the mistake memory. `origin` is the missed question a
  // similar question was written for. Returns what's needed to undo it if the question is reported.
  function record(q, ok, mode, origin) {
    const id = origin || q.id;
    const prev = state.mistakes[id] ? { ...state.mistakes[id] } : null;
    const now = Date.now();
    state.attempts.push({ id: q.id, ok, t: now, m: mode, s: q.section, d: q.domain, k: q.skill, f: q.difficulty });
    if (!ok) {
      state.mistakes[id] = { d: q.domain, k: q.skill, f: q.difficulty, stage: 0, misses: (prev?.misses || 0) + 1, due: now + DAY, last: now };
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
  function abilities() {
    const r = Object.fromEntries(ALL_DOMAINS.map(d => [d, 0]));
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
    return t >= 1500 ? 0.5 : t >= 1350 ? 0.25 : 0;
  };
  const levelFor = r => {
    const x = r + (Math.random() - 0.5) * 0.8;
    return x < -0.45 ? 'easy' : x > 0.45 ? 'hard' : 'medium';
  };

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
      ? '{"topic": "2–5 word topic label", "passage": "" or text, "table": null or {"caption": "...", "head": ["..."], "rows": [["..."]]}, "prompt": "...", "solution": "your full step-by-step solution", "type": "spr", "accept": ["the answer as a number, e.g. 7.5", "any equivalent form, e.g. 15/2"], "explanation": "1–3 sentences"}'
      : '{"topic": "2–5 word topic label", "passage": "" or text, "table": null or {"caption": "...", "head": ["..."], "rows": [["..."]]}, "prompt": "...", "solution": "your full step-by-step solution", "choices": ["...", "...", "...", "..."], "answer": index 0-3 of the correct choice, "why": ["one sentence on why the first choice is right or wrong", "... second", "... third", "... fourth"], "explanation": "1–3 sentences on the key idea and the main trap"}';
    return [
      `Write ONE question for the digital SAT, ${SECTIONS[section]} section, exactly as it would appear on the real test.`,
      `Domain: ${t.domain}`,
      `Skill: ${t.skill}`,
      `Difficulty: ${t.difficulty}. ${DIFF_GUIDE[t.difficulty] || DIFF_GUIDE.medium}`,
      `Format: ${SKILL_GUIDE[t.skill] || MATH_GUIDE}`,
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
      source: 'ai', section, domain: t.domain, skill: t.skill, difficulty: t.difficulty || 'medium',
      passage, prompt, explanation,
      topic: str(r.topic, 80) || t.skill,
      solution: typeof r.solution === 'string' ? r.solution.trim().slice(0, 3000) : ''
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

  async function generate(t, signal) {
    const format = t.ref ? (t.ref.type === 'spr' ? 'spr' : 'mc')
      : SECTION_OF[t.domain] === 'math' && Math.random() < 0.25 ? 'spr' : 'mc';
    let raw;
    try {
      raw = await ai.fn.json(buildPrompt(t, format), { signal, cache: false, modelTier: 'default', effort: 'low' });
    } catch (e) {
      if (e?.code !== 'invalid_json' || !e.text) throw e;
      raw = recoverJSON(e.text);
    }
    const q = validateAI(raw, t, format);
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
      fb = `<div class="feedback ${ok ? 'ok' : 'bad'}"><strong>${ok ? 'Correct.' : answered(st.resp) ? 'Not quite.' : 'Not answered.'}</strong> ${ans}${rich(q.explanation)}</div>` +
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
      if (f) return { followup: f, origin: f.origin, domain: f.d, skill: f.k, difficulty: f.f, ref: getQ(f.ref) };

      const inSession = id => s.items.some(i => i.origin === id || i.id === id) || (cur && (cur.origin === id || cur.q.id === id));
      const due = dueMistakes().filter(([id, m]) => domains.includes(m.d) && !inSession(id));
      if (due.length && (s.section === 'review' || pos % 3 === 0 || Math.random() < 0.15)) {
        const [id, m] = due[0];
        const orig = getQ(id);
        // Without Claude, the original question itself comes back once it's due.
        if (!useAI && orig && !used.has(id)) return { q: orig, origin: id };
        if (ok(m.d)) return { origin: id, domain: m.d, skill: m.k, difficulty: m.f || 'medium', ref: orig };
      }
      if (s.section === 'review') return null;

      const cands = domains.filter(ok);
      if (!cands.length) return null;
      const recent = s.items.slice(-2).map(i => i.d);
      const domain = weighted(cands, cands.map(d => {
        let w = DOMAIN_SHARE[d] * (1.3 - mastery(ab[d]));
        if (recent[recent.length - 1] === d) w *= recent.length === 2 && recent[0] === d ? 0.1 : 0.5;
        return w;
      }));
      const ss = skillStats();
      const skills = SKILLS[domain].filter(k => useAI || BANK.some(q => q.skill === k && !used.has(q.id)));
      const skill = weighted(skills, skills.map(k => 1.3 - (ss[k]?.n ? ss[k].ok / ss[k].n : 0.5)));
      return { domain, skill, difficulty: levelFor(ab[domain] + stretch()) };
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
        const f = { key: q.id + ':' + s.shown, origin: cur.origin || q.id, ref: q.id, d: q.domain, k: q.skill, f: q.difficulty, due: s.shown + 3 };
        s.followups.push(f);
        if (aiUsable()) twins.set(f.key, aiCall({ domain: f.d, skill: f.k, difficulty: f.f, ref: q }));
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
      const hist = state.adaptiveHistory.slice(-8).reverse().map(x => `<tr><td>${fmtDate(x.t)}</td><td>${x.section === 'mix' ? 'Mixed' : x.section === 'review' ? 'Mistake review' : SECTIONS[x.section]}</td><td class="num">${x.correct}/${x.total}</td><td class="num">${pct(x.correct, x.total)}%</td></tr>`).join('');
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
          <strong>${s.section === 'review' ? 'Mistake review' : 'Study'}</strong>
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
      skill: 'all',
      difficulty: 'all',
      mode: params.get('mode') || 'all'
    };
    if (f.domain !== 'all') f.section = SECTION_OF[f.domain];

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
        (f.difficulty === 'all' || q.difficulty === f.difficulty) &&
        (f.mode === 'all' ||
          (f.mode === 'new' && !(q.id in last)) ||
          (f.mode === 'missed' && last[q.id] === false) ||
          (f.mode === 'flagged' && state.review.includes(q.id))));
    }

    function aiTarget() {
      const ab = abilities();
      const domains = f.domain !== 'all' ? [f.domain] : f.section === 'all' ? ALL_DOMAINS : DOMAINS[f.section];
      const domain = weighted(domains, domains.map(d => DOMAIN_SHARE[d] * (1.3 - mastery(ab[d]))));
      const skills = f.skill !== 'all' ? [f.skill] : SKILLS[domain];
      return { domain, skill: skills[Math.floor(Math.random() * skills.length)], difficulty: f.difficulty !== 'all' ? f.difficulty : levelFor(ab[domain] + stretch()) };
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
          <select class="input" data-f="difficulty" aria-label="Difficulty">${opt('all', useAI ? 'Match my level' : 'Any difficulty', f.difficulty)}${opt('easy', 'Easy', f.difficulty)}${opt('medium', 'Medium', f.difficulty)}${opt('hard', 'Hard', f.difficulty)}</select>
          ${useAI ? '' : `<select class="input" data-f="mode" aria-label="Which questions">${opt('all', 'All questions', f.mode)}${opt('new', 'Not yet answered', f.mode)}${opt('missed', 'Last answer wrong', f.mode)}${opt('flagged', 'Flagged for review', f.mode)}</select>`}
        </div>
        ${note ? `<div class="notice">${esc(note)}</div>` : ''}
        <div class="card q-card">${body}</div>`;
    }

    el.addEventListener('change', e => {
      const k = e.target.dataset.f;
      if (!k) return;
      f[k] = e.target.value;
      if (k === 'section') { f.domain = 'all'; f.skill = 'all'; }
      if (k === 'domain') f.skill = 'all';
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
      if (act === 'clear') { Object.assign(f, { section: 'all', domain: 'all', skill: 'all', difficulty: 'all', mode: 'all' }); reset(); }
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
        name: fd.get('name').trim().slice(0, 40),
        testDate: fd.get('testDate'),
        targetScore: Math.min(1600, Math.max(400, Number(fd.get('targetScore')) || 1400)),
        dailyGoal: Math.min(200, Math.max(1, Number(fd.get('dailyGoal')) || 10))
      };
      save();
      $('#saved', el).textContent = 'Saved.';
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

  const routes = { home, adaptive, practice, review, exams, vocab, diagnostics, schedule, settings };
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
  render();
})();
