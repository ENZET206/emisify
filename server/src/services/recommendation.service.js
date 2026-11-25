const db = require('../config/db');
const { AppError } = require('../utils/http');
const { evaluateAchievements } = require('./progress.service');
const { dayKeyToDate, todayKey, addDaysKey } = require('../utils/time');

async function relevantTypes(userId) {
  const rows = await db.query(
    `SELECT "activityType", SUM("resultKg") AS kg FROM "Calculation"
     WHERE "userId" = $1 AND "activityDate" >= $2 GROUP BY "activityType"`,
    [userId, dayKeyToDate(addDaysKey(todayKey(), -29))],
  );
  return rows.filter((r) => r.kg > 0).sort((a, b) => b.kg - a.kg).slice(0, 2).map((r) => r.activityType);
}

const findUserRec = (userId, recommendationId) => db.one(
  'SELECT * FROM "UserRecommendation" WHERE "userId" = $1 AND "recommendationId" = $2',
  [userId, recommendationId],
);

const shape = (r, ur, relevant) => ({
  id: r.id, slug: r.slug, activityType: r.activityType, content: r.content, reductionKgPerMonth: r.reductionKgPerMonth,
  image: r.image, icon: r.icon, relevant: relevant.includes(r.activityType),
  userStatus: ur?.status || null, startedAt: ur?.startedAt || null, completedAt: ur?.completedAt || null,
});

async function list(userId, activityType) {
  const filtered = activityType && activityType !== 'ALL';
  const [recs, mine, relevant] = await Promise.all([
    filtered
      ? db.query('SELECT * FROM "Recommendation" WHERE "activityType" = $1 ORDER BY "sortOrder" ASC', [activityType])
      : db.query('SELECT * FROM "Recommendation" ORDER BY "sortOrder" ASC'),
    db.query('SELECT * FROM "UserRecommendation" WHERE "userId" = $1', [userId]),
    relevantTypes(userId),
  ]);
  const byRec = Object.fromEntries(mine.map((m) => [m.recommendationId, m]));
  return recs
    .map((r) => shape(r, byRec[r.id], relevant))
    .sort((a, b) => Number(b.relevant) - Number(a.relevant));
}

async function get(userId, idOrSlug) {
  const r = await db.one('SELECT * FROM "Recommendation" WHERE id = $1 OR slug = $1 LIMIT 1', [idOrSlug]);
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const [ur, relevant] = await Promise.all([
    findUserRec(userId, r.id),
    relevantTypes(userId),
  ]);
  return shape(r, ur, relevant);
}

async function setStatus(userId, id, status) {
  const r = await db.one('SELECT * FROM "Recommendation" WHERE id = $1', [id]);
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const current = await findUserRec(userId, id);
  if (status === 'NONE') {
    if (current?.status === 'DONE') throw new AppError(409, 'ALREADY_DONE', 'Aksi yang sudah selesai tidak dapat dibatalkan');
    if (current) await db.query('DELETE FROM "UserRecommendation" WHERE "userId" = $1 AND "recommendationId" = $2', [userId, id]);
    return { recommendation: await get(userId, id), newlyEarned: [] };
  }
  if (current?.status === 'DONE') throw new AppError(409, 'ALREADY_DONE', 'Aksi ini sudah selesai');
  if (status === 'DONE' && current?.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MUST_START_FIRST', 'Mulai aksi ini terlebih dahulu sebelum menandai selesai');
  }
  const now = new Date();
  // startedAt is set when the action starts, completedAt when it's done; the other date is left as it was.
  const startedAt = status === 'IN_PROGRESS' ? now : null;
  const completedAt = status === 'DONE' ? now : null;
  await db.query(
    `INSERT INTO "UserRecommendation" (id, "userId", "recommendationId", status, "startedAt", "completedAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT ("userId", "recommendationId") DO UPDATE
       SET status = EXCLUDED.status,
           "startedAt" = COALESCE(EXCLUDED."startedAt", "UserRecommendation"."startedAt"),
           "completedAt" = COALESCE(EXCLUDED."completedAt", "UserRecommendation"."completedAt"),
           "updatedAt" = NOW()`,
    [db.newId(), userId, id, status, startedAt, completedAt],
  );
  const newlyEarned = status === 'DONE' ? await evaluateAchievements(userId) : [];
  return { recommendation: await get(userId, id), newlyEarned };
}

module.exports = { list, get, setStatus };
