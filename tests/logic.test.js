// Tests for the training logic: 1RM maths, add-weight tips, muscle mapping and setup notes.
// Run with: npm test   (or: node --test)
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const sets = (d, list) => list.map(([w, r, q]) => (q == null ? { d, w, r } : { d, w, r, q }));

/* Set up a lift's history (in the app's sandbox) and ask for the next-session tip. */
function tip(app, name, target, hist) {
  app.ctx.__h = hist;
  app.run(`S.log={};S.dlw=null;S.log[${JSON.stringify(name)}]=__h;`);
  return app.run(
    `(()=>{const L=S.log[${JSON.stringify(name)}];return advice(${JSON.stringify(name)},${JSON.stringify(target)},L[L.length-1])})()`
  );
}

test('estimated 1RM', () => {
  const { run } = loadApp();
  assert.equal(run('est1RM(100,1)'), 100);
  assert.ok(Math.abs(run('est1RM(100,5)') - 114.58) < 0.01, 'average of Epley and Brzycki');
  assert.equal(run('est1RM(100,5,2)'), run('est1RM(100,7)'), 'reps in reserve are added back');
  assert.equal(run('est1RM(50,20)'), run('est1RM(50,12)'), 'reps are capped at 12');
  assert.equal(run('est1RM(0,10)'), 0, 'bodyweight-only sets give no estimate');
  assert.ok(Math.abs(run('e1inv(est1RM(80,8),8)') - 80) < 1e-9, 'inverse returns the weight');
});

test('add weight when every set hits the top of the range', () => {
  const app = loadApp();
  const t = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 12],
      [60, 12],
      [60, 12]
    ])
  );
  assert.equal(t.w, 62.5);
  assert.equal(t.r, 8);
  assert.match(t.msg, /go up to 62\.5/);
});

test('dumbbell lifts go up 2 kg, squats 5 kg', () => {
  const app = loadApp();
  assert.equal(
    tip(
      app,
      'Incline DB press',
      '3×6–10',
      sets('2026-11-11', [
        [24, 10],
        [24, 10],
        [24, 10]
      ])
    ).w,
    26
  );
  assert.equal(
    tip(
      app,
      'Squat',
      '4×6–8',
      sets('2026-11-11', [
        [100, 8],
        [100, 8],
        [100, 8],
        [100, 8]
      ])
    ).w,
    105
  );
});

test('warm-up sets are ignored when finding the working weight', () => {
  const app = loadApp();
  const t = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [20, 10],
      [40, 5],
      [60, 12],
      [60, 12],
      [60, 12]
    ])
  );
  assert.equal(t.w, 62.5);
});

test('too heavy: drop the weight', () => {
  const app = loadApp();
  const t = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [70, 5],
      [70, 5],
      [70, 4]
    ])
  );
  assert.equal(t.w, 67.5);
  assert.match(t.msg, /too heavy/);
});

test('in range but not at the top: same weight, one more rep', () => {
  const app = loadApp();
  const t = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 9],
      [60, 8],
      [60, 8]
    ])
  );
  assert.equal(t.w, 60);
  assert.equal(t.r, 10);
});

test('easy sets (3+ reps in reserve) earn more weight', () => {
  const app = loadApp();
  const t = tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 9, 3],
      [60, 9, 3],
      [60, 9, 4]
    ])
  );
  assert.equal(t.w, 62.5);
  assert.match(t.msg, /felt easy/);
});

test('deload week pre-fills about 60%', () => {
  const app = loadApp();
  tip(
    app,
    'Barbell row',
    '3×8–12',
    sets('2026-11-11', [
      [60, 10],
      [60, 10],
      [60, 10]
    ])
  );
  app.run('S.dlw=weekKey');
  const t = app.run('advice("Barbell row","3×8–12",S.log["Barbell row"][2])');
  assert.equal(t.w, 35);
  assert.match(t.msg, /Deload/);
});

test('muscles each lift trains', () => {
  const { run } = loadApp();
  const m = n => JSON.parse(run(`JSON.stringify(musclesOf(${JSON.stringify(n)}))`));
  assert.deepEqual(m('Bench press (heavy)'), { chest: 1, fdelt: 0.5, triceps: 0.5 });
  assert.deepEqual(m('Leg extension'), { quads: 1 });
  assert.deepEqual(m('Calf raises (leg press)'), { calves: 1 });
  assert.deepEqual(m('Incline DB curl'), { biceps: 1, forearms: 0.5 });
  assert.equal(m('Close-grip bench press').triceps, 1);
  assert.equal(m('Romanian deadlift').hams, 1);
  assert.equal(m('Lateral raises').sdelt, 1);
});

test('muscle load ignores warm-ups and halves assisting muscles', () => {
  const app = loadApp();
  app.ctx.__h = sets('2026-11-18', [
    [20, 10],
    [80, 5],
    [80, 5],
    [80, 5]
  ]);
  app.run('S.log={"Bench press (heavy)":__h}');
  const sc = JSON.parse(app.run('JSON.stringify(muscleLoad("2026-11-18"))'));
  assert.equal(sc.chest, 3);
  assert.equal(sc.triceps, 1.5);
});

test('setup details are pulled out of notes; feelings are not', () => {
  const app = loadApp();
  app.run('S.setup={}');
  app.run('mergeSetup("Leg press","Seat on 4, felt heavy today")');
  assert.equal(app.run('S.setup["Leg press"]'), 'Seat on 4');
  app.run('mergeSetup("Leg press","seat on 5")');
  assert.equal(
    app.run('S.setup["Leg press"]'),
    'seat on 5',
    'a newer detail of the same kind replaces the old one'
  );
});
