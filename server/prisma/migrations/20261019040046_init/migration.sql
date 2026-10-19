-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS');

-- CreateEnum
CREATE TYPE "ImpactCategory" AS ENUM ('VEHICLE', 'ENERGY', 'ELECTRONICS');

-- CreateEnum
CREATE TYPE "FactorStatus" AS ENUM ('DEMO', 'ESTIMATE', 'VALIDATED');

-- CreateEnum
CREATE TYPE "UserRecommendationStatus" AS ENUM ('SAVED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "UserChallengeStatus" AS ENUM ('JOINED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AchievementRule" AS ENUM ('CALCULATIONS_COUNT', 'ACTIONS_COMPLETED', 'REDUCTION_KG', 'CHALLENGES_COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "name" JSONB NOT NULL,
    "inputUnit" TEXT NOT NULL,
    "outputUnit" TEXT NOT NULL DEFAULT 'kg CO2e',
    "value" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "year" INTEGER,
    "status" "FactorStatus" NOT NULL DEFAULT 'DEMO',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "impactCategory" "ImpactCategory" NOT NULL,
    "subType" TEXT NOT NULL,
    "itemName" JSONB NOT NULL,
    "inputs" JSONB NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "factorId" TEXT,
    "factorKey" TEXT NOT NULL,
    "factorValue" DOUBLE PRECISION NOT NULL,
    "factorUnit" TEXT NOT NULL,
    "factorStatus" "FactorStatus" NOT NULL,
    "breakdown" JSONB NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "resultKg" DOUBLE PRECISION NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "content" JSONB NOT NULL,
    "reductionKgPerMonth" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "status" "UserRecommendationStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreenChallenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "content" JSONB NOT NULL,
    "target" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "rewardPoints" INTEGER NOT NULL,
    "reductionKgPerCheckin" DOUBLE PRECISION NOT NULL,
    "icon" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GreenChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "UserChallengeStatus" NOT NULL DEFAULT 'JOINED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckinAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "rule" "AchievementRule" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionFactor_key_key" ON "EmissionFactor"("key");

-- CreateIndex
CREATE INDEX "Calculation_userId_activityDate_idx" ON "Calculation"("userId", "activityDate");

-- CreateIndex
CREATE INDEX "Calculation_userId_activityType_idx" ON "Calculation"("userId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_slug_key" ON "Recommendation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecommendation_userId_recommendationId_key" ON "UserRecommendation"("userId", "recommendationId");

-- CreateIndex
CREATE UNIQUE INDEX "GreenChallenge_slug_key" ON "GreenChallenge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "AiMessage_userId_recommendationId_createdAt_idx" ON "AiMessage"("userId", "recommendationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecommendation" ADD CONSTRAINT "UserRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecommendation" ADD CONSTRAINT "UserRecommendation_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "GreenChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
