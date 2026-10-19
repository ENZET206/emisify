const BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error || {};
    throw new ApiError(res.status, err.code || 'UNKNOWN', err.message || json?.detail || 'Request failed', err.details);
  }
  return json.data;
}

export const api = {
  get: (p, o) => request(p, o),
  post: (p, body) => request(p, { method: 'POST', body: body ?? {} }),
  patch: (p, body) => request(p, { method: 'PATCH', body: body ?? {} }),
  del: (p) => request(p, { method: 'DELETE' }),
};

// Streams Server-Sent Events from POST /api/ai/chat and calls onEvent for each parsed event.
export async function streamChat(body, onEvent, signal) {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.error?.code || 'AI_ERROR', json?.error?.message || 'AI request failed');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, idx).replace(/^data:\s*/, '');
      buffer = buffer.slice(idx + 2);
      if (line) onEvent(JSON.parse(line));
    }
  }
}
