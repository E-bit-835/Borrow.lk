import React, { useCallback, useEffect, useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';

/** Loads data for an admin page and exposes loading / error state plus a reload function. */
export function useAdminData<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(() => {
    setLoading(true);
    return load()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Could not load this page.'))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export const PageHeader: React.FC<{ title: string; description: string; children?: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-6">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
    {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
    {children}
  </div>
);

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/15',
} as const;
export type Tone = keyof typeof TONES;

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${TONES[tone]}`}>
    {children}
  </span>
);

/** One colour per status across the whole console. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'approved':
    case 'published':
    case 'confirmed':
    case 'completed':
    case 'resolved':
    case 'active':
      return 'green';
    case 'pending':
    case 'paused':
    case 'open':
      return 'amber';
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'archived':
      return 'red';
    default:
      return 'slate';
  }
}

const STATUS_LABEL: Record<string, string> = { confirmed: 'Accepted', published: 'Live' };
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Badge tone={statusTone(status)}>{STATUS_LABEL[status] || status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
);

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({
  value,
  onChange,
  placeholder,
}) => (
  <div className="relative w-full sm:w-72">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]"
    />
  </div>
);

export const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, label, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

/** Segmented tabs, e.g. Pending / Approved / Rejected. */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto p-1 bg-slate-100 rounded-xl text-sm font-medium" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const BUTTONS = {
  primary: 'bg-[#001A48] hover:bg-[#002669] text-white',
  ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  danger: 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
} as const;

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTONS; small?: boolean }
> = ({ variant = 'ghost', small, className = '', children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
      small ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
    } ${BUTTONS[variant]} ${className}`}
  >
    {children}
  </button>
);

/** Table wrapper that also renders the loading, error and empty states. */
export const DataTable: React.FC<{
  columns: string[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyText: string;
  onRetry?: () => void;
  children: React.ReactNode;
}> = ({ columns, loading, error, isEmpty, emptyText, onRetry, children }) => (
  <Card className="overflow-hidden">
    {error ? (
      <div className="p-10 text-center space-y-3">
        <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-600">{error}</p>
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
      </div>
    ) : loading && isEmpty ? (
      <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    ) : isEmpty ? (
      <p className="p-10 text-center text-sm text-slate-500">{emptyText}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60">
              {columns.map((c, i) => (
                <th
                  key={c || i}
                  scope="col"
                  className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap ${
                    i === columns.length - 1 ? 'text-right' : ''
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    )}
  </Card>
);

export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>
);

/** Confirmation dialog for actions that affect users or listings. */
export const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-left"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>
            {busy ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Delays a fast-changing value (search text) so the API is not called on every keystroke. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
