"use client";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PIXEL_SIZES = {
  sm: 16,
  md: 28,
  lg: 36,
};

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const px = PIXEL_SIZES[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 44 44"
      className={className}
      aria-label="Loading"
    >
      <style>{`
        @keyframes tt-pulse {
          0% { opacity: 0.15; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.15; transform: scale(0.75); }
        }
      `}</style>
      {/* Center (dark) */}
      <circle cx="22" cy="22" r="5" fill="#5c564f" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.8s infinite', transformOrigin: '22px 22px' }} />
      {/* Ring 1: cross */}
      <circle cx="22" cy="8"  r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.56s infinite', transformOrigin: '22px 8px' }} />
      <circle cx="36" cy="22" r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.56s infinite', transformOrigin: '36px 22px' }} />
      <circle cx="22" cy="36" r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.56s infinite', transformOrigin: '22px 36px' }} />
      <circle cx="8"  cy="22" r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.56s infinite', transformOrigin: '8px 22px' }} />
      {/* Ring 2: corners */}
      <circle cx="8"  cy="8"  r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.32s infinite', transformOrigin: '8px 8px' }} />
      <circle cx="36" cy="8"  r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.32s infinite', transformOrigin: '36px 8px' }} />
      <circle cx="8"  cy="36" r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.32s infinite', transformOrigin: '8px 36px' }} />
      <circle cx="36" cy="36" r="5" fill="#008085" style={{ animation: 'tt-pulse 1.6s ease-in-out -0.32s infinite', transformOrigin: '36px 36px' }} />
    </svg>
  );
}
