/* Workout mode: full screen, one exercise at a time, with big buttons for the gym.
   Sets go through the same logSet() as the Today list, so tips, PRs and the rest timer behave the same. */
let WM=null;
const isBarbell=n=>!isDB(n)&&!/machine|cable|leg press|pulldown|pushdown|pec deck|pull-?up|chin|dip|crunch|raise|extension|curl|fly|face pull|lunge|split squat/i.test(n)&&/bench|squat|deadlift|rack pull|barbell|row|hip thrust|smith|overhead press|military|close-grip/i.test(n);
function platesTxt(w){if(!(w>20))return '';let s=(w-20)/2;const g=[];[25,20,15,10,5,2.5,1.25].forEach(p=>{const n=Math.floor(s/p+1e-9);if(n){g.push((n>1?n+'×':'')+p);s-=n*p}});return g.length?'Each side of a 20 kg bar: '+g.join(' + ')+(s>.01?' (can’t load the last '+(s*2).toFixed(2)+' kg)':''):''}
/* starting numbers for exercise i: last set logged today, else the add-weight tip */
function wmSeed(i){const s=nextSet(ti,i);WM.w=s.w;WM.r=s.r;WM.q=null;WM.fin=false}
function wmOpen(){const p=PLAN[ti];if(p.n==='Rest day'||!p.e.length)return;let i=p.e.findIndex((_,j)=>!S.done[dk(ti,j)]);if(i<0)i=0;WM={i:i};wmSeed(i);unlockAudio();document.body.classList.add('wm');document.getElementById('wm').hidden=false;wmDraw()}
function wmClose(){WM=null;document.body.classList.remove('wm');const el=document.getElementById('wm');el.hidden=true;el.innerHTML='';draw()}
function wmGo(k){if(!WM)return;const n=PLAN[ti].e.length,j=Math.max(0,Math.min(n-1,WM.i+k));if(j===WM.i)return;WM.i=j;wmSeed(j);wmDraw('slide'+(k>0?'L':'R'))}
function wmStep(f,dlt){if(!WM)return;const n=act(PLAN[ti].e[WM.i][0]);if(f==='w')WM.w=Math.max(0,Math.round((WM.w+dlt*inc(n))*100)/100);else WM.r=Math.max(1,WM.r+dlt);wmDraw()}
function wmSet(f,el){const v=parseFloat(el.value);if(f==='w'&&v>=0)WM.w=v;if(f==='r'&&v>=1)WM.r=Math.round(v);wmDraw()}
function wmQ(v){if(!WM)return;WM.q=WM.q===v?null:v;wmDraw()}
function wmLog(){if(!WM)return;if(logSet(ti,WM.i,WM.w,WM.r,WM.q)){WM.q=null;wmDraw();const r=document.querySelectorAll('#wm .st-r.ok,#wm .st-r.wu'),el=r[r.length-1];if(el)el.classList.add('pop')}}
function wmFinish(){if(!WM)return;const left=PLAN[ti].e.filter((_,j)=>!S.done[dk(ti,j)]).length;if(left&&!WM.fin){WM.fin=true;wmDraw();return}wmClose();fin()}
function wmTab(t){if(!WM)return;WM.tab=t;wmDraw();const m=document.querySelector('.wm-main');if(m)m.scrollTop=0}
function wmDraw(anim){if(!WM)return;const p=PLAN[ti],E=p.e,i=WM.i,e=E[i],nm=act(e[0]),k=dk(ti,i),q=qOn(ti)?ssMap(ti)[i]:null,tgt=q?q.t:e[1],L=S.log[nm]||[],pv=L.filter(x=>x.d!==today).pop(),A=adv(nm,e[1],pv),
su=(S.setup||{})[nm],last=i===E.length-1,left=E.filter((_,j)=>!S.done[dk(ti,j)]).length,fz=S.done['f'+wk+'-'+ti],pl=isBarbell(nm)?platesTxt(WM.w):'',u=isDB(nm)?'kg each':'kg',tb=WM.tab||'sets',td=L.filter(x=>x.d===today),h=howOf(nm);
let body='';
if(tb==='sets')body=`${weekChart(nm)}
${fbBanner(ti,i)}
${su?`<div class="note su" style="margin-top:10px"><span class="ni">${ICO.pin}</span><span class="nb"><b>Setup:</b> ${esc(su)}</span></div>`:''}
${setTable(ti,i,true)}
<div class="wm-steps"><div class="wm-st"><label for="wmw">Weight · ${u}</label><input id="wmw" type="number" inputmode="decimal" step="0.5" value="${WM.w}" onchange="wmSet('w',this)" onfocus="this.select()"><div class="wm-pm"><button onclick="wmStep('w',-1)" aria-label="Less weight">${ICO.minus}</button><button onclick="wmStep('w',1)" aria-label="More weight">${ICO.plus}</button></div></div>
<div class="wm-st"><label for="wmr">Reps</label><input id="wmr" type="number" inputmode="numeric" value="${WM.r}" onchange="wmSet('r',this)" onfocus="this.select()"><div class="wm-pm"><button onclick="wmStep('r',-1)" aria-label="One less rep">${ICO.minus}</button><button onclick="wmStep('r',1)" aria-label="One more rep">${ICO.plus}</button></div></div></div>
${pl?`<div class="wm-plates">${ICO.disc}<span>${pl}</span></div>`:''}
<div class="wm-rir"><span>Reps in reserve</span><div class="seg sm" role="group" aria-label="Reps in reserve">${[0,1,2,3,4].map(v=>`<button class="${WM.q===v?'on':''}" onclick="wmQ(${v})">${v===4?'4+':v}</button>`).join('')}</div></div>`;
else if(tb==='guide')body=h?`<ol class="how-st">${h.st.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="how-b"><span class="ci" style="--c:var(--green)">${ICO.check}</span><div><b>Feel it in</b><br>${esc(h.feel)}</div></div><div class="how-b"><span class="ci" style="--c:var(--rose)">${ICO.x}</span><div><b>Avoid</b><br>${esc(h.avoid)}</div></div>`:'<div class="empty">No guide for this exercise yet.</div>';
else{const days=[...new Set(L.map(x=>x.d))].sort().reverse().slice(0,8);let b=0;const prd={};L.forEach(x=>{const v=e1(x.w,x.r,x.q);if(v>b+1e-9){if(b>0)prd[x.d]=1;b=v}});
body=days.length?`<div class="hist-t">${days.map(d=>{const D=L.filter(x=>x.d===d),top=Math.max(...D.map(x=>x.w));return `<div class="hist-r"><div class="hist-d">${fmtD(d)}${prd[d]?' <span class="pill up">PR</span>':''}</div><div class="hist-s">${D.map(x=>`<span class="${isWarm(x,top)?'w':''}">${x.w}×${x.r}${x.q!=null?'@'+x.q:''}</span>`).join('')}</div></div>`}).join('')}</div><button class="btn ghost" style="width:100%;margin-top:12px" onclick="wmClose();S.cx=NK[${nk(nm)}];S.tab='progress';seg('lifts')">All history</button>`:'<div class="empty">No sets logged for this lift yet.</div>'}
document.getElementById('wm').innerHTML=`<div class="wm-top"><button class="ib" onclick="wmClose()" aria-label="Close workout mode">${ICO.x}</button><div class="wm-con">${conBlock(true)}</div><button class="con-pill pill-btn" onclick="wmFinish()">${WM.fin?'Finish?':'Finish'}</button></div>
<div class="wm-main ${anim||''}"><div class="wm-panel"><div class="wm-grip"></div>
<div class="wm-head"><div class="wm-ct">${esc(p.n)} · ${i+1}/${E.length} · target ${esc(tgt)}${q&&q.g?' · superset '+q.g:''}${S.done[k]?' · done':''}</div>${exHead(nm)}${nm!==e[0]?`<span class="mu sm"> · instead of ${esc(e[0])}</span>`:''}</div>
<div class="wm-tabs" role="tablist">${[['sets','Sets'],['guide','Guide'],['hist','History']].map(t=>`<button role="tab" aria-selected="${tb===t[0]}" class="${tb===t[0]?'on':''}" onclick="wmTab('${t[0]}')">${t[1]}</button>`).join('')}</div>
${body}</div></div>
<div class="wm-foot">${fz?'<div class="mu" style="text-align:center;padding:8px">This workout is complete.</div>':`<button class="btn wm-log" onclick="wmLog()">${ICO.check}<span>Log set ${td.length+1} · ${WM.w}${u==='kg'?'kg':'kg ea'} × ${WM.r}</span></button>`}
<div class="wm-nav"><button class="btn ghost" onclick="wmGo(-1)" ${i?'':'disabled'}>${ICO.left}<span>Back</span></button>${last?`<button class="btn ${left?'ghost':''}" onclick="wmFinish()">${WM.fin?`Finish with ${left} left?`:'Finish workout'}</button>`:`<button class="btn ghost" onclick="wmGo(1)"><span>${S.done[k]?'Next':'Skip'}</span>${ICO.right}</button>`}</div></div>`}
/* swipe left or right to change exercise (set up from main.js) */
function wmSwipe(){let x0=null,y0=0;document.addEventListener('touchstart',e=>{if(!WM||e.target.closest('input,select,.sheet-card'))return x0=null;x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{if(!WM||x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)>70&&Math.abs(dx)>2*Math.abs(dy))wmGo(dx<0?1:-1)},{passive:true})}
/* a short chime when the rest timer ends (iPhone needs a tap first to allow sound; silent mode mutes it) */
let AC=null;function unlockAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function beep(){if(!AC)return;try{[0,.22,.44].forEach((t,j)=>{const o=AC.createOscillator(),g=AC.createGain(),s=AC.currentTime+t;o.type='sine';o.frequency.value=j===2?1320:880;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.35,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+.18);o.start(s);o.stop(s+.2)})}catch(e){}}
