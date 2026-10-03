import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const ProviderCtaBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0047BA] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          {/* Subtle background circles matching the design */}
          <div className="w-32 h-32 rounded-full bg-white/5 absolute -top-8 -left-8 pointer-events-none"></div>
          <div className="w-48 h-48 rounded-full bg-white/5 absolute -bottom-16 -right-16 pointer-events-none"></div>

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to start earning?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-md mx-auto">
              Join thousands of providers across Sri Lanka who are already turning their idle assets into active income.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/become-host')}
                className="bg-white hover:bg-slate-50 active:bg-slate-100 text-[#001A48] font-bold text-xs sm:text-sm px-7 py-3 rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Become a Provider</span>
                <ArrowRight className="w-4 h-4 text-[#001A48]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
