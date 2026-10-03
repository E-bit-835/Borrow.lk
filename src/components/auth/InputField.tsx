import React from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  icon?: ReactNode;
  rightLabelAction?: ReactNode;
  error?: string;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  icon,
  rightLabelAction,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full text-left space-y-1.5 mb-3.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[13px] font-semibold text-slate-800">
          {label}
        </label>
        {rightLabelAction && <div>{rightLabelAction}</div>}
      </div>

      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-150 ${
            icon ? 'pl-9' : 'pl-3.5'
          } pr-3.5 py-2.5 outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-[#001A48] focus:ring-2 focus:ring-[#001A48]/10'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
