const { ok } = require('../utils/http');
const calc = require('../services/calculation.service');
const dashboard = require('../services/dashboard.service');
const { ACTIVITY_TYPES } = require('../services/calculator/definitions');
const v = require('../validators/app.validator');
const { exportHistory } = require('../services/export.service');

exports.categories = async (req, res) => ok(res, { activities: ACTIVITY_TYPES });
exports.preview = async (req, res) => ok(res, await calc.preview(v.calculationBody.parse(req.body)));
exports.create = async (req, res) => ok(res, await calc.create(req.user.id, v.calculationBody.parse(req.body)), 201);
exports.list = async (req, res) => ok(res, await calc.list(req.user.id, v.listQuery.parse(req.query)));
exports.get = async (req, res) => ok(res, await calc.get(req.user.id, req.params.id));
exports.update = async (req, res) => ok(res, await calc.update(req.user.id, req.params.id, v.calculationUpdate.parse(req.body)));
exports.remove = async (req, res) => ok(res, await calc.remove(req.user.id, req.params.id));
exports.summary = async (req, res) => ok(res, await dashboard.summary(req.user.id));
exports.impact = async (req, res) => ok(res, await dashboard.impactCategories(req.user.id, v.impactQuery.parse(req.query).range));
exports.impactDetail = async (req, res) => ok(res, await dashboard.impactDetail(req.user.id, req.params.slug, v.impactQuery.parse(req.query).range));
exports.exportHistory = async (req, res) => {
  const q = v.listQuery.parse(req.query);
  const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
  const lang = req.query.lang === 'en' ? 'en' : 'id';
  const file = await exportHistory(req.user, q, format, lang);
  res.setHeader('Content-Type', file.type);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(file.body);
};
