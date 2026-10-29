import http from 'node:http';
import { randomUUID, createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT || 8787);
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 300);
const AUTH_FAIL_LIMIT_PER_MIN = Number(process.env.AUTH_FAIL_LIMIT_PER_MIN || 30);
const MAX_BODY = 2 * 1024 * 1024;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES_PER_PROJECT = Number(process.env.MAX_FILES_PER_PROJECT || 500);
const MAX_PROJECTS_PER_USER = Number(process.env.MAX_PROJECTS_PER_USER || 50);
const UPSTREAM_TIMEOUT_MS = 10000;
const AUTH_CACHE_TTL_MS = 15000;

// CORS_ORIGIN is mandatory: one or more exact origins, comma-separated.
// A wildcard is never accepted, and there is no localhost fallback.
const ALLOWED_ORIGINS = String(process.env.CORS_ORIGIN || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
if (!ALLOWED_ORIGINS.length) {
  console.error('FATAL: CORS_ORIGIN is not set. Set it to the exact frontend origin(s), e.g. https://app.example.com');
  process.exit(1);
}
if (ALLOWED_ORIGINS.includes('*')) {
  console.error('FATAL: CORS_ORIGIN must not be "*". List the exact frontend origin(s).');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('WARNING: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are not set. Authenticated routes will return 503.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

function corsHeaders(req) {
  const origin = String(req.headers.origin || '').replace(/\/+$/, '');
  const headers = { vary: 'Origin' };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-headers'] = 'content-type, authorization';
    headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    headers['access-control-max-age'] = '600';
  }
  return headers;
}
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-resource-policy': 'same-site',
  'cache-control': 'no-store',
};
function send(req, res, status, data, extra = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...corsHeaders(req), ...extra });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    req.on('data', chunk => {
      if (done) return;
      size += chunk.length;
      if (size > MAX_BODY) { done = true; reject(httpError(413, 'Request body too large')); req.resume(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (done) return;
      try { const raw = Buffer.concat(chunks).toString('utf8'); resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(httpError(400, 'Invalid JSON body')); }
    });
    req.on('error', err => { if (!done) { done = true; reject(err); } });
  });
}

// Relative POSIX-style path validation. Control characters are rejected so a
// path can never carry newlines or NULs into logs or the database.
function validPath(input) {
  if (typeof input !== 'string' || !input || input.length > 500) return false;
  if (input.includes('\\') || input.startsWith('/') || /^[a-zA-Z]:/.test(input)) return false;
  if (/[\u0000-\u001f\u007f]/.test(input)) return false;
  return input.split('/').every(p => p && p !== '.' && p !== '..' && p.length <= 255);
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, fixed window). Use a shared store if you run more
// than one instance behind a load balancer.
// ---------------------------------------------------------------------------
const windows = new Map();
function hit(key, limit) {
  const now = Date.now();
  let w = windows.get(key);
  if (!w || now - w.start >= 60000) { w = { start: now, count: 0 }; windows.set(key, w); }
  w.count += 1;
  return { allowed: w.count <= limit, retryAfter: Math.max(1, Math.ceil((w.start + 60000 - now) / 1000)) };
}
const sweeper = setInterval(() => { const now = Date.now(); for (const [k, w] of windows) if (now - w.start >= 60000) windows.delete(k); }, 30000);
sweeper.unref();
function clientIp(req) {
  if (TRUST_PROXY) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}

// ---------------------------------------------------------------------------
// Supabase access (always with the signed-in user's token, so RLS applies)
// ---------------------------------------------------------------------------
const authCache = new Map();
async function authenticate(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw httpError(503, 'Supabase authentication is not configured');
  const token = match[1];
  const cacheKey = createHash('sha256').update(token).digest('hex');
  const cached = authCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return { ...cached.user, accessToken: token };
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user || typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) return null;
  if (authCache.size > 1000) authCache.clear();
  authCache.set(cacheKey, { user: { id: user.id, email: user.email }, exp: Date.now() + AUTH_CACHE_TTL_MS });
  return { id: user.id, email: user.email, accessToken: token };
}

async function db(user, table, { method = 'GET', query = '', body, prefer } = {}) {
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${user.accessToken}`, accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (prefer) headers.prefer = prefer;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  const raw = await response.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw }; }
  if (!response.ok) {
    const statusCode = response.status === 404 ? 404 : response.status === 401 || response.status === 403 ? 403 : response.status >= 400 && response.status < 500 ? 400 : 502;
    const message = statusCode >= 500 ? 'Upstream database error' : (data?.message || data?.error || `Database request failed (${response.status})`);
    throw httpError(statusCode, message);
  }
  return data;
}

// PostgREST filter values: only ever used with `eq.` (exact match, no wildcards)
// and always percent-encoded, so a path can never alter the filter structure.
const eq = value => `eq.${encodeURIComponent(value)}`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function projectIdOrThrow(id) { if (!UUID_RE.test(id)) throw httpError(400, 'Invalid project id'); return id; }
async function requireOwnedProject(user, id) {
  const rows = await db(user, 'dwp_projects', { query: `select=id,name,description&id=${eq(id)}&limit=1` });
  if (!Array.isArray(rows) || !rows.length) throw httpError(404, 'Project not found');
  return rows[0];
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  let routeLabel = '-';
  res.on('finish', () => {
    console.log(JSON.stringify({ t: new Date().toISOString(), method: req.method, route: routeLabel, status: res.statusCode, ms: Date.now() - started }));
  });
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { ...SECURITY_HEADERS, ...corsHeaders(req) }); return res.end(); }
    const url = new URL(req.url, 'http://localhost');
    routeLabel = url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ':id');
    const ip = clientIp(req);
    const general = hit(`ip:${ip}`, RATE_LIMIT_PER_MIN);
    if (!general.allowed) return send(req, res, 429, { error: 'Too many requests. Slow down and try again shortly.' }, { 'retry-after': String(general.retryAfter) });

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return send(req, res, 200, { ok: true, service: 'devworkspace-workspace-api', status: 'running', auth: Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY), storage: 'supabase-database' });
    }

    const user = await authenticate(req);
    if (!user) {
      const fail = hit(`authfail:${ip}`, AUTH_FAIL_LIMIT_PER_MIN);
      if (!fail.allowed) return send(req, res, 429, { error: 'Too many failed sign-in attempts. Try again later.' }, { 'retry-after': String(fail.retryAfter) });
      return send(req, res, 401, { error: 'Sign in is required. Send a valid Supabase access token in the Authorization header.' });
    }

    if (url.pathname === '/api/projects' && req.method === 'GET') {
      const projects = await db(user, 'dwp_projects', { query: 'select=id,name,description,created_at,updated_at&order=updated_at.desc&limit=200' });
      return send(req, res, 200, { projects: Array.isArray(projects) ? projects : [] });
    }
    if (url.pathname === '/api/projects' && req.method === 'POST') {
      const body = await readBody(req);
      const existing = await db(user, 'dwp_projects', { query: `select=id&limit=${MAX_PROJECTS_PER_USER + 1}` });
      if (Array.isArray(existing) && existing.length >= MAX_PROJECTS_PER_USER) throw httpError(409, `Project limit reached (${MAX_PROJECTS_PER_USER}). Delete a project before creating a new one.`);
      const name = String(body.name || 'untitled-project').trim().slice(0, 120) || `project-${randomUUID().slice(0, 8)}`;
      const created = await db(user, 'dwp_projects', { method: 'POST', query: 'select=id,name,description,created_at,updated_at', body: { owner_id: user.id, name, description: String(body.description || '').slice(0, 2000) }, prefer: 'return=representation' });
      const project = Array.isArray(created) ? created[0] : null;
      if (!project?.id) throw new Error('Project was created but no project record was returned');
      await db(user, 'dwp_files', { method: 'POST', query: 'select=id', body: { project_id: project.id, owner_id: user.id, path: 'index.html', content: '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New Project</title></head><body><h1>Hello, DevWorkspace!</h1></body></html>\n' }, prefer: 'return=minimal' });
      return send(req, res, 201, { project });
    }

    const match = url.pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/);
    if (!match) return send(req, res, 404, { error: 'Route not found' });
    let rawId, sub;
    try { rawId = decodeURIComponent(match[1]); sub = match[2] ? decodeURIComponent(match[2]) : ''; } catch { throw httpError(400, 'Malformed URL'); }
    const id = projectIdOrThrow(rawId);
    const project = await requireOwnedProject(user, id);

    if (!sub && req.method === 'GET') {
      const rows = await db(user, 'dwp_files', { query: `select=path&project_id=${eq(id)}&order=path.asc&limit=${MAX_FILES_PER_PROJECT + 1}` });
      const entries = new Map();
      for (const row of rows || []) {
        const parts = row.path.split('/');
        for (let i = 1; i < parts.length; i++) { const p = parts.slice(0, i).join('/'); entries.set(p, { path: p, type: 'directory' }); }
        entries.set(row.path, { path: row.path, type: 'file' });
      }
      return send(req, res, 200, { project, entries: [...entries.values()].sort((a, b) => a.path.localeCompare(b.path)) });
    }
    if (sub === 'file' && req.method === 'GET') {
      const filePath = url.searchParams.get('path') || '';
      if (!validPath(filePath)) return send(req, res, 400, { error: 'Invalid relative file path' });
      const rows = await db(user, 'dwp_files', { query: `select=path,content&project_id=${eq(id)}&path=${eq(filePath)}&limit=1` });
      if (!Array.isArray(rows) || !rows.length) return send(req, res, 404, { error: 'File not found' });
      return send(req, res, 200, { path: rows[0].path, content: rows[0].content });
    }
    if (sub === 'file' && req.method === 'PUT') {
      const body = await readBody(req); const filePath = String(body.path || '');
      if (!validPath(filePath)) return send(req, res, 400, { error: 'Invalid relative file path' });
      if (typeof body.content !== 'string') return send(req, res, 400, { error: 'content must be a string' });
      if (Buffer.byteLength(body.content) > MAX_FILE_BYTES) return send(req, res, 413, { error: `File is too large (limit ${MAX_FILE_BYTES} bytes)` });
      const existing = await db(user, 'dwp_files', { query: `select=id&project_id=${eq(id)}&path=${eq(filePath)}&limit=1` });
      if (Array.isArray(existing) && existing.length) {
        await db(user, 'dwp_files', { method: 'PATCH', query: `project_id=${eq(id)}&path=${eq(filePath)}`, body: { content: body.content, updated_at: new Date().toISOString() }, prefer: 'return=minimal' });
      } else {
        const all = await db(user, 'dwp_files', { query: `select=id&project_id=${eq(id)}&limit=${MAX_FILES_PER_PROJECT + 1}` });
        if (Array.isArray(all) && all.length >= MAX_FILES_PER_PROJECT) throw httpError(409, `File limit reached (${MAX_FILES_PER_PROJECT} files per project)`);
        await db(user, 'dwp_files', { method: 'POST', query: 'select=id', body: { project_id: id, owner_id: user.id, path: filePath, content: body.content }, prefer: 'return=minimal' });
      }
      return send(req, res, 200, { saved: true, path: filePath, bytes: Buffer.byteLength(body.content) });
    }
    if (sub === 'folder' && req.method === 'POST') {
      const body = await readBody(req); const folder = String(body.path || '');
      if (!validPath(folder)) return send(req, res, 400, { error: 'Invalid relative folder path' });
      return send(req, res, 201, { created: true, path: folder, note: 'Folders are virtual and appear when a file is saved inside them.' });
    }
    if (sub === 'rename' && req.method === 'POST') {
      const body = await readBody(req);
      const from = String(body.from || ''), to = String(body.to || '');
      if (!validPath(from) || !validPath(to)) return send(req, res, 400, { error: 'Invalid relative path' });
      if (from === to) return send(req, res, 400, { error: 'Source and destination are the same' });
      if (to.startsWith(`${from}/`)) return send(req, res, 400, { error: 'A folder cannot be moved into itself' });
      const rows = await db(user, 'dwp_files', { query: `select=id,path&project_id=${eq(id)}&limit=${MAX_FILES_PER_PROJECT + 1}` });
      const all = Array.isArray(rows) ? rows : [];
      const moves = all.filter(r => r.path === from || r.path.startsWith(`${from}/`)).map(r => ({ id: r.id, from: r.path, to: to + r.path.slice(from.length) }));
      if (!moves.length) return send(req, res, 404, { error: 'File or folder not found' });
      if (moves.some(m => !UUID_RE.test(m.id) || !validPath(m.to))) return send(req, res, 400, { error: 'Invalid destination path' });
      // Refuse (instead of overwriting) when anything outside the moved set collides with the
      // new names, including a file/folder name clash such as "a" versus "a/b".
      const movedIds = new Set(moves.map(m => m.id));
      const clash = all.some(r => !movedIds.has(r.id) && moves.some(m => r.path === m.to || r.path.startsWith(`${m.to}/`) || m.to.startsWith(`${r.path}/`)));
      if (clash) throw httpError(409, 'A file or folder with that name already exists');
      const done = [];
      try {
        for (const m of moves) {
          await db(user, 'dwp_files', { method: 'PATCH', query: `project_id=${eq(id)}&id=${eq(m.id)}`, body: { path: m.to, updated_at: new Date().toISOString() }, prefer: 'return=minimal' });
          done.push(m);
        }
      } catch (err) {
        // Best-effort rollback so a failure part-way does not leave a half-renamed folder.
        for (const m of done.reverse()) {
          try { await db(user, 'dwp_files', { method: 'PATCH', query: `project_id=${eq(id)}&id=${eq(m.id)}`, body: { path: m.from }, prefer: 'return=minimal' }); } catch { /* ignore */ }
        }
        throw err;
      }
      return send(req, res, 200, { renamed: true, from, to, count: moves.length });
    }
    if (sub === 'entry' && req.method === 'DELETE') {
      const entryPath = url.searchParams.get('path') || '';
      if (!validPath(entryPath)) return send(req, res, 400, { error: 'Invalid relative entry path' });
      // Match in application code (exact path or exact folder prefix) instead of
      // building a LIKE/OR filter from user input, then delete strictly by id.
      const prefix = `${entryPath}/`;
      const rows = await db(user, 'dwp_files', { query: `select=id,path&project_id=${eq(id)}&limit=${MAX_FILES_PER_PROJECT + 1}` });
      const targets = (Array.isArray(rows) ? rows : []).filter(r => r.path === entryPath || r.path.startsWith(prefix));
      if (!targets.length) return send(req, res, 404, { error: 'File or folder not found' });
      const ids = targets.map(r => r.id).filter(v => UUID_RE.test(v));
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50).join(',');
        await db(user, 'dwp_files', { method: 'DELETE', query: `project_id=${eq(id)}&id=in.(${chunk})` });
      }
      return send(req, res, 200, { deleted: true, path: entryPath, count: ids.length });
    }
    return send(req, res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err?.statusCode || (err?.name === 'TimeoutError' || err?.name === 'AbortError' ? 504 : 500);
    if (status >= 500) console.error(JSON.stringify({ t: new Date().toISOString(), error: String(err?.message || err), route: routeLabel }));
    const message = status >= 500 ? (status === 504 ? 'Upstream service timed out' : status === 503 && err?.message ? err.message : 'Internal server error') : (err?.message || 'Request failed');
    if (!res.headersSent) return send(req, res, status, { error: message });
    res.end();
  }
});

server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`DevWorkspace API listening on port ${PORT}`));

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
