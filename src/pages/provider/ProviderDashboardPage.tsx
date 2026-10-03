import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardList, CalendarCheck, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Button, StatusBadge, useAdminData, formatDate } from '../../components/admin/adminUi';
import { hostService } from '../../services/host';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../data/categories';

export const ProviderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAdminData(
    async () => {
      const [stats, listings, pending] = await Promise.all([
        hostService.stats(),
        hostService.listings(),
        hostService.requests(user!.id, 'pending'),
      ]);
      return { stats, listings, pending };
    },
    [user?.id]
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const answer = async (id: string, status: 'confirmed' | 'rejected') => {
    setBusyId(id);
    setActionError(null);
    try {
      await hostService.setRequestStatus(id, status);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  };

  const s = data?.stats;
  const cards = [
    { label: 'Live listings', value: s?.liveListings, icon: Package, to: '/provider/listings' },
    { label: 'Requests to answer', value: s?.pendingRequests, icon: ClipboardList, to: '/provider/requests' },
    { label: 'Upcoming bookings', value: s?.upcoming, icon: CalendarCheck, to: '/provider/requests' },
    { label: 'Completed', value: s?.completed, icon: CheckCircle2, to: '/provider/requests' },
  ];

  return (
    <ProviderLayout>
      <PageHeader
        title={`Welcome back, ${user?.firstName || user?.name?.split(' ')[0] || ''}`}
        description="Answer requests and keep your listings up to date."
      >
        <Link to="/provider/listings/create">
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Add a listing
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <Card className="p-6 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="group">
            <Card className="p-5 transition-shadow group-hover:shadow-md h-full">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3 tabular-nums">{loading && value === undefined ? '–' : value ?? 0}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Requests waiting for an answer */}
        <Card className="xl:col-span-3 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Requests waiting for your answer</h2>
            <Link to="/provider/requests" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          {actionError && <p role="alert" className="mb-3 text-sm font-medium text-rose-600">{actionError}</p>}

          {!data?.pending.length ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {loading ? 'Loading...' : 'No requests are waiting. New ones will appear here.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {data.pending.slice(0, 5).map((r) => (
                <li key={r.id} className="p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.product.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.customer?.name || 'Customer'} · {formatDate(r.startDate)}
                      {r.endDate !== r.startDate && <> to {formatDate(r.endDate)}</>}
                    </p>
                    {r.notes && <p className="text-xs text-slate-600 mt-1 line-clamp-2">&ldquo;{r.notes}&rdquo;</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button small variant="danger" disabled={busyId === r.id} onClick={() => answer(r.id, 'rejected')}>
                      Decline
                    </Button>
                    <Button small variant="success" disabled={busyId === r.id} onClick={() => answer(r.id, 'confirmed')}>
                      Accept
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Listings */}
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Your listings</h2>
            <Link to="/provider/listings" className="text-xs font-semibold text-teal-700 hover:underline">
              Manage
            </Link>
          </div>
          {!data?.listings.length ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'You have no listings yet.'}</p>
              {!loading && (
                <Link to="/provider/listings/create" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
                  Create your first listing <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.listings.slice(0, 5).map((l) => {
                const price = formatPrice(l.pricePerDay, l.priceUnit);
                return (
                  <li key={l.id} className="py-2.5 flex items-center gap-3">
                    {l.images[0] ? (
                      <img src={l.images[0]} alt="" className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-100 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{l.title}</p>
                      <p className="text-xs text-slate-500">
                        {price.amount} {price.per}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </ProviderLayout>
  );
};
