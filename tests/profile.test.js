// Tests for profile-based calorie and protein targets.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

test('without a profile the built-in targets are unchanged', () => {
  const { run } = loadApp();
  run("S.prof=null;S.weights=[];S.goal='bulk';S.kadj=0");
  assert.equal(run('target()'), 2801);
  assert.equal(run('protTarget()'), 150);
});

test('maintenance calories use Mifflin-St Jeor times activity', () => {
  const { run } = loadApp();
  run("S.weights=[];S.prof={sex:'m',age:30,h:178,w:72,act:1.375};S.kadj=0");
  // 10*72 + 6.25*178 - 5*30 + 5 = 1687.5, x1.375 = 2320.3
  assert.ok(Math.abs(run('tdee()') - 2320.31) < 0.01);
  run("S.goal='maintain'"); assert.equal(run('target()'), 2320);
  run("S.goal='bulk'"); assert.equal(run('target()'), 2620);
  run("S.goal='cut'"); assert.equal(run('target()'), 1856);
});

test('women use the female formula', () => {
  const { run } = loadApp();
  run("S.weights=[];S.prof={sex:'f',age:30,h:165,w:60,act:1.2};S.goal='maintain';S.kadj=0");
  // 600 + 1031.25 - 150 - 161 = 1320.25, x1.2 = 1584.3
  assert.equal(run('target()'), 1584);
});

test('latest weigh-in replaces the profile weight, and the calorie adjustment still applies', () => {
  const { run } = loadApp();
  run("S.prof={sex:'m',age:30,h:178,w:72,act:1.375};S.goal='bulk';S.weights=[{d:'2026-11-01',w:72},{d:'2026-11-14',w:74}];S.kadj=150");
  assert.equal(run('bodyW()'), 74);
  // 10*74 = 740 -> BMR 1707.5, x1.375 = 2347.8, +300 bulk, +150 adjustment
  assert.equal(run('target()'), 2798);
  assert.equal(run('protTarget()'), 148, '2 g per kg');
});

test('meal portions scale to the calorie target', () => {
  const { run } = loadApp();
  run("S.prof={sex:'m',age:30,h:178,w:72,act:1.375};S.weights=[];S.goal='maintain';S.kadj=0");
  const total = run('Math.round(MEALS.reduce((a,m)=>a+m.k*sc(),0))');
  assert.equal(total, run('target()'));
});
