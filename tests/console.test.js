// Tests for the session readout and set tables.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const T = (h, m) => new Date(`2026-11-18T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).getTime();

test('clock formats', () => {
  const { run } = loadApp();
  assert.equal(run('hms(3129000)'), '00:52:09');
  assert.equal(run('hms(NaN)'), '--:--:--');
  assert.equal(run('restFmt(90000)'), '1m 30s');
  assert.equal(run('restFmt(150000)'), '2m 30s');
  assert.equal(run('restFmt(45000)'), '45s');
  assert.equal(run('restFmt(120000)'), '2m');
  assert.equal(run('restFmt(30*60000)'), '20m+');
  assert.equal(run("dateLine(new Date('2026-11-04T18:44:00'))"), 'WED 04-NOV, 6:44PM');
});

test('session progress counts working sets against the plan, not warm-ups', () => {
  const app = loadApp('2026-11-18T12:00:00'); // Wednesday: Legs, Squat 4 sets first
  app.ctx.__s = [{ d: '2026-11-18', w: 60, r: 8, t: T(11, 0) }, { d: '2026-11-18', w: 100, r: 8, t: T(11, 3) }, { d: '2026-11-18', w: 100, r: 8, t: T(11, 6) }];
  app.run('S.log={Squat:__s};S.done={};S.alt={};S.qk=null');
  const I = JSON.parse(app.run('JSON.stringify(sesInfo())'));
  assert.equal(I.logged, 2, 'the 60 kg warm-up does not count');
  assert.equal(I.planned, app.run('PLAN[ti].e.reduce((a,e)=>a+nSets(e[1]),0)'));
  assert.equal(I.first, T(11, 0));
  assert.equal(I.last, T(11, 6));
  // ticking an exercise done counts all its sets
  app.run('S.done[dk(ti,1)]=true');
  assert.equal(app.run('sesInfo().logged'), 2 + app.run('nSets(PLAN[ti].e[1][1])'));
});

test('set table: warm-ups marked W, rest between sets, then the planned sets still to do', () => {
  const app = loadApp('2026-11-18T12:00:00');
  app.ctx.__s = [{ d: '2026-11-18', w: 60, r: 8, t: T(11, 0) }, { d: '2026-11-18', w: 100, r: 8, t: T(11, 3) }, { d: '2026-11-18', w: 100, r: 7, q: 1, t: T(11, 5) }];
  app.run('S.log={Squat:__s};S.done={};S.alt={};S.qk=null');
  const h = app.run('setTable(ti,0)');
  const rows = [...h.matchAll(/<(?:button|div) class="st-r ([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(rows, ['wu', 'ok', 'ok', 'todo next', 'todo'], '4 working sets planned: 2 done, 2 to go');
  assert.match(h, /<span class="st-n">W<\/span>/);
  assert.match(h, /3m/, 'rest before the first working set');
  assert.match(h, /2m/, 'rest before the second');
  assert.match(h, /7<small>@1<\/small>/, 'reps in reserve shown');
  assert.match(h, /logPlanned\(\d,0\)" aria-label="Log set 3: 100 kg × 7"/, 'the next set repeats the last working set');
});

test('the next set ignores a warm-up just logged', () => {
  const app = loadApp('2026-11-18T12:00:00');
  app.ctx.__s = [{ d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-18', w: 40, r: 10 }];
  app.run('S.log={Squat:__s};S.done={};S.alt={};S.dlw=null');
  assert.deepEqual(JSON.parse(app.run('JSON.stringify(nextSet(ti,0))')), { w: 105, r: 6 });
});

test('one tap logs the planned next set', () => {
  const app = loadApp('2026-11-18T12:00:00');
  app.ctx.__s = [{ d: '2026-11-11', w: 100, r: 8 }];
  app.run('S.log={Squat:__s};S.done={};S.alt={};draw=()=>{};rest=()=>{};toast=()=>{};unlockAudio=()=>{}');
  app.run('logPlanned(ti,0)');
  const last = JSON.parse(app.run('JSON.stringify(S.log.Squat[S.log.Squat.length-1])'));
  assert.equal(last.d, '2026-11-18');
  assert.equal(app.run('S.done[dk(ti,0)]'), true);
});
