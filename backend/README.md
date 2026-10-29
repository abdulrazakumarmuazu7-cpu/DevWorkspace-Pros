# DevWorkspace Pro Workspace API — Milestone 2

This is a starter Node.js workspace API. It stores project files under `backend/workspaces/` by default.

## Run

Requires Node.js 20+.

```sh
cd backend
npm start
```

Health check: `GET http://localhost:8787/api/health`

## Routes

- `GET /api/projects` — list projects
- `POST /api/projects` JSON `{ "name": "my-project" }` — create a project and starter `index.html`
- `GET /api/projects/:id` — list project entries
- `GET /api/projects/:id/file?path=index.html` — read a UTF-8 text file
- `PUT /api/projects/:id/file` JSON `{ "path": "index.html", "content": "..." }` — write a UTF-8 text file
- `POST /api/projects/:id/folder` JSON `{ "path": "src" }` — create a folder
- `DELETE /api/projects/:id/entry?path=src/old.js` — delete an entry
- `POST /api/projects/:id/rename` with `{ "from", "to" }` — rename a file or move a folder (409 on conflict)

## Important limitations

Requests are authenticated with the signed-in user's Supabase token, so Row Level Security applies. The API has rate limiting, per-user project/file limits, strict CORS (`CORS_ORIGIN` is mandatory), security headers and JSON request logs. It intentionally does NOT execute terminal commands or run user code: that needs an isolated container runtime (no network, no secrets, CPU/memory/time limits) before it can be offered safely. Test on a trusted development environment only.


## Supabase Authentication (required for server workspaces)

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the backend environment. The API validates each Bearer access token against Supabase Auth `/auth/v1/user`; all workspace files are stored under a per-user directory. `/api/health` is public and reports whether auth configuration is present. Never put a Supabase secret/service-role key in frontend code.

Copy `.env.example` to `.env` for local setup and keep `.env` out of version control. Configure the Supabase Auth Site URL and allowed redirect URLs for the actual deployed frontend before testing email confirmation.
