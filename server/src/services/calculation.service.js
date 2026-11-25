const db = require('../config/db');
const { AppError } = require('../utils/http');
const { calculate, TREE_KG_PER_YEAR, round } = require('./calculator/calculator.service');
const { byType } = require('./calculator/definitions');
const { todayKey, dayKeyToDate, dateToDayKey, addDaysKey, monthStartKey } = require('../utils/time');

let cache = { at: 0, map: null };
async function loadFactors() {
  if (cache.map && Date.now() - cache.at < 60000) return cache.map;
  const rows = await db.query('SELECT * FROM "EmissionFactor"');
  cache = { at: Date.now(), map: Object.fromEntries(rows.map((f) => [f.key, f])) };
  return cache.map;
}

// Extra WHERE condition for a date range. `params` is the query's parameter list; the dates are appended to it
// and referenced by position, so the condition stays parameterized.
function rangeWhere(range, params) {
  const today = todayKey();
  const from = { '7d': addDaysKey(today, -6), '30d': addDaysKey(today, -29), month: monthStartKey(today), lastMonth: monthStartKey(today, -1) }[range];
  if (!from) return '';
  params.push(dayKeyToDate(from));
  let sql = ` AND "activityDate" >= $${params.length}`;
  if (range === 'lastMonth') {
    params.push(dayKeyToDate(monthStartKey(today)));
    sql += ` AND "activityDate" < $${params.length}`;
  }
  return sql;
}

function serialize(c) {
  const def = byType[c.activityType];
  const sub = def.subTypes[c.subType];
  return {
    id: c.id,
    activityType: c.activityType,
    activitySlug: def.slug,
    impactCategory: c.impactCategory,
    subType: c.subType,
    subTypeLabel: sub?.label,
    icon: sub?.icon || def.icon,
    itemName: c.itemName,
    inputs: c.inputs,
    quantity: c.quantity,
    unit: c.unit,
    factor: { key: c.factorKey, value: c.factorValue, unit: c.factorUnit, status: c.factorStatus },
    breakdown: c.breakdown,
    periodDays: c.periodDays,
    resultKg: c.resultKg,
    equivalentTreesMonth: round(c.resultKg / (TREE_KG_PER_YEAR / 12), 1),
    activityDate: dateToDayKey(c.activityDate),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function preview(body) {
  const r = calculate(body.activity, body.subType, body.inputs, await loadFactors());
  const { factor, ...rest } = r;
  return { ...rest, factor: { key: factor.key, value: factor.value, unit: `${factor.outputUnit}/${factor.inputUnit}`, status: factor.status } };
}

const toData = (r) => ({
  activityType: r.activityType,
  impactCategory: r.impactCategory,
  subType: r.subType,
  itemName: r.itemName,
  inputs: r.inputs,
  quantity: r.quantity,
  unit: r.unit,
  factorId: r.factor.id,
  factorKey: r.factor.key,
  factorValue: r.factor.value,
  factorUnit: `${r.factor.outputUnit}/${r.factor.inputUnit}`,
  factorStatus: r.factor.status,
  breakdown: r.breakdown,
  periodDays: r.periodDays,
  resultKg: r.resultKg,
  activityDate: dayKeyToDate(r.activityDate),
});

// Column order shared by INSERT and UPDATE; values come from toData().
const DATA_COLUMNS = [
  'activityType', 'impactCategory', 'subType', 'itemName', 'inputs', 'quantity', 'unit', 'factorId', 'factorKey', 'factorValue',
  'factorUnit', 'factorStatus', 'breakdown', 'periodDays', 'resultKg', 'activityDate',
];
const JSON_COLUMNS = new Set(['itemName', 'inputs', 'breakdown']);
const dataValues = (d) => DATA_COLUMNS.map((c) => (JSON_COLUMNS.has(c) ? db.json(d[c]) : d[c]));

async function create(userId, body) {
  const r = calculate(body.activity, body.subType, body.inputs, await loadFactors());
  const cols = DATA_COLUMNS.map((c) => `"${c}"`).join(', ');
  const marks = DATA_COLUMNS.map((_, i) => `$${i + 3}`).join(', ');
  const c = await db.one(
    `INSERT INTO "Calculation" (id, "userId", ${cols}, "updatedAt") VALUES ($1, $2, ${marks}, NOW()) RETURNING *`,
    [db.newId(), userId, ...dataValues(toData(r))],
  );
  return serialize(c);
}

async function findOwned(userId, id) {
  const c = await db.one('SELECT * FROM "Calculation" WHERE id = $1 AND "userId" = $2', [id, userId]);
  if (!c) throw new AppError(404, 'NOT_FOUND', 'Data perhitungan tidak ditemukan');
  return c;
}

const LIST_ORDER = {
  newest: '"activityDate" DESC, "createdAt" DESC',
  oldest: '"activityDate" ASC, "createdAt" ASC',
  highest: '"resultKg" DESC',
  lowest: '"resultKg" ASC',
};

async function list(userId, q) {
  const params = [userId];
  let sql = 'SELECT * FROM "Calculation" WHERE "userId" = $1';
  sql += rangeWhere(q.range, params);
  if (q.category !== 'ALL') {
    params.push(q.category);
    sql += ` AND "activityType" = $${params.length}`;
  }
  sql += ` ORDER BY ${LIST_ORDER[q.sort] || LIST_ORDER.newest} LIMIT 500`;
  const rows = await db.query(sql, params);
  const totalKg = round(rows.reduce((s, r) => s + r.resultKg, 0));
  return { items: rows.map(serialize), totalKg, count: rows.length };
}

async function get(userId, id) {
  return serialize(await findOwned(userId, id));
}

async function update(userId, id, body) {
  const existing = await findOwned(userId, id);
  const slug = byType[existing.activityType].slug;
  const r = calculate(slug, existing.subType, body.inputs, await loadFactors());
  const sets = DATA_COLUMNS.map((c, i) => `"${c}" = $${i + 2}`).join(', ');
  const c = await db.one(
    `UPDATE "Calculation" SET ${sets}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
    [existing.id, ...dataValues(toData(r))],
  );
  return serialize(c);
}

async function remove(userId, id) {
  const existing = await findOwned(userId, id);
  await db.query('DELETE FROM "Calculation" WHERE id = $1', [existing.id]);
  return { id };
}

module.exports = { preview, create, list, get, update, remove, serialize, rangeWhere, loadFactors };
