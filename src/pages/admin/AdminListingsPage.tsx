import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  PageHeader, DataTable, Td, Badge, StatusBadge, SearchInput, Select, Button, ConfirmDialog, useAdminData, useDebounced,
} from '../../components/admin/adminUi';
import { adminService, type AdminListing } from '../../services/admin';
import { CATEGORY_DEFS, formatPrice, type PriceUnit } from '../../data/categories';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Live' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];
const CATEGORY_OPTIONS = [{ value: 'all', label: 'All categories' }, ...CATEGORY_DEFS.map((c) => ({ value: c.slug, label: c.name }))];

type Action = { listing: AdminListing; status: 'published' | 'paused' | 'archived' };

export const AdminListingsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useAdminData(
    () => adminService.listings({ search: q, status, category }),
    [q, status, category]
  );

  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const apply = async (a: Action) => {
    setBusy(true);
    setActionError(null);
    try {
      await adminService.setListingStatus(a.listing.id, a.status);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this listing.');
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const listings = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Listings" description="All rental and service listings. Pause a listing to hide it from the marketplace.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or owner" />
        <Select value={category} onChange={setCategory} label="Category" options={CATEGORY_OPTIONS} />
        <Select value={status} onChange={setStatus} label="Status" options={STATUS_OPTIONS} />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <DataTable
        columns={['Listing', 'Category', 'Price', 'District', 'Status', '']}
        loading={loading}
        error={error}
        isEmpty={listings.length === 0}
        emptyText="No listings match your filters."
        onRetry={reload}
      >
        {listings.map((l) => {
          const price = formatPrice(l.price, l.priceUnit as PriceUnit);
          return (
            <tr key={l.id} className="hover:bg-slate-50/60">
              <Td>
                <div className="flex items-center gap-3 min-w-[240px]">
                  {l.image ? (
                    <img src={l.image} alt="" className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-10 rounded-lg bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate max-w-[280px]">{l.title}</p>
                    <p className="text-xs text-slate-500 truncate">{l.ownerName || 'No owner'}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <Badge tone={l.listingType === 'service' ? 'purple' : 'blue'}>{l.category}</Badge>
                  {l.subcategory && <span className="text-xs text-slate-500">{l.subcategory}</span>}
                </div>
              </Td>
              <Td className="whitespace-nowrap text-slate-700">
                {price.amount} <span className="text-slate-400">{price.per}</span>
              </Td>
              <Td className="text-slate-600">{l.district}</Td>
              <Td>
                <StatusBadge status={l.status} />
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1.5">
                  {l.status === 'published' && (
                    <a
                      href={`/product/${l.id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${l.title}`}
                      className="inline-flex items-center px-2 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {l.status === 'published' ? (
                    <Button small disabled={busy} onClick={() => apply({ listing: l, status: 'paused' })}>
                      Pause
                    </Button>
                  ) : (
                    <Button small variant="success" disabled={busy} onClick={() => apply({ listing: l, status: 'published' })}>
                      Publish
                    </Button>
                  )}
                  {l.status !== 'archived' && (
                    <Button small variant="danger" onClick={() => setAction({ listing: l, status: 'archived' })}>
                      Archive
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </DataTable>

      {action && (
        <ConfirmDialog
          title="Archive this listing?"
          message={`"${action.listing.title}" will be removed from the marketplace. You can publish it again later.`}
          confirmLabel="Archive"
          danger
          busy={busy}
          onConfirm={() => apply(action)}
          onCancel={() => setAction(null)}
        />
      )}
    </AdminLayout>
  );
};
