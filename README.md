# Uploader CDN

A personal CDN-style file uploader. Each user gets a 2GB total storage quota;
files are stored on local disk on the server. Two roles: `admin` and `user`
(similar to Google Drive — folders, browsing, sharing). Public files get a
direct `/cdn/:token` link that works without authentication. Full REST API
with interactive Swagger docs.

## Stack
- **Server**: Node.js + Express, `node:sqlite` (built-in SQLite, requires Node ≥ 22.5), JWT + 2FA (TOTP) auth for the web UI, revocable API keys for scripts/integrations, `multer` for streamed disk uploads.
- **Client**: React + Vite, `react-router-dom`, `axios`.

## Requirements
- Node.js **22.5+** (uses the built-in `node:sqlite` module — no native compilation needed).

## Setup

The repo is an npm workspace (`client/` + `server/`) — one `npm install` at the
root installs both.

```bash
npm install                # installs client + server dependencies
cp server/.env.example server/.env   # adjust JWT_SECRET etc. for production
npm run dev                 # runs server (:4000) and client dev server (:5173) together
```
- Client dev server: http://localhost:5173 (proxies `/api` and `/cdn` to :4000)
- API docs: http://localhost:4000/api-docs
- Health check: http://localhost:4000/health

Other root scripts: `npm run dev:server` / `npm run dev:client` (run one side
only), `npm run build:client` (production build to `client/dist`), `npm start`
(build client, then start the server).

### Production / single-process deploy
The Express server also serves the built client as static files and falls
back to `client/dist/index.html` for any non-API route (so client-side
routing works) — run `npm run build:client` once, then `npm start`, and the
whole app (UI + API) is reachable from the server's own port. No separate
frontend host is required.

## Environment variables (`server/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port (used when `SERVER_PORT` is not set) |
| `SERVER_PORT` | — | Takes priority over `PORT` if set. Auto-injected by process managers/panels (e.g. Pterodactyl's Wings) based on the allocated port — you normally don't set this yourself. |
| `JWT_SECRET` | (dev default) | Secret used to sign JWTs — **change in production** |
| `DEFAULT_QUOTA_BYTES` | `2147483648` (2GB) | Default per-user storage quota |
| `DB_PATH` | `./data.sqlite` | SQLite database file location |
| `STORAGE_DIR` | `./storage` | Directory where uploaded files are stored (per-user subfolders) |

## CORS
Allowed origins are an explicit allowlist in `server/src/app.js`
(`allowedOrigins`), not a wildcard — add your frontend's domain there before
deploying. Requests with no `Origin` header (same-origin page loads, curl,
server-to-server, mobile apps) are always allowed.

## Authentication
Two ways to authenticate against the API, both sent the same way —
`Authorization: Bearer <value>`:

1. **JWT (web UI login)** — `POST /api/auth/login` with email+password. If the
   account has 2FA enabled it returns `{ requires2FA, loginToken }` instead of
   a token; complete with `POST /api/auth/2fa/login/verify` (`loginToken` +
   6-digit code) to get the JWT. Expires after 7 days. Meant for the browser
   session, not long-running scripts — it can't be revoked before it expires.

2. **API keys (scripts/integrations)** — once logged in (JWT), create one or
   more named keys from **Settings → API Keys** (or `POST /api/api-keys`).
   The raw key (`cdnk_...`) is shown **exactly once** at creation time; only
   its hash is stored. Use it exactly like a JWT
   (`Authorization: Bearer cdnk_...`) on any endpoint — it works everywhere a
   JWT does, including admin endpoints if the key's owner is an admin. Unlike
   JWTs, a key never expires on its own but can be revoked instantly
   (`DELETE /api/api-keys/:id`) if it leaks — create a new one and swap it in.

API key endpoints (all require an existing JWT or API key):
- `GET /api/api-keys` — list your keys (name, prefix, timestamps — never the raw key)
- `POST /api/api-keys` — create a key, body `{ "name": "..." }` (returns the raw key once)
- `DELETE /api/api-keys/:id` — revoke a key immediately

## Creating the first admin
There's no signup flow for admins — register a normal account first, then
promote it from the command line:
```bash
cd server
node scripts/promote-admin.js you@example.com
```
The user must log out and back in (or refresh) to pick up the new role.

## Storage layout
Files are stored at `server/storage/<userId>/<uuid>-<originalFilename>`.
Metadata (owner, folder, size, visibility, public share token) lives in SQLite;
the file bytes themselves are only ever on local disk.

## Quota enforcement
Uploads are checked twice:
1. Before the file is written — the `Content-Length` header is compared
   against the user's remaining quota (fails fast with `413`).
2. After the file is fully written — the actual byte size is checked again
   (in case the header was missing or wrong), and the file is deleted if it
   would exceed the quota.

## Public sharing
Toggle a file to "public" in the Drive UI (or `PATCH /api/files/:id/visibility`)
to generate a public token. The file becomes reachable at
`GET /cdn/:token` with no authentication required, streamed straight from disk
with long-lived cache headers — usable as a lightweight CDN link.

## REST API
Full interactive documentation (request/response schemas, auth) is served at
`/api-docs` (Swagger UI) once the server is running, and as raw OpenAPI JSON
at `/api-docs.json`.

Key endpoints:
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/api-keys`, `DELETE /api/api-keys/:id` (see [Authentication](#authentication))
- `POST /api/files` (upload), `GET /api/files`, `GET/DELETE /api/files/:id`, `PATCH /api/files/:id/visibility`
- `POST/GET /api/folders`, `DELETE /api/folders/:id`
- `GET /api/admin/users`, `PATCH /api/admin/users/:id/quota`, `DELETE /api/admin/users/:id`, `GET /api/admin/files` (admin only)
- `GET /cdn/:token` (public, no auth)
