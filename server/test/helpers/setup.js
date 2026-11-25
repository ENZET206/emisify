// Test helper: starts the real Express app against an in-memory fake of src/config/db (no PostgreSQL needed).
// Must be required BEFORE anything that loads src/config/db or src/config/env.
const path = require('path');
const crypto = require('crypto');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.AUTH_SECRET = 'test-secret-'.padEnd(48, 'x');
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';

const ORIGIN = 'http://localhost:5173';

// Answers the raw SQL used by the auth flows (User + PasswordResetToken) from two in-memory tables.
// Any other query throws, so a test fails loudly instead of silently passing.
function createFakeDb() {
  const users = new Map();
  const resetTokens = new Map();
  const findUser = (key, value) => [...users.values()].find((u) => u[key] === value) || null;
  const updateUser = (id, changes) => {
    const u = users.get(id);
    if (!u) return null;
    Object.assign(u, changes, { updatedAt: new Date() });
    return u;
  };
  const deleteTokens = (pred) => { for (const t of [...resetTokens.values()]) if (pred(t)) resetTokens.delete(t.id); };

  function createUser({ id = crypto.randomUUID(), name, email, age = null, passwordHash = null, googleId = null }) {
    const now = new Date();
    const u = { id, name, email, age, passwordHash, googleId, monthlyTargetKg: null, tokenVersion: 0, createdAt: now, updatedAt: now };
    users.set(id, u);
    return u;
  }

  const routes = [
    [/^SELECT \* FROM "User" WHERE id = \$1$/, ([id]) => [users.get(id)].filter(Boolean)],
    [/^SELECT \* FROM "User" WHERE email = \$1$/, ([email]) => [findUser('email', email)].filter(Boolean)],
    [/^SELECT \* FROM "User" WHERE "googleId" = \$1$/, ([gid]) => [findUser('googleId', gid)].filter(Boolean)],
    [/^INSERT INTO "User" \(id, name, email, age, "passwordHash", "googleId", "updatedAt"\)/, ([id, name, email, age, passwordHash, googleId]) => {
      if (findUser('email', email)) throw Object.assign(new Error('duplicate key value violates unique constraint "User_email_key"'), { code: '23505' });
      return [createUser({ id, name, email, age, passwordHash, googleId })];
    }],
    [/^UPDATE "User" SET name = \$1, age = \$2, .* WHERE id = \$3/, ([name, age, id]) => [updateUser(id, { name, age })].filter(Boolean)],
    [/^UPDATE "User" SET "monthlyTargetKg" = \$1, .* WHERE id = \$2/, ([kg, id]) => [updateUser(id, { monthlyTargetKg: kg })].filter(Boolean)],
    [/^UPDATE "User" SET "googleId" = \$1, .* WHERE id = \$2/, ([gid, id]) => [updateUser(id, { googleId: gid })].filter(Boolean)],
    [/^UPDATE "User" SET "passwordHash" = \$1, "tokenVersion" = "tokenVersion" \+ 1, .* WHERE id = \$2/, ([hash, id]) => {
      const u = users.get(id);
      return u ? [updateUser(id, { passwordHash: hash, tokenVersion: u.tokenVersion + 1 })] : [];
    }],
    [/^DELETE FROM "User" WHERE id = \$1$/, ([id]) => {
      users.delete(id);
      deleteTokens((t) => t.userId === id); // ON DELETE CASCADE
      return [];
    }],
    [/^SELECT \* FROM "PasswordResetToken" WHERE "tokenHash" = \$1$/, ([h]) => [...resetTokens.values()].filter((t) => t.tokenHash === h)],
    [/^INSERT INTO "PasswordResetToken"/, ([id, userId, tokenHash, expiresAt]) => {
      resetTokens.set(id, { id, userId, tokenHash, expiresAt, usedAt: null, createdAt: new Date() });
      return [];
    }],
    [/^UPDATE "PasswordResetToken" SET "usedAt" = NOW\(\) WHERE id = \$1$/, ([id]) => {
      const t = resetTokens.get(id);
      if (t) t.usedAt = new Date();
      return [];
    }],
    [/^DELETE FROM "PasswordResetToken" WHERE "userId" = \$1 AND "usedAt" IS NULL$/, ([uid]) => { deleteTokens((t) => t.userId === uid && !t.usedAt); return []; }],
    [/^DELETE FROM "PasswordResetToken" WHERE "userId" = \$1$/, ([uid]) => { deleteTokens((t) => t.userId === uid); return []; }],
  ];

  async function query(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    const route = routes.find(([re]) => re.test(sql));
    if (!route) throw new Error(`fake db: query belum didukung: ${sql}`);
    return route[1](params);
  }
  const one = async (text, params) => (await query(text, params))[0] || null;
  // The fake has no real transaction; the callback runs against the same tables.
  const transaction = async (fn) => fn(null);

  return {
    query, one, transaction, newId: () => crypto.randomUUID(), json: (v) => JSON.stringify(v), pool: { end: async () => {} },
    createUser, _users: users, _resetTokens: resetTokens,
  };
}

const root = path.join(__dirname, '..', '..');
const db = createFakeDb();
require.cache[require.resolve(path.join(root, 'src/config/db'))] = { id: 'db-fake', exports: db, loaded: true };
const app = require(path.join(root, 'src/app'));

// Starts the app on a random port and returns a tiny cookie-aware HTTP client per "device".
async function startServer() {
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://localhost:${server.address().port}/api`;
  const jars = {};
  async function request(device, method, p, body, extraHeaders = {}) {
    const headers = { Origin: ORIGIN, ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (jars[device]) headers.Cookie = jars[device];
    const res = await fetch(base + p, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const pair = setCookie.split(';')[0];
      jars[device] = pair.endsWith('=') ? undefined : pair; // cleared cookie → logged out
    }
    return { status: res.status, body: await res.json() };
  }
  return {
    request,
    jars,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

module.exports = { db, startServer, ORIGIN };
