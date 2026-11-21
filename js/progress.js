/* Progress tab: overview, lifts, body, calendar */
/* ---------- progress: overview ---------- */
function dayStats(){const m={};for(const n in S.log)S.log[n].forEach((x,j)=>{const q=m[x.d]=m[x.d]||{sets:0,t:0,l:{}};q.sets++;q.t+=x.w*x.r*(isDB(n)?2:1);(q.l[n]=q.l[n]||[]).push(j)});
for(const k in S.done){if(!S.done[k])continue;const q=k.match(/^x(\d{4}-\d\d-\d\d)-(\d)-/);if(q&&PLAN[+q[2]]&&PLAN[+q[2]].n!=='Rest day'){const d=addDays(q[1],+q[2]);(m[d]=m[d]||{sets:0,t:0,l:{}}).tick=1}}return m}
function trend(pts){const P=pts.filter(p=>p.d>=addDays(today,-42));if(P.length<3)return null;const t0=new Date(P[0].d+'T12:00'),x=P.map(p=>(new Date(p.d+'T12:00')-t0)/864e5),y=P.map(p=>p.v),n=x.length,mx=x.reduce((a,b)=>a+b)/n,my=y.reduce((a,b)=>a+b)/n,sxx=x.reduce((a,v)=>a+(v-mx)**2,0);if(x[n-1]-x[0]<21)return null;const k=Math.max(-2.5/7,Math.min(2.5/7,x.reduce((a,v,i)=>a+(v-mx)*(y[i]-my),0)/sxx));return {k:k*7,at:d=>my+k*((new Date(d+'T12:00')-t0)/864e5-mx)}}
function tonCard(){const st=allSets(),wks=[];for(let k=7;k>=0;k--){const a=addDays(wk,-7*k),b=addDays(a,6);wks.push({d:a,v:ton(st.filter(x=>x.d>=a&&x.d<=b))})}
if(!wks.some(w=>w.v))return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--indigo)">${ICO.bars}</span><h2>Weekly volume</h2></div><div class="empty">Log sets with weights and your weekly total shows up here.</div></div>`;
const W=340,H=170,L=4,R=4,T=22,B=24,n=wks.length,g=8,bw=(W-L-R-g*(n-1))/n,mx=Math.max(...wks.map(w=>w.v),1),Yh=v=>(H-T-B)*v/mx,hiI=wks.reduce((m,w,i)=>w.v>wks[m].v?i:m,0);
TIP.tn=wks.map((w,i)=>`<b>${i===n-1?'This week':'Week of '+fmtD(w.d)}</b> · ${fmtTp(w.v)} lifted`);
let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Total weight lifted per week, last 8 weeks"><line x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}" stroke="var(--line)"/>`;
wks.forEach((w,i)=>{const x=L+i*(bw+g),h=Yh(w.v),cur=i===n-1,y=H-B-h;if(h>0){const r=Math.min(4,h);s+=`<path d="M${x.toFixed(1)} ${H-B} V${(y+r).toFixed(1)} Q${x.toFixed(1)} ${y.toFixed(1)} ${(x+r).toFixed(1)} ${y.toFixed(1)} H${(x+bw-r).toFixed(1)} Q${(x+bw).toFixed(1)} ${y.toFixed(1)} ${(x+bw).toFixed(1)} ${(y+r).toFixed(1)} V${H-B} Z" fill="var(--accent)" fill-opacity="${cur?1:.35}"/>`}
if((cur||i===hiI)&&w.v)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" class="ax val">${fmtTp(w.v)}</text>`;
const dt=new Date(w.d+'T12:00');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${H-7}" text-anchor="middle" class="ax">${cur?'Now':dt.getDate()+'/'+(dt.getMonth()+1)}</text><rect x="${(x-g/2).toFixed(1)}" y="${T}" width="${(bw+g).toFixed(1)}" height="${H-T}" fill="transparent" class="hit" onclick="tip('tn',${i})"><title>${fmtTp(w.v)}</title></rect>`});
return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--indigo)">${ICO.bars}</span><h2>Weekly volume</h2></div><div class="mu sm">Total weight moved (kg × reps), last 8 weeks</div>${s}</svg><div class="cap" id="tn-cap">Tap a week for details</div></div>`}
function prList(){const out=[];for(const n in S.log){let b=0;S.log[n].forEach(x=>{const v=e1(x.w,x.r,x.q);if(v>b+1e-9){if(b>0)out.push({n:n,d:x.d,w:x.w,r:x.r,v:v});b=v}})}return out.sort((a,c)=>a.d<c.d?1:a.d>c.d?-1:0)}
function prCard(){const p=prList().slice(0,5);return `<div class="card"><div class="ch"><span class="ci" style="--c:var(--amber)">${ICO.trophy}</span><h2>Recent PRs</h2></div>${p.length?p.map(x=>`<div class="row"><span class="t"><b>${esc(x.n)}</b><br><span class="mu sm">${fmtD(x.d)}</span></span><span class="r"><b>${x.w}${kg(x.n)} × ${x.r}</b><br>est. max ${Math.round(x.v*10)/10} kg</span></div>`).join(''):'<div class="empty">Beat a previous best on any lift and it shows up here.</div>'}</div>`}
function overview(){const st=allSets(),we=addDays(wk,6),lw=addDays(wk,-7),cur=st.filter(x=>x.d>=wk&&x.d<=we),prev=st.filter(x=>x.d>=lw&&x.d<wk),ct=ton(cur),pt=ton(prev),ds=dayStats(),days=[0,1,2,3,4,5,6].map(k=>addDays(wk,k)).filter(d=>ds[d]).length,dl=pt?Math.round((ct-pt)/pt*100):null;
return `<div class="tiles">${tile('Sessions',days+'<small> / '+NT()+'</small>','this week')}${tile('Sets',cur.length,'this week')}${tile('Volume',fmtT(ct),dl==null?'this week':`<span class="pill ${dl>=0?'up':'down'}">${dl>=0?'+':''}${dl}%</span> vs last week`)}</div>
${ti===6?revCard():''}${goalsSection()}${recapCard()}${tonCard()}${checkCard()}${weekMuscleCard()}${prCard()}${ti===6?'':revCard()}${badgeCard()}`}

/* ---------- progress: lifts ---------- */
function pick(i){S.cx=NK[i];save();draw();try{scrollTo(0,0)}catch(e){}}
function liftsView(){const names=Object.keys(S.log).filter(n=>S.log[n].length);if(!names.length)return `<div class="card"><div class="empty">Log a set from the Today tab and your lifts show up here, with charts and full history.</div></div>`;
const lastD=n=>S.log[n].reduce((m,x)=>x.d>m?x.d:m,'');names.sort((a,b)=>lastD(a)<lastD(b)?1:lastD(a)>lastD(b)?-1:0);
const n=S.cx&&S.log[S.cx]&&S.log[S.cx].length?S.cx:names[0],L=S.log[n],rg=S.rg==null?12:S.rg,from=rg?addDays(today,-7*rg):'0000';
const by={},prD={};let best=0;L.forEach(x=>{const v=e1(x.w,x.r,x.q);if(v>best+1e-9){if(best>0)prD[x.d]=1;best=v}const q=by[x.d];if(!q||v>q.v)by[x.d]={v:v,s:x.w+kg(n)+' × '+x.r}});
const pts=Object.keys(by).sort().filter(d=>d>=from).map(d=>({d:d,v:Math.round(by[d].v*10)/10,s:by[d].s,pr:!!prD[d]}));
const hs=L.reduce((m,x)=>x.w>m.w||(x.w===m.w&&x.r>m.r)?x:m),dates=[...new Set(L.map(x=>x.d))].sort().reverse().filter(d=>d>=from);
return `<div class="card"><label class="eyebrow" for="lsel">Lift</label><select id="lsel" onchange="S.cx=this.value;save();draw()">${names.map(k=>`<option value="${esc(k)}" ${k===n?'selected':''}>${esc(k)}</option>`).join('')}</select>
${S.setup&&S.setup[n]?`<div class="note su" style="margin-top:10px"><span class="ni">${ICO.pin}</span><span class="nb"><b>Setup:</b> ${esc(S.setup[n])}</span></div>`:''}${S.notes&&S.notes[n]?`<div class="note" style="margin-top:${S.setup&&S.setup[n]?6:10}px"><span class="ni">${ICO.note}</span><span class="nb">${esc(S.notes[n])}</span></div>`:''}<div class="tiles t2">${tile('Estimated max',Math.round(best*10)/10+'<small> kg</small>','')}${tile('Heaviest set',hs.w+'<small>'+kg(n)+' × '+hs.r+'</small>',fmtD(hs.d))}</div>
${rgChips()}${lineChart('lc',pts,{unit:'kg',aria:'Estimated max per session for '+esc(n),empty:'Log this lift on two or more days in this range to see a chart.'})}${pts.length>=2?'<div class="legend"><span><i class="dot pr"></i>New best</span><span><i class="dot"></i>Best set that day</span></div>':''}</div>
<div class="card"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.clock}</span><h2>History</h2></div><div class="mu sm">Tap a set to fix or delete it.</div>${dates.length?dates.map(d=>`<div class="hist"><div class="hist-d">${fmtD(d)}${prD[d]?' <span class="pill up">PR</span>':''}</div><div class="sets">${L.map((x,j)=>x.d===d?chip(n,j,x):'').join('')}</div></div>`).join(''):'<div class="empty">No sets in this time range.</div>'}</div>
<div class="card"><div class="ch"><span class="ci" style="--c:var(--violet)">${ICO.list}</span><h2>All lifts</h2></div>${names.map(k=>{const b=Math.max(...S.log[k].map(x=>e1(x.w,x.r,x.q)));return `<button class="row rowbtn ${k===n?'cur':''}" onclick="pick(${nk(k)})"><span class="t">${esc(k)}</span><span class="r"><b>${Math.round(b*10)/10} kg</b><br>${S.log[k].length} sets</span></button>`}).join('')}</div>`}

/* ---------- progress: body ---------- */
function wdel(d){if(WD!==d){WD=d;draw();return}WD=null;S.weights=S.weights.filter(x=>x.d!==d);save();draw()}
function bodyView(){const Wt=S.weights,rg=S.rg==null?12:S.rg,from=rg?addDays(today,-7*rg):'0000',pts=Wt.filter(x=>x.d>=from).map(x=>({d:x.d,v:x.w})),l=Wt[Wt.length-1],ch=pts.length>1?Math.round((pts[pts.length-1].v-pts[0].v)*10)/10:null;
return `<div class="card"><div class="eyebrow">Body weight</div><div class="big">${l?l.w:'–'}<small> kg</small></div><div class="mu">${l?'Last weigh-in '+fmtD(l.d):'No weigh-ins yet'}${ch!=null?` · <span class="pill ${ch>=0?'up':'down'}">${ch>=0?'+':''}${ch} kg</span> ${rg?'in '+rg+' weeks':'all time'}`:''}</div>
<div class="row-in"><input id="w" type="number" step="0.1" inputmode="decimal" placeholder="Today’s weight (kg)"><button class="btn" onclick="addW()">Log</button></div>
${rgChips()}${lineChart('wc',pts,{unit:'kg',aria:'Body weight over time',empty:'Log your weight on two or more days to see your trend.'})}
${Wt.length?`<h3 class="rc">Recent weigh-ins</h3>${Wt.slice(-5).reverse().map(x=>`<div class="row"><span class="t">${fmtD(x.d)}</span><span class="r"><b>${x.w} kg</b></span><button class="ib del ${WD===x.d?'armed':''}" onclick="wdel('${x.d}')" aria-label="Delete weigh-in from ${fmtD(x.d)}">${WD===x.d?'Delete?':ICO.x}</button></div>`).join('')}`:''}</div>
${checkCard()}${hid('meas')?'':measCard()}${hid('photos')?'':photoCard()}`}

/* ---------- progress: calendar ---------- */
function cday(d){S.cd=S.cd===d?null:d;draw()}
function cmon(k){CM=Math.min(0,CM+k);draw()}
function calView(){const st=dayStats(),b=new Date(now.getFullYear(),now.getMonth()+CM,1),y=b.getFullYear(),mo=b.getMonth(),nd=new Date(y,mo+1,0).getDate(),lead=(b.getDay()+6)%7,mk=iso(b).slice(0,7);
let cells='';for(let i=0;i<lead;i++)cells+='<span class="cd pad"></span>';
for(let k=1;k<=nd;k++){const d=iso(new Date(y,mo,k)),s=st[d],lv=!s?0:s.sets>=20?4:s.sets>=12?3:s.sets>=1?2:1;cells+=`<button class="cd${lv?' l'+lv:''}${d===today?' today':''}${d===S.cd?' sel':''}" onclick="cday('${d}')" ${d>today?'disabled':''} aria-label="${fmtD(d)}${s?', '+s.sets+' sets':''}">${k}</button>`}
const ms=Object.keys(st).filter(d=>d.slice(0,7)===mk),sets=ms.reduce((a,d)=>a+st[d].sets,0),tn=Math.round(ms.reduce((a,d)=>a+st[d].t,0));
return `<div class="card"><div class="cal-head"><button class="ib" onclick="cmon(-1)" aria-label="Previous month">${ICO.left}</button><h2>${b.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h2><button class="ib" onclick="cmon(1)" ${CM>=0?'disabled':''} aria-label="Next month">${ICO.right}</button></div>
<div class="cal-dow">${['M','T','W','T','F','S','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cal">${cells}</div>
<div class="cal-key"><span>Fewer sets</span><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>More</span></div>
<div class="tiles">${tile('Sessions',ms.length,'this month')}${tile('Sets',sets,'this month')}${tile('Volume',fmtT(tn),'this month')}</div></div>${S.cd?dayCard(S.cd,st[S.cd]):'<div class="mu sm" style="text-align:center">Tap a day to see what you lifted.</div>'}`}
function dayCard(d,s){const wt=S.weights.find(x=>x.d===d);return `<div class="card"><div class="eyebrow">${new Date(d+'T12:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>${s&&s.sets?`<h2 style="margin-top:6px">${s.sets} sets · ${fmtTp(Math.round(s.t))}</h2>${Object.keys(s.l).map(n=>`<div class="hist"><div class="hist-d">${esc(n)}</div><div class="sets">${s.l[n].map(j=>chip(n,j,S.log[n][j])).join('')}</div></div>`).join('')}<div class="mu sm">Tap a set to fix or delete it.</div>${muscleCard(d)}`:s&&s.tick?'<h2 style="margin-top:6px">Session ticked off</h2><div class="mu">No weights were logged for this day.</div>':'<div class="mu" style="margin-top:6px">Nothing logged on this day.</div>'}${wt?`<div class="row" style="margin-top:6px"><span class="t">Body weight</span><span class="r"><b>${wt.w} kg</b></span></div>`:''}</div>`}

/* ---------- progress shell ---------- */
const PV=[['overview','Overview'],['lifts','Lifts'],['body','Body'],['calendar','Calendar']];
function seg(k){S.pv=k;ENT=1;PD=null;WD=null;save();draw()}
function progressView(){const v=S.pv||'overview';return `<h1>Progress</h1><div class="seg" role="tablist" aria-label="Progress views">${PV.map(x=>`<button role="tab" aria-selected="${v===x[0]}" class="${v===x[0]?'on':''}" onclick="seg('${x[0]}')">${x[1]}</button>`).join('')}</div>${v==='overview'?overview():v==='lifts'?liftsView():v==='body'?bodyView():calView()}`}
