const env = require('../../../config/env');

// Reads an SSE response body and yields the `text` of each `delta` event.
async function* readSse(body, pick) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
      if (!data || data === '[DONE]') continue;
      const text = pick(JSON.parse(data));
      if (text) yield text;
    }
  }
}

// Emergent bridge: small Python service that holds the Emergent Universal Key.
const emergent = {
  name: 'emergent',
  isConfigured: () => Boolean(env.ai.bridgeUrl && env.ai.bridgeToken),
  async *stream({ system, history, message }) {
    const res = await fetch(env.ai.bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': env.ai.bridgeToken },
      body: JSON.stringify({ system, history, message, model: env.ai.model || 'claude-sonnet-5-5', provider: 'anthropic' }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok || !res.body) throw new Error(`AI bridge error ${res.status}`);
    yield* readSse(res.body, (d) => {
      if (d.type === 'error') throw new Error(d.message || 'AI bridge stream error');
      return d.type === 'delta' ? d.text : '';
    });
  },
};

// Any OpenAI-compatible Chat Completions endpoint (OpenAI, OpenRouter, Groq, etc.).
const openai = {
  name: 'openai',
  isConfigured: () => Boolean(env.ai.apiKey && env.ai.model),
  async *stream({ system, history, message }) {
    const res = await fetch(`${env.ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.ai.apiKey}` },
      body: JSON.stringify({
        model: env.ai.model,
        stream: true,
        max_tokens: 600,
        messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok || !res.body) throw new Error(`AI provider error ${res.status}`);
    yield* readSse(res.body, (d) => d.choices?.[0]?.delta?.content || '');
  },
};

module.exports = { emergent, openai };
