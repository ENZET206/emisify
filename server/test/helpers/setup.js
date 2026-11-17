// Test helper: starts the real Express app against an in-memory Prisma mock (no PostgreSQL needed).
// Must be required BEFORE anything that loads src/config/prisma or src/config/env.
const path = require('path');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.AUTH_SECRET = 'test-secret-'.padEnd(48, 'x');
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';

const ORIGIN = 'http://localhost:5173';

// Minimal in-memory implementation of the Prisma calls used by the auth flows.
function createPrismaMock() {
  const users = new Map();
  const resetTokens = new Map();
  let seq = 1;
  const matches = (row, where) => Object.entries(where).every(([k, v]) => row[k] === v);
  const apply = (row, data) => {
    for (const [k, v] of Object.entries(data)) row[k] = v && typeof v === 'object' && 'increment' in v ? row[k] + v.increment : v;
    return row;
  };
  const table = (map, defaults) => ({
    findUnique: async ({ where }) => [...map.values()].find((r) => matches(r, where)) || null,
    create: async ({ data }) => {
      const row = { id: `id${seq++}`, createdAt: new Date(), updatedAt: new Date(), ...defaults(), ...data };
      map.set(row.id, row);
      return row;
    },
    update: async ({ where, data }) => {
      const row = [...map.values()].find((r) => matches(r, where));
      if (!row) throw new Error('Record to update not found');
      return apply(row, data);
    },
    delete: async ({ where }) => {
      const row = [...map.values()].find((r) => matches(r, where));
      if (!row) throw new Error('Record to delete not found');
      map.delete(row.id);
      return row;
    },
    deleteMany: async ({ where = {} } = {}) => {
      let count = 0;
      for (const r of [...map.values()]) if (matches(r, where)) { map.delete(r.id); count += 1; }
      return { count };
    },
  });
  const user = table(users, () => ({ age: null, passwordHash: null, googleId: null, monthlyTargetKg: null, tokenVersion: 0 }));
  const passwordResetToken = table(resetTokens, () => ({ usedAt: null }));
  // Mirror onDelete: Cascade from schema.prisma for the tables this mock knows.
  const deleteUser = user.delete;
  user.delete = async (args) => {
    const row = await deleteUser(args);
    await passwordResetToken.deleteMany({ where: { userId: row.id } });
    return row;
  };
  return { user, passwordResetToken, $transaction: async (ops) => Promise.all(ops), _users: users, _resetTokens: resetTokens };
}

const root = path.join(__dirname, '..', '..');
const prisma = createPrismaMock();
require.cache[require.resolve(path.join(root, 'src/config/prisma'))] = { id: 'prisma-mock', exports: prisma, loaded: true };
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

module.exports = { prisma, startServer, ORIGIN };
