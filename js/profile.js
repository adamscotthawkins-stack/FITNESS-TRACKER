/* Profile: body stats and activity, used to work out calorie and protein targets.
   Until a profile is saved the app keeps the built-in meal plan targets. */
const ACT = [
  [1.2, 'Mostly seated, little exercise'],
  [1.375, 'Desk job, train 3–5 times a week'],
  [1.55, 'On my feet a lot, train 3–5 times a week'],
  [1.725, 'Physical job or training most days']
];
function prof() {
  const p = S.prof;
  return p && p.h > 0 && p.age > 0 ? p : null;
}
/* latest weigh-in, or the weight saved in the profile */
function bodyW() {
  return S.weights.length ? S.weights[S.weights.length - 1].w : (S.prof && S.prof.w) || null;
}
/* daily calories to maintain weight (Mifflin-St Jeor x activity) */
function tdee() {
  const p = prof(),
    w = bodyW();
  if (!p || !w) return null;
  return (10 * w + 6.25 * p.h - 5 * p.age + (p.sex === 'f' ? -161 : 5)) * (p.act || 1.375);
}
/* calories for the chosen goal, before any weight-pace adjustment */
function goalKcal() {
  const T = tdee();
  return T ? Math.round(T * (S.goal === 'cut' ? 0.8 : 1) + (S.goal === 'bulk' ? 300 : 0)) : null;
}
function protTarget() {
  const w = bodyW();
  return prof() && w
    ? Math.round(w * (S.goal === 'cut' ? 2.2 : 2))
    : Math.round(MEALS.reduce((a, m) => a + m.p, 0) * mealScale());
}
function profileCard() {
  const p = S.prof || {},
    w = S.weights.length ? S.weights[S.weights.length - 1] : null,
    T = tdee(),
    f = (id, lab, inner) => `<div class="field"><label for="${id}">${lab}</label>${inner}</div>`;
  return `<div class="card" id="profile"><div class="ch"><span class="ci" style="--c:var(--violet)">${ICO.user}</span><div class="ct"><h2>Your profile</h2><div class="mu sm">Sets your calorie and protein targets. Stays on this phone.</div></div></div>
${f('pf-n', 'First name (optional)', `<input id="pf-n" type="text" autocomplete="given-name" value="${esc(p.n || '')}" placeholder="For your greeting">`)}
<div class="pf-row">${f('pf-sex', 'Sex', `<select id="pf-sex"><option value="m" ${p.sex !== 'f' ? 'selected' : ''}>Male</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Female</option></select>`)}${f('pf-age', 'Age', `<input id="pf-age" type="number" inputmode="numeric" value="${p.age || ''}" placeholder="Years">`)}</div>
<div class="pf-row">${f('pf-h', 'Height (cm)', `<input id="pf-h" type="number" inputmode="decimal" value="${p.h || ''}" placeholder="e.g. 178">`)}${f('pf-w', w ? 'Weight (latest weigh-in)' : 'Weight (kg)', w ? `<input id="pf-w" type="number" value="${w.w}" disabled>` : `<input id="pf-w" type="number" inputmode="decimal" step="0.1" value="${p.w || ''}" placeholder="kg">`)}</div>
${f('pf-act', 'Day-to-day activity', `<select id="pf-act">${ACT.map(a => `<option value="${a[0]}" ${(p.act || 1.375) === a[0] ? 'selected' : ''}>${a[1]}</option>`).join('')}</select>`)}
${T ? `<div class="tiles" style="margin-bottom:4px">${tile('Maintain', Math.round(T), 'kcal to stay the same')}${tile('Target', target(), 'kcal · ' + GOALS[S.goal][0].toLowerCase())}${tile('Protein', protTarget() + '<small> g</small>', 'a day')}</div>` : ''}
<button class="btn" style="width:100%;margin-top:12px" onclick="saveProf()">${prof() ? 'Update profile' : 'Save profile'}</button>
<div class="mu sm" style="margin-top:8px">${w ? 'Targets update each time you log your weight.' : 'Once you start logging weigh-ins, your latest weight is used automatically.'}</div></div>`;
}
function saveProf() {
  const v = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    },
    n = parseFloat,
    age = parseInt(v('pf-age')),
    h = n(v('pf-h')),
    w = n(v('pf-w'));
  if (!(age >= 13 && age <= 100)) {
    toast('Enter your age (13 to 100).');
    return;
  }
  if (!(h >= 120 && h <= 230)) {
    toast('Enter your height in cm (120 to 230).');
    return;
  }
  if (!S.weights.length && !(w >= 30 && w <= 300)) {
    toast('Enter your weight in kg.');
    return;
  }
  S.prof = {
    n: v('pf-n').slice(0, 30),
    sex: v('pf-sex') === 'f' ? 'f' : 'm',
    age: age,
    h: h,
    w: S.weights.length ? (S.prof && S.prof.w) || null : w,
    act: n(v('pf-act')) || 1.375
  };
  S.profNag = 1;
  save();
  draw();
  toast('Profile saved. Daily target is now ' + target() + ' kcal.');
}
function profNudge() {
  return prof() || S.profNag
    ? ''
    : `<div class="card dlb"><div class="ch"><span class="ci" style="--c:var(--violet)">${ICO.user}</span><div class="ct"><h2>Personalise your targets</h2><div class="mu sm">Add your height, age and activity so calories and protein fit you.</div></div></div><div style="display:flex;gap:8px"><button class="btn sm" onclick="goProf()">Set up profile</button><button class="btn sm ghost" onclick="S.profNag=1;save();draw()">Not now</button></div></div>`;
}
function goProf() {
  tab('tools');
  setTimeout(() => {
    const el = document.getElementById('profile');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}
