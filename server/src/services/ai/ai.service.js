const prisma = require('../../config/prisma');
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
  const rows = await prisma.calculation.groupBy({
    by: ['activityType'],
    where: { userId, activityDate: { gte: dayKeyToDate(addDaysKey(todayKey(), -29)) } },
    _sum: { resultKg: true },
  });
  if (!rows.length) return { prompt: 'no calculations recorded yet', summary: null };
  const sorted = rows.sort((a, b) => b._sum.resultKg - a._sum.resultKg);
  const total = sorted.reduce((s, r) => s + r._sum.resultKg, 0);
  const prompt = sorted.map((r) => `${LABELS[r.activityType][1]} ${r._sum.resultKg.toFixed(1)} kg CO2e`).join(', ') + `; total ${total.toFixed(1)} kg CO2e`;
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
  const r = await prisma.recommendation.findUnique({ where: { id } });
  if (!r) throw new AppError(404, 'NOT_FOUND', 'Rekomendasi tidak ditemukan');
  const c = r.content[lang] || r.content.id;
  return { id: r.id, title: c.title, description: c.reason, assumption: c.assumption, reductionKgPerMonth: r.reductionKgPerMonth };
}

async function history(userId, recommendationId) {
  const rows = await prisma.aiMessage.findMany({
    where: { userId, recommendationId: recommendationId || null },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  return rows.reverse().map((m) => ({ id: m.id, role: m.role, content: m.content, mode: m.mode, createdAt: m.createdAt }));
}

async function clear(userId, recommendationId) {
  await prisma.aiMessage.deleteMany({ where: { userId, recommendationId: recommendationId || null } });
}

// Streams the answer through `emit(event)`; falls back to demo mode if the live provider fails before any text.
async function chat(userId, { message, recommendationId, lang }, emit) {
  const recommendation = await recommendationContext(recommendationId, lang);
  const ctx = await userContext(userId);
  const past = (await history(userId, recommendation?.id)).slice(-10).map((m) => ({ role: m.role, content: m.content }));
  await prisma.aiMessage.create({ data: { userId, recommendationId: recommendation?.id || null, role: 'user', content: message, mode: 'user' } });

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
  const saved = await prisma.aiMessage.create({
    data: { userId, recommendationId: recommendation?.id || null, role: 'assistant', content: answer || '…', mode },
  });
  emit({ type: 'done', id: saved.id, mode });
}

module.exports = { chat, history, clear, status };
