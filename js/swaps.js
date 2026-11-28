/* Exercise swaps and short-on-time mode */
/* ---------- swaps and variations ---------- */
const ALT = {
  'Bench press (heavy)': ['Bench press (Smith)', 'DB bench press', 'Machine chest press'],
  'Bench press (volume)': ['Bench press (Smith)', 'DB bench press', 'Machine chest press'],
  'Incline DB press': ['Incline bench press (Smith)', 'Incline barbell press', 'Incline machine press'],
  'Cable fly / pec deck': ['Pec deck', 'Cable fly', 'DB fly'],
  'Seated shoulder press': ['DB shoulder press', 'Machine shoulder press', 'Shoulder press (Smith)'],
  'Lateral raises': ['Cable lateral raise', 'Machine lateral raise'],
  'Triceps pushdown': ['Rope pushdown', 'Dip machine', 'Dips'],
  'Overhead triceps extension': ['Cable overhead extension', 'DB overhead extension', 'Skull crushers'],
  'Rack pull': ['Deadlift', 'Trap bar deadlift', 'Rack pull (Smith)'],
  'Pull-ups': ['Lat pulldown', 'Assisted pull-up machine'],
  'Barbell row': ['DB row', 'T-bar row', 'Row (Smith)'],
  'Seated cable row': ['DB row', 'Machine row', 'Chest-supported row'],
  'Face pulls': ['Reverse pec deck', 'Rear delt DB fly', 'Band pull-aparts'],
  'Incline DB curl': ['DB curl', 'Cable curl', 'EZ-bar curl'],
  Squat: ['Squat (Smith)', 'Hack squat', 'Leg press', 'Goblet squat'],
  'Romanian deadlift': ['DB Romanian deadlift', 'Romanian deadlift (Smith)', 'Good morning'],
  'Leg press': ['Hack squat', 'Squat (Smith)', 'Goblet squat'],
  'Seated leg curl': ['Lying leg curl', 'DB Romanian deadlift', 'Nordic curl'],
  'Calf raises': [
    'Calf raises (leg press)',
    'Seated calf raise',
    'Standing calf machine',
    'Single-leg DB calf raise'
  ],
  'Cable crunch': ['Hanging leg raise', 'Ab crunch machine', 'Decline sit-up'],
  'Chest-supported row': ['DB row', 'Machine row', 'Seated cable row'],
  'Close-grip bench press': ['Close-grip bench (barbell)', 'Dips', 'DB floor press'],
  'Lat pulldown': ['Pull-ups', 'Single-arm cable pulldown', 'Machine pulldown'],
  'Preacher or cable curl': ['EZ-bar curl', 'DB curl', 'Incline DB curl'],
  'Hip thrust': ['Hip thrust (barbell)', 'Hip thrust machine', 'Glute bridge machine'],
  'Bulgarian split squat': ['DB walking lunge', 'Reverse lunge', 'Single-leg leg press'],
  'Hack squat / leg press': ['Leg press', 'Squat (Smith)', 'Goblet squat'],
  'Leg extension': ['Single-leg leg extension', 'Sissy squat', 'Goblet squat'],
  'Hanging leg raise': ['Captain’s chair leg raise', 'Lying leg raise', 'Cable crunch']
};
const ALTB = {};
for (const b in ALT)
  ALT[b].forEach(a => {
    if (!ALTB[a]) ALTB[a] = b;
  });
function activeName(b) {
  const a = (S.alt || {})[b];
  return a && a !== b ? a : b;
}
function baseOf(n) {
  return (S.altB || {})[n] || ALTB[n] || n;
}
let SWAP_OPEN = null;
function toggleSwapPicker(i) {
  SWAP_OPEN = SWAP_OPEN === NAMES[i] ? null : NAMES[i];
  NOTE_EDIT = null;
  SETUP_EDIT = null;
  draw();
}
function swapPick(b) {
  const cur = activeName(b),
    own = Object.keys(S.altB || {}).filter(a => S.altB[a] === b),
    L = (ALT[b] || []).concat(own.filter(a => !(ALT[b] || []).includes(a))),
    hs = n => {
      const h = S.log[n] || [],
        x = h[h.length - 1];
      return x ? 'Last: ' + x.w + kgUnit(n) + ' × ' + x.r + ' (' + fmtD(x.d) + ')' : 'No history yet';
    },
    bi = nameIdx(b);
  return `<div class="picker" style="margin:6px 0 4px">${cur !== b ? `<button class="pk" onclick="chooseSwap(${bi},-1)"><span class="t"><b>Back to ${esc(b)}</b><br><span class="mu sm">${hs(b)}</span></span></button>` : ''}${L.filter(
    a => a !== cur
  )
    .map(
      a =>
        `<button class="pk" onclick="chooseSwap(${bi},${nameIdx(a)})"><span class="t"><b>${esc(a)}</b><br><span class="mu sm">${hs(a)}</span></span></button>`
    )
    .join(
      ''
    )}<div class="nt-ed"><input id="xc" type="text" placeholder="Something else…" aria-label="Other exercise"><button class="btn sm" onclick="chooseSwap(${bi},-2)">Use</button></div><div class="mu nt-h">Each version keeps its own history, so weight tips and PRs stay accurate. A swap stays until you switch back.</div></div>`;
}
function chooseSwap(bi, ai) {
  const b = NAMES[bi],
    el = document.getElementById('xc'),
    a = ai === -1 ? b : ai === -2 ? (el ? el.value : '').trim() : NAMES[ai];
  if (!a) return;
  S.alt = S.alt || {};
  if (a === b) delete S.alt[b];
  else {
    S.alt[b] = a;
    if (!ALTB[a] && !ALT[a]) {
      S.altB = S.altB || {};
      S.altB[a] = b;
    }
  }
  SWAP_OPEN = null;
  save();
  draw();
  toast(a === b ? 'Back to ' + esc(b) : 'Swapped to ' + esc(a) + '. It stays until you switch back.');
}
/* one-time: the 14 Nov calf raises were done on the leg press (per that week’s note) */
function migrateCalf() {
  if (S.mv5) return false;
  S.mv5 = true;
  const L = S.log['Calf raises'];
  if (!L) return true;
  const nt = ((S.noteHist || {})['2026-11-09'] || {})['Calf raises'] || (S.notes || {})['Calf raises'] || '',
    mv = L.filter(x => x.d === '2026-11-14');
  if (mv.length && /leg press/i.test(nt)) {
    S.log['Calf raises'] = L.filter(x => x.d !== '2026-11-14');
    S.log['Calf raises (leg press)'] = (S.log['Calf raises (leg press)'] || []).concat(mv);
  }
  return true;
}

/* ---------- short on time ---------- */
function isBigLift(n) {
  return (
    !/calf/i.test(n) &&
    /heavy|squat|rack pull|romanian|deadlift|hip thrust|bench press|leg press|hack/i.test(n)
  );
}
function nSets(t) {
  const m = String(t).match(/^(\d+)\s*[×xX]/);
  return m ? +m[1] : 3;
}
function qOn(d) {
  return S.qk === weekKey + '-' + d;
}
/* main lifts (big compounds, plus the first two) keep full sets; the rest drop to 2 sets and pair up as supersets */
function ssMap(d) {
  const E = PLAN[d].e,
    o = {},
    acc = [];
  let main = 0;
  E.forEach((e, i) => {
    if (main < 3 && (isBigLift(e[0]) || i < 2)) {
      main++;
      o[i] = { t: e[1] };
    } else acc.push(i);
  });
  acc.forEach((i, j) => {
    const p = j % 2 ? acc[j - 1] : acc[j + 1];
    o[i] = {
      t: '2' + String(E[i][1]).replace(/^\d+/, ''),
      a: 1,
      g: p != null ? String.fromCharCode(65 + Math.floor(j / 2)) : '',
      w: p
    };
  });
  return o;
}
function estMin(d, Q) {
  if (PLAN[d].n === 'Rest day') return 0;
  const sp = Q ? ssMap(d) : null;
  let s = 0;
  PLAN[d].e.forEach((e, i) => {
    const q = sp && sp[i];
    if (q && q.a) s += q.g ? 2 * (40 + 30) : 2 * (40 + 60);
    else s += nSets(e[1]) * (40 + (isBigLift(activeName(e[0])) ? 150 : 90));
  });
  return Math.max(5, Math.round(s / 300) * 5);
}
function toggleShortSession() {
  const k = weekKey + '-' + todayIdx;
  S.qk = S.qk === k ? null : k;
  save();
  draw();
  if (S.qk) toast('Short on time: main lifts kept, the rest cut to 2 sets and paired up');
}
