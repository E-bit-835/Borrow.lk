import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  UserCheck,
  ClipboardList,
  Flag,
  Star,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  MessageSquare,
  Bell,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/listings', label: 'Listings', icon: Package },
  { to: '/admin/applications', label: 'Applications', icon: UserCheck },
  { to: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Layers },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const sidebar = (
    <div className="h-full flex flex-col">
      <div className="h-16 px-6 flex items-center justify-between shrink-0">
        <Link to="/admin/dashboard" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="text-xl font-extrabold tracking-tight text-[#001A48]">
            borrow<span className="text-[#00B4A7]">.lk</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[#001A48] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200/80 space-y-1 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
          View website
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 font-sans antialiased">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="h-16 bg-white/85 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="lg:hidden text-lg font-extrabold tracking-tight text-[#001A48]">
            borrow<span className="text-[#00B4A7]">.lk</span>
          </span>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <img
              src={user?.avatar || DEFAULT_AVATAR}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
          </div>
        </header>

        <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
};
