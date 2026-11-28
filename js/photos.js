/* Progress photos (IndexedDB) */
/* ---------- photos (stored on this phone, in IndexedDB) ---------- */
const PURL = {};
let PDBp = null;
function photoDb() {
  return (PDBp =
    PDBp ||
    new Promise((ok, no) => {
      try {
        const r = indexedDB.open('fit-photos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('p');
        r.onsuccess = () => ok(r.result);
        r.onerror = () => no(r.error);
      } catch (e) {
        no(e);
      }
    }));
}
function photoStore(m, fn) {
  return photoDb().then(
    db =>
      new Promise((ok, no) => {
        const t = db.transaction('p', m),
          q = fn(t.objectStore('p'));
        t.oncomplete = () => ok(q && q.result);
        t.onerror = () => no(t.error);
        t.onabort = () => no(t.error);
      })
  );
}
function dataUrlToBlob(u) {
  const s = atob(u.split(',')[1]),
    a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return new Blob([a], { type: 'image/jpeg' });
}
function blobToDataUrl(b) {
  return new Promise(ok => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => ok(null);
    r.readAsDataURL(b);
  });
}
const newPhotoId = () => 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
/* move any photos held inline (from a restored backup) into IndexedDB; drop old claude.ai-only photo links */
async function photosToDb() {
  let ch = false;
  const n = (S.photos || []).length;
  S.photos = (S.photos || []).filter(p => p.i || p.k);
  if (S.photos.length !== n) ch = true;
  for (const p of S.photos) {
    if (p.i && !p.k) {
      try {
        const id = newPhotoId(),
          b = dataUrlToBlob(p.i);
        await photoStore('readwrite', s => s.put(b, id));
        p.k = id;
        PURL[id] = URL.createObjectURL(b);
        delete p.i;
        ch = true;
      } catch (e) {
        break;
      }
    }
  }
  if (ch) {
    save();
    draw();
  }
}
async function loadPhotos() {
  let n = 0;
  for (const p of S.photos || []) {
    if (p.k && !PURL[p.k]) {
      try {
        const b = await photoStore('readonly', s => s.get(p.k));
        if (b) {
          PURL[p.k] = URL.createObjectURL(b);
          n++;
        }
      } catch (e) {}
    }
  }
  if (n) draw();
}
function addPhoto(inp) {
  const f = inp.files && inp.files[0];
  if (!f) return;
  inp.value = '';
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1000 / im.width),
        c = document.createElement('canvas');
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(
        b => {
          if (!b) {
            toast('That photo could not be read. Try another one.');
            return;
          }
          const id = newPhotoId();
          photoStore('readwrite', s => s.put(b, id))
            .then(() => {
              PURL[id] = URL.createObjectURL(b);
              S.photos.push({ d: today, k: id });
              save();
              draw();
              toast('Photo saved');
            })
            .catch(() => {
              const c2 = document.createElement('canvas'),
                k = Math.min(1, 320 / c.width);
              c2.width = Math.round(c.width * k);
              c2.height = Math.round(c.height * k);
              c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height);
              S.photos.push({ d: today, i: c2.toDataURL('image/jpeg', 0.6) });
              save();
              draw();
              toast('Photo saved (small copy)');
            });
        },
        'image/jpeg',
        0.82
      );
    };
    im.onerror = () => toast('That file is not a photo this phone can read.');
    im.src = r.result;
  };
  r.readAsDataURL(f);
}
function deletePhoto(i) {
  if (PHOTO_DELETE !== i) {
    PHOTO_DELETE = i;
    draw();
    return;
  }
  const p = S.photos[i];
  PHOTO_DELETE = null;
  S.photos.splice(i, 1);
  save();
  draw();
  if (p && p.k) {
    photoStore('readwrite', s => s.delete(p.k)).catch(() => {});
    if (PURL[p.k]) URL.revokeObjectURL(PURL[p.k]);
    delete PURL[p.k];
  }
}
function photoCard() {
  const P = S.photos || [],
    src = p => (p.k ? PURL[p.k] || '' : p.i);
  return `<div class="card"><div class="ed-head"><div class="ch"><span class="ci" style="--c:var(--pink)">${ICO.camera}</span><h2>Progress photos</h2></div><label class="btn sm" for="pup">Add photo</label></div><input id="pup" class="vh" type="file" accept="image/*" onchange="addPhoto(this)">
${P.length >= 2 ? `<div class="cmp"><figure><img src="${src(P[0])}" alt="First progress photo, ${fmtD(P[0].d)}"><figcaption>First · ${fmtD(P[0].d)}</figcaption></figure><figure><img src="${src(P[P.length - 1])}" alt="Latest progress photo, ${fmtD(P[P.length - 1].d)}"><figcaption>Latest · ${fmtD(P[P.length - 1].d)}</figcaption></figure></div>` : ''}
${P.length ? `<div class="pgrid">${P.map((p, i) => `<div class="ph"><img src="${src(p)}" alt="Progress photo, ${fmtD(p.d)}" loading="lazy"><span>${fmtD(p.d)}</span><button class="ph-x ${PHOTO_DELETE === i ? 'armed' : ''}" onclick="deletePhoto(${i})" aria-label="Delete photo">${PHOTO_DELETE === i ? 'Delete?' : ICO.x}</button></div>`).join('')}</div>` : `<div class="empty">Take a photo every few weeks in the same spot and light. Your first and latest will sit side by side here.</div>`}
<div class="mu sm" style="margin-top:10px">Photos are saved on this phone and included in your backups.</div></div>`;
}
