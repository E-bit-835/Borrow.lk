import React, { useState } from 'react';
import { Plus, Pencil, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, Badge, Button, Tabs, DataTable, Td, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService, type Plan, type PlanInput, type Subscriber } from '../../services/admin';
import { RecordPaymentDialog } from '../../components/admin/adminDialogs';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
/** The form keeps numbers as text while typing, so a field can be emptied and retyped normally. */
interface PlanForm {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  listingLimit: string;
  isActive: boolean;
}
const EMPTY: PlanForm = { name: '', description: '', price: '', durationDays: '30', listingLimit: '10', isActive: true };
const isWholeNumber = (v: string) => /^\d+$/.test(v.trim());

/** Create and edit the plans hosts and providers can buy, and see who is subscribed. */
export const AdminSubscriptionsPage: React.FC = () => {
  const [tab, setTab] = useState<'plans' | 'subscribers'>('plans');
  const plans = useAdminData(() => adminService.plans(), []);
  const subscribers = useAdminData(() => adminService.subscribers(), []);

  // null = closed, 'new' = creating, otherwise the plan being edited
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [toCancel, setToCancel] = useState<Subscriber | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancelSubscription = async () => {
    if (!toCancel) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.cancelSubscription(toCancel.userId);
      await Promise.all([subscribers.reload(), plans.reload()]);
    } catch (err: any) {
      setActionError(err.message || 'Could not cancel this subscription.');
    } finally {
      setBusy(false);
      setToCancel(null);
    }
  };

  const open = (plan: Plan | 'new') => {
    setEditing(plan);
    setFormError(null);
    setForm(
      plan === 'new'
        ? EMPTY
        : { name: plan.name, description: plan.description, price: String(plan.price), durationDays: String(plan.durationDays), listingLimit: String(plan.listingLimit), isActive: plan.isActive }
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.name.trim().length < 2) return setFormError('Enter a plan name.');
    if (form.price.trim() === '' || !(Number(form.price) >= 0)) return setFormError('Enter the price in rupees (0 or more).');
    if (!isWholeNumber(form.durationDays) || Number(form.durationDays) < 1) return setFormError('Enter how many days the plan lasts (1 or more).');
    if (!isWholeNumber(form.listingLimit)) return setFormError('Enter how many listings the plan allows.');

    setSaving(true);
    try {
      const data: PlanInput = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        listingLimit: Number(form.listingLimit),
        isActive: form.isActive,
      };
      if (editing === 'new') await adminService.createPlan(data);
      else if (editing) await adminService.updatePlan(editing.id, data);
      setEditing(null);
      await plans.reload();
    } catch (err: any) {
      setFormError(err.message || 'Could not save the plan.');
    } finally {
      setSaving(false);
    }
  };

  const isDefault = editing !== 'new' && !!editing?.isDefault;

  return (
    <AdminLayout>
      <PageHeader title="Subscriptions" description="Plans that hosts and providers buy to publish more listings. Customers never pay.">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'plans', label: 'Plans' },
            { value: 'subscribers', label: `Subscribers (${subscribers.data?.filter((s) => s.active).length ?? 0})` },
          ]}
        />
        {tab === 'plans' ? (
          <Button variant="primary" onClick={() => open('new')}>
            <Plus className="w-4 h-4" />
            New plan
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" />
            Add subscriber
          </Button>
        )}
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {tab === 'plans' ? (
        plans.error ? (
          <Card className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600">{plans.error}</p>
            <Button onClick={plans.reload}>Try again</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {(plans.data || []).map((p) => (
              <Card key={p.id} className={`p-5 flex flex-col gap-3 ${p.isActive ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">{p.name}</h2>
                  <div className="flex flex-wrap justify-end gap-1">
                    {p.isDefault && <Badge tone="blue">Default</Badge>}
                    <Badge tone={p.isActive ? 'green' : 'slate'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#001A48]">
                  {p.price === 0 ? 'Free' : `Rs. ${p.price.toLocaleString()}`}
                  {p.price > 0 && <span className="text-xs font-medium text-slate-400"> / {p.durationDays} days</span>}
                </p>
                <p className="text-sm text-slate-600 min-h-[2.5rem]">{p.description}</p>
                <ul className="text-sm text-slate-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    Up to {p.listingLimit.toLocaleString()} listings
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                    {p.subscribers ?? 0} active subscriber{p.subscribers === 1 ? '' : 's'}
                  </li>
                </ul>
                <Button small className="mt-auto" onClick={() => open(p)}>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit plan
                </Button>
              </Card>
            ))}
            {plans.loading && !plans.data && <Card className="p-10 text-sm text-slate-500 text-center">Loading...</Card>}
          </div>
        )
      ) : (
        <DataTable
          columns={['Host / Provider', 'Plan', 'Started', 'Expires', 'Status', '']}
          loading={subscribers.loading}
          error={subscribers.error}
          isEmpty={(subscribers.data || []).length === 0}
          emptyText='Nobody has a paid plan yet. Use "Add subscriber" to give an account a plan.'
          onRetry={subscribers.reload}
        >
          {(subscribers.data || []).map((s) => (
            <tr key={s.userId} className="hover:bg-slate-50/60">
              <Td>
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">{s.email}</p>
              </Td>
              <Td className="text-slate-700">{s.planName}</Td>
              <Td className="text-slate-600 whitespace-nowrap">{formatDate(s.startedAt)}</Td>
              <Td className="text-slate-600 whitespace-nowrap">{formatDate(s.expiresAt)}</Td>
              <Td>{s.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Expired</Badge>}</Td>
              <Td className="text-right">
                <Button small variant="danger" onClick={() => setToCancel(s)}>
                  {s.active ? 'Cancel' : 'Remove'}
                </Button>
              </Td>
            </tr>
          ))}
        </DataTable>
      )}

      {adding && (
        <RecordPaymentDialog
          plans={plans.data || []}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            subscribers.reload();
            plans.reload();
          }}
        />
      )}

      {toCancel && (
        <ConfirmDialog
          title="Cancel this subscription?"
          message={`${toCancel.name} will go back to the free plan now and will be told. Their existing listings stay live, but they cannot add more than the free plan allows.`}
          confirmLabel="Cancel subscription"
          danger
          busy={busy}
          onConfirm={cancelSubscription}
          onCancel={() => setToCancel(null)}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editing === 'new' ? 'New plan' : 'Edit plan'}
            noValidate
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-base font-bold text-slate-900">{editing === 'new' ? 'New plan' : `Edit ${editing.name}`}</h2>

            <div>
              <label htmlFor="pl-name" className={label}>Plan name</label>
              <input id="pl-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="pl-desc" className={label}>Short description</label>
              <textarea id="pl-desc" rows={2} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pl-price" className={label}>Price (Rs.)</label>
                <input
                  id="pl-price"
                  type="number"
                  min={0}
                  value={form.price}
                  disabled={isDefault}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`${input} ${isDefault ? 'bg-slate-50 text-slate-500' : ''}`}
                />
              </div>
              <div>
                <label htmlFor="pl-days" className={label}>Lasts (days)</label>
                <input id="pl-days" type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="pl-limit" className={label}>Listings allowed</label>
              <input id="pl-limit" type="number" min={0} value={form.listingLimit} onChange={(e) => setForm({ ...form, listingLimit: e.target.value })} className={input} />
              <p className="text-[11px] text-slate-400 mt-1">How many live or paused listings an account on this plan can have.</p>
            </div>

            {isDefault ? (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                This is the default plan every host starts on. It stays free and active; you can change its name and listing limit.
              </p>
            ) : (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300" />
                Offer this plan to hosts and providers
              </label>
            )}

            {formError && <p role="alert" className="text-sm font-medium text-rose-600">{formError}</p>}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : editing === 'new' ? 'Create plan' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};
