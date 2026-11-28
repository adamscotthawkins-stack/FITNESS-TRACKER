/* Line charts */
/* ---------- charts ---------- */
function niceTicks(mn, mx, n) {
  const sp = mx - mn || 1,
    raw = sp / n,
    mag = Math.pow(10, Math.floor(Math.log10(raw))),
    f = raw / mag,
    st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag,
    lo = Math.floor(mn / st) * st,
    hi = Math.ceil(mx / st) * st,
    t = [];
  for (let v = lo; v <= hi + st / 2; v += st) t.push(Math.round(v * 100) / 100);
  return t;
}
function chartTip(id, i) {
  const el = document.getElementById(id + '-cap');
  if (el && TIP[id]) el.innerHTML = TIP[id][i];
}
function lineChart(id, pts, o) {
  o = o || {};
  if (pts.length < 2) return `<div class="empty">${o.empty || 'Not enough data yet.'}</div>`;
  const W = 340,
    H = 180,
    L = 36,
    R = 18,
    T = 18,
    B = 26,
    ts = d => new Date(d + 'T12:00').getTime();
  const vs = pts.map(p => p.v);
  if (o.ref != null) vs.push(o.ref);
  const mn = Math.min(...vs),
    mx = Math.max(...vs),
    pd = (mx - mn) * 0.1 || 1,
    tk = niceTicks(mn - pd, mx + pd, 3),
    lo = tk[0],
    hi = tk[tk.length - 1];
  const t0 = ts(pts[0].d),
    t1 = Math.max(ts(o.x1 || pts[pts.length - 1].d), t0 + 864e5);
  const X = d => L + ((ts(d) - t0) / (t1 - t0)) * (W - L - R),
    Y = v => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const xy = pts.map(p => [X(p.d), Y(p.v)]),
    line = xy.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '),
    area =
      line +
      ` L${xy[xy.length - 1][0].toFixed(1)} ${Y(lo).toFixed(1)} L${xy[0][0].toFixed(1)} ${Y(lo).toFixed(1)} Z`,
    last = pts[pts.length - 1],
    lq = xy[xy.length - 1];
  TIP[id] = pts.map(
    p =>
      `<b>${fmtD(p.d)}</b> · ${p.v} ${o.unit || ''}${p.s ? ' · ' + p.s : ''}${p.pr ? ' <span class="pill up">PR</span>' : ''}`
  );
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || 'Chart'}">`;
  s += tk
    .map(
      v =>
        `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end" class="ax">${+v.toFixed(1)}</text>`
    )
    .join('');
  if (o.ref != null)
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(o.ref).toFixed(1)}" y2="${Y(o.ref).toFixed(1)}" stroke="var(--ink)" stroke-width="1.25" stroke-dasharray="4 4" opacity=".5"/><text x="${L + 4}" y="${(Y(o.ref) - 6).toFixed(1)}" class="ax strong">${o.refLab}</text>`;
  s += `<path d="${area}" fill="var(--accent)" fill-opacity=".12"/>`;
  if (o.proj)
    s += `<path d="M${X(o.proj[0].d).toFixed(1)} ${Y(o.proj[0].v).toFixed(1)} L${X(o.proj[1].d).toFixed(1)} ${Y(o.proj[1].v).toFixed(1)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 5" fill="none" stroke-linecap="round"/><circle cx="${X(o.proj[1].d).toFixed(1)}" cy="${Y(o.proj[1].v).toFixed(1)}" r="4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`;
  s += `<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += xy
    .map((q, i) =>
      pts[i].pr
        ? `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="5.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`
        : `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`
    )
    .join('');
  s += `<text x="${Math.min(lq[0], W - R).toFixed(1)}" y="${Math.max(lq[1] - 11, 12).toFixed(1)}" text-anchor="${lq[0] > W - 70 ? 'end' : 'middle'}" class="ax val">${last.v}</text>`;
  s += `<text x="${L}" y="${H - 6}" class="ax">${fmtD(pts[0].d)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" class="ax">${o.x1 ? fmtD(o.x1) + ' goal' : fmtD(last.d)}</text>`;
  s += xy
    .map(
      (q, i) =>
        `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="15" fill="transparent" class="hit" onclick="chartTip('${id}',${i})"><title>${fmtD(pts[i].d)}: ${pts[i].v}</title></circle>`
    )
    .join('');
  return s + `</svg><div class="cap" id="${id}-cap">${o.cap || 'Tap a point for details'}</div>`;
}
function rgChips() {
  const c = S.rg == null ? 12 : S.rg;
  return `<div class="seg sm" role="group" aria-label="Time range">${[
    [4, '4 weeks'],
    [12, '12 weeks'],
    [0, 'All time']
  ]
    .map(
      r =>
        `<button class="${c === r[0] ? 'on' : ''}" aria-pressed="${c === r[0]}" onclick="S.rg=${r[0]};save();draw()">${r[1]}</button>`
    )
    .join('')}</div>`;
}
