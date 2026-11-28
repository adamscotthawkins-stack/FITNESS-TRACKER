// Tests for the Claude coach: proposal checks, applying changes, the data snapshot, and the
// request loop (against a fake SDK, so nothing is sent anywhere).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

function app() {
  const a = loadApp('2026-11-18T12:00:00'); // Wednesday
  const store = {};
  a.ctx.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  a.run("S.plan=null;applyPlan();S.alt={};S.prog={};S.progDef={};S.goals=[];draw=function(){};toast=function(m){globalThis.__toast=m}");
  return { ...a, store };
}
const check = (a, name, inp) => { a.ctx.__i = inp; return a.run(`coCheck(${JSON.stringify(name)},__i)`); };

test('plan proposals are checked against the plan', () => {
  const a = app();
  assert.equal(check(a, 'propose_plan_changes', { summary: 'Swap squat', changes: [{ action: 'swap_exercise', day: 'Wed', exercise: 'Squat', new_exercise: 'Hack squat', sets_reps: '4×8–10' }] }), '');
  assert.match(check(a, 'propose_plan_changes', { summary: 'x', changes: [{ action: 'swap_exercise', day: 'Wed', exercise: 'Bench press (heavy)', new_exercise: 'X' }] }), /not on Wed/);
  assert.match(check(a, 'propose_plan_changes', { summary: 'x', changes: [{ action: 'set_sets_reps', day: 'Mon', exercise: 'Lateral raises', sets_reps: 'lots' }] }), /3×8–12/);
  assert.match(check(a, 'propose_plan_changes', { summary: 'x', changes: [{ action: 'add_exercise', day: 'Thu', new_exercise: 'Plank', sets_reps: '3×30' }] }), /rest day/);
  // later changes see the earlier ones: make Thursday a training day, then add to it
  assert.equal(check(a, 'propose_plan_changes', { summary: 'x', changes: [{ action: 'make_training_day', day: 'Thu', day_name: 'Arms' }, { action: 'add_exercise', day: 'Thu', new_exercise: 'EZ-bar curl', sets_reps: '3×10–12' }] }), '');
  assert.match(check(a, 'propose_plan_changes', { summary: 'x', changes: [] }), /at least one/);
  assert.match(check(a, 'propose_plan_changes', { summary: 'x', changes: [{ action: 'explode', day: 'Mon' }] }), /unknown action/);
});

test('applying a plan proposal changes the plan', () => {
  const a = app();
  a.ctx.__i = { summary: 'Shoulder-friendly Monday', changes: [
    { action: 'swap_exercise', day: 'Mon', exercise: 'Bench press (heavy)', new_exercise: 'DB bench press', sets_reps: '4×8–10' },
    { action: 'remove_exercise', day: 'Mon', exercise: 'Overhead triceps extension' },
    { action: 'add_exercise', day: 'Mon', new_exercise: 'Face pulls', sets_reps: '3×15–20', position: 2 },
    { action: 'make_rest_day', day: 'Sat' }] };
  a.run("coApply('propose_plan_changes',__i)");
  const mon = JSON.parse(a.run('JSON.stringify(PLAN[0].e.map(e=>e.join(" ")))'));
  assert.equal(mon[0], 'DB bench press 4×8–10');
  assert.equal(mon[1], 'Face pulls 3×15–20');
  assert.ok(!mon.some(x => x.startsWith('Overhead triceps')));
  assert.equal(a.run('PLAN[5].n'), 'Rest day');
  assert.ok(a.run('!!S.plan'), 'saved as the user’s own plan');
});

test('progression and goal proposals', () => {
  const a = app();
  assert.equal(check(a, 'propose_progression', { exercise: 'Squat', method: 'linear' }), '');
  assert.match(check(a, 'propose_progression', { exercise: 'Underwater basket weaving', method: 'linear' }), /not in the plan/);
  a.run("coApply('propose_progression',{exercise:'Squat',increment:'big'});coApply('propose_progression',{exercise:'all',effort:'2-3'})");
  assert.equal(a.run("stepOf('Squat')"), 10);
  assert.equal(a.run("progOf('Barbell row').e"), '2-3');
  assert.match(check(a, 'propose_goal', { type: 'lift', lift: 'Squat', target_kg: 140, date: '2026-01-01' }), /future/);
  a.run("coApply('propose_goal',{type:'lift',lift:'Squat',target_kg:140,date:'2027-03-01'})");
  assert.equal(a.run('S.goals[0].target'), 140);
});

test('the snapshot gives Claude the plan, recent sets and targets', () => {
  const a = app();
  a.ctx.__s = [{ d: '2026-11-16', w: 80, r: 5, q: 2 }, { d: '2026-09-01', w: 40, r: 5 }];
  a.run("S.log={'Bench press (heavy)':__s};S.weights=[{d:'2026-11-14',w:73.9}]");
  const s = a.run('coSnapshot()');
  assert.match(s, /Wednesday,? 18 November 2026/);
  assert.match(s, /- Mon: Push — /);
  assert.match(s, /• Squat 4×6–8/);
  assert.match(s, /Bench press \(heavy\): 11-16 80×5@2/);
  assert.doesNotMatch(s, /09-01/, 'only the last 6 weeks');
  assert.match(s, /Body weight: 11-14 73.9kg/);
});

test('replies are shown as text, never as HTML', () => {
  const { run } = loadApp();
  const h = run("mdLite('**Do** this:\\n- one <img src=x onerror=alert(1)>\\n- two')");
  assert.match(h, /<b>Do<\/b>/);
  assert.match(h, /<li>one &lt;img src=x onerror=alert\(1\)&gt;<\/li>/);
  assert.doesNotMatch(h, /<img/);
});

test('a question that leads to a proposal: card shown, tool result sent back, nothing applied yet', async () => {
  const a = app();
  a.store['fit-claude'] = JSON.stringify({ key: 'sk-ant-test-0000000000000000000000', model: 'claude-opus-5-5' });
  const calls = [];
  const replies = [
    { stop_reason: 'tool_use', usage: { input_tokens: 5000, output_tokens: 200 }, content: [{ type: 'text', text: 'Try dumbbells instead.' }, { type: 'tool_use', id: 'tu1', name: 'propose_plan_changes', input: { summary: 'Swap bench for DB bench', changes: [{ action: 'swap_exercise', day: 'Mon', exercise: 'Bench press (heavy)', new_exercise: 'DB bench press' }] } }] },
    { stop_reason: 'end_turn', usage: { input_tokens: 5300, output_tokens: 40 }, content: [{ type: 'text', text: 'Tap Apply if you want it.' }] },
  ];
  a.ctx.__fake = {
    APIError: class extends Error {},
    Anthropic: class { constructor(o) { this.o = o; const stream = req => { calls.push(req); const r = replies.shift(); return { on: (ev, f) => { if (ev === 'text') r.content.filter(b => b.type === 'text').forEach(b => f(b.text)); }, finalMessage: async () => r }; };
      this.beta = { messages: { stream } }; this.messages = { stream }; } },
  };
  a.run('CO.sdk=__fake;COM=null');
  await a.run("coSend('My shoulder hurts on bench')");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].model, 'claude-opus-5-5');
  assert.equal(JSON.stringify(calls[0].betas), '["server-side-fallback-2026-07-01"]');
  assert.equal(calls[0].fallbacks, 'default');
  assert.equal(calls[0].output_config.effort, 'medium');
  assert.ok(calls[0].tools.every(t => t.eager_input_streaming === true));
  assert.match(calls[0].system[1].text, /APP DATA SNAPSHOT/);
  const second = calls[1].messages;
  assert.equal(second[second.length - 1].content[0].type, 'tool_result');
  assert.equal(second[second.length - 1].content[0].tool_use_id, 'tu1');
  assert.equal(a.run("COM.p.tu1"), 'open');
  assert.equal(a.run('PLAN[0].e[0][0]'), 'Bench press (heavy)', 'nothing changes until Apply');
  assert.ok(a.run('COM.cost') > 0);
  a.run("coPropose('tu1',true)");
  assert.equal(a.run('PLAN[0].e[0][0]'), 'DB bench press');
  assert.equal(a.run("COM.p.tu1"), 'applied');
});

test('an invalid proposal is not shown and Claude is told why', async () => {
  const a = app();
  a.store['fit-claude'] = JSON.stringify({ key: 'sk-ant-test-0000000000000000000000', model: 'claude-haiku-5-5' });
  const calls = [];
  const replies = [
    { stop_reason: 'tool_use', usage: {}, content: [{ type: 'tool_use', id: 'tu9', name: 'propose_plan_changes', input: { summary: 'x', changes: [{ action: 'remove_exercise', day: 'Mon', exercise: 'Nope' }] } }] },
    { stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: 'Sorry, which exercise?' }] },
  ];
  a.ctx.__fake = { APIError: class extends Error {}, Anthropic: class { constructor() { const stream = req => { calls.push(req); const r = replies.shift(); return { on: () => {}, finalMessage: async () => r }; }; this.beta = { messages: { stream } }; this.messages = { stream }; } } };
  a.run('CO.sdk=__fake;COM=null');
  await a.run("coSend('remove something')");
  assert.equal(calls[0].fallbacks, undefined, 'Haiku has no server-side fallback');
  const tr = calls[1].messages[calls[1].messages.length - 1].content[0];
  assert.equal(tr.is_error, true);
  assert.match(tr.content, /"Nope" is not on Mon/);
  assert.equal(a.run('COM.p.tu9'), undefined);
});
