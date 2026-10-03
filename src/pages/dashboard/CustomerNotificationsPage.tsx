import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarCheck, MessageSquare, Info } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { meService, type AppNotification } from '../../services/me';

const ICONS: Record<string, typeof Bell> = { bookings: CalendarCheck, messages: MessageSquare, system: Info };

export const CustomerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, setData, loading, error, reload } = useAdminData(() => meService.notifications(), []);
  const [busy, setBusy] = useState(false);

  const notifications = data || [];
  const unread = notifications.filter((n) => !n.read).length;

  const markAll = async () => {
    setBusy(true);
    try {
      await meService.markNotificationsRead();
      setData(notifications.map((n) => ({ ...n, read: true })));
    } finally {
      setBusy(false);
    }
  };

  const open = (n: AppNotification) => {
    if (!n.read) {
      meService.markNotificationsRead(n.id).catch(() => {});
      setData(notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" description="Updates about your requests, messages and account.">
        {unread > 0 && (
          <Button onClick={markAll} disabled={busy}>
            Mark all as read
          </Button>
        )}
      </PageHeader>

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'No notifications yet.'}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`w-full px-5 py-4 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                      n.read ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-[#001A48] text-white'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{n.title}</span>
                      <span className="block text-sm text-slate-600 break-words">{n.description}</span>
                      <span className="block text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#001A48] mt-2 shrink-0" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </DashboardLayout>
  );
};
