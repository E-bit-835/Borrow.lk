import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, CreditCard, Lock } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Badge, Button, StatusBadge, DataTable, Td, useAdminData, formatDate } from '../../components/admin/adminUi';
import { hostService } from '../../services/host';
import type { Plan } from '../../services/admin';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const CARD = { value: 'card', label: 'Card payment (Visa / Mastercard)' };
const METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online_transfer', label: 'Online transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
];

/** The host's plan: how many listings it allows, the plans on offer, and paying for one. */
export const ProviderSubscriptionPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => hostService.subscription(), []);
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Back from the card payment page: the gateway confirms the payment a few seconds later
  const [params, setParams] = useSearchParams();
  const cardResult = params.get('card');
  useEffect(() => {
    if (cardResult !== 'return') return;
    const timers = [3000, 8000].map((ms) => setTimeout(reload, ms));
    return () => timers.forEach(clearTimeout);
  }, [cardResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const payByCard = async () => {
    if (!chosen) return;
    setFormError(null);
    setSaving(true);
    try {
      const { action, fields } = await hostService.startCardPayment(chosen.id);
      // Card details are entered on the payment provider's page, never here
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = action;
      for (const [name, value] of Object.entries(fields)) {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        form.appendChild(field);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setFormError(err.message || 'Could not start the card payment.');
      setSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen) return;
    if (method === 'card') return payByCard();
    setFormError(null);
    if (reference.trim().length < 3) return setFormError('Enter the reference from your payment slip or transfer.');
    setSaving(true);
    try {
      await hostService.submitPayment({ planId: chosen.id, method, reference: reference.trim() });
      setChosen(null);
      setReference('');
      await reload();
    } catch (err: any) {
      setFormError(err.message || 'Could not submit your payment.');
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <ProviderLayout>
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm text-slate-600">{loading ? 'Loading your plan...' : error}</p>
          {!loading && <Button onClick={reload}>Try again</Button>}
        </Card>
      </ProviderLayout>
    );
  }

  const pending = data.payments.find((p) => p.status === 'pending');
  const methods = data.cardPayments ? [CARD, ...METHODS] : METHODS;
  const byCard = method === 'card' && data.cardPayments;
  const limit = data.listingLimit;
  const usedPct = limit ? Math.min(100, Math.round((data.listingsUsed / limit) * 100)) : 0;
  const atLimit = limit !== null && data.listingsUsed >= limit;

  return (
    <ProviderLayout>
      <PageHeader title="Subscription" description="Your plan sets how many listings you can have. Customers are never charged." />

      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current plan</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{data.plan?.name || 'No plan'}</p>
            <p className="text-sm text-slate-500">
              {data.expiresAt ? `Active until ${formatDate(data.expiresAt)}` : 'Free plan, no expiry'}
            </p>
          </div>
          <div className="sm:w-72">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-600">Listings used</span>
              <span className={`font-semibold ${atLimit ? 'text-rose-600' : 'text-slate-900'}`}>
                {data.listingsUsed} of {limit ?? 'unlimited'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full ${atLimit ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${usedPct}%` }} />
            </div>
            {atLimit && <p className="text-xs text-rose-600 mt-1.5">You have reached your limit. Choose a larger plan to add more listings.</p>}
          </div>
        </div>
      </Card>

      {cardResult && (
        <Card className={`p-4 mb-6 flex items-start gap-3 ${cardResult === 'return' ? 'bg-teal-50 border-teal-200' : 'bg-slate-50'}`}>
          <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${cardResult === 'return' ? 'text-teal-600' : 'text-slate-500'}`} />
          <p className="text-sm text-slate-800 flex-1">
            {cardResult === 'return'
              ? 'Thank you. Your card payment is being confirmed and your plan will update here in a few seconds.'
              : 'The card payment was cancelled. No money was taken.'}
          </p>
          <button type="button" onClick={() => setParams({}, { replace: true })} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </Card>
      )}

      {pending && (
        <Card className="p-4 mb-6 flex items-start gap-3 bg-amber-50 border-amber-200">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Your payment for the <span className="font-semibold">{pending.planName}</span> plan (reference {pending.reference}) is waiting to be confirmed.
            Your plan changes as soon as our team confirms it.
          </p>
        </Card>
      )}

      <h2 className="text-base font-bold text-slate-900 mb-3">Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {data.plans.map((p) => {
          const current = data.plan?.id === p.id;
          return (
            <Card key={p.id} className={`p-5 flex flex-col gap-3 ${current ? 'ring-2 ring-[#001A48]' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                {current && <Badge tone="blue">Your plan</Badge>}
              </div>
              <p className="text-2xl font-bold text-[#001A48]">
                {p.price === 0 ? 'Free' : `Rs. ${p.price.toLocaleString()}`}
                {p.price > 0 && <span className="text-xs font-medium text-slate-400"> / {p.durationDays} days</span>}
              </p>
              <p className="text-sm text-slate-600 min-h-[2.5rem]">{p.description}</p>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                Up to {p.listingLimit.toLocaleString()} listings
              </p>
              {p.price > 0 && (
                <Button
                  variant={current ? 'ghost' : 'primary'}
                  className="mt-auto"
                  disabled={!!pending}
                  onClick={() => {
                    setChosen(p);
                    setMethod(data.cardPayments ? 'card' : 'bank_transfer');
                    setFormError(null);
                  }}
                >
                  {current ? 'Renew' : 'Choose plan'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <h2 className="text-base font-bold text-slate-900 mb-3">Your payments</h2>
      <DataTable
        columns={['Plan', 'Amount', 'Reference', 'Submitted', 'Status']}
        loading={false}
        error={null}
        isEmpty={data.payments.length === 0}
        emptyText="You have not made any payments."
      >
        {data.payments.map((p) => (
          <tr key={p.id}>
            <Td className="font-semibold text-slate-900">{p.planName}</Td>
            <Td className="whitespace-nowrap tabular-nums text-slate-700">Rs. {p.amount.toLocaleString()}</Td>
            <Td className="text-slate-600 break-all">{p.reference}</Td>
            <Td className="whitespace-nowrap text-slate-600">{formatDate(p.createdAt)}</Td>
            <Td>
              <StatusBadge status={p.status === 'paid' ? 'confirmed' : p.status} />
            </Td>
          </tr>
        ))}
      </DataTable>

      {chosen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setChosen(null)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Pay for the ${chosen.name} plan`}
            noValidate
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-left"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">{chosen.name} plan</h2>
              <p className="text-sm text-slate-600 mt-1">
                {byCard ? (
                  <>
                    Pay <span className="font-semibold text-slate-900">Rs. {chosen.price.toLocaleString()}</span> for {chosen.durationDays} days by card. Your
                    plan is activated as soon as the payment goes through.
                  </>
                ) : (
                  <>
                    Pay <span className="font-semibold text-slate-900">Rs. {chosen.price.toLocaleString()}</span> for {chosen.durationDays} days, then enter the
                    payment reference below. Our team confirms it and your plan is activated.
                  </>
                )}
              </p>
            </div>
            <div>
              <label htmlFor="sp-method" className={label}>{byCard ? 'How do you want to pay?' : 'How did you pay?'}</label>
              <select id="sp-method" value={method} onChange={(e) => setMethod(e.target.value)} className={`${input} cursor-pointer`}>
                {methods.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            {byCard ? (
              <p className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                You will enter your card details on PayHere's secure payment page. BorrowLK never sees or stores your card number.
              </p>
            ) : (
              <div>
                <label htmlFor="sp-ref" className={label}>Payment reference</label>
                <input id="sp-ref" type="text" maxLength={255} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. the transfer or slip number" className={input} />
              </div>
            )}
            {formError && <p role="alert" className="text-sm font-medium text-rose-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setChosen(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {byCard ? (saving ? 'Opening payment page...' : `Pay Rs. ${chosen.price.toLocaleString()} by card`) : saving ? 'Submitting...' : 'Submit payment'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </ProviderLayout>
  );
};
