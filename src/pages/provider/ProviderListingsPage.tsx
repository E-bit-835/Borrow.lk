import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, ExternalLink, MapPin, Star } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Badge, Button, StatusBadge, ConfirmDialog, Tabs, useAdminData } from '../../components/admin/adminUi';
import { hostService, type HostListing } from '../../services/host';
import { formatPrice } from '../../data/categories';

type Filter = 'all' | 'published' | 'paused';

export const ProviderListingsPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => hostService.listings(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<HostListing | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = async (listing: HostListing, status: 'published' | 'paused' | 'archived') => {
    setBusyId(listing.id);
    setActionError(null);
    try {
      await hostService.updateListing(listing.id, { status });
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this listing.');
    } finally {
      setBusyId(null);
      setToRemove(null);
    }
  };

  const all = data || [];
  const listings = filter === 'all' ? all : all.filter((l) => l.status === filter);

  return (
    <ProviderLayout>
      <PageHeader title="My Listings" description="Everything you offer on BorrowLK. Pause a listing to hide it without deleting it.">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: `All (${all.length})` },
            { value: 'published', label: 'Live' },
            { value: 'paused', label: 'Paused' },
          ]}
        />
        <Link to="/provider/listings/create">
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Add a listing
          </Button>
        </Link>
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : listings.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : all.length === 0 ? 'You have no listings yet.' : 'No listings in this view.'}
          </p>
          {!loading && all.length === 0 && (
            <Link to="/provider/listings/create">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Create your first listing
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map((l) => {
            const price = formatPrice(l.pricePerDay, l.priceUnit);
            const busy = busyId === l.id;
            return (
              <Card key={l.id} className="overflow-hidden flex flex-col">
                <div className="relative aspect-[16/10] bg-slate-100">
                  {l.images[0] && <img src={l.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={l.status} />
                  </div>
                  {l.pendingRequests > 0 && (
                    <Link
                      to="/provider/requests"
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold"
                    >
                      {l.pendingRequests} new request{l.pendingRequests > 1 ? 's' : ''}
                    </Link>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone={l.listingType === 'service' ? 'purple' : 'blue'}>{l.subcategory || l.category}</Badge>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {l.rating.toFixed(1)} ({l.reviewsCount})
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{l.title}</h3>
                    <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {l.location}, {l.district}
                    </p>
                  </div>

                  <p className="text-base font-bold text-[#001A48] mt-auto">
                    {price.amount} <span className="text-xs font-medium text-slate-400">{price.per}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <Link to={`/provider/listings/${l.id}/edit`}>
                      <Button small>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </Link>
                    {l.status === 'published' ? (
                      <Button small disabled={busy} onClick={() => setStatus(l, 'paused')}>
                        Pause
                      </Button>
                    ) : (
                      <Button small variant="success" disabled={busy} onClick={() => setStatus(l, 'published')}>
                        Publish
                      </Button>
                    )}
                    {l.status === 'published' && (
                      <a
                        href={`/product/${l.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${l.title} on the marketplace`}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Button small variant="danger" className="ml-auto" onClick={() => setToRemove(l)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Remove this listing?"
          message={`"${toRemove.title}" will be taken off the marketplace and removed from your listings. Existing requests are kept.`}
          confirmLabel="Remove listing"
          danger
          busy={busyId === toRemove.id}
          onConfirm={() => setStatus(toRemove, 'archived')}
          onCancel={() => setToRemove(null)}
        />
      )}
    </ProviderLayout>
  );
};
