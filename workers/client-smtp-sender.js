/**
 * TIBERIUS RECON™ — CLIENT-OWNED EMAIL (NATIVE HANDOFF + SHOP SMTP) & ENCRYPTION ENGINE
 * (workers/client-smtp-sender.js)
 *
 * Ensures 0% of client cold/permit outreach ever touches Tiberius AI's Resend account:
 *   - Tier A (Day-1 Default, Zero Setup): Builds `mailto:`, Gmail Web Compose, and Outlook Web
 *     Compose handoff URLs so contractors send from their own email app in 1 tap.
 *   - Tier B (Optional 1-Tap Background Send): Zero-dependency RFC-5321/5322 SMTP client
 *     (`node:net` + `node:tls`) supporting Implicit TLS (465) and STARTTLS (587) so contractors
 *     who connect their own Gmail / M365 / cPanel App Password send 1-tap from their own mailbox.
 */

const net = require('node:net');
const tls = require('node:tls');
const crypto = require('node:crypto');

const SMTP_PROVIDER_PRESETS = {
  gmail: {
    label: 'Gmail / Google Workspace (App Password)',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true
  },
  m365: {
    label: 'Microsoft 365 / Outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: false
  },
  privateemail: {
    label: 'Namecheap PrivateEmail',
    host: 'mail.privateemail.com',
    port: 465,
    secure: true
  },
  yahoo: {
    label: 'Yahoo Business / Mail',
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true
  },
  zoho: {
    label: 'Zoho Mail',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true
  },
  custom: {
    label: 'Custom Domain / cPanel SMTP',
    host: '',
    port: 465,
    secure: true
  }
};

function getEncryptionKey() {
  const rawSecret =
    process.env.RECON_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    'tiberius-recon-client-smtp-vault-key-2026';
  return crypto.createHash('sha256').update(String(rawSecret)).digest();
}

function encryptSmtpSecret(plainText) {
  const clean = String(plainText || '').trim();
  if (!clean) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptSmtpSecret(cipherPayload) {
  const raw = String(cipherPayload || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('v1:')) return raw;
  try {
    const [, ivB64, tagB64, dataB64] = raw.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivB64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch (_err) {
    return '';
  }
}

function resolveSmtpPresetDefaults(preset = 'gmail', customHost = '', customPort = 0) {
  const key = String(preset || 'custom').toLowerCase();
  const base = SMTP_PROVIDER_PRESETS[key] || SMTP_PROVIDER_PRESETS.custom;
  const host = String(customHost || base.host || '').trim();
  const port = Number(customPort) > 0 ? Number(customPort) : base.port;
  const secure = port === 465;
  return {
    providerPreset: SMTP_PROVIDER_PRESETS[key] ? key : 'custom',
    host,
    port,
    secure
  };
}

function sanitizeClientEmailConfig(rawConfig = {}, fallbackWorkEmail = '') {
  const cfg = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  const mode = cfg.mode === 'CLIENT_SMTP' ? 'CLIENT_SMTP' : 'NATIVE_APP';
  const preferredComposeTarget = ['MAILTO', 'GMAIL_WEB', 'OUTLOOK_WEB'].includes(
    cfg.preferredComposeTarget
  )
    ? cfg.preferredComposeTarget
    : 'MAILTO';
  const resolved = resolveSmtpPresetDefaults(cfg.providerPreset, cfg.smtpHost, cfg.smtpPort);
  const hasSmtpPassword = Boolean(cfg.smtpPassEncrypted || cfg.smtpPass);

  return {
    mode,
    preferredComposeTarget,
    providerPreset: resolved.providerPreset,
    smtpHost: resolved.host,
    smtpPort: resolved.port,
    smtpUser: String(cfg.smtpUser || fallbackWorkEmail || '').trim(),
    fromEmail: String(cfg.fromEmail || cfg.smtpUser || fallbackWorkEmail || '').trim(),
    hasSmtpPassword,
    isSmtpReady: Boolean(mode === 'CLIENT_SMTP' && resolved.host && (cfg.smtpUser || fallbackWorkEmail) && hasSmtpPassword)
  };
}

/**
 * Builds Day-1 Zero-Setup Handoff URLs for Native Mail (`mailto:`), Gmail Web, and Outlook Web.
 */
function buildClientMailHandoffLinks({
  toEmail = '',
  subject = '',
  bodyText = '',
  bccEmail = '',
  preferredComposeTarget = 'MAILTO'
} = {}) {
  const cleanTo = String(toEmail || '').trim();
  const cleanSubj = String(subject || '').trim();
  const cleanBody = String(bodyText || '').trim();
  const cleanBcc = String(bccEmail || '').trim();

  const mailtoParams = [];
  if (cleanSubj) mailtoParams.push(`subject=${encodeURIComponent(cleanSubj)}`);
  if (cleanBody) mailtoParams.push(`body=${encodeURIComponent(cleanBody)}`);
  if (cleanBcc) mailtoParams.push(`bcc=${encodeURIComponent(cleanBcc)}`);
  const mailtoUri = `mailto:${encodeURIComponent(cleanTo)}${
    mailtoParams.length ? `?${mailtoParams.join('&')}` : ''
  }`;

  const gmailParams = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: cleanTo,
    su: cleanSubj,
    body: cleanBody
  });
  if (cleanBcc) gmailParams.set('bcc', cleanBcc);
  const gmailWebUri = `https://mail.google.com/mail/?${gmailParams.toString()}`;

  const outlookParams = new URLSearchParams({
    to: cleanTo,
    subject: cleanSubj,
    body: cleanBody
  });
  if (cleanBcc) outlookParams.set('bcc', cleanBcc);
  const outlookWebUri = `https://outlook.office.com/mail/deeplink/compose?${outlookParams.toString()}`;

  let preferredComposeUri = mailtoUri;
  if (preferredComposeTarget === 'GMAIL_WEB') preferredComposeUri = gmailWebUri;
  if (preferredComposeTarget === 'OUTLOOK_WEB') preferredComposeUri = outlookWebUri;

  return {
    mailtoUri,
    gmailWebUri,
    outlookWebUri,
    preferredComposeTarget,
    preferredComposeUri
  };
}

function sanitizeHeaderValue(val = '') {
  return String(val || '').replace(/[\r\n]+/g, ' ').trim();
}

function createSmtpLineReader(socket) {
  let buffer = '';
  let pendingResolve = null;
  let pendingReject = null;
  let currentLines = [];

  const onData = (chunk) => {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const rawLine = buffer.slice(0, idx).replace(/\r$/, '');
      buffer = buffer.slice(idx + 1);
      currentLines.push(rawLine);
      if (/^\d{3}(\s|$)/.test(rawLine)) {
        const code = Number(rawLine.slice(0, 3));
        const fullText = currentLines.join('\n');
        currentLines = [];
        if (pendingResolve) {
          const r = pendingResolve;
          pendingResolve = null;
          pendingReject = null;
          r({ code, text: fullText });
        }
      }
    }
  };

  const onError = (err) => {
    if (pendingReject) {
      const rej = pendingReject;
      pendingResolve = null;
      pendingReject = null;
      rej(err);
    }
  };

  socket.on('data', onData);
  socket.on('error', onError);

  return {
    readResponse(timeoutMs = 8000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingResolve = null;
          pendingReject = null;
          reject(new Error('SMTP response timed out'));
        }, timeoutMs);
        pendingResolve = (res) => {
          clearTimeout(timer);
          resolve(res);
        };
        pendingReject = (err) => {
          clearTimeout(timer);
          reject(err);
        };
      });
    },
    detach() {
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
    }
  };
}

/**
 * Sends an RFC-5322 plain-text email directly through the contractor's own SMTP server.
 */
async function sendViaClientSmtp({
  smtpHost,
  smtpPort = 465,
  smtpUser,
  smtpPass,
  fromName = '',
  fromEmail = '',
  toEmail = '',
  replyToAddresses = [],
  subject = '',
  bodyText = '',
  headers = {}
} = {}) {
  const host = String(smtpHost || '').trim();
  const port = Number(smtpPort) || 465;
  const user = String(smtpUser || '').trim();
  const pass = String(smtpPass || '').trim();
  const senderAddr = String(fromEmail || user).trim();
  const recipientAddr = String(toEmail || '').trim();

  if (!host || !user || !pass || !senderAddr || !recipientAddr) {
    return {
      ok: false,
      error: 'Missing client SMTP host, login email, App Password, or recipient address.'
    };
  }

  const isLocalLoopback = host === '127.0.0.1' || host === 'localhost';
  const implicitTls = port === 465;

  let socket = null;
  try {
    socket = await new Promise((resolve, reject) => {
      const conn = implicitTls
        ? tls.connect({ host, port, servername: host }, () => resolve(conn))
        : net.connect({ host, port }, () => resolve(conn));
      conn.setTimeout(9000, () => {
        conn.destroy(new Error('SMTP socket timeout'));
      });
      conn.once('error', reject);
    });

    let reader = createSmtpLineReader(socket);
    const sendCmd = async (cmd, expectedPrefix = [2, 3]) => {
      socket.write(`${cmd}\r\n`);
      const resp = await reader.readResponse();
      const firstDigit = Math.floor(resp.code / 100);
      if (!expectedPrefix.includes(firstDigit)) {
        throw new Error(`SMTP error (${resp.code}): ${resp.text}`);
      }
      return resp;
    };

    const greeting = await reader.readResponse();
    if (Math.floor(greeting.code / 100) !== 2) {
      throw new Error(`SMTP greeting rejected (${greeting.code}): ${greeting.text}`);
    }

    let ehloResp = await sendCmd('EHLO tiberius-client-dispatch.local');

    if (!implicitTls) {
      const supportsStartTls = /STARTTLS/i.test(ehloResp.text);
      if (supportsStartTls) {
        await sendCmd('STARTTLS', [2]);
        reader.detach();
        socket = await new Promise((resolve, reject) => {
          const upgraded = tls.connect({ socket, servername: host }, () => resolve(upgraded));
          upgraded.once('error', reject);
        });
        reader = createSmtpLineReader(socket);
        ehloResp = await sendCmd('EHLO tiberius-client-dispatch.local');
      } else if (!isLocalLoopback) {
        throw new Error('Remote SMTP server does not advertise STARTTLS on non-465 port.');
      }
    }

    // Authenticate via AUTH PLAIN (with fallback to AUTH LOGIN)
    const authPlainToken = Buffer.from(`\u0000${user}\u0000${pass}`, 'utf8').toString('base64');
    try {
      await sendCmd(`AUTH PLAIN ${authPlainToken}`, [2]);
    } catch (_authErr) {
      await sendCmd('AUTH LOGIN', [3]);
      await sendCmd(Buffer.from(user, 'utf8').toString('base64'), [3]);
      await sendCmd(Buffer.from(pass, 'utf8').toString('base64'), [2]);
    }

    await sendCmd(`MAIL FROM:<${senderAddr}>`, [2]);
    await sendCmd(`RCPT TO:<${recipientAddr}>`, [2]);
    await sendCmd('DATA', [3]);

    const messageId = `<recon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@${
      senderAddr.split('@')[1] || 'client.local'
    }>`;
    const displayFrom = fromName
      ? `"${sanitizeHeaderValue(fromName).replace(/"/g, '')}" <${senderAddr}>`
      : `<${senderAddr}>`;
    const cleanReplyTos = (Array.isArray(replyToAddresses) ? replyToAddresses : [])
      .map((a) => sanitizeHeaderValue(a))
      .filter(Boolean);

    const headerLines = [
      `From: ${displayFrom}`,
      `To: <${sanitizeHeaderValue(recipientAddr)}>`,
      cleanReplyTos.length ? `Reply-To: ${cleanReplyTos.join(', ')}` : null,
      `Subject: ${sanitizeHeaderValue(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit'
    ].filter(Boolean);

    for (const [hKey, hVal] of Object.entries(headers || {})) {
      if (hVal !== undefined && hVal !== null) {
        headerLines.push(`${sanitizeHeaderValue(hKey)}: ${sanitizeHeaderValue(hVal)}`);
      }
    }

    // RFC-5321 dot-stuffing
    const normalizedBody = String(bodyText || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => (line.startsWith('.') ? `.${line}` : line))
      .join('\r\n');

    const rawMime = `${headerLines.join('\r\n')}\r\n\r\n${normalizedBody}\r\n.`;
    const dataResp = await sendCmd(rawMime, [2]);

    try {
      await sendCmd('QUIT', [2]);
    } catch (_) {}
    socket.end();

    return {
      ok: true,
      provider: 'CLIENT_SMTP_LIVE',
      deliveryStatus: 'SENT_VIA_CLIENT_OWN_SMTP',
      messageId,
      smtpResponse: dataResp.text,
      from: displayFrom,
      to: recipientAddr,
      dispatchedAt: new Date().toISOString()
    };
  } catch (err) {
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
    return {
      ok: false,
      provider: 'CLIENT_SMTP_ERROR',
      error: err.message
    };
  }
}

module.exports = {
  SMTP_PROVIDER_PRESETS,
  encryptSmtpSecret,
  decryptSmtpSecret,
  resolveSmtpPresetDefaults,
  sanitizeClientEmailConfig,
  buildClientMailHandoffLinks,
  sendViaClientSmtp
};
