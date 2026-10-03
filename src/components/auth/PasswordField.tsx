import React, { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  id: string;
  rightLabelAction?: ReactNode;
  error?: string;
  helperText?: string;
  showLeftIcon?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  id,
  rightLabelAction,
  error,
  helperText,
  showLeftIcon = true,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full text-left space-y-1.5 mb-3.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[13px] font-semibold text-slate-800">
          {label}
        </label>
        {rightLabelAction && <div>{rightLabelAction}</div>}
      </div>

      <div className="relative rounded-lg shadow-sm">
        {showLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-150 ${
            showLeftIcon ? 'pl-9' : 'pl-3.5'
          } pr-10 py-2.5 outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-[#001A48] focus:ring-2 focus:ring-[#001A48]/10'
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
