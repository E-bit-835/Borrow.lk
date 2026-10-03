import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  User,
  Menu,
  X,
  Home,
  Store,
  LayoutDashboard,
  Layers,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProviderHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    sessionStorage.setItem('borrowlk_is_authenticated', 'false');
    sessionStorage.setItem('borrowlk_user_role', 'guest');
    sessionStorage.removeItem('borrowlk_is_provider');
    sessionStorage.removeItem('borrowlk_provider_profile');
    sessionStorage.removeItem('borrowlk_customer_user');
    localStorage.removeItem('borrowlk_auth_token');
    localStorage.removeItem('borrowlk_user');
    navigate('/', { replace: true });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-shadow">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Search */}
        <div className="flex items-center gap-6 flex-1">
          <Link to="/" className="inline-block shrink-0">
            <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#001A48] flex items-center">
              borrow<span className="text-[#00B4A7]">.lk</span>
            </span>
          </Link>

          {/* Global Search Bar */}
          <div className="hidden md:flex relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="What are you looking for?"
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 text-sm text-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Navigation */}
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
            {/* Conditional Action Button */}
            <Link
              to="/become-host"
              className="hidden sm:flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
            >
              Become a Host
            </Link>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {/* User Avatar */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center justify-center cursor-pointer overflow-hidden rounded-full border border-slate-200 w-9 h-9 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Hamburger Menu (Round) with Small Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold text-slate-700 divide-y divide-slate-100">
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
                        <Link
                          to="/provider/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors font-bold"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-600" />
                          <span>Provider Hub</span>
                        </Link>
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

                      <div className="px-1.5 py-1 space-y-0.5">
                        <Link
                          to="/marketplace"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors font-medium text-slate-600"
                        >
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span>Switch to Renting</span>
                        </Link>
                      </div>

                      <div className="px-1.5 pt-1">
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
      </div>
    </header>
  );
};
