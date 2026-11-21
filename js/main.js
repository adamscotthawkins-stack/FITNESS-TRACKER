/* Start-up: apply the saved plan, run one-time updates, draw, and set up the app */
applyPlan();
wmSwipe();
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(SH)shx();else if(WM)wmClose()});
if(migratePlan()|migratePU()|migrateCalf()|rollNotes()|migrateGoals())try{localStorage.setItem('fit1',JSON.stringify(S))}catch(e){}
draw();
/* no zooming: iPhone ignores user-scalable=no, so block pinch and double-tap zoom directly */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches.length>1||(e.scale!==undefined&&e.scale!==1))e.preventDefault()},{passive:false});
photosToDb().then(loadPhotos);
/* automatic cloud backup, once a day */
setTimeout(()=>{if(cloudCfg()&&(S.cloudAt?iso(new Date(S.cloudAt)):'')!==today)cloudSave(false)},3000);
if(S.tab==='tools')ldX().catch(()=>{});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
/* the app can stay open in the background for days: start fresh when the date has changed */
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&iso(new Date())!==today)location.reload()});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
