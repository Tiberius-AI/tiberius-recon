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
const authHandler = require('./api/recon/auth');
const adminHandler = require('./api/recon/admin');
const knowledgeHandler = require('./api/recon/knowledge');
const inboxHandler = require('./api/recon/inbox');
const sendHandler = require('./api/recon/send');
const alertsHandler = require('./api/recon/alerts');
const resendWebhookHandler = require('./api/webhooks/resend');
const twilioWebhookHandler = require('./api/webhooks/twilio');

const API_ROUTES = {
  '/api/recon/availability': availabilityHandler,
  '/api/recon/activate': activateHandler,
  '/api/recon/briefing': briefingHandler,
  '/api/recon/approve': approveHandler,
  '/api/recon/cron-morning': cronMorningHandler,
  '/api/recon/live-agent': liveAgentHandler,
  '/api/recon/cad-lookup': cadLookupHandler,
  '/api/recon/auth': authHandler,
  '/api/recon/admin': adminHandler,
  '/api/recon/knowledge': knowledgeHandler,
  '/api/recon/inbox': inboxHandler,
  '/api/recon/send': sendHandler,
  '/api/recon/alerts': alertsHandler,
  '/api/webhooks/resend': resendWebhookHandler,
  '/api/webhooks/twilio': twilioWebhookHandler
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
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Explicit static file references so Vercel's Node File Tracer (@vercel/nft)
// automatically bundles all HTML, CSS, JS, and image assets into the Serverless Function.
const NFT_BUNDLED_FILES = {
  '/index.html': path.join(__dirname, 'index.html'),
  '/briefing.html': path.join(__dirname, 'briefing.html'),
  '/command.html': path.join(__dirname, 'command.html'),
  '/login.html': path.join(__dirname, 'login.html'),
  '/inbox.html': path.join(__dirname, 'inbox.html'),
  '/onboarding.html': path.join(__dirname, 'onboarding.html'),
  '/styles.css': path.join(__dirname, 'styles.css'),
  '/app.js': path.join(__dirname, 'recon-app.js'),
  '/recon-app.js': path.join(__dirname, 'recon-app.js'),
  '/briefing.js': path.join(__dirname, 'briefing.js'),
  '/command.js': path.join(__dirname, 'command.js'),
  '/login.js': path.join(__dirname, 'login.js'),
  '/inbox.js': path.join(__dirname, 'inbox.js'),
  '/onboarding.js': path.join(__dirname, 'onboarding.js'),
  '/images/logo4.png': path.join(__dirname, 'images', 'logo4.png'),
  '/images/tiberius-ai.png': path.join(__dirname, 'images', 'tiberius-ai.png'),
  '/images/tiberius-recon-poster.jpg': path.join(__dirname, 'images', 'tiberius-recon-poster.jpg'),
  '/video/TIBERIUS RECON.mp4': path.join(__dirname, 'video', 'TIBERIUS RECON.mp4')
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
        try {
          resolve(Object.fromEntries(new URLSearchParams(raw).entries()));
        } catch (_e2) {
          resolve({});
        }
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    let pathname = parsedUrl.pathname;
    try {
      pathname = decodeURIComponent(pathname);
    } catch (_e) {
      // Keep raw pathname if malformed URI encoding
    }

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
    if (pathname === '/login' || pathname === '/admin') pathname = '/login.html';
    if (pathname === '/inbox' || pathname === '/conversations') pathname = '/inbox.html';
    if (pathname === '/onboarding' || pathname === '/welcome' || pathname === '/afterpay' || pathname === '/setup') {
      pathname = '/onboarding.html';
    }

    const relPath = pathname.replace(/^\/+/, '');
    let safeFilePath = NFT_BUNDLED_FILES[pathname] || path.join(ROOT_DIR, relPath);

    if (!safeFilePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(safeFilePath) && fs.existsSync(`${safeFilePath}.html`)) {
      safeFilePath = `${safeFilePath}.html`;
    }

    if (fs.existsSync(safeFilePath) && fs.statSync(safeFilePath).isFile()) {
      const stat = fs.statSync(safeFilePath);
      const ext = path.extname(safeFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const noCacheExts = ['.html', '.js', '.css'];

      const rangeHeader = req.headers && req.headers.range;
      if (rangeHeader && (ext === '.mp4' || ext === '.webm' || ext === '.wav' || ext === '.mp3')) {
        const fileSize = stat.size;
        const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : 0;
          const end = match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : fileSize - 1;
          if (start >= fileSize || start > end) {
            res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
            res.end();
            return;
          }
          const chunkSize = end - start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
          });
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          const stream = fs.createReadStream(safeFilePath, { start, end });
          stream.on('error', () => res.end());
          stream.pipe(res);
          return;
        }
      }

      if (ext === '.mp4' || ext === '.webm') {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        const stream = fs.createReadStream(safeFilePath);
        stream.on('error', () => res.end());
        stream.pipe(res);
        return;
      }

      const content = fs.readFileSync(safeFilePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': noCacheExts.includes(ext) ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600'
      });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Not found', path: pathname, rootDir: ROOT_DIR }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
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
