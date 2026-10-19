const crypto = require('crypto');
const { ok, AppError } = require('../utils/http');
const { mailConfigured } = require('../services/mail.service');
const authService = require('../services/auth.service');
const v = require('../validators/auth.validator');
const { signToken, cookieOptions, COOKIE_NAME, requireAuth } = require('../middleware/auth');

function startSession(res, user, status = 200) {
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
  const { tokenVersion, ...safe } = user;
  return ok(res, { user: safe }, status);
}

exports.register = async (req, res) => startSession(res, await authService.register(v.register.parse(req.body)), 201);
exports.login = async (req, res) => startSession(res, await authService.login(v.login.parse(req.body)));
exports.session = async (req, res, next) => {
  if (!req.cookies[COOKIE_NAME]) return ok(res, { user: null });
  return requireAuth(req, res, (err) => (err ? ok(res, { user: null }) : ok(res, { user: req.user }))).catch(next);
};
exports.me = async (req, res) => ok(res, { user: req.user });
exports.logout = async (req, res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
  return ok(res, { loggedOut: true });
};

const STATE_COOKIE = 'emisify_g_state';

exports.providers = async (req, res) => ok(res, { google: authService.googleEnabled(), email: mailConfigured() });

exports.googleUrl = async (req, res) => {
  const { redirectUri } = v.googleUrl.parse(req.body);
  const state = crypto.randomBytes(16).toString('hex');
  const url = authService.googleAuthUrl(redirectUri, state);
  res.cookie(STATE_COOKIE, state, { ...cookieOptions(), maxAge: 10 * 60000 });
  return ok(res, { url });
};

exports.googleCallback = async (req, res) => {
  const { code, state, redirectUri } = v.googleCallback.parse(req.body);
  const expected = req.cookies[STATE_COOKIE];
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(STATE_COOKIE, opts);
  if (!expected || expected !== state) throw new AppError(400, 'INVALID_STATE', 'Sesi login Google tidak valid. Ulangi dari halaman masuk.');
  return startSession(res, await authService.googleLogin(code, redirectUri));
};

exports.forgotPassword = async (req, res) => {
  const { email, lang } = v.forgot.parse(req.body);
  await authService.forgotPassword(email, lang);
  return ok(res, { sent: true });
};

exports.checkResetToken = async (req, res) => {
  await authService.findValidToken(String(req.query.token || ''));
  return ok(res, { valid: true });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = v.reset.parse(req.body);
  await authService.resetPassword(token, password);
  return ok(res, { reset: true });
};

exports.setTarget = async (req, res) => ok(res, { user: await authService.setTarget(req.user.id, v.target.parse(req.body).monthlyTargetKg) });
