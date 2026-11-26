import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { Workspace, ClientProfile } from '../types';
import type {
  CreativeProductionItem,
  CreativeStarterParams,
  CreativeStudioToolId,
  MultiFormatPreset,
  ProductionDesignState,
  ProductionLifecycleStatus,
  ProductionVariation,
  StudioToolCategory,
  StudioToolDefinition,
} from '../types/creativeProduction';

export interface ProductionSnapshot {
  id: string;
  label: string;
  createdAt: string;
  currentFormat: string;
  designState: ProductionDesignState;
}

export const MULTI_FORMAT_PRESETS: MultiFormatPreset[] = [
  {
    id: '1:1-square',
    label: '1:1 Square (1080 × 1080)',
    platform: 'Instagram / DSPs',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    notes: 'Standard social post, single cover preview, and profile artwork.',
    targetAudience: 'Shared',
  },
  {
    id: '1:1-master-cover',
    label: '1:1 Master DSP Cover (3000 × 3000)',
    platform: 'Spotify / Apple / Tidal',
    width: 3000,
    height: 3000,
    aspectRatio: '1:1',
    notes: 'Full-resolution master release cover meeting all streaming distributor specifications.',
    targetAudience: 'Artist',
  },
  {
    id: '9:16-vertical-story',
    label: '9:16 Story & Spotify Canvas (1080 × 1920)',
    platform: 'Spotify Canvas / Instagram Story / TikTok',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    notes: 'Vertical format with center safe zone avoiding playback controls and device notches.',
    targetAudience: 'Shared',
  },
  {
    id: '4:5-portrait',
    label: '4:5 Portrait Feed (1080 × 1350)',
    platform: 'Instagram Feed / Facebook',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    notes: 'Maximum viewport real estate on mobile feeds without cropping.',
    targetAudience: 'Shared',
  },
  {
    id: '16:9-landscape',
    label: '16:9 Landscape Banner (1920 × 1080)',
    platform: 'YouTube / Website / X Header',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    notes: 'High-definition widescreen for desktop hero headers, video thumbnails and banners.',
    targetAudience: 'Shared',
  },
  {
    id: 'print-poster',
    label: 'Print Poster / Flyer (1200 × 1800)',
    platform: 'Print Collateral / A3 / A4',
    width: 1200,
    height: 1800,
    aspectRatio: '2:3',
    notes: 'Standard 2:3 vertical proportion for gig posters, event announcements, and print bills.',
    targetAudience: 'Shared',
  },
];

export const STUDIO_TOOL_DIRECTORY: StudioToolDefinition[] = [
  {
    id: 'release-artwork-studio',
    name: 'Music Release Artwork Studio',
    headline: 'Single, EP & Album Cover Architecture',
    description:
      'Engineered for recording artists and record labels: produce DSP-ready master covers (3000×3000), alternate artwork, and release-day graphics with integrated ISRC and advisory metadata.',
    category: 'Music & Releases',
    audience: 'Artist',
    formats: ['1:1 Master DSP Cover', '1:1 Square', '9:16 Story & Canvas', '16:9 Banner'],
    defaultAspectRatios: ['1:1', '9:16', '16:9'],
    badge: 'DSP Spec 3000px',
    featured: true,
    exampleOutputs: ['Single Cover Master', 'Album Gatefold Graphic', 'Alternate Track Artwork', 'Pre-Save Teaser'],
  },
  {
    id: 'launch-social-studio',
    name: 'Dynamic Launch & Social Studio',
    headline: 'High-Impact Announcement & Campaign Graphics',
    description:
      'Multi-format visual generator for launch countdowns, signing announcements, milestone quotes, and editorial reveal graphics with dark luxury typography and film grain textures.',
    category: 'Social & Marketing',
    audience: 'Shared',
    formats: ['1:1 Square', '4:5 Portrait', '9:16 Story', '16:9 Landscape'],
    defaultAspectRatios: ['1:1', '4:5', '9:16', '16:9'],
    badge: 'Multi-Format',
    featured: true,
    exampleOutputs: ['Coming Soon Teaser', 'Out Now Announcement', 'Editorial Quote Card', 'Brand Launch Banner'],
  },
  {
    id: 'motion-visualizer-studio',
    name: 'Motion Visualizer & Spotify Canvas Studio',
    headline: 'Vertical 9:16 Streaming Canvas & Loop Framing',
    description:
      'Design precision 9:16 visualizer frames and Spotify Canvas overlays with safe-zone indicators that prevent title clipping behind playback controls and navigation bars.',
    category: 'Motion & DSPs',
    audience: 'Artist',
    formats: ['9:16 Story & Spotify Canvas', '16:9 Landscape'],
    defaultAspectRatios: ['9:16', '16:9'],
    badge: 'Spotify Verified 9:16',
    featured: true,
    exampleOutputs: ['Spotify Canvas 8s Loop Card', 'Vertical Audio Teaser', 'YouTube Motion Backdrop'],
  },
  {
    id: 'product-ad-designer',
    name: 'Product & Brand Advertisement Designer',
    headline: 'Commercial Display & Promotional Creative',
    description:
      'Tailored for businesses, fashion labels, and e-commerce: craft conversion-driven product ads, promotional sale cards, and marketing collateral embedding live workspace brand tokens.',
    category: 'Social & Marketing',
    audience: 'Brand',
    formats: ['1:1 Square', '4:5 Portrait', '16:9 Landscape', '9:16 Story'],
    defaultAspectRatios: ['1:1', '4:5', '16:9'],
    badge: 'Brand Tokens Sync',
    featured: true,
    exampleOutputs: ['Product Spotlight Ad', 'Special Offer Card', 'E-Commerce Hero Banner', 'Seasonal Promo'],
  },
  {
    id: 'lyric-card-studio',
    name: 'Lyric Card & Song Messaging Studio',
    headline: 'Editorial Lyric Cards & Verse Posters',
    description:
      'Turn song lyrics, poetry, and artist mantras into shareable typography posters and story cards linked directly to your catalog releases.',
    category: 'Music & Releases',
    audience: 'Artist',
    formats: ['4:5 Portrait', '9:16 Story', '1:1 Square'],
    defaultAspectRatios: ['4:5', '9:16', '1:1'],
    badge: 'Lyric Typography',
    exampleOutputs: ['Track Highlight Quote', 'Verse & Chorus Poster', 'Acoustic Rollout Card'],
  },
  {
    id: 'brand-collateral-studio',
    name: 'Brand Collateral & Stationery Studio',
    headline: 'Print Business Cards, Staff IDs & Brand Guides',
    description:
      'Generate print-ready A4 Brand Guidelines manuals, vector business cards with QR codes, and staff identification badges using official Brand OS color tokens and typography.',
    category: 'Brand & Identity',
    audience: 'Brand',
    formats: ['Print Poster / Flyer', '1:1 Square', 'Vector SVG', 'PDF Manual'],
    defaultAspectRatios: ['2:3', '1:1'],
    badge: 'Print Ready PDF/SVG',
    exampleOutputs: ['Brand Guidelines Manual', 'Business Card Suite', 'Staff ID Badge', 'Corporate Stationery'],
  },
  {
    id: 'artist-epk-studio',
    name: 'Artist Press & EPK Builder',
    headline: 'Electronic Press Kits & Media One-Sheets',
    description:
      'Compile artist biography, discography highlights, high-res photography, press quotes, and booking contacts into a structured, exportable EPK packet.',
    category: 'Documents & Legal',
    audience: 'Artist',
    formats: ['A4 PDF Packet', '1:1 Square', 'Vector SVG'],
    defaultAspectRatios: ['2:3', '1:1'],
    badge: 'Industry EPK',
    exampleOutputs: ['Artist Bio One-Sheet', 'Festival Booking Deck', 'Streaming Milestone Sheet'],
  },
  {
    id: 'split-sheet-studio',
    name: 'Songwriter Split Sheet & Tracklist Builder',
    headline: '100% Royalty Verification & Legal Splits',
    description:
      'Verify 100% songwriter and producer royalty shares before distribution submission. Preloads tracklist and ISRC data, generating signed legal split sheet PDFs.',
    category: 'Documents & Legal',
    audience: 'Artist',
    formats: ['Legal PDF Agreement', 'Signed Vector SVG'],
    defaultAspectRatios: ['2:3'],
    badge: '100% Royalty Math',
    exampleOutputs: ['Single Songwriter Split Sheet', 'Album Co-Publishing Verification'],
  },
  {
    id: 'pack-template-customizer',
    name: 'Creative Pack & Template Customizer',
    headline: 'Unlocked Creative Hub Pack Customization',
    description:
      'Open any eligible Phase 4 Creative Hub resource (Artist Packs, Brand Packs, Shared Utilities), modify design copy, generate multi-format variations, and export deliverable ZIPs.',
    category: 'Social & Marketing',
    audience: 'Shared',
    formats: ['Multi-Format ZIP', 'Vector SVG', 'High-Res PNG', 'Structured PDF'],
    defaultAspectRatios: ['1:1', '9:16', '4:5', '16:9'],
    badge: 'Phase 4 Connected',
    featured: true,
    exampleOutputs: ['Customized Pack Bundle', 'Batch Multi-Format ZIP', 'Catalog Asset Adaptation'],
  },
];

export function getToolsForAudience(
  audience: 'Artist' | 'Brand' | 'Shared',
  categoryFilter?: string,
): StudioToolDefinition[] {
  return STUDIO_TOOL_DIRECTORY.filter(tool => {
    const matchesAudience =
      tool.audience === 'Shared' ||
      tool.audience === audience ||
      (audience === 'Shared' ? true : false);

    const matchesCategory =
      !categoryFilter || categoryFilter === 'All' || tool.category === categoryFilter;

    return matchesAudience && matchesCategory;
  });
}

export function getFormatPresetById(formatId: string): MultiFormatPreset {
  return (
    MULTI_FORMAT_PRESETS.find(preset => preset.id === formatId) || MULTI_FORMAT_PRESETS[0]
  );
}

export function createStarterProduction(params: {
  workspace: Workspace;
  clientProfile?: ClientProfile | null;
  starter: CreativeStarterParams;
}): CreativeProductionItem {
  const { workspace, starter } = params;
  const isArtist =
    (starter.toolId === 'release-artwork-studio' ||
      starter.toolId === 'motion-visualizer-studio' ||
      starter.toolId === 'lyric-card-studio' ||
      starter.toolId === 'artist-epk-studio' ||
      starter.toolId === 'split-sheet-studio') ||
    workspace.type === 'Artist' ||
    workspace.clientCategory === 'artist';

  const initialFormatId = starter.formatId || (isArtist ? '1:1-master-cover' : '1:1-square');
  const formatPreset = getFormatPresetById(initialFormatId);

  const brandPrimary = workspace.brand?.primaryColor?.trim() || '#FF1E1E';
  const brandSecondary = workspace.brand?.secondaryColor?.trim() || '#121212';
  const brandAccent = workspace.brand?.accentColor?.trim() || '#FF1E1E';

  const entityName = workspace.name || 'Creative Studio';

  const defaultTitle =
    starter.title ||
    (starter.linkedReleaseTitle
      ? `${starter.linkedReleaseTitle} — Release Artwork`
      : starter.linkedProjectTitle
        ? `${starter.linkedProjectTitle} — Studio Design`
        : `${entityName} — New Production`);

  const initialDesign: ProductionDesignState = {
    headline: starter.prefillDesign?.headline || (isArtist ? 'NEW SINGLE RELEASE' : 'FLAGSHIP DESIGN ARCHITECTURE'),
    subtitle:
      starter.prefillDesign?.subtitle ||
      (isArtist
        ? 'Engineered for global streaming distribution and editorial promotion.'
        : 'Precision design systems and bespoke creative assets by KeedoHub.'),
    artistOrBrandName: starter.prefillDesign?.artistOrBrandName || entityName.toUpperCase(),
    tagline: starter.prefillDesign?.tagline || (isArtist ? 'STEREO RECORDING · HIGH FIDELITY' : 'STUDIO SPECIFICATION'),
    dateText: starter.prefillDesign?.dateText || `EST. ${new Date().getFullYear()}`,
    genreOrCategory:
      starter.prefillDesign?.genreOrCategory ||
      (isArtist ? workspace.artistProfile?.genre || 'ELECTRONIC / R&B' : workspace.brandProfile?.businessCategory || 'BRAND IDENTITY'),
    primaryColor: starter.prefillDesign?.primaryColor || brandPrimary,
    secondaryColor: starter.prefillDesign?.secondaryColor || brandSecondary,
    accentColor: starter.prefillDesign?.accentColor || brandAccent,
    backgroundColor: starter.prefillDesign?.backgroundColor || '#080808',
    theme: starter.prefillDesign?.theme || 'noir',
    fontFamily: starter.prefillDesign?.fontFamily || 'sans',
    fontWeight: starter.prefillDesign?.fontWeight || '700',
    letterSpacing: starter.prefillDesign?.letterSpacing ?? 2,
    textTransform: starter.prefillDesign?.textTransform || 'uppercase',
    imageUrl: starter.prefillDesign?.imageUrl || workspace.brandProfile?.coverImageUrl || workspace.artistProfile?.profileImageUrl || '',
    imageFilter: starter.prefillDesign?.imageFilter || 'none',
    imageScale: starter.prefillDesign?.imageScale ?? 1,
    imagePositionX: starter.prefillDesign?.imagePositionX ?? 50,
    imagePositionY: starter.prefillDesign?.imagePositionY ?? 50,
    textureOverlay: starter.prefillDesign?.textureOverlay || 'film_grain',
    textureOpacity: starter.prefillDesign?.textureOpacity ?? 0.35,
    badgeText: starter.prefillDesign?.badgeText || (isArtist ? 'PARENTAL ADVISORY' : 'ORIGINAL STANDARD'),
    showBorder: starter.prefillDesign?.showBorder ?? true,
    showDivider: starter.prefillDesign?.showDivider ?? true,
    showAdvisoryBadge: starter.prefillDesign?.showAdvisoryBadge ?? isArtist,
    explicitLyrics: starter.prefillDesign?.explicitLyrics ?? false,
    spotifySafeZoneOverlay: starter.prefillDesign?.spotifySafeZoneOverlay ?? (starter.toolId === 'motion-visualizer-studio'),
    trackListSnippet: starter.prefillDesign?.trackListSnippet || '',
    barcodeOrUpc: starter.prefillDesign?.barcodeOrUpc || '',
    isrcSnippet: starter.prefillDesign?.isrcSnippet || '',
    quoteOrLyricsText: starter.prefillDesign?.quoteOrLyricsText || '',
    productFeaturePoints: starter.prefillDesign?.productFeaturePoints || ['Precision Modular Layout', 'Vector Scalable Deliverables', 'Commercial License Rights'],
    customCtaText: starter.prefillDesign?.customCtaText || (isArtist ? 'LISTEN NOW' : 'EXPLORE COLLECTION'),
  };

  const defaultVariations: ProductionVariation[] = [
    {
      formatId: formatPreset.id,
      label: formatPreset.label,
      width: formatPreset.width,
      height: formatPreset.height,
      aspectRatio: formatPreset.aspectRatio,
    },
    {
      formatId: '9:16-vertical-story',
      label: '9:16 Story & Canvas (1080 × 1920)',
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
    },
    {
      formatId: '4:5-portrait',
      label: '4:5 Portrait Feed (1080 × 1350)',
      width: 1080,
      height: 1350,
      aspectRatio: '4:5',
    },
    {
      formatId: '16:9-landscape',
      label: '16:9 Landscape Banner (1920 × 1080)',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
    },
  ];

  const now = new Date().toISOString();
  return {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: workspace.id,
    title: defaultTitle,
    toolId: starter.toolId,
    productionType: starter.productionType || (isArtist ? 'Release Artwork' : 'Brand Graphics'),
    audience: isArtist ? 'Artist' : 'Brand',
    status: 'In Progress',
    projectId: starter.linkedProjectId,
    projectTitle: starter.linkedProjectTitle,
    releaseId: starter.linkedReleaseId,
    releaseTitle: starter.linkedReleaseTitle,
    requestId: starter.linkedRequestId,
    assetId: starter.linkedAssetId,
    productId: starter.linkedProductId,
    productTitle: starter.linkedProductTitle,
    currentFormat: formatPreset.id,
    dimensions: {
      width: formatPreset.width,
      height: formatPreset.height,
      aspectRatio: formatPreset.aspectRatio,
      label: formatPreset.label,
    },
    designState: initialDesign,
    variations: defaultVariations,
    exportedFiles: [],
    createdAt: now,
    updatedAt: now,
  };
}

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const imageElementCache = new Map<string, HTMLImageElement>();

export async function loadStudioImage(url?: string): Promise<HTMLImageElement | null> {
  const clean = (url || '').trim();
  if (!clean || typeof Image === 'undefined') return null;
  const cached = imageElementCache.get(clean);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  return new Promise(resolve => {
    const img = new Image();
    if (!clean.startsWith('data:') && !clean.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (img.naturalWidth > 0) {
        imageElementCache.set(clean, img);
        resolve(img);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = clean;
  });
}

export function renderProductionToCanvas2D(
  canvas: HTMLCanvasElement,
  item: CreativeProductionItem,
  formatOverride?: MultiFormatPreset,
  loadedImage?: HTMLImageElement | null,
): void {
  const format = formatOverride || getFormatPresetById(item.currentFormat);
  const width = format.width;
  const height = format.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const d = item.designState;

  // 1. Fill Background
  if (d.theme === 'noir') {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);
  } else if (d.theme === 'pitch_black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  } else if (d.theme === 'dark_grid') {
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 1;
    const step = Math.round(width / 24);
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (d.theme === 'crimson_accent') {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);
    const radGrad = ctx.createRadialGradient(width * 0.8, height * 0.2, 50, width * 0.8, height * 0.2, width * 0.7);
    radGrad.addColorStop(0, 'rgba(255, 30, 30, 0.28)');
    radGrad.addColorStop(1, 'rgba(8, 8, 8, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (d.theme === 'silver_slate') {
    ctx.fillStyle = '#111417';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#F5F5F7';
    ctx.fillRect(0, 0, width, height);
  }

  const isLight = d.theme === 'minimal_white';
  const hasArtwork = Boolean(loadedImage && loadedImage.naturalWidth > 0);

  // 1B. Render Attached Visual / Artwork Layer if available
  if (loadedImage && loadedImage.naturalWidth > 0 && loadedImage.naturalHeight > 0) {
    ctx.save();
    if (d.imageFilter === 'grayscale') {
      ctx.filter = 'grayscale(100%)';
    } else if (d.imageFilter === 'noir') {
      ctx.filter = 'grayscale(100%) contrast(135%) brightness(90%)';
    } else if (d.imageFilter === 'contrast') {
      ctx.filter = 'contrast(120%) saturate(125%)';
    }

    const scale = Math.max(0.5, Math.min(2.5, d.imageScale ?? 1));
    const coverRatio = Math.max(width / loadedImage.naturalWidth, height / loadedImage.naturalHeight) * scale;
    const drawW = loadedImage.naturalWidth * coverRatio;
    const drawH = loadedImage.naturalHeight * coverRatio;
    const posX = (d.imagePositionX ?? 50) / 100;
    const posY = (d.imagePositionY ?? 50) / 100;
    const dx = (width - drawW) * posX;
    const dy = (height - drawH) * posY;

    ctx.globalAlpha = 0.72;
    ctx.drawImage(loadedImage, dx, dy, drawW, drawH);
    ctx.restore();

    // Editorial readability scrim over photo artwork
    const scrim = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      scrim.addColorStop(0, 'rgba(245, 245, 247, 0.72)');
      scrim.addColorStop(0.5, 'rgba(245, 245, 247, 0.58)');
      scrim.addColorStop(1, 'rgba(245, 245, 247, 0.88)');
    } else {
      scrim.addColorStop(0, 'rgba(8, 8, 8, 0.72)');
      scrim.addColorStop(0.5, 'rgba(8, 8, 8, 0.48)');
      scrim.addColorStop(1, 'rgba(8, 8, 8, 0.88)');
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, width, height);
  }

  const textColor = isLight ? '#0A0A0A' : '#FFFFFF';
  const mutedTextColor = isLight ? (hasArtwork ? '#222222' : '#555555') : hasArtwork ? '#D4D4D4' : '#888888';
  const accentColor = d.primaryColor || '#FF1E1E';

  // 2. Decorative Outer Border
  if (d.showBorder) {
    const margin = Math.round(width * 0.04);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = Math.max(1, Math.round(width * 0.0015));
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    const arm = Math.round(width * 0.02);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin - arm / 2, margin);
    ctx.lineTo(margin + arm, margin);
    ctx.moveTo(margin, margin - arm / 2);
    ctx.lineTo(margin, margin + arm);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - margin - arm, margin);
    ctx.lineTo(width - margin + arm / 2, margin);
    ctx.moveTo(width - margin, margin - arm / 2);
    ctx.lineTo(width - margin, margin + arm);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin - arm / 2, height - margin);
    ctx.lineTo(margin + arm, height - margin);
    ctx.moveTo(margin, height - margin - arm);
    ctx.lineTo(margin, height - margin + arm / 2);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - margin - arm, height - margin);
    ctx.lineTo(width - margin + arm / 2, height - margin);
    ctx.moveTo(width - margin, height - margin - arm);
    ctx.lineTo(width - margin, height - margin + arm / 2);
    ctx.stroke();
  }

  // 3. Top Metadata Bar
  const topY = Math.round(height * 0.08);
  const padX = Math.round(width * 0.07);

  ctx.fillStyle = accentColor;
  ctx.font = `600 ${Math.round(width * 0.016)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(d.tagline.toUpperCase(), padX, topY);

  ctx.fillStyle = mutedTextColor;
  ctx.textAlign = 'right';
  ctx.fillText(d.dateText, width - padX, topY);

  // 4. Center Brand / Artist Banner
  const brandY = Math.round(height * 0.16);
  ctx.fillStyle = mutedTextColor;
  ctx.font = `500 ${Math.round(width * 0.014)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(d.genreOrCategory ? d.genreOrCategory.toUpperCase() : 'PRODUCTION', padX, brandY);

  const fontStack = d.fontFamily === 'serif' ? 'serif' : d.fontFamily === 'mono' ? 'monospace' : 'sans-serif';
  ctx.fillStyle = textColor;
  ctx.font = `900 ${Math.round(width * 0.038)}px ${fontStack}`;
  ctx.fillText(d.artistOrBrandName, padX, brandY + Math.round(width * 0.045));

  // 5. Divider Line
  if (d.showDivider) {
    const divY = brandY + Math.round(width * 0.07);
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, divY);
    ctx.lineTo(width - padX, divY);
    ctx.stroke();
  }

  // Helper to wrap text cleanly
  const wrapAndDraw = (
    text: string,
    startX: number,
    startY: number,
    maxW: number,
    lineH: number,
    maxLines = 5,
  ): number => {
    const words = text.split(/\s+/).filter(Boolean);
    let line = '';
    let y = startY;
    let linesDrawn = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, startX, y);
        linesDrawn++;
        if (linesDrawn >= maxLines) return y + lineH;
        line = words[i];
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, startX, y);
    }
    return y;
  };

  const maxLineWidth = width - padX * 2;
  const isLyricTool = item.toolId === 'lyric-card-studio';
  const isProductAdTool = item.toolId === 'product-ad-designer';
  const isReleaseTool = item.toolId === 'release-artwork-studio';

  // 6. Primary Headline (or Lyric Quote card prominence)
  const headlineY = isLyricTool && d.quoteOrLyricsText ? Math.round(height * 0.38) : Math.round(height * 0.48);
  const headlineSize = Math.round(width * (isLyricTool && d.quoteOrLyricsText ? 0.042 : 0.062));
  ctx.fillStyle = textColor;
  ctx.font = `${d.fontWeight} ${headlineSize}px ${fontStack}`;
  ctx.textAlign = 'left';

  const headlineContent = d.textTransform === 'uppercase' ? d.headline.toUpperCase() : d.headline;
  let curY = wrapAndDraw(headlineContent, padX, headlineY, maxLineWidth, headlineSize * 1.15, 4);

  // 6B. Tool-Specific Focal Body (Lyric Card / Product Ad Features / Tracklist)
  if (isLyricTool && d.quoteOrLyricsText?.trim()) {
    const quoteY = curY + Math.round(width * 0.045);
    const quoteSize = Math.round(width * 0.032);
    ctx.fillStyle = accentColor;
    ctx.fillRect(padX, quoteY - Math.round(quoteSize * 0.8), Math.max(3, Math.round(width * 0.005)), quoteSize * 2.4);
    ctx.fillStyle = textColor;
    ctx.font = `italic 600 ${quoteSize}px serif`;
    curY = wrapAndDraw(`“${d.quoteOrLyricsText.trim()}”`, padX + Math.round(width * 0.025), quoteY, maxLineWidth - Math.round(width * 0.03), quoteSize * 1.35, 5);
  }

  // 7. Subtitle / Description Body
  const subY = curY + Math.round(width * 0.036);
  const subSize = Math.round(width * 0.022);
  ctx.fillStyle = mutedTextColor;
  ctx.font = `400 ${subSize}px sans-serif`;
  let curSubY = wrapAndDraw(d.subtitle || '', padX, subY, maxLineWidth, subSize * 1.35, 3);

  // Product Ad feature list + CTA button
  if (isProductAdTool && (d.productFeaturePoints?.length || d.customCtaText)) {
    let featY = curSubY + Math.round(width * 0.035);
    const featSize = Math.round(width * 0.017);
    ctx.font = `500 ${featSize}px monospace`;
    (d.productFeaturePoints || []).slice(0, 3).forEach(pt => {
      if (!pt.trim()) return;
      ctx.fillStyle = accentColor;
      ctx.fillText('▪', padX, featY);
      ctx.fillStyle = textColor;
      ctx.fillText(pt.trim(), padX + Math.round(width * 0.024), featY);
      featY += featSize * 1.65;
    });
    if (d.customCtaText?.trim() && !d.showAdvisoryBadge) {
      const ctaLabel = d.customCtaText.trim().toUpperCase();
      const ctaW = Math.min(maxLineWidth * 0.55, Math.max(width * 0.22, ctaLabel.length * width * 0.013 + width * 0.06));
      const ctaH = Math.round(width * 0.048);
      const ctaY = height - Math.round(height * 0.1) - ctaH;
      ctx.fillStyle = accentColor;
      ctx.fillRect(padX, ctaY, ctaW, ctaH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(width * 0.017)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ctaLabel, padX + ctaW / 2, ctaY + ctaH * 0.64);
      ctx.textAlign = 'left';
    }
  }

  // Release Artwork ISRC / Tracklist strip
  if (isReleaseTool && (d.isrcSnippet?.trim() || d.trackListSnippet?.trim())) {
    const metaY = curSubY + Math.round(width * 0.034);
    ctx.fillStyle = mutedTextColor;
    ctx.font = `600 ${Math.round(width * 0.015)}px monospace`;
    const parts = [
      d.isrcSnippet?.trim() ? `ISRC ${d.isrcSnippet.trim()}` : '',
      d.barcodeOrUpc?.trim() ? `UPC ${d.barcodeOrUpc.trim()}` : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      ctx.fillText(parts.join('  ·  '), padX, metaY);
    }
    if (d.trackListSnippet?.trim()) {
      ctx.font = `400 ${Math.round(width * 0.015)}px monospace`;
      wrapAndDraw(d.trackListSnippet.replace(/\n+/g, ' · '), padX, metaY + Math.round(width * 0.026), maxLineWidth, Math.round(width * 0.022), 2);
    }
  }

  // 8. Bottom Plate: Advisory Badge / Call to Action / Barcode
  const bottomY = height - Math.round(height * 0.1);

  if (d.showAdvisoryBadge) {
    const advW = Math.round(width * 0.22);
    const advH = Math.round(advW * 0.58);
    const advX = padX;
    const advY = bottomY - advH;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(advX, advY, advW, advH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(advW * 0.03));
    ctx.strokeRect(advX, advY, advW, advH);

    ctx.fillStyle = '#000000';
    ctx.font = `900 ${Math.round(advW * 0.16)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PARENTAL', advX + advW / 2, advY + advH * 0.38);

    ctx.font = `900 ${Math.round(advW * 0.18)}px sans-serif`;
    ctx.fillText('ADVISORY', advX + advW / 2, advY + advH * 0.68);

    ctx.font = `700 ${Math.round(advW * 0.08)}px monospace`;
    ctx.fillText('EXPLICIT CONTENT', advX + advW / 2, advY + advH * 0.88);
  }

  // Right-aligned CTA Badge or Specification
  const badgeX = width - padX;
  ctx.textAlign = 'right';
  ctx.fillStyle = accentColor;
  ctx.font = `700 ${Math.round(width * 0.018)}px monospace`;
  ctx.fillText(d.badgeText ? d.badgeText.toUpperCase() : 'KEEDOHUB PRODUCTION', badgeX, bottomY);

  ctx.fillStyle = mutedTextColor;
  ctx.font = `400 ${Math.round(width * 0.014)}px monospace`;
  ctx.fillText(`${format.label} · ${format.aspectRatio}`, badgeX, bottomY + Math.round(width * 0.025));

  // 9. Texture Overlays
  if (d.textureOverlay && d.textureOverlay !== 'none') {
    const opacity = d.textureOpacity ?? 0.35;
    if (d.textureOverlay === 'scan_lines') {
      ctx.strokeStyle = isLight ? `rgba(0, 0, 0, ${opacity * 0.15})` : `rgba(255, 255, 255, ${opacity * 0.15})`;
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (d.textureOverlay === 'fine_grid') {
      ctx.strokeStyle = isLight ? `rgba(0, 0, 0, ${opacity * 0.12})` : `rgba(255, 255, 255, ${opacity * 0.1})`;
      ctx.lineWidth = 1;
      const step = Math.round(width / 16);
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (d.textureOverlay === 'film_grain' || d.textureOverlay === 'subtle_noise') {
      const grainCount = Math.min(2500, Math.round(width * 0.8));
      ctx.fillStyle = isLight ? `rgba(0, 0, 0, ${opacity * 0.2})` : `rgba(255, 255, 255, ${opacity * 0.25})`;
      for (let i = 0; i < grainCount; i++) {
        const gx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
        const gy = (Math.cos(i * 811) * 0.5 + 0.5) * height;
        const gr = (i % 3 === 0 ? 1.5 : 1) * Math.max(1, width / 1000);
        ctx.fillRect(gx, gy, gr, gr);
      }
    }
  }

  // 10. Spotify Canvas Safe-Zone Overlay
  if (d.spotifySafeZoneOverlay && format.aspectRatio === '9:16') {
    ctx.strokeStyle = 'rgba(255, 30, 30, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    const topSafe = Math.round(height * (380 / 1920));
    ctx.beginPath();
    ctx.moveTo(0, topSafe);
    ctx.lineTo(width, topSafe);
    ctx.stroke();
    const botSafe = height - Math.round(height * (380 / 1920));
    ctx.beginPath();
    ctx.moveTo(0, botSafe);
    ctx.lineTo(width, botSafe);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 30, 30, 0.85)';
    ctx.font = `600 ${Math.round(width * 0.022)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('SPOTIFY CANVAS 9:16 SAFE CENTER ZONE', width / 2, topSafe + 25);
  }
}

export async function renderProductionToCanvas2DAsync(
  canvas: HTMLCanvasElement,
  item: CreativeProductionItem,
  formatOverride?: MultiFormatPreset,
): Promise<void> {
  const img = await loadStudioImage(item.designState.imageUrl);
  renderProductionToCanvas2D(canvas, item, formatOverride, img);
}

export function renderProductionToSvgString(
  item: CreativeProductionItem,
  formatOverride?: MultiFormatPreset,
): string {
  const format = formatOverride || getFormatPresetById(item.currentFormat);
  const w = format.width;
  const h = format.height;
  const d = item.designState;
  const accent = escapeXml(d.primaryColor || '#FF1E1E');
  const isLight = d.theme === 'minimal_white';
  const bg = isLight ? '#F5F5F7' : d.theme === 'pitch_black' ? '#000000' : d.theme === 'silver_slate' ? '#111417' : '#080808';
  const textColor = isLight ? '#0A0A0A' : '#FFFFFF';
  const muted = isLight ? '#555555' : d.imageUrl ? '#D4D4D4' : '#888888';
  const padX = Math.round(w * 0.07);
  const topY = Math.round(h * 0.08);
  const headlineY = Math.round(h * (item.toolId === 'lyric-card-studio' && d.quoteOrLyricsText ? 0.38 : 0.48));

  const safeHeadline = escapeXml(d.textTransform === 'uppercase' ? d.headline.toUpperCase() : d.headline);
  const safeSubtitle = escapeXml(d.subtitle);
  const safeArtist = escapeXml(d.artistOrBrandName);
  const safeTagline = escapeXml(d.tagline.toUpperCase());
  const safeDate = escapeXml(d.dateText);
  const safeGenre = escapeXml(d.genreOrCategory ? d.genreOrCategory.toUpperCase() : 'PRODUCTION');
  const safeBadge = escapeXml(d.badgeText ? d.badgeText.toUpperCase() : 'KEEDOHUB PRODUCTION');
  const safeImageUrl = d.imageUrl ? escapeXml(d.imageUrl) : '';
  const safeQuote = d.quoteOrLyricsText?.trim() ? escapeXml(`“${d.quoteOrLyricsText.trim()}”`) : '';
  const safeCta =
    item.toolId === 'product-ad-designer' && d.customCtaText?.trim() ? escapeXml(d.customCtaText.trim().toUpperCase()) : '';

  const imageBlock = safeImageUrl
    ? `<image href="${safeImageUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="0.72"/>
  <rect width="${w}" height="${h}" fill="${isLight ? 'rgba(245,245,247,0.68)' : 'rgba(8,8,8,0.65)'}"/>`
    : '';

  const borderBlock = d.showBorder
    ? `<rect x="${Math.round(w * 0.04)}" y="${Math.round(w * 0.04)}" width="${w - Math.round(w * 0.08)}" height="${h - Math.round(w * 0.08)}" fill="none" stroke="${isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.14)'}" stroke-width="2"/>`
    : '';

  const advisoryBlock = d.showAdvisoryBadge
    ? `<g transform="translate(${padX}, ${h - Math.round(h * 0.1) - Math.round(w * 0.128)})">
    <rect width="${Math.round(w * 0.22)}" height="${Math.round(w * 0.128)}" fill="#FFFFFF" stroke="#000000" stroke-width="${Math.max(2, Math.round(w * 0.006))}"/>
    <text x="${Math.round(w * 0.11)}" y="${Math.round(w * 0.048)}" text-anchor="middle" fill="#000000" font-family="sans-serif" font-weight="900" font-size="${Math.round(w * 0.035)}">PARENTAL</text>
    <text x="${Math.round(w * 0.11)}" y="${Math.round(w * 0.086)}" text-anchor="middle" fill="#000000" font-family="sans-serif" font-weight="900" font-size="${Math.round(w * 0.04)}">ADVISORY</text>
    <text x="${Math.round(w * 0.11)}" y="${Math.round(w * 0.114)}" text-anchor="middle" fill="#000000" font-family="monospace" font-weight="700" font-size="${Math.round(w * 0.017)}">EXPLICIT CONTENT</text>
  </g>`
    : '';

  const ctaBlock =
    safeCta && !d.showAdvisoryBadge
      ? `<g transform="translate(${padX}, ${h - Math.round(h * 0.1) - Math.round(w * 0.048)})">
    <rect width="${Math.round(w * 0.34)}" height="${Math.round(w * 0.048)}" fill="${accent}"/>
    <text x="${Math.round(w * 0.17)}" y="${Math.round(w * 0.031)}" text-anchor="middle" fill="#FFFFFF" font-family="monospace" font-weight="700" font-size="${Math.round(w * 0.017)}">${safeCta}</text>
  </g>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${imageBlock}
  ${borderBlock}
  <text x="${padX}" y="${topY}" fill="${accent}" font-family="monospace" font-size="${Math.round(w * 0.016)}" font-weight="600">${safeTagline}</text>
  <text x="${w - padX}" y="${topY}" text-anchor="end" fill="${muted}" font-family="monospace" font-size="${Math.round(w * 0.016)}">${safeDate}</text>
  <text x="${padX}" y="${Math.round(h * 0.16)}" fill="${muted}" font-family="monospace" font-size="${Math.round(w * 0.014)}">${safeGenre}</text>
  <text x="${padX}" y="${Math.round(h * 0.205)}" fill="${textColor}" font-family="sans-serif" font-weight="900" font-size="${Math.round(w * 0.038)}">${safeArtist}</text>
  ${
    d.showDivider
      ? `<line x1="${padX}" y1="${Math.round(h * 0.23)}" x2="${w - padX}" y2="${Math.round(h * 0.23)}" stroke="${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}" stroke-width="1"/>`
      : ''
  }
  <text x="${padX}" y="${headlineY}" fill="${textColor}" font-family="sans-serif" font-weight="${d.fontWeight}" font-size="${Math.round(w * 0.06)}">${safeHeadline}</text>
  ${safeQuote ? `<text x="${padX}" y="${headlineY + Math.round(w * 0.06)}" fill="${textColor}" font-family="serif" font-style="italic" font-size="${Math.round(w * 0.03)}">${safeQuote}</text>` : ''}
  <text x="${padX}" y="${headlineY + Math.round(w * (safeQuote ? 0.115 : 0.055))}" fill="${muted}" font-family="sans-serif" font-size="${Math.round(w * 0.022)}">${safeSubtitle}</text>
  ${advisoryBlock}
  ${ctaBlock}
  <text x="${w - padX}" y="${h - Math.round(h * 0.1)}" text-anchor="end" fill="${accent}" font-family="monospace" font-size="${Math.round(w * 0.018)}" font-weight="700">${safeBadge}</text>
</svg>`;
}

export async function renderProductionToRasterBlob(
  item: CreativeProductionItem,
  format: 'png' | 'jpeg' = 'png',
  formatOverride?: MultiFormatPreset,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderProductionToCanvas2DAsync(canvas, item, formatOverride);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to generate ${format} raster blob from studio canvas.`));
        }
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      format === 'jpeg' ? 0.95 : undefined,
    );
  });
}

export async function generateProductionPdfBlob(
  item: CreativeProductionItem,
  workspaceName: string,
  previewDataUrl?: string,
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const d = item.designState;

  // Dark editorial header band
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, 42, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 30, 30);
  pdf.text(`KEEDOHUB ${item.audience.toUpperCase()} STUDIO · PRODUCTION PROOF & SPEC`, margin, 14);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(255, 255, 255);
  pdf.text(item.title.slice(0, 62), margin, 25);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(190, 190, 190);
  pdf.text(
    `${workspaceName} · Tool: ${item.toolId} · Format: ${item.dimensions.label} · Status: ${item.status}`,
    margin,
    34,
  );

  let y = 52;

  // Attempt to embed canvas artwork preview if running in browser or supplied explicitly
  let embeddedDataUrl = previewDataUrl;
  if (!embeddedDataUrl && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      await renderProductionToCanvas2DAsync(canvas, item);
      embeddedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    } catch {
      embeddedDataUrl = undefined;
    }
  }

  if (embeddedDataUrl) {
    const ratio = item.dimensions.width / Math.max(1, item.dimensions.height);
    const maxW = contentWidth;
    const maxH = 112;
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
    const drawX = margin + (contentWidth - drawW) / 2;
    pdf.setFillColor(18, 18, 18);
    pdf.rect(drawX - 1, y - 1, drawW + 2, drawH + 2, 'F');
    pdf.addImage(embeddedDataUrl, 'JPEG', drawX, y, drawW, drawH);
    y += drawH + 10;
  }

  // Design Copy & Tokens Spec
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text('01. CREATIVE DIRECTION & COPY SPECIFICATION', margin, y);
  y += 6;

  pdf.setFillColor(246, 246, 246);
  pdf.rect(margin, y, contentWidth, 42, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(d.headline || '-', margin + 4, y + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(55, 55, 55);
  const subLines = pdf.splitTextToSize(d.subtitle || '-', contentWidth - 8).slice(0, 2);
  pdf.text(subLines, margin + 4, y + 14);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`ARTIST / BRAND: ${d.artistOrBrandName} · TAGLINE: ${d.tagline}`, margin + 4, y + 27);
  pdf.text(
    `THEME: ${d.theme} · PRIMARY: ${d.primaryColor} · SECONDARY: ${d.secondaryColor} · FONT: ${d.fontFamily}`,
    margin + 4,
    y + 33,
  );
  pdf.text(
    `LINKED: Project=${item.projectTitle || item.projectId || 'None'} · Release=${item.releaseTitle || item.releaseId || 'None'}`,
    margin + 4,
    y + 38.5,
  );
  y += 50;

  // Format Variations Matrix
  if (item.variations.length > 0 && y < 255) {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('02. MULTI-FORMAT VARIATION MATRIX', margin, y);
    y += 5;

    item.variations.slice(0, 5).forEach(v => {
      pdf.setDrawColor(225, 225, 225);
      pdf.rect(margin, y, contentWidth, 7.5, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(20, 20, 20);
      pdf.text(v.label, margin + 3, y + 5);
      pdf.setFont('courier', 'normal');
      pdf.setTextColor(90, 90, 90);
      pdf.text(`${v.width} x ${v.height} px (${v.aspectRatio})`, pageWidth - margin - 3, y + 5, { align: 'right' });
      y += 8.5;
    });
  }

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`KEEDOHUB CREATIVE PRODUCTION ENGINE · ${workspaceName.toUpperCase()}`, margin, 289);

  return pdf.output('blob');
}

export async function packageProductionVariationsZip(params: {
  item: CreativeProductionItem;
  workspaceName: string;
}): Promise<Blob> {
  const { item, workspaceName } = params;
  const zip = new JSZip();

  const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'production';
  const folder = zip.folder(safeTitle) || zip;

  // 1. Render primary format
  const primaryPng = await renderProductionToRasterBlob(item, 'png');
  folder.file(`${safeTitle}-primary.png`, primaryPng);

  const primarySvg = renderProductionToSvgString(item);
  folder.file(`${safeTitle}-vector.svg`, primarySvg);

  // 2. Render each defined variation
  for (const variation of item.variations) {
    const preset = getFormatPresetById(variation.formatId);
    const varPng = await renderProductionToRasterBlob(item, 'png', preset);
    const safeFormat = preset.id.replace(/[^a-z0-9]+/g, '-');
    folder.file(`${safeTitle}-${safeFormat}.png`, varPng);

    const varSvg = renderProductionToSvgString(item, preset);
    folder.file(`${safeTitle}-${safeFormat}.svg`, varSvg);
  }

  // 3. Printable Proof & Spec PDF
  try {
    const pdfBlob = await generateProductionPdfBlob(item, workspaceName);
    folder.file(`${safeTitle}-spec-sheet.pdf`, pdfBlob);
  } catch {
    // Gracefully skip binary PDF if headless test canvas is absent
  }

  // 4. Spec & Metadata README
  const specSheet = `================================================================================
KEEDOHUB CREATIVE PRODUCTION DELIVERABLE SPECIFICATION
================================================================================
Production Title  : ${item.title}
Tool Engine       : ${item.toolId}
Workspace Owner   : ${workspaceName} (ID: ${item.workspaceId})
Production Status : ${item.status}
Generated At      : ${new Date().toISOString()}

LINKED METADATA
--------------------------------------------------------------------------------
Audience Bucket   : ${item.audience}
Linked Project    : ${item.projectTitle || item.projectId || 'None'}
Linked Release    : ${item.releaseTitle || item.releaseId || 'None'}
Linked Request    : ${item.requestId || 'None'}

EXPORTED FORMAT VARIATIONS
--------------------------------------------------------------------------------
${item.variations
  .map(
    (v, i) =>
      `[${i + 1}] ${v.label}\n    Resolution   : ${v.width} × ${v.height} px\n    Aspect Ratio : ${v.aspectRatio}`,
  )
  .join('\n\n')}

DESIGN PARAMETERS & BRAND TOKENS
--------------------------------------------------------------------------------
Headline          : "${item.designState.headline}"
Subtitle          : "${item.designState.subtitle}"
Artist / Brand    : "${item.designState.artistOrBrandName}"
Theme Palette     : ${item.designState.theme} (Primary: ${item.designState.primaryColor}, Accent: ${item.designState.accentColor})
Texture Overlay   : ${item.designState.textureOverlay || 'none'} (Opacity: ${item.designState.textureOpacity ?? 0.35})
Advisory Badge    : ${item.designState.showAdvisoryBadge ? 'Included (Explicit/Parental Advisory)' : 'None'}
Spotify Safe-Zone : ${item.designState.spotifySafeZoneOverlay ? 'Center Safe (9:16 Compliant)' : 'Standard'}

================================================================================
Certified by KeedoHub Unified Creative Production Engine
================================================================================`;

  folder.file('PRODUCTION_SPEC_SHEET.txt', specSheet);

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export function loadStudioProductions(workspaceId: string): CreativeProductionItem[] {
  if (!workspaceId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`keedohub_studio_productions_${workspaceId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStudioProduction(
  workspaceId: string,
  production: CreativeProductionItem,
): void {
  if (!workspaceId || !production.id || typeof window === 'undefined') return;
  try {
    const current = loadStudioProductions(workspaceId);
    const existingIndex = current.findIndex(p => p.id === production.id);
    const updated = {
      ...production,
      updatedAt: new Date().toISOString(),
    };

    let next: CreativeProductionItem[];
    if (existingIndex >= 0) {
      next = [...current];
      next[existingIndex] = updated;
    } else {
      next = [updated, ...current];
    }
    window.localStorage.setItem(`keedohub_studio_productions_${workspaceId}`, JSON.stringify(next));
  } catch {
    // Gracefully ignore local storage write limits
  }
}

export function deleteStudioProduction(
  workspaceId: string,
  productionId: string,
): void {
  if (!workspaceId || !productionId || typeof window === 'undefined') return;
  try {
    const current = loadStudioProductions(workspaceId);
    const next = current.filter(p => p.id !== productionId);
    window.localStorage.setItem(`keedohub_studio_productions_${workspaceId}`, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

export function duplicateStudioProduction(
  workspaceId: string,
  productionId: string,
): CreativeProductionItem | null {
  if (!workspaceId || !productionId) return null;
  const current = loadStudioProductions(workspaceId);
  const target = current.find(p => p.id === productionId);
  if (!target) return null;

  const now = new Date().toISOString();
  const copy: CreativeProductionItem = {
    ...target,
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: `${target.title} (Copy)`,
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
  };

  saveStudioProduction(workspaceId, copy);
  return copy;
}

export function loadProductionSnapshots(workspaceId: string, productionId: string): ProductionSnapshot[] {
  if (!workspaceId || !productionId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`keedohub_studio_snapshots_${workspaceId}_${productionId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProductionSnapshot(
  workspaceId: string,
  production: CreativeProductionItem,
  label?: string,
): ProductionSnapshot | null {
  if (!workspaceId || !production.id || typeof window === 'undefined') return null;
  try {
    const current = loadProductionSnapshots(workspaceId, production.id);
    const snapshot: ProductionSnapshot = {
      id: `snap_${Date.now()}`,
      label: label?.trim() || `Version ${current.length + 1} (${production.currentFormat})`,
      createdAt: new Date().toISOString(),
      currentFormat: production.currentFormat,
      designState: { ...production.designState },
    };
    const next = [snapshot, ...current].slice(0, 12);
    window.localStorage.setItem(
      `keedohub_studio_snapshots_${workspaceId}_${production.id}`,
      JSON.stringify(next),
    );
    return snapshot;
  } catch {
    return null;
  }
}
