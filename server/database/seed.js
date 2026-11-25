// Mengisi data awal: faktor emisi, rekomendasi, tantangan, reward, dan satu akun demo. Memakai raw query (pg).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const { factors } = require('./data/factors');
const { recommendations, challenges, achievements } = require('./data/content');
const { calculate } = require('../src/services/calculator/calculator.service');
const { todayKey, addDaysKey, dayKeyToDate } = require('../src/utils/time');

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

// Insert, or update the existing row with the same key/slug (so the seed can be run again safely).
async function seedReference() {
  for (const f of factors) {
    await db.query(
      `INSERT INTO "EmissionFactor" (id, key, "activityType", name, "inputUnit", value, source, year, status, notes, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (key) DO UPDATE SET "activityType" = EXCLUDED."activityType", name = EXCLUDED.name, "inputUnit" = EXCLUDED."inputUnit",
         value = EXCLUDED.value, source = EXCLUDED.source, year = EXCLUDED.year, status = EXCLUDED.status, notes = EXCLUDED.notes, "updatedAt" = NOW()`,
      [db.newId(), f.key, f.activityType, db.json(f.name), f.inputUnit, f.value, f.source, f.year ?? null, f.status, f.notes ?? null],
    );
  }
  for (const r of recommendations) {
    await db.query(
      `INSERT INTO "Recommendation" (id, slug, "activityType", content, "reductionKgPerMonth", image, icon, "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET "activityType" = EXCLUDED."activityType", content = EXCLUDED.content,
         "reductionKgPerMonth" = EXCLUDED."reductionKgPerMonth", image = EXCLUDED.image, icon = EXCLUDED.icon, "sortOrder" = EXCLUDED."sortOrder"`,
      [db.newId(), r.slug, r.activityType, db.json(r.content), r.reductionKgPerMonth, r.image ?? null, r.icon, r.sortOrder ?? 0],
    );
  }
  for (const ch of challenges) {
    await db.query(
      `INSERT INTO "GreenChallenge" (id, slug, "activityType", content, target, "periodDays", "rewardPoints", "reductionKgPerCheckin", icon, "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO UPDATE SET "activityType" = EXCLUDED."activityType", content = EXCLUDED.content, target = EXCLUDED.target,
         "periodDays" = EXCLUDED."periodDays", "rewardPoints" = EXCLUDED."rewardPoints", "reductionKgPerCheckin" = EXCLUDED."reductionKgPerCheckin",
         icon = EXCLUDED.icon, "sortOrder" = EXCLUDED."sortOrder"`,
      [db.newId(), ch.slug, ch.activityType, db.json(ch.content), ch.target, ch.periodDays, ch.rewardPoints, ch.reductionKgPerCheckin, ch.icon, ch.sortOrder ?? 0],
    );
  }
  for (const a of achievements) {
    await db.query(
      `INSERT INTO "Achievement" (id, slug, content, rule, threshold, image, icon, "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, rule = EXCLUDED.rule, threshold = EXCLUDED.threshold,
         image = EXCLUDED.image, icon = EXCLUDED.icon, "sortOrder" = EXCLUDED."sortOrder"`,
      [db.newId(), a.slug, db.json(a.content), a.rule, a.threshold, a.image ?? null, a.icon, a.sortOrder ?? 0],
    );
  }
}

async function seedDemoUser() {
  const existing = await db.one('SELECT id FROM "User" WHERE email = $1', [DEMO_EMAIL]);
  if (existing) return console.log(`Demo user already exists (${DEMO_EMAIL}), skipping demo data.`);
  const user = await db.one(
    'INSERT INTO "User" (id, name, email, age, "passwordHash", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
    [db.newId(), 'Nazuwan', DEMO_EMAIL, 21, await bcrypt.hash(DEMO_PASSWORD, 12)],
  );
  if (process.env.SEED_DEMO_HISTORY === 'false') return console.log(`Demo user created without history: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  const map = Object.fromEntries((await db.query('SELECT * FROM "EmissionFactor"')).map((f) => [f.key, f]));
  const today = todayKey();
  for (const [offset, slug, sub, inputs] of DEMO_ACTIVITIES) {
    const r = calculate(slug, sub, { ...inputs, activityDate: addDaysKey(today, offset) }, map);
    await db.query(
      `INSERT INTO "Calculation" (id, "userId", "activityType", "impactCategory", "subType", "itemName", inputs, quantity, unit, "factorId",
         "factorKey", "factorValue", "factorUnit", "factorStatus", breakdown, "periodDays", "resultKg", "activityDate", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())`,
      [
        db.newId(), user.id, r.activityType, r.impactCategory, r.subType, db.json(r.itemName), db.json(r.inputs), r.quantity, r.unit, r.factor.id,
        r.factor.key, r.factor.value, `${r.factor.outputUnit}/${r.factor.inputUnit}`, r.factor.status, db.json(r.breakdown),
        r.periodDays, r.resultKg, dayKeyToDate(r.activityDate),
      ],
    );
  }
  const recs = await db.query(
    'SELECT id, slug FROM "Recommendation" WHERE slug = ANY($1)',
    [['kurangi-penggunaan-listrik', 'jalan-kaki-bersepeda', 'gunakan-transportasi-umum']],
  );
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  for (const r of recs) {
    const done = r.slug !== 'gunakan-transportasi-umum';
    await db.query(
      `INSERT INTO "UserRecommendation" (id, "userId", "recommendationId", status, "startedAt", "completedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [db.newId(), user.id, r.id, done ? 'DONE' : 'IN_PROGRESS', daysAgo(6), done ? daysAgo(2) : null],
    );
  }
  const ch = await db.one('SELECT id FROM "GreenChallenge" WHERE slug = $1', ['transportasi-umum-2x']);
  await db.query(
    'INSERT INTO "UserChallenge" (id, "userId", "challengeId", progress, "joinedAt", "lastCheckinAt") VALUES ($1, $2, $3, 1, $4, $5)',
    [db.newId(), user.id, ch.id, daysAgo(2), daysAgo(1.5)],
  );
  const first = await db.one('SELECT id FROM "Achievement" WHERE slug = $1', ['langkah-pertama']);
  await db.query('INSERT INTO "UserAchievement" (id, "userId", "achievementId") VALUES ($1, $2, $3)', [db.newId(), user.id, first.id]);
  console.log(`Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seedReference()
  .then(seedDemoUser)
  .then(() => console.log('Seed completed.'))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.pool.end());
