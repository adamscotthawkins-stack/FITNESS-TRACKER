/* Training feedback: a banner above each exercise's sets (qualifying sets still needed, the 1RM it leads to,
   today's target), a targets panel (previous best, target, where you'll be in 4 sessions), and
   progression settings per exercise or as a default for all. */
const PROG = {
  m: {
    t: 'Method',
    o: [
      ['double', 'Double', 'Add reps across the range, then add weight'],
      ['linear', 'Linear', 'Add weight once every set reaches the bottom of the range']
    ]
  },
  inc: {
    t: 'Weight increment',
    o: [
      ['s', 'Small', 'Half the usual step'],
      ['c', 'Comfortable', '2.5 kg barbell, 2 kg dumbbells, 5 kg leg lifts'],
      ['l', 'Big', 'Double the usual step']
    ]
  },
  e: {
    t: 'Target effort',
    o: [
      ['0-1', 'Hard', '0–1 reps in reserve'],
      ['1-2', 'Moderate', '1–2 reps in reserve'],
      ['2-3', 'Steady', '2–3 reps in reserve']
    ]
  }
};
function progOf(n) {
  return Object.assign({ m: 'double', inc: 'c', e: '1-2' }, S.progDef || {}, (S.prog || {})[n] || {});
}
function stepOf(n) {
  return weightStep(n) * ({ s: 0.5, c: 1, l: 2 }[progOf(n).inc] || 1);
}
const rir = n => progOf(n).e.replace('-', '–');
function repRange(t) {
  const m = String(t).match(/^(\d+)\s*[×xX]\s*(\d+)(?:\s*[–-]\s*(\d+))?/);
  return m ? { nS: +m[1], lo: +m[2], top: +(m[3] || m[2]) } : { nS: 3, lo: 8, top: 8 };
}
/* where the next sessions lead if each one hits its target */
function projTarget(n, t, T, k) {
  const R = repRange(t),
    P = progOf(n),
    st = stepOf(n);
  let w = T.w,
    r = T.r;
  for (let s = 0; s < k; s++) {
    if (P.m === 'linear') w += st;
    else if (r < R.top) r++;
    else {
      w += st;
      r = R.lo;
    }
  }
  return { w: Math.round(w * 100) / 100, r };
}
const roundHalf = x => Math.round(x * 2) / 2;
function fbInfo(d, i) {
  const e = PLAN[d].e[i],
    nm = activeName(e[0]),
    R = repRange(e[1]),
    L = S.log[nm] || [],
    prev = L.filter(x => x.d !== today),
    pv = prev[prev.length - 1],
    A = advice(nm, e[1], pv);
  const pb = prev.length
      ? prev.reduce((m, x) => (est1RM(x.w, x.r, x.q) > est1RM(m.w, m.r, m.q) ? x : m))
      : null,
    cur = recentMax(nm) || (pb ? est1RM(pb.w, pb.r, pb.q) : 0);
  if (!A || !pv) return { nm, R, first: true, pb };
  const T = { w: A.w, r: A.r },
    tE = est1RM(T.w, T.r),
    td = L.filter(x => x.d === today),
    top = td.length ? Math.max(...td.map(x => x.w)) : 0,
    wk_ = td.filter(x => !isWarm(x, top)),
    qual = wk_.filter(x => x.w >= T.w && x.r >= T.r).length,
    need = Math.max(0, R.nS - qual),
    dl = inDl(),
    state = dl ? 'dl' : need === 0 ? 'hit' : td.length ? 'need' : 'start',
    P = progOf(nm),
    pr4 = projTarget(nm, e[1], T, 4);
  return { nm, R, pb, cur, T, tE, qual, need, state, A, P, pr4, p4E: est1RM(pr4.w, pr4.r) };
}
function fbTitle(F) {
  return F.state === 'dl'
    ? 'Deload target'
    : F.state === 'hit'
      ? F.P.m === 'double' && F.T.r < F.R.top
        ? 'Target hit · add a rep next time'
        : 'Target hit · add weight next time'
      : F.state === 'start'
        ? 'Today’s target'
        : `${F.need} more qualifying set${F.need > 1 ? 's' : ''} needed`;
}
function fbBanner(d, i) {
  const F = fbInfo(d, i);
  if (F.first)
    return `<div class="fb fb-first">${ICO.sparkle}<span>First time logging this lift. Pick a weight you can do for ${F.R.lo} reps with ${rir(F.nm)} left in the tank.</span></div>`;
  const up = F.cur && F.tE ? Math.round(((F.tE - F.cur) / F.cur) * 100) : null;
  return `<button class="fb fb-${F.state}" onclick="fbSheet(${d},${i})" aria-label="${esc(fbTitle(F))}. Open targets and progression settings"><span class="fb-b"><span class="fb-t">${fbTitle(F)}</span>
${F.T.w > 0 && F.cur ? `<span class="fb-l"><span class="k">1RM:</span>${roundHalf(F.cur)}kg${F.tE > F.cur + 0.25 ? ` → ${roundHalf(F.tE)}kg (+${up}%)` : ''}</span>` : ''}
<span class="fb-l"><span class="k">Target:</span>${F.T.w}kg × ${F.T.r} @ ${rir(F.nm)} RIR</span></span>${ICO.right}</button>`;
}
/* targets panel */
function exHead(nm) {
  const m = musclesOf(nm),
    ks = Object.keys(m),
    prim = ks.filter(k => m[k] >= 1),
    sec = ks.filter(k => m[k] < 1),
    back = ['lats', 'traps', 'rdelt', 'hams', 'glutes', 'lowback', 'calves', 'triceps'],
    side = prim.filter(k => back.includes(k)).length > prim.length / 2 ? 'back' : 'front',
    sc = {};
  ks.forEach(k => (sc[k] = m[k] >= 1 ? 6 : 3));
  const g = muscleGroup(nm),
    pn = prim.map(k => MNAME[k]).join(', '),
    low = prim.some(k => ['quads', 'hams', 'glutes', 'calves', 'adductors'].includes(k)),
    x0 = side === 'front' ? 45 : 765,
    /* zoom the thumbnail to the half of the body being trained */
    vb = low ? `${x0 + 150} 640 338 700` : `${x0 + 70} 150 498 560`,
    svg = bodySvg(side, sc).replace(/viewBox="[^"]+"/, `viewBox="${vb}"`);
  return `<div class="exh"><span class="mthumb">${svg}</span><div class="exh-t"><b>${esc(nm)}</b><span>${pn && pn !== g ? esc(g) + ' › ' + pn : esc(pn || g)}${sec.length ? ' • ' + sec.map(k => MNAME[k]).join(', ') : ''}</span></div></div>`;
}
function progRows(scope, n) {
  const P = scope === 'all' ? Object.assign({ m: 'double', inc: 'c', e: '1-2' }, S.progDef || {}) : progOf(n);
  return Object.keys(PROG)
    .map(k => {
      const D = PROG[k],
        cur = D.o.find(o => o[0] === P[k]) || D.o[0];
      return `<div class="pg-r"><div class="pg-l"><b>${D.t}</b><span>${cur[2]}</span></div><div class="seg sm" role="group" aria-label="${D.t}">${D.o.map(o => `<button class="${P[k] === o[0] ? 'on' : ''}" onclick="progSet('${scope}',${scope === 'all' ? -1 : nameIdx(n)},'${k}','${o[0]}')">${o[1]}</button>`).join('')}</div></div>`;
    })
    .join('');
}
function progSet(scope, ni, k, v) {
  if (scope === 'all') {
    S.progDef = Object.assign({}, S.progDef || {}, { [k]: v });
  } else {
    const n = NAMES[ni];
    S.prog = S.prog || {};
    S.prog[n] = Object.assign({}, S.prog[n] || {}, { [k]: v });
  }
  save();
  if (SHEET && SHEET.fb) fbSheet(SHEET.fb[0], SHEET.fb[1]);
  draw();
}
function progReset(ni) {
  const n = NAMES[ni];
  if (S.prog) delete S.prog[n];
  save();
  if (SHEET && SHEET.fb) fbSheet(SHEET.fb[0], SHEET.fb[1]);
  draw();
  toast('Back to your default progression');
}
function fbSheet(d, i) {
  const F = fbInfo(d, i),
    nm = F.nm,
    own = !!(S.prog || {})[nm];
  SHEET = { fb: [d, i] };
  const el = document.getElementById('sheet'),
    row = (l, w, r, q, m) =>
      `<div class="tg-r${l === 'Target' ? ' on' : ''}"><div><span class="mu sm">${l}</span><br><b>${w}kg × ${r}</b>${q != null ? ` <small>@ ${q} RIR</small>` : ''}</div><div class="r"><span class="mu sm">1RM</span><br><b>${m ? roundHalf(m) + 'kg' : '–'}</b></div></div>`;
  el.innerHTML = `<div class="sheet-bg" onclick="closeSheet()"></div><div class="sheet-card tall" role="dialog" aria-modal="true" aria-label="Targets for ${esc(nm)}">${exHead(nm)}
${
  F.first
    ? `<div class="empty" style="margin-top:12px">Log this lift once and your targets appear here.</div>`
    : `<div class="tg">${F.pb ? row('Previous best', F.pb.w, F.pb.r, F.pb.q, est1RM(F.pb.w, F.pb.r, F.pb.q)) : ''}${row('Target', F.T.w, F.T.r, rir(nm), F.tE)}${F.state !== 'dl' ? row('In 4 sessions', F.pr4.w, F.pr4.r, rir(nm), F.p4E) : ''}</div>
<div class="mu sm" style="margin:10px 2px 0">${F.A.msg.replace(/<br>/g, '').replace(/<b[^>]*>|<\/b>/g, '')}</div>`
}
<h3 class="rc">Progress by</h3><div class="seg sm pg-scope" role="group" aria-label="Apply to"><button class="${own ? 'on' : ''}" onclick="progSet('one',${nameIdx(nm)},'m',progOf(NAMES[${nameIdx(nm)}]).m)">This exercise</button><button class="${own ? '' : 'on'}" onclick="${own ? `progReset(${nameIdx(nm)})` : ''}">All exercises</button></div>
<div class="pg">${progRows(own ? 'one' : 'all', nm)}</div><div class="mu sm" style="margin:8px 2px 0">${own ? 'These settings apply to ' + esc(nm) + ' only.' : 'Changing these changes the default for every exercise. Pick “This exercise” to set this one on its own.'}</div>
<button class="btn" style="width:100%;margin-top:16px" onclick="closeSheet()">Done</button></div>`;
  el.hidden = false;
}
function progCard() {
  return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.chart}</span><div class="ct"><h2>Progression</h2><div class="mu sm">How the add-weight targets work for every exercise. Set one exercise on its own from its feedback banner.</div></div></div><div class="pg">${progRows('all')}</div></div>`;
}
