import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import type { Listing } from '../../data/marketplaceData';
import { formatPrice } from '../../data/categories';
import { listingTypeOf } from '../../utils/productToListing';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/products';
import { orderService } from '../../services/orders';

interface BookingBoxProps {
  listing: Listing;
}

const isoDay = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];
const input =
  'w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-teal-500';
const label = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5';

/**
 * Request panel on a listing page: pick dates, check availability, send a request to the host / provider.
 * No payment is taken here. BorrowLK does not charge customers; the cost shown is an estimate only.
 */
export const BookingBox: React.FC<BookingBoxProps> = ({ listing }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isService = listingTypeOf(listing) === 'service';
  const unit = listing.priceUnit || 'day';
  const price = formatPrice(listing.pricePerDay, unit);
  // One-off units are requested for a single date; everything else for a date range
  const singleDate = unit === 'hour' || unit === 'service' || unit === 'quote';
  // Quantity only makes sense for countable items, not a property, a vehicle or a person
  const showQuantity = !isService && !['property', 'vehicle'].includes(listing.categorySlug);

  const [startDate, setStartDate] = useState(isoDay(1));
  const [endDate, setEndDate] = useState(isoDay(singleDate ? 1 : 3));
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');

  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);

  const effectiveEnd = singleDate ? startDate : endDate;
  const days = Math.max(1, Math.round((Date.parse(effectiveEnd) - Date.parse(startDate)) / 86400000) + 1);
  const periods =
    unit === 'week' ? Math.ceil(days / 7) : unit === 'month' ? Math.ceil(days / 30) : unit === 'day' || unit === 'night' ? days : 1;
  const estimate = listing.pricePerDay * periods * quantity;
  const datesValid = !!startDate && !!effectiveEnd && Date.parse(effectiveEnd) >= Date.parse(startDate);

  const resetResult = () => {
    setAvailability(null);
    setError(null);
  };

  const checkAvailability = async () => {
    if (!datesValid) {
      setError('The end date cannot be before the start date.');
      return null;
    }
    setChecking(true);
    setError(null);
    try {
      const result = await productService.checkAvailability(listing.id, startDate, effectiveEnd);
      setAvailability(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Could not check availability. Please try again.');
      return null;
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: location.pathname, message: 'Please log in or create an account to continue.' },
      });
      return;
    }
    if (!datesValid) {
      setError('The end date cannot be before the start date.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const notes = [duration.trim() && `Duration: ${duration.trim()}`, message.trim()].filter(Boolean).join('\n');
      const order = await orderService.create({
        productId: listing.id,
        startDate,
        endDate: effectiveEnd,
        quantity,
        notes: notes || undefined,
      });
      setRequestNumber(order.orderNumber);
    } catch (err: any) {
      if (err.code === 'UNAVAILABLE') setAvailability({ available: false, message: err.message });
      else setError(err.message || 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (requestNumber) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 text-left space-y-4 lg:sticky lg:top-28">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {isService ? 'Service request sent' : 'Rental request sent'}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Request <span className="font-bold text-slate-800">{requestNumber}</span> is pending. {listing.provider.name}{' '}
          will accept or decline it. You will get a notification, and you can follow it under Requests.
        </p>
        <Link
          to="/requests"
          className="w-full bg-[#001A48] hover:bg-[#002669] text-white font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2"
        >
          View My Requests
          <ArrowRight className="w-4 h-4 text-teal-300" />
        </Link>
      </div>
    );
  }

  const ownListing = !!user && user.id === listing.provider.id;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 text-left space-y-5 lg:sticky lg:top-28"
    >
      <div className="pb-4 border-b border-slate-100">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#001A48]">{price.amount}</span>
        {price.per && <span className="text-sm text-slate-500 font-medium"> {price.per}</span>}
        <p className="text-[11px] text-slate-500 mt-1">
          {isService ? 'Service pricing set by the provider' : 'Rental price set by the host'}
        </p>
      </div>

      <div className={`grid gap-3 ${singleDate ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <label htmlFor="req-start" className={label}>
            {singleDate ? 'Date needed' : isService ? 'From' : 'Start date'}
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="req-start"
              type="date"
              min={isoDay(0)}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetResult();
              }}
              className={`${input} pl-9`}
              required
            />
          </div>
        </div>
        {!singleDate && (
          <div>
            <label htmlFor="req-end" className={label}>
              {isService ? 'Until' : 'End date'}
            </label>
            <input
              id="req-end"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetResult();
              }}
              className={input}
              required
            />
          </div>
        )}
      </div>

      {isService && (
        <div>
          <label htmlFor="req-duration" className={label}>
            Duration needed
          </label>
          <input
            id="req-duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={unit === 'hour' ? 'e.g. 3 hours' : 'e.g. 3 days, 8 hours a day'}
            className={input}
          />
        </div>
      )}

      {showQuantity && (
        <div>
          <label htmlFor="req-qty" className={label}>
            Quantity
          </label>
          <input
            id="req-qty"
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className={input}
          />
        </div>
      )}

      <div>
        <label htmlFor="req-message" className={label}>
          {isService ? 'Your requirements' : 'Message to the host'}{' '}
          <span className="normal-case font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="req-message"
          rows={3}
          maxLength={1500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isService ? 'e.g. I need a driver for a trip from Colombo to Kandy.' : 'e.g. Pickup time, how you plan to use it.'}
          className={input}
        />
      </div>

      {unit !== 'quote' && (
        <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>
              {price.amount} x {periods} {unit === 'service' ? 'service' : unit}
              {periods > 1 ? 's' : ''}
              {quantity > 1 ? ` x ${quantity}` : ''}
            </span>
            <span className="font-bold text-[#001A48]">Rs. {estimate.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-500">Estimated cost. The final amount is agreed with the {isService ? 'provider' : 'host'}.</p>
        </div>
      )}

      {availability && (
        <div
          role="status"
          className={`flex items-start gap-2 text-xs font-semibold rounded-xl px-3 py-2.5 border ${
            availability.available
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {availability.available ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {availability.message}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-2 text-xs font-semibold rounded-xl px-3 py-2.5 border bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={checkAvailability}
          disabled={checking}
          className="w-full border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm py-3 px-6 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
        >
          {checking ? 'Checking...' : 'Check Availability'}
        </button>
        <button
          type="submit"
          disabled={submitting || ownListing || availability?.available === false}
          className="w-full bg-[#001A48] hover:bg-[#002669] text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : isService ? 'Request Service' : 'Request to Rent'}
          {!submitting && <ArrowRight className="w-4 h-4 text-teal-300" />}
        </button>
        {ownListing && <p className="text-[11px] text-slate-500 text-center">This is your own listing.</p>}
        {!isAuthenticated && (
          <p className="text-[11px] text-slate-500 text-center">Please log in to continue. It only takes a moment.</p>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <p className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          No payment is taken on Borrow.lk. You arrange payment directly with the {isService ? 'provider' : 'host'} once
          your request is accepted.
        </p>
        {listing.provider.verified && (
          <p className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            {isService ? 'Verified provider' : 'Verified host'}
          </p>
        )}
      </div>
    </form>
  );
};
