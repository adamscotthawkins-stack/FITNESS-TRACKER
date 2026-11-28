// Tests for training feedback and progression settings.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const sets = (d, list) => list.map(([w, r, q]) => (q == null ? { d, w, r } : { d, w, r, q }));
function tip(app, name, target, hist) {
  app.ctx.__h = hist;
  app.run(`S.log={};S.dlw=null;S.log[${JSON.stringify(name)}]=__h;`);
  return app.run(
    `(()=>{const L=S.log[${JSON.stringify(name)}];return advice(${JSON.stringify(name)},${JSON.stringify(target)},L[L.length-1])})()`
  );
}

test('default progression: double, comfortable steps, 1-2 reps in reserve', () => {
  const { run } = loadApp();
  run('S.prog={};S.progDef={}');
  assert.deepEqual(JSON.parse(run("JSON.stringify(progOf('Squat'))")), { m: 'double', inc: 'c', e: '1-2' });
  assert.equal(run("stepOf('Squat')"), 5);
  assert.equal(run("stepOf('Barbell row')"), 2.5);
  assert.equal(run("stepOf('Incline DB press')"), 2);
});

test('weight increment setting changes the step', () => {
  const app = loadApp();
  app.run("S.progDef={inc:'s'}");
  assert.equal(
    tip(
      app,
      'Barbell row',
      '3×8–12',
      sets('2026-11-11', [
        [60, 12],
        [60, 12],
        [60, 12]
      ])
    ).w,
    61.25
  );
  app.run("S.progDef={inc:'l'};S.prog={}");
  assert.equal(
    tip(
      app,
      'Barbell row',
      '3×8–12',
      sets('2026-11-11', [
        [60, 12],
        [60, 12],
        [60, 12]
      ])
    ).w,
    65
  );
});

test('one exercise can have its own settings', () => {
  const app = loadApp();
  app.run("S.progDef={};S.prog={'Barbell row':{inc:'l'}}");
  assert.equal(app.run("stepOf('Barbell row')"), 5);
  assert.equal(app.run("stepOf('Seated cable row')"), 2.5);
});

test('linear progression adds weight once every set reaches the bottom of the range', () => {
  const app = loadApp();
  app.run("S.progDef={m:'linear'};S.prog={}");
  const up = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 9],
      [60, 8],
      [60, 8]
    ])
  );
  assert.deepEqual([up.w, up.r], [62.5, 8]);
  const stay = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 9],
      [60, 8],
      [60, 7]
    ])
  );
  assert.deepEqual([stay.w, stay.r], [60, 8]);
  assert.match(
    tip(
      app,
      'Barbell row',
      '3×8–12',
      sets('2026-11-11', [
        [70, 5],
        [70, 5],
        [70, 4]
      ])
    ).msg,
    /too heavy/,
    'still drops a weight that is too heavy'
  );
});

test('projection: double progression climbs the reps then adds weight; linear adds weight each time', () => {
  const { run } = loadApp();
  run('S.progDef={};S.prog={}');
  assert.deepEqual(
    JSON.parse(run("JSON.stringify(projTarget('Barbell row','3×8–12',{w:60,r:10},4))")),
    { w: 62.5, r: 9 },
    '11, 12, then 62.5 x 8, x 9'
  );
  run("S.progDef={m:'linear'}");
  assert.deepEqual(JSON.parse(run("JSON.stringify(projTarget('Barbell row','3×8–12',{w:60,r:8},4))")), {
    w: 70,
    r: 8
  });
});

test("feedback banner states follow today's qualifying sets", () => {
  const app = loadApp('2026-11-18T12:00:00'); // Wednesday: Legs, Squat 4×6–8 first
  app.run('S.progDef={};S.prog={};S.alt={};S.dlw=null');
  const hist = sets('2026-11-11', [
    [100, 8],
    [100, 8],
    [100, 8],
    [100, 8]
  ]); // all at the top -> target 105 x 6
  const state = extra => {
    app.ctx.__h = hist.concat(extra);
    app.run('S.log={Squat:__h}');
    return JSON.parse(app.run('JSON.stringify(fbInfo(todayIdx,0))'));
  };
  let F = state([]);
  assert.deepEqual([F.state, F.T.w, F.T.r, F.need], ['start', 105, 6, 4]);
  assert.match(app.run('fbTitle(fbInfo(todayIdx,0))'), /Today’s target/);
  F = state(
    sets('2026-11-18', [
      [60, 8],
      [105, 6],
      [105, 5]
    ])
  );
  assert.deepEqual([F.state, F.qual, F.need], ['need', 1, 3], 'warm-up and a short set do not qualify');
  assert.equal(app.run('fbTitle(fbInfo(todayIdx,0))'), '3 more qualifying sets needed');
  F = state(
    sets('2026-11-18', [
      [105, 6],
      [105, 6],
      [105, 7],
      [107.5, 6]
    ])
  );
  assert.equal(F.state, 'hit');
  // a heavier weight for fewer reps estimates about the same max: no arrow
  assert.doesNotMatch(app.run('fbBanner(todayIdx,0)'), /→/);
  // beating last time (100 x 7 -> 100 x 8) raises it
  app.ctx.__h = sets('2026-11-11', [
    [100, 7],
    [100, 7],
    [100, 7],
    [100, 7]
  ]);
  app.run('S.log={Squat:__h}');
  F = JSON.parse(app.run('JSON.stringify(fbInfo(todayIdx,0))'));
  assert.deepEqual([F.T.w, F.T.r], [100, 8]);
  assert.ok(F.tE > F.cur);
  assert.match(app.run('fbBanner(todayIdx,0)'), /1RM:<\/span>[\d.]+kg → [\d.]+kg \(\+\d+%\)/);
});

test('no history: a first-time hint instead of targets', () => {
  const { run } = loadApp('2026-11-18T12:00:00');
  run('S.log={};S.alt={}');
  assert.match(run('fbBanner(todayIdx,0)'), /First time logging this lift/);
});
