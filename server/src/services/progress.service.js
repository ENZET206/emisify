const db = require('../config/db');
const { round, TREE_KG_PER_YEAR } = require('./calculator/calculator.service');

async function computeStats(userId) {
  // Each row also carries its joined recommendation / challenge as a nested object (row_to_json).
  const [recs, challenges, countRow] = await Promise.all([
    db.query(
      `SELECT ur.*, row_to_json(r) AS recommendation
       FROM "UserRecommendation" ur JOIN "Recommendation" r ON r.id = ur."recommendationId"
       WHERE ur."userId" = $1`,
      [userId],
    ),
    db.query(
      `SELECT uc.*, row_to_json(gc) AS challenge
       FROM "UserChallenge" uc JOIN "GreenChallenge" gc ON gc.id = uc."challengeId"
       WHERE uc."userId" = $1`,
      [userId],
    ),
    db.one('SELECT COUNT(*)::int AS count FROM "Calculation" WHERE "userId" = $1', [userId]),
  ]);
  const calculationsCount = countRow.count;
  const startedRecs = recs.filter((r) => r.status !== 'SAVED');
  const doneRecs = recs.filter((r) => r.status === 'DONE');
  const doneChallenges = challenges.filter((c) => c.status === 'COMPLETED');
  const reductionKg = doneRecs.reduce((s, r) => s + r.recommendation.reductionKgPerMonth, 0)
    + challenges.reduce((s, c) => s + c.progress * c.challenge.reductionKgPerCheckin, 0);
  return {
    recs,
    challenges,
    calculationsCount,
    actionsStarted: startedRecs.length + challenges.length,
    actionsCompleted: doneRecs.length + doneChallenges.length,
    challengesCompleted: doneChallenges.length,
    reductionKg: round(reductionKg, 2),
  };
}

const ruleValue = (rule, s) => ({
  CALCULATIONS_COUNT: s.calculationsCount,
  ACTIONS_COMPLETED: s.actionsCompleted,
  REDUCTION_KG: s.reductionKg,
  CHALLENGES_COMPLETED: s.challengesCompleted,
}[rule]);

// Awards only achievements whose rule threshold is met by stored data.
async function evaluateAchievements(userId, stats) {
  const s = stats || (await computeStats(userId));
  const [all, earned] = await Promise.all([
    db.query('SELECT * FROM "Achievement"'),
    db.query('SELECT "achievementId" FROM "UserAchievement" WHERE "userId" = $1', [userId]),
  ]);
  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const newly = all.filter((a) => !earnedIds.has(a.id) && ruleValue(a.rule, s) >= a.threshold);
  for (const a of newly) {
    await db.query(
      `INSERT INTO "UserAchievement" (id, "userId", "achievementId") VALUES ($1, $2, $3)
       ON CONFLICT ("userId", "achievementId") DO NOTHING`,
      [db.newId(), userId, a.id],
    );
  }
  return newly.map((a) => ({ id: a.id, slug: a.slug, content: a.content, image: a.image, icon: a.icon }));
}

async function getProgress(userId) {
  const stats = await computeStats(userId);
  const newlyEarned = await evaluateAchievements(userId, stats);
  const [achievements, earned] = await Promise.all([
    db.query('SELECT * FROM "Achievement" ORDER BY "sortOrder" ASC'),
    db.query('SELECT * FROM "UserAchievement" WHERE "userId" = $1', [userId]),
  ]);
  const earnedMap = Object.fromEntries(earned.map((e) => [e.achievementId, e.earnedAt]));
  const actions = [
    ...stats.recs.filter((r) => r.status !== 'SAVED').map((r) => ({
      kind: 'recommendation', id: r.recommendationId, content: r.recommendation.content, icon: r.recommendation.icon,
      status: r.status === 'DONE' ? 'DONE' : 'IN_PROGRESS', date: r.completedAt || r.startedAt || r.updatedAt,
    })),
    ...stats.challenges.map((c) => ({
      kind: 'challenge', id: c.challengeId, content: c.challenge.content, icon: c.challenge.icon,
      status: c.status === 'COMPLETED' ? 'DONE' : 'IN_PROGRESS', date: c.completedAt || c.joinedAt,
      progress: c.progress, target: c.challenge.target,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    actionsStarted: stats.actionsStarted,
    actionsCompleted: stats.actionsCompleted,
    completionPct: stats.actionsStarted ? Math.round((stats.actionsCompleted / stats.actionsStarted) * 100) : 0,
    reductionKg: stats.reductionKg,
    treesEquivalentMonth: round(stats.reductionKg / (TREE_KG_PER_YEAR / 12), 1),
    calculationsCount: stats.calculationsCount,
    challengesCompleted: stats.challengesCompleted,
    actions,
    achievements: achievements.map((a) => ({
      id: a.id, slug: a.slug, content: a.content, image: a.image, icon: a.icon, rule: a.rule, threshold: a.threshold,
      current: ruleValue(a.rule, stats), earned: Boolean(earnedMap[a.id]), earnedAt: earnedMap[a.id] || null,
    })),
    newlyEarned,
  };
}

module.exports = { computeStats, evaluateAchievements, getProgress };
