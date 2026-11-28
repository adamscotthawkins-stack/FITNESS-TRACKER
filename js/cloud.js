/* Backups: a weekly reminder, and optional automatic backup to a private GitHub repository the user owns.
   The repository name and access token are kept in their own storage slot ('fit-cloud'), never inside
   the app data, so they don't end up in backup files or in the cloud copy. Photos stay on the phone. */
const CLOUD_KEY = 'fit-cloud',
  CFILE = 'backup.json';
let CLOUD_BUSY = false,
  DC = false,
  CLF = { repo: '', token: '' };
function cloudCfg() {
  try {
    const c = JSON.parse(localStorage.getItem(CLOUD_KEY) || 'null');
    return c && c.repo && c.token ? c : null;
  } catch (e) {
    return null;
  }
}
function cloudSetCfg(c) {
  try {
    if (c) localStorage.setItem(CLOUD_KEY, JSON.stringify(c));
    else localStorage.removeItem(CLOUD_KEY);
  } catch (e) {}
}
function toBase64(s) {
  const b = new TextEncoder().encode(s);
  let x = '';
  for (let i = 0; i < b.length; i += 0x8000) x += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(x);
}
function githubApi(c, path, opt) {
  opt = opt || {};
  return fetch(
    'https://api.github.com/repos/' + c.repo + path,
    Object.assign({}, opt, {
      cache: 'no-store',
      headers: Object.assign(
        {
          Authorization: 'Bearer ' + c.token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        opt.headers || {}
      )
    })
  );
}
function cloudObj() {
  const o = Object.assign({}, S);
  o.photos = [];
  o._backup = today;
  o._cloud = 1;
  delete o.cloudErr;
  return o;
}
const ghErr = (r, what) =>
  r.status === 401
    ? 'The access token wasn’t accepted. It may have expired: make a new one and connect again.'
    : r.status === 403
      ? 'The token can’t ' + what + '. Check it has “Contents: Read and write” for this repository.'
      : r.status === 404
        ? 'Repository not found. Check the name, and that the token was given access to it.'
        : 'GitHub replied with an error (' + r.status + '). Try again later.';
async function cloudSave(manual) {
  const c = cloudCfg();
  if (!c || CLOUD_BUSY) return false;
  CLOUD_BUSY = true;
  if (manual) draw();
  let ok = false;
  try {
    let sha;
    const g = await githubApi(c, '/contents/' + CFILE);
    if (g.ok) sha = (await g.json()).sha;
    else if (g.status !== 404) throw new Error(ghErr(g, 'read the backup'));
    const r = await githubApi(c, '/contents/' + CFILE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Fitness backup ' + today,
        content: toBase64(JSON.stringify(cloudObj())),
        sha: sha
      })
    });
    if (!r.ok) throw new Error(ghErr(r, 'save the backup'));
    S.cloudAt = new Date().toISOString();
    S.lastBk = today;
    delete S.cloudErr;
    ok = true;
    if (manual) toast('Backed up to GitHub');
  } catch (e) {
    S.cloudErr =
      e && e.message && !/fetch|network|load failed/i.test(e.message)
        ? e.message
        : 'Couldn’t reach GitHub. It will try again next time you open the app.';
    if (manual) toast(S.cloudErr);
  }
  CLOUD_BUSY = false;
  save();
  draw();
  return ok;
}
function cloudAuto() {
  if (cloudCfg()) cloudSave(false);
}
async function cloudConnect() {
  const repo = (document.getElementById('cl-repo').value || '')
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/, '')
      .replace(/\/+$/, ''),
    token = (document.getElementById('cl-tok').value || '').trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    toast('Enter the repository as your-name/repo-name.');
    return;
  }
  if (token.length < 20) {
    toast('Paste the access token from GitHub.');
    return;
  }
  CLF = { repo: repo, token: token };
  const c = { repo: repo, token: token };
  CLOUD_BUSY = true;
  draw();
  try {
    const r = await githubApi(c, '');
    if (!r.ok) throw new Error(ghErr(r, 'see this repository'));
    const j = await r.json();
    if (!j.private)
      throw new Error(
        'That repository is public, so anyone could read your backup. Make it private in its Settings on GitHub, then connect again.'
      );
    cloudSetCfg(c);
    CLF = { repo: '', token: '' };
    delete S.cloudErr;
    CLOUD_BUSY = false;
    toast('Connected. Backing up now…');
    await cloudSave(true);
  } catch (e) {
    CLOUD_BUSY = false;
    toast(
      e && e.message && !/fetch|network|load failed/i.test(e.message)
        ? e.message
        : 'Couldn’t reach GitHub. Check your connection.'
    );
    draw();
  }
}
async function cloudRestore() {
  const c = cloudCfg();
  if (!c) return;
  try {
    const r = await githubApi(c, '/contents/' + CFILE, {
      headers: { Accept: 'application/vnd.github.raw+json' }
    });
    if (!r.ok)
      throw new Error(
        r.status === 404 ? 'There’s no backup in that repository yet.' : ghErr(r, 'read the backup')
      );
    const o = JSON.parse(await r.text());
    if (!o || typeof o !== 'object' || !(o.log || o.weights || o.plan))
      throw new Error('The cloud file isn’t a Fitness backup.');
    RS = o;
    draw();
    setTimeout(() => {
      const el = document.getElementById('rs-confirm');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  } catch (e) {
    toast(
      e && e.message && !/fetch|network|load failed/i.test(e.message)
        ? e.message
        : 'Couldn’t reach GitHub. Check your connection.'
    );
  }
}
function cloudOff() {
  if (!DC) {
    DC = true;
    draw();
    return;
  }
  DC = false;
  cloudSetCfg(null);
  delete S.cloudAt;
  delete S.cloudErr;
  save();
  draw();
  toast('Disconnected. Your backups stay in the repository.');
}
function cloudCard() {
  const c = cloudCfg(),
    at = S.cloudAt ? new Date(S.cloudAt) : null;
  return `<div class="card" id="cloud"><div class="ch"><span class="ci" style="--c:var(--blue)">${ICO.cloud}</span><div class="ct"><h2>Automatic cloud backup</h2><div class="mu sm">${c ? 'On' : 'Off'} · saves to a private GitHub repository you own</div></div></div>
${
  c
    ? `<div class="cl-on"><div class="row" style="padding-top:0"><span class="t">Repository</span><span class="r"><b>${esc(c.repo)}</b></span></div><div class="row"><span class="t">Last backup</span><span class="r">${at ? `<b>${fmtD(iso(at))}</b>, ${at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Not yet'}</span></div></div>
${S.cloudErr ? `<div class="note" style="margin:6px 0 4px"><span class="ni">${ICO.x}</span><span class="nb">${esc(S.cloudErr)}</span></div>` : ''}
<div class="mu sm" style="margin:6px 0 10px">Backs up once a day when you open the app, and after each workout. Every backup is kept in the repository’s history. Photos stay on this phone, so use Download backup for those.</div>
<div style="display:grid;gap:8px"><button class="btn" onclick="cloudSave(true)" ${CLOUD_BUSY ? 'disabled' : ''}>${CLOUD_BUSY ? 'Backing up…' : 'Back up now'}</button><button class="btn ghost" onclick="cloudRestore()">Restore from cloud</button><button class="btn ${DC ? 'danger' : 'danger-ghost'}" onclick="cloudOff()">${DC ? 'Tap again to disconnect' : 'Disconnect'}</button></div>`
    : `<div class="mu" style="margin:4px 0 8px">Keeps a copy of your training, weigh-ins, plan and notes off this phone, so nothing is lost if the app is removed or you change phone. It’s free and uses your GitHub account.</div>
<details class="rcp"><summary><b>How to set it up</b><br><span class="mu">About 3 minutes, once</span></summary><ol class="cl-steps">
<li>On GitHub, <a href="https://github.com/new" target="_blank" rel="noopener">create a new repository</a>, for example <b>fitness-data</b>. Choose <b>Private</b>.</li>
<li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a fine-grained access token</a>. Under <b>Repository access</b> pick <b>Only select repositories</b> and choose the new repository. Under <b>Permissions</b>, set <b>Contents</b> to <b>Read and write</b>. Set the expiry to a year.</li>
<li>Copy the token and paste it below with the repository name.</li></ol>
<div class="mu sm">The token only works for that one repository and is stored on this phone only. It isn’t included in backups.</div></details>
<div class="field"><label for="cl-repo">Repository</label><input id="cl-repo" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="your-name/fitness-data" value="${esc(CLF.repo)}"></div>
<div class="field"><label for="cl-tok">Access token</label><input id="cl-tok" type="password" autocomplete="off" placeholder="github_pat_…" value="${esc(CLF.token)}"></div>
<button class="btn" style="width:100%;margin-top:12px" onclick="cloudConnect()" ${CLOUD_BUSY ? 'disabled' : ''}>${CLOUD_BUSY ? 'Connecting…' : 'Connect and back up'}</button>`
}</div>`;
}
/* reminder on Today when there's no recent backup */
function bkNudge() {
  const n = Object.values(S.log).reduce((a, l) => a + l.length, 0);
  if (n < 20) return '';
  const c = cloudCfg(),
    last = S.lastBk,
    days = last ? Math.floor(daysBetween(last, today)) : null;
  if (c && !S.cloudErr && days != null && days < 8) return '';
  if (days != null && days < 7) return '';
  if (S.bkSnooze && daysBetween(S.bkSnooze, today) < 3) return '';
  return `<div class="card bk-n"><div class="ch"><span class="ci" style="--c:var(--amber)">${ICO.cloud}</span><div class="ct"><h2>Back up your data</h2><div class="mu sm">${n} sets live only on this phone. ${days == null ? 'You haven’t made a backup yet.' : 'Last backup ' + days + ' days ago.'}</div></div></div>
<div class="bk-act"><button class="btn sm" onclick="downloadBackup()">Back up now</button>${c ? '' : `<button class="btn sm ghost" onclick="goCloud()">Make it automatic</button>`}<button class="link" onclick="S.bkSnooze=today;save();draw()">Later</button></div></div>`;
}
function goCloud() {
  tab('tools');
  setTimeout(() => {
    const el = document.getElementById('cloud');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}
