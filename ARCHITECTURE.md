# How the app works

A short guide for anyone reading or changing the code. For installing and using the app, see `README.md`.

## The big picture

- **No build step.** `index.html` loads `css/app.css` and then each `js/*.js` file with a plain `<script>` tag.
  What is in the repository is exactly what runs on the phone.
- **One shared scope.** The scripts are classic scripts, so a top-level `function` or `const` in one file can be
  used by any file loaded after it. The load order in `index.html` matters: data and state first, `main.js` last.
- **Draw from state.** All saved data lives in one object, `S`. Every change follows the same three steps:

  ```js
  S.water[today] = n;  // 1. change the state
  save();              // 2. write S to localStorage (and queue an automatic cloud backup)
  draw();              // 3. rebuild the current screen from S
  ```

- **Screens are HTML strings.** `draw()` (in `draw.js`) builds the current tab as one HTML string and puts it in
  `#app`. Pop-up sheets go in `#sheet`, workout mode in `#wm`, the rest timer in `#tm` and toasts in `#ts`.
  Each screen is a function that returns HTML, for example `consoleCard()`, `exList(day)` and `goalsSection()`.
- **Buttons call global functions.** Buttons use inline handlers such as `onclick="toggleDone('${key}')"`.
  So any function a button calls must be a top-level function.
  Exercise names can contain quotes, so handlers pass a number from `nameIdx(name)` instead, and the function
  gets the name back with `NAMES[i]`.
- **Escape what users type.** Anything typed by the user or fetched from the internet goes through `esc()`
  before it is put into HTML.

## Where things are kept

| What | Where | In backups? |
|---|---|---|
| Everything the user logs and sets | `S`, saved as localStorage `fit1` | Yes |
| Progress photos | IndexedDB `fit-photos` (`photos.js`) | Yes (inlined into the backup file) |
| Cloud backup settings (repo, token) | localStorage `fit-cloud` | No |
| Claude API key and model | localStorage `fit-claude` | No |
| Coach chat | localStorage `fit-chat` | No |
| Short-lived screen state | UPPER_CASE globals, e.g. `SHEET`, `WM`, `SWAP_OPEN`, `CAL_MONTH` | No (reset on reload) |

**Never rename a key in `S`.** The keys are short because they are stored on people's phones and in their
backup files. To change the shape of saved data, add a one-time update to `migrations.js` (or next to the
feature, like `migrateGoals()`), and call it from `main.js`.

The main keys in `S`:

| Key | Holds |
|---|---|
| `log` | Sets logged per exercise: `{ "Squat": [{ d: date, w: kg, r: reps, q: reps in reserve }] }` |
| `done` | Ticks. `doneKey(day, i)` gives `x<week>-<day>-<i>` for an exercise; `f<week>-<day>` marks a finished workout |
| `plan` | The user's edited plan (when absent, the built-in `PLAN` in `data.js` is used) |
| `alt`, `altB` | Exercise swaps: the chosen variation, and the variation's base exercise |
| `meals`, `foods`, `myFoods`, `swap`, `goal`, `kadj` | Meal ticks, extra foods logged, saved foods, meal swaps, calorie goal, weekly calorie adjustment |
| `weights`, `meas`, `photos`, `benches` | Body weight, measurements, photo index, older 1RM tests |
| `goals`, `tested`, `prof` | Custom goals, tested maxes, profile (sex, age, height, activity) |
| `prog`, `progDef` | Progression settings per exercise, and the default for all |
| `notes`, `notesWk`, `noteHist`, `setup` | Weekly lift notes, the week they belong to, past notes, setup reminders |
| `tab`, `pv`, `sel`, `cx`, `cd`, `rg`, `wcr`, `rm`, `pe` | Which tab, progress view, plan day, lift, calendar day, chart ranges, recap month, and plan-edit mode are showing |
| `dl`, `dlw` | Deload started, and the week it covers |
| `lastBk`, `bkSnooze`, `cloudAt`, `cloudErr` | Backup reminders and the last cloud backup |
| `hide`, `habits`, `water`, `str`, `rev`, `qk` | Hidden sections, habits, water, stretches, weekly reviews, short-on-time mode |

## Dates and the week

`state.js` works out the date once, when the app opens:
- `today` is `YYYY-MM-DD`.
- `todayIdx` is the day of the week, where Monday is 0.
- `weekKey` is the date of this week's Monday.

Ticks and notes belong to a week through `weekKey`. If the app stays open past midnight, `main.js` reloads it.

## Files

Loaded in this order:

| File | What it does |
|---|---|
| `data.js` | Built-in weekly plan (`PLAN`), meals, recipes and calorie goals |
| `state.js` | `S`, `save()`, dates, calorie and protein totals |
| `workout.js` | Today's exercise list, logging sets (`logSet`), rest timer, add-weight tips (`advice`) |
| `notes.js` | Setup reminders and weekly lift notes |
| `cards.js` | Today and Tools cards, the session summary sheet, `est1RM` (estimated one-rep max), `muscleGroup` |
| `migrations.js` | One-time updates to saved data |
| `muscles.js` | Which muscles each lift works (`musclesOf`) and the body figures (`bodySvg`) |
| `helpers.js` | Icons (`ICO`), formatting, tiles, rings, short-lived screen state, `nameIdx`/`NAMES` |
| `console.js` | The session readout at the top of Today, set tables, the weekly lift chart |
| `feedback.js` | Feedback banner per exercise, the targets sheet, progression settings |
| `plan.js` | Plan editor, the fix-or-delete-a-set sheet (`closeSheet` closes any sheet), meal swaps |
| `photos.js` | Progress photos in IndexedDB |
| `charts.js` | Line charts with tap-for-detail |
| `progress.js` | Progress tab: overview, lifts, body, calendar |
| `draw.js` | `draw()`: builds the current tab and the tab bar |
| `swaps.js` | Exercise swaps and short-on-time mode |
| `coaching.js` | Weekly weigh-in, deload timing, show/hide sections |
| `profile.js` | Profile and calorie/protein targets |
| `goals.js` | Custom goals |
| `wmode.js` | Workout mode (full screen, one exercise at a time) |
| `cloud.js` | Backup reminders and automatic backup to a private GitHub repository |
| `fooddb.js`, `food.js` | Built-in food list, Open Food Facts search, barcode scanning, saved foods |
| `howto.js` | Exercise how-to guides |
| `insights.js` | Lift history sheet, this week's muscle map, monthly recap |
| `coach.js` | Claude coach (see below) |
| `stretches.js` | Daily stretches |
| `review.js` | Sunday check-in prompt |
| `backup.js` | Spreadsheet export, backup file, restore |
| `main.js` | Start-up: migrations, first draw, gestures, service worker |

`sw.js` handles offline use:
- **The app's own files** are fetched fresh first. If no fresh copy arrives within 3 seconds, the saved copy is used.
- **Libraries and fonts** are served from the saved copy.

`vendor/` holds the bundled Anthropic SDK.

## The Claude coach

`coach.js` sends the chat to the Claude API with the user's own key.

Claude sees a snapshot of the user's data (`coSnapshot()`). The snapshot is added to a user message only when the data has changed.
- **Why:** the system prompt and earlier messages must never change, because Claude's saved thinking blocks are tied to them.
- **Rule:** the history is append-only.

Claude can only *propose* plan changes, through the `propose_plan_changes` tool. They are applied only when the user taps Apply.

## Styles

`css/app.css` starts with the design tokens (colours, fonts, radii) in `:root`. Components use `var(--token)`.
The comment at the top of the file explains the order of its sections.

Some components have a second rule further down, in "theme refinements". That rule has to come after an earlier rule of equal specificity to win, so it is kept in place on purpose.

## Conventions

- **Function names** are full words (`toggleDone`, `closeSheet`, `est1RM`).
- **Short-lived screen state** uses UPPER_CASE (`SHEET`, `NOTE_EDIT`).
- **Keys in `S`** stay short and never change.
- **Formatting** follows `.prettierrc.json` (Prettier 3): run `npx prettier@3.3.3 --write "js/*.js" css/app.css`.
- **Tests:** `npm test` runs the tests in `tests/`.
  - `tests/load.js` loads every script except `main.js` into a sandbox with a fixed date.
  - A test runs app code with `run('...')`.

## Making a change

1. Change the code. To add a script file:
   - add a `<script>` tag to `index.html` in the right place;
   - add the file to `CORE` in `sw.js`.
2. Run `npm test`.
3. Raise `VERSION` in `sw.js` so phones fetch the new files.
4. Push to `main`. GitHub Pages publishes it, and phones get it the next time the app is opened with a signal.
