const { Router } = require('express');
const { asyncHandler: h } = require('../utils/http');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, registerLimiter, aiLimiter, resetLimiter } = require('../middleware/security');
const auth = require('../controllers/auth.controller');
const em = require('../controllers/emission.controller');
const act = require('../controllers/action.controller');
const ai = require('../controllers/ai.controller');

const r = Router();

r.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

r.post('/auth/register', registerLimiter, h(auth.register));
r.post('/auth/login', loginLimiter, h(auth.login));
r.post('/auth/logout', h(auth.logout));
r.get('/auth/me', requireAuth, h(auth.me));
r.get('/auth/session', h(auth.session));
r.get('/auth/providers', h(auth.providers));
r.post('/auth/google/url', loginLimiter, h(auth.googleUrl));
r.post('/auth/google/callback', loginLimiter, h(auth.googleCallback));
r.post('/auth/forgot-password', resetLimiter, h(auth.forgotPassword));
r.get('/auth/reset-password/check', resetLimiter, h(auth.checkResetToken));
r.post('/auth/reset-password', resetLimiter, h(auth.resetPassword));

r.get('/activities/categories', h(em.categories));

r.use(requireAuth);

r.patch('/user/target', h(auth.setTarget));
r.get('/dashboard/summary', h(em.summary));
r.get('/impact', h(em.impact));
r.get('/impact/:slug', h(em.impactDetail));

r.post('/calculations/preview', h(em.preview));
r.post('/calculations', h(em.create));
r.get('/calculations', h(em.list));
r.get('/calculations/export', h(em.exportHistory));
r.get('/calculations/:id', h(em.get));
r.patch('/calculations/:id', h(em.update));
r.delete('/calculations/:id', h(em.remove));
// "Items" are individual calculation records (per-barang view).
r.get('/items/:id', h(em.get));
r.patch('/items/:id', h(em.update));
r.delete('/items/:id', h(em.remove));

r.get('/recommendations', h(act.listRecommendations));
r.get('/recommendations/:id', h(act.getRecommendation));
r.patch('/user/recommendations/:id', h(act.setRecommendationStatus));

r.get('/challenges', h(act.listChallenges));
r.post('/challenges/:id/join', h(act.joinChallenge));
r.patch('/challenges/:id/progress', h(act.checkinChallenge));

r.get('/progress', h(act.getProgress));

r.get('/ai/status', h(ai.status));
r.get('/ai/history', h(ai.history));
r.delete('/ai/history', h(ai.clear));
r.post('/ai/chat', aiLimiter, h(ai.chat));

module.exports = r;
