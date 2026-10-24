(() => {
  'use strict';

  const Q = window.SAT_QUESTIONS;
  const V = window.SAT_VOCAB;
  const qById = Object.fromEntries(Q.map(q => [q.id, q]));

  const SECTIONS = { rw: 'Reading & Writing', math: 'Math' };
  const DOMAINS = {
    rw: ['Craft & Structure', 'Information & Ideas', 'Standard English Conventions', 'Expression of Ideas'],
    math: ['Algebra', 'Advanced Math', 'Problem-Solving & Data Analysis', 'Geometry & Trigonometry']
  };
  const ALL_DOMAINS = [...DOMAINS.rw, ...DOMAINS.math];
  const WEIGHT = { easy: 1, medium: 1.5, hard: 2 };
  // Seconds per question on the real digital SAT: R&W 64 min / 54 q, Math 70 min / 44 q.
  const SEC_PER_Q = { rw: 71, math: 95 };

  // ---------- Storage ----------

  const KEY = 'satstat:v1';
  const defaults = () => ({
    profile: { name: '', testDate: '', dailyGoal: 10, targetScore: 1400 },
    attempts: [],   // { id, ok, t, m }  m = practice | daily | exam
    review: [],     // flagged question ids
    vocab: {},      // word -> 'learning' | 'known'
    exams: [],      // { t, section, size, correct, total, score, elapsed }
    tasksDone: {},  // 'YYYY-MM-DD' -> [taskId]
    daily: null     // { day, resp }
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

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }

  // ---------- Helpers ----------

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  function daysUntilTest() {
    if (!state.profile.testDate) return null;
    return Math.round((new Date(state.profile.testDate + 'T00:00') - new Date(dayKey() + 'T00:00')) / 864e5);
  }

  function record(q, ok, mode) {
    state.attempts.push({ id: q.id, ok, t: Date.now(), m: mode });
    save();
  }

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
      return q.accept.some(a => Math.abs(toNum(a) - r) < 1e-9);
    }
    return resp === q.answer;
  }

  // ---------- Stats ----------

  function sectionScore(sec) {
    const a = state.attempts.filter(x => qById[x.id]?.section === sec).slice(-40);
    if (a.length < 5) return null;
    let w = 0, s = 0;
    for (const x of a) {
      const k = WEIGHT[qById[x.id].difficulty];
      w += k;
      if (x.ok) s += k;
    }
    return Math.round((200 + 600 * s / w) / 10) * 10;
  }

  function domainStats() {
    const m = Object.fromEntries(ALL_DOMAINS.map(d => [d, { n: 0, ok: 0 }]));
    for (const x of state.attempts) {
      const q = qById[x.id];
      if (!q) continue;
      m[q.domain].n++;
      if (x.ok) m[q.domain].ok++;
    }
    return m;
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

  // ---------- Question rendering ----------

  function questionHTML(q, st) {
    const chips = `<div class="chips"><span class="chip">${SECTIONS[q.section]}</span><span class="chip">${esc(q.domain)}</span><span class="chip diff-${q.difficulty}">${q.difficulty}</span></div>`;
    const passage = q.passage ? `<div class="passage">${esc(q.passage)}</div>` : '';
    let body;
    if (q.type === 'spr') {
      body = `<div class="spr"><input class="input" data-spr value="${esc(st.resp ?? '')}" ${st.revealed ? 'disabled' : ''} placeholder="Type your answer, e.g. 7.5 or 15/2" autocomplete="off"></div>`;
    } else {
      body = '<div class="choices">' + q.choices.map((c, i) => {
        let cls = 'choice';
        if (st.resp === i) cls += ' selected';
        if (st.revealed) {
          if (i === q.answer) cls += ' correct';
          else if (st.resp === i) cls += ' wrong';
        }
        return `<button class="${cls}" data-choice="${i}" ${st.revealed ? 'disabled' : ''}><span class="letter">${'ABCD'[i]}</span><span>${esc(c)}</span></button>`;
      }).join('') + '</div>';
    }
    let fb = '';
    if (st.revealed) {
      const ok = isCorrect(q, st.resp);
      const ans = q.type === 'spr' && !ok ? `The answer is ${esc(q.accept[0])}. ` : '';
      fb = `<div class="feedback ${ok ? 'ok' : 'bad'}"><strong>${ok ? 'Correct.' : 'Not quite.'}</strong> ${ans}${esc(q.explanation)}</div>`;
    }
    return `<article class="question">${chips}${passage}<p class="prompt">${esc(q.prompt)}</p>${body}${fb}</article>`;
  }

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

    // Daily question: same for everyone on a given day.
    const dk = dayKey();
    let h = 0;
    for (const c of dk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const dq = Q[h % Q.length];
    const daily = state.daily?.day === dk ? { resp: state.daily.resp, revealed: true } : { resp: null, revealed: false };

    // Activity heatmap: 16 weeks ending this week.
    const counts = {};
    for (const x of state.attempts) { const k = dayKey(x.t); counts[k] = (counts[k] || 0) + 1; }
    const now = new Date();
    const start = addDays(now, -(7 * 15 + now.getDay()));
    let cells = '';
    for (let i = 0; i < 16 * 7; i++) {
      const d = addDays(start, i);
      const k = dayKey(d);
      const n = counts[k] || 0;
      const lvl = n === 0 ? '' : n < 5 ? 'l1' : n < 10 ? 'l2' : n < 20 ? 'l3' : 'l4';
      cells += `<span class="${d > now ? 'future' : lvl}" title="${fmtDate(d)}: ${n} question${n === 1 ? '' : 's'}"></span>`;
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

    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>${hello}${p.name ? ', ' + esc(p.name) : ''}</h1>
          <p>${days == null ? '<a href="#/settings">Set your test date</a> to get a countdown and study plan.' : days > 0 ? `${days} day${days === 1 ? '' : 's'} until your SAT.` : days === 0 ? 'Test day. You\'ve got this.' : 'Your test date has passed. <a href="#/settings">Set a new one</a>.'}</p>
        </div>
        <div class="row"><a class="btn" href="#/exams">Take a mock exam</a><a class="btn primary" href="#/practice">Start practicing</a></div>
      </div>

      <div class="grid stats">
        <div class="card">
          <div class="stat-label">Predicted score</div>
          <div class="stat-value">${total ?? '—'}</div>
          <div class="stat-sub">${total ? `R&W ${rw} · Math ${m} · goal ${p.targetScore}` : 'Answer 5+ questions in each section'}</div>
        </div>
        <div class="card">
          <div class="stat-label">Practice streak</div>
          <div class="stat-value">${streak()} day${streak() === 1 ? '' : 's'}</div>
          <div class="stat-sub">Practice daily to keep it going</div>
        </div>
        <div class="card">
          <div class="stat-label">Today</div>
          <div class="stat-value">${today}<span class="muted" style="font-size:18px"> / ${goal}</span></div>
          <div class="bar ${today >= goal ? 'ok' : ''}"><span style="width:${Math.min(100, pct(today, goal))}%"></span></div>
        </div>
        <div class="card">
          <div class="stat-label">Accuracy</div>
          <div class="stat-value">${all ? pct(correct, all) + '%' : '—'}</div>
          <div class="stat-sub">${correct} of ${all} answered correctly</div>
        </div>
      </div>

      <div class="grid two">
        <div class="card" id="daily">
          <div class="card-head"><h2>Question of the day</h2><span class="muted">${fmtDate(Date.now())}</span></div>
          <div id="daily-q">${questionHTML(dq, daily)}</div>
          ${daily.revealed ? '' : '<div class="q-actions"><button class="btn primary" id="daily-check">Check answer</button></div>'}
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h2>Activity</h2><span class="muted">Last 16 weeks</span></div>
            <div class="heatmap">${cells}</div>
            <div class="legend">Less <span class="sw" style="background:var(--surface-2)"></span><span class="sw" style="background:color-mix(in srgb,var(--accent) 30%,var(--surface-2))"></span><span class="sw" style="background:color-mix(in srgb,var(--accent) 55%,var(--surface-2))"></span><span class="sw" style="background:color-mix(in srgb,var(--accent) 80%,var(--surface-2))"></span><span class="sw" style="background:var(--accent)"></span> More</div>
          </div>
          <div class="card">
            <div class="card-head"><h2>Focus areas</h2><a class="small" href="#/diagnostics">Full diagnostics</a></div>
            ${focus}
          </div>
        </div>
      </div>`;

    if (daily.revealed) return;
    let resp = null;
    const box = $('#daily', el);
    box.addEventListener('click', e => {
      const c = e.target.closest('[data-choice]');
      if (c) {
        resp = Number(c.dataset.choice);
        box.querySelectorAll('.choice').forEach(b => b.classList.toggle('selected', b === c));
      }
      if (e.target.id === 'daily-check') {
        if (dq.type === 'spr') resp = $('[data-spr]', box).value.trim();
        if (resp === null || resp === '') return;
        record(dq, isCorrect(dq, resp), 'daily');
        state.daily = { day: dk, resp };
        save();
        render();
      }
    });
  }

  function practice(el, params) {
    const f = {
      section: params.get('section') || 'all',
      domain: params.get('domain') || 'all',
      difficulty: 'all',
      mode: params.get('mode') || 'all'
    };
    if (f.domain !== 'all') f.section = DOMAINS.rw.includes(f.domain) ? 'rw' : 'math';

    const seen = new Set();
    const session = { n: 0, ok: 0 };
    let pool = [], cur = null, st = null;

    function buildPool() {
      const last = lastResults();
      pool = Q.filter(q =>
        (f.section === 'all' || q.section === f.section) &&
        (f.domain === 'all' || q.domain === f.domain) &&
        (f.difficulty === 'all' || q.difficulty === f.difficulty) &&
        (f.mode === 'all' ||
          (f.mode === 'new' && !(q.id in last)) ||
          (f.mode === 'missed' && last[q.id] === false) ||
          (f.mode === 'flagged' && state.review.includes(q.id))));
    }

    function pick() {
      const fresh = pool.filter(q => !seen.has(q.id));
      const from = fresh.length ? fresh : pool;
      cur = from.length ? from[Math.floor(Math.random() * from.length)] : null;
      st = { resp: null, revealed: false };
      if (cur) seen.add(cur.id);
    }

    function draw() {
      const domains = f.section === 'all' ? ALL_DOMAINS : DOMAINS[f.section];
      const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`;
      const flagged = cur && state.review.includes(cur.id);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>Practice</h1><p>${Q.length} questions across all 8 SAT domains. Instant explanations, no limits.</p></div>
          <div class="muted">${session.n ? `This session: ${session.ok}/${session.n} correct` : ''}</div>
        </div>
        <div class="filters">
          <select class="input" data-f="section">${opt('all', 'All sections', f.section)}${opt('rw', SECTIONS.rw, f.section)}${opt('math', SECTIONS.math, f.section)}</select>
          <select class="input" data-f="domain">${opt('all', 'All domains', f.domain)}${domains.map(d => opt(d, d, f.domain)).join('')}</select>
          <select class="input" data-f="difficulty">${opt('all', 'Any difficulty', f.difficulty)}${opt('easy', 'Easy', f.difficulty)}${opt('medium', 'Medium', f.difficulty)}${opt('hard', 'Hard', f.difficulty)}</select>
          <select class="input" data-f="mode">${opt('all', 'All questions', f.mode)}${opt('new', 'Not yet answered', f.mode)}${opt('missed', 'Last answer wrong', f.mode)}${opt('flagged', 'Flagged for review', f.mode)}</select>
        </div>
        <div class="card">
          ${cur ? `
            ${questionHTML(cur, st)}
            <div class="q-actions">
              ${st.revealed ? '<button class="btn primary" data-act="next">Next question</button>' : '<button class="btn primary" data-act="check">Check answer</button><button class="btn" data-act="next">Skip</button>'}
              <span class="spacer"></span>
              ${cur.section === 'math' ? '<a class="btn" href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Desmos</a>' : ''}
              <button class="btn ${flagged ? 'active' : ''}" data-act="flag">${flagged ? 'Flagged' : 'Flag for review'}</button>
            </div>` : `
            <div class="empty"><p>No questions match these filters.</p><button class="btn" data-act="reset">Clear filters</button></div>`}
        </div>`;
    }

    el.addEventListener('change', e => {
      const k = e.target.dataset.f;
      if (!k) return;
      f[k] = e.target.value;
      if (k === 'section') f.domain = 'all';
      buildPool(); pick(); draw();
    });

    el.addEventListener('click', e => {
      const c = e.target.closest('[data-choice]');
      if (c && !st.revealed) {
        st.resp = Number(c.dataset.choice);
        el.querySelectorAll('.choice').forEach(b => b.classList.toggle('selected', b === c));
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'check') check();
      if (act === 'next') { pick(); draw(); }
      if (act === 'flag') {
        state.review = state.review.includes(cur.id) ? state.review.filter(id => id !== cur.id) : [...state.review, cur.id];
        save(); draw();
      }
      if (act === 'reset') { Object.assign(f, { section: 'all', domain: 'all', difficulty: 'all', mode: 'all' }); buildPool(); pick(); draw(); }
    });

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('[data-spr]')) check();
    });

    function check() {
      if (!cur || st.revealed) return;
      if (cur.type === 'spr') st.resp = $('[data-spr]', el).value.trim();
      if (st.resp === null || st.resp === '') return;
      st.revealed = true;
      const ok = isCorrect(cur, st.resp);
      record(cur, ok, 'practice');
      session.n++;
      if (ok) session.ok++;
      draw();
    }

    buildPool();
    const direct = qById[params.get('q')];
    if (direct) { cur = direct; st = { resp: null, revealed: false }; seen.add(direct.id); } else pick();
    draw();
  }

  function exams(el) {
    let phase = 'setup';
    let opts = { section: 'full', size: 'mini' };
    let ex = null, timer = null;

    const plan = (section, size) => {
      const secs = section === 'full' ? ['rw', 'math'] : [section];
      let n = 0, sec = 0;
      for (const s of secs) {
        const count = size === 'mini' ? Math.min(10, Q.filter(q => q.section === s).length) : Q.filter(q => q.section === s).length;
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
        let pool = shuffle(Q.filter(q => q.section === s));
        if (opts.size === 'mini') pool = pool.slice(0, 10);
        qs = qs.concat(pool.sort((a, b) => order[a.difficulty] - order[b.difficulty]));
      }
      ex = { qs, resp: Array(qs.length).fill(null), flags: new Set(), i: 0, started: Date.now(), limit: plan(opts.section, opts.size).sec };
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
        const ok = ex.resp[i] !== null && ex.resp[i] !== '' && isCorrect(q, ex.resp[i]);
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
        <div class="page-head"><div><h1>Mock exams</h1><p>Timed, SAT-paced practice tests with a score estimate and full review.</p></div></div>
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
            ${opt('size', 'full', 'Whole bank', 'Every question in the section')}
          </div>
          <div class="row" style="margin-top:20px">
            <span class="muted">${p.n} questions · ${Math.round(p.sec / 60)} minutes (real SAT pacing)</span>
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
        const cls = [ex.resp[i] !== null && ex.resp[i] !== '' ? 'answered' : '', i === ex.i ? 'current' : '', ex.flags.has(i) ? 'flagged' : ''].join(' ');
        return `<button class="${cls}" data-go="${i}">${i + 1}</button>`;
      }).join('');
      el.innerHTML = `
        <div class="exam-bar">
          <strong>${SECTIONS[q.section]}</strong>
          <span class="muted">Question ${ex.i + 1} of ${ex.qs.length}</span>
          <span class="spacer"></span>
          <span class="timer ${left < 120 ? 'low' : ''}" id="timer">${fmtTime(left)}</span>
          ${q.section === 'math' ? '<a class="btn sm" href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Desmos</a>' : ''}
          <button class="btn sm primary" data-act="submit">Submit</button>
        </div>
        ${ex.confirm ? `<div class="card row" style="margin-bottom:16px"><span>You have ${ex.confirm} unanswered question${ex.confirm === 1 ? '' : 's'}. Submit anyway?</span><span class="spacer"></span>
          <button class="btn sm" data-act="cancel-submit">Keep working</button><button class="btn sm primary" data-act="submit">Submit now</button></div>` : ''}
        <div class="card">
          ${questionHTML(q, { resp: ex.resp[ex.i], revealed: false })}
          <div class="q-actions">
            <button class="btn" data-act="prev" ${ex.i === 0 ? 'disabled' : ''}>Back</button>
            <button class="btn primary" data-act="next" ${ex.i === ex.qs.length - 1 ? 'disabled' : ''}>Next</button>
            <span class="spacer"></span>
            <button class="btn ${ex.flags.has(ex.i) ? 'active' : ''}" data-act="flag">${ex.flags.has(ex.i) ? 'Marked' : 'Mark for review'}</button>
          </div>
          <div class="qnav">${nav}</div>
        </div>`;
    }

    function drawResults() {
      const rows = Object.entries(ex.per).map(([s, v]) =>
        `<div class="row" style="justify-content:space-between"><span>${SECTIONS[s]}</span><span><strong>${Math.round((200 + 600 * v.wok / v.w) / 10) * 10}</strong> <span class="muted">(${v.ok}/${v.n})</span></span></div>`).join('');
      const review = ex.qs.map((q, i) => {
        const ok = ex.resp[i] !== null && ex.resp[i] !== '' && isCorrect(q, ex.resp[i]);
        return `<details class="review"><summary><span class="dot ${ok ? 'ok' : 'bad'}"></span>Question ${i + 1} <span class="muted small">${esc(q.domain)}${ex.resp[i] === null || ex.resp[i] === '' ? ' · unanswered' : ''}</span></summary>${questionHTML(q, { resp: ex.resp[i], revealed: true })}</details>`;
      }).join('');
      const max = Object.keys(ex.per).length * 800;
      el.innerHTML = `
        <div class="page-head"><div><h1>Exam results</h1><p>Finished in ${fmtTime(ex.elapsed)} of ${fmtTime(ex.limit)}.</p></div>
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
        const c = e.target.closest('[data-choice]');
        if (c) {
          ex.resp[ex.i] = Number(c.dataset.choice);
          return drawRunning();
        }
        const g = e.target.closest('[data-go]');
        if (g) { ex.i = Number(g.dataset.go); return drawRunning(); }
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'start') start();
      if (act === 'prev' && ex.i > 0) { ex.i--; drawRunning(); }
      if (act === 'next' && ex.i < ex.qs.length - 1) { ex.i++; drawRunning(); }
      if (act === 'flag') { ex.flags.has(ex.i) ? ex.flags.delete(ex.i) : ex.flags.add(ex.i); drawRunning(); }
      if (act === 'submit') {
        const blank = ex.resp.filter(r => r === null || r === '').length;
        if (blank && !ex.confirm) { ex.confirm = blank; drawRunning(); } else finish();
      }
      if (act === 'cancel-submit') { ex.confirm = 0; drawRunning(); }
      if (act === 'again') { phase = 'setup'; ex = null; drawSetup(); }
    });

    el.addEventListener('input', e => {
      if (phase === 'running' && e.target.matches('[data-spr]')) {
        ex.resp[ex.i] = e.target.value.trim();
        el.querySelectorAll('.qnav button')[ex.i].classList.toggle('answered', ex.resp[ex.i] !== '');
      }
    });

    draw();
    return () => clearInterval(timer);
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
        <div class="page-head"><div><h1>Vocab</h1><p>${V.length} high-value SAT words. Flip a card, then sort it.</p></div></div>
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
      if (act === 'learning' || act === 'known') {
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
        <div class="card empty"><p>Answer a few questions and your breakdown will appear here.</p><a class="btn primary" href="#/practice">Start practicing</a></div>`;
      return;
    }
    const ds = domainStats();
    const bar = (label, s, link) => {
      const a = pct(s.ok, s.n);
      const cls = !s.n ? '' : a >= 80 ? 'ok' : a >= 50 ? 'warn' : 'bad';
      return `<div class="focus-item"><div class="row"><span class="small"><strong>${esc(label)}</strong></span><span class="small muted">${s.n ? `${a}% · ${s.ok}/${s.n}` : 'No data'}</span></div>
        <div class="row"><div class="bar ${cls}" style="flex:1"><span style="width:${s.n ? a : 0}%"></span></div>${link ? `<a class="btn sm" href="${link}">Practice</a>` : ''}</div></div>`;
    };
    const sectionCard = sec => {
      const a = state.attempts.filter(x => qById[x.id]?.section === sec);
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
      const q = qById[x.id];
      if (!q) continue;
      byDiff[q.difficulty].n++;
      if (x.ok) byDiff[q.difficulty].ok++;
    }
    const last = lastResults();
    const missed = [];
    for (let k = state.attempts.length - 1; k >= 0 && missed.length < 8; k--) {
      const id = state.attempts[k].id;
      if (last[id] === false && qById[id] && !missed.includes(id)) missed.push(id);
    }
    const recent = state.attempts.slice(-30);
    const recentAcc = pct(recent.filter(x => x.ok).length, recent.length);

    el.innerHTML = `
      <div class="page-head"><div><h1>Diagnostics</h1><p>Accuracy by section, domain and difficulty. Your last ${recent.length} answers: ${recentAcc}% correct.</p></div>
        <a class="btn" href="#/practice?mode=missed">Redo missed questions</a></div>
      <div class="grid two">${sectionCard('rw')}${sectionCard('math')}</div>
      <div class="grid two" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>By difficulty</h2></div>
          ${['easy', 'medium', 'hard'].map(d => bar(d[0].toUpperCase() + d.slice(1), byDiff[d])).join('')}</div>
        <div class="card"><div class="card-head"><h2>Recent mistakes</h2><span class="muted">Still wrong on last try</span></div>
          ${missed.length ? `<div class="table-wrap"><table><tbody>${missed.map(id => {
            const q = qById[id];
            return `<tr><td><span class="small">${esc(q.domain)}</span><br><span class="muted small">${esc((q.passage || q.prompt).slice(0, 70))}…</span></td><td class="num"><a class="btn sm" href="#/practice?q=${id}">Retry</a></td></tr>`;
          }).join('')}</tbody></table></div>` : '<div class="empty"><p>No outstanding mistakes.</p></div>'}
        </div>
      </div>`;
  }

  function schedule(el) {
    const today = dayKey();
    const goal = state.profile.dailyGoal || 10;
    const weak = weakDomains();
    const days = daysUntilTest();
    const missedCount = Object.entries(lastResults()).filter(([id, ok]) => !ok && qById[id]).length;
    const isSat = new Date().getDay() === 6;

    const tasks = [
      { id: 'goal', title: `Answer ${goal} practice questions`, sub: `${todayCount()} done so far today`, auto: todayCount() >= goal, href: '#/practice' },
      { id: 'focus', title: `Focus drill: ${weak[0]}`, sub: 'Your weakest area right now', href: `#/practice?domain=${encodeURIComponent(weak[0])}` },
      { id: 'vocab', title: 'Study 10 vocab cards', sub: 'Flip and sort until they stick', href: '#/vocab' }
    ];
    if (missedCount) tasks.push({ id: 'missed', title: `Redo ${missedCount} missed question${missedCount === 1 ? '' : 's'}`, sub: 'Fix mistakes while they\'re fresh', href: '#/practice?mode=missed' });
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
        : dow === 0 ? 'Light day: vocab and flagged questions'
        : `Drill ${weak[k % weak.length]}, then mixed practice`;
      week += `<div class="week-day ${k === 0 ? 'today' : ''}"><div class="d">${k === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</div><div>${esc(what)}</div></div>`;
    }

    const phase = days == null ? null
      : days > 56 ? ['Foundations', 'Cover every domain and build steady habits. Untimed practice is fine.']
      : days > 21 ? ['Targeted practice', 'Spend most of your time on your two weakest domains. Take a mock every week.']
      : days >= 0 ? ['Exam simulation', 'Take timed mocks, review every mistake, and keep vocab fresh.']
      : null;
    const doneCount = tasks.filter(t => t.auto || done.has(t.id)).length;

    el.innerHTML = `
      <div class="page-head"><div><h1>Schedule</h1><p>${days == null ? 'Add your test date in <a href="#/settings">Settings</a> for a phased plan.' : days >= 0 ? `${days} day${days === 1 ? '' : 's'} to go${phase ? ` · Phase: ${phase[0]}` : ''}` : 'Your test date has passed. <a href="#/settings">Update it</a>.'}</p></div></div>
      ${phase ? `<div class="card"><strong>${phase[0]}.</strong> <span class="muted">${phase[1]}</span></div>` : ''}
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
          <label class="field">Name<input class="input" name="name" value="${esc(p.name)}" placeholder="Optional"></label>
          <label class="field">Test date<input class="input" type="date" name="testDate" value="${esc(p.testDate)}"></label>
          <label class="field">Target score<input class="input" type="number" name="targetScore" min="400" max="1600" step="10" value="${esc(p.targetScore)}"></label>
          <label class="field">Daily question goal<input class="input" type="number" name="dailyGoal" min="1" max="200" value="${esc(p.dailyGoal)}"></label>
        </div>
        <div class="q-actions"><button class="btn primary" type="submit">Save</button><span class="muted small" id="saved"></span></div>
      </form>
      <div class="card">
        <div class="card-head"><h2>Your data</h2></div>
        <p class="muted small" style="margin-top:0">${state.attempts.length} answers, ${state.exams.length} exams, ${Object.keys(state.vocab).length} vocab cards sorted. Export a backup to move your progress to another device.</p>
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

  const routes = { home, practice, exams, vocab, diagnostics, schedule, settings };
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
    // A fresh container per render drops the previous view's listeners.
    const view = document.createElement('div');
    main.replaceChildren(view);
    cleanup = routes[name](view, new URLSearchParams(qs || '')) || null;
    app.classList.remove('drawer');
    window.scrollTo(0, 0);
  }

  try { if (localStorage.getItem('satstat:collapsed') === '1') app.classList.add('collapsed'); } catch { /* ignore */ }
  $('#collapse').addEventListener('click', () => {
    app.classList.toggle('collapsed');
    try { localStorage.setItem('satstat:collapsed', app.classList.contains('collapsed') ? '1' : '0'); } catch { /* ignore */ }
  });
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
