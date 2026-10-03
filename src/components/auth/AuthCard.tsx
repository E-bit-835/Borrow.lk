import React from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackLink?: boolean;
  backTo?: string;
  backLabel?: string;
  showLogo?: boolean;
  logoVariant?: 'standard' | 'unified';
  maxWidth?: string;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  subtitle,
  showBackLink = true,
  backTo = '/',
  backLabel = 'Back to Home',
  showLogo = true,
  logoVariant = 'standard',
  maxWidth = 'max-w-[430px]',
  className = '',
}) => {
  return (
    <div
      className={`w-full ${maxWidth} bg-white rounded-2xl border border-slate-100/90 borrow-card-shadow px-6 py-7 sm:px-9 sm:py-8 transition-all ${className}`}
    >
      {/* Top row: Back to Home link */}
      {showBackLink && (
        <div className="mb-4 text-left">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      {/* Brand Logo */}
      {showLogo && (
        <div className="text-center mb-5">
          <BrandLogo variant={logoVariant} size="lg" />
        </div>
      )}

      {/* Header Titles */}
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-[#001A48]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed whitespace-pre-line">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  );
};
