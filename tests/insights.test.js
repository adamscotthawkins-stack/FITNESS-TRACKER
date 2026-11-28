// Tests for the weekly muscle totals and the monthly recap.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const sets = (d, w, r, k) => Array.from({ length: k }, () => ({ d, w, r }));

test('weekly muscle totals add up the days', () => {
  const app = loadApp('2026-11-18T12:00:00'); // Wednesday; week starts Mon 16 Nov
  app.ctx.__log = {
    'Bench press (heavy)': sets('2026-11-16', 80, 5, 4),
    Squat: sets('2026-11-18', 100, 6, 4),
    'Barbell row': sets('2026-11-09', 60, 10, 3) // last week: not counted
  };
  app.run('S.log=__log');
  const sc = JSON.parse(app.run('JSON.stringify(muscleLoadRange(weekKey,today))'));
  assert.equal(sc.chest, 4);
  assert.equal(sc.quads, 4);
  assert.equal(sc.triceps, 2);
  assert.equal(sc.lats, undefined);
});

test('monthly recap: sessions, sets, records, gains and body weight', () => {
  const app = loadApp('2026-11-18T12:00:00');
  app.ctx.__log = {
    'Bench press (heavy)': [
      ...sets('2026-10-20', 80, 5, 2),
      ...sets('2026-11-02', 85, 5, 2),
      ...sets('2026-11-16', 87.5, 5, 1)
    ],
    'Bench press (volume)': sets('2026-11-06', 70, 8, 3),
    Squat: sets('2026-11-04', 100, 5, 3)
  };
  app.run(
    "S.log=__log;S.done={};S.weights=[{d:'2026-10-30',w:72},{d:'2026-11-01',w:72.4},{d:'2026-11-15',w:73.6}]"
  );
  const M = JSON.parse(app.run("JSON.stringify(monthStats('2026-11'))"));
  assert.equal(M.sessions, 4, '2, 4, 6 and 16 Nov');
  assert.equal(M.sets, 9);
  assert.equal(M.bw, 1.2, 'first to last weigh-in in November');
  assert.ok(M.prs.length >= 2, 'bench went up twice');
  assert.equal(M.gains.length, 1, 'squat has no earlier history to compare');
  assert.equal(M.gains[0].n, 'Bench press');
  // e1(87.5,5) - e1(80,5) = 100.26 - 91.67 = 8.6, rounded to the nearest 0.5
  assert.equal(M.gains[0].g, 8.5);
  assert.equal(M.top, 'Chest');
});

test('a month with nothing logged', () => {
  const { run } = loadApp();
  run('S.log={};S.done={};S.weights=[]');
  const M = JSON.parse(run("JSON.stringify(monthStats('2026-09'))"));
  assert.deepEqual([M.sessions, M.sets, M.vol, M.bw, M.top], [0, 0, 0, null, null]);
});
