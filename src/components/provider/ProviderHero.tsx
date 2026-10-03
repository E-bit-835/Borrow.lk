import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import laptopImg from '../../assets/images/provider-laptop.jpg';
import phoneImg from '../../assets/images/earnings-phone.jpg';

export const ProviderHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Trusted Provider Service</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#001A48] tracking-tight leading-[1.15]">
              Turn your unused items into income
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
              Become a BorrowLK provider and earn by lending out your items, equipment, vehicles or services to customers across Sri Lanka.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/become-host')}
                className="bg-[#001A48] hover:bg-[#002669] active:bg-[#001336] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Become a Provider</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300 font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Visual Composition */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Left tall card: Laptop setup */}
              <div className="col-span-7">
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-white aspect-[3/4] relative group">
                  <img
                    src={laptopImg}
                    alt="BorrowLK Provider Laptop Dashboard"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
              </div>

              {/* Right stacked cards */}
              <div className="col-span-5 space-y-4">
                {/* Top card: Smartphone earnings */}
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg bg-white aspect-[4/3] relative group">
                  <img
                    src={phoneImg}
                    alt="Real-time earnings tracking"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>

                {/* Bottom card: 100% Insured Trust Badge */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-lg text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                    <Shield className="w-5 h-5 fill-blue-500/20" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#001A48]">100% Insured</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Peace of mind guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
