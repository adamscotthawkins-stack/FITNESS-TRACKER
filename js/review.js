/* Sunday check-in with Claude */
/* ---------- weekly review (Claude) ---------- */
let SMP=null,DLS=null,RV=null,RS=null;
function revHtml(t){let h='',ul=false;String(t||'').split('\n').forEach(l=>{l=l.trim();if(!l)return;const b=l.match(/^[-•*]\s+(.*)/);if(b){if(!ul){h+='<ul>';ul=true}h+='<li>'+esc(b[1].replace(/\*\*/g,''))+'</li>'}else{if(ul){h+='</ul>';ul=false}h+='<h4>'+esc(l.replace(/[#*:]/g,'').trim())+'</h4>'}});return (h+(ul?'</ul>':''))||'<div class="mu">Reading your week…</div>'}
function revPrompt(){const we=addDays(wk,6),lw=addDays(wk,-7),ls=addDays(wk,-1),blk=(a,b)=>{const o={};for(const n in S.log)S.log[n].forEach(x=>{if(x.d>=a&&x.d<=b)(o[n]=o[n]||[]).push(x.d.slice(5)+' '+x.w+'kg×'+x.r+(x.q!=null?' (RIR '+x.q+')':''))});return Object.keys(o).map(n=>'- '+n+': '+o[n].join(', ')).join('\n')||'(nothing logged)'};
const ds=dayStats(),ns=(a)=>[0,1,2,3,4,5,6].map(k=>addDays(a,k)).filter(d=>ds[d]).length,c={Chest:0,Back:0,Shoulders:0,Arms:0,Legs:0,Core:0};for(const n in S.log)S.log[n].forEach(x=>{if(x.d>=wk&&x.d<=we)c[mg(n)]++});
const plan=PLAN.map((p,i)=>DAYS[i]+': '+p.n+(p.n==='Rest day'?'':' — '+p.e.map(e=>e[0]+' '+e[1]).join('; '))).join('\n'),notes=Object.entries(notesFor(wk)).map(([k,v])=>'- '+k+': '+v).join('\n')||'none',setup=Object.entries(S.setup||{}).map(([k,v])=>'- '+k+': '+v).join('\n')||'none',hb=[0,1,2,3,4,5,6].map(k=>addDays(wk,k)).map(d=>Object.values(S.habits[d]||{}).filter(Boolean).length).reduce((a,b)=>a+b,0);
return `You are a friendly, knowledgeable strength coach writing a short Sunday weekly check-in for someone using their gym tracking app. Speak to them directly as "you". Be encouraging but honest, and specific: use real lift names and numbers from the data. Never invent data. If little was logged, say so kindly and keep it short.

Goal: ${GOALS[S.goal][0]} (${prof()?'about '+bodyW()+' kg, '+S.prof.h+' cm, age '+S.prof.age:'body stats not given'}). ${goalsTxt()}
Today: ${today}. Week: ${wk} to ${we}.${inDl()?' This was a planned deload week at ~60% weights, so lower numbers are expected.':''}
Hard training weeks (3+ sessions) since last deload: ${dlWeeks()}. Lifts whose best set dropped 7.5%+ vs the session before (often just an equipment change, so treat as a weak signal): ${slipping().join(', ')||'none'}. Only recommend a deload after 6+ hard weeks, or 4+ hard weeks with three or more lifts dropping. Exercises with a bracketed equipment name or a different name are swaps or variations of a planned lift; compare them only with their own history.

Weekly plan:
${plan}

THIS WEEK — ${ns(wk)} of ${NT()} sessions trained. Sets (weight×reps, RIR = reps in reserve):
${blk(wk,we)}
Sets per muscle this week: ${Object.entries(c).map(([k,v])=>k+' '+v).join(', ')} (target 10–20).

LAST WEEK — ${ns(lw)} sessions:
${blk(lw,ls)}

Body weight log (latest 6): ${S.weights.slice(-6).map(x=>x.d+' '+x.w+'kg').join(', ')||'none'}
Daily habits ticked this week: ${hb} of 35. Days all stretches were done this week: ${[0,1,2,3,4,5,6].map(k=>addDays(wk,k)).filter(full).length} of 7.
Their lift notes written this week (one per exercise, written during sessions):
${notes}

Saved equipment setup reminders (background only, these carry over each week; do not review them):
${setup}

Reply in plain text only. No markdown symbols except "- " at the start of bullets. Use exactly these four headings, each on its own line: What went well / What to watch / Focus for next week / Your notes. Under each of the first three, write 2–3 bullets of at most 25 words each. In "Focus for next week" give concrete targets (weights or reps) for 1–3 key lifts.
Under "Your notes", analyse this week's lift notes in 2–4 bullets of at most 30 words each: spot patterns or recurring themes (pain or discomfort, fatigue, form cues, things that felt easy or hard), connect them to the logged sets and RIR where relevant, and say what to do about each next week. Treat anything about pain seriously and suggest easing off or getting it checked if it persists. If there were no notes this week, write one bullet saying so and suggest jotting a quick note after hard sets next week.`}
let RP=false;
async function revCopy(){try{await navigator.clipboard.writeText(revPrompt());RP=true;draw();toast('Copied. Paste it into Claude, then paste the reply back here.')}catch(e){toast('Copying isn’t allowed here.')}}
function revSave(){const el=document.getElementById('revin'),t=el?el.value.trim():'';if(!t){toast('Paste Claude’s reply first.');return}S.rev=S.rev||{};S.rev[wk]={t:t,at:today};RP=false;save();draw();toast('Review saved')}
function wnList(){const o=Object.entries(notesFor(wk));return o.length?`<details class="rcp" style="margin-top:8px"><summary><b>This week’s notes</b><br><span class="mu">${o.length} note${o.length>1?'s':''} · clear on Monday</span></summary><ul class="wn">${o.map(([k,v])=>`<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul></details>`:''}
function revCard(){const sun=ti===6,r=S.rev&&S.rev[wk],old=S.rev&&Object.keys(S.rev).filter(k=>k<wk).sort().pop(),ask=!r||RP;
return `<div class="card rev${sun&&!r?' dlb':''}"><div class="ed-head"><div class="ch"><span class="ci" style="--c:var(--violet)">${ICO.sparkle}</span><h2>Sunday check-in</h2></div>${r&&!RP?'<button class="link" onclick="RP=true;draw()">Redo</button>':r?'<button class="link" onclick="RP=false;draw()">Cancel</button>':''}</div>${!ask?`<div class="mu sm">Claude’s review of the week of ${fmtD(wk)}</div>${revHtml(r.t)}${wnList()}`:`<div class="mu">${sun?'It’s Sunday. ':''}Claude reads your week (sets, effort, weight and notes) and tells you what went well, what to watch, what to aim for next week, and what your notes are telling you.${sun?'':' Best done on Sunday, after your last session.'}</div>
${coCfg()?`<button class="btn" style="width:100%;margin-top:12px" onclick="coReview()">${ICO.sparkle}<span>Get my review from Claude</span></button><div class="mu sm" style="margin:10px 2px 0">Or use the Claude app:</div>`:''}<button class="btn${coCfg()?' ghost':''}" style="width:100%;margin-top:12px" onclick="revCopy()">${RP?'1. Copy my week again':'1. Copy my week for Claude'}</button>
<a class="btn ghost" style="width:100%;margin-top:8px;display:flex;align-items:center;justify-content:center;text-decoration:none" href="https://claude.ai/new" target="_blank" rel="noopener">2. Open Claude and paste it</a>
<textarea id="revin" class="fi" rows="6" placeholder="3. Paste Claude’s reply here" aria-label="Claude’s reply" style="width:100%;height:auto;padding:10px 12px;margin-top:8px;resize:vertical;font:16px/1.4 var(--f-body)"></textarea>
<button class="btn" style="width:100%;margin-top:8px" onclick="revSave()">4. Save review</button>`}${old&&ask?`<details class="rcp" style="margin-top:8px"><summary><b>Last review</b><br><span class="mu">Week of ${fmtD(old)}</span></summary>${revHtml(S.rev[old].t)}</details>`:''}</div>`}
