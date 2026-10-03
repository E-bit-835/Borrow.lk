import React from 'react';
import { Wallet, Globe, Calendar, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';

export const ProviderFeatures: React.FC = () => {
  const features = [
    {
      icon: <Wallet className="w-5 h-5 text-blue-600" />,
      title: 'Earn from items you already own',
      description:
        'Turn depreciating assets into active revenue streams without lifting a finger.',
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      title: 'Reach customers across Sri Lanka',
      description:
        'Access a trusted, verified user base actively looking to rent high-quality items.',
    },
    {
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      title: 'Manage bookings easily',
      description:
        'Our intuitive provider dashboard makes calendar sync and booking management seamless.',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
      title: 'Secure customer communication',
      description:
        'Chat directly with renters through our encrypted in-app messaging system.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      title: 'Track your earnings',
      description:
        'Detailed analytics and direct bank deposits ensure you\'re always on top of your finances.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-blue-600" />,
      title: 'AI-powered listing tools',
      description:
        'Generate compelling descriptions and optimized pricing suggestions with a single click.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        {/* Section Header */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#001A48] tracking-tight">
            Why become a provider?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            We provide the platform, the tools, and the audience. You provide the inventory. It's a perfect match.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3.5 flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#001A48]">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
