import React from 'react';
import { X, BookOpen, ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface RentalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RentalGuideModal: React.FC<RentalGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-[#001A48]">
              BorrowLK AI Rental Guide &amp; Protocols
            </h3>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>How BorrowLK AI Facilitates Rentals</span>
            </h4>
            <p>
              BorrowLK AI acts as an autonomous marketplace facilitator. It maintains an up-to-the-minute index of gear, vehicles, and commercial properties across all 25 districts in Sri Lanka.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verification &amp; Escrow Guarantee</span>
            </h4>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800">NIC &amp; Business Reg</strong>: Every host recommended by the AI is identity-verified via the Sri Lankan Department of Registration of Persons or BR.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800">LankaPay Escrow</strong>: Security deposits are held in insured digital escrow accounts and only settled upon physical handover and digital signature.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800">Inspection Protocol</strong>: You receive a 15-minute grace period upon physical pickup to test cameras, run diagnostics, and confirm condition.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Pickup &amp; Return Windows</span>
            </h4>
            <p>
              Standard pickup is between 8:00 AM and 10:00 AM on the start date. Custom early pickups (e.g. 7:30 AM from Cinnamon Gardens / Colombo 07) can be arranged directly through AI chat queries and host confirmation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#001A48] hover:bg-[#002669] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
