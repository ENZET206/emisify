const prisma = require('../config/prisma');
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
  const rows = await prisma.calculation.findMany({
    where: { userId, activityDate: { gte: dayKeyToDate(sixMonthsAgo) } },
    orderBy: { activityDate: 'asc' },
  });
  const allCount = await prisma.calculation.count({ where: { userId } });
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
  const doneIds = (await prisma.userRecommendation.findMany({ where: { userId, status: 'DONE' }, select: { recommendationId: true } })).map((x) => x.recommendationId);
  const recommendation = await prisma.recommendation.findFirst({
    where: { id: { notIn: doneIds }, ...(top && top.kg > 0 ? { activityType: top.type } : {}) },
    orderBy: { sortOrder: 'asc' },
  });
  const activeChallenges = await prisma.userChallenge.findMany({
    where: { userId, status: 'JOINED' },
    include: { challenge: true },
    orderBy: { joinedAt: 'desc' },
    take: 2,
  });
  const recent = await prisma.calculation.findMany({ where: { userId }, orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }], take: 3 });

  const { monthlyTargetKg } = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyTargetKg: true } });
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
    activeChallenges: activeChallenges.map((uc) => ({ id: uc.challengeId, progress: uc.progress, target: uc.challenge.target, content: uc.challenge.content, icon: uc.challenge.icon })),
    recent: recent.map(serialize),
  };
}

const IMPACTS = [
  { key: 'VEHICLE', slug: 'vehicle', icon: 'car', label: { id: 'Kendaraan', en: 'Vehicles' } },
  { key: 'ENERGY', slug: 'energy', icon: 'zap', label: { id: 'Energi Listrik & AC', en: 'Electricity & AC' } },
  { key: 'ELECTRONICS', slug: 'electronics', icon: 'monitor', label: { id: 'Elektronik', en: 'Electronics' } },
];

async function impactCategories(userId, range) {
  const rows = await prisma.calculation.findMany({ where: { userId, ...rangeWhere(range) } });
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
  const where = { userId, ...rangeWhere(range) };
  const all = await prisma.calculation.findMany({ where });
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
