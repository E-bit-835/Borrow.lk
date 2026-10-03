import React from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Package } from 'lucide-react';
import type { AiRentalMatch } from '../../data/aiAssistantData';

interface SpecModalProps {
  isOpen: boolean;
  match: AiRentalMatch | null;
  onClose: () => void;
  onReserve: (match: AiRentalMatch) => void;
}

export const SpecModal: React.FC<SpecModalProps> = ({
  isOpen,
  match,
  onClose,
  onReserve
}) => {
  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {match.category}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Verified Equipment Specs
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Info */}
          <div className="flex gap-3">
            <img
              src={match.image}
              alt={match.title}
              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#001A48] leading-snug">
                {match.title}
              </h3>
              <p className="text-slate-500 font-medium">
                Hosted by <span className="font-bold text-slate-800">{match.providerName}</span> &bull; {match.district}
              </p>
              <div className="text-teal-700 font-extrabold text-sm">
                LKR {match.pricePerDay.toLocaleString()} <span className="text-slate-400 font-normal text-xs">/ day</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Technical Specifications
            </h4>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
              {Object.entries(match.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-0.5 border-b border-slate-200/40 last:border-none">
                  <span className="text-slate-500 font-medium">{key}</span>
                  <span className="text-slate-800 font-bold text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Included Accessories */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>Included Gear &amp; Accessories</span>
            </h4>
            <ul className="space-y-1 pl-1">
              {match.includedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* LankaPay Escrow Protection Note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              <span className="font-bold">LankaPay Protected Transaction</span>: Your security deposit and rental fee remain held securely until you inspect the equipment during handover in {match.district}.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onReserve(match);
            }}
            className="bg-[#007F73] hover:bg-[#00665c] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Reserve &bull; LKR {match.pricePerDay.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
