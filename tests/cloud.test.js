// Tests for backups: the cloud copy (against a fake GitHub) and the reminder.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./load');

function setup(fetchImpl) {
  const app = loadApp();
  const store = {};
  app.ctx.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  app.ctx.fetch = fetchImpl;
  app.run('draw=function(){};toast=function(m){globalThis.__toast=m}');
  return { app, store };
}

test('cloud backup updates backup.json in the repository, without photos or the token', async () => {
  const calls = [];
  const fetch = async (url, opt = {}) => {
    calls.push({ url, opt });
    if (!opt.method) return { ok: true, status: 200, json: async () => ({ sha: 'abc123' }) };
    return { ok: true, status: 200, json: async () => ({}) };
  };
  const { app, store } = setup(fetch);
  store['fit-cloud'] = JSON.stringify({ repo: 'me/fitness-data', token: 'github_pat_SECRET_1234567890' });
  app.run("S.log={'Squat':[{d:'2026-11-18',w:100,r:5}]};S.photos=[{d:'2026-11-01',k:'p1'}];S.prof={n:'Sam',age:30,h:178};");
  const ok = await app.run('cloudSave(true)');
  assert.equal(ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.github.com/repos/me/fitness-data/contents/backup.json');
  assert.equal(calls[1].opt.method, 'PUT');
  assert.equal(calls[1].opt.headers.Authorization, 'Bearer github_pat_SECRET_1234567890');
  const body = JSON.parse(calls[1].opt.body);
  assert.equal(body.sha, 'abc123', 'updates the existing file');
  const saved = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
  assert.equal(saved.log.Squat[0].w, 100);
  assert.deepEqual(saved.photos, []);
  assert.equal(saved._cloud, 1);
  assert.ok(!JSON.stringify(saved).includes('SECRET'), 'token is not inside the backup');
  assert.equal(app.run('S.lastBk'), '2026-11-18');
  assert.ok(app.run('!!S.cloudAt && !S.cloudErr'));
});

test('first cloud backup creates the file', async () => {
  const calls = [];
  const fetch = async (url, opt = {}) => { calls.push(opt); return opt.method ? { ok: true, status: 201, json: async () => ({}) } : { ok: false, status: 404 }; };
  const { app, store } = setup(fetch);
  store['fit-cloud'] = JSON.stringify({ repo: 'me/fitness-data', token: 'github_pat_SECRET_1234567890' });
  assert.equal(await app.run('cloudSave(false)'), true);
  assert.equal(JSON.parse(calls[1].body).sha, undefined);
});

test('a rejected token is reported and nothing is marked as backed up', async () => {
  const fetch = async () => ({ ok: false, status: 401 });
  const { app, store } = setup(fetch);
  store['fit-cloud'] = JSON.stringify({ repo: 'me/fitness-data', token: 'github_pat_SECRET_1234567890' });
  app.run('delete S.lastBk;delete S.cloudAt');
  assert.equal(await app.run('cloudSave(true)'), false);
  assert.match(app.run('S.cloudErr'), /token wasn’t accepted/);
  assert.equal(app.run('S.lastBk'), undefined);
});

test('no connection: a friendly message, retried next time', async () => {
  const fetch = async () => { throw new TypeError('Failed to fetch'); };
  const { app, store } = setup(fetch);
  store['fit-cloud'] = JSON.stringify({ repo: 'me/fitness-data', token: 'github_pat_SECRET_1234567890' });
  assert.equal(await app.run('cloudSave(false)'), false);
  assert.match(app.run('S.cloudErr'), /Couldn’t reach GitHub/);
});

test('names with accents survive the cloud copy', () => {
  const { run } = loadApp();
  const enc = run("b64(JSON.stringify({n:'Zoë · 100 kg × 5'}))");
  assert.equal(JSON.parse(Buffer.from(enc, 'base64').toString('utf8')).n, 'Zoë · 100 kg × 5');
});

test('backup reminder shows after 7 days without a backup, and not with fresh cloud backups', () => {
  const { app, store } = setup(async () => ({}));
  app.ctx.__sets = Array.from({ length: 25 }, () => ({ d: '2026-11-10', w: 50, r: 8 }));
  app.run('S.log={Squat:__sets};delete S.bkSnooze;S.lastBk=null');
  assert.match(app.run('bkNudge()'), /haven’t made a backup yet/);
  app.run("S.lastBk='2026-11-14'");
  assert.equal(app.run('bkNudge()'), '', '4 days ago is recent enough');
  app.run("S.lastBk='2026-11-08'");
  assert.match(app.run('bkNudge()'), /Last backup 10 days ago/);
  app.run("S.bkSnooze='2026-11-17'");
  assert.equal(app.run('bkNudge()'), '', 'snoozed for 3 days');
  app.run("delete S.bkSnooze;S.lastBk='2026-11-12';delete S.cloudErr");
  store['fit-cloud'] = JSON.stringify({ repo: 'me/x', token: 'github_pat_SECRET_1234567890' });
  assert.equal(app.run('bkNudge()'), '');
});
