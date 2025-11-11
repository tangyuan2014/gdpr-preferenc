# sample-vue

Dockerized Vite + Vue starter project with a small Node/Express API for demoing GDPR-friendly user storage.

This repo is intentionally minimal and intended for local development and learning. It implements the following components:

- web (Vite + Vue) — front-end app served by Vite dev server (port 5173)
- api (Node + Express) — small API for storing user records in `server/db.json` (port 4000)

Important: the API uses a plain JSON file for storage (server/db.json). This is only for demonstration and local testing. Do not use this storage strategy in production.

Quick start (Docker Compose):

```bash
# build and start in background
make dev

# stream logs
make logs

# stop
make down
```

Direct Compose commands:

```bash
docker compose up --build
docker compose exec web npm test
docker compose exec web ./scripts/migrate.sh
```

Architecture & data flow
- The browser (Vite dev server) talks to the API at `http://localhost:4000` (see `docker-compose.yml` which sets `VITE_API_URL`).
- The API persists user records to `server/db.json` and exposes GDPR-related endpoints (export, delete, consent).

GDPR-related API endpoints (demo)
- POST /users
	- Create a user. Requires `{ email, consent: true }` in the body. Returns `{ id }` on success.
- GET /users
	- Returns a lightweight listing (id, email, createdAt). Does not return full personal data in the list.
- GET /users/:id
	- Returns the full user record (for data access requests).
- GET /users/:id/export
	- Returns an export wrapper `{ exportedAt, user }` suitable for download.
- DELETE /users/:id
	- Performs data erasure (physical deletion from `server/db.json`).
- POST /users/:id/consent
	- Update consent boolean for a user (body: `{ consent: boolean }`).

Examples (curl)

Create a user (consent required):
```bash
curl -X POST http://localhost:4000/users \
	-H 'Content-Type: application/json' \
	-d '{"email":"alice@example.com","consent":true}'
```

Export a user:
```bash
curl http://localhost:4000/users/<id>/export
```

Delete a user:
```bash
curl -X DELETE http://localhost:4000/users/<id>
```

Developer notes & next steps
- The API is synchronous and uses the filesystem for simplicity. For production you should:
 - The API records consent metadata (`consentTimestamp`, `consentSource`) and writes a simple audit log to `server/audit.log` for exports, deletions and consent changes. This is for demo traceability only.
 - The export endpoint includes metadata (`exportedAt`, `exportedBy`) and the original `consentTimestamp`.

For production you should:
	- Move to a proper database (Postgres, MySQL) with migrations and connection pooling.
	- Add authentication so only authorized users or the subject themselves can request exports/deletions.
	- Add audit logging of exports/deletions with actor information and timestamps.
	- Implement robust validation, rate-limiting, and monitoring.

Where to look first
- `index.html`, `src/main.js`, `src/App.vue` — front-end entrypoints
- `server/index.js` — API and GDPR endpoints
- `server/db.json` — created on first run; demo storage location
- `docker-compose.yml`, `Dockerfile` — local dev orchestration
- `.github/copilot-instructions.md` — agent-focused instructions and quick tasks

