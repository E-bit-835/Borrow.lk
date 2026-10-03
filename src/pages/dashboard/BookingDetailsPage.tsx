import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Phone, Star, CheckCircle2, Info } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card, Badge, Button, StatusBadge, ConfirmDialog, useAdminData, formatDate } from '../../components/admin/adminUi';
import { orderService } from '../../services/orders';
import { meService } from '../../services/me';

const STATUS_TEXT: Record<string, string> = {
  pending: 'Waiting for the host or provider to answer your request.',
  confirmed: 'Accepted. Arrange pickup, delivery and payment directly with them.',
  active: 'In progress.',
  completed: 'Completed. Thank you for using BorrowLK.',
  rejected: 'This request was declined. You can look for a similar listing.',
  cancelled: 'This request was cancelled.',
};
const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAdminData(
    async () => {
      const [order, reviewed] = await Promise.all([orderService.getById(id!), meService.reviewedListingIds()]);
      return { order, reviewed: reviewed.includes(order.productId) };
    },
    [id]
  );

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const run = async (work: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setActionError(null);
    try {
      await work();
      after?.();
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  };

  if (!data) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm text-slate-600">{loading ? 'Loading booking...' : error || 'Booking not found.'}</p>
          {!loading && <Button onClick={() => navigate('/bookings')}>Back to My Bookings</Button>}
        </Card>
      </DashboardLayout>
    );
  }

  const { order, reviewed } = data;
  const isService = (order.product as { listingType?: string }).listingType === 'service';
  const other = isService ? 'provider' : 'host';
  const accepted = ['confirmed', 'active', 'completed'].includes(order.status);

  return (
    <DashboardLayout>
      <PageHeader title={order.product.title} description={`${isService ? 'Service request' : 'Rental request'} ${order.orderNumber}`}>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <img src={order.product.image} alt="" className="w-full sm:w-40 h-44 sm:h-28 rounded-xl object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={isService ? 'purple' : 'blue'}>{isService ? 'Service' : 'Rental'}</Badge>
                  <StatusBadge status={order.status} />
                </div>
                <p className="flex items-start gap-2 text-sm text-slate-700">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  {STATUS_TEXT[order.status]}
                </p>
                <Link to={`/product/${order.productId}`} className="inline-block text-xs font-semibold text-teal-700 hover:underline">
                  View the listing
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dates</dt>
                <dd className="flex items-center gap-1.5 text-slate-800 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  {formatDate(order.startDate)}
                  {order.endDate !== order.startDate && <> to {formatDate(order.endDate)}</>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimated cost</dt>
                <dd className="text-slate-800 mt-0.5">
                  <span className="font-semibold">Rs. {order.totalPrice.toLocaleString()}</span>
                  {(order.quantity || 1) > 1 && <span className="text-slate-500"> · quantity {order.quantity}</span>}
                </dd>
              </div>
              {order.product.location && (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Location</dt>
                  <dd className="flex items-center gap-1.5 text-slate-800 mt-0.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {order.product.location}
                  </dd>
                </div>
              )}
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your message</dt>
                  <dd className="text-slate-700 mt-0.5 whitespace-pre-line">{order.notes}</dd>
                </div>
              )}
            </dl>

            <p className="text-xs text-slate-500 mt-5 pt-4 border-t border-slate-100">
              No payment is taken on BorrowLK. You pay the {other} directly once your request is accepted.
            </p>
          </Card>

          {/* Review: only after a completed booking, once per listing */}
          {order.status === 'completed' && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Your review</h2>
              {reviewed ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  You reviewed this listing. Thank you.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (comment.trim().length < 5) return setActionError('Write a few words about your experience.');
                    run(() => meService.addReview({ orderId: order.id, rating, comment: comment.trim() }));
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        onClick={() => setRating(n)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`How was your experience with this ${isService ? 'service' : 'rental'}?`}
                    aria-label="Review"
                    className={input}
                  />
                  <Button type="submit" variant="primary" disabled={busy}>
                    {busy ? 'Sending...' : 'Post review'}
                  </Button>
                </form>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">{isService ? 'Provider' : 'Host'}</h2>
            <p className="text-sm font-semibold text-slate-900">{order.provider?.name || 'BorrowLK member'}</p>
            {order.provider?.city && (
              <p className="text-xs text-slate-500">
                {order.provider.city}, {order.provider.district}
              </p>
            )}
            {/* The phone number is shared only once the request is accepted */}
            {accepted && order.provider?.phone ? (
              <a href={`tel:${order.provider.phone}`} className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-teal-700 hover:underline">
                <Phone className="w-4 h-4" />
                {order.provider.phone}
              </a>
            ) : (
              <p className="text-xs text-slate-500 mt-3">Their phone number is shown once your request is accepted.</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!message.trim()) return;
                run(() => meService.messageOwner(order.productId, message.trim()), () => {
                  setMessage('');
                  setMessageSent(true);
                });
              }}
              className="mt-4 pt-4 border-t border-slate-100 space-y-2"
            >
              <label htmlFor="bd-message" className="block text-xs font-semibold text-slate-700">
                Send a message
              </label>
              <textarea
                id="bd-message"
                rows={3}
                maxLength={2000}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setMessageSent(false);
                }}
                placeholder={`Ask the ${other} a question`}
                className={input}
              />
              {messageSent && (
                <p className="text-xs font-medium text-emerald-700">
                  Message sent.{' '}
                  <Link to="/messages" className="underline">
                    Open Messages
                  </Link>
                </p>
              )}
              <Button type="submit" small variant="primary" disabled={busy || !message.trim()}>
                Send message
              </Button>
            </form>
          </Card>

          {['pending', 'confirmed'].includes(order.status) && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Change of plans?</h2>
              <p className="text-xs text-slate-500 mb-3">You can cancel before the {isService ? 'service' : 'rental'} starts.</p>
              <Button variant="danger" onClick={() => setConfirmCancel(true)}>
                Cancel {order.status === 'pending' ? 'request' : 'booking'}
              </Button>
            </Card>
          )}
        </div>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title={order.status === 'pending' ? 'Cancel this request?' : 'Cancel this booking?'}
          message={`"${order.product.title}" will be cancelled and the ${other} will be told.`}
          confirmLabel="Yes, cancel"
          danger
          busy={busy}
          onConfirm={() => run(() => orderService.updateStatus(order.id, 'cancelled'))}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </DashboardLayout>
  );
};
