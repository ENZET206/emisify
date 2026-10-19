const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { AppError } = require('../utils/http');

const limiter = (windowMs, limit, keyFn) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: keyFn,
  handler: (req, res, next) => next(new AppError(429, 'RATE_LIMITED', 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.')),
});

const loginLimiter = limiter(15 * 60 * 1000, 10, (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`);
const resetLimiter = limiter(15 * 60 * 1000, 8, (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`);
const registerLimiter = limiter(60 * 60 * 1000, 20);
const aiLimiter = limiter(60 * 1000, 12, (req) => req.user?.id || req.ip);
const apiLimiter = limiter(60 * 1000, 300);

// CSRF mitigation for cookie auth: SameSite=Lax cookie + JSON-only mutations + Origin allow-list.
function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !env.clientUrls.includes(origin)) return next(new AppError(403, 'FORBIDDEN_ORIGIN', 'Origin tidak diizinkan'));
  const hasBody = Number(req.get('content-length') || 0) > 0;
  if (hasBody && !req.is('application/json')) return next(new AppError(415, 'UNSUPPORTED_MEDIA', 'Gunakan Content-Type application/json'));
  return next();
}

module.exports = { resetLimiter, loginLimiter, registerLimiter, aiLimiter, apiLimiter, csrfGuard };
