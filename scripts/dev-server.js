/**
 * TIBERIUS RECON™ — LOCAL DEVELOPMENT & API SERVER (scripts/dev-server.js)
 * Serves static Enterprise Light-Mode pages (/, /briefing, /command)
 * and mounts all /api/recon/* serverless handlers.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT_DIR = path.resolve(__dirname, '..');

const availabilityHandler = require('../api/recon/availability');
const activateHandler = require('../api/recon/activate');
const briefingHandler = require('../api/recon/briefing');
const approveHandler = require('../api/recon/approve');
const cronMorningHandler = require('../api/recon/cron-morning');
const liveAgentHandler = require('../api/recon/live-agent');
const cadLookupHandler = require('../api/recon/cad-lookup');

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
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createExpressStyleHelpers(req, res, parsedUrl, bodyObj) {
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.body = bodyObj;

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (payload) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };
}

function readJsonBody(req) {
  return new Promise((resolve) => {
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
  });
}

function createReconServer() {
  return http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost');
    let pathname = parsedUrl.pathname;

    // Handle API routes
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

    // Normalize /recon/* prefix for local parity
    if (pathname === '/recon' || pathname === '/recon/') {
      pathname = '/index.html';
    } else if (pathname.startsWith('/recon/')) {
      pathname = pathname.slice('/recon'.length);
    }

    if (pathname === '/') pathname = '/index.html';
    if (pathname === '/briefing') pathname = '/briefing.html';
    if (pathname === '/command') pathname = '/command.html';

    const safeFilePath = path.join(ROOT_DIR, pathname.replace(/^\/+/, ''));
    if (!safeFilePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(safeFilePath) && fs.statSync(safeFilePath).isFile()) {
      const ext = path.extname(safeFilePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(safeFilePath).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3080;
  const server = createReconServer();
  server.listen(port, () => {
    console.log(`Tiberius Recon™ server running at http://localhost:${port}`);
  });
}

module.exports = { createReconServer };
