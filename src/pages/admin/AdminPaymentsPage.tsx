import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, DataTable, Td, Button, StatusBadge, Tabs, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { Plus } from 'lucide-react';
import { adminService, type Payment } from '../../services/admin';
import { RecordPaymentDialog } from '../../components/admin/adminDialogs';

const METHOD: Record<string, string> = { bank_transfer: 'Bank transfer', cash_deposit: 'Cash deposit', online_transfer: 'Online transfer', cash: 'Cash' };
type Tab = 'pending' | 'paid' | 'rejected' | 'all';
type Action = { payment: Payment; status: 'paid' | 'rejected' };

/** Subscription payments submitted by hosts and providers. Confirming one activates their plan. */
export const AdminPaymentsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pending');
  const { data, loading, error, reload } = useAdminData(() => adminService.payments(tab), [tab]);
  const paid = useAdminData(() => adminService.payments('paid'), []);
  const plans = useAdminData(() => adminService.plans(), []);
  const [recording, setRecording] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const decide = async () => {
    if (!action) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.reviewPayment(action.payment.id, action.status);
      await Promise.all([reload(), paid.reload()]);
    } catch (err: any) {
      setActionError(err.message || 'Could not update this payment.');
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const payments = data || [];
  const total = (paid.data || []).reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = (paid.data || [])
    .filter((p) => new Date(p.reviewedAt || p.createdAt).getMonth() === new Date().getMonth() && new Date(p.reviewedAt || p.createdAt).getFullYear() === new Date().getFullYear())
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout>
      <PageHeader title="Payments" description="Subscription payments from hosts and providers. Check the reference, then confirm to activate their plan.">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: 'To confirm' },
            { value: 'paid', label: 'Confirmed' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all', label: 'All' },
          ]}
        />
        <Button variant="primary" onClick={() => setRecording(true)}>
          <Plus className="w-4 h-4" />
          Record a payment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Confirmed this month</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">Rs. {thisMonth.toLocaleString()}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Confirmed in total</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">Rs. {total.toLocaleString()}</p>
        </Card>
      </div>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <DataTable
        columns={['Host / Provider', 'Plan', 'Amount', 'Method', 'Reference', 'Submitted', 'Status', '']}
        loading={loading}
        error={error}
        isEmpty={payments.length === 0}
        emptyText={
          tab === 'pending'
            ? 'No payments are waiting. Hosts submit them from their Subscription page, or use "Record a payment" for one you received directly.'
            : 'No payments in this view.'
        }
        onRetry={reload}
      >
        {payments.map((p) => (
          <tr key={p.id} className="hover:bg-slate-50/60">
            <Td>
              <p className="font-semibold text-slate-900">{p.userName || 'Deleted account'}</p>
              <p className="text-xs text-slate-500">{p.userEmail}</p>
            </Td>
            <Td className="text-slate-700">{p.planName}</Td>
            <Td className="whitespace-nowrap font-semibold tabular-nums text-slate-900">Rs. {p.amount.toLocaleString()}</Td>
            <Td className="whitespace-nowrap text-slate-600">{METHOD[p.method] || p.method}</Td>
            <Td>
              <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md break-all">{p.reference}</code>
            </Td>
            <Td className="whitespace-nowrap text-slate-600">{formatDate(p.createdAt)}</Td>
            <Td>
              <StatusBadge status={p.status === 'paid' ? 'confirmed' : p.status} />
            </Td>
            <Td className="text-right">
              {p.status === 'pending' && (
                <div className="flex justify-end gap-1.5">
                  <Button small variant="danger" onClick={() => setAction({ payment: p, status: 'rejected' })}>
                    Reject
                  </Button>
                  <Button small variant="success" onClick={() => setAction({ payment: p, status: 'paid' })}>
                    Confirm
                  </Button>
                </div>
              )}
            </Td>
          </tr>
        ))}
      </DataTable>

      {action && (
        <ConfirmDialog
          title={action.status === 'paid' ? 'Confirm this payment?' : 'Reject this payment?'}
          message={
            action.status === 'paid'
              ? `${action.payment.userName} will be moved to the ${action.payment.planName} plan straight away. Only confirm after you have seen Rs. ${action.payment.amount.toLocaleString()} arrive with reference "${action.payment.reference}".`
              : `${action.payment.userName} will be told the payment could not be confirmed and can submit it again.`
          }
          confirmLabel={action.status === 'paid' ? 'Confirm payment' : 'Reject payment'}
          danger={action.status === 'rejected'}
          busy={busy}
          onConfirm={decide}
          onCancel={() => setAction(null)}
        />
      )}

      {recording && (
        <RecordPaymentDialog
          plans={plans.data || []}
          onClose={() => setRecording(false)}
          onSaved={() => {
            setRecording(false);
            setTab('paid');
            reload();
            paid.reload();
          }}
        />
      )}
    </AdminLayout>
  );
};
