# Fitness

A phone app for training, meals and progress: weekly plan, set logging with
add-weight tips, rest timer, meal plan and recipes, body weight, lift charts,
calendar, badges and daily stretches.

It's a home-screen web app (PWA). No app store is needed, it works offline,
and all data stays on the phone.

## Install on iPhone

1. Open the app's GitHub Pages link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open it from the **Fitness** icon. It runs full-screen like a normal app.

## Your data

Everything is saved on the phone. To keep a copy or move to a new phone, go to
**Tools → Your data → Download backup**, then **Restore from backup** on the new
install. Do this regularly: deleting the app from the home screen deletes its data.

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
