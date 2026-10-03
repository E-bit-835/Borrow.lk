import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, Send } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, SearchInput, Button, Tabs, useDebounced } from '../../components/admin/adminUi';
import { Dialog, UserPicker } from '../../components/admin/adminDialogs';
import { adminService, type AdminConversation, type AdminUser } from '../../services/admin';
import { meService, type Conversation, type ChatMessage } from '../../services/me';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';
const REFRESH_MS = 8000;
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type Tab = 'inbox' | 'all';
/** One row in either list, so both tabs share the same layout. */
interface Row {
  id: string;
  title: string;
  avatar: string | null;
  subtitle: string | null;
  preview: string | null;
  updatedAt: string;
  unread: number;
}
interface Line {
  id: string;
  text: string;
  createdAt: string;
  sender: string;
  mine: boolean;
}

/**
 * Inbox: the admin's own conversations with users (support), with replies and new messages.
 * All conversations: every customer-to-host conversation, read-only, for settling complaints.
 */
export const AdminMessagesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('inbox');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // New message dialog
  const [composing, setComposing] = useState(false);
  const [recipient, setRecipient] = useState<AdminUser | null>(null);
  const [firstMessage, setFirstMessage] = useState('');
  const [composeError, setComposeError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    try {
      if (tab === 'inbox') {
        const list: Conversation[] = await meService.conversations();
        setRows(
          list
            .filter((c) => !q || `${c.otherUser.name} ${c.lastMessage || ''}`.toLowerCase().includes(q.toLowerCase()))
            .map((c) => ({ id: c.id, title: c.otherUser.name, avatar: c.otherUser.avatar, subtitle: c.listingTitle, preview: c.lastMessage, updatedAt: c.updatedAt, unread: c.unread }))
        );
      } else {
        const list: AdminConversation[] = await adminService.conversations(q);
        setRows(
          list.map((c) => ({
            id: c.id,
            title: c.participants.map((p) => p.name || 'Deleted account').join(' and '),
            avatar: c.participants[0]?.avatar || null,
            subtitle: c.listingTitle,
            preview: c.lastMessage,
            updatedAt: c.updatedAt,
            unread: 0,
          }))
        );
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load messages.');
    }
  }, [tab, q]);

  const loadLines = useCallback(
    async (id: string) => {
      try {
        if (tab === 'inbox') {
          const list: ChatMessage[] = await meService.messages(id);
          setLines(list.map((m) => ({ id: m.id, text: m.text, createdAt: m.createdAt, sender: m.mine ? 'You' : '', mine: m.mine })));
        } else {
          const list = await adminService.conversationMessages(id);
          setLines(list.map((m) => ({ id: m.id, text: m.text, createdAt: m.createdAt, sender: m.sender, mine: false })));
        }
      } catch {
        setLines([]);
      }
    },
    [tab]
  );

  // Lists refresh on their own so new messages appear without a reload
  useEffect(() => {
    setRows(null);
    loadRows();
    const t = setInterval(loadRows, REFRESH_MS);
    return () => clearInterval(t);
  }, [loadRows]);

  useEffect(() => {
    setActiveId(null);
  }, [tab]);

  useEffect(() => {
    if (!activeId) return;
    setLines(null);
    loadLines(activeId).then(loadRows);
    const t = setInterval(() => loadLines(activeId), REFRESH_MS);
    return () => clearInterval(t);
  }, [activeId, loadLines, loadRows]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines?.length]);

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    try {
      await meService.sendMessage(activeId, text);
      setDraft('');
      await loadLines(activeId);
      loadRows();
    } catch (err: any) {
      setError(err.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError(null);
    if (!recipient) return setComposeError('Choose who to message.');
    if (!firstMessage.trim()) return setComposeError('Write a message.');
    setSending(true);
    try {
      const res = await adminService.sendDirectMessage(recipient.id, firstMessage.trim());
      setComposing(false);
      setRecipient(null);
      setFirstMessage('');
      setTab('inbox');
      await loadRows();
      setActiveId(res.conversationId);
    } catch (err: any) {
      setComposeError(err.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const active = rows?.find((r) => r.id === activeId) || null;

  return (
    <AdminLayout>
      <PageHeader
        title="Messages"
        description={
          tab === 'inbox'
            ? 'Your conversations with users. They see you as BorrowLK Support.'
            : 'Every conversation between customers and hosts or providers. Read-only, for settling complaints.'
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'inbox', label: 'Inbox' },
            { value: 'all', label: 'All conversations' },
          ]}
        />
        <Button variant="primary" onClick={() => setComposing(true)}>
          <Plus className="w-4 h-4" />
          New message
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <Card className={`lg:col-span-2 overflow-hidden flex flex-col max-h-[72vh] ${active ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-slate-200/80">
            <SearchInput value={search} onChange={setSearch} placeholder="Search a name or message" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-slate-600">{error}</p>
                <Button onClick={loadRows}>Try again</Button>
              </div>
            ) : rows === null ? (
              <p className="p-10 text-sm text-slate-500 text-center">Loading...</p>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">
                  {q ? 'Nothing matches your search.' : tab === 'inbox' ? 'Your inbox is empty.' : 'No conversations between users yet.'}
                </p>
                {tab === 'inbox' && !q && (
                  <Button variant="primary" small onClick={() => setComposing(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Message a user
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(r.id)}
                      aria-current={r.id === activeId}
                      className={`w-full px-4 py-3.5 flex items-center gap-3 text-left cursor-pointer transition-colors ${r.id === activeId ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    >
                      <img src={r.avatar || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${r.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{r.title}</span>
                          <span className="text-[11px] text-slate-400 shrink-0">{when(r.updatedAt)}</span>
                        </span>
                        {r.subtitle && <span className="block text-[11px] text-teal-700 truncate">{r.subtitle}</span>}
                        <span className={`block text-xs truncate ${r.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{r.preview}</span>
                      </span>
                      {r.unread > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#001A48] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {r.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Thread */}
        <Card className={`lg:col-span-3 flex-col min-h-[50vh] max-h-[72vh] overflow-hidden ${active ? 'flex' : 'hidden lg:flex'}`}>
          {!active ? (
            <p className="m-auto text-sm text-slate-400 px-6 text-center">Choose a conversation to read it.</p>
          ) : (
            <>
              <div className="px-4 py-3.5 border-b border-slate-200/80 flex items-center gap-3">
                <button type="button" onClick={() => setActiveId(null)} aria-label="Back to conversations" className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{active.title}</p>
                  {active.subtitle && <p className="text-xs text-slate-500 truncate">About: {active.subtitle}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/60" aria-live="polite">
                {lines === null ? (
                  <p className="text-sm text-slate-500 text-center">Loading...</p>
                ) : (
                  lines.map((m) => (
                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-md px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line break-words ${
                          m.mine ? 'bg-[#001A48] text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                        }`}
                      >
                        {tab === 'all' && <span className="block text-[11px] font-semibold text-teal-700 mb-0.5">{m.sender}</span>}
                        {m.text}
                        <span className={`block text-[10px] mt-1 ${m.mine ? 'text-slate-300' : 'text-slate-400'}`}>{when(m.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              {tab === 'inbox' ? (
                <form onSubmit={reply} className="p-3 border-t border-slate-200/80 flex items-end gap-2">
                  <textarea
                    rows={1}
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) reply(e);
                    }}
                    placeholder="Write a reply"
                    aria-label="Reply"
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
              ) : (
                <p className="px-4 py-3 border-t border-slate-200/80 text-xs text-slate-500">
                  This is a private conversation between two users. You can read it but not reply. Use &ldquo;New message&rdquo; to contact either of them.
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {composing && (
        <Dialog title="New message" onClose={() => setComposing(false)}>
          <form onSubmit={startConversation} noValidate className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">To</span>
              <UserPicker value={recipient} onChange={setRecipient} hint="Search for any customer, host or provider." />
            </div>
            <div>
              <label htmlFor="nm-text" className="block text-xs font-semibold text-slate-700 mb-1.5">Message</label>
              <textarea
                id="nm-text"
                rows={4}
                maxLength={2000}
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]"
              />
              <p className="text-[11px] text-slate-400 mt-1">They receive it in their Messages page, from BorrowLK Support.</p>
            </div>
            {composeError && <p role="alert" className="text-sm font-medium text-rose-600">{composeError}</p>}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setComposing(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={sending}>
                {sending ? 'Sending...' : 'Send message'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </AdminLayout>
  );
};
