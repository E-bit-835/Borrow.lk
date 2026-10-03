import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, MapPin, Star, ArrowLeft } from 'lucide-react';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { MarketplaceFooter } from '../../components/marketplace/MarketplaceFooter';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { productService } from '../../services/products';
import { productToListing } from '../../utils/productToListing';
import type { Listing } from '../../data/marketplaceData';

/** Public page for a host / provider: who they are and everything they currently offer. */
export const PublicProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setListings(null);
    setFailed(false);
    productService
      .getAll({ providerId: id })
      .then((products) => !cancelled && setListings(products.map(productToListing)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const provider = listings?.[0]?.provider;
  const hasServices = listings?.some((l) => l.listingType === 'service');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketplaceHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {listings === null && !failed ? (
          <p className="text-sm text-slate-500 text-center py-20">Loading profile…</p>
        ) : !provider ? (
          <div className="text-center py-20 space-y-4">
            <h1 className="text-xl font-bold text-[#001A48]">Profile not found</h1>
            <p className="text-sm text-slate-500">This host or provider has no listings on BorrowLK right now.</p>
            <Link to="/marketplace" className="inline-flex items-center gap-2 bg-[#001A48] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              Back to Marketplace
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center gap-5 mb-8 text-left">
              <img src={provider.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[#001A48] tracking-tight">{provider.name}</h1>
                  {provider.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {hasServices ? 'Verified Provider' : 'Verified Host'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {provider.location}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {provider.rating.toFixed(1)}
                  </span>
                  <span>
                    {listings!.length} listing{listings!.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-extrabold text-[#001A48] mb-5 text-left">Listings from {provider.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings!.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};
