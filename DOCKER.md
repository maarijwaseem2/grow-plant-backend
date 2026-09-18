# Running Go Green with Docker

## One command
Put the two unzipped folders side by side and rename them `backend` and
`frontend` (or edit `frontend.build.context` in docker-compose.yml), then from
the `backend` folder run:

```
docker compose up --build
```

This starts five containers:
- postgres  (PostGIS enabled) — the database, on 5432
- redis     — cache, on 6379
- ai-engine — the FastAPI AI service, on 8000
- backend   — the NestJS API, on 3001 (auto-creates tables, enables PostGIS,
              seeds the admin on first boot)
- frontend  — the built React app served by nginx, on http://localhost

## Login
Admin: `admin@gogreen.pk` / `Admin@12345` (change via the backend env).

## Notes
- The backend talks to the AI service at http://ai-engine:8000 and to Postgres
  at host `postgres` — all wired by compose networking.
- Uploaded images and the DB persist in named volumes (`uploads`, `pgdata`).
- To run only the server stack (no frontend container), start specific services:
  `docker compose up --build postgres redis ai-engine backend`
