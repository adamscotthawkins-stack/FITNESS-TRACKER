/* Shared UI helpers: icons, formatting, tiles and rings, short-lived screen state, the exercise name index */
/* 1 = play the cards' entrance animation on the next draw() (set when switching tabs) */
let ANIMATE_ENTRY = 1;
function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function muscleTag(n) {
  return `<span class="mgt">#&nbsp;${muscleGroup(n)}</span>`;
}
function weekStrip() {
  return `<div class="week">${DAYS.map((x, i) => {
    const r = PLAN[i].n === 'Rest day',
      dn = !r && (S.done['f' + weekKey + '-' + i] || doneCount(i) >= Math.ceil(PLAN[i].e.length / 2)),
      st = r ? 'rest' : dn ? 'done' : i < todayIdx ? 'miss' : '';
    return `<div class="wd ${st}${i === todayIdx ? ' today' : ''}"><i>${dn ? ICO.check : ''}</i>${x.slice(0, 1)}</div>`;
  }).join('')}</div>`;
}
let RING_ID = 0; // unique ids for SVG gradients
/* a macro ring: value v of target t, unit u, label l, gradient colours c1 -> c2 */
function mring(v, t, u, l, c1, c2) {
  const r = 40,
    C = 2 * Math.PI * r,
    pc = t ? Math.min(1, v / t) : 0,
    id = 'mg' + RING_ID++;
  return `<div class="mac"><svg viewBox="0 0 104 104" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="52" cy="52" r="${r}" fill="none" stroke="url(#${id})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pc)).toFixed(1)}" transform="rotate(-90 52 52)"/><text x="52" y="52" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Inter,sans-serif" font-weight="700" font-size="20" fill="var(--ink)">${Math.round(v)}</text><text x="52" y="68" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Inter,sans-serif" font-size="11" fill="var(--mute)">of ${t} ${u}</text></svg><span class="ml">${l}</span><span class="ms">${Math.round(pc * 100)}%</span></div>`;
}
/* ---------- shared helpers ---------- */
function isDB(n) {
  return /\bDB\b|dumbbell|lateral raise|hammer curl|goblet/i.test(n);
}
function kgUnit(n) {
  return isDB(n) ? ' kg each' : ' kg';
}
/* Short-lived screen state (not saved): which picker is open, which delete is waiting for a second tap */
let MEAL_SWAP_OPEN = null,
  PHOTO_DELETE = null,
  WEIGHT_DELETE = null,
  RESET_CONFIRM = false,
  SHEET = null,
  CAL_MONTH = 0;
/* TIP: chart tooltip text by chart id.
   NAMES: exercise names get a number so inline onclick="..." handlers can pass an index instead of
   a name that might contain quotes; nameIdx(name) gives the number, NAMES[i] gives the name back. */
const TIP = {},
  NAMES = [];
function nameIdx(n) {
  let i = NAMES.indexOf(n);
  if (i < 0) {
    NAMES.push(n);
    i = NAMES.length - 1;
  }
  return i;
}
function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}
function trainingDays() {
  return PLAN.filter(x => x.n !== 'Rest day').length;
}
function fmtD(d) {
  return new Date(d + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function addDays(d, k) {
  const t = new Date(d + 'T12:00');
  t.setDate(t.getDate() + k);
  return iso(t);
}
function allSets() {
  const o = [];
  for (const n in S.log) S.log[n].forEach((x, j) => o.push({ n: n, j: j, d: x.d, w: x.w, r: x.r }));
  return o;
}
function tonnage(a) {
  return Math.round(a.reduce((s, x) => s + x.w * x.r * (isDB(x.n) ? 2 : 1), 0));
}
function fmtT(t) {
  return t >= 1000 ? (t / 1000).toFixed(t >= 10000 ? 0 : 1) + '<small> t</small>' : t + '<small> kg</small>';
}
function fmtTp(t) {
  return t >= 1000 ? (t / 1000).toFixed(t >= 10000 ? 0 : 1) + ' t' : t + ' kg';
}
function tile(l, v, s) {
  return `<div class="tile"><span class="eyebrow">${l}</span><b>${v}</b>${s ? `<span class="sub">${s}</span>` : ''}</div>`;
}
function IC2(p) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
const ICO = {
  checks: IC2('<path d="M2.5 12.5l4 4 8-9"/><path d="M10.5 16.5l1 0 8-9"/>'),
  search: IC2('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  barcode: IC2('<path d="M4 6v12M7.5 6v12M11 6v12M14 6v12M17 6v12M20 6v12" stroke-width="1.6"/>'),
  star: IC2('<path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>'),
  starOn:
    '<svg viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/></svg>',
  cloud: IC2('<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9z"/>'),
  minus: IC2('<path d="M5 12h14"/>'),
  play: IC2('<path d="M8 5.5v13l10.5-6.5z"/>'),
  user: IC2('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  clock: IC2('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  scale: IC2(
    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.8 10a4.5 4.5 0 0 1 6.4 0L13 12.5"/>'
  ),
  ruler: IC2('<path d="M4 15 15 4l5 5L9 20z"/><path d="m8 11 2 2M11 8l2 2M14 5l1.5 1.5M5 14l1.5 1.5"/>'),
  bars: IC2('<path d="M5 20V11M10 20V5M15 20v-7M20 20V8"/>'),
  pause: IC2('<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>'),
  disc: IC2('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/>'),
  camera: IC2('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>'),
  bowl: IC2(
    '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7.5c0-1.5 1-2 1-3.5M13.5 7.5c0-1.5 1-2 1-3.5"/>'
  ),
  plus: IC2('<path d="M12 5v14M5 12h14"/>'),
  book: IC2('<path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9"/>'),
  eye: IC2(
    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  ),
  sparkle: IC2('<path d="M12 3.5 13.8 10 20 12l-6.2 2L12 20.5 10.2 14 4 12l6.2-2z"/>'),
  db: IC2(
    '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>'
  ),
  drop: IC2('<path d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5z"/>'),
  medal: IC2('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3.5h4l2 4.5 2-4.5h4L15.5 10"/>'),
  stretch: IC2('<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4l-3.5 6M12 14l3.5 6"/>'),
  chart: IC2('<path d="M4 18 9.5 12l3.5 3.5L20 8"/><path d="M15 8h5v5"/>'),
  moon: IC2('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z"/>'),
  pin: IC2('<path d="M12 16v5"/><path d="M9 3h6l-1 5 3 4H7l3-4z"/>'),
  note: IC2('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  flame: IC2('<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4s.5 2 2 2.5C10.5 8 12 3 12 3z"/>'),
  dumbbell: IC2('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  trophy: IC2(
    '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>'
  ),
  cal: IC2('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  list: IC2('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  target: IC2(
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>'
  ),
  check: IC2('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  up: IC2('<path d="m6 15 6-6 6 6"/>'),
  down: IC2('<path d="m6 9 6 6 6-6"/>'),
  x: IC2('<path d="M6 6l12 12M18 6 6 18"/>'),
  left: IC2('<path d="m15 6-6 6 6 6"/>'),
  right: IC2('<path d="m9 6 6 6-6 6"/>')
};
function setChip(n, j, x) {
  return `<button class="set" onclick="editSet(${nameIdx(n)},${j})" aria-label="Edit set: ${x.w} kg for ${x.r} reps${x.q != null ? ', ' + x.q + ' in reserve' : ''}">${x.w}<i>×</i>${x.r}${x.q != null ? `<i>@</i>${x.q}` : ''}</button>`;
}
