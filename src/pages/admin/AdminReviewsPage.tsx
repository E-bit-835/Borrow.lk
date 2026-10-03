import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, DataTable, Td, Button, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService, type AdminReview } from '../../services/admin';

export const AdminReviewsPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => adminService.reviews(), []);
  const [target, setTarget] = useState<AdminReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.deleteReview(target.id);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not delete this review.');
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const reviews = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Reviews" description="Reviews customers left on listings. Delete a review that breaks the rules." />

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <DataTable
        columns={['Listing', 'Author', 'Rating', 'Review', 'Date', '']}
        loading={loading}
        error={error}
        isEmpty={reviews.length === 0}
        emptyText="No reviews yet."
        onRetry={reload}
      >
        {reviews.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50/60">
            <Td>
              <p className="font-semibold text-slate-900 truncate max-w-[220px]">{r.listingTitle}</p>
            </Td>
            <Td className="text-slate-700 whitespace-nowrap">{r.author}</Td>
            <Td>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800" aria-label={`${r.rating} out of 5`}>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {r.rating}
              </span>
            </Td>
            <Td>
              <p className="text-slate-600 max-w-md line-clamp-2">{r.comment}</p>
            </Td>
            <Td className="text-slate-600 whitespace-nowrap">{formatDate(r.createdAt)}</Td>
            <Td className="text-right">
              <Button small variant="danger" onClick={() => setTarget(r)}>
                Delete
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      {target && (
        <ConfirmDialog
          title="Delete this review?"
          message={`The review by ${target.author} on "${target.listingTitle}" will be removed permanently.`}
          confirmLabel="Delete review"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setTarget(null)}
        />
      )}
    </AdminLayout>
  );
};
