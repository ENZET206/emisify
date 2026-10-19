--
-- PostgreSQL database dump
--


-- Dumped from database version 15.19 (Debian 15.19-0+deb12u1)
-- Dumped by pg_dump version 15.19 (Debian 15.19-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AchievementRule; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AchievementRule" AS ENUM (
    'CALCULATIONS_COUNT',
    'ACTIONS_COMPLETED',
    'REDUCTION_KG',
    'CHALLENGES_COMPLETED'
);


--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityType" AS ENUM (
    'TRANSPORT',
    'ELECTRICITY',
    'AC',
    'ELECTRONICS'
);


--
-- Name: FactorStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FactorStatus" AS ENUM (
    'DEMO',
    'ESTIMATE',
    'VALIDATED'
);


--
-- Name: ImpactCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ImpactCategory" AS ENUM (
    'VEHICLE',
    'ENERGY',
    'ELECTRONICS'
);


--
-- Name: UserChallengeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserChallengeStatus" AS ENUM (
    'JOINED',
    'COMPLETED'
);


--
-- Name: UserRecommendationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRecommendationStatus" AS ENUM (
    'SAVED',
    'IN_PROGRESS',
    'DONE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Achievement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Achievement" (
    id text NOT NULL,
    slug text NOT NULL,
    content jsonb NOT NULL,
    rule public."AchievementRule" NOT NULL,
    threshold double precision NOT NULL,
    image text,
    icon text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: AiMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiMessage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "recommendationId" text,
    role text NOT NULL,
    content text NOT NULL,
    mode text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Calculation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Calculation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    "impactCategory" public."ImpactCategory" NOT NULL,
    "subType" text NOT NULL,
    "itemName" jsonb NOT NULL,
    inputs jsonb NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    "factorId" text,
    "factorKey" text NOT NULL,
    "factorValue" double precision NOT NULL,
    "factorUnit" text NOT NULL,
    "factorStatus" public."FactorStatus" NOT NULL,
    breakdown jsonb NOT NULL,
    "periodDays" integer NOT NULL,
    "resultKg" double precision NOT NULL,
    "activityDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmissionFactor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmissionFactor" (
    id text NOT NULL,
    key text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    name jsonb NOT NULL,
    "inputUnit" text NOT NULL,
    "outputUnit" text DEFAULT 'kg CO2e'::text NOT NULL,
    value double precision NOT NULL,
    source text NOT NULL,
    year integer,
    status public."FactorStatus" DEFAULT 'DEMO'::public."FactorStatus" NOT NULL,
    notes text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GreenChallenge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GreenChallenge" (
    id text NOT NULL,
    slug text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    content jsonb NOT NULL,
    target integer NOT NULL,
    "periodDays" integer NOT NULL,
    "rewardPoints" integer NOT NULL,
    "reductionKgPerCheckin" double precision NOT NULL,
    icon text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Recommendation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Recommendation" (
    id text NOT NULL,
    slug text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    content jsonb NOT NULL,
    "reductionKgPerMonth" double precision NOT NULL,
    image text,
    icon text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    age integer,
    "passwordHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "googleId" text,
    "monthlyTargetKg" double precision,
    "tokenVersion" integer DEFAULT 0 NOT NULL
);


--
-- Name: UserAchievement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserAchievement" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "achievementId" text NOT NULL,
    "earnedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: UserChallenge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserChallenge" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "challengeId" text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status public."UserChallengeStatus" DEFAULT 'JOINED'::public."UserChallengeStatus" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastCheckinAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone
);


--
-- Name: UserRecommendation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRecommendation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "recommendationId" text NOT NULL,
    status public."UserRecommendationStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Achievement Achievement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY (id);


--
-- Name: AiMessage AiMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiMessage"
    ADD CONSTRAINT "AiMessage_pkey" PRIMARY KEY (id);


--
-- Name: Calculation Calculation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Calculation"
    ADD CONSTRAINT "Calculation_pkey" PRIMARY KEY (id);


--
-- Name: EmissionFactor EmissionFactor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmissionFactor"
    ADD CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY (id);


--
-- Name: GreenChallenge GreenChallenge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GreenChallenge"
    ADD CONSTRAINT "GreenChallenge_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: Recommendation Recommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Recommendation"
    ADD CONSTRAINT "Recommendation_pkey" PRIMARY KEY (id);


--
-- Name: UserAchievement UserAchievement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserAchievement"
    ADD CONSTRAINT "UserAchievement_pkey" PRIMARY KEY (id);


--
-- Name: UserChallenge UserChallenge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserChallenge"
    ADD CONSTRAINT "UserChallenge_pkey" PRIMARY KEY (id);


--
-- Name: UserRecommendation UserRecommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRecommendation"
    ADD CONSTRAINT "UserRecommendation_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Achievement_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Achievement_slug_key" ON public."Achievement" USING btree (slug);


--
-- Name: AiMessage_userId_recommendationId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiMessage_userId_recommendationId_createdAt_idx" ON public."AiMessage" USING btree ("userId", "recommendationId", "createdAt");


--
-- Name: Calculation_userId_activityDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Calculation_userId_activityDate_idx" ON public."Calculation" USING btree ("userId", "activityDate");


--
-- Name: Calculation_userId_activityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Calculation_userId_activityType_idx" ON public."Calculation" USING btree ("userId", "activityType");


--
-- Name: EmissionFactor_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmissionFactor_key_key" ON public."EmissionFactor" USING btree (key);


--
-- Name: GreenChallenge_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GreenChallenge_slug_key" ON public."GreenChallenge" USING btree (slug);


--
-- Name: PasswordResetToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON public."PasswordResetToken" USING btree ("tokenHash");


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: Recommendation_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Recommendation_slug_key" ON public."Recommendation" USING btree (slug);


--
-- Name: UserAchievement_userId_achievementId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON public."UserAchievement" USING btree ("userId", "achievementId");


--
-- Name: UserChallenge_userId_challengeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON public."UserChallenge" USING btree ("userId", "challengeId");


--
-- Name: UserRecommendation_userId_recommendationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserRecommendation_userId_recommendationId_key" ON public."UserRecommendation" USING btree ("userId", "recommendationId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: AiMessage AiMessage_recommendationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiMessage"
    ADD CONSTRAINT "AiMessage_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES public."Recommendation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiMessage AiMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiMessage"
    ADD CONSTRAINT "AiMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Calculation Calculation_factorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Calculation"
    ADD CONSTRAINT "Calculation_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES public."EmissionFactor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Calculation Calculation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Calculation"
    ADD CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserAchievement UserAchievement_achievementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserAchievement"
    ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES public."Achievement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserAchievement UserAchievement_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserAchievement"
    ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserChallenge UserChallenge_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserChallenge"
    ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public."GreenChallenge"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserChallenge UserChallenge_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserChallenge"
    ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRecommendation UserRecommendation_recommendationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRecommendation"
    ADD CONSTRAINT "UserRecommendation_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES public."Recommendation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRecommendation UserRecommendation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRecommendation"
    ADD CONSTRAINT "UserRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


