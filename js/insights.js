/* Insights: lift history from the Today list, this week's muscle map, and the monthly recap. */

/* ---------- lift history sheet ---------- */
function liftSheet(i) {
  const n = NAMES[i],
    L = S.log[n] || [],
    by = {};
  let best = 0,
    prs = {};
  L.forEach(x => {
    const v = est1RM(x.w, x.r, x.q);
    if (v > best + 1e-9) {
      if (best > 0) prs[x.d] = 1;
      best = v;
    }
    if (!by[x.d] || v > by[x.d].v) by[x.d] = { v: v, s: x.w + kgUnit(n) + ' × ' + x.r };
  });
  const pts = Object.keys(by)
      .sort()
      .filter(d => d >= addDays(today, -84))
      .map(d => ({ d: d, v: Math.round(by[d].v * 10) / 10, s: by[d].s, pr: !!prs[d] })),
    days = [...new Set(L.map(x => x.d))].sort().reverse().slice(0, 5),
    hs = L.length ? L.reduce((m, x) => (x.w > m.w || (x.w === m.w && x.r > m.r) ? x : m)) : null;
  SHEET = { hist: 1 };
  const el = document.getElementById('sheet');
  el.innerHTML = `<div class="sheet-bg" onclick="closeSheet()"></div><div class="sheet-card tall" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="eyebrow">Lift history</div><h2 id="shT" style="margin:4px 0 0">${esc(n)}</h2>
${
  L.length
    ? `<div class="tiles t2">${tile('Estimated max', Math.round(best * 10) / 10 + '<small> kg</small>', 'best ever')}${tile('Heaviest set', hs.w + '<small>' + kgUnit(n) + ' × ' + hs.r + '</small>', fmtD(hs.d))}</div>
<div class="sum-g" style="padding:6px 12px 10px">${lineChart('lh', pts, { unit: 'kg', aria: 'Estimated max per session for ' + esc(n), empty: 'Log this lift on two or more days to see a chart.', cap: 'Estimated max per session, last 12 weeks. Tap a point.' })}</div>
<h3 class="rc">Recent sessions</h3><div class="sum-g">${days
        .map(
          d =>
            `<div class="sum-l"><span>${fmtD(d)}${by[d] && prs[d] ? ' <span class="pill up">PR</span>' : ''}</span><span>${L.filter(
              x => x.d === d
            )
              .map(x => x.w + '×' + x.r + (x.q != null ? ' @' + x.q : ''))
              .join(', ')}</span></div>`
        )
        .join('')}</div>`
    : '<div class="empty">No sets logged for this lift yet.</div>'
}
<div class="sheet-act"><button class="btn ghost" onclick="closeSheet();if(WM)wmClose();S.cx=NAMES[${i}];S.tab='progress';progressTab('lifts')">All history</button><button class="btn" onclick="closeSheet()">Done</button></div></div>`;
  el.hidden = false;
}

/* ---------- this week's muscles ---------- */
function muscleLoadRange(a, b) {
  const sc = {};
  for (let d = a; d <= b; d = addDays(d, 1)) {
    const m = muscleLoad(d);
    for (const k in m) sc[k] = (sc[k] || 0) + m[k];
  }
  return sc;
}
const weekLevel = v => (!v ? '' : v >= 10 ? ' l3' : v >= 5 ? ' l2' : ' l1');
const MAJOR = [
  'chest',
  'lats',
  'traps',
  'fdelt',
  'sdelt',
  'rdelt',
  'biceps',
  'triceps',
  'quads',
  'hams',
  'glutes',
  'calves',
  'abs'
];
function weekMuscleCard() {
  const sc = muscleLoadRange(weekKey, today),
    ks = Object.keys(sc)
      .filter(k => sc[k] > 0)
      .sort((a, b) => sc[b] - sc[a]),
    low = MAJOR.filter(k => (sc[k] || 0) < 5),
    lt = todayIdx < 6;
  return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.bars}</span><div class="ct"><h2>This week’s muscles</h2><div class="mu sm">Working sets per muscle ${lt ? 'so far this week' : 'this week'}. Aim for 10–20 each.</div></div></div>
${
  ks.length
    ? `<div class="mm" style="padding:4px 0 0;margin:0"><div class="mm-figs"><figure>${bodySvg('front', sc, weekLevel)}<figcaption>Front</figcaption></figure><figure>${bodySvg('back', sc, weekLevel)}<figcaption>Back</figcaption></figure></div>
<div class="mm-key"><span>1–4</span><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>10+ sets</span></div>
<div class="mm-list">${ks.map(k => `<span class="${sc[k] >= 10 ? 'ok' : ''}">${MNAME[k]}<b>${Math.round(sc[k] * 2) / 2}</b></span>`).join('')}</div></div>
${low.length ? `<div class="wk-low">${ICO.target}<span><b>${lt ? 'Light so far' : 'Light this week'}:</b> ${low.map(k => MNAME[k]).join(', ')}${lt ? '. There’s still time to get these in.' : '. Add a few sets next week.'}</span></div>` : `<div class="wk-low ok">${ICO.check}<span>Every major muscle has had at least 5 sets this week.</span></div>`}`
    : '<div class="empty">Log some sets this week and your muscle map fills in here.</div>'
}</div>`;
}

/* ---------- monthly recap ---------- */
function monthStats(ym) {
  const a = ym + '-01',
    e = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0),
    b = iso(e),
    last = b < today ? b : today,
    ds = dayStats(),
    days = Object.keys(ds).filter(d => d >= a && d <= b),
    st = allSets().filter(x => x.d >= a && x.d <= b),
    prs = prList().filter(x => x.d >= a && x.d <= b),
    W = S.weights.filter(x => x.d >= a && x.d <= b),
    bw = W.length > 1 ? Math.round((W[W.length - 1].w - W[0].w) * 10) / 10 : null,
    gains = [];
  const fams = {};
  for (const n in S.log)
    S.log[n].forEach(x => {
      const f = famOf(n),
        v = est1RM(x.w, x.r, x.q);
      if (!v) return;
      const o = (fams[f] = fams[f] || { pre: 0, in: 0 });
      if (x.d < a) o.pre = Math.max(o.pre, v);
      else if (x.d <= b) o.in = Math.max(o.in, v);
    });
  for (const f in fams) {
    const o = fams[f];
    if (o.pre && o.in > o.pre)
      gains.push({ n: f, g: Math.round((o.in - o.pre) * 2) / 2, v: Math.round(o.in * 2) / 2 });
  }
  gains.sort((x, y) => y.g - x.g);
  const sc = muscleLoadRange(a, last),
    top = Object.keys(sc).sort((x, y) => sc[y] - sc[x])[0];
  return {
    a,
    b,
    sessions: days.length,
    sets: st.length,
    vol: tonnage(st),
    prs,
    bw,
    bwFrom: W.length ? W[0].w : null,
    bwTo: W.length ? W[W.length - 1].w : null,
    gains: gains.slice(0, 3),
    top: top ? MNAME[top] : null
  };
}
function recapCard() {
  const cur = today.slice(0, 7),
    pm = iso(new Date(+cur.slice(0, 4), +cur.slice(5, 7) - 2, 1)).slice(0, 7),
    show = S.rm === 'prev' || (S.rm == null && +today.slice(8) <= 3) ? pm : cur,
    M = monthStats(show),
    P = monthStats(iso(new Date(+show.slice(0, 4), +show.slice(5, 7) - 2, 1)).slice(0, 7)),
    mn = new Date(show + '-15T12:00').toLocaleDateString('en-GB', { month: 'long' }),
    dv = P.vol ? Math.round(((M.vol - P.vol) / P.vol) * 100) : null,
    isCur = show === cur;
  return `<div class="card recap"><div class="ed-head"><div class="ch" style="margin:0"><span class="ci" style="--c:var(--pink)">${ICO.cal}</span><div class="ct"><h2>${mn} ${isCur ? 'so far' : 'recap'}</h2><div class="mu sm">${isCur ? 'Month to date' : 'The month in numbers'}</div></div></div>
<div class="seg sm" role="group" aria-label="Month" style="margin:0"><button class="${isCur ? '' : 'on'}" onclick="S.rm='prev';save();draw()">Last</button><button class="${isCur ? 'on' : ''}" onclick="S.rm='cur';save();draw()">This</button></div></div>
<div class="tiles">${tile('Sessions', M.sessions, P.sessions ? (M.sessions >= P.sessions ? '+' : '') + (M.sessions - P.sessions) + ' vs ' + (isCur ? 'last month' : 'month before') : 'trained')}${tile('Sets', M.sets, 'logged')}${tile('Volume', fmtT(M.vol), dv == null ? 'lifted' : `<span class="pill ${dv >= 0 ? 'up' : 'down'}">${dv >= 0 ? '+' : ''}${dv}%</span>`)}</div>
${
  M.sessions
    ? `<div class="sum-g">${M.prs.length ? `<div class="sum-l"><span><b>${M.prs.length} personal record${M.prs.length > 1 ? 's' : ''}</b></span><span>${esc([...new Set(M.prs.map(x => famOf(x.n)))].slice(0, 3).join(', '))}</span></div>` : ''}
${M.gains.map(g => `<div class="sum-l"><span>${esc(g.n)}</span><span><b style="color:var(--good)">+${g.g} kg</b> est. max · now ${g.v} kg</span></div>`).join('')}
${M.bw != null ? `<div class="sum-l"><span>Body weight</span><span>${M.bwFrom} → ${M.bwTo} kg (${M.bw >= 0 ? '+' : ''}${M.bw} kg)</span></div>` : ''}
${M.top ? `<div class="sum-l"><span>Most trained</span><span>${M.top}</span></div>` : ''}</div>`
    : '<div class="empty">No sessions logged this month yet.</div>'
}</div>`;
}
