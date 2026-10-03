import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Sparkles,
  Shield,
  Home,
  Store,
  LayoutDashboard,
  Layers,
  HelpCircle,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PostAdButton } from './PostAdButton';

interface MarketplaceHeaderProps {
  /** Pages with their own side panel (e.g. the AI assistant) get a button to open it on small screens */
  onToggleSidebar?: () => void;
  /** Width below which that page hides its sidebar (the toggle shows only then) */
  sidebarBreakpoint?: 'md' | 'lg';
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ onToggleSidebar, sidebarBreakpoint = 'md' }) => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, logout: authLogout, isHost, isProvider: isServiceProvider } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const currentUser = {
    name: authUser?.name || '',
    email: authUser?.email || '',
    avatar: authUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80',
  };

  const isGuest = !isAuthenticated;
  // Can this account list? Decided only by the capabilities the server issued (HOST and/or PROVIDER)
  const isProvider = isAuthenticated && (isHost || isServiceProvider);
  const currentRole: 'guest' | 'renter' | 'provider' | 'admin' = isGuest
    ? 'guest'
    : authUser?.role === 'admin'
    ? 'admin'
    : isProvider
    ? 'provider'
    : 'renter';

  const handleLogout = () => {
    authLogout();
    sessionStorage.setItem('borrowlk_user_role', 'guest');
    sessionStorage.setItem('borrowlk_is_authenticated', 'false');
    sessionStorage.removeItem('borrowlk_is_provider');
    sessionStorage.removeItem('borrowlk_provider_profile');
    sessionStorage.removeItem('borrowlk_customer_user');
    localStorage.removeItem('borrowlk_auth_token');
    localStorage.removeItem('borrowlk_user');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-shadow">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Search */}
          <div className="flex items-center gap-3 sm:gap-6 flex-1">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                className={`${sidebarBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden'} p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer`}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="inline-block shrink-0">
              <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#001A48] flex items-center">
                borrow<span className="text-[#00B4A7]">.lk</span>
              </span>
            </Link>

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-4 h-4 text-slate-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 text-sm text-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              />
            </form>
          </div>

          {/* Right Navigation */}
          {isGuest ? (
            /* Guest Navigation matching exact design */
            <div className="flex items-center gap-3 sm:gap-7">
              {/* Nav Links (Home is reachable via the logo on phones) */}
              <nav className="flex items-center gap-5 sm:gap-6 text-[14px] font-semibold">
                <Link to="/" className="hidden sm:inline text-[#001A48] hover:text-teal-600 transition-colors">
                  Home
                </Link>
                <Link to="/marketplace" className="text-slate-600 hover:text-teal-600 transition-colors whitespace-nowrap">
                  Market Place
                </Link>
              </nav>

              {/* Login / Register */}
              <Link
                to="/login"
                className="text-[14px] font-bold text-slate-800 hover:text-[#001A48] transition-colors whitespace-nowrap"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Login / Register</span>
              </Link>

              {/* Post an Ad: asks a guest to sign in first */}
              <PostAdButton />

              {/* Ask AI Button (icon-only on phones) */}
              <Link
                to="/ai-assistant"
                aria-label="Ask AI"
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-[#EFE9FF] hover:bg-[#E5DBFF] text-purple-700 rounded-full transition-colors text-[13px] font-bold whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 fill-purple-700 text-purple-700" />
                <span className="hidden sm:inline">Ask AI</span>
              </Link>
            </div>
          ) : (
            /* Authenticated Navigation */
            <div className="flex items-center gap-5">
              {/* Nav Links */}
              <nav className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-slate-600">
                <Link to="/" className="text-[#001A48] hover:text-teal-600 transition-colors">
                  Home
                </Link>
                <Link to="/marketplace" className="hover:text-teal-600 transition-colors">
                  Market Place
                </Link>
              </nav>

              <div className="flex items-center gap-3 ml-2">
                {currentRole !== 'admin' && (
                  <PostAdButton className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer" />
                )}
                {/* Conditional Action Button */}
                {currentRole === 'admin' ? (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    Admin Console
                  </Link>
                ) : (
                  // Hosts/providers go to their workspace; renters start the "Become a Host" flow
                  <Link
                    to={isProvider ? '/provider/dashboard' : '/become-host'}
                    className="hidden sm:flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    Switch to Hosting
                  </Link>
                )}

                {/* User Actions */}
                <div className="flex items-center gap-2">
                  {/* User Avatar */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center justify-center cursor-pointer overflow-hidden rounded-full border border-slate-200"
                    >
                      <img
                        src={currentUser.avatar}
                        alt="User"
                        className="w-9 h-9 object-cover"
                      />
                    </button>
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium text-slate-700">
                        <div className="px-3.5 py-2 border-b border-slate-100">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                            currentRole === 'admin' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : currentRole === 'provider'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {currentRole === 'admin' ? 'Administrator' : currentRole === 'provider' ? 'Verified Provider' : 'Renter'}
                          </span>
                          <p className="font-bold text-slate-900">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        </div>
                        
                        {currentRole === 'admin' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3.5 py-2 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                          >
                            Admin Console
                          </Link>
                        )}
                        
                        {currentRole !== 'admin' &&
                          [
                            { to: '/dashboard', label: 'My Dashboard' },
                            { to: '/bookings', label: 'My Bookings' },
                            { to: '/requests', label: 'Requests' },
                            { to: '/wishlist', label: 'Wishlist' },
                            { to: '/messages', label: 'Messages' },
                            { to: '/notifications', label: 'Notifications' },
                            // Same account: offer the upgrade until approved, then the workspace
                            isHost
                              ? { to: '/host', label: 'Host Dashboard', strong: true }
                              : { to: '/become-host', label: 'Become a Host', strong: true },
                            isServiceProvider
                              ? { to: '/provider', label: 'Provider Dashboard', strong: true }
                              : { to: '/become-provider', label: 'Become a Provider', strong: true },
                            { to: '/settings', label: 'Settings' },
                            { to: '/help', label: 'Help & Support' },
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-3.5 py-2 hover:bg-slate-50 transition-colors ${
                                item.strong ? 'font-bold text-teal-700' : ''
                              }`}
                            >
                              {item.label}
                            </Link>
                          ))}
                        
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 border-t border-slate-100 mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hamburger Menu (Round) with Small Menu Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(!mobileMenuOpen);
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      aria-label="Navigation Menu"
                    >
                      {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {mobileMenuOpen && (
                      <>
                        {/* Click-outside backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Small Dropdown Menu */}
                        <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                          {/* Primary Nav Links */}
                          <div className="px-1.5 pb-1 space-y-0.5">
                            <Link
                              to="/"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors"
                            >
                              <Home className="w-4 h-4 text-slate-500" />
                              <span>Home</span>
                            </Link>

                            <Link
                              to="/marketplace"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors"
                            >
                              <Store className="w-4 h-4 text-slate-500" />
                              <span>Market Place</span>
                            </Link>

                            {currentRole === 'admin' ? (
                              <Link
                                to="/admin/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-50 transition-colors font-bold"
                              >
                                <Shield className="w-4 h-4 text-amber-600" />
                                <span>Admin Console</span>
                              </Link>
                            ) : isProvider ? (
                              <Link
                                to="/provider/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors font-bold"
                              >
                                <LayoutDashboard className="w-4 h-4 text-teal-600" />
                                <span>Switch to Hosting</span>
                              </Link>
                            ) : (
                              <Link
                                to="/become-host"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors font-bold"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Sparkles className="w-4 h-4 text-teal-600" />
                                  <span>Become a Host</span>
                                </div>
                                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-bold">Earn</span>
                              </Link>
                            )}

                            <Link
                              to="/ai-assistant"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-purple-700 hover:bg-purple-50 transition-colors font-bold"
                            >
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="w-4 h-4 fill-purple-600 text-purple-600" />
                                <span>Ask AI</span>
                              </div>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">New</span>
                            </Link>
                          </div>

                          {/* Secondary Links */}
                          <div className="px-1.5 py-1 space-y-0.5">
                            <Link
                              to="/marketplace"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors font-medium text-slate-600"
                            >
                              <Layers className="w-4 h-4 text-slate-400" />
                              <span>Browse Categories</span>
                            </Link>
                            <a
                              href="/#how-it-works"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors font-medium text-slate-600"
                            >
                              <HelpCircle className="w-4 h-4 text-slate-400" />
                              <span>How It Works</span>
                            </a>
                          </div>

                          {/* Auth / Account Section */}
                          <div className="px-1.5 pt-1">
                            <div className="space-y-0.5">
                              <Link
                                to="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors"
                              >
                                <User className="w-4 h-4 text-slate-500" />
                                <span>Customer Dashboard</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  handleLogout();
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                              >
                                <LogOut className="w-4 h-4 text-rose-500" />
                                <span>Log Out</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Ask AI Button */}
                  <Link
                    to="/ai-assistant"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#EFE9FF] hover:bg-[#E5DBFF] text-purple-700 rounded-full transition-colors text-[13px] font-bold"
                  >
                    <Sparkles className="w-4 h-4 fill-purple-700 text-purple-700" />
                    Ask AI
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </header>
    </>
  );
};
