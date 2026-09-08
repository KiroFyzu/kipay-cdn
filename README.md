# Uploader CDN

A personal CDN-style file uploader. Each user gets a 2GB total storage quota;
files are stored on local disk on the server. Two roles: `admin` and `user`
(similar to Google Drive — folders, browsing, sharing). Public files get a
direct `/cdn/:token` link that works without authentication. Full REST API
with interactive Swagger docs.

## Stack
- **Server**: Node.js + Express, `node:sqlite` (built-in SQLite, requires Node ≥ 22.5), JWT auth, `multer` for streamed disk uploads.
- **Client**: React + Vite, `react-router-dom`, `axios`.

## Requirements
- Node.js **22.5+** (uses the built-in `node:sqlite` module — no native compilation needed).

## Setup

### 1. Server
```bash
cd server
cp .env.example .env   # adjust JWT_SECRET etc. for production
npm install
npm run dev             # starts on http://localhost:4000
```
- API docs: http://localhost:4000/api-docs
- Health check: http://localhost:4000/health

### 2. Client
```bash
cd client
npm install
npm run dev              # starts on http://localhost:5173, proxies /api and /cdn to :4000
```
Open http://localhost:5173.

## Environment variables (`server/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `JWT_SECRET` | (dev default) | Secret used to sign JWTs — **change in production** |
| `DEFAULT_QUOTA_BYTES` | `2147483648` (2GB) | Default per-user storage quota |
| `DB_PATH` | `./data.sqlite` | SQLite database file location |
| `STORAGE_DIR` | `./storage` | Directory where uploaded files are stored (per-user subfolders) |

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
- `POST /api/files` (upload), `GET /api/files`, `GET/DELETE /api/files/:id`, `PATCH /api/files/:id/visibility`
- `POST/GET /api/folders`, `DELETE /api/folders/:id`
- `GET /api/admin/users`, `PATCH /api/admin/users/:id/quota`, `DELETE /api/admin/users/:id`, `GET /api/admin/files` (admin only)
- `GET /cdn/:token` (public, no auth)
