/* Custom goals: a lift's estimated max, or body weight, by a date.
   A lift goal counts every logged variation of that lift, e.g. "Bench press" counts
   "Bench press (heavy)" and "Bench press (volume)", plus any tested 1RMs. */
const famOf = n =>
  String(n)
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
function liftFams() {
  const s = new Set();
  Object.keys(S.log)
    .filter(n => S.log[n].length)
    .forEach(n => s.add(famOf(n)));
  PLAN.forEach(p => {
    if (p.n !== 'Rest day') p.e.forEach(e => s.add(famOf(activeName(e[0]))));
  });
  return [...s].sort((a, b) => a.localeCompare(b));
}
function goalPts(g) {
  if (g.t === 'bw') return S.weights.map(x => ({ d: x.d, v: x.w }));
  const m = {},
    f = g.lift.toLowerCase();
  Object.keys(S.log)
    .filter(n => famOf(n).toLowerCase() === f)
    .forEach(n =>
      S.log[n].forEach(x => {
        const v = est1RM(x.w, x.r, x.q);
        if (v && (!m[x.d] || v > m[x.d].v)) m[x.d] = { v: v, s: x.w + kgUnit(n) + ' × ' + x.r };
      })
    );
  ((S.tested || {})[g.lift] || []).forEach(x => {
    if (!m[x.d] || x.w > m[x.d].v) m[x.d] = { v: x.w, s: 'tested 1RM' };
  });
  return Object.keys(m)
    .sort()
    .map(d => ({ d: d, v: Math.round(m[d].v * 10) / 10, s: m[d].s }));
}
/* where a goal stands today: current value, progress, days left, pace needed and trend */
function goalState(g) {
  const pts = goalPts(g),
    rec = pts.filter(p => p.d >= addDays(today, -28)),
    use = rec.length ? rec : pts,
    cur =
      g.t === 'bw'
        ? pts.length
          ? pts[pts.length - 1].v
          : 0
        : use.length
          ? Math.round(Math.max(...use.map(p => p.v)) * 2) / 2
          : 0,
    start = g.s != null ? g.s : pts.length ? pts[0].v : cur,
    up = g.target >= start,
    reached = !!cur && (up ? cur >= g.target : cur <= g.target),
    days = Math.ceil(daysBetween(today, g.date)),
    left = Math.max(0, days),
    gap = g.target - cur,
    need = cur && !reached && days > 0 ? gap / Math.max(1, days / 7) : 0,
    T = trend(pts),
    proj = T && days > 0 ? Math.round(T.at(g.date) * 2) / 2 : null,
    onTrack = proj == null ? null : up ? proj >= g.target : proj <= g.target,
    pct = reached
      ? 100
      : start === g.target
        ? 0
        : Math.max(0, Math.min(100, ((cur - start) / (g.target - start)) * 100));
  return { pts, cur, start, up, reached, days, left, need, T, proj, onTrack, pct };
}
function goalTitle(g) {
  return g.t === 'bw'
    ? `${g.target} kg body weight by ${fmtD(g.date)}`
    : `${g.target} kg ${g.lift.toLowerCase()} by ${fmtD(g.date)}`;
}
function goalCard(g, i) {
  const G = goalState(g),
    u = ' kg',
    lift = g.t !== 'bw',
    stretch = lift ? 2.5 : 0.5;
  if (G.reached && !g.hit) {
    g.hit = today;
    save();
  }
  const pace =
    G.T && !G.reached && G.days > 0
      ? `<div class="mu" style="margin-top:4px">Current trend: ${G.T.k >= 0 ? '+' : ''}${G.T.k.toFixed(1)} kg a week → about <b style="color:var(--ink)">${G.proj} kg</b> by ${fmtD(g.date)} ${G.onTrack ? '<span class="pill up">On track</span>' : '<span class="pill down">Behind</span>'}</div>`
      : '';
  const status = G.reached
    ? `<div class="g-done">${ICO.trophy}<span><b>Goal reached${g.hit && g.hit !== today ? ' on ' + fmtD(g.hit) : ''}.</b> Set a new target when you’re ready.</span></div>`
    : G.days < 0
      ? `<div class="mu" style="margin-top:6px">The date has passed. Edit the goal to set a new date or target.</div>`
      : G.need
        ? `<div class="mu">${G.up ? 'Add' : 'Lose'} ${Math.abs(G.need).toFixed(1)} kg a week · next target ${(G.cur + G.need).toFixed(1)} kg ${Math.abs(G.need) > stretch ? '<span class="pill down">Stretch</span>' : '<span class="pill up">Doable</span>'}</div>`
        : '';
  const lp = G.pts[G.pts.length - 1],
    proj =
      !G.reached && G.days > 0 && lp
        ? [
            { d: lp.d, v: lp.v },
            { d: g.date, v: g.target }
          ]
        : null;
  return `<div class="card goal${i % 2 ? ' alt' : ''}"><div class="ed-head"><div class="eyebrow">Goal · ${esc(goalTitle(g))}</div><button class="link" onclick="gEdit('${g.id}')">Edit</button></div>
<div class="big">${G.cur || '–'}<small>${u}</small><span class="g-of">/ ${g.target}${u}</span></div>
<div class="mu">${G.cur ? (lift ? 'Estimated max (best of last 4 weeks)' : 'Latest weigh-in') : lift ? 'No sets of this lift logged yet' : 'No weigh-ins yet'}${G.days >= 0 ? ' · ' + G.left + ' day' + (G.left === 1 ? '' : 's') + ' left' : ''}</div>
${pace}<div class="bar"><i style="width:${G.pct}%"></i></div>${status}
${G.pts.length >= 2 ? lineChart('gc' + i, G.pts, { ref: g.target, refLab: g.target + ' kg goal', proj: proj, x1: proj ? g.date : null, unit: 'kg', aria: esc(goalTitle(g)), cap: proj ? 'Dotted line shows the pace you need. Tap a point for details.' : 'Tap a point for details.' }) : ''}
${lift ? `<div class="row-in"><input id="gt${i}" type="number" step="0.5" inputmode="decimal" placeholder="Tested 1RM (kg)" aria-label="Tested one-rep max for ${esc(g.lift)}"><button class="btn" onclick="gTest(${i})">Log 1RM</button></div><div class="mu sm" style="margin-top:6px">Every logged set of ${esc(g.lift.toLowerCase())} counts automatically as an estimated max.</div>` : ''}</div>`;
}
function goalsSection() {
  const L = S.goals || [];
  return (
    (L.length
      ? L.map(goalCard).join('')
      : `<div class="card"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.target}</span><div class="ct"><h2>Set a goal</h2><div class="mu sm">Pick a lift and a target weight, or a body weight, with a date. The app tracks your pace.</div></div></div></div>`) +
    `<button class="btn ghost" style="width:100%;margin:2px 0 6px" onclick="gEdit()">${ICO.plus}<span>Add a goal</span></button>`
  );
}
function gTest(i) {
  const g = (S.goals || [])[i],
    el = document.getElementById('gt' + i),
    v = el ? parseFloat(el.value) : 0;
  if (!g || !(v >= 5 && v <= 500)) {
    toast('Enter the weight you lifted for one rep.');
    return;
  }
  S.tested = S.tested || {};
  const L = (S.tested[g.lift] || []).filter(x => x.d !== today);
  L.push({ d: today, w: v });
  L.sort((a, b) => (a.d < b.d ? -1 : 1));
  S.tested[g.lift] = L;
  save();
  draw();
  toast('Tested 1RM saved: ' + v + ' kg');
}
/* goal editor (bottom sheet) */
function gEdit(id) {
  const g = (S.goals || []).find(x => x.id === id),
    t = g ? g.t : 'lift',
    fams = liftFams(),
    lift = g && g.lift ? g.lift : fams.find(f => /^bench press$/i.test(f)) || fams[0] || '',
    def = addDays(today, 84);
  SHEET = { goal: id || null, del: false };
  const el = document.getElementById('sheet');
  el.innerHTML = `<div class="sheet-bg" onclick="closeSheet()"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="shT"><h2 id="shT" style="margin:0 0 4px">${g ? 'Edit goal' : 'New goal'}</h2>
<div class="seg" role="group" aria-label="Goal type"><button id="gk-lift" class="${t === 'lift' ? 'on' : ''}" onclick="gType('lift')">Lift strength</button><button id="gk-bw" class="${t === 'bw' ? 'on' : ''}" onclick="gType('bw')">Body weight</button></div>
<div id="g-liftf" class="field" ${t === 'bw' ? 'hidden' : ''}><label for="g-lift">Lift</label><select id="g-lift">${fams.map(f => `<option ${f === lift ? 'selected' : ''}>${esc(f)}</option>`).join('')}${lift && !fams.includes(lift) ? `<option selected>${esc(lift)}</option>` : ''}</select></div>
<div class="pf-row"><div class="field"><label for="g-target">Target (kg)</label><input id="g-target" type="number" step="0.5" inputmode="decimal" value="${g ? g.target : ''}" placeholder="${t === 'bw' ? 'e.g. 76' : 'e.g. 100'}"></div><div class="field"><label for="g-date">By</label><input id="g-date" type="date" min="${addDays(today, 1)}" value="${g ? g.date : def}"></div></div>
<div class="mu sm" style="margin-top:8px" id="g-hint">${t === 'bw' ? 'Uses your weekly weigh-ins.' : 'Tracks your estimated one-rep max from logged sets.'}</div>
<div class="sheet-act">${g ? `<button class="btn danger-ghost" id="gdel" onclick="gDel()">Delete goal</button>` : `<button class="btn ghost" onclick="closeSheet()">Cancel</button>`}<button class="btn" onclick="gSave()">Save</button></div>${g ? '<button class="link" style="width:100%;margin-top:8px" onclick="closeSheet()">Cancel</button>' : ''}</div>`;
  el.hidden = false;
  SHEET.t = t;
}
function gType(t) {
  if (!SHEET) return;
  SHEET.t = t;
  document.getElementById('gk-lift').className = t === 'lift' ? 'on' : '';
  document.getElementById('gk-bw').className = t === 'bw' ? 'on' : '';
  document.getElementById('g-liftf').hidden = t === 'bw';
  document.getElementById('g-hint').textContent =
    t === 'bw' ? 'Uses your weekly weigh-ins.' : 'Tracks your estimated one-rep max from logged sets.';
  document.getElementById('g-target').placeholder = t === 'bw' ? 'e.g. 76' : 'e.g. 100';
}
function gSave() {
  if (!SHEET) return;
  const t = SHEET.t,
    target = parseFloat(document.getElementById('g-target').value),
    date = document.getElementById('g-date').value,
    lift = t === 'bw' ? null : document.getElementById('g-lift').value;
  if (!(target >= 5 && target <= 500)) {
    toast('Enter a target weight in kg.');
    return;
  }
  if (!/^\d{4}-\d\d-\d\d$/.test(date) || date <= today) {
    toast('Pick a date in the future.');
    return;
  }
  if (t !== 'bw' && !lift) {
    toast('Pick a lift.');
    return;
  }
  S.goals = S.goals || [];
  let g = S.goals.find(x => x.id === SHEET.goal);
  const isNew = !g;
  if (!g) {
    g = { id: 'g' + Date.now().toString(36) };
    S.goals.push(g);
  }
  const changed = isNew || g.t !== t || g.lift !== lift;
  Object.assign(g, { t: t, lift: lift, target: target, date: date });
  if (changed) {
    delete g.hit;
    const G = goalState(Object.assign({}, g, { s: null }));
    g.s = G.cur || null;
  } else if (g.hit && !goalState(g).reached) delete g.hit;
  closeSheet();
  save();
  draw();
  toast(isNew ? 'Goal added' : 'Goal updated');
}
function gDel() {
  if (!SHEET || !SHEET.goal) return;
  if (!SHEET.del) {
    SHEET.del = true;
    const b = document.getElementById('gdel');
    b.textContent = 'Tap again to delete';
    b.classList.add('armed');
    return;
  }
  const g = (S.goals || []).find(x => x.id === SHEET.goal);
  if (g && g.hit) S.goalHit = 1;
  S.goals = (S.goals || []).filter(x => x.id !== SHEET.goal);
  closeSheet();
  save();
  draw();
  toast('Goal deleted');
}
function goalsTxt() {
  const L = S.goals || [];
  if (!L.length) return 'No specific goals set.';
  return (
    'Goals: ' +
    L.map(g => {
      const G = goalState(g);
      return (
        (g.t === 'bw' ? 'body weight ' : g.lift + ' ') +
        g.target +
        ' kg by ' +
        g.date +
        ' (now ' +
        (G.cur || 'unknown') +
        ' kg' +
        (G.reached
          ? ', reached'
          : G.days >= 0
            ? ', ' +
              G.left +
              ' days left' +
              (G.onTrack != null ? ', ' + (G.onTrack ? 'on track' : 'behind') : '')
            : ', date passed') +
        ')'
      );
    }).join('; ') +
    '.'
  );
}
/* one-time: turn the old built-in "100 kg bench by Christmas" into an editable goal, and keep tested 1RMs */
function migrateGoals() {
  if (S.gv1) return false;
  S.gv1 = true;
  S.tested = S.tested || {};
  if (S.benches && S.benches.length)
    S.tested['Bench press'] = (S.tested['Bench press'] || [])
      .concat(S.benches)
      .sort((a, b) => (a.d < b.d ? -1 : 1));
  if (!S.goals) {
    const has = Object.keys(S.log).some(n => /^bench press/i.test(n)) || (S.benches || []).length;
    let y = now.getFullYear();
    if (today > y + '-12-25') y++;
    S.goals = [];
    if (has) {
      const g = { id: 'g1', t: 'lift', lift: 'Bench press', target: 100, date: y + '-12-25' };
      const p = goalPts(g);
      g.s = p.length ? p[0].v : null;
      S.goals.push(g);
    }
  }
  return true;
}
