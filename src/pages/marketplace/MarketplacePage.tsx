import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../../components/marketplace/MarketplaceFooter';
import { FilterSidebar } from '../../components/marketplace/FilterSidebar';
import { ListingCard } from '../../components/marketplace/ListingCard';
import type { Listing } from '../../data/marketplaceData';
import { useMarketplace } from '../../context/MarketplaceContext';
import { productService } from '../../services/products';
import { productToListing } from '../../utils/productToListing';
import { getCategory } from '../../data/categories';

export const MarketplacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { filters, setFilters, updateFilter, resetFilters } = useMarketplace();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .getAll()
      .then((products) => {
        if (cancelled) return;
        setListings(products.map(productToListing));
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || 'Could not load listings. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    const category = getCategory(searchParams.get('category'));
    const subcategory = searchParams.get('subcategory');
    const location = searchParams.get('location') || searchParams.get('district');

    if (q || category || subcategory || location) {
      setFilters((prev) => ({
        ...prev,
        keyword: q || prev.keyword,
        category: category ? category.slug : prev.category,
        subcategory: subcategory || (category && category.slug !== prev.category ? 'all' : prev.subcategory),
        specs: category && category.slug !== prev.category ? {} : prev.specs,
        location: location ? location.toLowerCase() : prev.location,
      }));
    }
  }, [searchParams, setFilters]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        if (filters.keyword.trim()) {
          const query = filters.keyword.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(query);
          const matchesDesc = item.description.toLowerCase().includes(query);
          const matchesCat = item.category.toLowerCase().includes(query);
          const matchesLocation = `${item.location} ${item.district}`.toLowerCase().includes(query);
          const matchesSub = (item.subcategory || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc && !matchesCat && !matchesLocation && !matchesSub) {
            return false;
          }
        }

        if (filters.category !== 'all' && item.categorySlug !== filters.category) {
          return false;
        }

        if (filters.subcategory !== 'all' && (item.subcategory || '').toLowerCase() !== filters.subcategory.toLowerCase()) {
          return false;
        }

        // Category-specific filters: exact match for numbers, "contains" for text
        for (const [label, wanted] of Object.entries(filters.specs)) {
          const actual = String(item.specifications?.[label] ?? '').toLowerCase();
          const w = wanted.toLowerCase();
          if (/^\d+$/.test(w) ? parseInt(actual, 10) !== parseInt(w, 10) : !actual.includes(w)) return false;
        }

        if (filters.verifiedOnly && !item.provider.verified) {
          return false;
        }

        if (filters.minRating && item.rating < filters.minRating) {
          return false;
        }

        if (filters.location !== 'all') {
          const loc = item.district.toLowerCase();
          if (!loc.includes(filters.location.toLowerCase())) {
            return false;
          }
        }

        if (filters.maxPrice && item.pricePerDay > filters.maxPrice) {
          return false;
        }

        if (filters.availableOnly && !item.availableNow) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_low':
            return a.pricePerDay - b.pricePerDay;
          case 'price_high':
            return b.pricePerDay - a.pricePerDay;
          case 'rating':
            return b.rating - a.rating;
          case 'recent':
            return (b.isRecent ? 1 : 0) - (a.isRecent ? 1 : 0);
          case 'recommended':
          default:
            return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        }
      });
  }, [filters, listings]);

  const category = getCategory(filters.category);
  const isService = category?.listingType === 'service';

  const hasActiveFilters =
    filters.keyword ||
    filters.category !== 'all' ||
    filters.subcategory !== 'all' ||
    Object.keys(filters.specs).length > 0 ||
    filters.verifiedOnly ||
    filters.minRating > 0 ||
    filters.location !== 'all' ||
    filters.maxPrice !== undefined ||
    filters.availableOnly;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      <MarketplaceHeader />

      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001A48] tracking-tight">
                {category ? category.title : 'Rent Anything, Anywhere in Sri Lanka'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {loading
                  ? 'Loading listings…'
                  : category
                  ? category.description
                  : 'Browse rental listings and service providers across all categories.'}
              </p>
              {!loading && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {filteredListings.length} {isService ? 'service' : ''} listing{filteredListings.length === 1 ? '' : 's'} found
                </p>
              )}
              {loadError && <p className="text-[11px] text-amber-600 mt-1">{loadError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => updateFilter('keyword', e.target.value)}
                  placeholder="Search listings..." aria-label="Search listings"
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 focus:bg-white"
                />
                {filters.keyword && (
                  <button
                    type="button"
                    onClick={() => updateFilter('keyword', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-slate-400 font-medium">Active:</span>
              {filters.keyword && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                  &quot;{filters.keyword}&quot;
                  <button onClick={() => updateFilter('keyword', '')} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {category?.name || filters.category}
                  <button onClick={() => setFilters((prev) => ({ ...prev, category: 'all', subcategory: 'all', specs: {} }))} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.location !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                  Location: {filters.location}
                  <button onClick={() => updateFilter('location', 'all')} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.maxPrice && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                  &le; Rs. {filters.maxPrice.toLocaleString()}
                  <button onClick={() => updateFilter('maxPrice', undefined)} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:underline font-bold ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <FilterSidebar />
          <div className="flex-1 w-full min-w-0 space-y-8">
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#001A48]">
                  {loading ? 'Loading listings…' : 'No listings found'}
                </h3>
                {!loading && (
                  <>
                    <p className="text-xs text-slate-500">
                      Try changing your filters or search location.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="bg-[#001A48] hover:bg-[#002669] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs"
                    >
                      Reset All Filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};
