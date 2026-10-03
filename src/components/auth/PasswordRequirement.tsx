import React from 'react';
import { Check } from 'lucide-react';

interface PasswordRequirementProps {
  label: string;
  met: boolean;
}

export const PasswordRequirement: React.FC<PasswordRequirementProps> = ({ label, met }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 transition-colors">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
          met
            ? 'bg-emerald-100 text-emerald-600 border border-emerald-500'
            : 'border border-slate-300 bg-white text-transparent'
        }`}
      >
        <Check className={`w-2.5 h-2.5 stroke-[3] ${met ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      <span className={met ? 'text-slate-800 font-medium' : 'text-slate-500'}>{label}</span>
    </div>
  );
};
