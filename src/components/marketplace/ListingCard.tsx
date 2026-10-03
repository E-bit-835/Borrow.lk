import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, MapPin, Heart, ShieldCheck } from 'lucide-react';
import type { Listing } from '../../data/marketplaceData';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatPrice } from '../../data/categories';
import { listingTypeOf } from '../../utils/productToListing';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { favorites, toggleFavorite } = useMarketplace();
  const navigate = useNavigate();
  const location = useLocation();
  const isFav = favorites.includes(listing.id);
  const isService = listingTypeOf(listing) === 'service';
  const price = formatPrice(listing.pricePerDay, listing.priceUnit);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Saving needs an account: a guest is asked to log in instead of seeing an error
    if (!toggleFavorite(listing.id)) navigate('/login', { state: { from: location.pathname, message: 'Please log in or create an account to continue.' } });
  };

  return (
    <Link
      to={`/product/${listing.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden text-left"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-[#001A48]/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
            {listing.subcategory || listing.category}
          </span>
          {listing.featuredBadge && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg shadow-xs">
              {listing.featuredBadge}
            </span>
          )}
        </div>

        {/* Heart Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-md transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Bottom availability indicator */}
        {listing.availableNow && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Available</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Location & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1 truncate max-w-[170px]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>

            <div className="flex items-center gap-1 text-slate-700 font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{listing.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({listing.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-[#001A48] group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>
        </div>

        {/* Provider Snippet & Price */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          {/* Provider */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={listing.provider.avatar}
              alt={listing.provider.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-600 truncate max-w-[110px]">
                {listing.provider.name}
              </span>
              {listing.provider.verified && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-700">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  {isService ? 'Verified Provider' : 'Verified Host'}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-right shrink-0 pl-2">
            <span className="text-base font-extrabold text-[#001A48]">{price.amount}</span>
            {price.per && <span className="text-[11px] text-slate-400 font-medium"> {price.per}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};
