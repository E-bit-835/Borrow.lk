import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

export const MarketplaceFooter: React.FC = () => {
  return (
    <footer className="bg-[#001233] text-slate-300 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center">
                borrow<span className="text-[#00B4A7]">.lk</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Sri Lanka's trusted peer-to-peer equipment and vehicle rental marketplace. Verified hosts, secure online payments, and comprehensive item protection guarantee.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-teal-400">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>All rentals protected by BorrowLK Guarantee</span>
            </div>
          </div>

          {/* Col 1 */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Explore Categories
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/marketplace?category=electronics" className="hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=vehicle" className="hover:text-white transition-colors">
                  Vehicle
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=computers" className="hover:text-white transition-colors">
                  Computers
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-white transition-colors">
                  All Marketplace Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              For Providers
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/provider-intro" className="hover:text-white transition-colors flex items-center gap-1 text-teal-300 font-semibold">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  <span>Become a Provider</span>
                </Link>
              </li>
              <li>
                <Link to="/become-host" className="hover:text-white transition-colors">
                  Provider Plans &amp; Fees
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="hover:text-white transition-colors">
                  Provider Dashboard
                </Link>
              </li>
              <li>
                <Link to="/become-host" className="hover:text-white transition-colors">
                  Account Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Company &amp; Support
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How BorrowLK Works
                </a>
              </li>
              <li>
                <span className="text-slate-400">Colombo, Sri Lanka</span>
              </li>
              <li>
                <span className="text-slate-400">support@borrow.lk</span>
              </li>
              <li>
                <span className="text-slate-400">+94 11 234 5678</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} BorrowLK (Pvt) Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => alert("BorrowLK Privacy Policy: Your data is secure and protected under Sri Lankan privacy regulations.")} className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</button>
            <button type="button" onClick={() => alert("BorrowLK Terms of Service: All platform transactions are governed by standard rental guarantee terms.")} className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</button>
            <button type="button" onClick={() => alert("BorrowLK Security: 256-bit encryption, identity verification, and host guarantee protection enabled.")} className="hover:text-slate-300 transition-colors cursor-pointer">Security</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
