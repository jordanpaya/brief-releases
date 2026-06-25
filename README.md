# Lift Log

A dead-simple mobile app for tracking your lifts and growing your numbers.
Built with Expo (React Native). No accounts, no setup, no internet needed —
everything lives on your phone.

## What it does

- **Log fast.** Tap a lift, and your weight & reps are pre-filled with last
  time's numbers. Same set again? Just hit **+ Add set**. Bang, bang, bang.
- **Save your exercises** once and reuse them every session.
- **See your growth.** The Progress tab charts your estimated 1-rep-max over
  time per lift, with your best set and total sessions.
- **Built-in coach.** The Coach tab reads your history and tells you exactly
  what to do next session — add weight, chase one more rep, or deload when you
  stall. Pure progressive overload, no API keys, works offline.

Three tabs, that's it: **Log · Progress · Coach**.

## Run it on your phone (no App Store needed)

1. On your phone, install **Expo Go**
   ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
   [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).
2. On your computer, in this folder:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code in the terminal with your phone's camera (iOS) or the Expo
   Go app (Android). The app opens instantly.

Your phone and computer need to be on the same Wi-Fi. (If that's a problem, run
`npx expo start --tunnel` instead.)

## How the coach works

Each lift uses **double progression** inside a 5–8 rep window:

- Hit the top of the range (8 reps)? → add weight, drop back toward 5 reps.
- Not there yet? → keep the weight, chase one more rep.
- Stuck at the same top weight for ~3 sessions? → deload ~10% and rebuild.
- New all-time best estimated-1RM? → it celebrates and pushes you onward.

Estimated 1-rep-max uses the Epley formula (`weight × (1 + reps/30)`), so a
heavier set for fewer reps and a lighter set for more reps are compared fairly.

## Tech notes

- Expo SDK 56 / React Native, TypeScript.
- Local persistence via AsyncStorage (`src/store.tsx`).
- Coach + growth math in `src/coach.ts`; helpers in `src/utils.ts`.
- Charts are a tiny custom SVG component (`src/components/LineChart.tsx`) — no
  heavy charting dependency.
- Screens live in `src/screens/`; the tab shell is in `App.tsx`.
