const prisma = require('../config/prisma');
const { AppError } = require('../utils/http');
const { calculate, TREE_KG_PER_YEAR, round } = require('./calculator/calculator.service');
const { byType } = require('./calculator/definitions');
const { todayKey, dayKeyToDate, dateToDayKey, addDaysKey, monthStartKey } = require('../utils/time');

let cache = { at: 0, map: null };
async function loadFactors() {
  if (cache.map && Date.now() - cache.at < 60000) return cache.map;
  const rows = await prisma.emissionFactor.findMany();
  cache = { at: Date.now(), map: Object.fromEntries(rows.map((f) => [f.key, f])) };
  return cache.map;
}

function rangeWhere(range) {
  const today = todayKey();
  const from = { '7d': addDaysKey(today, -6), '30d': addDaysKey(today, -29), month: monthStartKey(today), lastMonth: monthStartKey(today, -1) }[range];
  if (!from) return {};
  const where = { gte: dayKeyToDate(from) };
  if (range === 'lastMonth') where.lt = dayKeyToDate(monthStartKey(today));
  return { activityDate: where };
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

async function create(userId, body) {
  const r = calculate(body.activity, body.subType, body.inputs, await loadFactors());
  const c = await prisma.calculation.create({ data: { userId, ...toData(r) } });
  return serialize(c);
}

async function findOwned(userId, id) {
  const c = await prisma.calculation.findFirst({ where: { id, userId } });
  if (!c) throw new AppError(404, 'NOT_FOUND', 'Data perhitungan tidak ditemukan');
  return c;
}

async function list(userId, q) {
  const where = { userId, ...rangeWhere(q.range) };
  if (q.category !== 'ALL') where.activityType = q.category;
  const orderBy = {
    newest: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    oldest: [{ activityDate: 'asc' }, { createdAt: 'asc' }],
    highest: [{ resultKg: 'desc' }],
    lowest: [{ resultKg: 'asc' }],
  }[q.sort];
  const rows = await prisma.calculation.findMany({ where, orderBy, take: 500 });
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
  const c = await prisma.calculation.update({ where: { id: existing.id }, data: toData(r) });
  return serialize(c);
}

async function remove(userId, id) {
  const existing = await findOwned(userId, id);
  await prisma.calculation.delete({ where: { id: existing.id } });
  return { id };
}

module.exports = { preview, create, list, get, update, remove, serialize, rangeWhere, loadFactors };
