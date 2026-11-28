/* Claude coach: chat with Claude about your training, using your own Anthropic API key (stored only on
   this phone, never in backups). Claude sees a summary of your data with each question, and can PROPOSE
   changes (plan, progression, goals) as cards. Nothing changes until you tap Apply.
   The Anthropic TypeScript SDK is bundled in vendor/ and loaded only when the coach is used. */
const CO_KEY = 'fit-claude',
  CO_CHAT = 'fit-chat',
  SDK_URL = 'vendor/anthropic-sdk-1.8.0.min.mjs';
const CO_MODELS = [
  ['claude-opus-5-5', 'Opus 5.5', 'Most capable (default)', 4, 20, 0.2],
  ['claude-sonnet-5-5', 'Sonnet 5.5', 'Faster, about half the cost', 2, 10, 0.1],
  ['claude-haiku-5-5', 'Haiku 5.5', 'Fastest and cheapest', 0.1, 0.5, 0.01]
];
let CO = { busy: false, live: null, err: '', sdk: null, set: false },
  COM = null;
function coCfg() {
  try {
    const c = JSON.parse(localStorage.getItem(CO_KEY) || 'null');
    return c && c.key ? c : null;
  } catch (e) {
    return null;
  }
}
function coSetCfg(c) {
  try {
    if (c) localStorage.setItem(CO_KEY, JSON.stringify(c));
    else localStorage.removeItem(CO_KEY);
  } catch (e) {}
}
function coModel() {
  const c = coCfg();
  return (c && CO_MODELS.find(m => m[0] === c.model)) || CO_MODELS[0];
}
/* conversation: API-format messages (assistant content kept whole, thinking blocks included) + proposal states */
/* Claude's thinking blocks are bound to the exact conversation that produced them (system prompt, tools and every
   earlier message, byte for byte). So the system prompt is frozen, the history is only ever appended to, and the data
   snapshot travels inside the user's message. Removing ALL thinking blocks is always allowed. */
function coStrip(C) {
  C.m.forEach(m => {
    if (m.role === 'assistant' && Array.isArray(m.content))
      m.content = m.content.filter(b => b.type !== 'thinking' && b.type !== 'redacted_thinking');
  });
}
function coLoad() {
  if (COM) return COM;
  try {
    COM = JSON.parse(localStorage.getItem(CO_CHAT) || 'null');
  } catch (e) {}
  if (!COM || !Array.isArray(COM.m)) COM = { m: [], p: {}, cost: 0, v: 2 };
  if ((COM.v || 1) < 2) {
    coStrip(COM);
    COM.v = 2;
    COM.snap = null;
    try {
      localStorage.setItem(CO_CHAT, JSON.stringify(COM));
    } catch (e) {}
  }
  return COM;
}
function coSave() {
  try {
    localStorage.setItem(CO_CHAT, JSON.stringify(COM));
  } catch (e) {}
}

/* ---------- what Claude is told ---------- */
const CO_SYS = `You are the coach inside the user's personal gym-tracking app. You help with training, progression, exercise choice and form, recovery, and nutrition for their goals.

Messages from the user may start with an APP DATA SNAPSHOT block: the app's current data. The newest snapshot is the current state; older ones show what it was earlier in the chat. It covers profile, goals, weekly plan, recent logged sets (weight × reps, @ = reps in reserve), body weight, notes and today's food. Use their real numbers and exercise names; never invent data. If something isn't in the snapshot, say so.

The app's progression rules: exercises use a sets × rep range (e.g. 3×8–12). Double progression adds reps until every set hits the top of the range, then adds weight. Warm-ups (under 70% of the day's top weight) don't count. Effort is logged as RIR (reps in reserve); RPE = 10 − RIR.

You can propose changes with tools: propose_plan_changes (exercises, sets and reps, days), propose_progression (method, weight step, effort, for one exercise or all), and propose_goal. A proposal appears as a card the user applies or dismisses; nothing changes until they tap Apply, so never say a change has been made. Use exact exercise names and day names from the snapshot. Write sets_reps like 3×8–12 or 4×6–8. Only propose changes the user asked for or clearly agreed to; for general questions, just answer.

Safety: for pain, injury or medical questions, give general guidance, suggest easing off, and recommend seeing a physio or doctor for anything sharp, persistent or worsening. No extreme diets.

Style: this is a phone screen. Be brief and specific: short paragraphs or "- " bullet lists, no tables, no headings unless asked. Use kg and British English.`;
function coSnapshot() {
  const lines = [],
    L = S.log,
    from = addDays(today, -42);
  lines.push(
    `Today: ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (${today}). Today's session: ${PLAN[todayIdx].n}.${inDl() ? ' This is a deload week.' : ''}`
  );
  const p = prof();
  lines.push(
    p
      ? `Profile: ${p.sex === 'f' ? 'female' : 'male'}, ${p.age} y, ${p.h} cm, ${bodyW()} kg. Diet goal: ${GOALS[S.goal][0]}, ${target()} kcal and ${protTarget()} g protein a day.`
      : `Profile: not set. Diet goal: ${GOALS[S.goal][0]}, ${target()} kcal and ${protTarget()} g protein a day.`
  );
  lines.push(goalsTxt());
  lines.push('Weekly plan (day: session — focus):');
  PLAN.forEach((d, i) => {
    lines.push(`- ${DAYS[i]}: ${d.n}${d.n === 'Rest day' ? '' : ' — ' + d.f}`);
    if (d.n !== 'Rest day')
      d.e.forEach(e => {
        const a = activeName(e[0]),
          P = (S.prog || {})[a],
          su = (S.setup || {})[a];
        lines.push(
          `    • ${e[0]} ${e[1]}${a !== e[0] ? ' (currently swapped for ' + a + ')' : ''}${P ? ' [own progression: ' + JSON.stringify(P) + ']' : ''}${su ? ' [setup: ' + su + ']' : ''}`
        );
      });
  });
  const D = Object.assign({ m: 'double', inc: 'c', e: '1-2' }, S.progDef || {});
  lines.push(
    `Default progression: method ${D.m}, weight step ${{ s: 'small', c: 'comfortable', l: 'big' }[D.inc]}, effort ${D.e} RIR.`
  );
  lines.push('Logged sets, last 6 weeks (date: sets):');
  Object.keys(L)
    .filter(n => L[n].some(x => x.d >= from))
    .sort()
    .forEach(n => {
      const by = {};
      L[n]
        .filter(x => x.d >= from)
        .forEach(x => (by[x.d] = by[x.d] || []).push(x.w + '×' + x.r + (x.q != null ? '@' + x.q : '')));
      lines.push(
        `- ${n}: ` +
          Object.keys(by)
            .sort()
            .map(d => d.slice(5) + ' ' + by[d].join(' '))
            .join('; ')
      );
    });
  if (S.weights.length)
    lines.push(
      'Body weight: ' +
        S.weights
          .slice(-8)
          .map(x => x.d.slice(5) + ' ' + x.w + 'kg')
          .join(', ')
    );
  const nt = Object.entries(notesFor(weekKey));
  if (nt.length) lines.push('Lift notes this week: ' + nt.map(([k, v]) => k + ': ' + v).join(' | '));
  lines.push(
    `Food today: ${eaten()} of ${target()} kcal, ${prot()} of ${protTarget()} g protein.${(S.foods[today] || []).length ? ' Extra foods: ' + S.foods[today].map(f => f.n + ' ' + f.k + 'kcal').join(', ') + '.' : ''}`
  );
  return 'APP DATA SNAPSHOT\n' + lines.join('\n');
}

/* ---------- tools (proposals only) ---------- */
const CO_TOOLS = [
  {
    name: 'propose_plan_changes',
    description:
      'Propose changes to the weekly plan. Shown to the user as a card with Apply and Dismiss; nothing changes until they apply it.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'One short sentence describing the change for the card title.'
        },
        changes: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: [
                  'swap_exercise',
                  'set_sets_reps',
                  'add_exercise',
                  'remove_exercise',
                  'move_exercise',
                  'rename_day',
                  'make_rest_day',
                  'make_training_day'
                ]
              },
              day: { type: 'string', enum: DAYS },
              exercise: {
                type: 'string',
                description: 'Existing exercise name on that day, exactly as in the snapshot.'
              },
              new_exercise: {
                type: 'string',
                description: 'New exercise name (swap_exercise, add_exercise).'
              },
              sets_reps: {
                type: 'string',
                description: 'Like 3×8–12 (set_sets_reps, add_exercise, swap_exercise optional).'
              },
              position: {
                type: 'integer',
                description: '1-based position (add_exercise, move_exercise). Omit to add at the end.'
              },
              day_name: { type: 'string', description: 'Session name (rename_day, make_training_day).' },
              focus: { type: 'string', description: 'Short focus line (rename_day, make_training_day).' }
            },
            required: ['action', 'day']
          }
        }
      },
      required: ['summary', 'changes']
    }
  },
  {
    name: 'propose_progression',
    description:
      'Propose progression settings, for one exercise or as the default for all. Shown as a card the user applies or dismisses.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        exercise: { type: 'string', description: 'Exact exercise name, or "all" for the default.' },
        method: { type: 'string', enum: ['double', 'linear'] },
        increment: { type: 'string', enum: ['small', 'comfortable', 'big'] },
        effort: { type: 'string', enum: ['0-1', '1-2', '2-3'], description: 'Target reps in reserve.' },
        reason: { type: 'string' }
      },
      required: ['exercise']
    }
  },
  {
    name: 'propose_goal',
    description:
      "Propose a new goal: a lift's estimated max or body weight by a date. Shown as a card the user applies or dismisses.",
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['lift', 'bw'] },
        lift: { type: 'string', description: 'Lift name without variation, e.g. "Bench press" (type lift).' },
        target_kg: { type: 'number' },
        date: { type: 'string', description: 'YYYY-MM-DD, in the future.' }
      },
      required: ['type', 'target_kg', 'date']
    }
  }
];
const SETS_REPS_RE = /^\d+\s*[×xX]\s*\d+(\s*[–-]\s*\d+)?(\s+each)?$/;
const coFind = (d, n) =>
  PLAN[d].e.findIndex(
    e =>
      e[0].toLowerCase() === String(n || '').toLowerCase() ||
      activeName(e[0]).toLowerCase() === String(n || '').toLowerCase()
  );
/* check a proposal against the plan as it is now; returns an error string or '' */
function coCheck(name, inp) {
  if (!inp || typeof inp !== 'object') return 'input missing';
  if (name === 'propose_plan_changes') {
    if (typeof inp.summary !== 'string' || !Array.isArray(inp.changes) || !inp.changes.length)
      return 'summary and at least one change are required';
    const P = JSON.parse(JSON.stringify(PLAN));
    for (const c of inp.changes) {
      const d = DAYS.indexOf(c && c.day);
      if (d < 0) return 'unknown day ' + (c && c.day);
      const rest = P[d].n === 'Rest day',
        f = () =>
          P[d].e.findIndex(
            e =>
              e[0].toLowerCase() === String(c.exercise || '').toLowerCase() ||
              activeName(e[0]).toLowerCase() === String(c.exercise || '').toLowerCase()
          );
      switch (c.action) {
        case 'swap_exercise':
        case 'set_sets_reps':
        case 'remove_exercise':
        case 'move_exercise': {
          if (rest) return DAYS[d] + ' is a rest day';
          const i = f();
          if (i < 0) return `"${c.exercise}" is not on ${DAYS[d]}`;
          if (c.action === 'swap_exercise') {
            if (!c.new_exercise || c.new_exercise.length > 60) return 'new_exercise is required';
            if (c.sets_reps && !SETS_REPS_RE.test(c.sets_reps)) return 'sets_reps must look like 3×8–12';
            P[d].e[i] = [c.new_exercise, c.sets_reps || P[d].e[i][1]];
          }
          if (c.action === 'set_sets_reps') {
            if (!SETS_REPS_RE.test(c.sets_reps || '')) return 'sets_reps must look like 3×8–12';
            P[d].e[i][1] = c.sets_reps;
          }
          if (c.action === 'remove_exercise') P[d].e.splice(i, 1);
          if (c.action === 'move_exercise') {
            if (!(c.position >= 1)) return 'position is required';
            const x = P[d].e.splice(i, 1)[0];
            P[d].e.splice(Math.min(c.position - 1, P[d].e.length), 0, x);
          }
          break;
        }
        case 'add_exercise': {
          if (rest) return DAYS[d] + ' is a rest day: make it a training day first';
          if (!c.new_exercise || c.new_exercise.length > 60) return 'new_exercise is required';
          if (!SETS_REPS_RE.test(c.sets_reps || '')) return 'sets_reps must look like 3×8–12';
          P[d].e.splice(c.position >= 1 ? Math.min(c.position - 1, P[d].e.length) : P[d].e.length, 0, [
            c.new_exercise,
            c.sets_reps
          ]);
          break;
        }
        case 'rename_day':
          if (!c.day_name && !c.focus) return 'day_name or focus is required';
          break;
        case 'make_rest_day':
          P[d] = { n: 'Rest day', f: 'Recovery', e: [['Walk, eat well, sleep 8h', '—']] };
          break;
        case 'make_training_day':
          P[d] = { n: c.day_name || 'Training', f: c.focus || '', e: [] };
          break;
        default:
          return 'unknown action ' + c.action;
      }
    }
    return '';
  }
  if (name === 'propose_progression') {
    if (!inp.exercise) return 'exercise is required';
    if (inp.exercise !== 'all' && !PLAN.some((d, i) => coFind(i, inp.exercise) >= 0) && !S.log[inp.exercise])
      return `"${inp.exercise}" is not in the plan`;
    if (!inp.method && !inp.increment && !inp.effort) return 'nothing to change';
    return '';
  }
  if (name === 'propose_goal') {
    if (!(inp.target_kg >= 5 && inp.target_kg <= 500)) return 'target_kg must be between 5 and 500';
    if (!/^\d{4}-\d\d-\d\d$/.test(inp.date || '') || inp.date <= today)
      return 'date must be YYYY-MM-DD in the future';
    if (inp.type === 'lift' && !inp.lift) return 'lift is required';
    if (inp.type !== 'lift' && inp.type !== 'bw') return 'type must be lift or bw';
    return '';
  }
  return 'unknown tool';
}
function coApply(name, inp) {
  if (name === 'propose_plan_changes') {
    ownPlan();
    inp.changes.forEach(c => {
      const d = DAYS.indexOf(c.day),
        i = coFind(d, c.exercise);
      switch (c.action) {
        case 'swap_exercise':
          PLAN[d].e[i] = [c.new_exercise, c.sets_reps || PLAN[d].e[i][1]];
          break;
        case 'set_sets_reps':
          PLAN[d].e[i][1] = c.sets_reps;
          break;
        case 'remove_exercise':
          PLAN[d].e.splice(i, 1);
          break;
        case 'move_exercise': {
          const x = PLAN[d].e.splice(i, 1)[0];
          PLAN[d].e.splice(Math.min(c.position - 1, PLAN[d].e.length), 0, x);
          break;
        }
        case 'add_exercise':
          PLAN[d].e.splice(
            c.position >= 1 ? Math.min(c.position - 1, PLAN[d].e.length) : PLAN[d].e.length,
            0,
            [c.new_exercise, c.sets_reps]
          );
          break;
        case 'rename_day':
          if (c.day_name) PLAN[d].n = c.day_name;
          if (c.focus) PLAN[d].f = c.focus;
          break;
        case 'make_rest_day':
          PLAN[d] = { n: 'Rest day', f: 'Recovery', e: [['Walk, eat well, sleep 8h', '—']] };
          break;
        case 'make_training_day':
          PLAN[d] = { n: c.day_name || 'Training', f: c.focus || '', e: [] };
          break;
      }
    });
  }
  if (name === 'propose_progression') {
    const v = {};
    if (inp.method) v.m = inp.method;
    if (inp.increment) v.inc = { small: 's', comfortable: 'c', big: 'l' }[inp.increment];
    if (inp.effort) v.e = inp.effort;
    if (inp.exercise === 'all') S.progDef = Object.assign({}, S.progDef || {}, v);
    else {
      const a = (() => {
        for (let d = 0; d < 7; d++) {
          const i = coFind(d, inp.exercise);
          if (i >= 0) return activeName(PLAN[d].e[i][0]);
        }
        return inp.exercise;
      })();
      S.prog = S.prog || {};
      S.prog[a] = Object.assign({}, S.prog[a] || {}, v);
    }
  }
  if (name === 'propose_goal') {
    S.goals = S.goals || [];
    const g = {
      id: 'g' + Date.now().toString(36),
      t: inp.type,
      lift: inp.type === 'lift' ? inp.lift : null,
      target: inp.target_kg,
      date: inp.date
    };
    g.s = goalState(Object.assign({}, g, { s: null })).cur || null;
    S.goals.push(g);
  }
  save();
}
function coDesc(name, inp) {
  if (name === 'propose_plan_changes')
    return inp.changes.map(c => {
      const x = c.exercise ? esc(c.exercise) : '';
      switch (c.action) {
        case 'swap_exercise':
          return `${c.day}: ${x} → <b>${esc(c.new_exercise)}</b>${c.sets_reps ? ' ' + esc(c.sets_reps) : ''}`;
        case 'set_sets_reps':
          return `${c.day}: ${x} → <b>${esc(c.sets_reps)}</b>`;
        case 'add_exercise':
          return `${c.day}: add <b>${esc(c.new_exercise)}</b> ${esc(c.sets_reps)}${c.position ? ' at #' + c.position : ''}`;
        case 'remove_exercise':
          return `${c.day}: remove <b>${x}</b>`;
        case 'move_exercise':
          return `${c.day}: move ${x} to #${c.position}`;
        case 'rename_day':
          return `${c.day}: ${c.day_name ? 'name <b>' + esc(c.day_name) + '</b>' : ''}${c.focus ? ' focus “' + esc(c.focus) + '”' : ''}`;
        case 'make_rest_day':
          return `${c.day}: make it a <b>rest day</b>`;
        case 'make_training_day':
          return `${c.day}: make it a training day “${esc(c.day_name || 'Training')}”`;
      }
      return '';
    });
  if (name === 'propose_progression')
    return [
      `${inp.exercise === 'all' ? 'All exercises (default)' : esc(inp.exercise)}: ${[inp.method && 'method ' + inp.method, inp.increment && inp.increment + ' weight steps', inp.effort && inp.effort + ' RIR'].filter(Boolean).join(', ')}`
    ];
  if (name === 'propose_goal')
    return [
      `${inp.type === 'bw' ? 'Body weight' : esc(inp.lift)}: <b>${inp.target_kg} kg</b> by ${fmtD(inp.date)}`
    ];
  return [];
}
const CO_TITLE = {
  propose_plan_changes: 'Plan change',
  propose_progression: 'Progression change',
  propose_goal: 'New goal'
};

/* ---------- talking to Claude ---------- */
async function coClient() {
  const c = coCfg();
  if (!c) throw new Error('no key');
  if (!CO.sdk) CO.sdk = await import(new URL(SDK_URL, document.baseURI).href);
  return new CO.sdk.Anthropic({ apiKey: c.key, dangerouslyAllowBrowser: true, maxRetries: 2 });
}
function coErr(e) {
  const A = CO.sdk || {};
  return A.AuthenticationError && e instanceof A.AuthenticationError
    ? 'Your API key wasn’t accepted. Check it in the coach settings.'
    : A.PermissionDeniedError && e instanceof A.PermissionDeniedError
      ? 'This API key isn’t allowed to use that model. Pick another model in the coach settings, or check your Anthropic account.'
      : A.RateLimitError && e instanceof A.RateLimitError
        ? 'Too many requests right now. Wait a minute and try again.'
        : A.OverloadedError && e instanceof A.OverloadedError
          ? 'Claude is busy right now. Try again in a moment.'
          : A.BadRequestError && e instanceof A.BadRequestError
            ? /credit|billing|balance/i.test(e.message)
              ? 'Your Anthropic account is out of credit. Add credit at console.anthropic.com.'
              : 'The request wasn’t accepted (' + esc(String(e.message).slice(0, 140)) + ').'
            : A.APIConnectionError && e instanceof A.APIConnectionError
              ? 'Couldn’t reach Claude. Check your internet connection.'
              : A.APIError && e instanceof A.APIError
                ? 'Claude returned an error (' + e.status + '). Try again.'
                : 'Something went wrong talking to Claude. Try again.';
}
async function coSend(text, label) {
  text = String(text || '').trim();
  if (!text || CO.busy) return;
  if (!coCfg()) {
    toast('Add your API key first.');
    return;
  }
  const C = coLoad(),
    snap = coSnapshot();
  /* a fresh snapshot only when the data changed since the last one sent; it is part of this message from now on */
  C.m.push({
    role: 'user',
    content:
      snap !== C.snap
        ? [
            { type: 'text', text: snap },
            { type: 'text', text: text }
          ]
        : text,
    q: text,
    ...(label ? { label } : {})
  });
  C.snap = snap;
  coTrim(C);
  coSave();
  CO.busy = true;
  CO.err = '';
  CO.live = { t: '', think: true };
  coRender(true);
  const msgs = () => C.m.map(m => ({ role: m.role, content: m.content }));
  let guard = 0,
    jsonRetry = 0,
    stripped = false;
  try {
    const client = await coClient(),
      M = coModel();
    while (guard++ < 6) {
      const req = {
        model: M[0],
        max_tokens: 32000,
        output_config: { effort: 'medium' },
        cache_control: { type: 'ephemeral' },
        system: [{ type: 'text', text: CO_SYS }],
        tools: CO_TOOLS,
        messages: msgs()
      };
      /* server-side fallback if a safety classifier declines (Opus and Sonnet; Haiku has none) */
      const fb = M[0] !== 'claude-haiku-5-5',
        stream = fb
          ? client.beta.messages.stream({
              ...req,
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default'
            })
          : client.messages.stream(req);
      CO.live = { t: '', think: true };
      coLive();
      stream.on('streamEvent', ev => {
        if (ev.type === 'content_block_start' && ev.content_block.type === 'tool_use') {
          CO.live.tool = true;
          coLive();
        }
      });
      stream.on('text', d => {
        CO.live.think = false;
        CO.live.t += d;
        coLive();
      });
      let msg;
      try {
        msg = await stream.finalMessage();
        jsonRetry = 0;
      } catch (e) {
        /* earlier thinking blocks no longer match the conversation: drop them all (allowed) and retry once */
        if (
          !stripped &&
          CO.sdk.BadRequestError &&
          e instanceof CO.sdk.BadRequestError &&
          /thinking|signature|prefix/i.test(String(e.message))
        ) {
          stripped = true;
          coStrip(C);
          coSave();
          continue;
        }
        if (e instanceof CO.sdk.APIError || jsonRetry++ >= 1) throw e;
        continue;
      }
      const u = msg.usage || {};
      C.cost +=
        ((u.input_tokens || 0) * M[3] +
          (u.cache_creation_input_tokens || 0) * M[3] * 1.25 +
          (u.cache_read_input_tokens || 0) * M[5] +
          (u.output_tokens || 0) * M[4]) /
        1e6;
      const uses = msg.content.filter(b => b.type === 'tool_use'),
        /* a turn whose tool calls can't run is kept without them; its thinking (the trailing run) goes too, which keeps the rest valid */
        noTools = () =>
          msg.content.filter(
            b => b.type !== 'tool_use' && b.type !== 'thinking' && b.type !== 'redacted_thinking'
          );
      if (msg.stop_reason === 'refusal') {
        C.m.push({
          role: 'assistant',
          content: uses.length ? noTools() : msg.content,
          note: 'Claude couldn’t help with that one. Try asking differently.'
        });
        break;
      }
      if (msg.stop_reason === 'pause_turn') {
        C.m.push({ role: 'assistant', content: msg.content });
        continue;
      }
      if (!uses.length) {
        C.m.push({ role: 'assistant', content: msg.content });
        break;
      }
      if (msg.stop_reason === 'max_tokens') {
        C.m.push({
          role: 'assistant',
          content: noTools(),
          note: 'The reply was too long and got cut off. Try a narrower question.'
        });
        break;
      }
      C.m.push({ role: 'assistant', content: msg.content });
      const res = uses.map(b => {
        const er = coCheck(b.name, b.input);
        if (er)
          return {
            type: 'tool_result',
            tool_use_id: b.id,
            is_error: true,
            content: 'Not shown to the user: ' + er + '. Fix it and propose again.'
          };
        C.p[b.id] = 'open';
        return {
          type: 'tool_result',
          tool_use_id: b.id,
          content:
            'Shown to the user as a proposal card with Apply and Dismiss buttons. Nothing has changed yet.'
        };
      });
      C.m.push({ role: 'user', content: res });
      coSave();
    }
  } catch (e) {
    CO.err = coErr(e);
  }
  CO.busy = false;
  CO.live = null;
  coSave();
  coRender(true);
}
/* very long chats: drop the oldest turns together with every thinking block (allowed), and resend the data snapshot */
function coTrim(C) {
  if (C.m.length <= 60) return;
  let k = C.m.length - 50;
  while (k < C.m.length && !(C.m[k].role === 'user' && C.m[k].q)) k++;
  if (k >= C.m.length - 1) return;
  C.m = C.m.slice(k);
  coStrip(C);
  const f = C.m[0],
    snap = coSnapshot();
  if (typeof f.content === 'string') {
    f.content = [
      { type: 'text', text: snap },
      { type: 'text', text: f.content }
    ];
    C.snap = snap;
  } else C.snap = f.content[0].text;
}
function coPropose(id, ok) {
  const C = coLoad();
  if (C.p[id] !== 'open') return;
  let b = null;
  C.m.forEach(m => {
    if (m.role === 'assistant' && Array.isArray(m.content))
      m.content.forEach(x => {
        if (x.type === 'tool_use' && x.id === id) b = x;
      });
  });
  if (!b) return;
  if (ok) {
    const er = coCheck(b.name, b.input);
    if (er) {
      toast('This change no longer fits your plan (' + esc(er) + '). Ask Claude again.');
      return;
    }
    coApply(b.name, b.input);
    C.p[id] = 'applied';
    toast('Applied');
  } else C.p[id] = 'dismissed';
  coSave();
  draw();
}

/* ---------- screen ---------- */
function mdLite(t) {
  const out = [];
  let ul = false;
  String(t || '')
    .split('\n')
    .forEach(l => {
      const b = l.match(/^\s*[-•*]\s+(.*)/),
        n = l.match(/^\s*(\d+)[.)]\s+(.*)/),
        h = l.match(/^#{1,4}\s+(.*)/);
      const inl = s =>
        esc(s)
          .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
          .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
      if (b || n) {
        if (!ul) {
          out.push('<ul>');
          ul = true;
        }
        out.push('<li>' + inl(b ? b[1] : n[2]) + '</li>');
      } else {
        if (ul) {
          out.push('</ul>');
          ul = false;
        }
        if (h) out.push('<p><b>' + inl(h[1]) + '</b></p>');
        else if (l.trim()) out.push('<p>' + inl(l) + '</p>');
      }
    });
  if (ul) out.push('</ul>');
  return out.join('');
}
function coBubbles() {
  const C = coLoad(),
    out = [];
  C.m.forEach(m => {
    if (m.role === 'user') {
      const q = m.q != null ? m.q : typeof m.content === 'string' ? m.content : null;
      if (q != null)
        out.push(
          `<div class="cb u">${m.label ? `<span class="cb-l">${ICO.sparkle}${esc(m.label)}</span>` : esc(q).replace(/\n/g, '<br>')}</div>`
        );
      return;
    }
    const tx = (m.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n\n');
    if (tx.trim()) out.push(`<div class="cb a">${mdLite(tx)}</div>`);
    (m.content || [])
      .filter(b => b.type === 'tool_use')
      .forEach(b => {
        const st = C.p[b.id];
        if (!st) return;
        out.push(
          `<div class="pc ${st}"><div class="pc-h">${ICO.sparkle}<b>${CO_TITLE[b.name] || 'Proposal'}</b>${st === 'applied' ? '<span class="pill up">Applied</span>' : st === 'dismissed' ? '<span class="pill">Dismissed</span>' : ''}</div>${b.input.summary ? `<div class="pc-s">${esc(b.input.summary)}</div>` : ''}${b.input.reason ? `<div class="pc-s">${esc(b.input.reason)}</div>` : ''}<ul>${coDesc(
            b.name,
            b.input
          )
            .map(x => '<li>' + x + '</li>')
            .join(
              ''
            )}</ul>${st === 'open' ? `<div class="pc-a"><button class="btn sm ghost" onclick="coPropose('${b.id}',false)">Dismiss</button><button class="btn sm" onclick="coPropose('${b.id}',true)">Apply</button></div>` : ''}</div>`
        );
      });
    if (m.note) out.push(`<div class="cb n">${esc(m.note)}</div>`);
  });
  return out.join('');
}
function coLiveHtml() {
  const L = CO.live;
  if (!L) return '';
  return `<div class="cb a live">${L.t ? mdLite(L.t) : ''}${L.think || L.tool ? `<div class="co-think"><i class="spin"></i>${L.tool ? 'Preparing a proposal…' : 'Thinking…'}</div>` : ''}</div>`;
}
function coLive() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('co-live');
  if (el) {
    el.innerHTML = coLiveHtml();
    coScroll();
  }
}
function coScroll() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('co-end');
  if (el) el.scrollIntoView({ block: 'end' });
}
function coRender(scroll) {
  if (S.tab !== 'coach') return;
  draw();
  if (scroll) setTimeout(coScroll, 30);
}
const CO_Q = [
  'How did my training go this week?',
  'Am I on track for my goals?',
  'My shoulder aches on bench. What should I change?',
  'Make Friday’s session shorter',
  'What should I eat before training?'
];
function coachView() {
  const c = coCfg(),
    C = coLoad(),
    M = coModel();
  if (!c || CO.set) return `<h1>Coach</h1>${coSetup(c)}`;
  return `<div class="co-head"><h1>Coach</h1><button class="ib" onclick="CO.set=true;draw()" aria-label="Coach settings">${IC('tools')}</button></div>
<div class="co-meta">${M[1]} · ${C.m.length ? 'this chat ≈ $' + C.cost.toFixed(C.cost < 1 ? 3 : 2) : 'ask about training, food or your plan'}${C.m.length ? ` · <button class="link" onclick="coClear()">New chat</button>` : ''}</div>
<div class="co-chat">${C.m.length ? '' : `<div class="cb a">${mdLite('Hi' + (S.prof && S.prof.n ? ' ' + esc(S.prof.n) : '') + '. I can see your plan, the last 6 weeks of training, your goals and today’s food. Ask me anything, or ask me to change your plan: I’ll suggest it and you decide.')}</div><div class="co-q">${CO_Q.map((q, i) => `<button class="chip" onclick="coSend(CO_Q[${i}])">${esc(q)}</button>`).join('')}</div>`}
${coBubbles()}<div id="co-live">${coLiveHtml()}</div>${CO.err ? `<div class="cb n err">${CO.err} <button class="link" onclick="coRetry()">Try again</button></div>` : ''}<div id="co-end"></div></div>
<div class="co-in"><textarea id="co-t" rows="1" placeholder="Ask your coach…" aria-label="Message" oninput="this.style.height='auto';this.style.height=Math.min(140,this.scrollHeight)+'px'" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();coGo()}" ${CO.busy ? 'disabled' : ''}></textarea><button class="btn" onclick="coGo()" ${CO.busy ? 'disabled' : ''} aria-label="Send">${ICO.right}</button></div>`;
}
function coGo() {
  const el = document.getElementById('co-t');
  if (!el) return;
  const v = el.value;
  el.value = '';
  coSend(v);
}
function coRetry() {
  const C = coLoad();
  const last = C.m[C.m.length - 1];
  if (last && last.role === 'user' && (last.q != null || typeof last.content === 'string')) {
    C.m.pop();
    C.snap = null;
    CO.err = '';
    coSend(last.q != null ? last.q : last.content, last.label);
  } else {
    CO.err = '';
    draw();
  }
}
function coClear() {
  COM = { m: [], p: {}, cost: 0, v: 2 };
  coSave();
  CO.err = '';
  draw();
}
function coSetup(c) {
  const M = coModel();
  return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--violet)">${ICO.sparkle}</span><div class="ct"><h2>${c ? 'Coach settings' : 'Ask Claude about your training'}</h2><div class="mu sm">Uses your own Anthropic API key</div></div></div>
${
  c
    ? ''
    : `<div class="mu" style="margin-bottom:10px">Claude can review your week, answer questions about training and food, and suggest changes to your plan, which you approve with one tap.</div>
<details class="rcp" open><summary><b>How to get an API key</b><br><span class="mu">About 3 minutes, once</span></summary><ol class="cl-steps">
<li>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a> and sign in or create an account. This is separate from a Claude.ai subscription.</li>
<li>Under <b>Billing</b>, add some credit. Pay-as-you-go: a typical question costs about 2–5p with Opus 5.5, about half that with Sonnet 5.5, and under 1p with Haiku 5.5. The chat shows a running estimate.</li>
<li>Under <b>API keys</b>, create a key, copy it and paste it below.</li></ol></details>`
}
<div class="field"><label for="co-k">API key</label><input id="co-k" type="password" autocomplete="off" placeholder="${c ? 'Saved · paste a new key to replace it' : 'sk-ant-…'}"></div>
<div class="field"><label>Model</label><div class="pg">${CO_MODELS.map(m => `<label class="row" style="border-top:0;padding:8px 0"><input type="radio" name="co-m" value="${m[0]}" ${M[0] === m[0] ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent)"><span class="t"><b>${m[1]}</b><br><span class="mu sm">${m[2]} · $${m[3]} / $${m[4]} per million tokens in / out</span></span></label>`).join('')}</div></div>
<div class="mu sm" style="margin-top:8px">The key is stored only on this phone and isn’t included in backups. When you ask a question, a summary of your training data is sent to Anthropic to get the answer.</div>
<div style="display:grid;gap:8px;margin-top:12px"><button class="btn" onclick="coSaveKey()">${c ? 'Save' : 'Save and start'}</button>${c ? `<button class="btn ghost" onclick="CO.set=false;draw()">Back to chat</button><button class="btn danger-ghost" onclick="coSetCfg(null);COM=null;try{localStorage.removeItem(CO_CHAT)}catch(e){}CO.set=false;draw();toast('Key and chat removed from this phone')">Remove key and chat</button>` : ''}</div></div>`;
}
function coSaveKey() {
  const c = coCfg(),
    k = (document.getElementById('co-k').value || '').trim(),
    m = (document.querySelector('input[name=co-m]:checked') || {}).value || 'claude-opus-5-5';
  if (!k && !c) {
    toast('Paste your API key.');
    return;
  }
  if (k && !/^sk-ant-[\w-]{20,}$/.test(k)) {
    toast('That doesn’t look like an Anthropic API key (it starts with sk-ant-).');
    return;
  }
  coSetCfg({ key: k || c.key, model: m });
  CO.set = false;
  draw();
  toast(c ? 'Coach settings saved' : 'Coach ready. Ask away.');
}
/* Sunday check-in, done in the app */
function coReview() {
  tab('coach');
  coSend(revPrompt(), 'Weekly review');
}
