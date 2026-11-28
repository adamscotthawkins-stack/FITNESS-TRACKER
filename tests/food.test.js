// Tests for food search results, portions, and saved/recent foods.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const item = (app, p) => {
  app.ctx.__p = p;
  return JSON.parse(app.run('JSON.stringify(offItem(__p))'));
};

test('Open Food Facts products become foods per 100 g', () => {
  const app = loadApp();
  const f = item(app, {
    code: '5000159484695',
    product_name: 'Greek style yoghurt',
    brands: 'Fage,Total',
    serving_quantity: '170',
    serving_size: '170 g',
    nutriments: { 'energy-kcal_100g': 97, proteins_100g: 9.04 }
  });
  assert.deepEqual(f, {
    code: '5000159484695',
    n: 'Greek style yoghurt · Fage',
    k100: 97,
    p100: 9,
    sq: 170,
    ss: '170 g'
  });
});

test('kJ-only products are converted to kcal; products without calories are skipped', () => {
  const app = loadApp();
  assert.equal(
    item(app, { product_name: 'Oats', nutriments: { energy_100g: 1569, proteins_100g: 11 } }).k100,
    375
  );
  assert.equal(item(app, { product_name: 'Water', nutriments: {} }), null);
  assert.equal(item(app, { nutriments: { 'energy-kcal_100g': 50 } }), null, 'no name');
});

test('the brand is not repeated when it is already in the name', () => {
  const app = loadApp();
  assert.equal(
    item(app, { product_name: 'Heinz Baked Beans', brands: 'Heinz', nutriments: { 'energy-kcal_100g': 78 } })
      .n,
    'Heinz Baked Beans'
  );
});

test('portions scale from 100 g', () => {
  const { run } = loadApp();
  assert.deepEqual(JSON.parse(run("JSON.stringify(portion({n:'Oats',k100:375,p100:11},60))")), {
    n: 'Oats',
    k: 225,
    p: 6.6,
    g: 60
  });
});

test('saved foods add with their usual amount, and count towards today', () => {
  const app = loadApp();
  app.run(
    "S.foods={};S.myFoods=[];S.meals={};favSet({n:'Oats',k100:375,p100:11,g:60},true);favSet({n:'Protein bar',k:200,p:20},true);draw=()=>{};toast=()=>{}"
  );
  app.run("quickAdd('fav',0);quickAdd('fav',1)");
  const t = JSON.parse(app.run('JSON.stringify(S.foods[today])'));
  assert.deepEqual(
    t.map(f => [f.n, f.k, f.p]),
    [
      ['Protein bar', 200, 20],
      ['Oats', 225, 6.6]
    ]
  );
  assert.equal(app.run('eaten()'), 425);
});

test('saving the same food again replaces it rather than duplicating', () => {
  const { run } = loadApp();
  run(
    "S.myFoods=[];favSet({n:'Oats',k100:375,p100:11,g:60},true);favSet({n:'Oats',k100:375,p100:11,g:80},true)"
  );
  assert.equal(run('S.myFoods.length'), 1);
  assert.equal(run('S.myFoods[0].g'), 80);
  run("favSet({n:'Oats'},false)");
  assert.equal(run('S.myFoods.length'), 0);
});

test('recent foods: newest first, no repeats, saved foods left out, last 30 days only', () => {
  const { run } = loadApp();
  run(`S.myFoods=[{n:'Oats',k100:375,p100:11,g:60}];S.foods={
    '2026-10-01':[{n:'Old soup',k:200,p:5}],
    '2026-11-16':[{n:'Banana',k:100,p:1},{n:'Oats',k:225,p:6.6}],
    '2026-11-17':[{n:'Chicken wrap',k:450,p:30},{n:'Banana',k:100,p:1}]}`);
  assert.deepEqual(JSON.parse(run('JSON.stringify(recentFoods().map(f=>f.n))')), ['Banana', 'Chicken wrap']);
});
