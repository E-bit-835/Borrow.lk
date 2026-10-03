import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Star, MessageSquare, MapPin, X, Check } from 'lucide-react';
import type { Provider } from '../../data/marketplaceData';
import { useAuth } from '../../context/AuthContext';
import { meService } from '../../services/me';

interface ProviderCardProps {
  provider: Provider;
  /** The listing the question is about; messages are grouped by listing */
  listingId: string;
  isService?: boolean;
}

/** Who owns a listing, with a real "send a message" action. */
export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, listingId, isService }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const role = isService ? 'provider' : 'host';
  const ownListing = !!user && user.id === provider.id;

  const openContact = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, message: 'Please log in or create an account to continue.' } });
      return;
    }
    setState('idle');
    setError(null);
    setOpen(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setState('sending');
    setError(null);
    try {
      await meService.messageOwner(listingId, text.trim());
      setState('sent');
      setText('');
    } catch (err: any) {
      setError(err.message || 'Could not send your message.');
      setState('idle');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-left space-y-4 shadow-xs">
      <div className="flex items-start gap-4">
        <img src={provider.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[#001A48]">{provider.name}</h3>
            {provider.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isService ? 'Verified Provider' : 'Verified Host'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {provider.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {provider.location}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {!ownListing && (
          <button
            type="button"
            onClick={openContact}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#001A48] hover:bg-[#002669] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Contact {role}
          </button>
        )}
        <Link
          to={`/providers/${provider.id}`}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors text-center"
        >
          View Profile
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Message ${provider.name}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#001A48]">Message {provider.name}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {state === 'sent' ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Message sent</p>
                <Link to="/messages" className="inline-block text-sm font-semibold text-teal-700 hover:underline">
                  Open Messages
                </Link>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-3">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Ask the ${role} about availability, pickup or anything else.`}
                  aria-label="Your message"
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#001A48]"
                  required
                />
                {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={state === 'sending' || !text.trim()}
                  className="w-full bg-[#001A48] hover:bg-[#002669] text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  {state === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
