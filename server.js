#!/usr/bin/env node
/*
 * Ideenmappe – self-hosted server.
 * No dependencies: needs only Node.js 18 or newer.
 *
 *   APP_PASSWORD='ein-langes-passwort' node server.js
 *
 * Stores every board as a JSON file and every image / PDF as a file in DATA_DIR.
 * Run it behind a reverse proxy with HTTPS (see README.md), never as plain HTTP on the internet.
 *
 * Copyright (C) 2026 Otto Wuttke – licensed under the GNU GPL v3 or later (see LICENSE).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// ---------- settings (environment variables) ----------
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '127.0.0.1';              // only reachable through the reverse proxy
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC = path.join(__dirname, 'public');
const PASSWORD = process.env.APP_PASSWORD || '';
const TRUST_PROXY = process.env.TRUST_PROXY !== '0';       // read the client IP / https from the proxy headers
const SESSION_DAYS = parseInt(process.env.SESSION_DAYS || '30', 10);
const MAX_BOARD = parseInt(process.env.MAX_BOARD_MB || '10', 10) * 1024 * 1024;
const MAX_FILE = parseInt(process.env.MAX_FILE_MB || '50', 10) * 1024 * 1024;

if (PASSWORD.length < 10) {
  console.error('Bitte APP_PASSWORD mit mindestens 10 Zeichen setzen, z. B.:\n  APP_PASSWORD="mein-langes-passwort" node server.js');
  process.exit(1);
}

const BOARDS = path.join(DATA, 'boards');
const FILES = path.join(DATA, 'files');
fs.mkdirSync(BOARDS, { recursive: true });
fs.mkdirSync(FILES, { recursive: true });

// secret for signing the login cookie; kept in the data folder so logins survive restarts
const SECRET_FILE = path.join(DATA, 'session.key');
let SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  try { SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim(); } catch (e) { /* first start */ }
  if (!SECRET) { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 }); }
}

// ---------- helpers ----------
const ID_RE = /^[A-Za-z0-9_.:~@+-]{1,120}$/;
const FILE_RE = /^[a-f0-9]{32}\.(png|jpg|gif|webp|pdf)$/;
const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const STATIC_TYPES = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf' };

// Everything comes from this server: fonts and libraries are part of the app (public/, public/vendor/).
// The browser is told to refuse any request to other servers.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

function headers(extra) {
  return Object.assign({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin'
  }, extra || {});
}
function send(res, code, body, extra) {
  const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
  const data = isObj ? JSON.stringify(body) : (body || '');
  res.writeHead(code, headers(Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  }, extra)));
  res.end(data);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function clientIp(req) {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
  return req.socket.remoteAddress || '?';
}
function isHttps(req) {
  return TRUST_PROXY ? req.headers['x-forwarded-proto'] === 'https' : !!req.socket.encrypted;
}
async function writeAtomic(file, data) {
  const tmp = file + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  await fsp.writeFile(tmp, data, { mode: 0o600 });
  await fsp.rename(tmp, file);
}

// ---------- login sessions (signed cookie, no server-side state) ----------
const COOKIE = 'im_session';
function sign(payload) {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const s = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  return p + '.' + s;
}
function verify(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [p, s] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  const a = Buffer.from(s || ''), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const d = JSON.parse(Buffer.from(p, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch (e) { return null; }
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function authed(req) { return !!verify(cookies(req)[COOKIE]); }
function sessionCookie(req, value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}
const pwHash = crypto.createHash('sha256').update(PASSWORD).digest();
function passwordOk(given) {
  const h = crypto.createHash('sha256').update(String(given || '')).digest();
  return crypto.timingSafeEqual(h, pwHash);
}
// at most 8 wrong passwords per IP in 15 minutes
const attempts = new Map();
function limited(ip) {
  const a = attempts.get(ip); const now = Date.now();
  if (!a || a.until < now) return false;
  return a.count >= 8;
}
function failed(ip) {
  const now = Date.now(); const a = attempts.get(ip);
  if (!a || a.until < now) attempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
  else a.count++;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of attempts) if (v.until < now) attempts.delete(k); }, 60 * 1000).unref();

// ---------- live updates (server-sent events) ----------
const listeners = new Set();
function broadcast(msg) {
  const line = 'data: ' + JSON.stringify(msg) + '\n\n';
  for (const res of listeners) { try { res.write(line); } catch (e) { listeners.delete(res); } }
}
setInterval(() => { for (const res of listeners) { try { res.write(': ping\n\n'); } catch (e) { listeners.delete(res); } } }, 25000).unref();

// ---------- routes ----------
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  const m = req.method;

  // the app itself
  if (m === 'GET' && (p === '/' || p === '/index.html')) {
    const html = await fsp.readFile(path.join(PUBLIC, 'index.html'));
    res.writeHead(200, headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Security-Policy': CSP }));
    return res.end(html);
  }
  if (m === 'GET' && p === '/healthz') return send(res, 200, 'ok');

  // libraries and licences shipped with the app (public, no login needed)
  if (m === 'GET' && p.startsWith('/vendor/')) {
    const rel = path.normalize(p).replace(/^[/\\]+/, '');
    const file = path.join(PUBLIC, rel);
    const type = STATIC_TYPES[path.extname(file).toLowerCase()];
    if (!type || !file.startsWith(path.join(PUBLIC, 'vendor') + path.sep)) return send(res, 404, 'Nicht gefunden');
    let st; try { st = await fsp.stat(file); } catch (e) { return send(res, 404, 'Nicht gefunden'); }
    if (!st.isFile()) return send(res, 404, 'Nicht gefunden');
    res.writeHead(200, headers({ 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'public, max-age=604800' }));
    return fs.createReadStream(file).pipe(res);
  }

  // login / logout
  if (p === '/api/login' && m === 'POST') {
    const ip = clientIp(req);
    if (limited(ip)) return send(res, 429, { error: 'too_many_attempts' });
    let body = {};
    try { body = JSON.parse((await readBody(req, 4096)).toString() || '{}'); } catch (e) { return send(res, 400, { error: 'bad_request' }); }
    if (!passwordOk(body.password)) { failed(ip); await new Promise(r => setTimeout(r, 400)); return send(res, 401, { error: 'wrong_password' }); }
    attempts.delete(ip);
    const token = sign({ exp: Date.now() + SESSION_DAYS * 864e5, n: crypto.randomBytes(8).toString('hex') });
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, token, SESSION_DAYS * 86400) });
  }
  if (p === '/api/logout' && m === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });

  // everything below needs a login
  if (p.startsWith('/api/') || p.startsWith('/files/')) {
    if (!authed(req)) return send(res, 401, { error: 'login_required' });
  } else return send(res, 404, 'Nicht gefunden');

  if (p === '/api/me' && m === 'GET') return send(res, 200, { ok: true });

  if (p === '/api/boards' && m === 'GET') {
    const names = (await fsp.readdir(BOARDS)).filter(n => n.endsWith('.json'));
    const list = [];
    for (const n of names) {
      try { list.push({ id: n.slice(0, -5), body: JSON.parse(await fsp.readFile(path.join(BOARDS, n), 'utf8')) }); } catch (e) { /* skip a broken file */ }
    }
    return send(res, 200, list);
  }

  let mm = p.match(/^\/api\/boards\/([^/]+)$/);
  if (mm && m === 'PUT') {
    const id = mm[1];
    if (!ID_RE.test(id)) return send(res, 400, { error: 'bad_id' });
    let body;
    try { body = JSON.parse((await readBody(req, MAX_BOARD)).toString()); } catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'too_large' : 'bad_json' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'bad_body' });
    await writeAtomic(path.join(BOARDS, id + '.json'), JSON.stringify(body));
    broadcast({ id, body });
    return send(res, 200, { ok: true });
  }

  if (p === '/api/events' && m === 'GET') {
    res.writeHead(200, headers({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' }));
    res.write(': hallo\n\n');
    listeners.add(res);
    req.on('close', () => listeners.delete(res));
    return;
  }

  if (p === '/api/files' && m === 'POST') {
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const ext = TYPES[type];
    if (!ext) return send(res, 415, { error: 'type_not_allowed' });   // only images and PDFs, never HTML or SVG
    let data;
    try { data = await readBody(req, MAX_FILE); } catch (e) { return send(res, e.status || 400, { error: 'too_large' }); }
    if (!data.length) return send(res, 400, { error: 'empty' });
    const id = crypto.randomBytes(16).toString('hex') + '.' + ext;
    await writeAtomic(path.join(FILES, id), data);
    return send(res, 200, { id, url: 'files/' + id, sizeBytes: data.length, contentType: type });
  }

  mm = p.match(/^\/files\/([^/]+)$/);
  if (mm && m === 'GET') {
    const id = mm[1];
    if (!FILE_RE.test(id)) return send(res, 404, 'Nicht gefunden');
    const file = path.join(FILES, id);
    let st; try { st = await fsp.stat(file); } catch (e) { return send(res, 404, 'Nicht gefunden'); }
    res.writeHead(200, headers({
      'Content-Type': MIME[id.split('.').pop()],
      'Content-Length': st.size,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'; sandbox"
    }));
    return fs.createReadStream(file).pipe(res);
  }

  return send(res, 404, { error: 'not_found' });
}

http.createServer((req, res) => {
  handle(req, res).catch(err => { console.error(err); try { send(res, 500, { error: 'server_error' }); } catch (e) { /* already sent */ } });
}).listen(PORT, HOST, () => {
  console.log(`Ideenmappe läuft auf http://${HOST}:${PORT}  (Daten: ${DATA})`);
});
