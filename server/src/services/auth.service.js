const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
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

async function register({ name, email, age, password }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar', { fields: { email: { code: 'emailTaken' } } });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, age, passwordHash } });
  return publicUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
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
  let user = await prisma.user.findUnique({ where: { googleId: info.sub } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    user = byEmail
      ? await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: info.sub } })
      : await prisma.user.create({ data: { name: (info.name || email.split('@')[0]).slice(0, 60), email, googleId: info.sub } });
  }
  return publicUser(user);
}

async function forgotPassword(email, lang) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const raw = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + env.resetTokenMinutes * 60000) },
  });
  const link = `${env.appUrl.replace(/\/$/, '')}/reset-password?token=${raw}`;
  try {
    await sendMail({ to: user.email, ...resetEmail({ name: user.name, link, minutes: env.resetTokenMinutes, lang }) });
  } catch (e) {
    console.error('[mail] gagal mengirim email reset:', e.message);
    throw new AppError(502, 'MAIL_FAILED', 'Email gagal dikirim. Coba lagi nanti.');
  }
}

async function findValidToken(raw) {
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new AppError(400, 'INVALID_TOKEN', 'Tautan reset tidak valid atau sudah kedaluwarsa');
  return rec;
}

async function resetPassword(raw, password) {
  const rec = await findValidToken(raw);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId, usedAt: null } }),
  ]);
}

async function setTarget(userId, monthlyTargetKg) {
  const { tokenVersion, ...safe } = publicUser(await prisma.user.update({ where: { id: userId }, data: { monthlyTargetKg } }));
  return safe;
}

module.exports = { register, login, publicUser, googleEnabled, googleAuthUrl, googleLogin, forgotPassword, findValidToken, resetPassword, setTarget };
