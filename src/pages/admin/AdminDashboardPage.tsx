import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Home, Wrench, Package, ClipboardList, UserCheck, Flag, ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, StatusBadge, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService } from '../../services/admin';

export const AdminDashboardPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => adminService.stats(), []);

  const stats = [
    { label: 'Users', value: data?.users, icon: Users, to: '/admin/users' },
    { label: 'Hosts', value: data?.hosts, icon: Home, to: '/admin/users' },
    { label: 'Providers', value: data?.providers, icon: Wrench, to: '/admin/users' },
    { label: 'Live listings', value: data?.listings, icon: Package, to: '/admin/listings' },
  ];

  const attention = [
    { label: 'Host and provider applications to review', value: data?.pendingApplications ?? 0, icon: UserCheck, to: '/admin/applications' },
    { label: 'Subscription payments to confirm', value: data?.pendingPayments ?? 0, icon: CreditCard, to: '/admin/payments' },
    { label: 'Reported listings to check', value: data?.openReports ?? 0, icon: Flag, to: '/admin/reports' },
    { label: 'Requests waiting for a host or provider', value: data?.pendingRequests ?? 0, icon: ClipboardList, to: '/admin/requests' },
  ];
  const nothingToDo = !!data && attention.slice(0, 3).every((a) => a.value === 0);

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="What is happening on BorrowLK right now." />

      {error && (
        <Card className="p-6 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="group">
            <Card className="p-5 transition-shadow group-hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3 tabular-nums">
                {loading && value === undefined ? '–' : (value ?? 0).toLocaleString()}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 xl:col-span-1">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Needs your attention</h2>
          {nothingToDo && (
            <p className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-3">
              <CheckCircle2 className="w-4 h-4" />
              Nothing is waiting for review.
            </p>
          )}
          <ul className="space-y-2">
            {attention.map(({ label, value, icon: Icon, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      value > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="flex-1 text-sm text-slate-700">{label}</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">{value}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Newest users</h2>
            <Link to="/admin/users" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          {data?.recentUsers.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="py-2.5 flex items-center gap-3">
                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{u.createdAt ? formatDate(u.createdAt) : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'No users yet.'}</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Latest requests</h2>
            <Link to="/admin/requests" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          {data?.recentRequests.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentRequests.map((r) => (
                <li key={r.orderNumber} className="py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {r.orderNumber} · {r.customer || 'Unknown customer'}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'No requests yet.'}</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
