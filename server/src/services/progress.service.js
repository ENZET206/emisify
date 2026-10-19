const prisma = require('../config/prisma');
const { round, TREE_KG_PER_YEAR } = require('./calculator/calculator.service');

async function computeStats(userId) {
  const [recs, challenges, calculationsCount] = await Promise.all([
    prisma.userRecommendation.findMany({ where: { userId }, include: { recommendation: true } }),
    prisma.userChallenge.findMany({ where: { userId }, include: { challenge: true } }),
    prisma.calculation.count({ where: { userId } }),
  ]);
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
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);
  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const newly = all.filter((a) => !earnedIds.has(a.id) && ruleValue(a.rule, s) >= a.threshold);
  if (newly.length) {
    await prisma.userAchievement.createMany({ data: newly.map((a) => ({ userId, achievementId: a.id })), skipDuplicates: true });
  }
  return newly.map((a) => ({ id: a.id, slug: a.slug, content: a.content, image: a.image, icon: a.icon }));
}

async function getProgress(userId) {
  const stats = await computeStats(userId);
  const newlyEarned = await evaluateAchievements(userId, stats);
  const [achievements, earned] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.userAchievement.findMany({ where: { userId } }),
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
