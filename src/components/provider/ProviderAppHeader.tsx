import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowLeftRight, Menu, X, Home, Store, LogOut, Plus, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProviderAppHeaderProps {
  onToggleSidebar?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';

export const ProviderAppHeader: React.FC<ProviderAppHeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, isHost, isProvider } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/marketplace?q=${encodeURIComponent(searchQuery.trim())}` : '/marketplace');
  };

  const roleLabel = isHost && isProvider ? 'Host & Provider' : isProvider ? 'Service Provider' : 'Host';

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile sidebar toggle + Brand Logo + Search */}
        <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/provider/dashboard" className="inline-block shrink-0">
            <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#001A48] flex items-center">
              borrow<span className="text-[#00B4A7]">.lk</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-[260px] lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search the marketplace"
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 text-sm text-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold shrink-0">
          <Link to="/" className="text-[#001A48] hover:text-teal-600 transition-colors">
            Home
          </Link>
          <Link to="/marketplace" className="text-slate-600 hover:text-teal-600 transition-colors whitespace-nowrap">
            Market Place
          </Link>
        </nav>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 lg:flex-1">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Switch back to your customer dashboard"
          >
            Switch to Renting
          </button>

          {/* Account */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setMenuOpen(false);
              }}
              className="flex items-center justify-center cursor-pointer overflow-hidden rounded-full border border-slate-200"
              aria-label="Account menu"
            >
              <img src={user?.avatar || DEFAULT_AVATAR} alt="" className="w-9 h-9 object-cover" />
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium text-slate-700">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 bg-teal-50 text-teal-700 border border-teal-200">
                      {roleLabel}
                    </span>
                    <p className="font-bold text-slate-900 truncate">{user?.businessName || user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/provider/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Profile
                  </Link>
                  <Link
                    to="/provider/listings/create"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    Add a listing
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                    Switch to Renting
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Round menu button with quick links */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Navigation Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-50 text-xs font-semibold text-slate-700 space-y-0.5">
                  {[
                    { to: '/', label: 'Home', icon: Home },
                    { to: '/marketplace', label: 'Market Place', icon: Store },
                    { to: '/ai-assistant', label: 'Ask AI', icon: Sparkles },
                    { to: '/dashboard', label: 'Switch to Renting', icon: ArrowLeftRight },
                  ].map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#001A48] transition-colors"
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      {label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ask AI */}
          <Link
            to="/ai-assistant"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#EFE9FF] hover:bg-[#E5DBFF] text-purple-700 rounded-full transition-colors text-[13px] font-bold whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-purple-700 text-purple-700" />
            Ask AI
          </Link>
        </div>
      </div>
    </header>
  );
};
