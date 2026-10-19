const prisma = require('../config/prisma');
const env = require('../config/env');
const { AppError } = require('../utils/http');
const { evaluateAchievements } = require('./progress.service');

const DAY = 86400000;

function shape(c, uc, now = Date.now()) {
  let state = 'NOT_JOINED';
  let endsAt = null;
  let nextCheckinAt = null;
  if (uc) {
    endsAt = new Date(new Date(uc.joinedAt).getTime() + c.periodDays * DAY);
    if (uc.status === 'COMPLETED') state = 'COMPLETED';
    else if (now > endsAt.getTime()) state = 'EXPIRED';
    else state = 'JOINED';
    if (state === 'JOINED' && uc.lastCheckinAt) {
      const next = new Date(uc.lastCheckinAt).getTime() + env.challengeCooldownHours * 3600000;
      if (next > now) nextCheckinAt = new Date(next);
    }
  }
  return {
    id: c.id, slug: c.slug, activityType: c.activityType, content: c.content, target: c.target, periodDays: c.periodDays,
    rewardPoints: c.rewardPoints, reductionKgPerCheckin: c.reductionKgPerCheckin, icon: c.icon,
    state, progress: uc?.progress || 0, joinedAt: uc?.joinedAt || null, completedAt: uc?.completedAt || null, endsAt, nextCheckinAt,
  };
}

async function list(userId) {
  const [all, mine] = await Promise.all([
    prisma.greenChallenge.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.userChallenge.findMany({ where: { userId } }),
  ]);
  const byId = Object.fromEntries(mine.map((m) => [m.challengeId, m]));
  return all.map((c) => shape(c, byId[c.id]));
}

async function load(userId, id) {
  const c = await prisma.greenChallenge.findFirst({ where: { id, active: true } });
  if (!c) throw new AppError(404, 'NOT_FOUND', 'Tantangan tidak ditemukan');
  const uc = await prisma.userChallenge.findUnique({ where: { userId_challengeId: { userId, challengeId: id } } });
  return { c, uc };
}

async function join(userId, id) {
  const { c, uc } = await load(userId, id);
  const s = uc && shape(c, uc);
  if (s?.state === 'COMPLETED') throw new AppError(409, 'ALREADY_COMPLETED', 'Tantangan ini sudah kamu selesaikan');
  if (s?.state === 'JOINED') throw new AppError(409, 'ALREADY_JOINED', 'Kamu sudah mengikuti tantangan ini');
  const data = { progress: 0, status: 'JOINED', joinedAt: new Date(), lastCheckinAt: null, completedAt: null };
  const saved = await prisma.userChallenge.upsert({
    where: { userId_challengeId: { userId, challengeId: id } },
    create: { userId, challengeId: id, ...data },
    update: data,
  });
  return shape(c, saved);
}

// One check-in per cooldown window; completion happens only when progress reaches the target.
async function checkin(userId, id) {
  const { c, uc } = await load(userId, id);
  if (!uc) throw new AppError(409, 'NOT_JOINED', 'Ikuti tantangan ini terlebih dahulu');
  const s = shape(c, uc);
  if (s.state === 'COMPLETED') throw new AppError(409, 'ALREADY_COMPLETED', 'Tantangan ini sudah selesai');
  if (s.state === 'EXPIRED') throw new AppError(409, 'EXPIRED', 'Periode tantangan sudah berakhir. Ikuti ulang untuk memulai lagi.');
  if (s.nextCheckinAt) throw new AppError(429, 'CHECKIN_COOLDOWN', 'Kamu sudah mencatat progres. Coba lagi nanti.', { nextCheckinAt: s.nextCheckinAt });
  const progress = uc.progress + 1;
  const done = progress >= c.target;
  const saved = await prisma.userChallenge.update({
    where: { id: uc.id },
    data: { progress, lastCheckinAt: new Date(), ...(done ? { status: 'COMPLETED', completedAt: new Date() } : {}) },
  });
  const newlyEarned = await evaluateAchievements(userId);
  return { challenge: shape(c, saved), completed: done, newlyEarned };
}

module.exports = { list, join, checkin };
