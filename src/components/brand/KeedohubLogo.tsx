import React from 'react';
import keedohubBrandLogo from '../../assets/images/keedohub_brand_logo_1795340542093.jpg';

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
  showSubtext = true,
}) => {
  const textColor = theme === 'white-black' ? '#000000' : '#FFFFFF';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={keedohubBrandLogo}
        alt="KeedoHub Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 select-none object-cover border border-[#1E1E1E]"
        style={{ width: size, height: size }}
      />

      <div className="flex flex-col">
        <span
          className="font-black tracking-tighter text-lg leading-none uppercase"
          style={{ color: textColor }}
        >
          KEEDOHUB
        </span>
        {showSubtext && (
          <span
            className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-60"
            style={{ color: textColor }}
          >
            Creative Ecosystem Platform
          </span>
        )}
      </div>
    </div>
  );
};

export const KeedohubIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <img
      src={keedohubBrandLogo}
      alt="KeedoHub Logo"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`shrink-0 select-none object-cover border border-[#1E1E1E] ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
