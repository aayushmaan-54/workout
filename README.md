# Simple Workout

A mobile-first home workout tracker. It rotates workouts and exercise variations automatically, times holds, logs reps, runs a rest timer, tracks streaks, and graphs progress.

**Stack:** Next.js 16 (App Router) · TypeScript · Neon Postgres (serverless driver) · Drizzle ORM · Tailwind CSS 4 · Recharts · Zod

---

## 1. Create a Neon project

1. Sign in at <https://console.neon.tech> and click **New project**.
2. Open the project dashboard → **Connect**.
3. Copy the connection string (the **pooled** one is fine). It looks like
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

## 2. Set `DATABASE_URL`

```bash
cp .env.example .env
# then paste your Neon connection string into .env
```

`.env` is gitignored.

## 3. Install and run migrations

Requires Node.js 20.9 or newer.

```bash
npm install
npm run db:migrate
```

This creates the tables (`users`, `sessions`, `login_attempts`, `workouts`, `sets`, `rotation_state`) from the SQL in `drizzle/`.

If you change `lib/db/schema.ts` later, run `npm run db:generate` to create a new migration, then `npm run db:migrate`.

## 4. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, sign up, and start training.

To try it on your phone over Wi-Fi, open `http://<your-computer-ip>:3000`. Note: the wake lock and some sound features only work over HTTPS, so they'll fully work once it's deployed.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On <https://vercel.com/new>, import the repository (framework is auto-detected as Next.js).
3. Before deploying, open **Environment Variables** and add
   `DATABASE_URL` = your Neon connection string (for Production, Preview, and Development).
4. Click **Deploy**.

If you've already deployed, add the variable under **Project → Settings → Environment Variables**, then redeploy.

Migrations aren't run during the Vercel build. Run `npm run db:migrate` from your machine (with the same `DATABASE_URL`) whenever you add a migration.

## 6. Add it to your home screen

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**

---

## Editing exercises

Everything lives in `data/exercises.json`: rotation order, warm-up, stretches, workouts, slots, and exercise options. It's shared by all users.

- `"type": "reps"` → you type a number. `"type": "time"` → a tap-to-start/stop timer (value in seconds).
- `"perSide": true` → shows a "per side" label. You log one number.
- `"target"` overrides `defaultRepTarget` / `defaultTimeTarget` from `settings`.
- `"note"` shows as a small hint on the exercise card.
- `"format": "sets"` needs `"sets"`; `"format": "circuit"` needs `"rounds"`.

The file is checked with Zod before every build (`npm run validate:exercises`). A mistake fails the build with a message like:

```
✖ type must be "reps" or "time"
  → at workouts.strengthA.slots[0].options[0].type
```

Each logged set saves the exercise **name** along with its `id`, so renaming or removing an exercise doesn't break History or Progress. Avoid reusing an old `id` for a different exercise.

## How it works

- **Rotation:** The next workout follows `settings.rotation` and isn't tied to weekdays. When a finished workout is saved on the server, the rotation moves on and every slot of that workout advances to its next option. Starting or abandoning a workout changes nothing.
- **Streak:** A workout day is any date with a finished workout. The streak breaks only after more than `streakBreaksAfterRestDays` rest days in a row.
- **Offline safety:** Progress is saved to `localStorage` after every change. If you close the app mid-workout, you'll get **Resume** or **Discard** next time. Finishing sends the whole workout in one request. If that fails, it stays on the phone with a **Not synced** notice and retries automatically the next time the app opens. Each workout carries a unique id, so retries never create duplicates.
- **Auth:** Username + password. As requested, passwords are stored as **plain text**. Sessions are random 30-day tokens in an httpOnly, SameSite=Lax cookie that is `Secure` in production. Five failed logins lock that username for 15 minutes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Validate `exercises.json`, then build |
| `npm start` | Run the production build |
| `npm run typecheck` | TypeScript check |
| `npm run validate:exercises` | Validate `data/exercises.json` only |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:studio` | Browse the database with Drizzle Studio |

App icons are in `public/`. Regenerate them with `node scripts/generate-icons.mjs`.
