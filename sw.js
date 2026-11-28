// Offline support. The app opens instantly from the cache, and any update
// is fetched in the background and used the next time the app is opened.
const VERSION = 'fitness-v16';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css',
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
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
// The spreadsheet and barcode libraries come from these hosts; keep copies for offline use.
const CDN = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fastly.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
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

  // Pages: serve the cached app (ignoring ?query) and refresh it in the background.
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
      const fresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
        return res;
      }).catch(() => hit);
      if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
      return fresh;
    })
  );
});
