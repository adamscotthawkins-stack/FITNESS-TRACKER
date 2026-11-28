/* Today’s exercise list, set logging, rest timer and add-weight tips */
function streak() {
  let s = 0;
  for (let d = todayIdx; d >= 0; d--) {
    if (PLAN[d].n.match(/rest/i)) continue;
    if (doneCount(d) >= Math.ceil(PLAN[d].e.length / 2)) s++;
    else if (d !== todayIdx) break;
  }
  return s;
}
function exList(d, ro) {
  const Q = !ro && qOn(d),
    sp = Q ? ssMap(d) : {};
  return PLAN[d].e
    .map((e, i) => {
      const k = doneKey(d, i),
        dn = S.done[k],
        fz = S.done['f' + weekKey + '-' + d],
        rest = PLAN[d].n === 'Rest day',
        nm = rest ? e[0] : activeName(e[0]),
        sw = nm !== e[0],
        q = sp[i],
        tgt = q ? q.t : e[1];
      const cb = `<label class="row"><input type="checkbox" ${dn ? 'checked' : ''} onchange="toggleDone('${k}')"><span class="t">${esc(nm)}${rest ? '' : muscleTag(nm)}${sw ? `<span class="tag">Swap</span><br><span class="mu sm">Instead of ${esc(e[0])}</span>` : ''}${q && q.g ? `<br><span class="mu sm">Superset ${q.g} with ${esc(activeName(PLAN[d].e[q.w][0]))}</span>` : ''}</span><span class="r">${esc(tgt)}</span></label>`;
      if (rest || ro) return `<div class="ex ${dn ? 'done' : ''}">${cb}</div>`;
      const L = S.log[nm] || [],
        td = L.filter(x => x.d === today),
        pv = L.filter(x => x.d !== today).pop(),
        lt = td[td.length - 1],
        A = advice(nm, e[1], pv),
        fw = lt ? lt.w : A ? A.w : '',
        fr = lt ? lt.r : A ? A.r : '',
        nt = (S.notes || {})[e[0]],
        su = (S.setup || {})[nm],
        ni = nameIdx(e[0]),
        nj = nameIdx(nm);
      return `<div class="ex ${dn ? 'done' : ''}${fz ? ' fz' : ''}">${cb}${fbBanner(d, i)}${setTable(d, i)}<div class="lg"><input id="lw${k}" type="number" step="0.5" inputmode="decimal" value="${fw}" placeholder="${isDB(nm) ? 'kg each' : 'kg'}" aria-label="${isDB(nm) ? 'Weight of each dumbbell in kg' : 'Weight in kg'}" onfocus="this.select()"><input id="lr${k}" type="number" inputmode="numeric" value="${fr}" placeholder="reps" aria-label="Reps" onfocus="this.select()"><select id="lq${k}" class="rir" aria-label="Reps in reserve"><option value="">RIR</option>${[0, 1, 2, 3, 4].map(v => `<option value="${v}" ${lt && lt.q === v ? 'selected' : ''}>${v === 4 ? '4+' : v}</option>`).join('')}</select><button class="btn sm" onclick="logFromInputs('${k}',${d},${i})">Log</button></div><div class="mu sm lgi">${pv ? 'Last time: ' + pv.w + kgUnit(nm) + ' × ' + pv.r + ' (' + fmtD(pv.d) + ')' : 'No history yet'}</div><div class="lgn">${SETUP_EDIT === nm ? `<div class="nt-ed"><input id="se${k}" type="text" value="${esc(su || '')}" placeholder="e.g. bench on notch 3, seat on 4" aria-label="Setup for ${esc(nm)}"><button class="btn sm" onclick="saveSetup('${k}',${nj})">Save</button></div><div class="mu nt-h">Shows every time you do this lift. Leave empty to remove.</div>` : su ? `<div class="note su"><span class="ni">${ICO.pin}</span><span class="nb"><b>Setup:</b> ${esc(su)}<button class="link" onclick="editSetup(${nj})">Edit</button></span></div>` : ''}${NOTE_EDIT === e[0] ? `<div class="nt-ed"><input id="ne${k}" type="text" value="${esc(nt || '')}" placeholder="How it felt, form cues, seat, grip, bench angle…" aria-label="Note for ${esc(e[0])}"><button class="btn sm" onclick="saveNote('${k}',${ni})">Save</button></div><div class="mu nt-h">Notes clear every Monday. Setup details (seat, bench angle, grip, pins…) are saved as a reminder for next time.</div>` : nt ? `<div class="note"><span class="ni">${ICO.note}</span><span class="nb">${esc(nt)}<button class="link" onclick="editNote(${ni})">Edit</button></span></div>` : `<button class="link" onclick="editNote(${ni})">+ Add note</button>${su ? '' : ` <button class="link" onclick="editSetup(${nj})">+ Setup</button>`}`}</div><div class="lgn"><button class="link" style="font-size:13px;padding:2px 0" onclick="toggleSwapPicker(${ni})" aria-expanded="${SWAP_OPEN === e[0]}">${SWAP_OPEN === e[0] ? 'Close' : '⇄ Swap'}</button><button class="link how-l" onclick="howTo(${nj})">${ICO.book}How to</button><button class="link how-l" onclick="liftSheet(${nj})">${ICO.chart}History</button>${SWAP_OPEN === e[0] ? swapPick(e[0]) : ''}</div></div>`;
    })
    .join('');
}
function toggleDone(k) {
  S.done[k] = !S.done[k];
  save();
  draw();
}
function toggleMeal(i) {
  const k = 'm' + today + i;
  S.meals[k] = !S.meals[k];
  save();
  draw();
}
function setWater(n) {
  S.water[today] = S.water[today] === n ? n - 1 : n;
  save();
  draw();
}
function setGoal(g) {
  S.goal = g;
  save();
  draw();
}
function tab(t) {
  if (t === 'plan' && S.tab !== 'plan') {
    S.sel = null;
    S.pe = false;
  }
  S.tab = t;
  ANIMATE_ENTRY = 1;
  if (t === 'tools') loadXlsx().catch(() => {});
  draw();
  try {
    scrollTo(0, 0);
  } catch (e) {}
}
function selectDay(d) {
  S.sel = d;
  draw();
}
function addWeight() {
  const v = parseFloat(document.getElementById('w').value);
  if (!v || v < 30 || v > 300) return;
  S.weights = S.weights.filter(x => x.d !== today);
  S.weights.push({ d: today, w: v });
  S.weights.sort((a, b) => (a.d < b.d ? -1 : 1));
  save();
  draw();
}
function lastCard(d) {
  if (PLAN[d].n === 'Rest day') return '';
  const rows = PLAN[d].e
    .map(e => {
      const nm = activeName(e[0]),
        L = (S.log[nm] || []).filter(x => x.d !== today),
        x = L[L.length - 1];
      return `<div class="row"><span class="t">${esc(nm)}</span><span class="r">${x ? `<b>${x.w} kg × ${x.r}</b><br><span class="mu">${new Date(x.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>` : '<span class="mu">No sets yet</span>'}</span></div>`;
    })
    .join('');
  return `<details class="rcp"><summary><b>Last working sets</b><br><span class="mu">Your final set for each lift last session</span></summary>${rows}</details>`;
}
/* log one set of exercise i on day d (used by the Today list and workout mode) */
function logSet(d, i, w, r, q) {
  if (S.done['f' + weekKey + '-' + d]) return false;
  const n = activeName(PLAN[d].e[i][0]);
  if (!(w >= 0) || !(r > 0)) return false;
  unlockAudio();
  const o = { d: today, w: w, r: r, t: Date.now() };
  if (q != null && q !== '') o.q = +q;
  const pr =
    !inDl() && (S.log[n] || []).length && est1RM(w, r, o.q) > Math.max(...S.log[n].map(x => est1RM(x.w, x.r, x.q)));
  (S.log[n] = S.log[n] || []).push(o);
  S.done[doneKey(d, i)] = true;
  save();
  draw();
  startRest(n, d, i);
  if (pr) toast('New PR on ' + n + ': ' + w + ' kg × ' + r);
  return true;
}
function logFromInputs(k, d, i) {
  logSet(
    d,
    i,
    parseFloat(document.getElementById('lw' + k).value),
    parseInt(document.getElementById('lr' + k).value),
    document.getElementById('lq' + k).value
  );
}
let REST_UNTIL = 0,
  tI = null;
function startRest(n, d, i) {
  const q = d != null && qOn(d) ? ssMap(d)[i] : null,
    s = q && q.a ? 60 : isBigLift(n) ? 150 : 90;
  REST_UNTIL = Date.now() + s * 1000;
  tickTimer();
  if (!tI) tI = setInterval(tickTimer, 500);
}
function tickTimer() {
  const el = document.getElementById('tm'),
    r = Math.ceil((REST_UNTIL - Date.now()) / 1000);
  if (r <= 0) {
    if (REST_UNTIL) {
      REST_UNTIL = 0;
      beep();
      try {
        navigator.vibrate && navigator.vibrate(300);
      } catch (e) {}
    }
    el.className = '';
    return;
  }
  el.className = 'on';
  el.innerHTML = `<span>${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}</span><button onclick="REST_UNTIL+=30000;tickTimer()">+30s</button><button onclick="REST_UNTIL=0;tickTimer()">Skip</button>`;
}
function inDl() {
  return S.dlw === weekKey;
}
function weightStep(n) {
  return isDB(n) ? 2 : /squat|deadlift|rack pull|hip thrust|leg press|hack|calf/i.test(n) ? 5 : 2.5;
}
function roundToStep(w, n) {
  const i = weightStep(n);
  return Math.max(0, Math.round(w / i) * i);
}
/* Working sets from one session: drop warm-ups (<85% of the working weight) and heavy singles/doubles
   done as top sets when the target is 4+ reps, then take the weight used for the most sets. */
function workingSets(a, lo) {
  const tops = a.filter(x => !(lo >= 4 && x.r <= 2)),
    pool = tops.length ? tops : a,
    c = {};
  pool.forEach(x => (c[x.w] = (c[x.w] || 0) + 1));
  const mw = +Object.keys(c).sort((p, q) => c[q] - c[p] || q - p)[0];
  return { mw: mw, ws: pool.filter(x => x.w >= mw * 0.9 && x.w <= mw) };
}
function recentMax(n) {
  const L = (S.log[n] || []).filter(x => x.d >= addDays(today, -28) && x.d !== today);
  return L.length ? Math.max(...L.map(x => est1RM(x.w, x.r, x.q))) : 0;
}
function advice(n, t, pv) {
  if (!pv) return null;
  const a = S.log[n].filter(x => x.d === pv.d),
    m = String(t).match(/^(\d+)\s*[×xX]\s*(\d+)(?:\s*[–-]\s*(\d+))?/),
    B = s => `<br><b style="color:var(--ac)">${s}</b>`;
  const nS = m ? +m[1] : 3,
    lo = m ? +m[2] : pv.r,
    top = m ? +(m[3] || m[2]) : pv.r,
    W = workingSets(a, lo),
    mw = W.mw,
    ws = W.ws,
    u = kgUnit(n),
    i = stepOf(n),
    P = progOf(n);
  if (inDl()) {
    const w = roundToStep(mw * 0.6, n);
    return { w: w, r: lo, msg: B(`Deload: ${w}${u} (60% of ${mw}). Easy reps, 3+ in reserve.`) };
  }
  if (!m) return { w: mw, r: pv.r, msg: '' };
  if (mw === 0) {
    const b = Math.max(...ws.map(x => x.r));
    return b >= top && ws.length >= nS && ws.every(x => x.r >= top)
      ? { w: 2.5, r: lo, msg: B(`All sets at ${top}+: add 2.5 kg (belt or dumbbell between your feet)`) }
      : {
          w: 0,
          r: Math.min(top, b + 1),
          msg: `<br>Bodyweight: aim for ${Math.min(top, b + 1)} reps on set 1, then add a rep to the others`
        };
  }
  const first = ws.find(x => x.w === mw) || ws[0] || pv,
    rr = lo === top ? lo + '-rep target' : lo + '–' + top + ' rep range',
    qs = ws.map(x => x.q).filter(v => v != null),
    easy = qs.length >= 2 && qs.every(v => v >= 3),
    hitAll = ws.length >= nS && ws.every(x => x.r >= top),
    best = recentMax(n),
    ideal = best ? roundToStep(e1inv(best, lo + 2), n) : 0;
  /* linear progression: add weight as soon as every set reaches the bottom of the range */
  if (P.m === 'linear' && !(first.r <= lo - 3 || (first.q === 0 && first.r < lo - 1))) {
    const allLo = ws.length >= nS && ws.every(x => x.r >= lo);
    return allLo
      ? { w: mw + i, r: lo, msg: B(`Every set hit ${lo}: go up to ${mw + i}${u}`) }
      : { w: mw, r: lo, msg: `<br>Get ${lo} reps on all ${nS} sets at ${mw}${u} to earn ${mw + i}${u}` };
  }
  if (hitAll || (easy && ws.every(x => x.r >= lo))) {
    const nx = mw + i;
    return {
      w: nx,
      r: lo,
      msg: B(`${hitAll ? 'Every set hit ' + top : 'Sets felt easy'}: go up to ${nx}${u} for ${lo}+ reps`)
    };
  }
  if (first.r <= lo - 3 || (first.q === 0 && first.r < lo - 1)) {
    const nx = Math.max(i, mw - i);
    return {
      w: nx,
      r: lo,
      msg: `<br>${mw}${u} is too heavy for your ${rr} (got ${first.r}). Drop to ${nx}${u} and build back up.`
    };
  }
  if (ideal && ideal >= mw + 2 * i && first.r >= lo)
    return {
      w: mw + i,
      r: lo,
      msg: B(`Your estimated max says you’re stronger than ${mw}${u}: try ${mw + i}${u}`)
    };
  const goal = Math.min(top, first.r + 1),
    short = ws.filter(x => x.r < top).length,
    more = Math.max(0, nS - ws.length);
  return {
    w: mw,
    r: goal,
    msg:
      first.r >= top
        ? `<br>Set 1 hit ${top}. Get ${top} on all ${nS} sets at ${mw}${u} (${short + more} to go) to earn ${mw + i}${u}`
        : `<br>Beat last time: ${mw}${u} × ${goal} on set 1, then build to ${top} on every set to earn ${mw + i}${u}`
  };
}
let NOTE_EDIT = null;
function editNote(i) {
  NOTE_EDIT = NAMES[i];
  SETUP_EDIT = null;
  draw();
  setTimeout(() => {
    const el = document.querySelector('.nt-ed input');
    if (el) el.focus();
  }, 50);
}
function saveNote(k, i) {
  const v = document.getElementById('ne' + k).value.trim(),
    n = NAMES[i];
  S.notes = S.notes || {};
  if (v) S.notes[n] = v;
  else delete S.notes[n];
  S.notesWk = weekKey;
  NOTE_EDIT = null;
  const a = v ? mergeSetup(n, v) : '';
  save();
  draw();
  if (a) toast('Setup saved for next time: ' + a);
}
