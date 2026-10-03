import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Phase 2: Onboarding & Provider Flow Pages
import { VerifyMobile } from './pages/VerifyMobile';
import { VerifyOtp } from './pages/VerifyOtp';
import { ProviderIntro } from './pages/ProviderIntro';

// Phase 3: Multi-Step Provider Onboarding Screens

// Phase 4: Marketplace & Home Pages
import { MarketplaceProvider } from './context/MarketplaceContext';
import { HomePage } from './pages/marketplace/HomePage';
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { ProductDetailsPage } from './pages/marketplace/ProductDetailsPage';

// Phase 5 & 6: Customer Dashboard & Account Suite
import { CustomerDashboardPage } from './pages/dashboard/CustomerDashboardPage';
import { CustomerProfilePage } from './pages/dashboard/CustomerProfilePage';
import { CustomerWishlistPage } from './pages/dashboard/CustomerWishlistPage';
import { CustomerMessagesPage } from './pages/dashboard/CustomerMessagesPage';
import { CustomerNotificationsPage } from './pages/dashboard/CustomerNotificationsPage';
import { CustomerBookingsPage } from './pages/dashboard/CustomerBookingsPage';
import { BookingDetailsPage } from './pages/dashboard/BookingDetailsPage';
import { CustomerSettingsPage } from './pages/dashboard/CustomerSettingsPage';
import { HelpSupportPage } from './pages/dashboard/HelpSupportPage';

// Phase 7: Complete Provider Platform Suite
import { ProviderDashboardPage } from './pages/provider/ProviderDashboardPage';
import { ProviderListingsPage } from './pages/provider/ProviderListingsPage';
import { ProviderCreateListingPage } from './pages/provider/ProviderCreateListingPage';
import { ProviderAvailabilityPage } from './pages/provider/ProviderAvailabilityPage';
import { ProviderRequestsPage } from './pages/provider/ProviderRequestsPage';
import { ProviderReviewsPage } from './pages/provider/ProviderReviewsPage';
import { ProviderProfilePage } from './pages/provider/ProviderProfilePage';
import { ProviderSubscriptionPage } from './pages/provider/ProviderSubscriptionPage';
import { PublicProviderProfilePage } from './pages/provider/PublicProviderProfilePage';

// Phase 8: Admin Panel Suite
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminGuard } from './components/admin/AdminGuard';

// One account, many capabilities
import { RequireAuth, RequireCapability } from './components/auth/RouteGuards';
import { BecomePartnerPage } from './pages/BecomePartnerPage';

/** Shared host / provider workspace: any approved HOST or PROVIDER capability. */
const Partner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireCapability anyOf={['HOST', 'PROVIDER']}>{children}</RequireCapability>
);

// BorrowLK AI Assistant
import { AiAssistantPage } from './pages/ai/AiAssistantPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MarketplaceProvider>
              <BrowserRouter>
                <Routes>
                  {/* Admin console: every page requires an administrator session (also enforced by the API) */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
                  <Route path="/admin/users" element={<AdminGuard><AdminUsersPage /></AdminGuard>} />
                  <Route path="/admin/listings" element={<AdminGuard><AdminListingsPage /></AdminGuard>} />
                  <Route path="/admin/applications" element={<AdminGuard><AdminApplicationsPage /></AdminGuard>} />
                  <Route path="/admin/requests" element={<AdminGuard><AdminRequestsPage /></AdminGuard>} />
                  <Route path="/admin/reports" element={<AdminGuard><AdminReportsPage /></AdminGuard>} />
                  <Route path="/admin/reviews" element={<AdminGuard><AdminReviewsPage /></AdminGuard>} />
                  <Route path="/admin/messages" element={<AdminGuard><AdminMessagesPage /></AdminGuard>} />
                  <Route path="/admin/notifications" element={<AdminGuard><AdminNotificationsPage /></AdminGuard>} />
                  <Route path="/admin/payments" element={<AdminGuard><AdminPaymentsPage /></AdminGuard>} />
                  <Route path="/admin/subscriptions" element={<AdminGuard><AdminSubscriptionsPage /></AdminGuard>} />
                  <Route path="/admin/settings" element={<AdminGuard><AdminSettingsPage /></AdminGuard>} />
                  {/* Older admin links */}
                  <Route path="/admin/hosts" element={<Navigate to="/admin/applications" replace />} />
                  <Route path="/admin/providers" element={<Navigate to="/admin/applications" replace />} />
                  <Route path="/admin/verification" element={<Navigate to="/admin/applications" replace />} />
                  <Route path="/admin/bookings" element={<Navigate to="/admin/requests" replace />} />
                  <Route path="/admin/reported-listings" element={<Navigate to="/admin/reports" replace />} />
                  <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

                  {/* Become a Host / Provider: adds a capability to the signed-in account (no second account) */}
                  <Route path="/become-host" element={<RequireAuth message="Create an account to become a Host or Provider."><BecomePartnerPage kind="host" /></RequireAuth>} />
                  <Route path="/become-provider" element={<RequireAuth message="Create an account to become a Host or Provider."><BecomePartnerPage kind="provider" /></RequireAuth>} />

                  {/* Host / provider workspace: needs an approved HOST or PROVIDER capability (also enforced by the API) */}
                  <Route path="/provider/dashboard" element={<Partner><ProviderDashboardPage /></Partner>} />
                  <Route path="/provider/listings" element={<Partner><ProviderListingsPage /></Partner>} />
                  <Route path="/provider/listings/create" element={<Partner><ProviderCreateListingPage /></Partner>} />
                  <Route path="/provider/listings/:id/edit" element={<Partner><ProviderCreateListingPage /></Partner>} />
                  <Route path="/provider/requests" element={<Partner><ProviderRequestsPage /></Partner>} />
                  <Route path="/provider/availability" element={<Partner><ProviderAvailabilityPage /></Partner>} />
                  <Route path="/provider/reviews" element={<Partner><ProviderReviewsPage /></Partner>} />
                  <Route path="/provider/profile" element={<Partner><ProviderProfilePage /></Partner>} />
                  <Route path="/provider/subscription" element={<Partner><ProviderSubscriptionPage /></Partner>} />
                  {/* Entry points and older links */}
                  <Route path="/host" element={<RequireCapability anyOf={['HOST']}><Navigate to="/provider/dashboard" replace /></RequireCapability>} />
                  <Route path="/provider" element={<RequireCapability anyOf={['PROVIDER']}><Navigate to="/provider/dashboard" replace /></RequireCapability>} />
                  <Route path="/host/listings" element={<Navigate to="/provider/listings" replace />} />
                  <Route path="/host/listings/create" element={<Navigate to="/provider/listings/create" replace />} />
                  <Route path="/host/bookings" element={<Navigate to="/provider/requests" replace />} />
                  <Route path="/host/availability" element={<Navigate to="/provider/availability" replace />} />
                  <Route path="/provider/services" element={<Navigate to="/provider/listings" replace />} />
                  <Route path="/provider/services/create" element={<Navigate to="/provider/listings/create?type=service" replace />} />
                  <Route path="/provider/bookings" element={<Navigate to="/provider/requests" replace />} />
                  <Route path="/provider/*" element={<Navigate to="/provider/dashboard" replace />} />
                  <Route path="/providers/:id" element={<PublicProviderProfilePage />} />
                  {/* Customer account area: any signed-in account (guests are sent to login and brought back) */}
                  <Route path="/dashboard" element={<RequireAuth><CustomerDashboardPage /></RequireAuth>} />
                  <Route path="/bookings" element={<RequireAuth><CustomerBookingsPage key="bookings" view="bookings" /></RequireAuth>} />
                  <Route path="/bookings/:id" element={<RequireAuth><BookingDetailsPage /></RequireAuth>} />
                  <Route path="/requests" element={<RequireAuth><CustomerBookingsPage key="requests" view="requests" /></RequireAuth>} />
                  <Route path="/wishlist" element={<RequireAuth><CustomerWishlistPage /></RequireAuth>} />
                  <Route path="/messages" element={<RequireAuth><CustomerMessagesPage /></RequireAuth>} />
                  <Route path="/notifications" element={<RequireAuth><CustomerNotificationsPage /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><CustomerProfilePage /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><CustomerSettingsPage /></RequireAuth>} />
                  <Route path="/help" element={<RequireAuth><HelpSupportPage /></RequireAuth>} />

                  {/* BorrowLK AI Assistant */}
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />

                  {/* Phase 4: Marketplace & Home Experience */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/product" element={<MarketplacePage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  <Route path="/listing/:id" element={<ProductDetailsPage />} />
                  <Route path="/categories" element={<MarketplacePage />} />

                  {/* Phase 1: Authentication Screens */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Phase 2: Onboarding & Provider Screens */}
                  <Route path="/verify-mobile" element={<VerifyMobile />} />
                  <Route path="/verify-otp" element={<VerifyOtp />} />
                  <Route path="/provider-intro" element={<ProviderIntro />} />

                  {/* Phase 3: Multi-Step Provider Onboarding Screens */}

                  {/* Catch-all redirect to Home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
      </MarketplaceProvider>
    </AuthProvider>
  );
};

export default App;
