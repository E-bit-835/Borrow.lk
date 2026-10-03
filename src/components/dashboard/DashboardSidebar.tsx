import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  User, LayoutDashboard, CalendarCheck, Clock, Heart, MessageSquare, Bell, Settings, HelpCircle, Store, Sparkles, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { MySummary } from '../../services/me';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MySummary | null;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose, summary }) => {
  const { isHost, isProvider } = useAuth();

  const main = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/requests', label: 'Requests', icon: Clock, badge: summary?.pendingRequests },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: summary?.unreadMessages },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: summary?.unreadNotifications },
  ];
  const account = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help & Support', icon: HelpCircle },
  ];
  // Same account, extra capabilities: offer the upgrade until approved, then the workspace
  const partner = [
    isHost
      ? { to: '/provider/dashboard', label: 'Host Dashboard', icon: Store }
      : { to: '/become-host', label: 'Become a Host', icon: Sparkles },
    isProvider
      ? { to: '/provider/dashboard', label: 'Provider Dashboard', icon: Store }
      : { to: '/become-provider', label: 'Become a Provider', icon: Sparkles },
  ].filter((item, i, arr) => arr.findIndex((x) => x.to === item.to) === i);

  const link = (item: { to: string; label: string; icon: typeof User; badge?: number }, accent = false) => (
    <NavLink
      key={item.label}
      to={item.to}
      end
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-100 text-[#001A48] font-semibold'
            : accent
            ? 'text-teal-700 hover:bg-teal-50'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      <item.icon className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!!item.badge && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-20 lg:z-10 lg:h-[calc(100vh-5rem)] shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="lg:hidden h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <span className="text-sm font-bold text-slate-900">My account</span>
          <button type="button" onClick={onClose} aria-label="Close menu" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto" aria-label="My account">
          <div className="space-y-0.5">{main.map((i) => link(i))}</div>
          <div className="my-3 border-t border-slate-100" />
          <div className="space-y-0.5">{partner.map((i) => link(i, true))}</div>
          <div className="my-3 border-t border-slate-100" />
          <div className="space-y-0.5">{account.map((i) => link(i))}</div>
        </nav>
      </aside>
    </>
  );
};
