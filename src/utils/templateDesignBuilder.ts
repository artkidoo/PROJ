/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Category Template to CanvasDesign Converter
 * Builds 8 genuinely distinct visual composition archetypes with specific line art, logo concepts, and layout logic
 */

import { CreativeTemplate } from '../data/creativeTemplatesData';
import { CanvasDesign, CanvasElement } from '../types/designStudio';

export function buildHonestDesignForTemplate(t: CreativeTemplate): CanvasDesign {
  const isDark = t.bgTheme !== 'cream' && t.bgTheme !== 'silver';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#A3A3A3' : '#444444';
  const accentColor = t.accentColor || (isDark ? '#F3E8C4' : '#171717');
  const bg = t.bgTheme === 'pitch' ? '#000000' :
             t.bgTheme === 'charcoal' ? '#121212' :
             t.bgTheme === 'cream' ? '#F7F7F2' :
             t.bgTheme === 'silver' ? '#E5E5E5' : '#080808';

  const width = t.aspectRatio === '9:16 Vertical Story' ? 1080 :
                t.aspectRatio === '16:9 Landscape' ? 1920 :
                t.aspectRatio === '4:5 Portrait' ? 1080 :
                t.aspectRatio === 'Print / Poster' ? 1414 : 1200;

  const height = t.aspectRatio === '9:16 Vertical Story' ? 1920 :
                 t.aspectRatio === '16:9 Landscape' ? 1080 :
                 t.aspectRatio === '4:5 Portrait' ? 1350 :
                 t.aspectRatio === 'Print / Poster' ? 2000 : 1200;

  const elements: CanvasElement[] = [];

  // =========================================================================
  // 8 DISTINCT STRUCTURAL LAYOUT ARCHETYPES
  // =========================================================================

  if (t.style === 'Cinematic' || t.style === 'Spotlight') {
    // -----------------------------------------------------------------------
    // A. CINEMATIC POSTER
    // Full cinematic image treatment, dramatic contrast, film typography
    // -----------------------------------------------------------------------
    elements.push(
      {
        id: `el-img-${t.id}`,
        type: 'image',
        name: 'Cinematic Visual Treatment',
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
        name: 'Archival Label Seal',
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
        y: 74,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 52,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 4,
        color: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Production Credits Billing',
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

  } else if (t.style === 'Editorial' || t.style === 'High Fashion') {
    // -----------------------------------------------------------------------
    // B. EDITORIAL / MAGAZINE
    // Structured magazine grid, oversized masthead, asymmetric portrait image
    // -----------------------------------------------------------------------
    elements.push(
      {
        id: `el-masthead-${t.id}`,
        type: 'text',
        name: 'Magazine Masthead',
        x: 50,
        y: 12,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        visible: true,
        text: 'MONOCHROME EDITORIAL',
        fontFamily: 'serif',
        fontSize: 58,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 6,
        color: textColor
      },
      {
        id: `el-img-${t.id}`,
        type: 'image',
        name: 'Editorial Asymmetric Portrait',
        x: 65,
        y: 52,
        width: 58,
        height: 72,
        rotation: 0,
        opacity: 0.92,
        zIndex: 2,
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
        y: 52,
        width: 90,
        height: 88,
        rotation: 0,
        opacity: 0.6,
        zIndex: 3,
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
        zIndex: 4,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Editorial Asymmetrical Title',
        x: 28,
        y: 42,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
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
        name: 'Story Teaser & Issue Code',
        x: 28,
        y: 60,
        rotation: 0,
        opacity: 0.85,
        zIndex: 6,
        visible: true,
        text: `${t.artistName.toUpperCase()}\nVOL. 04 / ISSUE 12 · ${t.subtext}`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'left',
        letterSpacing: 3,
        color: subtextColor
      }
    );

  } else if (t.style === 'Minimalist') {
    // -----------------------------------------------------------------------
    // C. MINIMAL LUXURY
    // Restrained palette, orbital celestial rings, generous negative space
    // -----------------------------------------------------------------------
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
        y: 42,
        width: 46,
        height: 46,
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
        name: 'Luxury Serif Headline',
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
        letterSpacing: 6,
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

  } else if (t.style === 'Underground' || t.style === 'Urban Street' || t.style === 'Brutalist') {
    // -----------------------------------------------------------------------
    // D. STREET / UNDERGROUND
    // Bold kinetic display type, city skyline, vinyl record disc, retail barcode
    // -----------------------------------------------------------------------
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

  } else if (t.style === 'Typographic') {
    // -----------------------------------------------------------------------
    // E. TYPOGRAPHY-LED
    // Typography is the hero visual element, giant display scale, minimal graphics
    // -----------------------------------------------------------------------
    elements.push(
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Hero Display Title',
        x: 50,
        y: 44,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        visible: true,
        text: t.headline.toUpperCase(),
        fontFamily: 'display',
        fontSize: 72,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-divider-${t.id}`,
        type: 'shape',
        name: 'Horizontal Rule Accent',
        shapeType: 'rectangle',
        x: 50,
        y: 62,
        width: 60,
        height: 1,
        rotation: 0,
        opacity: 0.8,
        zIndex: 2,
        visible: true,
        fillColor: accentColor
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Label Seal Header',
        logoConceptId: 'label_seal',
        logoVariant: 'seal',
        logoTheme: isDark ? 'white' : 'black',
        x: 18,
        y: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true
      },
      {
        id: `el-artist-${t.id}`,
        type: 'text',
        name: 'Artist Credit Block',
        x: 50,
        y: 72,
        rotation: 0,
        opacity: 0.95,
        zIndex: 4,
        visible: true,
        text: t.artistName.toUpperCase(),
        fontFamily: 'mono',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 4,
        color: accentColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Bottom Metadata Line',
        x: 50,
        y: 84,
        rotation: 0,
        opacity: 0.75,
        zIndex: 5,
        visible: true,
        text: `KEEDOHUB AUDIO LABS · ${t.tagline.toUpperCase()}`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 3,
        color: subtextColor
      }
    );

  } else if (t.style === 'Documentary' || t.style === 'Grainy Film') {
    // -----------------------------------------------------------------------
    // F. PHOTOGRAPHY-LED
    // Photography dominates canvas with grainy aperture framing & lower scrim
    // -----------------------------------------------------------------------
    elements.push(
      {
        id: `el-img-${t.id}`,
        type: 'image',
        name: 'Dominant Photography Asset',
        x: 50,
        y: 42,
        width: 92,
        height: 70,
        rotation: 0,
        opacity: 0.92,
        zIndex: 1,
        visible: true,
        src: t.imageUrl || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
        filter: t.style === 'Grainy Film' ? 'noir' : 'contrast',
        objectFit: 'cover'
      },
      {
        id: `el-scrim-${t.id}`,
        type: 'shape',
        name: 'Bottom Gradient Scrim Bar',
        shapeType: 'rectangle',
        x: 50,
        y: 82,
        width: 92,
        height: 20,
        rotation: 0,
        opacity: 0.9,
        zIndex: 2,
        visible: true,
        fillColor: '#000000'
      },
      {
        id: `el-aperture-${t.id}`,
        type: 'illustration',
        name: 'Aperture Lens Frame',
        illustrationId: 'edit_aperture_ring',
        x: 85,
        y: 18,
        width: 24,
        height: 24,
        rotation: 0,
        opacity: 0.8,
        zIndex: 3,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 1.8
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Photographic Caption Headline',
        x: 50,
        y: 78,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'serif',
        fontSize: 38,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FFFFFF'
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Documentary Metadata',
        x: 50,
        y: 88,
        rotation: 0,
        opacity: 0.85,
        zIndex: 5,
        visible: true,
        text: `${t.artistName.toUpperCase()} · 35MM FILM ARCHIVE`,
        fontFamily: 'mono',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 2,
        color: '#D4D4D4'
      }
    );

  } else if (t.style === 'Clean Commercial' || t.category === 'Business Promotion' || t.category === 'Company Announcements') {
    // -----------------------------------------------------------------------
    // G. CORPORATE / BRAND
    // Clear information grid, structured hierarchy, consistent logo lockups
    // -----------------------------------------------------------------------
    elements.push(
      {
        id: `el-header-box-${t.id}`,
        type: 'shape',
        name: 'Header Banner Container',
        shapeType: 'rectangle',
        x: 50,
        y: 12,
        width: 90,
        height: 12,
        rotation: 0,
        opacity: 0.15,
        zIndex: 1,
        visible: true,
        fillColor: textColor
      },
      {
        id: `el-logo-${t.id}`,
        type: 'logo',
        name: 'Corporate Horizontal Logo',
        logoConceptId: 'classic',
        logoVariant: 'horizontal',
        logoTheme: isDark ? 'white' : 'black',
        x: 24,
        y: 12,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        visible: true
      },
      {
        id: `el-badge-${t.id}`,
        type: 'text',
        name: 'Status Announcement Badge',
        x: 80,
        y: 12,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true,
        text: t.badgeText || 'OFFICIAL ANNOUNCEMENT',
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'right',
        color: accentColor
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Corporate Headline',
        x: 50,
        y: 36,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        visible: true,
        text: t.headline,
        fontFamily: 'sans',
        fontSize: 44,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 1,
        color: textColor
      },
      {
        id: `el-divider-${t.id}`,
        type: 'shape',
        name: 'Corporate Divider Rule',
        shapeType: 'rectangle',
        x: 50,
        y: 52,
        width: 80,
        height: 2,
        rotation: 0,
        opacity: 0.3,
        zIndex: 5,
        visible: true,
        fillColor: textColor
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Corporate Body Subtext',
        x: 50,
        y: 68,
        rotation: 0,
        opacity: 0.85,
        zIndex: 6,
        visible: true,
        text: `${t.subtext}\n\nKEEDOHUB CORPORATE ATELIER · ${t.tagline.toUpperCase()}`,
        fontFamily: 'sans',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.5,
        color: subtextColor
      }
    );

  } else if (t.style === 'Experimental' || t.style === 'Collage') {
    // -----------------------------------------------------------------------
    // H. GEOMETRIC / EXPERIMENTAL
    // Rotated shape frames, asymmetric collage structure, cyber grid
    // -----------------------------------------------------------------------
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
        id: `el-rot-frame-${t.id}`,
        type: 'shape',
        name: 'Rotated Geometric Accent Frame',
        shapeType: 'frame',
        borderColor: accentColor,
        borderWidth: 2,
        x: 62,
        y: 45,
        width: 50,
        height: 50,
        rotation: 12,
        opacity: 0.7,
        zIndex: 2,
        visible: true
      },
      {
        id: `el-title-${t.id}`,
        type: 'text',
        name: 'Experimental Headline',
        x: 42,
        y: 36,
        rotation: -3,
        opacity: 1,
        zIndex: 3,
        visible: true,
        text: t.headline.toUpperCase(),
        fontFamily: 'display',
        fontSize: 54,
        fontWeight: '900',
        textAlign: 'left',
        letterSpacing: 2,
        color: textColor
      },
      {
        id: `el-waveform-${t.id}`,
        type: 'illustration',
        name: 'Distorted Soundwave',
        illustrationId: 'distorted_waveform',
        x: 50,
        y: 65,
        width: 75,
        height: 20,
        rotation: 0,
        opacity: 0.85,
        zIndex: 4,
        visible: true,
        strokeColor: accentColor,
        strokeWidth: 2
      },
      {
        id: `el-sub-${t.id}`,
        type: 'text',
        name: 'Experimental Subtext',
        x: 50,
        y: 84,
        rotation: 0,
        opacity: 0.8,
        zIndex: 5,
        visible: true,
        text: `${t.artistName.toUpperCase()} // ${t.subtext}`,
        fontFamily: 'mono',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        color: subtextColor
      }
    );

  } else {
    // -----------------------------------------------------------------------
    // DEFAULT RECORD LABEL STUDIO ARCHETYPE
    // Condenser mic, acoustic soundwave, clean architectural framing
    // -----------------------------------------------------------------------
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
