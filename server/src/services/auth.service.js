const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');
const { AppError } = require('../utils/http');
const { sendMail, resetEmail } = require('./mail.service');

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, age: u.age, createdAt: u.createdAt,
  monthlyTargetKg: u.monthlyTargetKg, hasPassword: Boolean(u.passwordHash), googleLinked: Boolean(u.googleId), tokenVersion: u.tokenVersion,
});
// Dummy hash so failed logins for unknown emails take the same time (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('emisify-timing-guard', 12);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const USER_LOOKUP = {
  id: 'SELECT * FROM "User" WHERE id = $1',
  email: 'SELECT * FROM "User" WHERE email = $1',
  googleId: 'SELECT * FROM "User" WHERE "googleId" = $1',
};
const findUserBy = (key, value) => db.one(USER_LOOKUP[key], [value]);
const createUser = ({ name, email, age = null, passwordHash = null, googleId = null }) => db.one(
  'INSERT INTO "User" (id, name, email, age, "passwordHash", "googleId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
  [db.newId(), name, email, age, passwordHash, googleId],
);

async function register({ name, email, age, password }) {
  const exists = await findUserBy('email', email);
  if (exists) throw new AppError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar', { fields: { email: { code: 'emailTaken' } } });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, age, passwordHash });
  return publicUser(user);
}

async function login({ email, password }) {
  const user = await findUserBy('email', email);
  if (user && !user.passwordHash) throw new AppError(401, 'GOOGLE_ACCOUNT', 'Akun ini terdaftar lewat Google. Masuk dengan Google atau atur password lewat "Lupa password".');
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  return publicUser(user);
}

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// The redirect URI is built by the client from window.location.origin and only accepted if its origin is allow-listed.
function assertRedirectUri(redirectUri) {
  let u;
  try { u = new URL(redirectUri); } catch { u = null; }
  if (!u || u.pathname !== '/auth/google' || !env.clientUrls.includes(u.origin)) {
    throw new AppError(400, 'INVALID_REDIRECT', 'Redirect URI tidak diizinkan');
  }
}

function googleEnabled() {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

function googleAuthUrl(redirectUri, state) {
  if (!googleEnabled()) throw new AppError(503, 'GOOGLE_DISABLED', 'Login Google belum dikonfigurasi');
  assertRedirectUri(redirectUri);
  const params = new URLSearchParams({
    client_id: env.google.clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function googleLogin(code, redirectUri) {
  if (!googleEnabled()) throw new AppError(503, 'GOOGLE_DISABLED', 'Login Google belum dikonfigurasi');
  assertRedirectUri(redirectUri);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.google.clientId, client_secret: env.google.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  const tokens = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokens.id_token) throw new AppError(401, 'GOOGLE_FAILED', 'Login Google gagal. Coba lagi.');
  const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  const info = await infoRes.json().catch(() => ({}));
  const validIss = ['accounts.google.com', 'https://accounts.google.com'].includes(info.iss);
  if (!infoRes.ok || info.aud !== env.google.clientId || !validIss || String(info.email_verified) !== 'true') {
    throw new AppError(401, 'GOOGLE_FAILED', 'Akun Google tidak dapat diverifikasi');
  }
  const email = info.email.toLowerCase();
  let user = await findUserBy('googleId', info.sub);
  if (!user) {
    const byEmail = await findUserBy('email', email);
    user = byEmail
      ? await db.one('UPDATE "User" SET "googleId" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *', [info.sub, byEmail.id])
      : await createUser({ name: (info.name || email.split('@')[0]).slice(0, 60), email, googleId: info.sub });
  }
  return publicUser(user);
}

async function forgotPassword(email, lang) {
  const user = await findUserBy('email', email);
  if (!user) return;
  const raw = crypto.randomBytes(32).toString('hex');
  await db.query('DELETE FROM "PasswordResetToken" WHERE "userId" = $1 AND "usedAt" IS NULL', [user.id]);
  await db.query(
    'INSERT INTO "PasswordResetToken" (id, "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
    [db.newId(), user.id, sha256(raw), new Date(Date.now() + env.resetTokenMinutes * 60000)],
  );
  const link = `${env.appUrl.replace(/\/$/, '')}/reset-password?token=${raw}`;
  try {
    await sendMail({ to: user.email, ...resetEmail({ name: user.name, link, minutes: env.resetTokenMinutes, lang }) });
  } catch (e) {
    console.error('[mail] gagal mengirim email reset:', e.message);
    throw new AppError(502, 'MAIL_FAILED', 'Email gagal dikirim. Coba lagi nanti.');
  }
}

async function findValidToken(raw) {
  const rec = await db.one('SELECT * FROM "PasswordResetToken" WHERE "tokenHash" = $1', [sha256(raw)]);
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new AppError(400, 'INVALID_TOKEN', 'Tautan reset tidak valid atau sudah kedaluwarsa');
  return rec;
}

async function resetPassword(raw, password) {
  const rec = await findValidToken(raw);
  const passwordHash = await bcrypt.hash(password, 12);
  await db.transaction(async (client) => {
    await db.query('UPDATE "User" SET "passwordHash" = $1, "tokenVersion" = "tokenVersion" + 1, "updatedAt" = NOW() WHERE id = $2', [passwordHash, rec.userId], client);
    await db.query('UPDATE "PasswordResetToken" SET "usedAt" = NOW() WHERE id = $1', [rec.id], client);
    await db.query('DELETE FROM "PasswordResetToken" WHERE "userId" = $1 AND "usedAt" IS NULL', [rec.userId], client);
  });
}

async function setTarget(userId, monthlyTargetKg) {
  const user = await db.one('UPDATE "User" SET "monthlyTargetKg" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *', [monthlyTargetKg, userId]);
  const { tokenVersion, ...safe } = publicUser(user);
  return safe;
}

async function updateProfile(userId, { name, age }) {
  const user = await db.one('UPDATE "User" SET name = $1, age = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *', [name, age, userId]);
  const { tokenVersion, ...safe } = publicUser(user);
  return safe;
}

const fieldError = (field, code, message) => new AppError(422, 'VALIDATION_ERROR', message, { fields: { [field]: { code } } });

// Changes (or, for Google-only accounts, sets) the password and revokes every other session via tokenVersion.
// Returns the full user (incl. tokenVersion) so the caller can re-issue the current session cookie.
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await findUserBy('id', userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  if (user.passwordHash) {
    if (!currentPassword) throw fieldError('currentPassword', 'required', 'Password saat ini wajib diisi');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw fieldError('currentPassword', 'wrongPassword', 'Password saat ini salah');
    if (await bcrypt.compare(newPassword, user.passwordHash)) throw fieldError('newPassword', 'samePassword', 'Password baru harus berbeda');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await db.transaction(async (client) => {
    const u = await db.one(
      'UPDATE "User" SET "passwordHash" = $1, "tokenVersion" = "tokenVersion" + 1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
      [passwordHash, userId], client,
    );
    await db.query('DELETE FROM "PasswordResetToken" WHERE "userId" = $1', [userId], client);
    return u;
  });
  return publicUser(updated);
}

// Permanently deletes the account; all personal data cascades (foreign keys ON DELETE CASCADE in database/schema.sql).
async function deleteAccount(userId, { password, confirmEmail }) {
  const user = await findUserBy('id', userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  if (user.passwordHash) {
    if (!password) throw fieldError('password', 'required', 'Password wajib diisi');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw fieldError('password', 'wrongPassword', 'Password salah');
  } else if (confirmEmail !== user.email) {
    throw fieldError('confirmEmail', 'emailMismatch', 'Email tidak sesuai');
  }
  await db.query('DELETE FROM "User" WHERE id = $1', [userId]);
}

module.exports = {
  register, login, publicUser, googleEnabled, googleAuthUrl, googleLogin, forgotPassword, findValidToken, resetPassword, setTarget,
  updateProfile, changePassword, deleteAccount,
};
