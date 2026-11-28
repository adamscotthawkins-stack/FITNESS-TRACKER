/* Session readout ("console") on Today and in workout mode, set tables, and the weekly lift chart. */
const pad2=n=>String(n).padStart(2,'0');
function hms(ms){if(!(ms>=0))return '--:--:--';const s=Math.floor(ms/1000);return pad2(Math.floor(s/3600))+':'+pad2(Math.floor(s%3600/60))+':'+pad2(s%60)}
function restFmt(ms){if(!(ms>0))return '–';const s=Math.round(ms/1000);if(s>=1200)return '20m+';const m=Math.floor(s/60),r=s%60;return m?m+'m'+(r?' '+r+'s':''):r+'s'}
function dateLine(d){const w=d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase(),m=d.toLocaleDateString('en-GB',{month:'short'}).toUpperCase().slice(0,3);let h=d.getHours();const ap=h<12?'AM':'PM';h=h%12||12;return `${w} ${pad2(d.getDate())}-${m}, ${h}:${pad2(d.getMinutes())}${ap}`}
/* warm-up = lighter than 70% of the heaviest set of that lift today */
const isWarm=(x,top)=>top>0&&x.w<.7*top;
/* today's session: working sets logged vs planned, and when the first and last sets were logged */
function sesInfo(){const p=PLAN[ti];if(!p||p.n==='Rest day'||!p.e.length)return null;const sp=qOn(ti)?ssMap(ti):{};let planned=0,logged=0,first=0,last=0;
p.e.forEach((e,i)=>{const nm=act(e[0]),nS=nSets(sp[i]?sp[i].t:e[1]),L=(S.log[nm]||[]).filter(x=>x.d===today),top=L.length?Math.max(...L.map(x=>x.w)):0,w=L.filter(x=>!isWarm(x,top)).length;
planned+=nS;logged+=S.done[dk(ti,i)]?nS:Math.min(nS,w);L.forEach(x=>{if(x.t){if(!first||x.t<first)first=x.t;if(x.t>last)last=x.t}})});
return {planned,logged,pc:planned?Math.min(100,Math.round(logged/planned*100)):0,first,last,fin:!!S.done['f'+wk+'-'+ti]}}
function conTimes(I){const n=Date.now();return {el:I&&I.first?hms((I.fin?I.last:n)-I.first):'00:00:00',rs:I&&I.last&&!I.fin?hms(n-I.last):'--:--:--'}}
/* the readout block (Today and workout mode) */
function conBlock(compact){const p=PLAN[ti],I=sesInfo(),T=conTimes(I),sk=streak();
return `<div class="con-head"><div class="con-txt"><div class="c-now">${dateLine(new Date())}</div>${compact?'':`<div><span class="k">Session:</span>${esc(p.n)}</div>`}
${I?`<div><span class="k">Elapsed:</span><span class="c-el">${T.el}</span></div><div><span class="k">Rest:</span><span class="c-rs">${T.rs}</span></div>`:`<div><span class="k">Focus:</span>${esc(p.f)}</div>`}</div>
${compact?'':`<span class="con-pill" aria-label="${sk} day streak">${ICO.flame}${sk}d streak</span>`}</div>
${I?`<div class="con-pr"><span class="c-pc">${ICO.checks}${I.pc}% (${I.logged}/${I.planned})</span><span>${I.fin?'Completed':p.e.length+' lifts · ~'+estMin(ti,qOn(ti))+' min'}</span></div><div class="con-bar" role="progressbar" aria-valuenow="${I.pc}" aria-valuemin="0" aria-valuemax="100" aria-label="Sets done"><i style="width:${I.pc}%"></i><b style="left:${I.pc}%"></b></div>`:''}`}
function consoleCard(){return `<section class="con">${conBlock(false)}${weekStrip()}</section>`}
/* the clocks tick every second without redrawing the page */
function conTick(){const els=document.querySelectorAll('.c-now');if(!els.length)return;const I=sesInfo(),T=conTimes(I),dl=dateLine(new Date());
els.forEach(e=>{if(e.textContent!==dl)e.textContent=dl});document.querySelectorAll('.c-el').forEach(e=>e.textContent=T.el);document.querySelectorAll('.c-rs').forEach(e=>e.textContent=T.rs)}
/* suggested next set: the last set logged today (if it wasn't a warm-up), otherwise the add-weight tip */
function nextSet(d,i){const e=PLAN[d].e[i],nm=act(e[0]),L=S.log[nm]||[],td=L.filter(x=>x.d===today),pv=L.filter(x=>x.d!==today).pop(),lt=td[td.length-1],A=adv(nm,e[1],pv),m=String(e[1]).match(/[×xX]\s*(\d+)/);
const useLt=lt&&(!A||lt.w>=.7*A.w);return {w:useLt?lt.w:A?A.w:lt?lt.w:0,r:useLt?lt.r:A?A.r:(m?+m[1]:8)}}
function logPlanned(d,i){const nx=nextSet(d,i);logSet(d,i,nx.w,nx.r,null)}
/* set table: today's sets (W = warm-up, rest = time since the set before) then the planned sets still to do */
function setTable(d,i,wm){const e=PLAN[d].e[i],nm=act(e[0]),sp=qOn(d)?ssMap(d):{},nS=nSets(sp[i]?sp[i].t:e[1]),L=S.log[nm]||[],idx=[];L.forEach((x,j)=>{if(x.d===today)idx.push(j)});
const top=idx.length?Math.max(...idx.map(j=>L[j].w)):0,fz=S.done['f'+wk+'-'+d],dr=(sp[i]&&sp[i].a?60:big(nm)?150:90)*1000,u=isDB(nm)?'kg ea':'kg';let n=0,prev=null;
const rows=idx.map(j=>{const x=L[j],w=isWarm(x,top);if(!w)n++;const rs=prev&&x.t&&prev.t?restFmt(x.t-prev.t):'–';prev=x;
return `<button class="st-r ${w?'wu':'ok'}" onclick="es(${nk(nm)},${j})" aria-label="${w?'Warm-up':'Set '+n}: ${x.w} kg × ${x.r}. Tap to edit"><span class="st-n">${w?'W':n}</span><span>${x.w}<small>${u}</small></span><span>${x.r}${x.q!=null?`<small>@${x.q}</small>`:''}</span><span class="st-rest">${rs}</span><span class="st-c on">${ICO.check}</span></button>`});
const nx=wm?{w:WM.w,r:WM.r}:nextSet(d,i),left=fz?0:Math.max(0,nS-n);
for(let k=0;k<left;k++)rows.push(`<div class="st-r todo${k?'':' next'}"><span class="st-n">${n+k+1}</span><span>${nx.w}<small>${u}</small></span><span>${nx.r}</span><span class="st-rest">${restFmt(dr)}</span>${k?'<span class="st-c"></span>':`<button class="st-c" onclick="${wm?'wmLog()':`logPlanned(${d},${i})`}" aria-label="Log set ${n+1}: ${nx.w} kg × ${nx.r}"></button>`}</div>`);
return `<div class="st"><div class="st-h"><span>#</span><span>Weight</span><span>Reps</span><span>Rest</span><span aria-label="Done">${ICO.check}</span></div>${rows.join('')||'<div class="st-e">No sets planned</div>'}</div>`}
/* weekly chart for one lift: bars = working sets that week, line = best estimated max, with 100% and 75% lines */
function liftWeeks(nm,n){const L=S.log[nm]||[],out=[];for(let k=n-1;k>=0;k--){const a=addDays(wk,-7*k),b=addDays(a,6),W=L.filter(x=>x.d>=a&&x.d<=b),top=W.length?Math.max(...W.map(x=>x.w)):0;
out.push({a,m:W.length?Math.max(...W.map(x=>e1(x.w,x.r,x.q))):0,s:W.filter(x=>!isWarm(x,top)).length})}return out}
/* weeks to show: the chosen range (3, 6 or 12 months), trimmed to when this lift was first logged (at least 4) */
function chartWeeks(nm){const L=S.log[nm]||[];if(!L.length)return 4;const f=L.reduce((m,x)=>x.d<m?x.d:m,L[0].d),mon=addDays(f,-((new Date(f+'T12:00').getDay()+6)%7));return Math.max(4,Math.min(S.wcr||13,Math.floor(dd(mon,wk)/7)+1))}
function weekChart(nm){const Wk=liftWeeks(nm,chartWeeks(nm));if(Wk.filter(w=>w.m).length<2)return '<div class="empty">Log this lift in two or more weeks to see your weekly max.</div>';
const best=Math.max(...Wk.map(w=>w.m)),hi=Math.ceil(best*1.08/10)*10,lo=Math.max(0,Math.floor(Math.min(...Wk.filter(w=>w.m).map(w=>w.m))*.8/10)*10),ms=Math.max(4,...Wk.map(w=>w.s)),
Wd=340,H=190,L=34,R=24,T=14,B=22,n=Wk.length,bw=(Wd-L-R)/n,X=i=>L+bw*i+bw/2,Y=v=>T+(hi-v)/(hi-lo)*(H-T-B),YS=s=>H-B-(s/ms)*(H-T-B)*.85,tk=nice(lo,hi,4);
let s=`<svg class="chart wk-ch" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Weekly best estimated max for ${esc(nm)}">`;
s+=tk.filter(v=>v>=lo&&v<=hi).map(v=>`<line x1="${L}" x2="${Wd-R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width=".6"/><text x="${L-6}" y="${(Y(v)+3.5).toFixed(1)}" text-anchor="end" class="ax">${v}</text>`).join('');
s+=Wk.map((w,i)=>w.s?`<rect x="${(X(i)-bw*.36).toFixed(1)}" y="${YS(w.s).toFixed(1)}" width="${(bw*.72).toFixed(1)}" height="${(H-B-YS(w.s)).toFixed(1)}" rx="2" fill="var(--bars)"/>`:'').join('');
[[1,'100%','var(--hash)'],[.75,'75%','var(--pink)']].forEach(([f,l,c])=>{const v=best*f;if(v>=lo&&v<=hi)s+=`<line x1="${L}" x2="${Wd-R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="${c}" stroke-width="1"/><text x="${L+4}" y="${(Y(v)-4).toFixed(1)}" class="ax" fill="${c}" style="fill:${c}">${l}, ${Math.round(v*2)/2}kg</text>`});
const pts=Wk.map((w,i)=>w.m?[X(i),Y(w.m)]:null).filter(Boolean);s+=`<polyline points="${pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
s+=pts.map(q=>`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.4" fill="var(--accent)"/>`).join('');
s+=[...new Set([0,Math.round((n-1)/3),Math.round(2*(n-1)/3),n-1])].map(i=>`<text x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="middle" class="ax">${fmtD(Wk[i].a)}</text>`).join('')+`<text x="${Wd-2}" y="${(YS(ms)+4).toFixed(1)}" text-anchor="end" class="ax">${ms}</text>`;
const now=Wk.slice(-4).reduce((m,w)=>Math.max(m,w.m),0),then=Wk.slice(-8,-4).reduce((m,w)=>Math.max(m,w.m),0),ch=then?Math.round((now-then)/then*100):null,
L3=(S.log[nm]||[]).filter(x=>x.d>=addDays(today,-91)),bs=L3.length?L3.reduce((m,x)=>e1(x.w,x.r,x.q)>e1(m.w,m.r,m.q)?x:m):null;
return `<div class="wk-ctl"><span class="wk-pill">${ICO.chart}Weekly max</span><div class="seg sm" role="group" aria-label="Chart range">${[[13,'3M'],[26,'6M'],[52,'1Y']].map(r=>`<button class="${(S.wcr||13)===r[0]?'on':''}" onclick="S.wcr=${r[0]};save();draw()">${r[1]}</button>`).join('')}</div></div><div class="wk-head"><span class="wk-lg"><i class="ln"></i>Est. max <i class="br"></i>Sets</span></div>${s}</svg>
<div class="e1r"><div><span class="g">Est 1RM</span><br><span>L3M best</span></div><div class="r"><span class="g">${Math.round(now*10)/10}kg${ch!=null?` (${ch>=0?'+':''}${ch}%)`:''}</span><br><span>${bs?bs.w+'kg × '+bs.r:'–'}</span></div></div>`}
