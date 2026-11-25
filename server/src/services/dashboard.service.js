const db = require('../config/db');
const { AppError } = require('../utils/http');
const { serialize, rangeWhere } = require('./calculation.service');
const { round, TREE_KG_PER_YEAR } = require('./calculator/calculator.service');
const { ACTIVITY_TYPES } = require('./calculator/definitions');
const { todayKey, dayKeyToDate, dateToDayKey, addDaysKey, monthStartKey } = require('../utils/time');

const sum = (rows) => rows.reduce((s, r) => s + r.resultKg, 0);
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

async function summary(userId) {
  const today = todayKey();
  const sixMonthsAgo = monthStartKey(today, -5);
  const rows = await db.query(
    'SELECT * FROM "Calculation" WHERE "userId" = $1 AND "activityDate" >= $2 ORDER BY "activityDate" ASC',
    [userId, dayKeyToDate(sixMonthsAgo)],
  );
  const { count: allCount } = await db.one('SELECT COUNT(*)::int AS count FROM "Calculation" WHERE "userId" = $1', [userId]);
  const thisMonth = monthStartKey(today);
  const lastMonth = monthStartKey(today, -1);
  const keyOf = (r) => dateToDayKey(r.activityDate);
  const thisRows = rows.filter((r) => keyOf(r) >= thisMonth);
  const lastRows = rows.filter((r) => keyOf(r) >= lastMonth && keyOf(r) < thisMonth);
  const thisKg = sum(thisRows);
  const lastKg = sum(lastRows);

  const byActivity = ACTIVITY_TYPES.map((a) => {
    const kg = sum(thisRows.filter((r) => r.activityType === a.type));
    return { type: a.type, slug: a.slug, icon: a.icon, label: a.label, kg: round(kg, 2), pct: pct(kg, thisKg) };
  });

  const monthly = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = monthStartKey(today, -i);
    const end = monthStartKey(today, -i + 1);
    monthly.push({ month: start.slice(0, 7), kg: round(sum(rows.filter((r) => keyOf(r) >= start && keyOf(r) < end)), 2) });
  }
  const daily = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = addDaysKey(today, -i);
    daily.push({ day, kg: round(sum(rows.filter((r) => keyOf(r) === day)), 2) });
  }

  const top = [...byActivity].sort((a, b) => b.kg - a.kg)[0];
  // First recommendation the user hasn't completed, preferring their biggest emission category.
  const recParams = [userId];
  let recSql = `SELECT r.* FROM "Recommendation" r
    WHERE NOT EXISTS (SELECT 1 FROM "UserRecommendation" ur WHERE ur."recommendationId" = r.id AND ur."userId" = $1 AND ur.status = 'DONE')`;
  if (top && top.kg > 0) {
    recParams.push(top.type);
    recSql += ' AND r."activityType" = $2';
  }
  const recommendation = await db.one(`${recSql} ORDER BY r."sortOrder" ASC LIMIT 1`, recParams);
  const activeChallenges = await db.query(
    `SELECT uc."challengeId", uc.progress, gc.target, gc.content, gc.icon
     FROM "UserChallenge" uc JOIN "GreenChallenge" gc ON gc.id = uc."challengeId"
     WHERE uc."userId" = $1 AND uc.status = 'JOINED'
     ORDER BY uc."joinedAt" DESC LIMIT 2`,
    [userId],
  );
  const recent = await db.query(
    'SELECT * FROM "Calculation" WHERE "userId" = $1 ORDER BY "activityDate" DESC, "createdAt" DESC LIMIT 3',
    [userId],
  );

  const { monthlyTargetKg } = await db.one('SELECT "monthlyTargetKg" FROM "User" WHERE id = $1', [userId]);
  return {
    target: monthlyTargetKg ? {
      kg: monthlyTargetKg,
      usedPct: round((thisKg / monthlyTargetKg) * 100, 1),
      remainingKg: round(Math.max(0, monthlyTargetKg - thisKg), 2),
      overKg: round(Math.max(0, thisKg - monthlyTargetKg), 2),
    } : null,
    hasData: allCount > 0,
    calculationsCount: allCount,
    thisMonthKg: round(thisKg, 2),
    lastMonthKg: round(lastKg, 2),
    changePct: lastKg > 0 ? round(((thisKg - lastKg) / lastKg) * 100, 1) : null,
    equivalentTreesMonth: round(thisKg / (TREE_KG_PER_YEAR / 12), 1),
    byActivity,
    monthly,
    daily,
    topActivity: top && top.kg > 0 ? top.type : null,
    recommendation,
    activeChallenges: activeChallenges.map((uc) => ({ id: uc.challengeId, progress: uc.progress, target: uc.target, content: uc.content, icon: uc.icon })),
    recent: recent.map(serialize),
  };
}

const IMPACTS = [
  { key: 'VEHICLE', slug: 'vehicle', icon: 'car', label: { id: 'Kendaraan', en: 'Vehicles' } },
  { key: 'ENERGY', slug: 'energy', icon: 'zap', label: { id: 'Energi Listrik & AC', en: 'Electricity & AC' } },
  { key: 'ELECTRONICS', slug: 'electronics', icon: 'monitor', label: { id: 'Elektronik', en: 'Electronics' } },
];

async function impactCategories(userId, range) {
  const params = [userId];
  const rows = await db.query(`SELECT * FROM "Calculation" WHERE "userId" = $1${rangeWhere(range, params)}`, params);
  const total = sum(rows);
  const categories = IMPACTS.map((c) => {
    const r = rows.filter((x) => x.impactCategory === c.key);
    const kg = sum(r);
    return { ...c, kg: round(kg, 2), pct: pct(kg, total), count: r.length };
  });
  return { totalKg: round(total, 2), categories, top: [...categories].filter((c) => c.kg > 0).sort((a, b) => b.kg - a.kg).slice(0, 2).map((c) => c.key) };
}

async function impactDetail(userId, slug, range) {
  const cat = IMPACTS.find((c) => c.slug === slug);
  if (!cat) throw new AppError(404, 'NOT_FOUND', 'Kategori dampak tidak ditemukan');
  const params = [userId];
  const all = await db.query(`SELECT * FROM "Calculation" WHERE "userId" = $1${rangeWhere(range, params)}`, params);
  const rows = all.filter((r) => r.impactCategory === cat.key).sort((a, b) => b.resultKg - a.resultKg);
  const totalAll = sum(all);
  const kg = sum(rows);
  return {
    category: cat,
    kg: round(kg, 2),
    pctOfTotal: pct(kg, totalAll),
    items: rows.map((r) => ({ ...serialize(r), pct: pct(r.resultKg, kg) })),
  };
}

module.exports = { summary, impactCategories, impactDetail, IMPACTS };
