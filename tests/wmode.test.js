// Tests for workout-mode helpers.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

test('plates per side of a 20 kg bar', () => {
  const { run } = loadApp();
  assert.equal(run('platesTxt(100)'), 'Each side of a 20 kg bar: 25 + 15');
  assert.equal(run('platesTxt(62.5)'), 'Each side of a 20 kg bar: 20 + 1.25');
  assert.equal(run('platesTxt(140)'), 'Each side of a 20 kg bar: 2×25 + 10');
  assert.equal(run('platesTxt(20)'), '', 'just the bar');
});

test('plates are only shown for barbell lifts', () => {
  const { run } = loadApp();
  assert.equal(run("isBarbell('Bench press (heavy)')"), true);
  assert.equal(run("isBarbell('Squat')"), true);
  assert.equal(run("isBarbell('Incline DB press')"), false);
  assert.equal(run("isBarbell('Leg press')"), false);
  assert.equal(run("isBarbell('Seated cable row')"), false);
  assert.equal(run("isBarbell('Lateral raises')"), false);
});

test('workout mode starts from the add-weight tip, or the last set logged today', () => {
  const app = loadApp('2026-11-18T12:00:00'); // Wednesday: Legs, first exercise Squat
  app.ctx.__h = [{ d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }, { d: '2026-11-11', w: 100, r: 8 }];
  app.run('S.log={Squat:__h};S.alt={};S.dlw=null;WM={i:0};wmSeed(0)');
  assert.equal(app.run('PLAN[ti].e[0][0]'), 'Squat');
  assert.deepEqual(JSON.parse(app.run('JSON.stringify([WM.w,WM.r])')), [105, 6]);
  app.run("S.log.Squat.push({d:'2026-11-18',w:102.5,r:7});wmSeed(0)");
  assert.deepEqual(JSON.parse(app.run('JSON.stringify([WM.w,WM.r])')), [102.5, 7]);
});
