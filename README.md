# DADA'S NUMEROLOGY — Admin Panel

Staff dashboard for DADA'S NUMEROLOGY. React 19 + Vite + TypeScript, sharing the
mobile app's parchment palette.

| Repo | |
| --- | --- |
| **Admin panel** (this repo) | https://github.com/ulmind-com/DADA-NAMEROLOGY-Admin |
| Backend (FastAPI) | https://github.com/ulmind-com/DADA-NAMEROLOGY-Backend |
| Mobile app (Expo) | https://github.com/ulmind-com/DADA-NAMEROLOGY-MobileApp |

> Start the backend first — this panel is a client of its `/admin` API.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run lint      # tsc --noEmit
```

Sign in with an account whose role is `admin` or `superadmin`. A `user` role is
rejected at the login screen.

Dev requests proxy `/api` → `http://127.0.0.1:8000`, so no CORS setup is needed
locally. For a deployed panel set `VITE_API_URL` to the full API base, e.g.
`https://dada-numerology-api.onrender.com/api/v1`.

## Deploying

`render.yaml` is a Render Blueprint: **New → Blueprint → this repo → Apply**, then set
`VITE_API_URL`. It builds with `npm ci && npm run build` and publishes `dist`, with a
rewrite so deep links survive a refresh.

`VITE_API_URL` is compiled into the bundle, so changing it later needs
**Manual Deploy → Clear build cache & deploy**. Remember to add this site's URL to the
API's `CORS_ORIGINS_RAW`.

The full walkthrough lives in the backend repo:
[DEPLOY.md](https://github.com/ulmind-com/DADA-NAMEROLOGY-Backend/blob/main/DEPLOY.md).

## Pages

| Route | What it does |
| --- | --- |
| `/` | Live counts, 30-day signup/report chart, module breakdown, newest users and readings |
| `/users` | Search and filter; toggle premium or disable an account inline |
| `/users/:id` | Full profile, report history, role changes and deletion (super-admin) |
| `/reports` | Every reading, filterable by module and tier |
| `/reports/:id` | Core numbers, the total grid, suggested corrections, raw engine JSON, PDF |
| `/rules` | **Edit compound meanings, planet profiles and all 81 pair meanings** |
| `/settings` | Free-report quota, premium price, vehicle module toggle, maintenance mode, announcement banner, broadcasts, add admins |
| `/audit` | Every admin action with actor, target and timestamp |

## Editing rules

Rules → pick a tab → **Edit**. Saving writes an override to the database and it is live
in the mobile app on the very next request. Anything overridden is tagged `edited` and
can be reverted to the bundled default with one click.

Super-admin only: changing roles, deleting accounts, adding admins, sending broadcasts.
