import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MarketplaceHeader } from '../marketplace/MarketplaceHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { meService, type MySummary } from '../../services/me';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Pages that manage their own height (the messages screen) can drop the default padding */
  flush?: boolean;
}

/** Shell of the customer account area: the site navigation bar, a sidebar and the page. */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, flush }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<MySummary | null>(null);
  const { pathname } = useLocation();

  // Refresh the sidebar badges as the user moves between pages
  useEffect(() => {
    let cancelled = false;
    meService
      .summary()
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col font-sans text-slate-800 antialiased">
      <MarketplaceHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarBreakpoint="lg" />

      <div className="flex-1 flex w-full">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} summary={summary} />
        <main className={`flex-1 min-w-0 w-full ${flush ? '' : 'px-4 sm:px-8 py-6 sm:py-8 max-w-[1200px] mx-auto'}`}>{children}</main>
      </div>
    </div>
  );
};
