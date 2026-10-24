/**
 * LYRICAL ENT — Official Brand Logo System
 * Vector Graphics & Reusable Visual Identity Components
 */

import React from 'react';

export type LogoTheme = 'light' | 'dark' | 'monochrome-black' | 'monochrome-white';

interface LogoProps {
  size?: number;
  className?: string;
  theme?: LogoTheme;
  showSubtext?: boolean;
}

/**
 * Custom LE Monogram Glyph
 * An architectural, high-contrast interlocking monogram representing LYRICAL ENT
 */
export const LyricalMonogram: React.FC<{
  size?: number;
  className?: string;
  theme?: LogoTheme;
  framed?: boolean;
}> = ({ size = 48, className = '', theme = 'monochrome-white', framed = false }) => {
  const fillColor = (theme === 'light' || theme === 'monochrome-black') ? '#000000' : '#FFFFFF';
  const borderColor = fillColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="LYRICAL ENT Monogram"
    >
      {framed && (
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          fill="none"
          stroke={borderColor}
          strokeWidth="3.5"
        />
      )}
      
      {/* Precision Geometric Monogram 'LE' */}
      <g fill={fillColor}>
        {/* Letter 'L' */}
        {/* Vertical Left Stem */}
        <rect x="14" y="16" width="16" height="68" />
        {/* Horizontal Base */}
        <rect x="14" y="70" width="34" height="14" />

        {/* Letter 'E' */}
        {/* Vertical Spine */}
        <rect x="44" y="16" width="15" height="68" />
        {/* Top Arm */}
        <rect x="44" y="16" width="42" height="14" />
        {/* Middle Arm */}
        <rect x="44" y="43" width="32" height="13" />
        {/* Bottom Arm */}
        <rect x="44" y="70" width="42" height="14" />

        {/* Dynamic Architectural Accent - Sound Matrix Chisel Notch */}
        <polygon points="86,16 90,16 86,22" />
        <polygon points="86,84 90,84 86,78" />
      </g>
    </svg>
  );
};

/**
 * Primary Stacked Logo
 * Monogram + Bold LYRICAL ENT + Record Label & Studio subtext
 */
export const LyricalPrimaryLogo: React.FC<LogoProps> = ({
  size = 180,
  className = '',
  theme = 'monochrome-white',
  showSubtext = true
}) => {
  const isLight = theme === 'light' || theme === 'monochrome-black';
  const textColor = isLight ? '#000000' : '#FFFFFF';
  const subtextColor = isLight ? '#666666' : '#A3A3A3';

  // Calculate proportional height
  const height = showSubtext ? size * 0.75 : size * 0.55;

  return (
    <svg
      width={size}
      height={height}
      viewBox={showSubtext ? "0 0 240 180" : "0 0 240 130"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="LYRICAL ENT Primary Logo"
    >
      {/* Centered Monogram Mark */}
      <g transform="translate(85, 8)">
        <rect x="2" y="2" width="66" height="66" fill="none" stroke={textColor} strokeWidth="2.5" />
        <g fill={textColor}>
          {/* L */}
          <rect x="10" y="12" width="11" height="46" />
          <rect x="10" y="48" width="24" height="10" />
          {/* E */}
          <rect x="31" y="12" width="10" height="46" />
          <rect x="31" y="12" width="28" height="10" />
          <rect x="31" y="30" width="21" height="9" />
          <rect x="31" y="48" width="28" height="10" />
        </g>
      </g>

      {/* Primary Brand Typography */}
      <text
        x="120"
        y="110"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="0.28em"
        fill={textColor}
      >
        LYRICAL ENT
      </text>

      {/* Subline Record Label Descriptor */}
      {showSubtext && (
        <>
          <line x1="45" y1="128" x2="195" y2="128" stroke={textColor} strokeWidth="0.75" strokeOpacity="0.3" />
          <text
            x="120"
            y="146"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="8"
            fontWeight="600"
            letterSpacing="0.32em"
            fill={subtextColor}
          >
            RECORD LABEL &amp; STUDIO
          </text>
        </>
      )}
    </svg>
  );
};

/**
 * Horizontal Logo Lockup
 * Streamlined inline lockup for app headers, banners, navigation, and letterhead headers
 */
export const LyricalHorizontalLogo: React.FC<{
  height?: number;
  className?: string;
  theme?: LogoTheme;
  showDescriptor?: boolean;
}> = ({ height = 36, className = '', theme = 'monochrome-white', showDescriptor = true }) => {
  const isLight = theme === 'light' || theme === 'monochrome-black';
  const textColor = isLight ? '#000000' : '#FFFFFF';
  const subtextColor = isLight ? '#666666' : '#9E9E9E';
  const width = showDescriptor ? height * 5.4 : height * 4.2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={showDescriptor ? "0 0 280 52" : "0 0 220 52"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="LYRICAL ENT Horizontal Logo"
    >
      {/* Monogram Seal */}
      <g transform="translate(4, 4)">
        <rect x="0" y="0" width="44" height="44" fill="none" stroke={textColor} strokeWidth="2.5" />
        <g fill={textColor}>
          {/* L */}
          <rect x="6" y="8" width="7.5" height="30" />
          <rect x="6" y="31.5" width="16" height="6.5" />
          {/* E */}
          <rect x="20" y="8" width="7" height="30" />
          <rect x="20" y="8" width="18" height="6.5" />
          <rect x="20" y="20" width="14" height="6" />
          <rect x="20" y="31.5" width="18" height="6.5" />
        </g>
      </g>

      {/* Brand Text */}
      <text
        x="62"
        y="28"
        fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="0.22em"
        fill={textColor}
      >
        LYRICAL ENT
      </text>

      {showDescriptor && (
        <text
          x="63"
          y="42"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="7.5"
          fontWeight="500"
          letterSpacing="0.26em"
          fill={subtextColor}
        >
          BRAND &amp; LABEL STUDIO
        </text>
      )}
    </svg>
  );
};

/**
 * Square Social Media / Album Art Badge Icon (1:1)
 */
export const LyricalSquareIcon: React.FC<{
  size?: number;
  className?: string;
  theme?: LogoTheme;
}> = ({ size = 64, className = '', theme = 'monochrome-white' }) => {
  const isLight = theme === 'light' || theme === 'monochrome-black';
  const bgColor = isLight ? '#000000' : '#0E0E0E';
  const borderColor = isLight ? '#000000' : '#262626';
  const emblemColor = '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none rounded shrink-0 ${className}`}
      aria-label="LYRICAL ENT Social Square Icon"
    >
      <rect width="100" height="100" fill={bgColor} stroke={borderColor} strokeWidth="2" />
      
      {/* Center LE Monogram */}
      <g transform="translate(18, 18)">
        <rect x="0" y="0" width="64" height="64" fill="none" stroke={emblemColor} strokeWidth="2" />
        <g fill={emblemColor}>
          {/* L */}
          <rect x="9" y="12" width="11" height="42" />
          <rect x="9" y="44" width="23" height="10" />
          {/* E */}
          <rect x="30" y="12" width="10" height="42" />
          <rect x="30" y="12" width="25" height="10" />
          <rect x="30" y="28" width="18" height="9" />
          <rect x="30" y="44" width="25" height="10" />
        </g>
      </g>
    </svg>
  );
};

/**
 * Favicon Component (32x32 / 64x64 micro-pixel alignment)
 */
export const LyricalFavicon: React.FC<{
  size?: number;
  className?: string;
  theme?: 'dark' | 'light';
}> = ({ size = 32, className = '', theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const bg = isDark ? '#000000' : '#FFFFFF';
  const fg = isDark ? '#FFFFFF' : '#000000';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
    >
      <rect width="32" height="32" fill={bg} />
      <g fill={fg}>
        {/* L */}
        <rect x="4" y="5" width="4" height="22" />
        <rect x="4" y="23" width="11" height="4" />
        {/* E */}
        <rect x="14" y="5" width="4" height="22" />
        <rect x="14" y="5" width="13" height="4" />
        <rect x="14" y="14" width="10" height="4" />
        <rect x="14" y="23" width="13" height="4" />
      </g>
    </svg>
  );
};

// --------------------------------------------------------------------------
// RAW SVG STRING GENERATORS & FILE EXPORT UTILITIES
// --------------------------------------------------------------------------

export function getRawSvgString(
  type: 'primary' | 'horizontal' | 'monogram' | 'square' | 'favicon',
  theme: 'black-on-white' | 'white-on-black' = 'white-on-black'
): string {
  const isBlackOnWhite = theme === 'black-on-white';
  const bg = isBlackOnWhite ? '#FFFFFF' : '#000000';
  const fg = isBlackOnWhite ? '#000000' : '#FFFFFF';
  const sub = isBlackOnWhite ? '#666666' : '#A3A3A3';

  switch (type) {
    case 'primary':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220" width="300" height="220">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g transform="translate(115, 20)">
    <rect x="0" y="0" width="70" height="70" fill="none" stroke="${fg}" stroke-width="2.5"/>
    <g fill="${fg}">
      <rect x="10" y="13" width="12" height="46"/>
      <rect x="10" y="49" width="25" height="10"/>
      <rect x="33" y="13" width="11" height="46"/>
      <rect x="33" y="13" width="28" height="10"/>
      <rect x="33" y="31" width="21" height="9"/>
      <rect x="33" y="49" width="28" height="10"/>
    </g>
  </g>
  <text x="150" y="132" text-anchor="middle" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="6" fill="${fg}">LYRICAL ENT</text>
  <line x1="60" y1="152" x2="240" y2="152" stroke="${fg}" stroke-width="0.8" stroke-opacity="0.3"/>
  <text x="150" y="172" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="3" fill="${sub}">RECORD LABEL &amp; PRODUCTION STUDIO</text>
</svg>`;

    case 'horizontal':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" width="320" height="64">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g transform="translate(10, 10)">
    <rect x="0" y="0" width="44" height="44" fill="none" stroke="${fg}" stroke-width="2.5"/>
    <g fill="${fg}">
      <rect x="6" y="8" width="7.5" height="30"/>
      <rect x="6" y="31.5" width="16" height="6.5"/>
      <rect x="20" y="8" width="7" height="30"/>
      <rect x="20" y="8" width="18" height="6.5"/>
      <rect x="20" y="20" width="14" height="6"/>
      <rect x="20" y="31.5" width="18" height="6.5"/>
    </g>
  </g>
  <text x="70" y="34" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="20" font-weight="800" letter-spacing="4" fill="${fg}">LYRICAL ENT</text>
  <text x="71" y="48" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="500" letter-spacing="2" fill="${sub}">BRAND &amp; LABEL STUDIO</text>
</svg>`;

    case 'monogram':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="5" y="5" width="90" height="90" fill="none" stroke="${fg}" stroke-width="3"/>
  <g fill="${fg}">
    <rect x="15" y="17" width="15" height="66"/>
    <rect x="15" y="69" width="32" height="14"/>
    <rect x="44" y="17" width="14" height="66"/>
    <rect x="44" y="17" width="39" height="14"/>
    <rect x="44" y="43" width="29" height="13"/>
    <rect x="44" y="69" width="39" height="14"/>
  </g>
</svg>`;

    case 'square':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="${bg}"/>
  <g transform="translate(35, 35)">
    <rect x="0" y="0" width="130" height="130" fill="none" stroke="${fg}" stroke-width="4"/>
    <g fill="${fg}">
      <rect x="18" y="24" width="22" height="84"/>
      <rect x="18" y="88" width="46" height="20"/>
      <rect x="60" y="24" width="20" height="84"/>
      <rect x="60" y="24" width="52" height="20"/>
      <rect x="60" y="56" width="38" height="18"/>
      <rect x="60" y="88" width="52" height="20"/>
    </g>
  </g>
</svg>`;

    case 'favicon':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="${bg}"/>
  <g fill="${fg}">
    <rect x="4" y="5" width="4" height="22"/>
    <rect x="4" y="23" width="11" height="4"/>
    <rect x="14" y="5" width="4" height="22"/>
    <rect x="14" y="5" width="13" height="4"/>
    <rect x="14" y="14" width="10" height="4"/>
    <rect x="14" y="23" width="13" height="4"/>
  </g>
</svg>`;
  }
}

// --------------------------------------------------------------------------
// KEEDOHUB — PLATFORM BRANDING
// --------------------------------------------------------------------------

/**
 * KEEDOHUB Primary Platform Logo
 * Red and Black Professional Creative Agency Brand
 */
export const KeedohubLogo: React.FC<{
  height?: number;
  className?: string;
  theme?: 'dark' | 'light';
}> = ({ height = 32, className = '', theme = 'dark' }) => {
  const red = '#FF1E1E';
  const text = theme === 'dark' ? '#FFFFFF' : '#000000';
  const width = height * 4.5;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="KEEDOHUB Platform Logo"
    >
      <text
        x="0"
        y="30"
        fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        fontSize="24"
        fontWeight="900"
        letterSpacing="-0.04em"
      >
        <tspan fill={text}>KEEDO</tspan>
        <tspan fill={red}>HUB</tspan>
      </text>
      
      {/* Platform Indicator */}
      <rect x="0" y="34" width="100%" height="2" fill={red} fillOpacity="0.2" />
    </svg>
  );
};

/**
 * WorkspaceLogo Component
 * Dynamically switches between LYRICAL ENT and other customer brands
 */
export const WorkspaceLogo: React.FC<{
  workspaceId: string;
  workspaceName: string;
  height?: number;
  className?: string;
  theme?: LogoTheme;
}> = ({ workspaceId, workspaceName, height = 36, className = '', theme = 'monochrome-white' }) => {
  // If it's the legacy Lyrical Ent workspace, use its specific identity
  if (workspaceId === 'ws-lyrical-ent' || workspaceName.toUpperCase() === 'LYRICAL ENT') {
    return <LyricalHorizontalLogo height={height} className={className} theme={theme} showDescriptor={true} />;
  }

  // Fallback for other workspaces: Generic but professional typographic logo
  const isLight = theme === 'light' || theme === 'monochrome-black';
  const textColor = isLight ? '#000000' : '#FFFFFF';
  
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ height }}>
      <div 
        className="h-full aspect-square flex items-center justify-center font-black border-2"
        style={{ borderColor: textColor, color: textColor, fontSize: height * 0.5 }}
      >
        {workspaceName.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className="font-bold tracking-tighter uppercase" style={{ color: textColor, fontSize: height * 0.45 }}>
          {workspaceName}
        </span>
        <span className="text-[8px] font-mono tracking-[0.3em] uppercase opacity-50" style={{ color: textColor }}>
          WORKSPACE
        </span>
      </div>
    </div>
  );
};

/**
 * Real download utility: triggers client-side file download of SVG file
 */
export function triggerSvgDownload(
  type: 'primary' | 'horizontal' | 'monogram' | 'square' | 'favicon',
  theme: 'black-on-white' | 'white-on-black' = 'white-on-black',
  filename?: string
): void {
  const svgCode = getRawSvgString(type, theme);
  const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || `lyrical_ent_${type}_${theme}.svg`;
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Real download utility: draws SVG to offscreen canvas and triggers high-res PNG download
 */
export function triggerPngDownload(
  type: 'primary' | 'horizontal' | 'monogram' | 'square' | 'favicon',
  theme: 'black-on-white' | 'white-on-black' = 'white-on-black',
  size: number = 800,
  filename?: string
): void {
  const svgCode = getRawSvgString(type, theme);
  const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    // Maintain aspect ratio
    const aspect = img.width / img.height;
    canvas.width = size;
    canvas.height = Math.round(size / aspect);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          const anchor = document.createElement('a');
          anchor.href = pngUrl;
          anchor.download = filename || `lyrical_ent_${type}_${theme}_${canvas.width}x${canvas.height}.png`;
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
    }
    URL.revokeObjectURL(url);
  };

  img.src = url;
}
