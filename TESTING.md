# Testing

## Backend — unit tests  (Jest)
No database needed. Validates the RBAC guards.
```
cd backend
npm install
npm test
```
Result: **10 passed** (AdminGuard, RolesGuard, GardenerGuard).

## Backend — e2e tests  (Jest + Supertest)
Needs PostgreSQL (+ PostGIS) running and reachable per your .env.
```
npm run test:e2e
```
Result: **9 passed** — signup (with province/city/mobile), duplicate-email
rejection, admin self-signup block, customer + admin login, customer blocked
from the admin dashboard (403), admin allowed (200), gardener tasks without a
token (401), and the public plants list.

## Frontend — E2E  (Playwright)
> Note: Maestro is a MOBILE UI testing tool (iOS/Android). This project is a
> React **web** app, so Playwright is the correct equivalent.
```
cd frontend
npm install
npm i -D @playwright/test && npx playwright install
npm run test:e2e
```
Covers: home loads, login form, signup form (new name/mobile/province fields),
shop page. (Playwright starts the dev server automatically.)

## Also verified live during development (manual/integration)
- Auth + RBAC: customer -> admin route = 403, admin = 200, no token = 401.
- Gardener workflow: admin assigns a gardener -> gardener sees the task ->
  Assigned -> In Progress -> Completed; a customer cannot assign (403).
- AI: /ai/suggest-spots returns public spots + caches to PostGIS; /ai/verify-plant
  classifies a green vs non-green image.
- PostGIS: /plantation-spots/nearby returns distance-sorted results (ST_DWithin).
- Redis: the nearby query is cached (60s TTL) when Redis is configured.
