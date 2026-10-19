require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { factors } = require('./data/factors');
const { recommendations, challenges, achievements } = require('./data/content');
const { calculate } = require('../src/services/calculator/calculator.service');
const { todayKey, addDaysKey, dayKeyToDate } = require('../src/utils/time');

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL || 'demo@emisify.id';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Emisify123';

const DEMO_ACTIVITIES = [
  [0, 'transport', 'private', { vehicle: 'motor', fuel: 'pertalite', distanceKm: 18, frequency: 'daily', count: 5 }],
  [-2, 'electronics', 'laptop', { itemName: 'Laptop', watt: 50, hoursPerDay: 6, days: 30, lifespanYears: '3', condition: 'in_use' }],
  [-3, 'electronics', 'smartphone', { watt: 8, hoursPerDay: 3, days: 30, lifespanYears: '2', condition: 'in_use' }],
  [-4, 'ac', 'non_inverter', { pk: '1', units: 1, hoursPerDay: 6, days: 7 }],
  [-6, 'electricity', 'kwh', { kwh: 18, period: 'week' }],
  [-35, 'transport', 'public', { mode: 'train', distanceKm: 24, frequency: 'daily', count: 10 }],
  [-38, 'electricity', 'bill', { amount: 250000, tariff: 'r1_1300', period: 'month' }],
  [-40, 'electronics', 'headphone', { watt: 3, hoursPerDay: 4, days: 30, lifespanYears: '2', condition: 'in_use' }],
];

async function seedReference() {
  for (const f of factors) {
    await prisma.emissionFactor.upsert({ where: { key: f.key }, create: f, update: f });
  }
  for (const r of recommendations) await prisma.recommendation.upsert({ where: { slug: r.slug }, create: r, update: r });
  for (const ch of challenges) await prisma.greenChallenge.upsert({ where: { slug: ch.slug }, create: ch, update: ch });
  for (const a of achievements) await prisma.achievement.upsert({ where: { slug: a.slug }, create: a, update: a });
}

async function seedDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return console.log(`Demo user already exists (${DEMO_EMAIL}), skipping demo data.`);
  const user = await prisma.user.create({
    data: { name: 'Nazuwan', email: DEMO_EMAIL, age: 21, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12) },
  });
  if (process.env.SEED_DEMO_HISTORY === 'false') return console.log(`Demo user created without history: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  const map = Object.fromEntries((await prisma.emissionFactor.findMany()).map((f) => [f.key, f]));
  const today = todayKey();
  for (const [offset, slug, sub, inputs] of DEMO_ACTIVITIES) {
    const r = calculate(slug, sub, { ...inputs, activityDate: addDaysKey(today, offset) }, map);
    await prisma.calculation.create({
      data: {
        userId: user.id, activityType: r.activityType, impactCategory: r.impactCategory, subType: r.subType, itemName: r.itemName,
        inputs: r.inputs, quantity: r.quantity, unit: r.unit, factorId: r.factor.id, factorKey: r.factor.key, factorValue: r.factor.value,
        factorUnit: `${r.factor.outputUnit}/${r.factor.inputUnit}`, factorStatus: r.factor.status, breakdown: r.breakdown,
        periodDays: r.periodDays, resultKg: r.resultKg, activityDate: dayKeyToDate(r.activityDate),
      },
    });
  }
  const recs = await prisma.recommendation.findMany({ where: { slug: { in: ['kurangi-penggunaan-listrik', 'jalan-kaki-bersepeda', 'gunakan-transportasi-umum'] } } });
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  for (const r of recs) {
    const done = r.slug !== 'gunakan-transportasi-umum';
    await prisma.userRecommendation.create({
      data: { userId: user.id, recommendationId: r.id, status: done ? 'DONE' : 'IN_PROGRESS', startedAt: daysAgo(6), completedAt: done ? daysAgo(2) : null },
    });
  }
  const ch = await prisma.greenChallenge.findUnique({ where: { slug: 'transportasi-umum-2x' } });
  await prisma.userChallenge.create({ data: { userId: user.id, challengeId: ch.id, progress: 1, joinedAt: daysAgo(2), lastCheckinAt: daysAgo(1.5) } });
  const first = await prisma.achievement.findUnique({ where: { slug: 'langkah-pertama' } });
  await prisma.userAchievement.create({ data: { userId: user.id, achievementId: first.id } });
  console.log(`Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seedReference()
  .then(seedDemoUser)
  .then(() => console.log('Seed completed.'))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
