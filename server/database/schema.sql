-- Struktur database Emisify (PostgreSQL 13+), ditulis dengan SQL biasa tanpa ORM.
-- Aman dijalankan berulang kali: tabel, tipe, dan index yang sudah ada dilewati.
-- Jalankan dengan: cd server && yarn db:init

-- ===== Tipe ENUM =====
DO $$ BEGIN CREATE TYPE "ActivityType" AS ENUM ('TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ImpactCategory" AS ENUM ('VEHICLE', 'ENERGY', 'ELECTRONICS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FactorStatus" AS ENUM ('DEMO', 'ESTIMATE', 'VALIDATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "UserRecommendationStatus" AS ENUM ('SAVED', 'IN_PROGRESS', 'DONE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "UserChallengeStatus" AS ENUM ('JOINED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AchievementRule" AS ENUM ('CALCULATIONS_COUNT', 'ACTIONS_COMPLETED', 'REDUCTION_KG', 'CHALLENGES_COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Pengguna =====
CREATE TABLE IF NOT EXISTS "User" (
    "id"              TEXT PRIMARY KEY,
    "name"            TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "age"             INTEGER,
    "passwordHash"    TEXT,                       -- NULL untuk akun yang hanya login lewat Google
    "googleId"        TEXT,
    "monthlyTargetKg" DOUBLE PRECISION,
    "tokenVersion"    INTEGER NOT NULL DEFAULT 0, -- naik 1 setiap ganti password: sesi lama jadi tidak berlaku
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id"        TEXT PRIMARY KEY,
    "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tokenHash" TEXT NOT NULL,                    -- SHA-256 dari token, token asli hanya ada di email
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- ===== Kalkulator emisi =====
CREATE TABLE IF NOT EXISTS "EmissionFactor" (
    "id"           TEXT PRIMARY KEY,
    "key"          TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "name"         JSONB NOT NULL,
    "inputUnit"    TEXT NOT NULL,
    "outputUnit"   TEXT NOT NULL DEFAULT 'kg CO2e',
    "value"        DOUBLE PRECISION NOT NULL,
    "source"       TEXT NOT NULL,
    "year"         INTEGER,
    "status"       "FactorStatus" NOT NULL DEFAULT 'DEMO',
    "notes"        TEXT,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmissionFactor_key_key" ON "EmissionFactor"("key");

CREATE TABLE IF NOT EXISTS "Calculation" (
    "id"             TEXT PRIMARY KEY,
    "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "activityType"   "ActivityType" NOT NULL,
    "impactCategory" "ImpactCategory" NOT NULL,
    "subType"        TEXT NOT NULL,
    "itemName"       JSONB NOT NULL,
    "inputs"         JSONB NOT NULL,
    "quantity"       DOUBLE PRECISION NOT NULL,
    "unit"           TEXT NOT NULL,
    "factorId"       TEXT REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "factorKey"      TEXT NOT NULL,
    "factorValue"    DOUBLE PRECISION NOT NULL,
    "factorUnit"     TEXT NOT NULL,
    "factorStatus"   "FactorStatus" NOT NULL,
    "breakdown"      JSONB NOT NULL,
    "periodDays"     INTEGER NOT NULL,
    "resultKg"       DOUBLE PRECISION NOT NULL,
    "activityDate"   TIMESTAMP(3) NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Calculation_userId_activityDate_idx" ON "Calculation"("userId", "activityDate");
CREATE INDEX IF NOT EXISTS "Calculation_userId_activityType_idx" ON "Calculation"("userId", "activityType");

-- ===== Rekomendasi =====
CREATE TABLE IF NOT EXISTS "Recommendation" (
    "id"                  TEXT PRIMARY KEY,
    "slug"                TEXT NOT NULL,
    "activityType"        "ActivityType" NOT NULL,
    "content"             JSONB NOT NULL,
    "reductionKgPerMonth" DOUBLE PRECISION NOT NULL,
    "image"               TEXT,
    "icon"                TEXT NOT NULL,
    "sortOrder"           INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "Recommendation_slug_key" ON "Recommendation"("slug");

CREATE TABLE IF NOT EXISTS "UserRecommendation" (
    "id"               TEXT PRIMARY KEY,
    "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "recommendationId" TEXT NOT NULL REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "status"           "UserRecommendationStatus" NOT NULL,
    "startedAt"        TIMESTAMP(3),
    "completedAt"      TIMESTAMP(3),
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserRecommendation_userId_recommendationId_key" ON "UserRecommendation"("userId", "recommendationId");

-- ===== Tantangan Hijau =====
CREATE TABLE IF NOT EXISTS "GreenChallenge" (
    "id"                    TEXT PRIMARY KEY,
    "slug"                  TEXT NOT NULL,
    "activityType"          "ActivityType" NOT NULL,
    "content"               JSONB NOT NULL,
    "target"                INTEGER NOT NULL,
    "periodDays"            INTEGER NOT NULL,
    "rewardPoints"          INTEGER NOT NULL,
    "reductionKgPerCheckin" DOUBLE PRECISION NOT NULL,
    "icon"                  TEXT NOT NULL,
    "active"                BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder"             INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "GreenChallenge_slug_key" ON "GreenChallenge"("slug");

CREATE TABLE IF NOT EXISTS "UserChallenge" (
    "id"            TEXT PRIMARY KEY,
    "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "challengeId"   TEXT NOT NULL REFERENCES "GreenChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "progress"      INTEGER NOT NULL DEFAULT 0,
    "status"        "UserChallengeStatus" NOT NULL DEFAULT 'JOINED',
    "joinedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckinAt" TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- ===== Reward =====
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id"        TEXT PRIMARY KEY,
    "slug"      TEXT NOT NULL,
    "content"   JSONB NOT NULL,
    "rule"      "AchievementRule" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "image"     TEXT,
    "icon"      TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_slug_key" ON "Achievement"("slug");

CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id"            TEXT PRIMARY KEY,
    "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "achievementId" TEXT NOT NULL REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "earnedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- ===== Tanya AI =====
CREATE TABLE IF NOT EXISTS "AiMessage" (
    "id"               TEXT PRIMARY KEY,
    "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "recommendationId" TEXT REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "role"             TEXT NOT NULL,
    "content"          TEXT NOT NULL,
    "mode"             TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AiMessage_userId_recommendationId_createdAt_idx" ON "AiMessage"("userId", "recommendationId", "createdAt");
