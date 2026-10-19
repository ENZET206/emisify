const { ok } = require('../utils/http');
const ai = require('../services/ai/ai.service');
const v = require('../validators/app.validator');

exports.status = async (req, res) => ok(res, ai.status());
exports.history = async (req, res) => ok(res, { messages: await ai.history(req.user.id, req.query.recommendationId || null) });
exports.clear = async (req, res) => {
  await ai.clear(req.user.id, req.query.recommendationId || null);
  return ok(res, { cleared: true });
};

exports.chat = async (req, res) => {
  const body = v.aiChat.parse(req.body);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
    Connection: 'keep-alive',
  });
  const emit = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  try {
    await ai.chat(req.user.id, body, emit);
  } catch (err) {
    console.error('[ai] chat failed:', err.message);
    emit({ type: 'error', message: err.status === 404 ? 'not_found' : 'failed' });
  }
  res.end();
};
