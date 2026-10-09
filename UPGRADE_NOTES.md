# Bitzy 13-hour upgrade — quick notes

## What changed
- Added a new **Bug Hunter** arcade page at `/app/bug-hunter`.
- Added a Bug Hunter entry to the app navigation and a featured launch card on the dashboard.
- Added three editable debugging missions, a 90-second countdown, progressive hints, pattern-based test checks, explanations, and local arcade XP/progress.
- Added a premium dark blue/violet visual treatment, improved card hover/focus states, mobile adjustments, and reduced-motion support.
- Existing routes, course pages, authentication, and backend integrations were left in place.

## Important scope note
Bug Hunter is intentionally a reliable demo feature: its checks validate common code patterns and do **not** execute arbitrary code. XP and mission completion are stored in the current browser's `localStorage` and are separate from the platform's account XP/database. Do not present them as synced account rewards. A production version should use a server-side isolated code runner and persist results through the authenticated backend.

## Run locally
1. Install Node.js 20+ (Node 22 recommended).
2. Extract the ZIP and open a terminal in the `Bitzy` project folder.
3. Run `npm install`.
4. Copy/configure environment variables according to `README.md` and `SUPABASE_SETUP.md` if your local setup needs Supabase or AI services.
5. Run `npm run dev` and open the local URL printed by Vite.
6. Sign in, open the dashboard, and choose **Bug Hunter**. You can also navigate to `/app/bug-hunter` after signing in.

## Build / verification
Run `npm run build` and `npm run check` after dependencies and environment are installed. The provided build environment did not have the complete npm dependency tree available, and package installation could not finish here, so a production build could not be verified in this session. Run these checks locally before deploying or presenting.
