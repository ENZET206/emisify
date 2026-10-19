const prisma = require('../config/prisma');
const { AppError } = require('../utils/http');
const { evaluateAchievements } = require('./progress.service');
const { dayKeyToDate, todayKey, addDaysKey } = require('../utils/time');

async function relevantTypes(userId) {
  const rows = await prisma.calculation.groupBy({
    by: ['activityType'],
    where: { userId, activityDate: { gte: dayKeyToDate(addDaysKey(todayKey(), -29)) } },
    _sum: { resultKg: true },
  });
  return rows.filter((r) => r._sum.resultKg > 0).sort((a, b) => b._sum.resultKg - a._sum.resultKg).slice(0, 2).map((r) => r.activityType);
}

const shape = (r, ur, relevant) => ({
  id: r.id, slug: r.slug, activityType: r.activityType, content: r.content, reductionKgPerMonth: r.reductionKgPerMonth,
  image: r.image, icon: r.icon, relevant: relevant.includes(r.activityType),
  userStatus: ur?.status || null, startedAt: ur?.startedAt || null, completedAt: ur?.completedAt || null,
});

async function list(userId, activityType) {
  const where = activityType && activityType !== 'ALL' ? { activityType } : {};
  const [recs, mine, relevant] = await Promise.all([
    prisma.recommendation.findMany({ where, orderBy: { sortOrder: 'asc' } }),
    prisma.userRecommendation.findMany({ where: { userId } }),
    relevantTypes(userId),
  ]);
  const byRec = Object.fromEntries(mine.map((m) => [m.recommendationId, m]));
  return recs
    .map((r) => shape(r, byRec[r.id], relevant))
    .sort((a, b) => Number(b.relevant) - Number(a.relevant));
}

async function get(userId, idOrSlug) {
  const r = await prisma.recommendation.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const [ur, relevant] = await Promise.all([
    prisma.userRecommendation.findUnique({ where: { userId_recommendationId: { userId, recommendationId: r.id } } }),
    relevantTypes(userId),
  ]);
  return shape(r, ur, relevant);
}

async function setStatus(userId, id, status) {
  const r = await prisma.recommendation.findUnique({ where: { id } });
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const key = { userId_recommendationId: { userId, recommendationId: id } };
  const current = await prisma.userRecommendation.findUnique({ where: key });
  if (status === 'NONE') {
    if (current?.status === 'DONE') throw new AppError(409, 'ALREADY_DONE', 'Aksi yang sudah selesai tidak dapat dibatalkan');
    if (current) await prisma.userRecommendation.delete({ where: key });
    return { recommendation: await get(userId, id), newlyEarned: [] };
  }
  if (current?.status === 'DONE') throw new AppError(409, 'ALREADY_DONE', 'Aksi ini sudah selesai');
  if (status === 'DONE' && current?.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MUST_START_FIRST', 'Mulai aksi ini terlebih dahulu sebelum menandai selesai');
  }
  const now = new Date();
  const data = { status, ...(status === 'IN_PROGRESS' ? { startedAt: now } : {}), ...(status === 'DONE' ? { completedAt: now } : {}) };
  await prisma.userRecommendation.upsert({ where: key, create: { userId, recommendationId: id, ...data }, update: data });
  const newlyEarned = status === 'DONE' ? await evaluateAchievements(userId) : [];
  return { recommendation: await get(userId, id), newlyEarned };
}

module.exports = { list, get, setStatus };
