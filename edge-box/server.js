'use strict';

/**
 * GradeGlow School Edge Box — LAN server for schools with intermittent or zero internet.
 * Node built-ins only (node:http, node:fs, node:crypto, node:path): no npm dependencies,
 * so the image builds and boots identically on a Raspberry Pi 5 or a school desktop.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.EDGE_HOST || '0.0.0.0';
const EDGE_ID = process.env.EDGE_ID || 'school-mesh-box';
const DATA_DIR = process.env.EDGE_DATA_DIR || path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const STATIC_DIR = path.resolve(process.env.EDGE_STATIC_DIR || path.join(__dirname, 'dist'));
const AUTH_TOKEN = process.env.EDGE_AUTH_TOKEN || '';
const CLOUD_URL = (process.env.EDGE_CLOUD_URL || '').replace(/\/+$/, '');
const CLOUD_TOKEN = process.env.EDGE_CLOUD_TOKEN || '';
const SYNC_INTERVAL_MS = parseInt(process.env.EDGE_SYNC_INTERVAL_MS || '0', 10);
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_CHANGES = 5000;

const STARTED_AT = Date.now();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function defaultStore() {
  return {
    version: 1,
    documentVersion: 0,
    documents: {},
    changes: [],
    cloudCursors: { pushed: 0, pulled: 0 },
    catalog: [
      { id: 'lesson-lcm', title: 'Least Common Multiple', subject: 'Mathematics', grade: 7, media: 'text+audio', sizeKb: 438 },
      { id: 'lesson-hcf', title: 'Highest Common Factor', subject: 'Mathematics', grade: 7, media: 'text+audio', sizeKb: 412 },
      { id: 'lesson-fractions', title: 'Fractions & Ratios', subject: 'Mathematics', grade: 7, media: 'slides+audio', sizeKb: 476 },
      { id: 'lesson-cell-structure', title: 'Cell Structure', subject: 'Integrated Science', grade: 6, media: 'vector', sizeKb: 320 },
      { id: 'lesson-photosynthesis', title: 'Photosynthesis', subject: 'Integrated Science', grade: 6, media: 'audio+transcript', sizeKb: 395 },
      { id: 'lesson-integers', title: 'Integers & Number Lines', subject: 'Mathematics', grade: 4, media: 'text', sizeKb: 96 },
    ],
    updatedAt: STARTED_AT,
  };
}

function loadStore() {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.documents !== 'object' || parsed.documents === null) {
      throw new Error('malformed store');
    }
    if (!Array.isArray(parsed.changes)) parsed.changes = [];
    if (!Array.isArray(parsed.catalog)) parsed.catalog = defaultStore().catalog;
    if (!parsed.cloudCursors) parsed.cloudCursors = { pushed: 0, pulled: 0 };
    if (typeof parsed.documentVersion !== 'number') parsed.documentVersion = parsed.changes.length;
    return parsed;
  } catch (error) {
    return defaultStore();
  }
}

function saveStore(store) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = STORE_FILE + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmp, STORE_FILE);
  } catch (error) {
    console.error('[edge-box] failed to persist store:', error.message);
  }
}

function lastSeq(store) {
  return store.changes.length > 0 ? store.changes[store.changes.length - 1].seq : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsePointer(pointer) {
  if (pointer === '') return [];
  if (typeof pointer !== 'string' || pointer.charAt(0) !== '/') {
    throw new Error('invalid JSON pointer: ' + String(pointer));
  }
  return pointer
    .slice(1)
    .split('/')
    .map(function (token) {
      return token.replace(/~1/g, '/').replace(/~0/g, '~');
    });
}

function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone);
  if (isPlainObject(value)) {
    const copy = {};
    for (const key of Object.keys(value)) copy[key] = deepClone(value[key]);
    return copy;
  }
  return value;
}

function validateOp(op) {
  if (!isPlainObject(op)) return false;
  if (['add', 'remove', 'replace'].indexOf(op.op) === -1) return false;
  if (typeof op.path !== 'string') return false;
  if (op.op !== 'remove' && !('value' in op)) return false;
  return true;
}

function applyOps(documents, ops) {
  let doc = deepClone(documents);
  for (const op of ops) {
    if (!validateOp(op)) throw new Error('invalid patch op');
    const tokens = parsePointer(op.path);
    if (tokens.length === 0) {
      if (op.op === 'remove') throw new Error('cannot remove root');
      doc = deepClone(op.value);
      continue;
    }
    let parent = doc;
    for (let i = 0; i < tokens.length - 1; i += 1) {
      const token = tokens[i];
      if (Array.isArray(parent)) {
        const index = Number(token);
        if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
          throw new Error('array index out of range: ' + token);
        }
        parent = parent[index];
      } else if (isPlainObject(parent)) {
        if (!Object.prototype.hasOwnProperty.call(parent, token)) {
          throw new Error('missing path segment: ' + token);
        }
        parent = parent[token];
      } else {
        throw new Error('cannot traverse into scalar');
      }
    }
    const key = tokens[tokens.length - 1];
    if (Array.isArray(parent)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0) throw new Error('invalid array index: ' + key);
      if (op.op === 'add') {
        if (index > parent.length) throw new Error('array insert index out of range');
        parent.splice(index, 0, deepClone(op.value));
      } else if (op.op === 'remove') {
        if (index >= parent.length) throw new Error('array index out of range');
        parent.splice(index, 1);
      } else {
        if (index >= parent.length) throw new Error('array index out of range');
        parent[index] = deepClone(op.value);
      }
      continue;
    }
    if (!isPlainObject(parent)) throw new Error('patch parent must be object or array');
    const exists = Object.prototype.hasOwnProperty.call(parent, key);
    if (op.op === 'remove') {
      if (!exists) throw new Error('missing key: ' + op.path);
      delete parent[key];
    } else if (op.op === 'replace' && !exists) {
      throw new Error('missing key: ' + op.path);
    } else {
      parent[key] = deepClone(op.value);
    }
  }
  return doc;
}

function isAuthorized(req) {
  if (!AUTH_TOKEN) return true;
  const header = req.headers['authorization'];
  if (typeof header !== 'string') return false;
  const provided = Buffer.from(header, 'utf8');
  const expected = Buffer.from('Bearer ' + AUTH_TOKEN, 'utf8');
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

function sendJson(res, status, payload, method) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  if (method === 'HEAD') res.end();
  else res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const error = new Error('payload too large');
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function handleHealth(res, method) {
  const store = loadStore();
  sendJson(
    res,
    200,
    {
      status: 'ok',
      service: 'grade-glow-edge-box',
      edgeId: EDGE_ID,
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
      documentVersion: store.documentVersion,
      lastCursor: lastSeq(store),
      changeCount: store.changes.length,
      activeConnections: activeConnections,
      authRequired: Boolean(AUTH_TOKEN),
      staticReady: fs.existsSync(path.join(STATIC_DIR, 'index.html')),
      cloud: {
        configured: Boolean(CLOUD_URL),
        intervalMs: SYNC_INTERVAL_MS,
        pushedCursor: store.cloudCursors.pushed,
        pulledCursor: store.cloudCursors.pulled,
        lastAttemptAt: cloudState.lastAttemptAt,
        lastError: cloudState.lastError,
      },
    },
    method
  );
}

function handleGetChanges(url, res, method) {
  const store = loadStore();
  const sinceRaw = parseInt(url.searchParams.get('since') || '0', 10);
  const limitRaw = parseInt(url.searchParams.get('limit') || '200', 10);
  const since = Number.isFinite(sinceRaw) && sinceRaw >= 0 ? sinceRaw : 0;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;
  const tail = store.changes.filter(function (change) {
    return change.seq > since;
  });
  const changes = tail.slice(0, limit);
  const nextCursor = changes.length > 0 ? changes[changes.length - 1].seq : since;
  sendJson(
    res,
    200,
    {
      changes: changes,
      nextCursor: nextCursor,
      hasMore: lastSeq(store) > nextCursor,
      documentVersion: store.documentVersion,
    },
    method
  );
}

async function handlePostChanges(req, res, method) {
  const raw = await readBody(req);
  let body;
  try {
    body = JSON.parse(raw);
  } catch (error) {
    sendJson(res, 400, { error: 'invalid_json' }, method);
    return;
  }
  if (!body || !Array.isArray(body.ops)) {
    sendJson(res, 422, { error: 'ops_array_required' }, method);
    return;
  }
  for (const op of body.ops) {
    if (!validateOp(op)) {
      sendJson(res, 422, { error: 'invalid_patch_op' }, method);
      return;
    }
  }
  const store = loadStore();
  let nextDocs;
  try {
    nextDocs = applyOps(store.documents, body.ops);
  } catch (error) {
    sendJson(
      res,
      422,
      { error: 'patch_apply_failed', message: error.message, cursor: lastSeq(store) },
      method
    );
    return;
  }
  store.documents = nextDocs;
  store.documentVersion += 1;
  const seq = lastSeq(store) + 1;
  store.changes.push({
    seq: seq,
    at: Date.now(),
    origin: typeof body.origin === 'string' && body.origin ? body.origin : 'client',
    ops: body.ops,
  });
  if (store.changes.length > MAX_CHANGES) {
    store.changes.splice(0, store.changes.length - MAX_CHANGES);
  }
  store.updatedAt = Date.now();
  saveStore(store);
  sendJson(
    res,
    200,
    { applied: body.ops.length, cursor: seq, documentVersion: store.documentVersion },
    method
  );
}

function handleCatalog(res, method) {
  const store = loadStore();
  sendJson(
    res,
    200,
    { items: store.catalog, documentVersion: store.documentVersion, generatedAt: store.updatedAt },
    method
  );
}

function resolveStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (error) {
    return null;
  }
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.resolve(STATIC_DIR, '.' + path.sep + normalized);
  if (fullPath !== STATIC_DIR && !fullPath.startsWith(STATIC_DIR + path.sep)) return null;
  return fullPath;
}

function serveStatic(req, res, pathname, method) {
  const target = resolveStaticPath(pathname === '/' ? '/index.html' : pathname);
  if (!target) {
    sendJson(res, 403, { error: 'forbidden_path' }, method);
    return;
  }
  let filePath = target;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    const shell = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(shell)) {
      filePath = shell;
    } else {
      const placeholder =
        '<!doctype html><meta charset="utf-8"><title>GradeGlow Edge Box</title>' +
        '<body style="font-family:system-ui;padding:2rem"><h1>School Mesh Box is online</h1>' +
        '<p>The GradeGlow SPA bundle was not copied into this image. Run <code>npm run build</code> ' +
        'on the repository root so <code>dist/</code> exists, then rebuild the image.</p>' +
        '<p>API status: <a href="/api/health">/api/health</a></p></body>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(method === 'HEAD' ? undefined : placeholder);
      return;
    }
  }
  const stats = fs.statSync(filePath);
  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=86400',
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function httpJson(method, target, payload) {
  return new Promise(function (resolve, reject) {
    let parsed;
    try {
      parsed = new URL(target);
    } catch (error) {
      reject(new Error('invalid cloud url'));
      return;
    }
    if (parsed.protocol !== 'http:') {
      reject(new Error('built-in syncer supports http:// cloud relays only'));
      return;
    }
    const headers = { 'Content-Type': 'application/json' };
    if (CLOUD_TOKEN) headers['Authorization'] = 'Bearer ' + CLOUD_TOKEN;
    const bodyText = payload === undefined ? null : JSON.stringify(payload);
    if (bodyText) headers['Content-Length'] = Buffer.byteLength(bodyText);
    const request = http.request(
      parsed,
      { method: method, headers: headers },
      function (response) {
        const chunks = [];
        response.on('data', function (chunk) {
          chunks.push(chunk);
        });
        response.on('end', function () {
          const text = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = JSON.parse(text);
          } catch (error) {
            data = null;
          }
          if (response.statusCode >= 400) {
            reject(new Error('cloud responded ' + response.statusCode));
          } else {
            resolve(data);
          }
        });
      }
    );
    request.on('error', reject);
    if (bodyText) request.write(bodyText);
    request.end();
  });
}

async function opportunisticSyncTick() {
  if (!CLOUD_URL || SYNC_INTERVAL_MS <= 0) return;
  cloudState.lastAttemptAt = Date.now();
  try {
    const store = loadStore();
    const last = lastSeq(store);
    const pending = store.changes.filter(function (change) {
      return change.seq > store.cloudCursors.pushed && change.origin !== 'cloud';
    });
    if (pending.length > 0) {
      const ops = [];
      for (const change of pending) {
        for (const op of change.ops) ops.push(op);
      }
      await httpJson('POST', CLOUD_URL + '/api/sync/changes', {
        origin: 'edge:' + EDGE_ID,
        ops: ops,
      });
    }
    store.cloudCursors.pushed = Math.max(store.cloudCursors.pushed, last);

    const feed = await httpJson('GET', CLOUD_URL + '/api/sync/changes?since=' + store.cloudCursors.pulled);
    if (feed && Array.isArray(feed.changes)) {
      const remoteOps = [];
      for (const change of feed.changes) {
        if (change.origin === 'edge:' + EDGE_ID) continue;
        if (Array.isArray(change.ops)) {
          for (const op of change.ops) remoteOps.push(op);
        }
      }
      if (remoteOps.length > 0) {
        store.documents = applyOps(store.documents, remoteOps);
        store.documentVersion += 1;
        store.changes.push({
          seq: lastSeq(store) + 1,
          at: Date.now(),
          origin: 'cloud',
          ops: remoteOps,
        });
        if (store.changes.length > MAX_CHANGES) {
          store.changes.splice(0, store.changes.length - MAX_CHANGES);
        }
      }
      if (typeof feed.nextCursor === 'number') {
        store.cloudCursors.pulled = Math.max(store.cloudCursors.pulled, feed.nextCursor);
      }
    }
    store.updatedAt = Date.now();
    saveStore(store);
    cloudState.lastError = null;
  } catch (error) {
    cloudState.lastError = error && error.message ? error.message : String(error);
  }
}

const server = http.createServer(async function (req, res) {
  const method = req.method || 'GET';
  let url;
  try {
    url = new URL(req.url || '/', 'http://localhost');
  } catch (error) {
    sendJson(res, 400, { error: 'bad_request' }, method);
    return;
  }

  try {
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      res.end();
      return;
    }

    if (url.pathname === '/api/health') {
      if (method !== 'GET' && method !== 'HEAD') {
        sendJson(res, 405, { error: 'method_not_allowed' }, method);
        return;
      }
      handleHealth(res, method);
      return;
    }

    if (url.pathname.indexOf('/api/') === 0) {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { error: 'unauthorized' }, method);
        return;
      }
      if (url.pathname === '/api/sync/changes' && method === 'GET') {
        handleGetChanges(url, res, method);
        return;
      }
      if (url.pathname === '/api/sync/changes' && method === 'POST') {
        await handlePostChanges(req, res, method);
        return;
      }
      if (url.pathname === '/api/catalog' && method === 'GET') {
        handleCatalog(res, method);
        return;
      }
      sendJson(res, 404, { error: 'not_found' }, method);
      return;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      sendJson(res, 405, { error: 'method_not_allowed' }, method);
      return;
    }
    serveStatic(req, res, url.pathname, method);
  } catch (error) {
    const status = error && error.status ? error.status : 500;
    if (!res.headersSent) {
      sendJson(res, status, { error: error && error.message ? error.message : 'internal_error' }, method);
    } else {
      res.end();
    }
  }
});

server.on('connection', function (socket) {
  activeConnections += 1;
  socket.on('close', function () {
    activeConnections = Math.max(0, activeConnections - 1);
  });
});

loadStore();

server.listen(PORT, HOST, function () {
  console.log('[edge-box] School Mesh Box listening on http://' + HOST + ':' + PORT);
  console.log('[edge-box] static dir: ' + STATIC_DIR + (fs.existsSync(path.join(STATIC_DIR, 'index.html')) ? ' (SPA ready)' : ' (placeholder mode)'));
  console.log('[edge-box] auth: ' + (AUTH_TOKEN ? 'bearer token required' : 'open LAN mode'));
  if (CLOUD_URL && SYNC_INTERVAL_MS > 0) {
    console.log('[edge-box] opportunistic cloud sync → ' + CLOUD_URL + ' every ' + SYNC_INTERVAL_MS + 'ms');
    setInterval(opportunisticSyncTick, SYNC_INTERVAL_MS);
    opportunisticSyncTick();
  } else {
    console.log('[edge-box] opportunistic cloud sync disabled (EDGE_CLOUD_URL / EDGE_SYNC_INTERVAL_MS unset)');
  }
});

function shutdown() {
  console.log('[edge-box] shutting down');
  server.close(function () {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
