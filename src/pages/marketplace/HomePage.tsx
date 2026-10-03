import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Star } from 'lucide-react';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../../components/marketplace/MarketplaceFooter';
import { HeroSearchBar } from '../../components/marketplace/HeroSearchBar';
import { CategoryCard } from '../../components/marketplace/CategoryCard';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { CATEGORIES, TOP_PROVIDERS } from '../../data/marketplaceData';
import type { Listing } from '../../data/marketplaceData';
import { productService } from '../../services/products';
import { useAuth } from '../../context/AuthContext';
import { productToListing } from '../../utils/productToListing';

export const HomePage: React.FC = () => {
  const { isHost, isProvider } = useAuth();
  const userRole = isHost || isProvider ? 'provider' : 'renter';
  const [activeTab, setActiveTab] = useState<'all' | 'electronics' | 'vehicle' | 'services' | 'computers'>('all');
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    productService
      .getAll()
      .then((products) => {
        if (!cancelled) {
          setListings(products.map(productToListing));
        }
      })
      .catch(() => {
        /* sections stay empty when the API is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const popularListings = listings.filter((item) => item.isPopular || item.rating >= 4.8);
  const recentListings = listings.filter((item) => item.isRecent).length
    ? listings.filter((item) => item.isRecent)
    : listings.slice(0, 4);

  const filteredPopular =
    activeTab === 'all'
      ? popularListings.length
        ? popularListings
        : listings.slice(0, 6)
      : (popularListings.length ? popularListings : listings).filter((item) => {
          const slug = item.categorySlug.toLowerCase();
          if (activeTab === 'vehicle') return slug.includes('vehicle');
          if (activeTab === 'electronics') return slug.includes('photo') || slug.includes('electronic');
          return slug.includes(activeTab);
        });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      <MarketplaceHeader />

      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-center">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-teal-100/30 to-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Sri Lanka's #1 Peer-to-Peer Rental Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#001A48] tracking-tight leading-tight">
            Rent Anything. Anywhere. <br />
            <span className="text-[#00B4A7]">Anytime.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Borrow high-end cameras, vehicles, tools, laptops, and event gear directly from verified locals across Sri Lanka. Fully insured and guaranteed.
          </p>

          {/* Floating Search Bar */}
          <div className="pt-4">
            <HeroSearchBar />
          </div>

          {/* Popular Search Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Popular:</span>
            <Link
              to="/marketplace?category=electronics"
              className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-700 transition-colors"
            >
              Canon EOS R5
            </Link>
            <Link
              to="/marketplace?category=electronics"
              className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-700 transition-colors"
            >
              Sony A7 IV
            </Link>
            <Link
              to="/marketplace?category=vehicle"
              className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-700 transition-colors"
            >
              Toyota Prius
            </Link>
            <Link
              to="/marketplace?category=services"
              className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-700 transition-colors"
            >
              DeWalt Power Tools
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 2. EXPLORE CATEGORIES ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001A48] tracking-tight">
              Explore Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find exactly what you need for your next project or trip
            </p>
          </div>

          <Link
            to="/marketplace"
            className="text-xs sm:text-sm font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} count={listings.filter((l) => l.categorySlug === cat.slug).length} />
          ))}
        </div>
      </section>

      {/* ================= 3. POPULAR LISTINGS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001A48] tracking-tight">
              Popular Listings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated gear frequently rented by creators and travelers
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'electronics', label: 'Electronics' },
                { id: 'vehicle', label: 'Vehicle' },
                { id: 'services', label: 'Services' },
                { id: 'computers', label: 'Computers' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-[#001A48] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPopular.slice(0, 4).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ================= 4. RECENTLY ADDED ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001A48] tracking-tight">
              Recently Added
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fresh inventory listed by verified hosts in Sri Lanka
            </p>
          </div>

          <Link
            to="/marketplace"
            className="text-xs sm:text-sm font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentListings.slice(0, 4).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ================= 5. PROMOTIONAL PROVIDER BANNER ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="bg-gradient-to-r from-[#001A48] via-[#002669] to-[#001233] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left z-10">
            <span className="inline-block bg-teal-400/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-400/30">
              {userRole === 'provider' ? 'Provider Portal' : 'Earn Passive Income'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {userRole === 'provider'
                ? 'Grow Your Rental Business on BorrowLK'
                : 'Turn Your Unused Equipment Into Daily Revenue'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {userRole === 'provider'
                ? 'Manage bookings, monitor item health, respond to renter inquiries, and withdraw your rental payouts safely.'
                : 'Cameras, drones, tools, or spare vehicles sitting idle? List them securely on BorrowLK. Set your own pricing, vet borrowers, and enjoy comprehensive insurance coverage.'}
            </p>
            <div className="pt-2">
              {userRole === 'provider' ? (
                <Link
                  to="/provider/dashboard"
                  className="inline-flex items-center gap-2 bg-[#00B4A7] hover:bg-[#009E92] text-[#001A48] font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  <span>Go to Provider Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/provider-intro"
                  className="inline-flex items-center gap-2 bg-[#00B4A7] hover:bg-[#009E92] text-[#001A48] font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  <span>Become a Provider Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Floating Metric Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left space-y-4 max-w-sm w-full z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Estimated Monthly Earnings</span>
              <span className="text-teal-400 text-xs font-bold">+28% YoY</span>
            </div>
            <p className="text-3xl font-black text-white">
              LKR 45,000<span className="text-xs font-normal text-slate-300"> /month</span>
            </p>
            <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Zero listing fees to get started</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Verified Sri Lankan renter identity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. HOW BORROWLK WORKS ================= */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full text-center">
        <div className="max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001A48] tracking-tight">
            How BorrowLK Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Simple, safe, and transparent peer-to-peer rentals in three easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Step 1 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-[#001A48]">
              Find &amp; Reserve Gear
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Search by category, date, and district. View authentic photos, specifications, and provider verification ratings before requesting.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-[#001A48]">
              Pickup or Doorstep Delivery
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Arrange secure pickup from the provider's verified studio or opt for fast doorstep delivery with quick digital item inspection.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-[#001A48]">
              Enjoy &amp; Return Safely
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use the equipment with comprehensive protection guarantee. Return the item in good order to automatically release the security deposit.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 7. TOP RATED PROVIDERS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full text-center">
        <div className="max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001A48] tracking-tight">
            Top Rated Providers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Meet the most trusted hosts offering equipment across Sri Lanka
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {TOP_PROVIDERS.map((prov) => (
            <div
              key={prov.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <img
                  src={prov.avatar}
                  alt={prov.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#001A48]">{prov.name}</h4>
                  <p className="text-[11px] text-slate-400">{prov.location}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{prov.rating}</span>
                  <span className="text-slate-400 font-normal">({prov.reviewsCount})</span>
                </span>
                <span className="text-slate-500 font-semibold">{prov.rentalsCount}+ rentals</span>
              </div>

              <Link
                to={`/marketplace`}
                className="block text-center py-2 rounded-xl text-xs font-bold text-[#001A48] bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                View Listings
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 8. BOTTOM BLUE CTA ================= */}
      <section className="bg-[#001A48] text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Start Borrowing or Lending?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join thousands of photographers, cinematographers, travelers, and event organizers saving money on gear every week in Sri Lanka.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/marketplace"
              className="w-full sm:w-auto bg-[#00B4A7] hover:bg-[#009E92] text-[#001A48] font-bold text-xs sm:text-sm py-3.5 px-8 rounded-xl shadow-md transition-all"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/provider-intro"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs sm:text-sm py-3.5 px-8 rounded-xl transition-all"
            >
              List an Item
            </Link>
          </div>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
};
