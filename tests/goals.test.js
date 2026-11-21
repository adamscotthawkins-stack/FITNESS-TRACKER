// Tests for custom goals.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

function withLog(app, log, extra = '') {
  app.ctx.__log = log;
  app.run(`S.log=__log;S.goals=undefined;S.gv1=false;S.benches=[];S.tested={};S.weights=[];${extra}`);
}

test('the old bench goal becomes an editable goal, and tested 1RMs carry over', () => {
  const app = loadApp();
  withLog(app, { 'Bench press (heavy)': [{ d: '2026-10-20', w: 70, r: 5 }] }, "S.benches=[{d:'2026-11-01',w:90}]");
  assert.equal(app.run('migrateGoals()'), true);
  const g = JSON.parse(app.run('JSON.stringify(S.goals)'));
  assert.equal(g.length, 1);
  assert.deepEqual([g[0].lift, g[0].target, g[0].date], ['Bench press', 100, '2026-12-25']);
  assert.equal(app.run("S.tested['Bench press'][0].w"), 90);
  assert.equal(app.run('migrateGoals()'), false, 'runs only once');
});

test('no bench history means no goal is created', () => {
  const app = loadApp();
  withLog(app, { Squat: [{ d: '2026-11-10', w: 100, r: 5 }] });
  app.run('migrateGoals()');
  assert.equal(app.run('S.goals.length'), 0);
});

test('a lift goal counts every variation of the lift and the best of the last 4 weeks', () => {
  const app = loadApp();
  withLog(app, {
    'Bench press (heavy)': [{ d: '2026-10-01', w: 100, r: 3 }, { d: '2026-11-10', w: 80, r: 5 }],
    'Bench press (volume)': [{ d: '2026-11-14', w: 75, r: 8 }],
    'Incline DB press': [{ d: '2026-11-14', w: 40, r: 8 }],
  });
  app.run("S.goals=[{id:'a',t:'lift',lift:'Bench press',target:100,date:'2026-12-25',s:80}]");
  const G = JSON.parse(app.run('JSON.stringify(goalState(S.goals[0]))'));
  // e1(75,8) = (95.0 + 93.1) / 2 = 94.1 beats e1(80,5) = 91.7; the 100x3 from October is older than 4 weeks
  assert.equal(G.cur, 94);
  assert.equal(G.reached, false);
  assert.equal(G.left, 37);
  assert.equal(G.pct, 70, "(94 - 80) / (100 - 80)");
});

test('reaching a lift goal', () => {
  const app = loadApp();
  withLog(app, { 'Squat': [{ d: '2026-11-17', w: 120, r: 3 }] });
  app.run("S.goals=[{id:'a',t:'lift',lift:'Squat',target:120,date:'2026-12-25',s:100}]");
  assert.equal(app.run('goalState(S.goals[0]).reached'), true);
});

test('body weight goals work in both directions', () => {
  const app = loadApp();
  withLog(app, {}, "S.weights=[{d:'2026-10-01',w:80},{d:'2026-11-15',w:78}]");
  app.run("S.goals=[{id:'a',t:'bw',target:75,date:'2027-01-31',s:80},{id:'b',t:'bw',target:78,date:'2027-01-31',s:80}]");
  const a = JSON.parse(app.run('JSON.stringify(goalState(S.goals[0]))'));
  assert.equal(a.cur, 78);
  assert.equal(a.up, false);
  assert.equal(a.reached, false);
  assert.ok(Math.abs(a.pct - 40) < 1e-9);
  assert.equal(app.run('goalState(S.goals[1]).reached'), true);
});

test('lift families group variations', () => {
  const { run } = loadApp();
  assert.equal(run("famOf('Bench press (heavy)')"), 'Bench press');
  assert.equal(run("famOf('Calf raises (leg press)')"), 'Calf raises');
  assert.equal(run("famOf('Squat')"), 'Squat');
});
