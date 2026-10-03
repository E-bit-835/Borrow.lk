import React from 'react';
import { Shield, ShieldCheck, CreditCard, Star, Headphones } from 'lucide-react';
import teamImg from '../../assets/images/trusted-community.jpg';

export const ProviderCommunity: React.FC = () => {
  const trustItems = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Provider verification',
      description: 'All providers undergo secure identity verification before listings go live.',
      iconBg: 'bg-emerald-50 border-emerald-100',
    },
    {
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      title: 'Secure payments',
      description: 'Escrow-style transactions protect your earnings until the rental is complete.',
      iconBg: 'bg-blue-50 border-blue-100',
    },
    {
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-400" />,
      title: 'Customer reviews',
      description: 'A transparent, two-way rating system maintains community standards.',
      iconBg: 'bg-amber-50 border-amber-100',
    },
    {
      icon: <Headphones className="w-5 h-5 text-blue-600" />,
      title: 'Support when you need it',
      description: '24/7 dedicated provider support team to resolve any disputes.',
      iconBg: 'bg-blue-50 border-blue-100',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/50 border-t border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Team Photograph with stylized backplate */}
          <div className="lg:col-span-6 relative">
            {/* Soft pale blue tilted backplate matching the screenshot */}
            <div className="absolute inset-0 bg-blue-100/70 rounded-3xl transform -rotate-2 scale-102 -z-0"></div>

            <div className="relative z-10 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white aspect-[4/3]">
              <img
                src={teamImg}
                alt="BorrowLK Trusted Rental Community Team"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column: Trust Framework & Cards */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Safety First Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>SAFETY FIRST</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#001A48] tracking-tight leading-tight">
              Built for a trusted rental community
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg">
              We prioritize the safety of your assets above all else. Our comprehensive trust framework ensures you can rent out with complete confidence.
            </p>

            {/* 4 Trust Cards List */}
            <div className="space-y-3 pt-2">
              {trustItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex items-center gap-3.5 transition-all hover:border-slate-300"
                >
                  <div
                    className={`w-9 h-9 rounded-lg border ${item.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    {item.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-[#001A48]">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
