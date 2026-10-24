/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Category Template to CanvasDesign Converter
 * Builds genuinely distinct visual compositions with specific line art, logo concepts, and layout logic
 */

import { CreativeTemplate } from '../data/creativeTemplatesData';
import { CanvasDesign, CanvasElement } from '../types/designStudio';

export function buildHonestDesignForTemplate(t: CreativeTemplate): CanvasDesign {
  const isDark = t.bgTheme !== 'cream';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#A3A3A3' : '#444444';
  const accentColor = t.accentColor || (isDark ? '#F3E8C4' : '#171717');
  const bg = t.bgTheme === 'pitch' ? '#000000' :
             t.bgTheme === 'charcoal' ? '#121212' :
             t.bgTheme === 'cream' ? '#F7F7F2' : '#080808';

  const width = t.aspectRatio === '9:16 Vertical Story' ? 1080 :
                t.aspectRatio === '16:9 Landscape' ? 1920 :
                t.aspectRatio === '4:5 Portrait' ? 1080 :
                t.aspectRatio === 'Print / Poster' ? 1414 : 1200;

  const height = t.aspectRatio === '9:16 Vertical Story' ? 1920 :
                 t.aspectRatio === '16:9 Landscape' ? 1080 :
                 t.aspectRatio === '4:5 Portrait' ? 1350 :
                 t.aspectRatio === 'Print / Poster' ? 2000 : 1200;

  const elements: CanvasElement[] = [];

  // COMPOSITION ARCHITECTURE BY STYLE
  if (t.style === 'Cinematic' || t.style === 'Spotlight') {
    // 1. CINEMATIC: Background photo-led with spotlights and film typography
    elements.push(
      {
        id: `el-img-${t.id}`,
        type: 'image',
        name: 'Cinematic Visual',
        x: 50,
        y: 48,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 0.65,
        zIndex: 1,
        visible: true,
        src: t.imageUrl || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
        filter: 'noir',
        objectFit: 'cover'
      },
      {
        id: `el-spotlight-${t.id}`,
        type: 'illustration',
        name: 'Concert Spotlight Beam',
        illustrationId: 'stage_spotlight',
        x: 25,
        y: 25,
        width: 38,
        height: 38,
        rotation: 0,
        opacity: 0.8,
        zIndex: 2,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Label Seal',
        logoConceptId: 'label_seal',
        logoVariant: 'seal',
        logoTheme: isDark ? 'white' : 'black',
        x: 82,
        y: 16,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Film Title Headline',
        x: 50,
        y: 76,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Production Credits',
        x: 50,
        y: 86,
        rotation: 0,
        opacity: 0.85,
        zIndex: 5,
        visible: true,
        text: `${t.artistName.toUpperCase()} · ${t.tagline.toUpperCase()}`,
        fontFamily: 'mono',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 3,
        color: subtextColor
      }
    );
  } else if (t.style === 'Underground' || t.style === 'Urban Street') {
    // 2. UNDERGROUND & URBAN: City skyline, vinyl grooves, cassette tape, equalizer
    elements.push(
      {
        id: `el-skyline-${t.id}`,
        type: 'illustration',
        name: 'Metropolis Skyline',
        illustrationId: 'urban_city_skyline',
        x: 50,
        y: 72,
        width: 85,
        height: 40,
        rotation: 0,
        opacity: 0.35,
        zIndex: 1,
        visible: true,
        strokeColor: isDark ? '#FFFFFF' : '#000000',
        strokeWidth: 2,
        isFilled: true
      },
      {
        id: `el-vinyl-${t.id}`,
        type: 'illustration',
        name: 'Vinyl LP Record',
        illustrationId: 'vinyl_record',
        x: 50,
        y: 40,
        width: 44,
        height: 44,
        rotation: 0,
        opacity: 0.9,
        zIndex: 2,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-barcode-${t.id}`,
        type: 'illustration',
        name: 'Retail Barcode',
        illustrationId: 'urban_barcode_stamp',
        x: 82,
        y: 84,
        width: 24,
        height: 18,
        rotation: 0,
        opacity: 0.8,
        zIndex: 3,
        visible: true,
        strokeColor: textColor,
        isFilled: true
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Mic Integrated Monogram',
        logoConceptId: 'mic_integrated',
        logoVariant: 'monogram',
        logoTheme: isDark ? 'white' : 'black',
        x: 18,
        y: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Underground Heavy Type',
        x: 50,
        y: 28,
        rotation: -2,
        opacity: 1,
        zIndex: 5,
        visible: true,
        text: t.headline,
        fontFamily: 'display',
        fontSize: 52,
        fontWeight: '900',
        textAlign: 'center',
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Catalog Code',
        x: 45,
        y: 86,
        rotation: 0,
        opacity: 0.9,
        zIndex: 6,
        visible: true,
        text: `LE-REC-${t.artistName.slice(0, 4).toUpperCase()} // ${t.subtext}`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'left',
        color: subtextColor
      }
    );
  } else if (t.style === 'Minimalist' || t.style === 'High Fashion') {
    // 3. MINIMAL LUXURY & HIGH FASHION: Celestial rings, starlight sparkles, generous negative space
    elements.push(
      {
        id: `el-frame-${t.id}`,
        type: 'shape',
        name: 'Double Keyline Frame',
        shapeType: 'frame',
        borderColor: isDark ? '#FFFFFF' : '#000000',
        borderWidth: 1.5,
        x: 50,
        y: 50,
        width: 88,
        height: 88,
        rotation: 0,
        opacity: 0.7,
        zIndex: 1,
        visible: true
      },
      {
        id: `el-rings-${t.id}`,
        type: 'illustration',
        name: 'Celestial Orbital Rings',
        illustrationId: 'edit_celestial_rings',
        x: 50,
        y: 44,
        width: 48,
        height: 48,
        rotation: 0,
        opacity: 0.85,
        zIndex: 2,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 1.5
      },
      {
        id: `el-sparkle-${t.id}`,
        type: 'illustration',
        name: 'Starlight Sparkles',
        illustrationId: 'edit_starlight_sparkle',
        x: 78,
        y: 24,
        width: 22,
        height: 22,
        rotation: 0,
        opacity: 0.9,
        zIndex: 3,
        visible: true,
        strokeColor: textColor,
        isFilled: true
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Monoline Icon',
        logoConceptId: 'monoline_icon',
        logoVariant: 'icon',
        logoTheme: isDark ? 'white' : 'black',
        x: 50,
        y: 16,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Editorial Serif Headline',
        x: 50,
        y: 74,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 38,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 4,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Minimal Monospace Tagline',
        x: 50,
        y: 84,
        rotation: 0,
        opacity: 0.7,
        zIndex: 6,
        visible: true,
        text: `${t.artistName.toUpperCase()} — EST. 2024`,
        fontFamily: 'mono',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 4,
        color: subtextColor
      }
    );
  } else if (t.category === 'Holiday and Celebration Designs' || t.title.toLowerCase().includes('birthday') || t.title.toLowerCase().includes('celebration')) {
    // 4. CELEBRATION: Toaster flutes, gift box, or firework burst
    elements.push(
      {
        id: `el-flutes-${t.id}`,
        type: 'illustration',
        name: 'Toasting Champagne Flutes',
        illustrationId: 'celeb_champagne_flutes',
        x: 50,
        y: 42,
        width: 42,
        height: 42,
        rotation: 0,
        opacity: 0.95,
        zIndex: 1,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-confetti-${t.id}`,
        type: 'illustration',
        name: 'Confetti Streamers',
        illustrationId: 'celeb_confetti_streamers',
        x: 76,
        y: 22,
        width: 28,
        height: 28,
        rotation: 0,
        opacity: 0.8,
        zIndex: 2,
        visible: true,
        strokeColor: textColor,
        isFilled: true
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Label Monogram',
        logoConceptId: 'classic',
        logoVariant: 'monogram',
        logoTheme: isDark ? 'white' : 'black',
        x: 50,
        y: 16,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Celebration Headline',
        x: 50,
        y: 72,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 44,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Celebration Subtext',
        x: 50,
        y: 84,
        rotation: 0,
        opacity: 0.85,
        zIndex: 5,
        visible: true,
        text: t.subtext,
        fontFamily: 'mono',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 1,
        color: subtextColor
      }
    );
  } else if (t.style === 'Concert Poster' || t.category === 'Event Promotion') {
    // 5. CONCERT & TOUR: Audience crowd silhouette, VIP ticket stub, dual spotlights
    elements.push(
      {
        id: `el-crowd-${t.id}`,
        type: 'illustration',
        name: 'Audience Crowd Silhouette',
        illustrationId: 'perf_concert_crowd',
        x: 50,
        y: 84,
        width: 95,
        height: 30,
        rotation: 0,
        opacity: 0.75,
        zIndex: 1,
        visible: true,
        strokeColor: textColor,
        isFilled: true
      },
      {
        id: `el-singer-${t.id}`,
        type: 'illustration',
        name: 'Stage Vocalist',
        illustrationId: 'perf_singer_silhouette',
        x: 50,
        y: 52,
        width: 38,
        height: 38,
        rotation: 0,
        opacity: 0.9,
        zIndex: 2,
        visible: true,
        strokeColor: accentColor,
        isFilled: true
      },
      {
        id: `el-ticket-${t.id}`,
        type: 'illustration',
        name: 'Tour Ticket Stub',
        illustrationId: 'perf_tour_ticket',
        x: 80,
        y: 22,
        width: 32,
        height: 20,
        rotation: 5,
        opacity: 0.85,
        zIndex: 3,
        visible: true,
        strokeColor: textColor
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Bespoke Wordmark',
        logoConceptId: 'bespoke_wordmark',
        logoVariant: 'horizontal',
        logoTheme: isDark ? 'white' : 'black',
        x: 32,
        y: 16,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Tour Event Title',
        x: 50,
        y: 30,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        visible: true,
        text: t.headline,
        fontFamily: 'display',
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center',
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Tour Venue Dates',
        x: 50,
        y: 72,
        rotation: 0,
        opacity: 0.9,
        zIndex: 6,
        visible: true,
        text: `${t.artistName.toUpperCase()} // LIVE ON STAGE // ALL ACCESS`,
        fontFamily: 'mono',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        color: accentColor
      }
    );
  } else if (t.style === 'Editorial' || t.category === 'Press and Media') {
    // 6. EDITORIAL & HIGH FASHION: Photography-led, asymmetric serif typography, corner brackets, technical metadata
    elements.push(
      {
        id: `el-img-${t.id}`,
        type: 'image',
        name: 'Editorial Portrait',
        x: 65,
        y: 50,
        width: 58,
        height: 82,
        rotation: 0,
        opacity: 0.9,
        zIndex: 1,
        visible: true,
        src: t.imageUrl || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
        filter: 'grayscale',
        objectFit: 'cover'
      },
      {
        id: `el-brackets-${t.id}`,
        type: 'illustration',
        name: 'Corner Framing Brackets',
        illustrationId: 'edit_corner_brackets',
        x: 50,
        y: 50,
        width: 92,
        height: 92,
        rotation: 0,
        opacity: 0.6,
        zIndex: 2,
        visible: true,
        strokeColor: textColor,
        strokeWidth: 1.5
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Architectural Monogram',
        logoConceptId: 'classic',
        logoVariant: 'monogram',
        logoTheme: isDark ? 'white' : 'black',
        x: 18,
        y: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Editorial Asymmetrical Title',
        x: 28,
        y: 44,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 42,
        fontWeight: '700',
        textAlign: 'left',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Artist Identity Tag',
        x: 28,
        y: 60,
        rotation: 0,
        opacity: 0.85,
        zIndex: 5,
        visible: true,
        text: `${t.artistName.toUpperCase()}\nVOL. 04 / ISSUE 12`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 3,
        color: subtextColor
      }
    );
  } else if (t.style === 'Brutalist' || t.style === 'Experimental') {
    // 7. BRUTALIST & EXPERIMENTAL: Typography-led, heavy display type, cyber grid, barcode, hazard lines
    elements.push(
      {
        id: `el-grid-${t.id}`,
        type: 'illustration',
        name: 'Cyber Wireframe Grid',
        illustrationId: 'cyber_wireframe_grid',
        x: 50,
        y: 50,
        width: 90,
        height: 90,
        rotation: 0,
        opacity: 0.4,
        zIndex: 1,
        visible: true,
        strokeColor: textColor,
        strokeWidth: 1.5
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Overpowering Brutalist Headline',
        x: 50,
        y: 38,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        visible: true,
        text: t.headline.toUpperCase(),
        fontFamily: 'display',
        fontSize: 58,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 1,
        color: textColor
      },
      {
        id: `el-distort-${t.id}`,
        type: 'illustration',
        name: 'Distorted Soundwave',
        illustrationId: 'distorted_waveform',
        x: 50,
        y: 62,
        width: 75,
        height: 22,
        rotation: 0,
        opacity: 0.85,
        zIndex: 3,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Optical Negative Mic Monogram',
        logoConceptId: 'mic_negative',
        logoVariant: 'monogram',
        logoTheme: isDark ? 'white' : 'black',
        x: 18,
        y: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true
      },
      {
        id: `el-barcode-${t.id}`,
        type: 'illustration',
        name: 'Industrial Barcode Stamp',
        illustrationId: 'urban_barcode_stamp',
        x: 80,
        y: 84,
        width: 26,
        height: 18,
        rotation: 0,
        opacity: 0.9,
        zIndex: 5,
        visible: true,
        strokeColor: textColor,
        isFilled: true
      }
    );
  } else if (t.category === 'Music Promotion' || t.title.toLowerCase().includes('vinyl') || t.title.toLowerCase().includes('album')) {
    // 8. RECORD LABEL HERITAGE: Illustration-led with vinyl LP, turntable tonearm, circular seal
    elements.push(
      {
        id: `el-vinyl-${t.id}`,
        type: 'illustration',
        name: 'Vinyl LP Record',
        illustrationId: 'vinyl_record',
        x: 50,
        y: 44,
        width: 60,
        height: 60,
        rotation: 0,
        opacity: 0.9,
        zIndex: 1,
        visible: true,
        strokeColor: isDark ? '#FFFFFF' : '#000000',
        strokeWidth: 2
      },
      {
        id: `el-seal-${t.id}`,
        type: 'logo',
        name: 'Record Label Archival Seal',
        logoConceptId: 'label_seal',
        logoVariant: 'seal',
        logoTheme: isDark ? 'white' : 'black',
        x: 50,
        y: 44,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Album Title',
        x: 50,
        y: 80,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 38,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 3,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Catalog Specification',
        x: 50,
        y: 90,
        rotation: 0,
        opacity: 0.8,
        zIndex: 4,
        visible: true,
        text: `${t.artistName.toUpperCase()} — 33⅓ RPM STEREO MASTER`,
        fontFamily: 'mono',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 3,
        color: subtextColor
      }
    );
  } else {
    // 9. DEFAULT RECORD LABEL STUDIO: Studio condenser mic, acoustic soundwave, and clean framing
    elements.push(
      {
        id: `el-frame-${t.id}`,
        type: 'shape',
        name: 'Architectural Frame',
        shapeType: 'frame',
        borderColor: isDark ? '#FFFFFF' : '#000000',
        borderWidth: 2,
        x: 50,
        y: 50,
        width: 90,
        height: 90,
        rotation: 0,
        opacity: 0.85,
        zIndex: 1,
        visible: true
      },
      {
        id: `el-mic-${t.id}`,
        type: 'illustration',
        name: 'Studio Condenser Mic',
        illustrationId: 'mic_studio_condenser',
        x: 50,
        y: 42,
        width: 36,
        height: 36,
        rotation: 0,
        opacity: 0.95,
        zIndex: 2,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-wave-${t.id}`,
        type: 'illustration',
        name: 'Audio Soundwave',
        illustrationId: 'audio_waveform',
        x: 50,
        y: 64,
        width: 65,
        height: 16,
        rotation: 0,
        opacity: 0.7,
        zIndex: 3,
        visible: true,
        strokeColor: isDark ? '#FFFFFF' : '#000000',
        strokeWidth: 1.8
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Soundwave Vinyl Seal',
        logoConceptId: 'soundwave_vinyl',
        logoVariant: 'monogram',
        logoTheme: isDark ? 'white' : 'black',
        x: 50,
        y: 15,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Master Headline',
        x: 50,
        y: 28,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        visible: true,
        text: t.headline,
        fontFamily: t.fontFamily || 'serif',
        fontSize: 42,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Artist Tagline',
        x: 50,
        y: 80,
        rotation: 0,
        opacity: 0.8,
        zIndex: 6,
        visible: true,
        text: `${t.artistName.toUpperCase()} — ${t.tagline.toUpperCase()}`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 2,
        color: subtextColor
      }
    );
  }

  return {
    id: `des-${t.id}-${Date.now()}`,
    name: t.title,
    aspectRatio: t.aspectRatio,
    width,
    height,
    backgroundColor: bg,
    backgroundTheme: t.bgTheme || 'black',
    category: t.category,
    templateFamily: t.style,
    textureOverlay: t.style === 'Cinematic' ? 'vignette' : 'none',
    textureOpacity: 0.35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements
  };
}
