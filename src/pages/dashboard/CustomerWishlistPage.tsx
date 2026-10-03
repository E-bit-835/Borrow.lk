import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { PageHeader, Card, Button, useAdminData } from '../../components/admin/adminUi';
import { meService } from '../../services/me';
import { productToListing } from '../../utils/productToListing';
import { useMarketplace } from '../../context/MarketplaceContext';

export const CustomerWishlistPage: React.FC = () => {
  const { data, loading, error, reload } = useAdminData(() => meService.wishlist(), []);
  const { favorites } = useMarketplace();

  // Un-saving a card (the heart on it) removes it from this page straight away
  const listings = useMemo(
    () => (data || []).filter((p) => favorites.includes(p.id)).map(productToListing),
    [data, favorites]
  );

  return (
    <DashboardLayout>
      <PageHeader title="Wishlist" description="Listings you saved. Tap the heart on a card to remove it." />

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : listings.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Heart className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'You have not saved any listings yet.'}</p>
          {!loading && (
            <Link to="/marketplace">
              <Button variant="primary">
                <Search className="w-4 h-4" />
                Browse the marketplace
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
