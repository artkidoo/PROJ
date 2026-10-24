import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  theme?: 'red-black' | 'white-black' | 'monochrome-white';
  showSubtext?: boolean;
}

export const KeedohubLogo: React.FC<LogoProps> = ({ 
  size = 40, 
  className = '', 
  theme = 'red-black',
  showSubtext = true 
}) => {
  const primaryColor = theme === 'monochrome-white' ? '#FFFFFF' : '#FF1E1E'; // Keedohub Red
  const secondaryColor = theme === 'monochrome-white' ? '#FFFFFF' : '#000000';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none"
      >
        {/* KEEDOHUB Abstract 'K' / Hub Symbol */}
        <rect width="100" height="100" rx="12" fill={secondaryColor} />
        
        {/* Geometric Hexagon Frame */}
        <path
          d="M50 20L76 35V65L50 80L24 65V35L50 20Z"
          stroke={primaryColor}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        
        {/* Central Core Pulse */}
        <circle cx="50" cy="50" r="12" fill={primaryColor} />
        
        {/* Connectors */}
        <line x1="50" y1="20" x2="50" y2="38" stroke={primaryColor} strokeWidth="4" />
        <line x1="50" y1="62" x2="50" y2="80" stroke={primaryColor} strokeWidth="4" />
        <line x1="24" y1="65" x2="40" y2="56" stroke={primaryColor} strokeWidth="4" />
        <line x1="76" y1="65" x2="60" y2="56" stroke={primaryColor} strokeWidth="4" />
        <line x1="24" y1="35" x2="40" y2="44" stroke={primaryColor} strokeWidth="4" />
        <line x1="76" y1="35" x2="60" y2="44" stroke={primaryColor} strokeWidth="4" />
      </svg>
      
      <div className="flex flex-col">
        <span className="font-black tracking-tighter text-lg leading-none" style={{ color: secondaryColor === '#000000' && theme !== 'monochrome-white' ? '#FFFFFF' : secondaryColor }}>
          KEEDO<span style={{ color: primaryColor }}>HUB</span>
        </span>
        {showSubtext && (
          <span className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-60" style={{ color: secondaryColor === '#000000' && theme !== 'monochrome-white' ? '#FFFFFF' : secondaryColor }}>
            Creative Agency Platform
          </span>
        )}
      </div>
    </div>
  );
};

export const KeedohubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <rect width="100" height="100" rx="16" fill="#000000" />
      <path
        d="M50 20L76 35V65L50 80L24 65V35L50 20Z"
        stroke="#FF1E1E"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="15" fill="#FF1E1E" />
    </svg>
  );
};
