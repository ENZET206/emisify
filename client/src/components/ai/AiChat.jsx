import { Fragment, useEffect, useRef, useState } from 'react';
import { SendHorizontal, Sparkles, RotateCcw, Trash2, FlaskConical, Bot } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { api, streamChat } from '../../services/api';
import { errorMessage } from '../../utils/format';

// Minimal safe markdown: **bold** and "-"/"•" bullet lines.
function RichText({ text }) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const bullet = /^\s*([-•*])\s+/.test(line);
    const parts = line.replace(/^\s*([-•*])\s+/, '').split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : <Fragment key={j}>{p}</Fragment>));
    if (!line.trim()) return <span key={i} className="block h-2" />;
    return <span key={i} className={`block ${bullet ? 'relative pl-4 before:absolute before:left-0 before:top-[.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-burnt' : ''}`}>{parts}</span>;
  });
}

function ModeBadge({ mode }) {
  const { t } = useLang();
  if (!mode) return null;
  return mode === 'live'
    ? <span data-testid="ai-mode-badge" className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-forest"><Sparkles className="h-3 w-3" aria-hidden />{t('ai.live')}</span>
    : <span data-testid="ai-mode-badge" className="inline-flex items-center gap-1 rounded-full bg-[#F6E7C8] px-2.5 py-1 text-[11px] font-bold text-warning"><FlaskConical className="h-3 w-3" aria-hidden />{t('ai.demo')}</span>;
}

export function AiChat({ recommendationId, topic, compact }) {
  const { t, lang } = useLang();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scroller = useRef(null);
  const q = recommendationId ? `?recommendationId=${recommendationId}` : '';

  useEffect(() => {
    Promise.all([api.get(`/ai/history${q}`), api.get('/ai/status')])
      .then(([h, s]) => { setMessages(h.messages); setStatus(s); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [q]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const ask = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setFailed(null);
    setBusy(true);
    const botId = `b-${Date.now()}`;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: message }, { id: botId, role: 'assistant', content: '', mode: null, pending: true }]);
    const patch = (fn) => setMessages((m) => m.map((x) => (x.id === botId ? fn(x) : x)));
    try {
      await streamChat({ message, recommendationId: recommendationId || null, lang }, (ev) => {
        if (ev.type === 'meta') patch((x) => ({ ...x, mode: ev.mode, fallback: ev.fallback }));
        if (ev.type === 'delta') patch((x) => ({ ...x, content: x.content + ev.text }));
        if (ev.type === 'done') patch((x) => ({ ...x, pending: false, id: ev.id }));
        if (ev.type === 'error') throw new Error(ev.message);
      });
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== botId || x.content));
      patch((x) => ({ ...x, pending: false }));
      setFailed({ message, text: err.code === 'RATE_LIMITED' ? t('ai.rateLimited') : t('ai.error') });
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    try { await api.del(`/ai/history${q}`); setMessages([]); toast.info(t('ai.cleared')); } catch (err) { toast.error(errorMessage(err, t)); }
  };

  const suggestions = [t('ai.q1'), t('ai.q2'), t('ai.q3')];
  return (
    <section className="flex flex-col overflow-hidden rounded-[2rem] border border-forest/15 bg-white shadow-soft" data-testid="ai-chat">
      <header className="flex flex-wrap items-center gap-3 border-b border-line/70 bg-mint/60 px-5 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-[1rem_1rem_1rem_.3rem] bg-forest text-white"><Bot className="h-5 w-5" aria-hidden /></span>
        <div className="flex-1"><p className="font-bold">{t('ai.title')}</p><p className="text-xs text-muted">{t('ai.assistantName')}</p></div>
        <ModeBadge mode={status?.mode} />
        {messages.length > 0 && <button type="button" onClick={clear} aria-label={t('ai.clear')} data-testid="ai-clear-button" className="rounded-full p-2 text-muted hover:bg-white hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
      </header>
      {status?.mode === 'demo' && <p className="border-b border-line/70 bg-[#FBF3E3] px-5 py-2 text-xs text-warning" data-testid="ai-demo-notice">{t('ai.demoNote')}</p>}
      <div ref={scroller} className={`space-y-4 overflow-y-auto px-4 py-5 sm:px-5 ${compact ? 'max-h-[26rem] min-h-[14rem]' : 'h-[min(60dvh,34rem)]'}`} aria-live="polite" data-testid="ai-messages">
        {loaded && messages.length === 0 && (
          <div className="flex flex-col items-start gap-2" data-testid="ai-empty">
            <p className="font-semibold">{t('ai.empty')}</p>
            <p className="text-sm text-muted">{t('ai.emptyBody')}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => <button key={s} type="button" onClick={() => ask(s)} data-testid={`ai-suggestion-${i}`} className="rounded-full border border-forest/20 bg-mint/50 px-3 py-1.5 text-left text-sm text-forest transition-colors hover:bg-mint">{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m) => (m.role === 'user' ? (
          <div key={m.id} className="flex justify-end"><p className="max-w-[85%] animate-pop rounded-[1.25rem_1.25rem_.35rem_1.25rem] bg-terracotta px-4 py-2.5 text-[15px] text-white" data-testid="ai-user-message">{m.content}</p></div>
        ) : (
          <div key={m.id} className="flex flex-col items-start gap-1">
            <div className="max-w-[90%] animate-pop rounded-[1.25rem_1.25rem_1.25rem_.35rem] bg-soft px-4 py-3 text-[15px] leading-relaxed ring-1 ring-line/70" data-testid="ai-bot-message">
              {m.content ? <RichText text={m.content} /> : (
                <span className="flex items-center gap-1 text-sm text-muted" data-testid="ai-typing">{t('ai.thinking')}{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-blink rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />)}</span>
              )}
            </div>
            {!m.pending && m.mode && <span className="pl-1 text-[11px] text-muted">{m.fallback ? t('ai.fallbackNote') : m.mode === 'demo' ? t('ai.demo') : t('ai.liveNote')}</span>}
          </div>
        )))}
        {failed && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#FDF3F1] px-4 py-3 text-sm text-danger" role="alert" data-testid="ai-error">
            {failed.text}
            <button type="button" onClick={() => ask(failed.message)} className="inline-flex items-center gap-1 font-bold underline" data-testid="ai-retry-button"><RotateCcw className="h-3.5 w-3.5" aria-hidden />{t('common.retry')}</button>
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-end gap-2 border-t border-line/70 p-3 sm:p-4">
        <label htmlFor="ai-input" className="sr-only">{t('ai.placeholder')}</label>
        <div className="relative flex-1">
          <textarea id="ai-input" rows={1} maxLength={500} value={input} onChange={(e) => setInput(e.target.value)} data-testid="ai-input"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder={topic ? t('ai.placeholderRec', { topic }) : t('ai.placeholder')}
            className="max-h-32 min-h-[3rem] w-full resize-none rounded-2xl border border-forest/30 bg-white px-4 py-3 pr-14 text-[15px] focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10" />
          <span className="absolute bottom-2 right-3 text-[10px] text-muted">{t('ai.limit', { n: input.length })}</span>
        </div>
        <button type="submit" disabled={!input.trim() || busy} aria-label={t('ai.send')} data-testid="ai-send-button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest text-white transition-[background-color,transform] hover:-translate-y-px hover:bg-[#355A40] disabled:opacity-40"><SendHorizontal className="h-5 w-5" /></button>
      </form>
    </section>
  );
}
