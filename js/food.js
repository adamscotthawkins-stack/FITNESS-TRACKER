/* Food: search Open Food Facts (free food database), scan barcodes, and one-tap saved and recent foods.
   Barcode scanning uses the phone's built-in barcode reader when there is one, otherwise the
   barcode-detector library (ZXing-C++ in WebAssembly), loaded only when the scanner is opened. */
const OFF='https://world.openfoodfacts.org',OFF_F='code,product_name,product_name_en,brands,nutriments,serving_quantity,serving_size',
BD_URL='https://cdn.jsdelivr.net/npm/barcode-detector@3.2.3/dist/iife/ponyfill.js';
let FS={q:'',res:null,busy:false,err:''},FM=false,SCAN=null;
const r1=x=>Math.round(x*10)/10;
/* an Open Food Facts product -> {code,n,k100,p100,sq,ss}; null when it has no calorie data */
function offItem(p){if(!p)return null;const N=p.nutriments||{};let k=N['energy-kcal_100g'];if(k==null&&N.energy_100g!=null)k=N.energy_100g/4.184;if(k==null||isNaN(+k))return null;
const name=String(p.product_name_en||p.product_name||'').trim();if(!name)return null;const br=String(p.brands||'').split(',')[0].trim(),sq=parseFloat(p.serving_quantity);
return {code:String(p.code||''),n:br&&!name.toLowerCase().includes(br.toLowerCase())?name+' · '+br:name,k100:Math.round(+k),p100:r1(+(N.proteins_100g||0)),sq:sq>0&&sq<2000?sq:null,ss:p.serving_size?String(p.serving_size).slice(0,40):''}}
const portion=(f,g)=>({n:f.n,k:Math.round(f.k100*g/100),p:r1(f.p100*g/100),g:Math.round(g)});
async function offFetch(path){const r=await fetch(OFF+path,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('http '+r.status);return r.json()}
async function foodSearch(){const el=document.getElementById('fq'),q=el?el.value.trim():'';if(q.length<2){toast('Type at least 2 letters.');return}
FS={q:q,res:null,busy:true,err:''};draw();try{const j=await offFetch('/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=24&fields='+OFF_F);FS.res=(j.products||[]).map(offItem).filter(Boolean).slice(0,15)}
catch(e){FS.err='Food search needs an internet connection. Try again, or enter the food manually.'}FS.busy=false;draw()}
async function foodCode(code){toast('Looking up '+code+'…');try{const j=await offFetch('/api/v2/product/'+encodeURIComponent(code)+'.json?fields='+OFF_F),f=j&&j.status===1?offItem(j.product):null;
if(!f){toast('That barcode isn’t in the food database yet. Search by name or enter it manually.');return}amtSheet(f)}catch(e){toast('Couldn’t look that up. Check your connection.')}}
/* amount picker */
function amtSheet(f,i){const g=f.g||f.sq||100;SH={food:f};const el=document.getElementById('sheet'),fav=isFav(f.n);
el.innerHTML=`<div class="sheet-bg" onclick="shx()"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="eyebrow">${f.k100} kcal · ${f.p100} g protein per 100 g</div><h2 id="shT" style="margin:4px 0 12px">${esc(f.n)}</h2>
<div class="amt"><div class="field" style="margin:0"><label for="fg">Amount (g)</label><input id="fg" type="number" inputmode="decimal" value="${g}" oninput="amtCalc()" onfocus="this.select()"></div><div class="amt-out" id="famt"></div></div>
<div class="chips amt-q">${(f.sq?[[f.sq,'1 serving'+(f.ss?' ('+esc(f.ss)+')':'')]]:[]).concat([[50,'50 g'],[100,'100 g'],[150,'150 g'],[200,'200 g']]).map(x=>`<button class="chip" onclick="document.getElementById('fg').value=${x[0]};amtCalc()">${x[1]}</button>`).join('')}</div>
<label class="row" style="border:0;padding:6px 0 0"><input type="checkbox" id="ffav" ${fav?'checked':''}><span class="t">Save to my foods</span></label>
<div class="sheet-act"><button class="btn ghost" onclick="shx()">Cancel</button><button class="btn" onclick="amtAdd()">Add to today</button></div></div>`;el.hidden=false;amtCalc()}
function amtCalc(){if(!SH||!SH.food)return;const g=parseFloat(document.getElementById('fg').value)||0,x=portion(SH.food,g),el=document.getElementById('famt');if(el)el.innerHTML=`<b>${x.k}</b> kcal<br><b>${x.p}</b> g protein`}
function amtAdd(){if(!SH||!SH.food)return;const f=SH.food,g=parseFloat(document.getElementById('fg').value);if(!(g>0&&g<5000)){toast('Enter an amount in grams.');return}
const x=portion(f,g);(S.foods[today]=S.foods[today]||[]).push(Object.assign(x,{k100:f.k100,p100:f.p100}));if(document.getElementById('ffav').checked)favSet(Object.assign({},f,{g:Math.round(g)}),true);else favSet(f,false);
shx();FS.res=null;save();draw();toast('Added '+x.k+' kcal · '+x.p+' g protein')}
/* saved foods ("my foods") and recent foods */
const isFav=n=>(S.myFoods||[]).some(x=>x.n===n);
function favSet(f,on){S.myFoods=(S.myFoods||[]).filter(x=>x.n!==f.n);if(on)S.myFoods.unshift(f.k100!=null?{n:f.n,k100:f.k100,p100:f.p100,g:f.g||100}:{n:f.n,k:f.k,p:f.p});if(S.myFoods.length>40)S.myFoods.length=40}
function favTog(i){const f=fd()[i];if(!f)return;const on=!isFav(f.n);favSet(f.k100!=null?{n:f.n,k100:f.k100,p100:f.p100,g:f.g}:f,on);save();draw();toast(on?'Saved to my foods':'Removed from my foods')}
function recentFoods(){const seen=new Set(),out=[],from=addDays(today,-30);Object.keys(S.foods||{}).filter(d=>d>=from).sort().reverse().forEach(d=>(S.foods[d]||[]).slice().reverse().forEach(f=>{if(f&&f.n&&!seen.has(f.n)&&!isFav(f.n)){seen.add(f.n);out.push(f)}}));return out.slice(0,8)}
function quickAdd(src,i){const f=(src==='fav'?S.myFoods||[]:recentFoods())[i];if(!f)return;if(FM&&src==='fav'){S.myFoods.splice(i,1);save();draw();return}
const x=f.k100!=null?Object.assign(portion(f,f.g||100),{k100:f.k100,p100:f.p100}):{n:f.n,k:f.k,p:f.p};(S.foods[today]=S.foods[today]||[]).push(x);save();draw();toast('Added '+esc(f.n))}
const qLab=f=>esc(f.n.split(' · ')[0])+`<i>${f.k100!=null?Math.round(f.k100*(f.g||100)/100):f.k} kcal</i>`;
function foodCard(){const F=S.myFoods||[],R=recentFoods(),T=fd(),tk=T.reduce((a,f)=>a+f.k,0),tp=r1(T.reduce((a,f)=>a+f.p,0));
return `<div class="card" id="foodc"><div class="ch"><span class="ci" style="--c:var(--green)">${ICO.plus}</span><div class="ct"><h2>Add food</h2><div class="mu sm">Search, scan a barcode, or tap a food you’ve had before</div></div></div>
<div class="fsearch"><input id="fq" type="search" enterkeyhint="search" placeholder="Search foods, e.g. Greek yoghurt" value="${esc(FS.q)}" onkeydown="if(event.key==='Enter'){event.preventDefault();foodSearch()}"><button class="btn sm" onclick="foodSearch()" aria-label="Search">${ICO.search}</button><button class="btn sm ghost" onclick="scanOpen()" aria-label="Scan a barcode">${ICO.barcode}</button></div>
${FS.busy?'<div class="mu sm" style="padding:10px 2px">Searching…</div>':FS.err?`<div class="mu sm" style="padding:10px 2px">${FS.err}</div>`:FS.res?(FS.res.length?`<div class="fres">${FS.res.map((f,i)=>`<button class="pk" onclick="amtSheet(FS.res[${i}])"><span class="t"><b>${esc(f.n)}</b>${f.ss?`<br><span class="mu sm">Serving ${esc(f.ss)}</span>`:''}</span><span class="r">${f.k100} kcal<br>${f.p100} g P</span></button>`).join('')}<div class="mu sm" style="padding:4px 2px">Per 100 g · data from Open Food Facts <button class="link" style="font-size:13px" onclick="FS.res=null;FS.q='';draw()">Clear</button></div></div>`:'<div class="mu sm" style="padding:10px 2px">No foods found. Try fewer words, or enter it manually below.</div>'):''}
${F.length?`<div class="qh"><h3 class="rc">My foods</h3><button class="link" onclick="FM=!FM;draw()">${FM?'Done':'Edit'}</button></div><div class="qrow">${F.map((f,i)=>`<button class="qf${FM?' rm':''}" onclick="quickAdd('fav',${i})">${FM?ICO.x:''}${qLab(f)}</button>`).join('')}</div>`:''}
${R.length?`<h3 class="rc">Recent</h3><div class="qrow">${R.map((f,i)=>`<button class="qf" onclick="quickAdd('rec',${i})">${qLab(f)}</button>`).join('')}</div>`:''}
<details class="rcp"${F.length||R.length||FS.res?'':' open'}><summary><b>Enter manually</b><br><span class="mu">Name, calories and protein</span></summary><div class="fman"><input id="fn" placeholder="Food"><input id="fk" type="number" inputmode="numeric" placeholder="kcal"><input id="fp" type="number" inputmode="decimal" placeholder="g protein"></div><button class="btn sm" style="margin-top:8px" onclick="addF()">Add food</button></details>
${T.length?`<h3 class="rc">Added today · ${tk} kcal · ${tp} g protein</h3>${T.map((f,i)=>`<div class="row"><span class="t">${esc(f.n)}${f.g?`<br><span class="mu sm">${f.g} g</span>`:''}</span><span class="r">${f.k} kcal<br>${f.p} g P</span><button class="ib" onclick="favTog(${i})" aria-label="${isFav(f.n)?'Remove from':'Save to'} my foods" aria-pressed="${isFav(f.n)}">${isFav(f.n)?ICO.starOn:ICO.star}</button><button class="ib del" onclick="delF(${i})" aria-label="Remove ${esc(f.n)}">${ICO.x}</button></div>`).join('')}`:''}</div>`}
/* barcode scanner */
const BD_FORMATS=['ean_13','ean_8','upc_a','upc_e','code_128'];
function ldBD(){return window.BarcodeDetectionAPI?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=BD_URL;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
/* a detector for shop barcodes: built in if the phone has one that reads them, otherwise the library */
async function getDetector(){try{if('BarcodeDetector' in window){const f=await window.BarcodeDetector.getSupportedFormats();const use=BD_FORMATS.filter(x=>f.includes(x));if(use.length)return new window.BarcodeDetector({formats:use})}}catch(e){}
await ldBD();return new BarcodeDetectionAPI.BarcodeDetector({formats:BD_FORMATS})}
const goodCode=c=>/^\d{8,14}$/.test(c);
function scanMsg(t,err){const m=document.getElementById('scmsg');if(m){m.textContent=t;m.className='mu sm'+(err?' sc-err':'')}}
async function scanOpen(){scanStop();SH={scan:1};const S0=SCAN={on:true};const el=document.getElementById('sheet');
el.innerHTML=`<div class="sheet-bg" onclick="scanClose()"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="shT"><h2 id="shT" style="margin:0 0 10px">Scan a barcode</h2><div class="scan"><video id="scv" playsinline muted autoplay></video><i class="scan-box"></i><i class="scan-line"></i></div>
<div class="mu sm" id="scmsg" style="margin-top:10px">Loading the scanner…</div>
<div class="sc-type"><input id="scn" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Or type the number under the barcode" onkeydown="if(event.key==='Enter'){event.preventDefault();scanTyped()}"><button class="btn sm" onclick="scanTyped()">Look up</button></div>
<div class="sheet-act"><label class="btn ghost" for="scf">Use a photo</label><button class="btn ghost" onclick="scanClose()">Cancel</button></div><input id="scf" class="vh" type="file" accept="image/*" onchange="scanPhoto(this)"></div>`;el.hidden=false;
let stage='loading';try{const det=await getDetector();if(SCAN!==S0)return;S0.det=det;stage='camera';scanMsg('Starting the camera…');
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw Object.assign(new Error('no camera API'),{name:'NoCamera'});
const st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});if(SCAN!==S0){st.getTracks().forEach(t=>t.stop());return}S0.stream=st;
const v=document.getElementById('scv');v.srcObject=st;v.muted=true;v.setAttribute('playsinline','');try{await v.play()}catch(e){}
/* sharper reads: continuous autofocus, and a little zoom so the phone can be held far enough away to focus */
try{const tr=st.getVideoTracks()[0],cap=tr.getCapabilities?tr.getCapabilities():{},adv=[];if(cap.focusMode&&cap.focusMode.includes('continuous'))adv.push({focusMode:'continuous'});if(cap.zoom&&cap.zoom.max>=1.5)adv.push({zoom:Math.min(2,cap.zoom.max)});if(adv.length)await tr.applyConstraints({advanced:adv})}catch(e){}
stage='scan';scanMsg('Hold the barcode inside the box, about 15–20 cm away, in good light.');scanLoop(S0,v)}
catch(e){if(SCAN!==S0)return;const n=e&&e.name;scanMsg(stage==='loading'?'The scanner couldn’t load. It needs an internet connection the first time. You can still type the number below.':n==='NotAllowedError'||n==='SecurityError'?'Camera access is turned off for this app. Allow the camera in your iPhone Settings, use a photo, or type the number below.':n==='NotFoundError'||n==='OverconstrainedError'?'No camera was found. Use a photo or type the number below.':'The camera couldn’t start ('+(n||'error')+'). Use a photo or type the number below.',true)}}
/* each frame: mostly the guide-box area enlarged ~2x (reads tilted, slightly blurry barcodes far better), every third frame the whole picture */
function scanFrame(S0,v,n){const vw=v.videoWidth,vh=v.videoHeight;if(n%3===2)return S0.det.detect(v);const cw=vw*.8,ch=vh*.56,k=Math.max(1,Math.min(2.5,1800/cw)),c=S0.cv||(S0.cv=document.createElement('canvas'));
c.width=Math.round(cw*k);c.height=Math.round(ch*k);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(v,(vw-cw)/2,(vh-ch)/2,cw,ch,0,0,c.width,c.height);return S0.det.detect(c)}
async function scanLoop(S0,v){let n=0;while(SCAN===S0&&S0.on){if(v.readyState>=2&&v.videoWidth){try{const r=await scanFrame(S0,v,n),hit=r.find(x=>goodCode(x.rawValue));if(hit&&SCAN===S0){scanFound(hit.rawValue);return}}catch(e){}
if(++n===80&&SCAN===S0)scanMsg('Still looking… Move a little further away so the barcode is sharp, or tilt it to avoid glare.')}await new Promise(r=>setTimeout(r,120))}}
function scanFound(code){try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}scanClose();foodCode(code)}
function scanTyped(){const el=document.getElementById('scn'),c=el?el.value.replace(/\D/g,''):'';if(!goodCode(c)){toast('Type the 8 to 14 digits under the barcode.');return}scanClose();foodCode(c)}
function scanStop(){if(SCAN){SCAN.on=false;if(SCAN.stream)SCAN.stream.getTracks().forEach(t=>{try{t.stop()}catch(e){}})}SCAN=null}
function scanClose(){scanStop();if(SH&&SH.scan)shx()}
/* photo of a barcode: try the full image, then a smaller copy (large photos can be slow or miss) */
async function scanPhoto(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;scanMsg('Reading the photo…');
try{const det=(SCAN&&SCAN.det)||await getDetector(),bmp=await createImageBitmap(f),tries=[bmp];const s=Math.min(1,1600/Math.max(bmp.width,bmp.height));
if(s<1){const c=document.createElement('canvas');c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);tries.unshift(c)}
for(const t of tries){const r=await det.detect(t),hit=r.find(x=>goodCode(x.rawValue));if(hit){scanFound(hit.rawValue);return}}
scanMsg('No barcode found in that photo. Fill the frame with the barcode, in good light, or type the number below.',true)}
catch(e){scanMsg('That photo couldn’t be read. Try another, or type the number below.',true)}}
