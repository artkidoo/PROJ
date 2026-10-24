/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Advanced Logo Concept System
 * 7 Professional Vector Visual Identities with Music Industry Geometry
 */

import React from 'react';

export type LogoConceptId = 
  | 'classic'            // Concept 1: Architectural Interlocking Monogram (Approved Base)
  | 'mic_integrated'    // Concept 2: Vintage Studio Microphone Stem
  | 'soundwave_vinyl'   // Concept 3: Vinyl Grooves & Acoustic Radiance
  | 'mic_negative'      // Concept 4: Optical Negative-Space Studio Mic
  | 'label_seal'        // Concept 5: Circular Archival Record Label Seal
  | 'bespoke_wordmark'  // Concept 6: High-Contrast Chiseled Wordmark
  | 'monoline_icon';    // Concept 7: Minimalist Monoline Micro-Icon

export type LogoVariant = 'primary' | 'monogram' | 'horizontal' | 'seal' | 'icon' | 'wordmark';
export type LogoColorTheme = 'monochrome-white' | 'monochrome-black' | 'gold-accent' | 'charcoal-silver';

export interface LogoRenderProps {
  conceptId?: LogoConceptId;
  variant?: LogoVariant;
  theme?: LogoColorTheme;
  size?: number;
  className?: string;
  transparent?: boolean;
  showSubtext?: boolean;
}

export interface LogoConceptMeta {
  id: LogoConceptId;
  name: string;
  category: string;
  description: string;
  designDirection: string;
  bestFor: string;
}

export const LOGO_CONCEPTS_METADATA: LogoConceptMeta[] = [
  {
    id: 'classic',
    name: 'Architectural Monogram (Classic Base)',
    category: 'Monogram System',
    description: 'Precision architectural interlocking L and E with sound-matrix chisel notch geometry.',
    designDirection: 'Clean geometric lines, 90-degree interlocking joinery, balanced negative space.',
    bestFor: 'Corporate stationery, executive business cards, label letterheads.'
  },
  {
    id: 'mic_integrated',
    name: 'Studio Condenser Mic Integrated',
    category: 'Microphone Geometry',
    description: 'A vintage studio condenser capsule seamlessly integrated into the vertical spine of the L, crowned with mesh acoustic grille lines.',
    designDirection: 'Professional studio microphone silhouette forming the backbone of the monogram, unified with the letterforms.',
    bestFor: 'Artist single covers, vocal booth flyers, studio recording sessions.'
  },
  {
    id: 'soundwave_vinyl',
    name: 'Soundwave & Vinyl Geometry',
    category: 'Acoustic Sound Lab',
    description: 'Concentric vinyl-record microgrooves intersecting the monogram with radiating audio frequency equalizer spikes.',
    designDirection: 'Harmonic acoustic resonance, vinyl circular curvature, audio engineering precision.',
    bestFor: 'Vinyl record packaging, album center labels, DJ performance gear.'
  },
  {
    id: 'mic_negative',
    name: 'Negative Space Studio Mic',
    category: 'Optical Geometry',
    description: 'A studio dynamic microphone silhouette precision-carved out of the negative space between the E letterform spine and arms.',
    designDirection: 'Optical illusion, dual-reading negative space, intelligent minimalist silhouette.',
    bestFor: 'High-end streetwear merchandise, festival crests, digital streaming badges.'
  },
  {
    id: 'label_seal',
    name: 'Record Label Archival Seal',
    category: 'Emblem & Seal',
    description: 'Circular archival seal with curved typography, outer knurled gear rim, center monogram, and catalog registration stamp.',
    designDirection: 'Traditional luxury record label seal, archival vinyl stamping, timeless authenticity.',
    bestFor: 'Master release packaging, album corner badges, video watermarks.'
  },
  {
    id: 'bespoke_wordmark',
    name: 'Bespoke Chiseled Wordmark',
    category: 'Custom Typography',
    description: 'High-contrast bespoke logotype with 45° precision cuts on the L and E terminal stems, wide editorial tracking, and audio hyphen ligature.',
    designDirection: 'Custom typographic cuts, balanced proportions, luxurious architectural presence.',
    bestFor: 'Billboard headlines, streaming header banners, luxury event posters.'
  },
  {
    id: 'monoline_icon',
    name: 'Ultra-Minimal Monoline Icon',
    category: 'Minimalist System',
    description: 'Simplified, single-stroke geometric LE icon engineered for ultra-crisp legibility at 16px to 32px micro-sizes.',
    designDirection: 'Pure monoline vector geometry, zero visual clutter, maximum small-scale legibility.',
    bestFor: 'Favicons, app icons, smartwatch displays, social avatar stamps.'
  }
];

// Helper to resolve palette colors
export function getThemeColors(theme: LogoColorTheme) {
  switch (theme) {
    case 'monochrome-black':
      return { fg: '#000000', bg: '#FFFFFF', sub: '#555555', accent: '#222222' };
    case 'gold-accent':
      return { fg: '#F3E8C4', bg: '#080808', sub: '#C5A880', accent: '#D4AF37' };
    case 'charcoal-silver':
      return { fg: '#E5E5E5', bg: '#141414', sub: '#8E8E93', accent: '#A1A1AA' };
    case 'monochrome-white':
    default:
      return { fg: '#FFFFFF', bg: '#000000', sub: '#A3A3A3', accent: '#E5E5E5' };
  }
}

/**
 * Universal SVG Vector Logo Renderer
 * Renders any of the 7 concepts in any variant, theme, and size with 100% SVG geometry.
 */
export const LyricalLogoConcept: React.FC<LogoRenderProps> = ({
  conceptId = 'classic',
  variant = 'primary',
  theme = 'monochrome-white',
  size = 120,
  className = '',
  transparent = true,
  showSubtext = true
}) => {
  const { fg, bg, sub, accent } = getThemeColors(theme);

  // 1. CONCEPT 1: CLASSIC ARCHITECTURAL MONOGRAM (Refined Sharpness)
  const renderClassic = () => (
    <g>
      {(variant === 'primary' || variant === 'seal') && (
        <rect x="12" y="12" width="76" height="76" fill="none" stroke={fg} strokeWidth="3" />
      )}
      <g fill={fg}>
        {/* L: Architectural Sharpness */}
        <polygon points="22,22 36,22 36,66 52,66 52,78 22,78" />
        {/* E: Precision Stepped Geometry */}
        <polygon points="44,22 78,22 78,34 58,34 58,44 74,44 74,54 58,54 58,66 78,66 78,78 44,78" />
        {/* Optical Alignment Notches */}
        <polygon points="22,22 28,22 22,28" fill={bg} />
        <polygon points="78,78 72,78 78,72" fill={bg} />
      </g>
    </g>
  );

  // 2. CONCEPT 2: STUDIO CONDENSER MICROPHONE INTEGRATED
  const renderMicIntegrated = () => (
    <g>
      {/* Outer Circle Accent */}
      <circle cx="50" cy="50" r="44" fill="none" stroke={fg} strokeWidth="1.8" strokeDasharray="3 3" opacity="0.4" />
      
      {/* Integrated L Stem featuring Studio Condenser Mic Capsule */}
      <g fill={fg}>
        {/* Condenser Capsule Housing (upper L) */}
        <rect x="23" y="18" width="14" height="28" rx="7" />
        {/* Horizontal Grille Ribs (acoustic diaphragm slots) */}
        <line x1="25" y1="23" x2="35" y2="23" stroke={bg} strokeWidth="1.5" />
        <line x1="25" y1="27" x2="35" y2="27" stroke={bg} strokeWidth="1.5" />
        <line x1="25" y1="31" x2="35" y2="31" stroke={bg} strokeWidth="1.5" />
        <line x1="25" y1="35" x2="35" y2="35" stroke={bg} strokeWidth="1.5" />

        {/* Lower L Solid Stem and Base */}
        <rect x="24" y="44" width="12" height="34" />
        <rect x="24" y="68" width="26" height="10" />

        {/* Shockmount Ring connector */}
        <ellipse cx="30" cy="45" rx="10" ry="2.5" fill="none" stroke={fg} strokeWidth="1.5" />

        {/* Letter E with Balanced Proportions */}
        <rect x="48" y="24" width="11" height="54" />
        <rect x="48" y="24" width="28" height="11" />
        <rect x="48" y="46" width="21" height="9" />
        <rect x="48" y="67" width="28" height="11" />

        {/* Sound Frequency Notch on E Top Arm */}
        <polygon points="76,24 80,24 76,29" />
      </g>
    </g>
  );

  // 3. CONCEPT 3: SOUNDWAVE & VINYL GEOMETRY (Refined Flow)
  const renderSoundwaveVinyl = () => (
    <g>
      {/* Concentric Vinyl Grooves behind Monogram */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={fg} strokeWidth="0.8" opacity="0.25" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={fg} strokeWidth="0.8" opacity="0.35" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={fg} strokeWidth="0.8" opacity="0.45" />

      {/* Radiating Audio Equalizer Frequency Bars (Left & Right) */}
      <g stroke={fg} strokeWidth="1.5" strokeLinecap="round" opacity="0.65">
        <line x1="6" y1="50" x2="16" y2="50" />
        <line x1="8" y1="44" x2="14" y2="44" />
        <line x1="7" y1="56" x2="15" y2="56" />
        <line x1="84" y1="50" x2="94" y2="50" />
        <line x1="86" y1="44" x2="92" y2="44" />
        <line x1="85" y1="56" x2="93" y2="56" />
      </g>

      {/* Circular-Conformant Monogram Structure */}
      <g fill={fg}>
        {/* L: Beveled to follow circle arc */}
        <path d="M 22 28 L 34 28 L 34 66 L 48 66 L 48 76 L 22 76 C 20 60, 20 40, 22 28 Z" />
        {/* E: Precision Chisel Spacing */}
        <path d="M 52 28 L 80 28 C 82 40, 82 60, 80 76 L 52 76 L 52 28 M 62 42 L 74 42 L 74 48 L 62 48 L 62 42 M 62 56 L 76 56 L 76 62 L 62 62 L 62 56" />
      </g>

      {/* Center Vinyl Spindle Hole */}
      <circle cx="50" cy="50" r="4" fill={bg} stroke={fg} strokeWidth="2" />
    </g>
  );

  // 4. CONCEPT 4: OPTICAL NEGATIVE SPACE STUDIO MIC (Already Upgraded)
  const renderMicNegative = () => (
    <g>
      {/* Outer Hexagonal Audio Shield */}
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke={fg} strokeWidth="2" />
      
      {/* Architectural Positive L & E Blocks with Optical Mic Corridor */}
      <g fill={fg}>
        {/* Left Letter L: Solid Spine and Foot */}
        <polygon points="20,22 38,22 38,36 34,38 34,50 38,54 38,66 46,66 46,76 20,76" />
        
        {/* Right Letter E: Outer Block sculpted to match Negative Mic Contour */}
        <polygon points="54,22 80,22 80,32 54,32" />
        <polygon points="58,44 76,44 76,52 58,52" />
        <polygon points="54,66 80,66 80,76 54,76" />
        <polygon points="54,22 54,36 58,38 58,50 54,54 54,76 48,76 48,66 52,64 52,34 48,32 48,22" />
      </g>

      {/* Optical Studio Condenser Mic Silhouette in Negative Space */}
      <rect x="40" y="24" width="12" height="18" rx="6" fill={bg} stroke={fg} strokeWidth="1.2" />
      <line x1="42" y1="29" x2="50" y2="29" stroke={fg} strokeWidth="1" />
      <line x1="41" y1="33" x2="51" y2="33" stroke={fg} strokeWidth="1" />
      <line x1="42" y1="37" x2="50" y2="37" stroke={fg} strokeWidth="1" />
      <circle cx="46" cy="33" r="2.2" fill={fg} />
      <rect x="42" y="42" width="8" height="14" fill={bg} stroke={fg} strokeWidth="1.2" />
      <line x1="46" y1="56" x2="46" y2="66" stroke={fg} strokeWidth="2" />
      <ellipse cx="46" cy="42" rx="7.5" ry="2.5" fill="none" stroke={fg} strokeWidth="1.4" />
      <ellipse cx="46" cy="66" rx="5" ry="1.8" fill={fg} />
    </g>
  );

  // 5. CONCEPT 5: RECORD LABEL ARCHIVAL SEAL (Refined Typography & Symbol)
  const renderLabelSeal = () => (
    <g>
      {/* Outer Knurled Edge */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={fg} strokeWidth="1" strokeDasharray="1 2" />
      <circle cx="50" cy="50" r="44" fill="none" stroke={fg} strokeWidth="2" />
      <circle cx="50" cy="50" r="33" fill="none" stroke={fg} strokeWidth="1" />

      {/* Circular Badge Labels */}
      <path id="seal-text-path-top" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill={fg} fontSize="4.8" fontFamily="'JetBrains Mono', monospace" fontWeight="800" letterSpacing="0.25em">
        <textPath href="#seal-text-path-top" startOffset="50%" textAnchor="middle">
          LYRICAL ENT · STUDIO LAB
        </textPath>
      </text>

      <path id="seal-text-path-bottom" d="M 82,50 A 32,32 0 0,1 18,50" fill="none" />
      <text fill={sub} fontSize="4.4" fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.3em">
        <textPath href="#seal-text-path-bottom" startOffset="50%" textAnchor="middle">
          CERTIFIED MASTER RECORDING
        </textPath>
      </text>

      {/* Center Shield Monogram (Refined) */}
      <g fill={fg}>
        <polygon points="38,36 50,36 50,42 45,42 45,58 52,58 52,64 38,64" />
        <polygon points="52,36 65,36 65,42 58,42 58,47 63,47 63,53 58,53 58,58 65,58 65,64 52,64" />
      </g>

      {/* Registration Stars */}
      <polygon points="17,50 18.5,47 20,50 18.5,53" fill={accent} />
      <polygon points="83,50 81.5,47 80,50 81.5,53" fill={accent} />
    </g>
  );

  // 6. CONCEPT 6: BESPOKE CHISELED WORDMARK (Sharper Geometric Cuts)
  const renderBespokeWordmark = () => (
    <g>
      {/* Decorative Precision Frame Hairline */}
      <line x1="5" y1="20" x2="95" y2="20" stroke={fg} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="5" y1="80" x2="95" y2="80" stroke={fg} strokeWidth="1" strokeOpacity="0.5" />

      {/* Center Custom Sculpted Monogram */}
      <g fill={fg}>
        {/* L: 45-degree architectural bevel */}
        <polygon points="20,24 36,24 36,64 54,64 54,76 20,76" />
        <polygon points="36,24 42,24 36,30" />
        {/* E: Aggressive high-contrast arms */}
        <polygon points="56,24 85,24 85,34 68,34 68,44 82,44 82,54 68,54 68,64 85,64 85,76 56,76" />
      </g>
    </g>
  );

  // 7. CONCEPT 7: ULTRA-MINIMAL MONOLINE MICRO-ICON
  const renderMonolineIcon = () => (
    <g stroke={fg} strokeWidth="6.5" strokeLinecap="square" strokeLinejoin="miter" fill="none">
      {/* Single continuous geometric stroke structure */}
      <path d="M 22 18 L 22 82 L 48 82" />
      <path d="M 48 18 L 48 82 L 78 82" />
      <line x1="48" y1="18" x2="78" y2="18" />
      <line x1="48" y1="50" x2="72" y2="50" />
    </g>
  );

  // Choose concept mark renderer
  const renderGlyph = () => {
    switch (conceptId) {
      case 'mic_integrated': return renderMicIntegrated();
      case 'soundwave_vinyl': return renderSoundwaveVinyl();
      case 'mic_negative': return renderMicNegative();
      case 'label_seal': return renderLabelSeal();
      case 'bespoke_wordmark': return renderBespokeWordmark();
      case 'monoline_icon': return renderMonolineIcon();
      case 'classic':
      default:
        return renderClassic();
    }
  };

  // VARIANT: MONOGRAM / MARK ONLY (1:1)
  if (variant === 'monogram' || variant === 'icon' || variant === 'seal' || variant === 'wordmark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none shrink-0 ${className}`}
        aria-label={`LYRICAL ENT ${conceptId} logo mark`}
      >
        {!transparent && <rect width="100" height="100" fill={bg} />}
        {renderGlyph()}
      </svg>
    );
  }

  // VARIANT: HORIZONTAL INLINE LOCKUP
  if (variant === 'horizontal') {
    const width = size * 3.6;
    const height = size;
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 280 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none shrink-0 ${className}`}
        aria-label={`LYRICAL ENT ${conceptId} horizontal logo`}
      >
        {!transparent && <rect width="100%" height="100%" fill={bg} />}
        
        {/* Scaled Mark on Left */}
        <g transform="translate(6, 6) scale(0.64)">
          {renderGlyph()}
        </g>

        {/* Brand Typographic Wordmark */}
        <text
          x="82"
          y="42"
          fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
          fontSize="24"
          fontWeight="800"
          letterSpacing="0.24em"
          fill={fg}
        >
          LYRICAL ENT
        </text>

        {showSubtext && (
          <text
            x="83"
            y="58"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.28em"
            fill={sub}
          >
            RECORD LABEL &amp; SOUND LAB
          </text>
        )}
      </svg>
    );
  }

  // VARIANT: PRIMARY STACKED (DEFAULT)
  const stackedHeight = showSubtext ? size * 0.95 : size * 0.75;
  return (
    <svg
      width={size}
      height={stackedHeight}
      viewBox={showSubtext ? "0 0 200 190" : "0 0 200 150"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label={`LYRICAL ENT ${conceptId} primary logo`}
    >
      {!transparent && <rect width="100%" height="100%" fill={bg} />}

      {/* Centered Mark */}
      <g transform="translate(56, 10) scale(0.88)">
        {renderGlyph()}
      </g>

      {/* Logotype */}
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        fontSize="19"
        fontWeight="800"
        letterSpacing="0.28em"
        fill={fg}
      >
        LYRICAL ENT
      </text>

      {/* Subline */}
      {showSubtext && (
        <>
          <line x1="35" y1="142" x2="165" y2="142" stroke={fg} strokeWidth="0.8" strokeOpacity="0.25" />
          <text
            x="100"
            y="158"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="7.5"
            fontWeight="600"
            letterSpacing="0.32em"
            fill={sub}
          >
            RECORD LABEL &amp; STUDIO
          </text>
        </>
      )}
    </svg>
  );
};

/**
 * Generate Raw SVG Code String for any Concept, Variant, and Theme
 */
/**
 * Serializes the pure vector SVG glyph for any of the 7 concepts
 */
export function getConceptGlyphSvg(
  conceptId: LogoConceptId,
  fg: string,
  bg: string,
  sub: string,
  accent: string
): string {
  switch (conceptId) {
    case 'mic_integrated':
      return `
      <circle cx="50" cy="50" r="44" fill="none" stroke="${fg}" stroke-width="1.8" stroke-dasharray="3 3" opacity="0.4" />
      <g fill="${fg}">
        <rect x="23" y="18" width="14" height="28" rx="7" />
        <line x1="25" y1="23" x2="35" y2="23" stroke="${bg}" stroke-width="1.5" />
        <line x1="25" y1="27" x2="35" y2="27" stroke="${bg}" stroke-width="1.5" />
        <line x1="25" y1="31" x2="35" y2="31" stroke="${bg}" stroke-width="1.5" />
        <line x1="25" y1="35" x2="35" y2="35" stroke="${bg}" stroke-width="1.5" />
        <rect x="24" y="44" width="12" height="34" />
        <rect x="24" y="68" width="26" height="10" />
        <ellipse cx="30" cy="45" rx="10" ry="2.5" fill="none" stroke="${fg}" stroke-width="1.5" />
        <rect x="48" y="24" width="11" height="54" />
        <rect x="48" y="24" width="28" height="11" />
        <rect x="48" y="46" width="21" height="9" />
        <rect x="48" y="67" width="28" height="11" />
        <polygon points="76,24 80,24 76,29" />
      </g>`;

    case 'soundwave_vinyl':
      return `
      <circle cx="50" cy="50" r="46" fill="none" stroke="${fg}" stroke-width="0.8" opacity="0.25" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="${fg}" stroke-width="0.8" opacity="0.35" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="${fg}" stroke-width="0.8" opacity="0.45" />
      <g stroke="${fg}" stroke-width="1.5" stroke-linecap="round" opacity="0.65">
        <line x1="6" y1="50" x2="16" y2="50" />
        <line x1="8" y1="44" x2="14" y2="44" />
        <line x1="7" y1="56" x2="15" y2="56" />
        <line x1="84" y1="50" x2="94" y2="50" />
        <line x1="86" y1="44" x2="92" y2="44" />
        <line x1="85" y1="56" x2="93" y2="56" />
      </g>
      <g fill="${fg}">
        <path d="M 22 28 L 34 28 L 34 66 L 48 66 L 48 76 L 22 76 C 20 60, 20 40, 22 28 Z" />
        <path d="M 52 28 L 80 28 C 82 40, 82 60, 80 76 L 52 76 L 52 28 M 62 42 L 74 42 L 74 48 L 62 48 L 62 42 M 62 56 L 76 56 L 76 62 L 62 62 L 62 56" />
      </g>
      <circle cx="50" cy="50" r="4" fill="${bg}" stroke="${fg}" stroke-width="2" />`;

    case 'mic_negative':
      return `
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke="${fg}" stroke-width="2" />
      <g fill="${fg}">
        <polygon points="20,22 38,22 38,36 34,38 34,50 38,54 38,66 46,66 46,76 20,76" />
        <polygon points="54,22 80,22 80,32 54,32" />
        <polygon points="58,44 76,44 76,52 58,52" />
        <polygon points="54,66 80,66 80,76 54,76" />
        <polygon points="54,22 54,36 58,38 58,50 54,54 54,76 48,76 48,66 52,64 52,34 48,32 48,22" />
      </g>
      <rect x="40" y="24" width="12" height="18" rx="6" fill="${bg}" stroke="${fg}" stroke-width="1.2" />
      <line x1="42" y1="29" x2="50" y2="29" stroke="${fg}" stroke-width="1" />
      <line x1="41" y1="33" x2="51" y2="33" stroke="${fg}" stroke-width="1" />
      <line x1="42" y1="37" x2="50" y2="37" stroke="${fg}" stroke-width="1" />
      <circle cx="46" cy="33" r="2.2" fill="${fg}" />
      <rect x="42" y="42" width="8" height="14" fill="${bg}" stroke="${fg}" stroke-width="1.2" />
      <line x1="46" y1="56" x2="46" y2="66" stroke="${fg}" stroke-width="2" />
      <ellipse cx="46" cy="42" rx="7.5" ry="2.5" fill="none" stroke="${fg}" stroke-width="1.4" />
      <ellipse cx="46" cy="66" rx="5" ry="1.8" fill="${fg}" />`;

    case 'label_seal':
      return `
      <circle cx="50" cy="50" r="48" fill="none" stroke="${fg}" stroke-width="1" stroke-dasharray="1 2" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="${fg}" stroke-width="2" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="${fg}" stroke-width="1" />
      <path id="seal-text-path-top" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill="${fg}" font-size="4.8" font-family="'JetBrains Mono', monospace" font-weight="800" letter-spacing="2" text-anchor="middle">
        <textPath href="#seal-text-path-top" startOffset="50%">LYRICAL ENT · STUDIO LAB</textPath>
      </text>
      <path id="seal-text-path-bottom" d="M 82,50 A 32,32 0 0,1 18,50" fill="none" />
      <text fill="${sub}" font-size="4.4" font-family="'JetBrains Mono', monospace" font-weight="700" letter-spacing="2" text-anchor="middle">
        <textPath href="#seal-text-path-bottom" startOffset="50%">CERTIFIED MASTER RECORDING</textPath>
      </text>
      <g fill="${fg}">
        <polygon points="38,36 50,36 50,42 45,42 45,58 52,58 52,64 38,64" />
        <polygon points="52,36 65,36 65,42 58,42 58,47 63,47 63,53 58,53 58,58 65,58 65,64 52,64" />
      </g>
      <polygon points="17,50 18.5,47 20,50 18.5,53" fill="${accent}" />
      <polygon points="83,50 81.5,47 80,50 81.5,53" fill="${accent}" />`;

    case 'bespoke_wordmark':
      return `
      <line x1="5" y1="20" x2="95" y2="20" stroke="${fg}" stroke-width="1" stroke-opacity="0.5" />
      <line x1="5" y1="80" x2="95" y2="80" stroke="${fg}" stroke-width="1" stroke-opacity="0.5" />
      <g fill="${fg}">
        <polygon points="20,24 36,24 36,64 54,64 54,76 20,76" />
        <polygon points="36,24 42,24 36,30" />
        <polygon points="56,24 85,24 85,34 68,34 68,44 82,44 82,54 68,54 68,64 85,64 85,76 56,76" />
      </g>`;

    case 'monoline_icon':
      return `
      <g stroke="${fg}" stroke-width="6.5" stroke-linecap="square" stroke-linejoin="miter" fill="none">
        <path d="M 22 18 L 22 82 L 48 82" />
        <path d="M 48 18 L 48 82 L 78 82" />
        <line x1="48" y1="18" x2="78" y2="18" />
        <line x1="48" y1="50" x2="72" y2="50" />
      </g>`;

    case 'classic':
    default:
      return `
      <rect x="12" y="12" width="76" height="76" fill="none" stroke="${fg}" stroke-width="3" />
      <g fill="${fg}">
        <polygon points="22,22 36,22 36,66 52,66 52,78 22,78" />
        <polygon points="44,22 78,22 78,34 58,34 58,44 74,44 74,54 58,54 58,66 78,66 78,78 44,78" />
        <polygon points="22,22 28,22 22,28" fill="${bg}" />
        <polygon points="78,78 72,78 78,72" fill="${bg}" />
      </g>`;
  }
}

/**
 * Generate Raw SVG Code String for any Concept, Variant, and Theme
 */
export function getConceptSvgString(
  conceptId: LogoConceptId = 'classic',
  variant: LogoVariant = 'primary',
  theme: LogoColorTheme = 'monochrome-white',
  transparent: boolean = true,
  showSubtext: boolean = true
): string {
  const { fg, bg, sub, accent } = getThemeColors(theme);
  const bgRect = transparent ? '' : `<rect width="100%" height="100%" fill="${bg}" />`;
  const glyph = getConceptGlyphSvg(conceptId, fg, bg, sub, accent);

  // We serialize the exact vector definition
  if (variant === 'monogram' || variant === 'icon' || variant === 'seal' || variant === 'wordmark') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="800" height="800" fill="none">
  ${bgRect}
  <!-- LYRICAL ENT ${conceptId.toUpperCase()} -->
  ${glyph}
</svg>`;
  }

  if (variant === 'horizontal') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 76" width="1120" height="304" fill="none">
  ${bgRect}
  <g transform="translate(6, 6) scale(0.64)">
    ${glyph}
  </g>
  <text x="82" y="42" font-family="'Plus Jakarta Sans', sans-serif" font-size="24" font-weight="800" letter-spacing="6" fill="${fg}">LYRICAL ENT</text>
  ${showSubtext ? `<text x="83" y="58" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="3" fill="${sub}">RECORD LABEL &amp; SOUND LAB</text>` : ''}
</svg>`;
  }

  // Default Primary Stacked
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190" width="800" height="760" fill="none">
  ${bgRect}
  <g transform="translate(56, 10) scale(0.88)">
    ${glyph}
  </g>
  <text x="100" y="126" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="19" font-weight="800" letter-spacing="5.5" fill="${fg}">LYRICAL ENT</text>
  ${showSubtext ? `
  <line x1="35" y1="142" x2="165" y2="142" stroke="${fg}" stroke-width="0.8" stroke-opacity="0.25" />
  <text x="100" y="158" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="600" letter-spacing="2.5" fill="${sub}">RECORD LABEL &amp; STUDIO</text>
  ` : ''}
</svg>`;
}

/**
 * Real client-side file download for Vector SVG
 */
export function downloadConceptSvg(
  conceptId: LogoConceptId,
  variant: LogoVariant = 'primary',
  theme: LogoColorTheme = 'monochrome-white',
  transparent: boolean = true
) {
  const svg = getConceptSvgString(conceptId, variant, theme, transparent);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lyrical_ent_${conceptId}_${variant}_${theme}${transparent ? '_transparent' : ''}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Real client-side 300 DPI PNG raster download
 */
export function downloadConceptPng(
  conceptId: LogoConceptId,
  variant: LogoVariant = 'primary',
  theme: LogoColorTheme = 'monochrome-white',
  transparent: boolean = true,
  targetWidth: number = 1600
) {
  const svg = getConceptSvgString(conceptId, variant, theme, transparent);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const aspect = img.width / img.height;
    canvas.width = targetWidth;
    canvas.height = Math.round(targetWidth / aspect);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (!transparent) {
        ctx.fillStyle = theme === 'monochrome-black' ? '#FFFFFF' : '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `lyrical_ent_${conceptId}_${variant}_${theme}_${canvas.width}x${canvas.height}.png`;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
    }
    URL.revokeObjectURL(url);
  };

  img.src = url;
}
