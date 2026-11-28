// Tests for food suggestions while typing.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

const top = (run, q, n = 3) =>
  JSON.parse(run(`JSON.stringify(fmatch(FOODDB,${JSON.stringify(q)},${n}).map(f=>f.n))`));

test('common foods come up as you type', () => {
  const { run } = loadApp();
  assert.equal(top(run, 'chick')[0], 'Chicken breast, cooked');
  assert.equal(top(run, 'banana')[0], 'Banana');
  assert.equal(top(run, 'greek yog')[0], 'Greek yoghurt, full fat');
  assert.ok(['White rice, cooked', 'Brown rice, cooked'].every(n => top(run, 'rice', 3).includes(n)));
  assert.ok(top(run, 'oats', 5).includes('Porridge oats'));
});

test('word order and plurals do not matter', () => {
  const { run } = loadApp();
  assert.equal(top(run, 'breast chicken')[0], 'Chicken breast, cooked');
  assert.ok(top(run, 'eggs', 5).includes('Egg, boiled'));
  assert.ok(top(run, 'potatoes', 6).includes('Potato, boiled'));
  assert.ok(top(run, 'blueberry').includes('Blueberries'));
  assert.ok(top(run, 'strawberry').includes('Strawberries'));
});

test('names that start with what you typed come first', () => {
  const { run } = loadApp();
  assert.equal(top(run, 'pea')[0], 'Peas', 'not peanut butter');
  assert.equal(top(run, 'milk')[0], 'Milk, semi-skimmed');
  assert.deepEqual(top(run, 'zzzz'), []);
});

test('every common food has sensible numbers and a portion', () => {
  const { run } = loadApp();
  const bad = JSON.parse(
    run(
      'JSON.stringify(FOODDB.filter(f=>!(f.k100>=0&&f.k100<=900&&f.p100>=0&&f.p100<=90&&f.sq>0&&/\\(\\d/.test(f.sl))).map(f=>f.n))'
    )
  );
  assert.deepEqual(bad, []);
  const names = JSON.parse(run('JSON.stringify(FOODDB.map(f=>f.n.toLowerCase()))'));
  assert.equal(new Set(names).size, names.length, 'no duplicates');
  assert.ok(names.length >= 120);
});

test('suggestions list: your foods first, then common foods, then branded products', () => {
  const app = loadApp();
  app.run(
    "S.myFoods=[{n:'Chicken wrap from the canteen',k:450,p:30}];S.foods={};FOOD_SEARCH={q:'chicken',res:[{code:'1',n:'Chicken Tikka Slices · Brand',k100:140,p100:24,sq:null,ss:''}],rq:'chicken',busy:null,err:''}"
  );
  const html = app.run('sugHtml()');
  const order = [
    'Your foods',
    'Chicken wrap from the canteen',
    'Common foods',
    'Chicken breast, cooked',
    'Brands and products',
    'Chicken Tikka Slices'
  ].map(t => html.indexOf(t));
  assert.ok(
    order.every(i => i >= 0),
    'all sections present'
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    'in order'
  );
  assert.match(html, /1 breast \(150 g\) · 248 kcal/, 'portion and its calories');
});

test('picking a suggestion: per-100 g foods ask for the amount; your saved portions add straight away', () => {
  const app = loadApp();
  app.run(
    "S.myFoods=[{n:'Chicken wrap from the canteen',k:450,p:30}];S.foods={};FOOD_SEARCH={q:'chicken',res:null,busy:null,err:''};draw=()=>{};toast=()=>{};globalThis.__amt=null;amtSheet=f=>{globalThis.__amt=f.n}"
  );
  app.run('sugHtml()');
  app.run('pickSug(0)');
  assert.equal(app.run('S.foods[today].length'), 1);
  assert.equal(app.run('S.foods[today][0].k'), 450);
  app.run("FOOD_SEARCH={q:'chicken',res:null,busy:null,err:''};sugHtml();pickSug(1)");
  assert.match(app.run('globalThis.__amt'), /^Chicken/);
});
