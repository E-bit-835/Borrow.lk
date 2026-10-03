import React, { useState } from 'react';
import { CalendarDays, Mail } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Badge, Button, StatusBadge, Tabs, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { hostService } from '../../services/host';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../services/orders';

type Tab = 'pending' | 'accepted' | 'history';
const TAB_STATUSES: Record<Tab, Array<Order['status']>> = {
  pending: ['pending'],
  accepted: ['confirmed', 'active'],
  history: ['completed', 'rejected', 'cancelled'],
};

type Action = { order: Order; status: Order['status']; title: string; message: string; label: string; danger?: boolean };

export const ProviderRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAdminData(() => hostService.requests(user!.id), [user?.id]);
  const [tab, setTab] = useState<Tab>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = async (order: Order, status: Order['status']) => {
    setBusyId(order.id);
    setActionError(null);
    try {
      await hostService.setRequestStatus(order.id, status);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this request.');
    } finally {
      setBusyId(null);
      setAction(null);
    }
  };

  const all = data || [];
  const count = (t: Tab) => all.filter((r) => TAB_STATUSES[t].includes(r.status)).length;
  const requests = all.filter((r) => TAB_STATUSES[tab].includes(r.status));

  return (
    <ProviderLayout>
      <PageHeader title="Requests" description="Customers ask to rent your items or hire your services. Accept or decline each request.">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: `New (${count('pending')})` },
            { value: 'accepted', label: `Accepted (${count('accepted')})` },
            { value: 'history', label: 'History' },
          ]}
        />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500">
          {loading
            ? 'Loading...'
            : tab === 'pending'
            ? 'No new requests. When a customer sends one, it appears here.'
            : tab === 'accepted'
            ? 'No accepted requests yet.'
            : 'No past requests yet.'}
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isService = (r.product as { listingType?: string }).listingType === 'service';
            const busy = busyId === r.id;
            return (
              <Card key={r.id} className="p-5 flex flex-col lg:flex-row gap-4">
                <img
                  src={r.product.image}
                  alt=""
                  className="w-full lg:w-28 h-36 lg:h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{r.product.title}</h3>
                    <Badge tone={isService ? 'purple' : 'blue'}>{isService ? 'Service' : 'Rental'}</Badge>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(r.startDate)}
                      {r.endDate !== r.startDate && <> to {formatDate(r.endDate)}</>}
                    </span>
                    {(r.quantity || 1) > 1 && <span>Quantity: {r.quantity}</span>}
                    <span>Estimate: Rs. {r.totalPrice.toLocaleString()}</span>
                    <span className="text-slate-400">{r.orderNumber}</span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">{r.customer?.name || 'Customer'}</span>
                    {/* Contact details are shared only once the request is accepted */}
                    {['confirmed', 'active', 'completed'].includes(r.status) && r.customer?.email && (
                      <a href={`mailto:${r.customer.email}`} className="inline-flex items-center gap-1 ml-3 text-teal-700 font-semibold hover:underline">
                        <Mail className="w-3.5 h-3.5" />
                        {r.customer.email}
                      </a>
                    )}
                  </p>

                  {r.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-line">{r.notes}</p>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2 shrink-0 lg:justify-center">
                  {r.status === 'pending' && (
                    <>
                      <Button variant="success" small disabled={busy} onClick={() => setStatus(r, 'confirmed')}>
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        small
                        disabled={busy}
                        onClick={() =>
                          setAction({
                            order: r, status: 'rejected', title: 'Decline this request?', label: 'Decline', danger: true,
                            message: `${r.customer?.name || 'The customer'} will see that the request for "${r.product.title}" was declined.`,
                          })
                        }
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {['confirmed', 'active'].includes(r.status) && (
                    <>
                      <Button variant="primary" small disabled={busy} onClick={() => setStatus(r, 'completed')}>
                        Mark completed
                      </Button>
                      <Button
                        variant="danger"
                        small
                        disabled={busy}
                        onClick={() =>
                          setAction({
                            order: r, status: 'cancelled', title: 'Cancel this booking?', label: 'Cancel booking', danger: true,
                            message: `The accepted booking for "${r.product.title}" will be cancelled and the dates become free again.`,
                          })
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {action && (
        <ConfirmDialog
          title={action.title}
          message={action.message}
          confirmLabel={action.label}
          danger={action.danger}
          busy={busyId === action.order.id}
          onConfirm={() => setStatus(action.order, action.status)}
          onCancel={() => setAction(null)}
        />
      )}
    </ProviderLayout>
  );
};
