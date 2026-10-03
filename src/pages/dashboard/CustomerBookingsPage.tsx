import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Search } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card, Badge, Button, StatusBadge, Tabs, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { orderService, type Order } from '../../services/orders';
import { useAuth } from '../../context/AuthContext';

type Status = Order['status'];
interface ViewDef {
  title: string;
  description: string;
  tabs: Array<{ value: string; label: string; statuses: Status[]; empty: string }>;
}

/** "Requests" are still waiting for (or were declined by) the host; "My Bookings" are the accepted ones. */
const VIEWS: Record<'bookings' | 'requests', ViewDef> = {
  requests: {
    title: 'Requests',
    description: 'Requests you sent that are waiting for the host or provider to answer.',
    tabs: [
      { value: 'waiting', label: 'Waiting', statuses: ['pending'], empty: 'No requests are waiting for an answer.' },
      { value: 'declined', label: 'Declined', statuses: ['rejected'], empty: 'None of your requests were declined.' },
    ],
  },
  bookings: {
    title: 'My Bookings',
    description: 'Rentals and services that were accepted.',
    tabs: [
      { value: 'upcoming', label: 'Upcoming', statuses: ['confirmed', 'active'], empty: 'You have no upcoming bookings.' },
      { value: 'completed', label: 'Completed', statuses: ['completed'], empty: 'No completed bookings yet.' },
      { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled'], empty: 'No cancelled bookings.' },
    ],
  },
};

export const CustomerBookingsPage: React.FC<{ view: 'bookings' | 'requests' }> = ({ view }) => {
  const def = VIEWS[view];
  const { user } = useAuth();
  const { data, loading, error, reload } = useAdminData(() => orderService.getAll({ userId: user!.id }), [user?.id]);
  const [tab, setTab] = useState(def.tabs[0].value);
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The same component serves two routes; start on the first tab of whichever is shown
  const activeTab = def.tabs.find((t) => t.value === tab) || def.tabs[0];

  const cancel = async () => {
    if (!toCancel) return;
    setBusy(true);
    setActionError(null);
    try {
      await orderService.updateStatus(toCancel.id, 'cancelled');
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not cancel. Please try again.');
    } finally {
      setBusy(false);
      setToCancel(null);
    }
  };

  const all = data || [];
  const count = (statuses: Status[]) => all.filter((o) => statuses.includes(o.status)).length;
  const orders = all.filter((o) => activeTab.statuses.includes(o.status));

  return (
    <DashboardLayout>
      <PageHeader title={def.title} description={def.description}>
        <Tabs
          value={activeTab.value}
          onChange={setTab}
          tabs={def.tabs.map((t) => ({ value: t.value, label: `${t.label} (${count(t.statuses)})` }))}
        />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm text-slate-500">{loading ? 'Loading...' : activeTab.empty}</p>
          {!loading && all.length === 0 && (
            <Link to="/marketplace">
              <Button variant="primary">
                <Search className="w-4 h-4" />
                Browse the marketplace
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const isService = (o.product as { listingType?: string }).listingType === 'service';
            return (
              <Card key={o.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <img src={o.product.image} alt="" className="w-full sm:w-32 h-40 sm:h-24 rounded-xl object-cover border border-slate-200 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{o.product.title}</h3>
                    <Badge tone={isService ? 'purple' : 'blue'}>{isService ? 'Service' : 'Rental'}</Badge>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {isService ? 'Provided by' : 'Hosted by'} {o.provider?.name || 'BorrowLK member'} · {o.orderNumber}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(o.startDate)}
                    {o.endDate !== o.startDate && <> to {formatDate(o.endDate)}</>}
                  </p>
                  <p className="text-xs text-slate-600">
                    Estimated cost: <span className="font-semibold text-slate-900">Rs. {o.totalPrice.toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0 sm:justify-center">
                  <Link to={`/bookings/${o.orderNumber}`}>
                    <Button small className="w-full">View details</Button>
                  </Link>
                  {['pending', 'confirmed'].includes(o.status) && (
                    <Button small variant="danger" onClick={() => setToCancel(o)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {toCancel && (
        <ConfirmDialog
          title={toCancel.status === 'pending' ? 'Cancel this request?' : 'Cancel this booking?'}
          message={`"${toCancel.product.title}" (${toCancel.orderNumber}) will be cancelled and the ${
            (toCancel.product as { listingType?: string }).listingType === 'service' ? 'provider' : 'host'
          } will be told.`}
          confirmLabel="Yes, cancel"
          danger
          busy={busy}
          onConfirm={cancel}
          onCancel={() => setToCancel(null)}
        />
      )}
    </DashboardLayout>
  );
};
