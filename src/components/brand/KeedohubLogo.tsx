/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Official Brand Logo & Mark Components (Clean Transparent Architecture)
 */

import React from 'react';
import keedohubMarkTransparent from '../../assets/images/keedohub_mark_transparent.png';
import keedohubMarkLightBg from '../../assets/images/keedohub_mark_light_bg.png';
import keedohubLogoTransparent from '../../assets/images/keedohub_logo_transparent.png';
import keedohubLogoLightBg from '../../assets/images/keedohub_logo_light_bg.png';

export {
  keedohubMarkTransparent,
  keedohubMarkLightBg,
  keedohubLogoTransparent,
  keedohubLogoLightBg,
};

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
  const isLight = theme === 'white-black';
  const textColor = isLight ? '#0B0B0B' : '#FFFFFF';
  const markSrc = isLight ? keedohubMarkLightBg : keedohubMarkTransparent;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={markSrc}
        alt="KeedoHub Emblem"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 select-none object-contain bg-transparent"
        style={{ width: size, height: size }}
      />

      <div className="flex flex-col min-w-0">
        <span
          className="font-black tracking-tighter text-lg leading-none uppercase truncate select-none"
          style={{ color: textColor }}
        >
          KEEDOHUB
        </span>
        {showSubtext && (
          <span
            className="text-[9px] sm:text-[10px] tracking-[0.2em] font-mono font-semibold uppercase opacity-65 truncate select-none"
            style={{ color: textColor }}
          >
            Creative Ecosystem Platform
          </span>
        )}
      </div>
    </div>
  );
};

export const KeedohubIcon: React.FC<{
  size?: number;
  className?: string;
  theme?: 'dark' | 'light';
}> = ({
  size = 32,
  className = '',
  theme = 'dark',
}) => {
  const markSrc = theme === 'light' ? keedohubMarkLightBg : keedohubMarkTransparent;

  return (
    <img
      src={markSrc}
      alt="KeedoHub Emblem"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`shrink-0 select-none object-contain bg-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export const KeedohubStackedLogo: React.FC<{
  width?: number;
  className?: string;
  theme?: 'dark' | 'light';
}> = ({
  width = 160,
  className = '',
  theme = 'dark',
}) => {
  const logoSrc = theme === 'light' ? keedohubLogoLightBg : keedohubLogoTransparent;

  return (
    <img
      src={logoSrc}
      alt="KeedoHub Master Logo"
      width={width}
      referrerPolicy="no-referrer"
      className={`shrink-0 select-none object-contain bg-transparent ${className}`}
      style={{ width, height: 'auto' }}
    />
  );
};
