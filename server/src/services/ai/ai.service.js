const db = require('../../config/db');
const env = require('../../config/env');
const { AppError } = require('../../utils/http');
const { buildSystemPrompt } = require('./prompt');
const demo = require('./providers/demo.provider');
const { emergent, openai } = require('./providers/live.providers');
const { dayKeyToDate, addDaysKey, todayKey } = require('../../utils/time');

const LIVE = { emergent, openai };

function activeProvider() {
  const p = LIVE[env.ai.provider];
  return p && p.isConfigured() ? p : null;
}

function status() {
  const p = activeProvider();
  return { mode: p ? 'live' : 'demo', provider: p ? p.name : 'demo', model: p ? env.ai.model || null : null };
}

const LABELS = { TRANSPORT: ['transportasi', 'transport'], ELECTRICITY: ['listrik', 'electricity'], AC: ['AC', 'AC'], ELECTRONICS: ['elektronik', 'electronics'] };

async function userContext(userId) {
  const rows = await db.query(
    `SELECT "activityType", SUM("resultKg") AS kg FROM "Calculation"
     WHERE "userId" = $1 AND "activityDate" >= $2 GROUP BY "activityType"`,
    [userId, dayKeyToDate(addDaysKey(todayKey(), -29))],
  );
  if (!rows.length) return { prompt: 'no calculations recorded yet', summary: null };
  const sorted = rows.sort((a, b) => b.kg - a.kg);
  const total = sorted.reduce((s, r) => s + r.kg, 0);
  const prompt = sorted.map((r) => `${LABELS[r.activityType][1]} ${r.kg.toFixed(1)} kg CO2e`).join(', ') + `; total ${total.toFixed(1)} kg CO2e`;
  const top = LABELS[sorted[0].activityType];
  return {
    prompt,
    summary: {
      id: `Catatan dari datamu: dalam 30 hari terakhir total estimasimu ${total.toFixed(1).replace('.', ',')} kg CO2e, dengan ${top[0]} sebagai penyumbang terbesar.`,
      en: `From your data: your estimated total over the last 30 days is ${total.toFixed(1)} kg CO2e, with ${top[1]} as the biggest contributor.`,
    },
  };
}

async function recommendationContext(id, lang) {
  if (!id) return null;
  const r = await db.one('SELECT * FROM "Recommendation" WHERE id = $1', [id]);
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const c = r.content[lang] || r.content.id;
  return { id: r.id, title: c.title, description: c.reason, assumption: c.assumption, reductionKgPerMonth: r.reductionKgPerMonth };
}

async function history(userId, recommendationId) {
  // IS NOT DISTINCT FROM also matches NULL = NULL (the general chat has no recommendation).
  const rows = await db.query(
    `SELECT * FROM "AiMessage" WHERE "userId" = $1 AND "recommendationId" IS NOT DISTINCT FROM $2
     ORDER BY "createdAt" DESC LIMIT 40`,
    [userId, recommendationId || null],
  );
  return rows.reverse().map((m) => ({ id: m.id, role: m.role, content: m.content, mode: m.mode, createdAt: m.createdAt }));
}

const saveMessage = (userId, recommendationId, role, content, mode) => db.one(
  `INSERT INTO "AiMessage" (id, "userId", "recommendationId", role, content, mode)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
  [db.newId(), userId, recommendationId, role, content, mode],
);

async function clear(userId, recommendationId) {
  await db.query(
    'DELETE FROM "AiMessage" WHERE "userId" = $1 AND "recommendationId" IS NOT DISTINCT FROM $2',
    [userId, recommendationId || null],
  );
}

// Streams the answer through `emit(event)`; falls back to demo mode if the live provider fails before any text.
async function chat(userId, { message, recommendationId, lang }, emit) {
  const recommendation = await recommendationContext(recommendationId, lang);
  const ctx = await userContext(userId);
  const past = (await history(userId, recommendation?.id)).slice(-10).map((m) => ({ role: m.role, content: m.content }));
  await saveMessage(userId, recommendation?.id || null, 'user', message, 'user');

  const live = activeProvider();
  let mode = live ? 'live' : 'demo';
  let answer = '';
  const system = buildSystemPrompt({ lang, context: ctx.prompt, recommendation });

  emit({ type: 'meta', mode, provider: live ? live.name : 'demo' });
  if (live) {
    try {
      for await (const text of live.stream({ system, history: past, message })) {
        answer += text;
        emit({ type: 'delta', text });
      }
    } catch (err) {
      console.error('[ai] live provider failed:', err.message);
      if (answer) {
        emit({ type: 'error', message: 'stream_interrupted' });
      } else {
        mode = 'demo';
        emit({ type: 'meta', mode, provider: 'demo', fallback: true });
      }
    }
  }
  if (mode === 'demo') {
    for await (const text of demo.stream({ message, lang, contextSummary: ctx.summary, recommendation })) {
      answer += text;
      emit({ type: 'delta', text });
    }
  }
  const saved = await saveMessage(userId, recommendation?.id || null, 'assistant', answer || '…', mode);
  emit({ type: 'done', id: saved.id, mode });
}

module.exports = { chat, history, clear, status };
