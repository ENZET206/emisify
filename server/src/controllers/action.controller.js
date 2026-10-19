const { ok } = require('../utils/http');
const recs = require('../services/recommendation.service');
const challenges = require('../services/challenge.service');
const progress = require('../services/progress.service');
const v = require('../validators/app.validator');

const TYPES = ['ALL', 'TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS'];

exports.listRecommendations = async (req, res) => {
  const type = TYPES.includes(req.query.category) ? req.query.category : 'ALL';
  return ok(res, { items: await recs.list(req.user.id, type) });
};
exports.getRecommendation = async (req, res) => ok(res, await recs.get(req.user.id, req.params.id));
exports.setRecommendationStatus = async (req, res) => ok(res, await recs.setStatus(req.user.id, req.params.id, v.recommendationStatus.parse(req.body).status));

exports.listChallenges = async (req, res) => ok(res, { items: await challenges.list(req.user.id) });
exports.joinChallenge = async (req, res) => ok(res, await challenges.join(req.user.id, req.params.id));
exports.checkinChallenge = async (req, res) => ok(res, await challenges.checkin(req.user.id, req.params.id));

exports.getProgress = async (req, res) => ok(res, await progress.getProgress(req.user.id));
