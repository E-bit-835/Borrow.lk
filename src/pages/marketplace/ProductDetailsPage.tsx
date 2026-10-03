import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Star,
  Share2,
  Heart,
  CheckCircle2,
  AlertCircle,
  Check,
  PackageCheck,
  FileText,
  ArrowLeft,
  Sparkles,
  Flag,
} from 'lucide-react';
import type { Listing } from '../../data/marketplaceData';
import { useMarketplace } from '../../context/MarketplaceContext';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../../components/marketplace/MarketplaceFooter';
import { ProductGallery } from '../../components/marketplace/ProductGallery';
import { BookingBox } from '../../components/marketplace/BookingBox';
import { ProviderCard } from '../../components/marketplace/ProviderCard';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { productService } from '../../services/products';
import { productToListing, listingTypeOf } from '../../utils/productToListing';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useMarketplace();

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const openReport = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}`, message: 'Please log in to continue.' } });
      return;
    }
    setReportState('idle');
    setReportOpen(true);
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || reportReason.trim().length < 5) return;
    setReportState('sending');
    try {
      await productService.report(id, reportReason.trim());
      setReportState('sent');
      setReportReason('');
    } catch {
      setReportState('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setListing(null);

    const load = async () => {
      try {
        if (id) {
          const product = await productService.getById(id);
          if (cancelled) return;
          const mapped = productToListing(product);
          setListing(mapped);

          const all = await productService.getAll();
          if (cancelled) return;
          setRelatedListings(
            all
              .filter((p) => p.id !== mapped.id)
              .sort((a, b) => Number(b.categorySlug === mapped.categorySlug) - Number(a.categorySlug === mapped.categorySlug))
              .slice(0, 3)
              .map(productToListing)
          );
        }
      } catch {
        if (cancelled) return;
        setListing(null);
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const favorited = listing ? isFavorite(listing.id) : false;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading && !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center text-sm text-slate-500">
          Loading listing…
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <MarketplaceHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-xl font-bold text-[#001A48]">Listing not found</h1>
          <p className="text-sm text-slate-500">This listing may have been removed or the link is invalid.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 bg-[#001A48] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  const isService = listingTypeOf(listing) === 'service';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketplaceHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-slate-500 mb-6 overflow-x-auto py-1"
        >
          <Link to="/" className="hover:text-[#00B4A7] transition-colors whitespace-nowrap">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/marketplace" className="hover:text-[#00B4A7] transition-colors whitespace-nowrap">
            Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link
            to={`/marketplace?category=${listing.categorySlug}`}
            className="hover:text-[#00B4A7] transition-colors whitespace-nowrap font-medium text-slate-600"
          >
            {listing.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-md">
            {listing.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <ProductGallery images={listing.images} title={listing.title} />

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-[#001A48]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      {listing.category}
                    </span>
                    {listing.subcategory && (
                      <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {listing.subcategory}
                      </span>
                    )}
                    {listing.featuredBadge && (
                      <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {listing.featuredBadge}
                      </span>
                    )}
                    {listing.availableNow && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Available Now
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001A48] tracking-tight">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.location}, {listing.district}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {listing.rating.toFixed(1)} ({listing.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedLink ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!toggleFavorite(listing.id)) {
                        navigate('/login', { state: { from: `/product/${listing.id}`, message: 'Please log in or create an account to continue.' } });
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                      favorited
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-rose-500' : ''}`} />
                    {favorited ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={openReport}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {Object.keys(listing.specifications).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-[#001A48] mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  {isService ? 'Service Details' : `${listing.category} Details`}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(listing.specifications).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-xl px-3 py-2.5">
                      <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        {key}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 mt-0.5">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {listing.includedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-[#001A48] mb-4 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-teal-500" />
                  {isService ? 'What the Service Covers' : listing.categorySlug === 'property' ? 'Amenities' : "What's Included"}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {listing.includedItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {listing.rentalTerms.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-[#001A48] mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  {isService ? 'Service Terms' : listing.categorySlug === 'property' ? 'House Rules' : 'Rental Terms'}
                </h2>
                <ul className="space-y-2">
                  {listing.rentalTerms.map((term) => (
                    <li key={term} className="flex items-start gap-2 text-xs text-slate-600">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {listing.reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-sm font-bold text-[#001A48]">Customer Reviews</h2>
                {listing.reviews.map((review) => (
                  <div key={review.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={review.authorAvatar}
                        alt={review.authorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{review.authorName}</p>
                        <p className="text-[11px] text-slate-400">{review.date}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#001A48]">
                {isService ? 'Provided by' : 'Hosted by'} {listing.provider.name}
              </h2>
              <ProviderCard provider={listing.provider} listingId={listing.id} isService={isService} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <BookingBox listing={listing} />
          </div>
        </div>

        {relatedListings.length > 0 && (
          <section className="mt-12 mb-6">
            <h2 className="text-lg font-extrabold text-[#001A48] mb-5">Similar listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {reportOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setReportOpen(false)}
        >
          <form
            onSubmit={submitReport}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Report listing"
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-left space-y-4"
          >
            <h2 className="text-base font-bold text-[#001A48]">Report this listing</h2>
            {reportState === 'sent' ? (
              <p className="text-sm text-emerald-700 font-semibold">Thank you. Our team will review this listing.</p>
            ) : (
              <>
                <label htmlFor="report-reason" className="block text-xs text-slate-600">
                  Tell us what is wrong (misleading details, wrong category, suspicious activity...).
                </label>
                <textarea
                  id="report-reason"
                  rows={4}
                  maxLength={1000}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-teal-500"
                  required
                />
                {reportState === 'error' && (
                  <p className="text-xs text-red-600 font-semibold">Could not send the report. Please try again.</p>
                )}
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                Close
              </button>
              {reportState !== 'sent' && (
                <button
                  type="submit"
                  disabled={reportState === 'sending' || reportReason.trim().length < 5}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#001A48] rounded-xl disabled:opacity-60"
                >
                  {reportState === 'sending' ? 'Sending...' : 'Send Report'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <MarketplaceFooter />
    </div>
  );
};
