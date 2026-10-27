/**
 * TIBERIUS RECON™ — CRYPTOGRAPHIC MULTI-CLIENT AUTH & SESSION ENGINE (db/auth.js)
 *
 * Provides:
 * 1. Native Node `scrypt` password/PIN hashing & constant-time verification (`timingSafeEqual`).
 * 2. Stateless HMAC-SHA256 signed JWT session tokens (`tiberius_recon_session`) that survive
 *    Vercel Serverless cold starts and enforce strict multi-tenant account isolation.
 * 3. Role-based access control (`CONTRACTOR` vs. `ADMIN` Master Agency Command).
 */

const crypto = require('crypto');

const AUTH_SECRET =
  process.env.RECON_AUTH_SECRET || 'tiberius-recon-enterprise-hmac-secret-2026-v1';
const COOKIE_NAME = 'tiberius_recon_session';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecodeToString(input) {
  let str = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (str.length % 4 !== 0) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Hashes a plaintext password or PIN using Node's native `crypto.scryptSync`.
 */
function hashPassword(password, providedSalt) {
  const clean = String(password || '').trim();
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifies a plaintext password or PIN against a `salt:hash` string in constant time.
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !String(storedHash).includes(':')) {
    return false;
  }
  const [salt, keyHex] = String(storedHash).split(':');
  const derivedHex = crypto.scryptSync(String(password).trim(), salt, 32).toString('hex');
  const a = Buffer.from(keyHex, 'hex');
  const b = Buffer.from(derivedHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Signs a stateless 30-day HMAC-SHA256 session token (JWT).
 */
function signSessionToken(claims = {}) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    ...claims,
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', AUTH_SECRET).update(signingInput).digest()
  );

  return `${signingInput}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 session token and returns the decoded claims (or null if invalid/expired).
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, providedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', AUTH_SECRET).update(signingInput).digest()
  );

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecodeToString(encodedPayload));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return null;
    }
    return payload;
  } catch (_err) {
    return null;
  }
}

/**
 * Parses HTTP Cookie header into key-value pairs.
 */
function parseCookies(req) {
  const raw = (req && req.headers && req.headers.cookie) || '';
  const out = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

/**
 * Extracts and verifies the active session from Authorization header, X-Recon-Session header, or Cookie.
 */
function extractSessionFromRequest(req) {
  if (!req || !req.headers) return null;

  let rawToken = null;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice('Bearer '.length).trim();
  }
  if (!rawToken && req.headers['x-recon-session']) {
    rawToken = String(req.headers['x-recon-session']).trim();
  }
  if (!rawToken) {
    const cookies = parseCookies(req);
    if (cookies[COOKIE_NAME]) {
      rawToken = cookies[COOKIE_NAME];
    }
  }

  return verifySessionToken(rawToken);
}

/**
 * Sets the HttpOnly session cookie on the response.
 */
function setSessionCookie(res, token) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax; HttpOnly`
  );
}

/**
 * Clears the session cookie on logout.
 */
function clearSessionCookie(res) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
  );
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  extractSessionFromRequest,
  setSessionCookie,
  clearSessionCookie
};
