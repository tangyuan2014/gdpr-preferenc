
# Copilot / AI Agent Instructions (project-specific)

Short goal: make safe, small changes to a local Dockerized Vite+Vue frontend and a demo Node API that demonstrates GDPR operations on user data.

Read these files first (quick order)
- `README.md` — project overview, GDPR intent, and curl examples (this is the single best place to start).
- `docker-compose.yml`, `Makefile` — how maintainers run the project locally (use Compose).
- `server/index.js` — API surface and storage model (important: demo JSON-file storage; not production-ready).
- `src/App.vue`, `index.html`, `src/main.js` — front-end usage of the API and UI flows.

What the agent should know up-front
- Docker-first: local development uses `docker compose up --build` (or `make dev`). Prefer running tests and migration commands inside the containers to match CI.
- Storage: `server` stores data in `server/db.json`. This is for demos only. When asked to make persistent changes, propose switching to Postgres or SQLite and include migrations.
- Storage: `server` stores data in `server/db.json`. This is for demos only. This demo also records consent metadata (`consentTimestamp`, `consentSource`) and an append-only audit log at `server/audit.log` for exports, deletions and consent changes.
- GDPR semantics implemented in API:
  - Consent required at record creation (`POST /users` with `consent: true`).
  - Data export: `GET /users/:id/export` returns a JSON export of personal data.
  - Deletion: `DELETE /users/:id` performs physical deletion from the demo DB.

Quick commands (copy-paste)
```bash
make dev             # build & start compose in background
make logs            # follow logs
make down            # stop
docker compose exec web npm test
docker compose exec web ./scripts/migrate.sh
```

API examples you can use for tests (curl)
```bash
# create (consent required)
curl -X POST http://localhost:4000/users -H 'Content-Type: application/json' -d '{"email":"alice@example.com","consent":true}'

# list
curl http://localhost:4000/users

# export
curl http://localhost:4000/users/<id>/export

# delete
curl -X DELETE http://localhost:4000/users/<id>
```

Small tasks the agent can do safely (examples)
- Add a unit/integration smoke test that hits `GET /health` and `POST /users` and `DELETE /users/:id` using a test runner inside the `api` container.
- Replace the demo JSON storage with `better-sqlite3` and a minimal migration script. Keep the same API shape and add a migration command to `scripts/migrate.sh`.
- Add a GitHub Actions workflow that builds both images and runs the smoke tests.

When to stop and ask a human
- If you need to change how data is persisted long-term, ask which database and migration policy to use.
- If you plan to add authentication, ask whether the system should implement service-to-service auth (mTLS/JWT) or end-user auth (JWT/password/OAuth).

Edits to avoid unless requested
- Do not change the consent semantics (creation requires explicit consent) without explicit direction.
- Do not replace production-grade security measures with insecure shortcuts — prefer leaving TODOs and a migration plan.

Where to add changes
- Frontend: `src/` — UI behavior and API calls.
- API: `server/` — business logic, storage, and migrations.
- Orchestration: `docker-compose.yml` and `Makefile`.

If you want me to continue
- Say “add tests” to scaffold simple smoke tests.
- Say “add sqlite” to migrate storage to SQLite + migrations (I will scaffold and update `scripts/migrate.sh`).

