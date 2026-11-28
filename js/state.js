/* Saved state, dates, and calorie/protein helpers.
   S is everything the app saves (localStorage 'fit1'). Its keys are short because they are stored on
   people's phones and in backups: never rename one, add a migration instead (see migrations.js). */
let S = {
  done: {},
  water: {},
  meals: {},
  goal: 'bulk',
  weights: [],
  benches: [],
  log: {},
  foods: {},
  meas: [],
  photos: [],
  habits: {},
  shop: {},
  sel: null,
  tab: 'today'
};
try {
  const x = localStorage.getItem('fit1');
  if (x) S = Object.assign(S, JSON.parse(x));
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem('fit1', JSON.stringify(S));
  } catch (e) {}
  sync();
};
const iso = d =>
  d.getFullYear() +
  '-' +
  String(d.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(d.getDate()).padStart(2, '0');
/* the date when the app opened; main.js restarts the app if it stays open past midnight */
const now = new Date(),
  today = iso(now),
  todayIdx = (now.getDay() + 6) % 7;
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - todayIdx);
const weekKey = iso(weekStart);
/* S.done key for exercise i on day d (0 = Monday) of this week */
const doneKey = (d, i) => 'x' + weekKey + '-' + d + '-' + i;
const doneCount = d => PLAN[d].e.filter((_, i) => S.done[doneKey(d, i)]).length;
/* how much to scale the built-in meal plan to hit the calorie target */
const mealScale = () => {
  const g = goalKcal();
  return g ? g / MEALS.reduce((a, m) => a + m.k, 0) : GOALS[S.goal][1];
};
const target = () => Math.round(MEALS.reduce((a, m) => a + m.k, 0) * mealScale()) + (S.kadj || 0);
const foodsToday = () => S.foods[today] || [];
const eaten = () =>
  Math.round(
    MEALS.reduce((a, m, i) => a + (S.meals['m' + today + i] ? mealAt(i).k * mealScale() : 0), 0) +
      foodsToday().reduce((a, f) => a + f.k, 0)
  );
const prot = () =>
  Math.round(
    MEALS.reduce((a, m, i) => a + (S.meals['m' + today + i] ? mealAt(i).p * mealScale() : 0), 0) +
      foodsToday().reduce((a, f) => a + f.p, 0)
  );
