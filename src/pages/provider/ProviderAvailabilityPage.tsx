import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Lock, AlertCircle, X, CalendarDays, Info } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { hostService, type HostListing } from '../../services/host';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../data/categories';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};
const readable = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const ProviderAvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const today = todayIso();

  const [listings, setListings] = useState<HostListing[]>([]);
  const [bookings, setBookings] = useState<Array<{ id: string; listingId: string; customerName: string; startDate: string; endDate: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const selectedListing = listings.find((l) => l.id === selectedListingId) || listings[0];
  const listingId = selectedListing?.id || '';

  // My listings + the requests I have accepted (these are the "booked" days)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const localDay = (iso: string) => {
      const d = new Date(iso);
      return toIso(d.getFullYear(), d.getMonth(), d.getDate());
    };
    Promise.all([hostService.listings(), hostService.requests(user.id)])
      .then(([ls, orders]) => {
        if (cancelled) return;
        setListings(ls);
        setBookings(
          orders
            .filter((o) => o.status === 'confirmed' || o.status === 'active')
            .map((o) => ({
              id: o.id,
              listingId: o.productId,
              customerName: o.customer?.name || 'Customer',
              startDate: localDay(o.startDate),
              endDate: localDay(o.endDate),
            }))
        );
      })
      .catch((err) => !cancelled && setPageError(err.message || 'Could not load your calendar.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Blocked days for the selected listing, saved on the server so customers cannot request them
  const [listingBlocked, setListingBlocked] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    setListingBlocked([]);
    hostService
      .blockedDates(listingId)
      .then((dates) => !cancelled && setListingBlocked(dates))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const saveBlocked = (dates: string[], blocked: boolean) => {
    setSaveError(null);
    // Show the change straight away, then confirm with the server's list
    setListingBlocked((prev) => (blocked ? Array.from(new Set([...prev, ...dates])) : prev.filter((d) => !dates.includes(d))));
    hostService
      .setBlocked(listingId, dates, blocked)
      .then(setListingBlocked)
      .catch((err) => {
        setSaveError(err.message || 'Could not save. Please try again.');
        hostService.blockedDates(listingId).then(setListingBlocked).catch(() => {});
      });
  };
  const toggleBlockDate = (_listingId: string, dateStr: string) => saveBlocked([dateStr], !listingBlocked.includes(dateStr));
  const blockDateRange = (_listingId: string, startDate: string, endDate: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    while (cursor <= end && dates.length < 366) {
      dates.push(toIso(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
      cursor.setDate(cursor.getDate() + 1);
    }
    saveBlocked(dates, true);
  };

  // The calendar opens on the current month
  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const goMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () => {
    const now = new Date();
    setView({ year: now.getFullYear(), month: now.getMonth() });
  };

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStart, setBlockStart] = useState(today);
  const [blockEnd, setBlockEnd] = useState(today);
  const [blockError, setBlockError] = useState<string | null>(null);

  const bookingFor = (dateStr: string) =>
    bookings.find((b) => b.listingId === listingId && dateStr >= b.startDate && dateStr <= b.endDate);

  // Month grid, Monday first, padded with blanks so every week has seven cells
  const monthLabel = new Date(view.year, view.month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leadingBlanks = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => toIso(view.year, view.month, i + 1));
  const cells: Array<string | null> = [...Array(leadingBlanks).fill(null), ...monthDates];
  while (cells.length % 7 !== 0) cells.push(null);

  // Real numbers for the month on screen
  const bookedCount = monthDates.filter((d) => bookingFor(d)).length;
  const blockedCount = monthDates.filter((d) => !bookingFor(d) && listingBlocked.includes(d)).length;
  const freeCount = monthDates.filter((d) => d >= today && !bookingFor(d) && !listingBlocked.includes(d)).length;

  const upcomingBlocked = listingBlocked.filter((d) => d >= today).sort();
  const upcomingBookings = bookings
    .filter((b) => b.listingId === listingId && b.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const openBlockModal = () => {
    setBlockStart(today);
    setBlockEnd(today);
    setBlockError(null);
    setShowBlockModal(true);
  };

  const handleApplyBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockEnd < blockStart) {
      setBlockError('The end date cannot be before the start date.');
      return;
    }
    blockDateRange(listingId, blockStart, blockEnd);
    // Show the month that was just blocked
    const d = new Date(`${blockStart}T00:00:00`);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setShowBlockModal(false);
  };

  // Close the dialog with Escape
  useEffect(() => {
    if (!showBlockModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowBlockModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBlockModal]);

  if (loading || pageError) {
    return (
      <ProviderLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          {pageError || 'Loading your calendar...'}
        </div>
      </ProviderLayout>
    );
  }

  if (!selectedListing) {
    return (
      <ProviderLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 max-w-lg mx-auto">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">No listings yet</h1>
          <p className="text-sm text-slate-500">Create a listing first, then manage when it is available here.</p>
          <Link
            to="/provider/listings/create"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#001A48] hover:bg-[#001438] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create a Listing
          </Link>
        </div>
      </ProviderLayout>
    );
  }

  const price = formatPrice(selectedListing.pricePerDay, selectedListing.priceUnit);

  return (
    <ProviderLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Availability</h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a listing, then tap a day to block it. Blocked days cannot be requested by customers.
            </p>
          </div>
          <button
            type="button"
            onClick={openBlockModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#001A48] hover:bg-[#001438] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Block a Date Range
          </button>
        </div>

        {/* Listing picker + this month's numbers */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <label htmlFor="availability-listing" className="text-sm font-bold text-slate-700 shrink-0">
              Listing
            </label>
            <select
              id="availability-listing"
              value={listingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="w-full sm:w-auto sm:max-w-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#001A48] cursor-pointer"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 shrink-0">
              {price.amount} {price.per}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {freeCount} free
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-[#001A48]" />
              {bookedCount} booked
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300">
              <Lock className="w-3 h-3" />
              {blockedCount} blocked
            </span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                aria-label="Previous month"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 w-36 sm:w-44 text-center" aria-live="polite">
                {monthLabel}
              </h2>
              <button
                type="button"
                onClick={() => goMonth(1)}
                aria-label="Next month"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Today
            </button>
          </div>

          {saveError && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {saveError}
            </p>
          )}
          <p className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-px" />
            Tap a free day to block it. Tap a blocked day to open it again. Booked days cannot be changed here.
          </p>

          <div>
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 pb-1.5 uppercase tracking-wider">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((dateStr, idx) => {
                if (!dateStr) return <div key={`blank-${idx}`} aria-hidden="true" />;

                const day = Number(dateStr.slice(8));
                const booking = bookingFor(dateStr);
                const isBlocked = !booking && listingBlocked.includes(dateStr);
                const isPast = dateStr < today;
                const isToday = dateStr === today;
                const state = booking ? 'Booked' : isBlocked ? 'Blocked' : isPast ? 'Past' : 'Free';
                const disabled = !!booking || isPast;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleBlockDate(listingId, dateStr)}
                    aria-label={`${readable(dateStr)}: ${state}${
                      booking ? ` by ${booking.customerName}` : isBlocked ? ', tap to unblock' : !isPast ? ', tap to block' : ''
                    }`}
                    aria-pressed={isBlocked}
                    className={`group min-h-14 sm:min-h-20 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                      booking
                        ? 'bg-blue-50 border-blue-200 cursor-default'
                        : isBlocked
                        ? 'bg-slate-200/70 border-slate-300 hover:bg-slate-200 cursor-pointer'
                        : isPast
                        ? 'bg-slate-50 border-slate-100 cursor-default'
                        : 'bg-white border-slate-200 hover:border-[#001A48] hover:bg-emerald-50/40 cursor-pointer'
                    } ${isToday ? 'ring-2 ring-teal-500' : ''}`}
                  >
                    <span className={`text-xs sm:text-sm font-bold ${isPast && !booking ? 'text-slate-300' : 'text-slate-800'}`}>
                      {day}
                      {isToday && <span className="hidden sm:inline text-[10px] font-semibold text-teal-700"> Today</span>}
                    </span>

                    {booking ? (
                      <span className="rounded bg-[#001A48] text-white text-[10px] font-bold px-1 sm:px-1.5 py-0.5 truncate">
                        <span className="hidden sm:inline">{booking.customerName.split(' ')[0]}</span>
                        <span className="sm:hidden">Booked</span>
                      </span>
                    ) : isBlocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span className="hidden sm:inline">Blocked</span>
                      </span>
                    ) : !isPast ? (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        <span className="sm:hidden" aria-hidden="true">●</span>
                        <span className="hidden sm:inline">Free</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Blocked dates list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Blocked days ({upcomingBlocked.length})</h3>
            {upcomingBlocked.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing is blocked. This listing can be requested on any free day.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {upcomingBlocked.map((d) => (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => toggleBlockDate(listingId, d)}
                      aria-label={`Unblock ${readable(d)}`}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {readable(d)}
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming bookings for this listing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Upcoming bookings ({upcomingBookings.length})</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming bookings for this listing.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingBookings.slice(0, 5).map((b) => (
                  <li key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{b.customerName}</div>
                        <div className="text-xs text-slate-500">
                          {readable(b.startDate)} to {readable(b.endDate)}
                        </div>
                      </div>
                    </div>
                    <Link to="/provider/requests" className="text-xs font-semibold text-teal-700 hover:underline shrink-0">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Block a date range */}
      {showBlockModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setShowBlockModal(false)}
        >
          <form
            onSubmit={handleApplyBlock}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="block-title" className="text-base font-bold text-slate-900">
                  Block a date range
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{selectedListing.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="block-start" className="block text-xs font-bold text-slate-700 mb-1">
                  From
                </label>
                <input
                  id="block-start"
                  type="date"
                  min={today}
                  value={blockStart}
                  onChange={(e) => {
                    setBlockStart(e.target.value);
                    if (blockEnd < e.target.value) setBlockEnd(e.target.value);
                    setBlockError(null);
                  }}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="block-end" className="block text-xs font-bold text-slate-700 mb-1">
                  To
                </label>
                <input
                  id="block-end"
                  type="date"
                  min={blockStart}
                  value={blockEnd}
                  onChange={(e) => {
                    setBlockEnd(e.target.value);
                    setBlockError(null);
                  }}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>
            </div>

            {blockError && (
              <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {blockError}
              </p>
            )}

            <p className="text-xs text-slate-500">Customers will not be able to request this listing on these days.</p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#001A48] hover:bg-[#001438] text-white text-sm font-bold cursor-pointer"
              >
                Block These Days
              </button>
            </div>
          </form>
        </div>
      )}
    </ProviderLayout>
  );
};
