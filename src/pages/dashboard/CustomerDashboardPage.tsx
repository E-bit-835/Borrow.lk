import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarCheck, CheckCircle2, Heart, Search, Sparkles, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { PageHeader, Card, Button, StatusBadge, useAdminData, formatDate } from '../../components/admin/adminUi';
import { useAuth } from '../../context/AuthContext';
import { meService } from '../../services/me';
import { orderService } from '../../services/orders';
import { productService } from '../../services/products';
import { productToListing } from '../../utils/productToListing';

export const CustomerDashboardPage: React.FC = () => {
  const { user, isHost, isProvider } = useAuth();
  const { data, loading, error, reload } = useAdminData(
    async () => {
      const [summary, orders, products] = await Promise.all([
        meService.summary(),
        orderService.getAll({ userId: user!.id }),
        productService.getAll(),
      ]);
      return { summary, orders, listings: products.filter((p) => p.provider?.id !== user!.id).slice(0, 4).map(productToListing) };
    },
    [user?.id]
  );

  const s = data?.summary;
  const cards = [
    { label: 'Waiting for an answer', value: s?.pendingRequests, icon: Clock, to: '/requests' },
    { label: 'Upcoming bookings', value: s?.upcoming, icon: CalendarCheck, to: '/bookings' },
    { label: 'Completed', value: s?.completed, icon: CheckCircle2, to: '/bookings' },
    { label: 'Saved listings', value: s?.wishlist, icon: Heart, to: '/wishlist' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`Hello, ${user?.firstName || user?.name?.split(' ')[0] || ''}`}
        description="Your requests, bookings and saved listings in one place."
      >
        <Link to="/marketplace">
          <Button variant="primary">
            <Search className="w-4 h-4" />
            Find something to rent
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <Card className="p-6 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="group">
            <Card className="p-5 h-full transition-shadow group-hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3 tabular-nums">{loading && value === undefined ? '–' : value ?? 0}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Your latest requests</h2>
            <Link to="/requests" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          {!data?.orders.length ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'You have not sent any requests yet.'}</p>
              {!loading && (
                <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
                  Browse the marketplace <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link to={`/bookings/${o.orderNumber}`} className="py-3 flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 rounded-xl">
                    <img src={o.product.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{o.product.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(o.startDate)}
                        {o.endDate !== o.startDate && <> to {formatDate(o.endDate)}</>}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!(isHost && isProvider) && (
          <Card className="p-5 flex flex-col gap-3 bg-gradient-to-br from-[#001A48] to-[#062a6b] border-0 text-white">
            <Sparkles className="w-6 h-6 text-teal-300" />
            <h2 className="text-base font-bold">Have something to offer?</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              Rent out your items or offer a service with this same account. No second sign-up.
            </p>
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {!isHost && (
                <Link to="/become-host" className="px-3.5 py-2 rounded-xl bg-white text-[#001A48] text-sm font-semibold hover:bg-slate-100">
                  Become a Host
                </Link>
              )}
              {!isProvider && (
                <Link to="/become-provider" className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20">
                  Become a Provider
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>

      {!!data?.listings.length && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Listings you might like</h2>
            <Link to="/marketplace" className="text-xs font-semibold text-teal-700 hover:underline">
              See more
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {data.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};
