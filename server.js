/**
 * Puvi Website Backend
 * --------------------
 * Lightweight Express API powering:
 *   - POST /api/playground/run   -> real server-side lex/keyword-resolution for the Try It playground
 *   - POST /api/contact          -> contact form submissions (saved to data/contacts.json)
 *   - POST /api/newsletter       -> email signups (saved to data/subscribers.json)
 *   - GET  /api/stats            -> basic public counters (subscribers, contacts, uptime)
 *   - GET  /api/team             -> team roster (used to keep frontend/backend in sync)
 *   - GET  /api/health           -> health check
 *
 * Run:
 *   cd backend
 *   npm install
 *   npm start
 * Server listens on PORT (default 4000). Update the frontend's API_BASE in index.html
 * if you deploy this somewhere other than http://localhost:4000.
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// ---------- simple JSON file storage ----------
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const f of ['contacts.json', 'subscribers.json']) {
    const p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf8');
  }
}
function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf8');
}
ensureDataDir();

// ---------- team roster (kept in sync with the frontend's #team section) ----------
const TEAM = [
  { name: 'Anbuselva Y', role: 'Founder · Compiler Lead' },
  { name: 'Kaviyarasu R', role: 'Frontend Developer' },
  { name: 'Compiler Team', role: 'Open roles' },
  { name: 'Community', role: 'Open roles' },
];

// ---------- Puvi keyword table (mirrors the in-browser simulator) ----------
const KEYWORDS = {
  mathippu: 'let', let: 'let', 'மதிப்பு': 'let',
  endraal: 'if', if: 'if', 'என்றால்': 'if',
  mudivu: 'end', end: 'end', 'முடிவு': 'end',
  sol: 'print', print: 'print', 'சொல்': 'print',
};

function lexAndResolve(source) {
  const lines = String(source || '')
    .split('\n')
    .filter((l) => l.trim().length);

  let tokenCount = 0;
  const resolved = new Set();

  for (const line of lines) {
    const words = line.trim().split(/\s+/);
    tokenCount += words.length;
    for (const w of words) {
      const clean = w.replace(/[(),]/g, '');
      if (KEYWORDS[clean]) resolved.add(`${clean} → ${KEYWORDS[clean]}`);
    }
  }

  return {
    lineCount: lines.length,
    tokenCount,
    resolvedKeywords: Array.from(resolved),
    ast: { type: 'Program', statements: lines.length },
    diagnostics: [],
    note: 'Full execution ships with the v0.2 in-browser/server interpreter.',
  };
}

// ---------- routes ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptimeSeconds: process.uptime() });
});

app.get('/api/team', (_req, res) => {
  res.json(TEAM);
});

app.post('/api/playground/run', (req, res) => {
  const { source } = req.body || {};
  if (typeof source !== 'string' || !source.trim()) {
    return res.status(400).json({ error: 'Provide a non-empty "source" string.' });
  }
  res.json(lexAndResolve(source));
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required.' });
  }
  const contacts = readJSON('contacts.json');
  contacts.push({ name, email, message, receivedAt: new Date().toISOString() });
  writeJSON('contacts.json', contacts);
  res.status(201).json({ ok: true });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  const subscribers = readJSON('subscribers.json');
  if (!subscribers.includes(email)) {
    subscribers.push(email);
    writeJSON('subscribers.json', subscribers);
  }
  res.status(201).json({ ok: true, totalSubscribers: subscribers.length });
});

app.get('/api/stats', (_req, res) => {
  const contacts = readJSON('contacts.json');
  const subscribers = readJSON('subscribers.json');
  res.json({
    contacts: contacts.length,
    subscribers: subscribers.length,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.listen(PORT, () => {
  console.log(`Puvi backend listening on http://localhost:${PORT}`);
});
