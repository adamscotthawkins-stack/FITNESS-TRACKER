/* Plan editor, fixing or deleting a set, meal swaps */
/* ---------- editable plan ---------- */
function applyPlan() {
  PLAN = Array.isArray(S.plan) && S.plan.length === 7 ? S.plan : clone(DEF_PLAN);
}
function ownPlan() {
  if (!S.plan) {
    S.plan = clone(PLAN);
    PLAN = S.plan;
  }
}
function setPlanEdit(on) {
  S.pe = on;
  RESET_CONFIRM = false;
  if (on) ownPlan();
  save();
  draw();
}
function setDayField(d, f, v) {
  ownPlan();
  v = v.trim();
  if (v) PLAN[d][f] = v;
  save();
}
function setExerciseField(d, i, k, v) {
  ownPlan();
  v = v.trim();
  if (v && PLAN[d].e[i]) PLAN[d].e[i][k] = v;
  save();
}
function moveExercise(d, i, dir) {
  ownPlan();
  const e = PLAN[d].e,
    j = i + dir;
  if (j < 0 || j >= e.length) return;
  const t = e[i];
  e[i] = e[j];
  e[j] = t;
  save();
  draw();
}
function deleteExercise(d, i) {
  ownPlan();
  PLAN[d].e.splice(i, 1);
  save();
  draw();
}
function addExercise(d) {
  ownPlan();
  PLAN[d].e.push(['New exercise', '3×10']);
  save();
  draw();
  setTimeout(() => {
    const el = document.getElementById('en' + (PLAN[d].e.length - 1));
    if (el) {
      el.focus();
      el.select();
    }
  }, 60);
}
function toggleRestDay(d) {
  ownPlan();
  const x = PLAN[d];
  if (x.n === 'Rest day') {
    x.n = 'Training';
    x.f = 'Add your exercises';
    x.e = [];
  } else {
    x.n = 'Rest day';
    x.f = 'Recovery';
    x.e = [['Walk, eat well, sleep 8h', '—']];
  }
  save();
  draw();
}
function resetPlan() {
  if (!RESET_CONFIRM) {
    RESET_CONFIRM = true;
    draw();
    return;
  }
  RESET_CONFIRM = false;
  delete S.plan;
  applyPlan();
  S.pe = false;
  save();
  draw();
  toast('Plan reset to the default');
}
function planEditor(d) {
  const x = PLAN[d],
    rest = x.n === 'Rest day';
  return `<div class="card"><div class="ed-head"><div class="eyebrow">Editing ${DAYS[d]}</div><button class="btn sm" onclick="setPlanEdit(false)">Done</button></div>
${
  rest
    ? `<h2 style="margin-top:12px">Rest day</h2><div class="mu">${esc(x.f)}</div>`
    : `<div class="field"><label for="pn">Session name</label><input id="pn" type="text" value="${esc(x.n)}" onchange="setDayField(${d},'n',this.value)"></div><div class="field"><label for="pf">Focus</label><input id="pf" type="text" value="${esc(x.f)}" onchange="setDayField(${d},'f',this.value)"></div>
<div class="ed-list">${x.e.map((e, i) => `<div class="ed-row"><input id="en${i}" type="text" value="${esc(e[0])}" aria-label="Exercise name" onchange="setExerciseField(${d},${i},0,this.value)"><input id="es${i}" type="text" value="${esc(e[1])}" aria-label="Sets and reps" onchange="setExerciseField(${d},${i},1,this.value)"><div class="ed-btns"><button class="ib" onclick="moveExercise(${d},${i},-1)" ${i ? '' : 'disabled'} aria-label="Move up">${ICO.up}</button><button class="ib" onclick="moveExercise(${d},${i},1)" ${i < x.e.length - 1 ? '' : 'disabled'} aria-label="Move down">${ICO.down}</button><button class="ib del" onclick="deleteExercise(${d},${i})" aria-label="Remove exercise">${ICO.x}</button></div></div>`).join('')}</div>
<button class="btn ghost" style="width:100%" onclick="addExercise(${d})">Add exercise</button><div class="mu sm" style="margin-top:10px">Write sets and reps like 3×10 or 4×8–10 so the add-weight tips keep working. Renaming a lift starts a fresh history for it. Put DB or dumbbell in the name to log the weight of each dumbbell.</div>`
}
<button class="btn ghost" style="width:100%;margin-top:12px" onclick="toggleRestDay(${d})">${rest ? 'Make this a training day' : 'Make this a rest day'}</button></div>
<button class="btn ${RESET_CONFIRM ? 'danger' : 'ghost'}" style="width:100%" onclick="resetPlan()">${RESET_CONFIRM ? 'Tap again to reset every day' : 'Reset to the default plan'}</button>`;
}

/* ---------- fix or delete a set ---------- */
function editSet(ni, j) {
  const n = NAMES[ni],
    x = (S.log[n] || [])[j];
  if (!x) return;
  SHEET = { n: n, j: j, del: false };
  const el = document.getElementById('sheet');
  el.innerHTML = `<div class="sheet-bg" onclick="closeSheet()"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="eyebrow">${fmtD(x.d)}</div><h2 id="shT" style="margin:4px 0 14px">${esc(n)}</h2><div class="sheet-in"><div class="field" style="margin:0"><label for="shw">${isDB(n) ? 'Weight of each dumbbell (kg)' : 'Weight (kg)'}</label><input id="shw" type="number" step="0.5" inputmode="decimal" value="${x.w}"></div><div class="field" style="margin:0"><label for="shr">Reps</label><input id="shr" type="number" inputmode="numeric" value="${x.r}"></div><div class="field" style="margin:0"><label for="shq">RIR</label><select id="shq"><option value="">–</option>${[0, 1, 2, 3, 4].map(v => `<option value="${v}" ${x.q === v ? 'selected' : ''}>${v === 4 ? '4+' : v}</option>`).join('')}</select></div></div><div class="sheet-act"><button class="btn danger-ghost" id="shd" onclick="deleteSetEdit()">Delete set</button><button class="btn" onclick="saveSetEdit()">Save</button></div><button class="link" style="width:100%;margin-top:8px" onclick="closeSheet()">Cancel</button></div>`;
  el.hidden = false;
}
function closeSheet() {
  scanStop();
  SHEET = null;
  const el = document.getElementById('sheet');
  el.hidden = true;
  el.innerHTML = '';
}
function saveSetEdit() {
  if (!SHEET) return;
  const w = parseFloat(document.getElementById('shw').value),
    r = parseInt(document.getElementById('shr').value);
  if (!(w >= 0) || !(r > 0)) {
    toast('Enter a weight and at least 1 rep.');
    return;
  }
  const x = S.log[SHEET.n][SHEET.j],
    qv = document.getElementById('shq').value;
  x.w = w;
  x.r = r;
  if (qv === '') delete x.q;
  else x.q = +qv;
  save();
  closeSheet();
  draw();
  toast('Set updated');
}
function deleteSetEdit() {
  if (!SHEET) return;
  if (!SHEET.del) {
    SHEET.del = true;
    const b = document.getElementById('shd');
    b.textContent = 'Tap again to delete';
    b.classList.add('armed');
    return;
  }
  S.log[SHEET.n].splice(SHEET.j, 1);
  if (!S.log[SHEET.n].length) delete S.log[SHEET.n];
  save();
  closeSheet();
  draw();
  toast('Set deleted');
}

/* ---------- meal swaps ---------- */
function mealAt(i) {
  const r = S.swap && S.swap[today + '-' + i];
  return r != null && RECIPES[r]
    ? { n: MEALS[i].n, i: RECIPES[r].n, k: RECIPES[r].k, p: RECIPES[r].p, sw: 1 }
    : MEALS[i];
}
function toggleMealSwap(i) {
  MEAL_SWAP_OPEN = MEAL_SWAP_OPEN === i ? null : i;
  draw();
}
function swPicker(i) {
  const cat = {
      Breakfast: 'Breakfast',
      Lunch: 'Lunch',
      Snack: 'Snacks and shakes',
      Dinner: 'Dinner',
      Evening: 'Snacks and shakes'
    }[MEALS[i].n],
    cur = S.swap && S.swap[today + '-' + i],
    idx = RECIPES.map((r, j) => j).sort((a, b) => (RECIPES[b].w === cat) - (RECIPES[a].w === cat));
  return `<div class="picker">${cur != null ? `<button class="pk" onclick="pickMealSwap(${i},-1)"><span class="t"><b>Back to original</b><br><span class="mu sm">${esc(MEALS[i].i)}</span></span><span class="r">${Math.round(MEALS[i].k * mealScale())} kcal<br>${Math.round(MEALS[i].p * mealScale())}g P</span></button>` : ''}${idx
    .filter(j => j !== cur)
    .map(j => {
      const r = RECIPES[j];
      return `<button class="pk" onclick="pickMealSwap(${i},${j})"><span class="t"><b>${r.n}</b><br><span class="mu sm">${r.w} · ${r.t}</span></span><span class="r">${Math.round(r.k * mealScale())} kcal<br>${Math.round(r.p * mealScale())}g P</span></button>`;
    })
    .join('')}</div>`;
}
function pickMealSwap(i, j) {
  S.swap = S.swap || {};
  const k = today + '-' + i;
  if (j < 0) delete S.swap[k];
  else S.swap[k] = j;
  MEAL_SWAP_OPEN = null;
  save();
  draw();
  toast(j < 0 ? MEALS[i].n + ' is back to the original' : MEALS[i].n + ' swapped for ' + RECIPES[j].n);
}
