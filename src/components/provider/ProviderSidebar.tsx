import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, CalendarDays, Star, User, Plus, X, MessageSquare, Bell, CreditCard } from 'lucide-react';

interface ProviderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Requests waiting for an answer, shown as a badge */
  pendingRequests?: number;
}

const NAV = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/listings', label: 'My Listings', icon: Package },
  { to: '/provider/requests', label: 'Requests', icon: ClipboardList },
  { to: '/provider/availability', label: 'Availability', icon: CalendarDays },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/provider/reviews', label: 'Reviews', icon: Star },
  { to: '/provider/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/provider/profile', label: 'Profile', icon: User },
];

export const ProviderSidebar: React.FC<ProviderSidebarProps> = ({ isOpen, onClose, pendingRequests = 0 }) => (
  <>
    {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onClose} />}

    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-20 lg:z-10 lg:h-[calc(100vh-5rem)] shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="lg:hidden h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <span className="text-sm font-bold text-slate-900">Host workspace</span>
        <button type="button" onClick={onClose} aria-label="Close menu" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3">
        <Link
          to="/provider/listings/create"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#001A48] hover:bg-[#002669] text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add a listing
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto" aria-label="Host workspace">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/provider/listings'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-100 text-[#001A48] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/provider/requests' && pendingRequests > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                {pendingRequests}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <p className="p-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
        Customers send requests for free. You agree payment with them directly.
      </p>
    </aside>
  </>
);
