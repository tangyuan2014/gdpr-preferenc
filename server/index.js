const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

// Design notes:
// - This server is a minimal demo implementing GDPR-oriented flows (consent, export, deletion).
// - Storage is a single JSON file at `server/db.json`. This is synchronous and not suitable for production.
// - For production, replace storage with a proper database and add authentication, audit logging, and secure backups.
const DB_PATH = path.join(__dirname, 'db.json');
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// simple JSON file storage helpers (synchronous, fine for demo)
// Simple JSON-file helpers. These are synchronous for simplicity in the demo.
// readDB(): returns an object { users: [...] }
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    // If file doesn't exist or is invalid, start with an empty users array.
    return { users: [] };
  }
}

// writeDB(db): overwrites the JSON file with the provided DB object.
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// generateId(): basic unique id generator for demo purposes
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Append a simple audit log entry for GDPR-related actions.
// Stored at server/audit.log as newline-separated JSON objects.
const AUDIT_PATH = path.join(__dirname, 'audit.log');
function appendAudit(action, userId, req, details = {}) {
  try {
    const entry = {
      ts: new Date().toISOString(),
      action,
      userId: userId || null,
      requester: (req && (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress)) || null,
      details
    };
    fs.appendFileSync(AUDIT_PATH, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    // Swallow audit write errors in demo but log to console for visibility
    console.error('Failed to write audit log', e);
  }
}

// Create user (consent required)
// Create user — consent required. We record consent boolean and the timestamp.
// Expected body: { name?, email, data?, consent }
app.post('/users', (req, res) => {
  const { name, email, data = {}, consent } = req.body;
  if (!consent) return res.status(400).json({ error: 'consent_required' });
  if (!email) return res.status(400).json({ error: 'email_required' });

  const db = readDB();
  const id = generateId();
  // Record consent metadata: timestamp and source (IP or 'web') for auditability.
  const consentTimestamp = new Date().toISOString();
  const consentSource = (req && (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress)) || 'web';
  const user = { id, name: name || null, email, data, consent: !!consent, consentTimestamp, consentSource, createdAt: new Date().toISOString() };
  db.users = db.users || [];
  db.users.push(user);
  writeDB(db);
  // Return the newly created resource id. Do not return entire user in POST response.
  res.status(201).json({ id });
});

// List users (safe: do not expose full personal data here in listing)
// List users — returns limited fields to avoid leaking personal data in listings.
app.get('/users', (req, res) => {
  const db = readDB();
  const list = (db.users || []).map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt }));
  res.json(list);
});

// Get user (full record) - for data export
// Get full user record (data access). In production ensure caller is authorized.
app.get('/users/:id', (req, res) => {
  const db = readDB();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json(user);
});

// Export user data (same as GET /users/:id but endpoint named for GDPR clarity)
// Export endpoint: returns a wrapper useful for data portability requests.
app.get('/users/:id/export', (req, res) => {
  const db = readDB();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  const exported = {
    exportedAt: new Date().toISOString(),
    exportedBy: (req && (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress)) || null,
    user
  };
  // Audit the export action
  appendAudit('export', user.id, req, { exportedAt: exported.exportedAt });
  res.json(exported);
});

// Delete user — implements data erasure
// Delete user — data erasure. This performs physical deletion from the demo DB.
// In production consider soft-delete policies and retention workflows with human reviews.
app.delete('/users/:id', (req, res) => {
  const db = readDB();
  const users = db.users || [];
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  // physical deletion
  users.splice(idx, 1);
  db.users = users;
  writeDB(db);
  // Audit the deletion (who requested it and when)
  appendAudit('delete', req.params.id, req, {});
  res.json({ deleted: true });
});

// Update consent flag
// Update consent flag — record the user's consent status. Caller authorization required in production.
app.post('/users/:id/consent', (req, res) => {
  const { consent } = req.body;
  if (typeof consent !== 'boolean') return res.status(400).json({ error: 'consent_boolean_required' });
  const db = readDB();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  user.consent = consent;
  // update consent timestamp when consent is given or withdrawn
  user.consentTimestamp = new Date().toISOString();
  user.consentSource = (req && (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress)) || user.consentSource || null;
  writeDB(db);
  // Audit consent change
  appendAudit('consent_change', user.id, req, { consent: user.consent, consentTimestamp: user.consentTimestamp });
  res.json({ id: user.id, consent: user.consent, consentTimestamp: user.consentTimestamp });
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
  writeDB({ users: [] });
}

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
