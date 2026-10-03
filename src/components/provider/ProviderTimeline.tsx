import React from 'react';
import { Check } from 'lucide-react';

export const ProviderTimeline: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Create your provider profile',
      subtitle: 'Sign up and set your preferences',
      status: 'completed',
    },
    {
      number: 2,
      title: 'Verify your identity',
      subtitle: 'Fast, secure ID and phone check',
      status: 'active',
    },
    {
      number: 3,
      title: 'List your items or services',
      subtitle: 'Upload photos and set your prices',
      status: 'upcoming',
    },
    {
      number: 4,
      title: 'Receive rental requests',
      subtitle: 'Approve bookings on your schedule',
      status: 'upcoming',
    },
    {
      number: 5,
      title: 'Earn money',
      subtitle: 'Get paid directly to your bank account',
      status: 'upcoming',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#001A48] tracking-tight">
            Your path to earning
          </h2>
        </div>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden lg:block relative pt-6 pb-2">
          {/* Connecting Background Line */}
          <div className="absolute top-10 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0"></div>

          <div className="grid grid-cols-5 gap-4 relative z-10">
            {steps.map((step) => (
              <div key={step.number} className="text-center space-y-3 px-2">
                {/* Step Circle Node */}
                <div className="flex justify-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                        : step.status === 'active'
                        ? 'bg-[#0047BA] text-white ring-4 ring-blue-50'
                        : 'bg-white border-2 border-slate-300 text-slate-500'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      step.number
                    )}
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#001A48]">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="block lg:hidden space-y-6 relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {steps.map((step) => (
            <div key={step.number} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                  step.status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : step.status === 'active'
                    ? 'bg-[#0047BA] text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-500'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  step.number
                )}
              </div>
              <div className="pl-3 space-y-0.5 text-left">
                <h3 className="text-sm font-bold text-[#001A48]">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {step.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
