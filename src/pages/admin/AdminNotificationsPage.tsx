import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, Badge, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService, type Announcement } from '../../services/admin';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const AUDIENCES: Array<{ value: Announcement['audience']; label: string }> = [
  { value: 'all', label: 'Everyone' },
  { value: 'customers', label: 'Customers only' },
  { value: 'hosts', label: 'Hosts' },
  { value: 'providers', label: 'Service providers' },
];
const audienceLabel = (a: string) => AUDIENCES.find((x) => x.value === a)?.label || a;

/** Send an announcement to users' Notifications, and see what was sent before. */
export const AdminNotificationsPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => adminService.announcements(), []);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Announcement['audience']>('all');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<number | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSentTo(null);
    if (title.trim().length < 3) return setFormError('Enter a title.');
    if (message.trim().length < 5) return setFormError('Enter a message.');

    setSending(true);
    try {
      const res = await adminService.sendAnnouncement({ title: title.trim(), message: message.trim(), audience });
      setSentTo(res.recipients);
      setTitle('');
      setMessage('');
      await reload();
    } catch (err: any) {
      setFormError(err.message || 'Could not send the announcement.');
    } finally {
      setSending(false);
    }
  };

  const sent = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Notifications" description="Send an announcement. It appears in each person's Notifications page." />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 p-5 self-start">
          <h2 className="text-sm font-bold text-slate-900 mb-4">New announcement</h2>
          <form onSubmit={send} noValidate className="space-y-3.5">
            <div>
              <label htmlFor="an-audience" className={label}>Send to</label>
              <select id="an-audience" value={audience} onChange={(e) => setAudience(e.target.value as Announcement['audience'])} className={`${input} cursor-pointer`}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="an-title" className={label}>Title</label>
              <input id="an-title" type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="an-message" className={label}>Message</label>
              <textarea id="an-message" rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className={input} />
            </div>

            {formError && <p role="alert" className="text-sm font-medium text-rose-600">{formError}</p>}
            {sentTo !== null && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Sent to {sentTo} {sentTo === 1 ? 'person' : 'people'}.
              </p>
            )}

            <Button type="submit" variant="primary" disabled={sending} className="w-full">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send announcement'}
            </Button>
            <p className="text-[11px] text-slate-400">Suspended accounts and administrators are not included. An announcement cannot be recalled once sent.</p>
          </form>
        </Card>

        <Card className="xl:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900">Sent announcements</h2>
          </div>
          {error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">{error}</p>
              <Button onClick={reload}>Try again</Button>
            </div>
          ) : sent.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">{loading ? 'Loading...' : 'No announcements have been sent yet.'}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sent.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <Badge tone="blue">{audienceLabel(a.audience)}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 break-words">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {formatDate(a.createdAt)} · {a.recipients} recipient{a.recipients === 1 ? '' : 's'}
                    {a.sentBy ? ` · sent by ${a.sentBy}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
