/* Setup reminders (kept) and weekly lift notes (reset each Monday) */
/* ---------- setup reminders (kept) + weekly notes (reset Monday) ---------- */
let SETUP_EDIT = null;
function editSetup(i) {
  SETUP_EDIT = NAMES[i];
  NOTE_EDIT = null;
  draw();
  setTimeout(() => {
    const el = document.querySelector('.nt-ed input');
    if (el) el.focus();
  }, 50);
}
function saveSetup(k, i) {
  const v = document.getElementById('se' + k).value.trim(),
    n = NAMES[i];
  S.setup = S.setup || {};
  if (v) S.setup[n] = v;
  else delete S.setup[n];
  SETUP_EDIT = null;
  save();
  draw();
}
const SU_CAT = {
  seat: /\bseat\b/i,
  bench:
    /\b(bench (angle|on|at|set)|incline|decline|flat bench|angle|degrees?|notch|back ?rest|back ?pad|upright)\b|°/i,
  grip: /\b(grip|grips|hands? (on|at|just|outside|inside|shoulder|width)|thumbs?|rings?|knurl\w*|overhand|underhand|neutral|pronated|supinated|mixed)\b/i,
  pins: /\b(pins?|holes?|safet(y|ies)|j-?hooks?|hooks?|rack (on|at|height)|bar height|height)\b/i,
  pad: /\b(pads?|roller|lever|range limiter|rom (setting|on|at))\b/i,
  feet: /\b(stance|feet|foot|toes|heels?)\b/i,
  gear: /\b(straps?|belt|wraps?|sleeves?|chalk|smith( machine)?|used (an? |the )?(cable|smith|machine|dumbbells?|barbell|bands?|ez ?bar))\b/i,
  cable: /\b(attachment|handle|rope|v-?bar|straight bar|ez ?bar|pulley|cable (on|at|height)|clip)\b/i,
  gen: /\b(set(ting)? (on|at|to)|on (level|setting|position|number)?\s*\d+|position \d+|level \d+)\b/i
};
const SU_NOT =
  /\b(hurt|hurts|pain|painful|sore|ache|aching|tight|felt|feel|feels|tired|easy|easier|hard|harder|heavy|slipp\w*|fail\w*|struggl\w*|tweak\w*|twinge|weak|strong|pump|burn|rushed|sloppy|form broke|taken|busy|no time|skipped|don.t like)\b/i;
function suCats(t) {
  return Object.keys(SU_CAT).filter(c => SU_CAT[c].test(t));
}
function suClauses(t) {
  return String(t || '')
    .split(/[,;.\n]+|\s+(?:but|then)\s+/i)
    .map(x => x.trim())
    .filter(x => x && !SU_NOT.test(x) && suCats(x).length);
}
/* pull setup details out of a note and merge into the saved reminder; a newer detail replaces the old one of the same kind */
function mergeSetup(n, t) {
  const add = suClauses(t);
  if (!add.length) return '';
  S.setup = S.setup || {};
  let cur = String(S.setup[n] || '')
    .split(/\s*·\s*/)
    .filter(Boolean);
  add.forEach(a => {
    const ca = suCats(a);
    cur = cur.filter(c => {
      const cc = suCats(c);
      return !(cc.some(x => ca.includes(x)) || c.toLowerCase() === a.toLowerCase());
    });
    cur.push(a);
  });
  S.setup[n] = cur.join(' · ');
  return add.join(', ');
}
function notesFor(w) {
  return w === S.notesWk ? S.notes || {} : (S.noteHist || {})[w] || {};
}
/* runs on load: on the first open of a new week, file last week's notes away and start fresh */
function rollNotes() {
  let ch = false;
  S.setup = S.setup || {};
  S.noteHist = S.noteHist || {};
  S.notes = S.notes || {};
  if (!S.nv4) {
    for (const n in S.notes) mergeSetup(n, S.notes[n]);
    S.nv4 = true;
    if (!S.notesWk) S.notesWk = weekKey;
    ch = true;
  }
  if (!S.notesWk) {
    S.notesWk = weekKey;
    ch = true;
  }
  if (S.notesWk < weekKey) {
    if (Object.keys(S.notes).length) S.noteHist[S.notesWk] = S.notes;
    S.notes = {};
    S.notesWk = weekKey;
    ch = true;
  }
  const ks = Object.keys(S.noteHist).sort();
  while (ks.length > 26) {
    delete S.noteHist[ks.shift()];
    ch = true;
  }
  return ch;
}
