import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Zap, MapPin } from 'lucide-react';
import type { AiRentalMatch } from '../../data/aiAssistantData';

interface RentalCardProps {
  match: AiRentalMatch;
  onInspectSpec: (match: AiRentalMatch) => void;
  onInstantReserve: (match: AiRentalMatch) => void;
}

export const RentalCard: React.FC<RentalCardProps> = ({
  match,
  onInspectSpec,
  onInstantReserve
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden relative group">
      {/* Top Match Badge */}
      {match.matchScoreBadge && (
        <div className="absolute top-0 right-0 bg-[#005E54] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg z-10 tracking-tight flex items-center gap-1 shadow-2xs">
          <Zap className="w-2.5 h-2.5 fill-current" />
          <span>{match.matchScoreBadge}</span>
        </div>
      )}

      <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
        {/* Left: Thumbnail with Location Hub Badge */}
        <div className="relative w-full sm:w-44 h-32 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
          <img
            src={match.image}
            alt={match.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {match.locationBadge && (
            <div className="absolute bottom-1.5 left-1.5 bg-[#001A48]/85 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-teal-400" />
              <span>{match.locationBadge}</span>
            </div>
          )}
        </div>

        {/* Right: Content details */}
        <div className="flex-1 min-w-0 w-full space-y-1.5">
          {/* Header row: category, provider, rating */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {match.category}
            </span>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              {match.providerVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
              )}
              <span className="truncate">{match.providerName}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 ml-auto sm:ml-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-slate-700 font-bold">{match.rating}</span>
              <span className="text-slate-400 font-normal">({match.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-bold text-[#001A48] hover:text-teal-700 transition-colors leading-snug line-clamp-1">
            {match.title}
          </h4>

          {/* Tags list */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {match.tags.map((tag, i) => {
              const isEscrow = tag.toLowerCase().includes('lankapay') || tag.toLowerCase().includes('escrow') || tag.toLowerCase().includes('safe');
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                    isEscrow
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isEscrow && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                  <span>{tag}</span>
                </span>
              );
            })}
          </div>

          {/* Price & Action row */}
          <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                LKR {match.pricePerDay.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-medium ml-1">/ day</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onInspectSpec(match)}
                className="text-slate-600 hover:text-[#001A48] text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Inspect Spec
              </button>

              <button
                type="button"
                onClick={() => onInstantReserve(match)}
                className="bg-[#007F73] hover:bg-[#00665c] active:bg-[#004d45] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs hover:shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Instant Reserve</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
