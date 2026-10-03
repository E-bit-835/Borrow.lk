import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button, useDebounced } from './adminUi';
import { adminService, type AdminUser, type Plan } from '../../services/admin';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';

/** Dialog shell: closes on Escape or a click outside. */
export const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-left max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/** Search for an account by name or email and pick it. */
export const UserPicker: React.FC<{ value: AdminUser | null; onChange: (u: AdminUser | null) => void; hint?: string }> = ({ value, onChange, hint }) => {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value || q.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    adminService
      .users({ search: q.trim(), role: 'renter' })
      .then((users) => !cancelled && setResults(users.slice(0, 6)))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, value]);

  if (value) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
        <img src={value.avatar || DEFAULT_AVATAR} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{value.name}</p>
          <p className="text-xs text-slate-500 truncate">{value.email}</p>
        </div>
        <Button small onClick={() => onChange(null)}>Change</Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Type a name or email"
        aria-label="Search for an account"
        className={input}
        autoFocus
      />
      {hint && search.trim().length < 2 && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {search.trim().length >= 2 && (
        <ul className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {results.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => onChange(u)} className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-slate-50 cursor-pointer">
                <img src={u.avatar || DEFAULT_AVATAR} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 truncate">{u.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{u.email}</span>
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">{loading ? 'Searching...' : 'No account found.'}</li>}
        </ul>
      )}
    </div>
  );
};

const METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online_transfer', label: 'Online transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
  { value: 'cash', label: 'Cash' },
];

/** Record a payment the admin received directly; the chosen plan starts for that account at once. */
export const RecordPaymentDialog: React.FC<{ plans: Plan[]; onClose: () => void; onSaved: () => void }> = ({ plans, onClose, onSaved }) => {
  const paidPlans = plans.filter((p) => !p.isDefault);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [planId, setPlanId] = useState(paidPlans[0]?.id || '');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = paidPlans.find((p) => p.id === planId);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return setError('Choose the host or provider who paid.');
    if (!plan) return setError('Choose a plan.');
    if (reference.trim().length < 2) return setError('Enter a reference or a short note.');
    setSaving(true);
    try {
      await adminService.recordPayment({ userId: user.id, planId: plan.id, method, reference: reference.trim() });
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not record the payment.');
      setSaving(false);
    }
  };

  return (
    <Dialog title="Record a payment" onClose={onClose}>
      <form onSubmit={save} noValidate className="space-y-4">
        <div>
          <span className={label}>Who paid?</span>
          <UserPicker value={user} onChange={setUser} hint="Search for the host or provider's account." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rp-plan" className={label}>Plan</label>
            <select id="rp-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className={`${input} cursor-pointer`}>
              {paidPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-method" className={label}>Paid by</label>
            <select id="rp-method" value={method} onChange={(e) => setMethod(e.target.value)} className={`${input} cursor-pointer`}>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="rp-ref" className={label}>Reference or note</label>
          <input id="rp-ref" type="text" maxLength={255} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. slip number, or 'paid in person'" className={input} />
        </div>

        {plan && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5">
            Records <span className="font-semibold text-slate-900">Rs. {plan.price.toLocaleString()}</span> and starts the{' '}
            <span className="font-semibold text-slate-900">{plan.name}</span> plan for {plan.durationDays} days ({plan.listingLimit} listings).
          </p>
        )}
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Record payment'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
