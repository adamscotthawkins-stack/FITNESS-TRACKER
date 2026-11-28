/* Weekly weigh-in, deload timing, show/hide sections */
/* ---------- weekly weigh-in + calorie adjust ---------- */
function wiCard() {
  const W = S.weights,
    l = W[W.length - 1],
    ag = l ? Math.floor(daysBetween(l.d, today)) : 99;
  if (ag < 6) return '';
  return `<div class="card dlb"><div class="ch"><span class="ci" style="--c:var(--green)">${ICO.scale}</span><h2>Weekly weigh-in</h2></div><div class="mu">${l ? 'Last one was ' + ag + ' days ago (' + l.w + ' kg). ' : ''}Weigh yourself once a week, first thing in the morning before you eat. It tells the app if your calories need changing.</div><div class="row-in"><input id="w" type="number" step="0.1" inputmode="decimal" placeholder="Weight (kg)"><button class="btn" onclick="addWeight()">Log</button></div></div>`;
}
function adjustKcal(a) {
  S.kadj = (S.kadj || 0) + a;
  S.kadjAt = today;
  save();
  draw();
  toast('Daily target is now ' + target() + ' kcal');
}

/* ---------- smarter deload timing ---------- */
/* hard week = 3+ sessions with sets logged, counted since the last deload */
function dlWeeks() {
  if (inDl()) return 0;
  const ds = dayStats(),
    wks = {};
  Object.keys(ds).forEach(d => {
    if (ds[d].sets && (!S.dl || d > S.dl)) {
      const m = addDays(d, -((new Date(d + 'T12:00').getDay() + 6) % 7));
      wks[m] = (wks[m] || 0) + 1;
    }
  });
  return Object.values(wks).filter(n => n >= 3).length;
}
/* lifts whose best set in the last 7 days is 7.5%+ below their best set in the session before (within 4 weeks) */
function slipping() {
  const o = [],
    a = addDays(today, -7),
    b = addDays(today, -28);
  for (const n in S.log) {
    const L = S.log[n],
      nw = L.filter(x => x.d > a),
      pr = L.filter(x => x.d <= a && x.d > b);
    if (!nw.length || !pr.length) continue;
    const ld = pr.reduce((m, x) => (x.d > m ? x.d : m), ''),
      m1 = Math.max(...nw.map(x => est1RM(x.w, x.r, x.q))),
      m0 = Math.max(...pr.filter(x => x.d === ld).map(x => est1RM(x.w, x.r, x.q)));
    if (m0 > 0 && m1 < m0 * 0.925) o.push(n);
  }
  return o;
}
function dlDue() {
  const w = dlWeeks(),
    s = slipping();
  return { w: w, s: s, due: !inDl() && (w >= 6 || (w >= 4 && s.length >= 3)) };
}
function dlTxt() {
  const D = dlDue();
  return `${D.w} hard training week${D.w === 1 ? '' : 's'} (3+ sessions) since your last deload. ${D.s.length ? D.s.length + ' lift' + (D.s.length > 1 ? 's have' : ' has') + ' dropped 7.5%+ since the session before: ' + D.s.map(esc).join(', ') + '. ' : 'No lifts are going backwards. '}Deload after 6 hard weeks, or from week 4 if three or more lifts start dipping.`;
}

/* ---------- show / hide sections ---------- */
const DEFAULT_HIDDEN = { water: 1, habits: 1, meas: 1, photos: 1 };
const SHOWS = [
  ['nutrition', 'Nutrition bar on Today'],
  ['water', 'Water tracker on Today'],
  ['habits', 'Daily habits in Tools'],
  ['meas', 'Measurements in Progress'],
  ['photos', 'Progress photos in Progress']
];
function isHidden(k) {
  return !!(S.hide || DEFAULT_HIDDEN)[k];
}
function toggleHidden(k) {
  S.hide = Object.assign({}, S.hide || DEFAULT_HIDDEN);
  S.hide[k] = !S.hide[k];
  save();
  draw();
}
function showCard() {
  return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.eye}</span><h2>Show in the app</h2></div><div class="mu sm">Turn off anything you don’t use. Nothing is deleted, so you can switch it back on any time.</div>${SHOWS.map(s => `<label class="row"><input type="checkbox" ${isHidden(s[0]) ? '' : 'checked'} onchange="toggleHidden('${s[0]}')"><span class="t">${s[1]}</span></label>`).join('')}</div>`;
}
