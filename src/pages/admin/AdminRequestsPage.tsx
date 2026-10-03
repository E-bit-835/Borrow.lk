import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  PageHeader, DataTable, Td, Badge, StatusBadge, SearchInput, Select, Button, ConfirmDialog, useAdminData, useDebounced, formatDate,
} from '../../components/admin/adminUi';
import { adminService } from '../../services/admin';
import type { Order } from '../../services/orders';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Accepted' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AdminRequestsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useAdminData(() => adminService.requests({ search: q, status }), [q, status]);

  const [target, setTarget] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancel = async () => {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.setRequestStatus(target.id, 'cancelled');
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not cancel this request.');
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const requests = data || [];

  return (
    <AdminLayout>
      <PageHeader
        title="Requests"
        description="Rental and service requests between customers and hosts or providers. BorrowLK takes no payment for these."
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search request number or listing" />
        <Select value={status} onChange={setStatus} label="Status" options={STATUS_OPTIONS} />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <DataTable
        columns={['Request', 'Listing', 'Customer', 'Host / Provider', 'Dates', 'Estimate', 'Status', '']}
        loading={loading}
        error={error}
        isEmpty={requests.length === 0}
        emptyText="No requests match your filters."
        onRetry={reload}
      >
        {requests.map((r) => {
          const isService = (r.product as { listingType?: string }).listingType === 'service';
          return (
            <tr key={r.id} className="hover:bg-slate-50/60">
              <Td className="whitespace-nowrap">
                <p className="font-semibold text-slate-900">{r.orderNumber}</p>
                <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
              </Td>
              <Td>
                <p className="text-slate-800 truncate max-w-[220px]">{r.product.title}</p>
                <Badge tone={isService ? 'purple' : 'blue'}>{isService ? 'Service' : 'Rental'}</Badge>
              </Td>
              <Td className="text-slate-700">{r.customer?.name || '–'}</Td>
              <Td className="text-slate-700">{r.provider?.name || '–'}</Td>
              <Td className="whitespace-nowrap text-slate-600">
                {formatDate(r.startDate)}
                {r.endDate !== r.startDate && <> to {formatDate(r.endDate)}</>}
              </Td>
              <Td className="whitespace-nowrap tabular-nums text-slate-700">Rs. {r.totalPrice.toLocaleString()}</Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td className="text-right">
                {['pending', 'confirmed'].includes(r.status) && (
                  <Button small variant="danger" onClick={() => setTarget(r)}>
                    Cancel
                  </Button>
                )}
              </Td>
            </tr>
          );
        })}
      </DataTable>

      {target && (
        <ConfirmDialog
          title="Cancel this request?"
          message={`Request ${target.orderNumber} for "${target.product.title}" will be cancelled for both the customer and the ${
            (target.product as { listingType?: string }).listingType === 'service' ? 'provider' : 'host'
          }.`}
          confirmLabel="Cancel request"
          danger
          busy={busy}
          onConfirm={cancel}
          onCancel={() => setTarget(null)}
        />
      )}
    </AdminLayout>
  );
};
