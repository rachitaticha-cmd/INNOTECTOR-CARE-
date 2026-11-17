import React, { useId } from 'react';

interface InotectorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'white' | 'dark' | 'auto';
  className?: string;
}

export const InotectorIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `innoGrad-${uid}`;
  const glossId = `innoGloss-${uid}`;
  const maskId = `innoMask-${uid}`;
  const shadowId = `innoShadow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 block ${className}`}
      aria-label="Inotector Care Icon"
    >
      <defs>
        <linearGradient id={gradId} x1="14" y1="12" x2="86" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#52E5C0" />
          <stop offset="50%" stopColor="#2CB591" />
          <stop offset="100%" stopColor="#167D62" />
        </linearGradient>

        <linearGradient id={glossId} x1="20" y1="10" x2="72" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F5240" floodOpacity="0.22" />
        </filter>

        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          {/* Symmetric diagonal curved cut from top-left inner corner to bottom-right */}
          <path
            d="M 30 30 C 46 33, 67 54, 70 70 C 54 67, 33 46, 30 30 Z"
            fill="black"
          />
        </mask>
      </defs>

      <g filter={`url(#${shadowId})`} mask={`url(#${maskId})`}>
        {/* Rounded symmetrical medical cross centered strictly at (50, 50) */}
        <rect x="34" y="10" width="32" height="80" rx="16" fill={`url(#${gradId})`} />
        <rect x="10" y="34" width="80" height="32" rx="16" fill={`url(#${gradId})`} />

        {/* Soft specular top-left highlight for realistic 3D depth */}
        <rect x="34" y="10" width="32" height="80" rx="16" fill={`url(#${glossId})`} />
        <rect x="10" y="34" width="80" height="32" rx="16" fill={`url(#${glossId})`} />
      </g>
    </svg>
  );
};

export const InotectorLogo: React.FC<InotectorLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'auto',
  className = '',
}) => {
  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 38,
    xl: 52,
  };

  const textStyles = {
    sm: 'text-sm tracking-tight',
    md: 'text-base sm:text-lg tracking-tight',
    lg: 'text-xl sm:text-2xl tracking-tight',
    xl: 'text-2xl sm:text-3xl tracking-tight',
  };

  const colorClass =
    textColor === 'white'
      ? 'text-white'
      : textColor === 'dark'
      ? 'text-[#24614e]'
      : 'text-inherit';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <InotectorIcon size={iconSizes[size]} />
      </div>

      {showText && (
        <span
          className={`font-heading font-extrabold ${textStyles[size]} ${colorClass}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          Inotector Care
        </span>
      )}
    </div>
  );
};

export default InotectorLogo;
