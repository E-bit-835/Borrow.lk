import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  variant?: 'standard' | 'unified';
  textColor?: 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withLink?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'standard',
  textColor = 'dark',
  size = 'md',
  className = '',
  withLink = true,
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  }[size];

  // Vector mark representing peer-to-peer exchange / borrowing loop
  const LogoIcon = ({ color }: { color: string }) => (
    <svg
      className={`${iconSizes} inline-block mr-1.5`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="9" cy="12" r="5.5" stroke={color} strokeWidth="2.5" />
      <circle cx="15" cy="12" r="5.5" stroke="#00B4A7" strokeWidth="2.5" strokeDasharray="14 14" />
      <path
        d="M12 7L14 9L12 11"
        stroke="#00B4A7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const content = (
    <div className={`inline-flex items-center tracking-tight select-none font-bold ${sizeClasses} ${className}`}>
      {variant === 'standard' ? (
        // Standard lowercase "borrow.lk" as shown in screens 1, 2, 3
        <span className="flex items-center">
          <span className={textColor === 'white' ? 'text-white' : 'text-[#001A48]'}>
            borrow
          </span>
          <span className="text-[#00B4A7]">.lk</span>
        </span>
      ) : (
        // Unified style "BorrowLK" with brand icon as shown in screens 4 and 5
        <span className="flex items-center gap-1.5">
          <LogoIcon color={textColor === 'white' ? '#FFFFFF' : '#001A48'} />
          <span className={textColor === 'white' ? 'text-white' : 'text-[#001A48]'}>
            Borrow<span className={textColor === 'white' ? 'text-white' : 'text-[#001A48]'}>LK</span>
          </span>
        </span>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link to="/" className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001A48] rounded">
        {content}
      </Link>
    );
  }

  return content;
};
