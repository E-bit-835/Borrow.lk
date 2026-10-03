import React from 'react';
import { Star } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { hostService } from '../../services/host';

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
    ))}
  </span>
);

export const ProviderReviewsPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => hostService.reviews(), []);
  const reviews = data || [];
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <ProviderLayout>
      <PageHeader title="Reviews" description="What customers said about your listings." />

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500">
          {loading ? 'Loading...' : 'No reviews yet. They appear here after customers review your listings.'}
        </Card>
      ) : (
        <>
          <Card className="p-5 mb-5 flex items-center gap-4">
            <p className="text-4xl font-bold text-slate-900 tabular-nums">{average.toFixed(1)}</p>
            <div>
              <Stars rating={Math.round(average)} />
              <p className="text-sm text-slate-500 mt-0.5">
                Average from {reviews.length} review{reviews.length > 1 ? 's' : ''}
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start gap-3">
                  {r.authorAvatar ? (
                    <img src={r.authorAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-slate-900">{r.author}</p>
                      <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-slate-500 truncate">on {r.listingTitle}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </ProviderLayout>
  );
};
