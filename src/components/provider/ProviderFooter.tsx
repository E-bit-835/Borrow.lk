import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../auth/BrandLogo';

export const ProviderFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#F1F5F9] border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Logo & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <BrandLogo variant="standard" size="sm" />
          <span className="hidden sm:inline text-slate-300">|</span>
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} Borrow.lk. All rights reserved. Peer-to-Peer Rental Marketplace.
          </p>
        </div>

        {/* Right: Policy Links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-medium text-slate-600">
          <Link to="#terms" className="hover:text-[#001A48] transition-colors">
            Terms of Service
          </Link>
          <Link to="#privacy" className="hover:text-[#001A48] transition-colors">
            Privacy Policy
          </Link>
          <Link to="#insurance" className="hover:text-[#001A48] transition-colors">
            Insurance Coverage
          </Link>
          <Link to="#safety" className="hover:text-[#001A48] transition-colors">
            Trust &amp; Safety
          </Link>
          <Link to="#contact" className="hover:text-[#001A48] transition-colors">
            Contact Us
          </Link>
        </nav>
      </div>
    </footer>
  );
};
