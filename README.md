# Fitness

A phone app for training, meals and progress:

- **Training:** weekly plan, set logging with add-weight tips, workout mode (one exercise at a time with big buttons and a rest timer), exercise how-to guides, lift history, swaps, deloads
- **Progress:** custom goals (any lift or body weight, by a date), monthly recap, this week's muscle map, charts, calendar, badges
- **Food:** meal plan, food search and barcode scanning (Open Food Facts), saved and recent foods, calorie and protein targets from your profile
- **Your data:** stays on the phone, with backup reminders and optional automatic backup to a private GitHub repository

It's a home-screen web app (PWA). No app store is needed and it works offline.

## Install on iPhone

1. Open the app's GitHub Pages link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open it from the **Fitness** icon. It runs full-screen like a normal app.

## Your data

Everything is saved on the phone. Deleting the app from the home screen deletes its data, so back up:

- **Download backup** (Tools → Your data) saves a file through the share sheet, e.g. to iCloud Drive. **Restore from backup** brings it back.
- **Automatic cloud backup** (Tools) saves to a private GitHub repository you own, once a day and after each workout. Setup steps are in the app. Photos are only in downloaded backups.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: loads the styles and scripts |
| `css/app.css` | All styling (light and dark) |
| `js/*.js` | The app, one file per area (workout, progress, meals, backups and so on), loaded in the order listed in `index.html` |
| `js/main.js` | Start-up code, runs last |
| `manifest.webmanifest` | App name, icon and full-screen setting |
| `sw.js` | Offline support |
| `icons/` | Home-screen icons |
| `tests/` | Automated tests for the training logic (`npm test`) |

## Updating

Change the files, run `npm test`, then raise `VERSION` in `sw.js` (for example `fitness-v2`)
so phones pick up the new version. A new script file also needs adding to `CORE` in `sw.js`. Changes show the second time the app is
opened after an update.

## Credits

The body figures in the workout summary use anatomy drawings from
[react-muscle-highlighter](https://github.com/soroojshehryar/react-muscle-highlighter)
(MIT License, Copyright (c) 2024 My Muscle Contributors).
