const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const { AppError } = require('../utils/http');
const { publicUser } = require('../services/auth.service');

const COOKIE_NAME = 'emisify_token';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: env.tokenTtlDays * 86400000,
});

// `ver` lets us revoke every existing session (e.g. after a password reset) by bumping user.tokenVersion.
const signToken = (user) => jwt.sign({ sub: user.id, ver: user.tokenVersion }, env.authSecret, { expiresIn: `${env.tokenTtlDays}d`, algorithm: 'HS256' });

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Silakan masuk terlebih dahulu');
    let payload;
    try {
      payload = jwt.verify(token, env.authSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError(401, 'INVALID_SESSION', 'Sesi tidak valid atau kedaluwarsa');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.ver) throw new AppError(401, 'INVALID_SESSION', 'Sesi tidak valid atau sudah berakhir');
    const { tokenVersion, ...safe } = publicUser(user);
    req.user = safe;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth, signToken, cookieOptions, COOKIE_NAME };
