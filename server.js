/**
 * TIBERIUS RECON™ — VERCEL SERVERLESS & LOCAL HTTP ENTRYPOINT (server.js)
 *
 * Exports a direct `(req, res)` handler function (`module.exports = handleRequest`)
 * so Vercel's Zero-Config Node.js Server runtime invokes it cleanly on every route,
 * while also supporting `node server.js` locally and `{ createReconServer }` in tests.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT_DIR = __dirname;

const availabilityHandler = require('./api/recon/availability');
const activateHandler = require('./api/recon/activate');
const briefingHandler = require('./api/recon/briefing');
const approveHandler = require('./api/recon/approve');
const cronMorningHandler = require('./api/recon/cron-morning');
const liveAgentHandler = require('./api/recon/live-agent');
const cadLookupHandler = require('./api/recon/cad-lookup');

const API_ROUTES = {
  '/api/recon/availability': availabilityHandler,
  '/api/recon/activate': activateHandler,
  '/api/recon/briefing': briefingHandler,
  '/api/recon/approve': approveHandler,
  '/api/recon/cron-morning': cronMorningHandler,
  '/api/recon/live-agent': liveAgentHandler,
  '/api/recon/cad-lookup': cadLookupHandler
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createExpressStyleHelpers(req, res, parsedUrl, bodyObj) {
  req.query = Object.assign({}, req.query || {}, Object.fromEntries(parsedUrl.searchParams.entries()));
  if (bodyObj !== undefined) {
    req.body = bodyObj;
  }

  if (typeof res.status !== 'function') {
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
  }

  if (typeof res.json !== 'function') {
    res.json = function (payload) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string' && req.body.trim()) {
      try {
        return resolve(JSON.parse(req.body));
      } catch (_e) {
        return resolve({});
      }
    }
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return resolve({});
    }
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_err) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  let pathname = parsedUrl.pathname;

  // 1. Handle API routes
  if (API_ROUTES[pathname]) {
    const bodyObj = await readJsonBody(req);
    createExpressStyleHelpers(req, res, parsedUrl, bodyObj);
    try {
      await API_ROUTES[pathname](req, res);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
    return;
  }

  // 2. Normalize /recon/* prefix
  if (pathname === '/recon' || pathname === '/recon/') {
    pathname = '/index.html';
  } else if (pathname.startsWith('/recon/')) {
    pathname = pathname.slice('/recon'.length);
  }

  // 3. Clean URLs mapping
  if (pathname === '/' || pathname === '/index') pathname = '/index.html';
  if (pathname === '/briefing') pathname = '/briefing.html';
  if (pathname === '/command') pathname = '/command.html';

  const relPath = pathname.replace(/^\/+/, '');
  let safeFilePath = path.join(ROOT_DIR, relPath);

  if (!safeFilePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(safeFilePath) && fs.existsSync(`${safeFilePath}.html`)) {
    safeFilePath = `${safeFilePath}.html`;
  }

  if (fs.existsSync(safeFilePath) && fs.statSync(safeFilePath).isFile()) {
    const ext = path.extname(safeFilePath).toLowerCase();
    const content = fs.readFileSync(safeFilePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600'
    });
    res.end(content);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, error: 'Not found', path: pathname }));
}

function createReconServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3080;
  const server = createReconServer();
  server.listen(port, () => {
    console.log(`Tiberius Recon™ server running at http://localhost:${port}`);
  });
}

// Export the (req, res) handler function directly for Vercel Serverless,
// plus attach createReconServer for local test suites.
module.exports = handleRequest;
module.exports.default = handleRequest;
module.exports.createReconServer = createReconServer;
