// Every exercise in the plan and in the swap lists must have a how-to guide, and the right one.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

test('every planned exercise and swap option has a guide', () => {
  const { run } = loadApp();
  const names = JSON.parse(run(`JSON.stringify([...new Set([].concat(
    DEF_PLAN.flatMap(d=>d.n==='Rest day'?[]:d.e.map(e=>e[0])),
    Object.keys(ALT), ...Object.values(ALT), ['Pull-ups','Close-grip bench press','Calf raises (leg press)']))])`));
  assert.ok(names.length > 80);
  const missing = names.filter(n => run(`!howOf(${JSON.stringify(n)})`));
  assert.deepEqual(missing, []);
});

test('tricky names match the right guide', () => {
  const { run } = loadApp();
  const first = n => run(`howOf(${JSON.stringify(n)}).st[0]`);
  const feel = n => run(`howOf(${JSON.stringify(n)}).feel`);
  assert.match(feel('Calf raises (leg press)'), /calves/, 'not the leg press guide');
  assert.match(feel('Incline DB curl'), /biceps/, 'not the incline press guide');
  assert.match(feel('Romanian deadlift'), /hamstrings/, 'not the deadlift guide');
  assert.match(feel('Rear delt DB fly'), /backs of your shoulders/, 'not the chest fly guide');
  assert.match(feel('Leg extension'), /quads/);
  assert.match(feel('Nordic curl'), /backs of your thighs/, 'not the biceps curl guide');
  assert.match(feel('Hack squat / leg press'), /quads/);
  assert.match(first('Close-grip bench (barbell)'), /narrower/);
  assert.match(first('Incline bench press (Smith)'), /30°/);
  assert.match(first('Bench press (heavy)'), /eyes under the bar/);
});
