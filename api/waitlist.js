const dns = require('node:dns').promises;
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const WINDOW_MS = 60 * 60 * 1000;
const DAILY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_PER_DAY = 20;
const MAX_BODY_BYTES = 10 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const buckets = new Map();
let db;

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function getOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function sameOrigin(req) {
  const origin = getOrigin(req);
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return origin === `${proto}://${host}`;
}

function maskIp(ip) {
  if (!ip || ip === 'unknown') return ip;
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 2).join(':')}:*`;
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  return 'masked';
}

function cleanupBucket(list, now) {
  return list.filter((ts) => now - ts < DAILY_MS);
}

async function readBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      const err = new Error('Body too large');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function validateEmail(email) {
  if (!EMAIL_RE.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;
  try {
    const mx = await dns.resolveMx(domain);
    if (mx && mx.length) return true;
  } catch {}
  try {
    const a = await dns.resolve4(domain);
    if (a && a.length) return true;
  } catch {}
  try {
    const aaaa = await dns.resolve6(domain);
    if (aaaa && aaaa.length) return true;
  } catch {}
  return false;
}

function getFirebaseDb() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let serviceAccount = null;

  if (rawServiceAccount) {
    try {
      serviceAccount = JSON.parse(rawServiceAccount);
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id || serviceAccount?.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || serviceAccount?.client_email || serviceAccount?.clientEmail;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || serviceAccount?.private_key || serviceAccount?.privateKey;
  if (!projectId || !clientEmail || !privateKey) return null;
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  if (!db) db = getFirestore();
  return db;
}

async function persistLocally(entry) {
  const dir = path.join(process.cwd(), '.data');
  const file = path.join(dir, 'waitlist.json');
  await fs.mkdir(dir, { recursive: true });
  let items = [];
  try {
    items = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }
  items.push(entry);
  await fs.writeFile(file, JSON.stringify(items, null, 2), 'utf8');
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed' });
    }

    if (!sameOrigin(req)) {
      return json(res, 403, { error: 'Origin rejected' });
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const bucket = cleanupBucket(buckets.get(ip) || [], now);
    const recentWindow = bucket.filter((ts) => now - ts < WINDOW_MS);
    if (recentWindow.length >= MAX_PER_WINDOW || bucket.length >= MAX_PER_DAY) {
      buckets.set(ip, bucket);
      res.setHeader('Retry-After', '3600');
      return json(res, 429, { error: 'Too many requests. Please wait and try again.' });
    }

    let body;
    try {
      body = await readBody(req);
    } catch (err) {
      return json(res, err.statusCode || 400, { error: 'Invalid JSON payload' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const company = String(body.company || '').trim().slice(0, 120);
    const source = String(body.source || 'landing').slice(0, 64);
    const page = String(body.page || '/').slice(0, 128);
    const notifyEmail = String(process.env.NOTIFY_EMAIL || '').trim().toLowerCase();
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 160);

    if (company) {
      buckets.set(ip, bucket.concat(now));
      return json(res, 200, { ok: true, message: 'Received.' });
    }

    if (!email || !(await validateEmail(email))) {
      return json(res, 400, { error: 'Enter a valid deliverable email address.' });
    }

    buckets.set(ip, bucket.concat(now));

    const entry = {
      email,
      company,
      source,
      page,
      createdAt: new Date(now).toISOString(),
      ipHash: crypto.createHash('sha256').update(maskIp(ip)).digest('hex'),
      userAgent,
    };

    const firebase = getFirebaseDb();
    if (firebase) {
      const waitlistRef = firebase.collection('waitlist_entries').doc(email);
      const notificationRef = firebase.collection('mail').doc();
      const batch = firebase.batch();

      batch.set(waitlistRef, {
        email: entry.email,
        company: entry.company,
        source: entry.source,
        page: entry.page,
        ipHash: entry.ipHash,
        userAgent: entry.userAgent,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        status: 'pending',
      }, { merge: true });

      if (notifyEmail) {
        batch.set(notificationRef, {
          to: [notifyEmail],
          message: {
            subject: 'Kascade waitlist signup',
            text: `New waitlist signup: ${entry.email}\nCompany: ${entry.company || '-'}\nSource: ${entry.source}\nPage: ${entry.page}`,
            html: `<p><strong>New waitlist signup</strong></p><p>${entry.email}</p><p>Company: ${entry.company || '-'}</p><p>Source: ${entry.source}</p><p>Page: ${entry.page}</p>`,
          },
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return json(res, 200, {
        ok: true,
        message: 'You are on the list. We will email you when the app is ready.',
      });
    }

    if (process.env.VERCEL_ENV === 'production') {
      const missing = [];
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
        if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!process.env.FIREBASE_PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');
      }
      return json(res, 503, {
        error: missing.length
          ? `Firebase is not configured. Missing: ${missing.join(', ')}.`
          : 'Firebase service account JSON could not be parsed. Check FIREBASE_SERVICE_ACCOUNT_JSON format.',
      });
    }

    try {
      await persistLocally(entry);
    } catch {
      return json(res, 500, { error: 'Could not save waitlist entry.' });
    }

    return json(res, 200, {
      ok: true,
      message: 'You are on the list. We will email you when the app is ready.',
    });
  } catch (err) {
    console.error('waitlist handler error:', err);
    return json(res, 500, { error: 'Waitlist signup failed on the server. Please try again.' });
  }
};
