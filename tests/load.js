// Loads the app's scripts into a sandbox (no browser) so the logic can be tested.
// The clock is fixed so "today" and "this week" are predictable.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadApp(fixed = '2026-11-18T12:00:00') {
  const FIXED = new Date(fixed).getTime();
  class FakeDate extends Date {
    constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
    static now() { return FIXED; }
  }
  const ctx = vm.createContext({ Date: FakeDate, Math, JSON, console, setTimeout, clearTimeout, Promise, Object, Array, String, Number, RegExp, Set, Map, TextEncoder, TextDecoder, btoa, atob, Error });
  // every script except main.js (start-up code that needs a real page)
  const files = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .split('\n').map(l => (l.match(/^<script src="(js\/[^"]+)"><\/script>$/) || [])[1]).filter(Boolean)
    .filter(f => f !== 'js/main.js');
  const code = files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
  vm.runInContext(code + '\n;applyPlan();', ctx, { filename: 'app' });
  const run = src => vm.runInContext(src, ctx);
  return { ctx, run };
}

module.exports = { loadApp };
