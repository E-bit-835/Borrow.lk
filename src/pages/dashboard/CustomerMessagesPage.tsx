import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { meService, type Conversation, type ChatMessage } from '../../services/me';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';
const REFRESH_MS = 8000;
const time = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** Conversations between a customer and a host / provider about a listing. Used by both sides. */
export const CustomerMessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(
    () =>
      meService
        .conversations()
        .then((list) => {
          setConversations(list);
          setError(null);
        })
        .catch((err) => setError(err.message || 'Could not load your messages.')),
    []
  );
  const loadMessages = useCallback((id: string) => meService.messages(id).then(setMessages).catch(() => {}), []);

  // Conversation list, refreshed regularly so new messages show up without a reload
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, REFRESH_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Open conversation: load it now and keep it fresh
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    loadMessages(activeId).then(loadConversations);
    const t = setInterval(() => loadMessages(activeId), REFRESH_MS);
    return () => clearInterval(t);
  }, [activeId, loadMessages, loadConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    try {
      const sent = await meService.sendMessage(activeId, text);
      setMessages((prev) => [...prev, sent]);
      setDraft('');
      loadConversations();
    } catch (err: any) {
      setError(err.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const active = conversations?.find((c) => c.id === activeId) || null;

  return (
    <DashboardLayout flush>
      <div className="h-[calc(100vh-5rem)] flex bg-white lg:border-l border-slate-200/80">
        {/* Conversation list (full width on phones until one is opened) */}
        <div className={`w-full md:w-80 md:border-r border-slate-200/80 flex-col shrink-0 ${active ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-5 py-4 border-b border-slate-200/80">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            <p className="text-xs text-slate-500">Conversations about listings.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {error && <p role="alert" className="px-5 py-3 text-xs font-medium text-rose-600">{error}</p>}
            {conversations === null ? (
              <p className="px-5 py-8 text-sm text-slate-500 text-center">Loading...</p>
            ) : conversations.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">No messages yet.</p>
                <p className="text-xs text-slate-400">
                  Open a listing and use &ldquo;Contact&rdquo; to ask its host or provider a question.
                </p>
                <Link to="/marketplace" className="inline-block text-sm font-semibold text-teal-700 hover:underline">
                  Browse listings
                </Link>
              </div>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      aria-current={c.id === activeId}
                      className={`w-full px-5 py-3.5 flex items-center gap-3 text-left border-b border-slate-100 cursor-pointer transition-colors ${
                        c.id === activeId ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <img src={c.otherUser.avatar || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${c.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{c.otherUser.name}</p>
                          <span className="text-[11px] text-slate-400 shrink-0">{time(c.updatedAt)}</span>
                        </div>
                        {c.listingTitle && <p className="text-[11px] text-teal-700 truncate">{c.listingTitle}</p>}
                        <p className={`text-xs truncate ${c.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{c.lastMessage}</p>
                      </div>
                      {c.unread > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#001A48] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex-1 min-w-0 flex-col ${active ? 'flex' : 'hidden md:flex'}`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Choose a conversation to read it.</div>
          ) : (
            <>
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  aria-label="Back to conversations"
                  className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={active.otherUser.avatar || DEFAULT_AVATAR} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{active.otherUser.name}</p>
                  {active.listingId && (
                    <Link to={`/product/${active.listingId}`} className="text-xs text-teal-700 hover:underline truncate block">
                      {active.listingTitle}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-2 bg-[#F6F7FB]" aria-live="polite">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] sm:max-w-md px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line break-words ${
                        m.mine ? 'bg-[#001A48] text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                      }`}
                    >
                      {m.text}
                      <span className={`block text-[10px] mt-1 ${m.mine ? 'text-slate-300' : 'text-slate-400'}`}>{time(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="p-3 sm:p-4 border-t border-slate-200/80 flex items-end gap-2">
                <textarea
                  rows={1}
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) send(e);
                  }}
                  placeholder="Write a message"
                  aria-label="Message"
                  className="flex-1 resize-none px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send"
                  className="h-10 w-10 rounded-xl bg-[#001A48] hover:bg-[#002669] text-white flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
