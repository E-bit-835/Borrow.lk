import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

interface AuthLayoutProps {
  children: ReactNode;
  topHeaderAction?: {
    prompt: string;
    linkText: string;
    href: string;
  };
  topLeftLogo?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  topHeaderAction,
  topLeftLogo = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between auth-ambient-bg relative overflow-x-hidden selection:bg-teal-100 selection:text-teal-900">
      {/* Top Header Bar */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          {topLeftLogo && (
            <BrandLogo variant="unified" size="sm" />
          )}

          {topHeaderAction && (
            <div className="text-[13px] text-slate-500 font-normal">
              <span>{topHeaderAction.prompt} </span>
              <Link
                to={topHeaderAction.href}
                className="text-[#001A48] font-semibold hover:underline transition-colors"
              >
                {topHeaderAction.linkText}
              </Link>
            </div>
          )}
        </div>

        {/* Empty right side spacer matching design layout */}
        <div className="w-4"></div>
      </header>

      {/* Main Content: Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto z-10">
        {children}
      </main>

    </div>
  );
};
