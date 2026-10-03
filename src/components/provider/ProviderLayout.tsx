import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProviderAppHeader } from './ProviderAppHeader';
import { ProviderSidebar } from './ProviderSidebar';
import { hostService } from '../../services/host';

interface ProviderLayoutProps {
  children: React.ReactNode;
}

/** Shell of the host / provider workspace: the site navigation bar, a sidebar and the page. */
export const ProviderLayout: React.FC<ProviderLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { pathname } = useLocation();

  // Keep the "Requests" badge fresh as the host moves between pages
  useEffect(() => {
    let cancelled = false;
    hostService
      .stats()
      .then((s) => !cancelled && setPendingRequests(s.pendingRequests))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col font-sans text-slate-800 antialiased">
      <ProviderAppHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex-1 flex w-full">
        <ProviderSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} pendingRequests={pendingRequests} />
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 max-w-[1300px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
};
