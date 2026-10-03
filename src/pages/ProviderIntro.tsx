import React from 'react';
import { Navigate } from 'react-router-dom';
import { ProviderHeader } from '../components/provider/ProviderHeader';
import { ProviderHero } from '../components/provider/ProviderHero';
import { ProviderFeatures } from '../components/provider/ProviderFeatures';
import { ProviderTimeline } from '../components/provider/ProviderTimeline';
import { ProviderCommunity } from '../components/provider/ProviderCommunity';
import { ProviderCtaBanner } from '../components/provider/ProviderCtaBanner';
import { ProviderFooter } from '../components/provider/ProviderFooter';
import { useAuth } from '../context/AuthContext';

/** Public page explaining how to become a host / provider. */
export const ProviderIntro: React.FC = () => {
  const { isHost, isProvider } = useAuth();

  // Approved hosts / providers go straight to their workspace
  if (isHost || isProvider) {
    return <Navigate to="/provider/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900 relative">
      <ProviderHeader />

      <main className="flex-1">
        <ProviderHero />
        <ProviderFeatures />
        <ProviderTimeline />
        <ProviderCommunity />
        <ProviderCtaBanner />
      </main>

      <ProviderFooter />
    </div>
  );
};
