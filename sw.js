// Offline support. The app's own files are fetched fresh first (so an update shows up on the next open),
// waiting up to 3 seconds; with no or slow signal the saved copy is used instead.
// Libraries (versioned file names) and fonts are served from the saved copy.
const VERSION = 'fitness-v19';
const WAIT_MS = 3000;
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/data.js',
  'js/state.js',
  'js/workout.js',
  'js/notes.js',
  'js/cards.js',
  'js/migrations.js',
  'js/muscles.js',
  'js/helpers.js',
  'js/console.js',
  'js/feedback.js',
  'js/plan.js',
  'js/photos.js',
  'js/charts.js',
  'js/progress.js',
  'js/draw.js',
  'js/swaps.js',
  'js/coaching.js',
  'js/profile.js',
  'js/goals.js',
  'js/wmode.js',
  'js/cloud.js',
  'js/fooddb.js',
  'js/food.js',
  'js/howto.js',
  'js/insights.js',
  'js/coach.js',
  'js/stretches.js',
  'js/review.js',
  'js/backup.js',
  'js/main.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];
// The spreadsheet and barcode libraries come from these hosts; keep copies for offline use.
const CDN = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fastly.jsdelivr.net'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !CDN.includes(url.hostname)) return;
  if (same && !url.pathname.includes('/vendor/')) {
    e.respondWith(networkFirst(e));
    return;
  }
  e.respondWith(savedFirst(e));
});

/* app files: fresh copy if it arrives within WAIT_MS (bypassing the browser's HTTP cache), else the saved copy */
async function networkFirst(e) {
  const req = e.request,
    nav = req.mode === 'navigate',
    key = nav ? 'index.html' : req;
  const cache = await caches.open(VERSION);
  const net = fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
    if (res && res.ok) cache.put(key, res.clone());
    return res;
  });
  e.waitUntil(net.catch(() => {})); // a slow download still updates the saved copy for next time
  try {
    const res = await Promise.race([
      net,
      new Promise((_, no) => setTimeout(() => no(new Error('slow')), WAIT_MS))
    ]);
    if (res && res.ok) return res;
    return (await cache.match(key, { ignoreSearch: nav })) || res;
  } catch (err) {
    return (await cache.match(key, { ignoreSearch: nav })) || Response.error();
  }
}

/* libraries and fonts: saved copy first, refreshed in the background */
async function savedFirst(e) {
  const req = e.request,
    cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const fresh = fetch(req)
    .then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  if (hit) {
    e.waitUntil(fresh.catch(() => {}));
    return hit;
  }
  return fresh;
}
