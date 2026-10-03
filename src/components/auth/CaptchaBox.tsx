import React, { useState } from 'react';

interface CaptchaBoxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export const CaptchaBox: React.FC<CaptchaBoxProps> = ({ checked, onChange, error }) => {
  const [verifying, setVerifying] = useState(false);

  const handleClick = () => {
    if (checked || verifying) return;
    setVerifying(true);
    // Simulate realistic reCAPTCHA verification delay
    setTimeout(() => {
      setVerifying(false);
      onChange(true);
    }, 700);
  };

  return (
    <div className="w-full my-3">
      <div
        onClick={handleClick}
        className={`w-full bg-[#FAFAFA] border rounded-[4px] p-2.5 sm:p-3 flex items-center justify-between select-none cursor-pointer transition-colors ${
          error ? 'border-red-400 bg-red-50/20' : 'border-[#D1D5DB] hover:border-slate-400'
        }`}
        style={{ minHeight: '68px' }}
      >
        {/* Left Checkbox & Text */}
        <div className="flex items-center gap-3">
          <div
            className={`w-[26px] h-[26px] rounded-[2px] border flex items-center justify-center transition-all bg-white ${
              checked
                ? 'border-emerald-600 bg-emerald-50'
                : verifying
                ? 'border-blue-500'
                : error
                ? 'border-red-500'
                : 'border-[#C1C1C1] hover:border-[#9E9E9E]'
            }`}
          >
            {verifying ? (
              <svg className="animate-spin w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : checked ? (
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </div>
          <span className="text-[13px] sm:text-[14px] text-[#282727] font-normal">
            I'm not a robot
          </span>
        </div>

        {/* Right Google reCAPTCHA Badge */}
        <div className="flex flex-col items-center justify-center pl-2">
          <div className="w-8 h-8 flex items-center justify-center">
            {/* reCAPTCHA iconic logo */}
            <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4C14.06 4 6 12.06 6 22H11C11 14.82 16.82 9 24 9C29.6 9 34.37 12.52 36.21 17.5L31.5 20.21L43.83 23.36L44 11L39.73 13.44C36.72 7.74 30.82 4 24 4Z"
                fill="#4285F4"
              />
              <path
                d="M42 26C42 33.18 36.18 39 29 39C23.4 39 18.63 35.48 16.79 30.5L21.5 27.79L9.17 24.64L9 37L13.27 34.56C16.28 40.26 22.18 44 29 44C38.94 44 47 35.94 47 26H42Z"
                fill="#34A853"
              />
              <path
                d="M10 22C10 21.32 10.05 20.65 10.15 20H5.1C5.03 20.66 5 21.33 5 22H10Z"
                fill="#EA4335"
              />
              <path
                d="M38 26C38 26.68 37.95 27.35 37.85 28H42.9C42.97 27.34 43 26.67 43 26H38Z"
                fill="#FBBC05"
              />
            </svg>
          </div>
          <span className="text-[9px] text-[#555555] font-sans font-medium tracking-tight">
            reCAPTCHA
          </span>
          <div className="flex gap-1 text-[7px] text-[#555555]">
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:underline">
              Privacy
            </a>
            <span>-</span>
            <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:underline">
              Terms
            </a>
          </div>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
