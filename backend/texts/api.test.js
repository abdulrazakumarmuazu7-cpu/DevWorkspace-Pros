import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { randomUUID } from 'node:crypto';

let base, server, mockSupabase;
const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const projects = [], files = [];
async function freePort() { return new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(e => e ? reject(e) : resolve(p)); }); }); }
function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json' }); res.end(body === null ? '' : JSON.stringify(body)); }
function currentUser(req) { return req.headers.authorization === 'Bearer test-token' ? USER_ID : req.headers.authorization === 'Bearer other-token' ? OTHER_USER_ID : null; }
function filterRows(table, search, uid) {
  const source = table === 'dwp_projects' ? projects : files;
  return source.filter(row => row.owner_id === uid && [...search.entries()].every(([k, v]) => {
    if (k === 'select' || k === 'order' || k === 'limit' || k === 'or') return true;
    const inMatch = v.match(/^in\.\((.*)\)$/);
    if (inMatch) return inMatch[1].split(',').includes(String(row[k]));
    const m = v.match(/^(eq|like)\.(.*)$/);
    if (!m) return true;
    const val = decodeURIComponent(m[2]);
    if (m[1] === 'eq') return String(row[k]) === val;
    return String(row[k]).startsWith(val.replace(/\*/g, ''));
  })).slice(0, Number(search.get('limit') || 9999));
}
before(async () => {
  const port = await freePort();
  mockSupabase = (await import('node:http')).createServer(async (req, res) => {
    const uid = currentUser(req);
    if (req.url.startsWith('/auth/v1/user')) return uid ? json(res, 200, { id: uid, email: 'user@example.com' }) : json(res, 401, { message: 'bad token' });
    if (req.url.startsWith('/rest/v1/')) {
      if (!uid) return json(res, 401, { message: 'unauthorized' });
      const u = new URL(req.url, 'http://localhost'); const table = u.pathname.split('/').pop(); const rows = table === 'dwp_projects' ? projects : table === 'dwp_files' ? files : null;
      if (!rows) return json(res, 404, { message: 'table not found' });
      const q = new URLSearchParams(u.search);
      if (req.method === 'GET') return json(res, 200, filterRows(table, q, uid));
      let body = ''; for await (const chunk of req) body += chunk;
      const input = body ? JSON.parse(body) : {};
      if (req.method === 'POST') {
        const row = { id: randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...input };
        if (row.owner_id !== uid) return json(res, 403, { message: 'RLS denied' });
        rows.push(row);
        return json(res, 201, req.headers.prefer?.includes('return=representation') ? [row] : null);
      }
      const matches = filterRows(table, q, uid);
      if (req.method === 'PATCH') { for (const row of matches) Object.assign(row, input); return json(res, 204, null); }
      if (req.method === 'DELETE') { for (const row of matches) rows.splice(rows.indexOf(row), 1); return json(res, 204, null); }
    }
    return json(res, 404, { message: 'not found' });
  });
  await new Promise(resolve => mockSupabase.listen(port, '127.0.0.1', resolve));
  process.env.SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  const apiPort = await freePort(); process.env.PORT = String(apiPort); process.env.AUTH_FAIL_LIMIT_PER_MIN = '5'; process.env.CORS_ORIGIN = `http://127.0.0.1:${apiPort}`; base = `http://127.0.0.1:${apiPort}`;
  ({ server } = await import('../src/server.js'));
  if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
});
after(async () => { if (server?.listening) await new Promise(resolve => server.close(resolve)); if (mockSupabase?.listening) await new Promise(resolve => mockSupabase.close(resolve)); });
const auth = token => ({ 'content-type': 'application/json', authorization: `Bearer ${token}` });

test('health endpoint reports database storage mode', async () => { const r = await fetch(`${base}/api/health`); const d = await r.json(); assert.equal(r.status, 200); assert.equal(d.storage, 'supabase-database'); });
test('creates a Supabase-backed project and saves/reads a file', async () => {
  const created = await fetch(`${base}/api/projects`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ name: 'API project' }) });
  assert.equal(created.status, 201); const { project } = await created.json(); assert.match(project.id, /^[0-9a-f-]{36}$/i);
  const saved = await fetch(`${base}/api/projects/${project.id}/file`, { method: 'PUT', headers: auth('test-token'), body: JSON.stringify({ path: 'src/hello.js', content: 'console.log("hello")' }) }); assert.equal(saved.status, 200);
  const read = await fetch(`${base}/api/projects/${project.id}/file?path=src%2Fhello.js`, { headers: auth('test-token') }); assert.equal(read.status, 200); assert.equal((await read.json()).content, 'console.log("hello")');
});
test('blocks traversal-style file paths', async () => { const c = await fetch(`${base}/api/projects`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ name: 'Traversal test' }) }); const { project } = await c.json(); const r = await fetch(`${base}/api/projects/${project.id}/file`, { method: 'PUT', headers: auth('test-token'), body: JSON.stringify({ path: '../outside.txt', content: 'bad' }) }); assert.equal(r.status, 400); });
test('rejects requests without a valid access token', async () => { const r = await fetch(`${base}/api/projects`); assert.equal(r.status, 401); });
test('users cannot list or read another user project', async () => { const c = await fetch(`${base}/api/projects`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ name: 'Private project' }) }); const { project } = await c.json(); const list = await fetch(`${base}/api/projects`, { headers: auth('other-token') }); assert.equal((await list.json()).projects.some(p => p.id === project.id), false); const read = await fetch(`${base}/api/projects/${project.id}`, { headers: auth('other-token') }); assert.equal(read.status, 404); });

async function newProject(name) { const c = await fetch(`${base}/api/projects`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ name }) }); return (await c.json()).project; }
async function putFile(id, path, content = 'x') { return fetch(`${base}/api/projects/${id}/file`, { method: 'PUT', headers: auth('test-token'), body: JSON.stringify({ path, content }) }); }
async function listPaths(id) { const r = await fetch(`${base}/api/projects/${id}`, { headers: auth('test-token') }); return (await r.json()).entries.filter(e => e.type === 'file').map(e => e.path); }

test('the shell terminal route no longer exists', async () => {
  const r = await fetch(`${base}/api/terminal`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ command: 'id' }) });
  assert.equal(r.status, 404);
});
test('deleting a folder only removes that exact folder (no LIKE wildcards)', async () => {
  const p = await newProject('Delete test');
  for (const f of ['my_dir/a.txt', 'myXdir/b.txt', 'my_dir_long/c.txt', 'keep.txt']) assert.equal((await putFile(p.id, f)).status, 200);
  const r = await fetch(`${base}/api/projects/${p.id}/entry?path=my_dir`, { method: 'DELETE', headers: auth('test-token') });
  assert.equal(r.status, 200); assert.equal((await r.json()).count, 1);
  assert.deepEqual((await listPaths(p.id)).sort(), ['index.html', 'keep.txt', 'myXdir/b.txt', 'my_dir_long/c.txt']);
});
test('a crafted path cannot alter the delete filter', async () => {
  const p = await newProject('Injection test');
  assert.equal((await putFile(p.id, 'a.txt')).status, 200);
  const evil = encodeURIComponent('x,id.not.is.null');
  const r = await fetch(`${base}/api/projects/${p.id}/entry?path=${evil}`, { method: 'DELETE', headers: auth('test-token') });
  assert.equal(r.status, 404);
  assert.deepEqual((await listPaths(p.id)).sort(), ['a.txt', 'index.html']);
});
test('rejects control characters in paths and oversized files', async () => {
  const p = await newProject('Limits test');
  assert.equal((await putFile(p.id, 'bad\nname.txt')).status, 400);
  assert.equal((await putFile(p.id, 'big.txt', 'a'.repeat(1024 * 1024 + 1))).status, 413);
});
test('CORS only reflects configured origins and security headers are set', async () => {
  const bad = await fetch(`${base}/api/health`, { headers: { origin: 'https://evil.example' } });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  const good = await fetch(`${base}/api/health`, { headers: { origin: process.env.CORS_ORIGIN } });
  assert.equal(good.headers.get('access-control-allow-origin'), process.env.CORS_ORIGIN);
  assert.equal(good.headers.get('x-content-type-options'), 'nosniff');
});
test('repeated failed authentication is rate limited', async () => {
  const codes = [];
  for (let i = 0; i < 10; i++) codes.push((await fetch(`${base}/api/projects`, { headers: auth('wrong-token') })).status);
  assert.ok(codes.includes(429), `expected a 429 in ${codes.join(',')}`);
});

const renameReq = (id, from, to) => fetch(`${base}/api/projects/${id}/rename`, { method: 'POST', headers: auth('test-token'), body: JSON.stringify({ from, to }) });
test('renames a single file and keeps its content', async () => {
  const p = await newProject('Rename file');
  assert.equal((await putFile(p.id, 'old.js', 'hello')).status, 200);
  const r = await renameReq(p.id, 'old.js', 'src/new.js');
  assert.equal(r.status, 200); assert.equal((await r.json()).count, 1);
  assert.deepEqual((await listPaths(p.id)).sort(), ['index.html', 'src/new.js']);
  const read = await fetch(`${base}/api/projects/${p.id}/file?path=src%2Fnew.js`, { headers: auth('test-token') });
  assert.equal((await read.json()).content, 'hello');
});
test('renaming a folder moves only that exact folder', async () => {
  const p = await newProject('Rename folder');
  for (const f of ['my_dir/a.txt', 'my_dir/sub/b.txt', 'myXdir/c.txt', 'my_dir_long/d.txt']) assert.equal((await putFile(p.id, f)).status, 200);
  const r = await renameReq(p.id, 'my_dir', 'renamed');
  assert.equal(r.status, 200); assert.equal((await r.json()).count, 2);
  assert.deepEqual((await listPaths(p.id)).sort(), ['index.html', 'myXdir/c.txt', 'my_dir_long/d.txt', 'renamed/a.txt', 'renamed/sub/b.txt']);
});
test('rename refuses to overwrite, move into itself, or use bad paths', async () => {
  const p = await newProject('Rename conflicts');
  for (const f of ['a.txt', 'b.txt', 'dir/x.txt']) assert.equal((await putFile(p.id, f)).status, 200);
  assert.equal((await renameReq(p.id, 'a.txt', 'b.txt')).status, 409);
  assert.equal((await renameReq(p.id, 'a.txt', 'dir')).status, 409);
  assert.equal((await renameReq(p.id, 'dir', 'dir/inner')).status, 400);
  assert.equal((await renameReq(p.id, 'a.txt', '../evil')).status, 400);
  assert.equal((await renameReq(p.id, 'missing.txt', 'z.txt')).status, 404);
  assert.deepEqual((await listPaths(p.id)).sort(), ['a.txt', 'b.txt', 'dir/x.txt', 'index.html']);
});
