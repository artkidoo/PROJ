import artistStreamingImg from '../assets/images/pack_artist_streaming_1795513383620.jpg';
import artistEpkImg from '../assets/images/pack_artist_epk_1795513384040.jpg';
import artistRolloutImg from '../assets/images/pack_artist_rollout_1795513399950.jpg';
import brandIdentityImg from '../assets/images/pack_brand_identity_1795513384167.jpg';
import businessDocsImg from '../assets/images/pack_business_docs_1795513399924.jpg';
import hospitalityImg from '../assets/images/pack_industry_hospitality_1795513385349.jpg';
import commerceImg from '../assets/images/pack_industry_commerce_1795513385274.jpg';
import sharedUtilitiesImg from '../assets/images/pack_shared_utilities_1795513385803.jpg';
import monthlyDropHeroImg from '../assets/images/drop_monthly_banner_1795513400243.jpg';

import vinylPressImg from '../assets/images/vinyl_press_mockup_1792791744149.jpg';
import motionStageImg from '../assets/images/motion_visualizer_stage_1795183779858.jpg';
import brandStationeryImg from '../assets/images/lyrical_ent_brand_stationery_1792793391733.jpg';
import brandSystemImg from '../assets/images/brand_identity_system_1795183778885.jpg';
import studioHeroImg from '../assets/images/lyrical_ent_studio_hero_1792791743831.jpg';
import studioDirectorImg from '../assets/images/creative_director_studio_1795183778524.jpg';
import artistShowcaseImg from '../assets/images/artist_showcase_portrait_1792791744296.jpg';
import artistEditorialImg from '../assets/images/artist_editorial_portrait_two_1795183778275.jpg';

import type {
  CreativeProduct,
  ProductPreviewItem,
  ProductVariationOption,
} from '../types/creativeProduct';

export const CREATIVE_PREVIEW_IMAGES = {
  artistStreamingImg,
  artistEpkImg,
  artistRolloutImg,
  brandIdentityImg,
  businessDocsImg,
  hospitalityImg,
  commerceImg,
  sharedUtilitiesImg,
  monthlyDropHeroImg,
  vinylPressImg,
  motionStageImg,
  brandStationeryImg,
  brandSystemImg,
  studioHeroImg,
  studioDirectorImg,
  artistShowcaseImg,
  artistEditorialImg,
} as const;

export const DEFAULT_VARIATION_OPTIONS: ProductVariationOption[] = [
  {
    id: 'var-dark-studio',
    label: 'Obsidian Dark Studio',
    format: 'ZIP',
    aspectRatio: 'Multi-Format Master',
    paletteMode: 'Dark Studio',
    notes: 'Primary obsidian (#080808) + crimson (#FF1E1E) master layout.',
  },
  {
    id: 'var-mono-light',
    label: 'Editorial Monochrome Light',
    format: 'PDF',
    aspectRatio: 'Print & Press Ready',
    paletteMode: 'Monochrome Light',
    notes: 'Clean archival cream/white background for client & print circulation.',
  },
  {
    id: 'var-crimson-accent',
    label: 'Campaign Crimson Edition',
    format: 'SVG',
    aspectRatio: 'Scalable Vector',
    paletteMode: 'Accent Crimson',
    notes: 'High-contrast accent vector layout for social announcements and banners.',
  },
];

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an interactive data-URI architectural spec preview sheet tailored to a product
 * so detail previews show real deliverable specifications without repeating stock thumbnails.
 */
export function buildProductSpecSheetDataUrl(product: Pick<CreativeProduct, 'title' | 'audience' | 'category' | 'subcategory' | 'version' | 'deliverablesSummary' | 'dimensionSpecs'>): string {
  const deliverables = (product.deliverablesSummary || []).slice(0, 4);
  const specs = (product.dimensionSpecs || []).slice(0, 3);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#09090B" />
  <rect x="44" y="44" width="1112" height="812" fill="#101013" stroke="#27272A" stroke-width="2" />
  <rect x="44" y="44" width="1112" height="8" fill="#FF1E1E" />
  <text x="84" y="106" fill="#FF1E1E" font-family="Courier, monospace" font-size="18" font-weight="bold" letter-spacing="3">KEEDOHUB CREATIVE SPECIFICATION SHEET</text>
  <text x="84" y="164" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="bold">${escapeSvgText(product.title.slice(0, 44))}</text>
  <text x="84" y="206" fill="#A1A1AA" font-family="Courier, monospace" font-size="18">${escapeSvgText(`${product.audience}  ·  ${product.category}  ·  ${product.version || 'v1.0'}`)}</text>
  <line x1="84" y1="240" x2="1116" y2="240" stroke="#27272A" stroke-width="1.5" />

  <text x="84" y="294" fill="#E4E4E7" font-family="Courier, monospace" font-size="17" font-weight="bold">INCLUDED DELIVERABLES</text>
  ${deliverables.map((d, idx) => `
    <rect x="84" y="${318 + idx * 62}" width="620" height="46" fill="#16161A" stroke="#27272A" stroke-width="1" />
    <rect x="84" y="${318 + idx * 62}" width="6" height="46" fill="#FF1E1E" />
    <text x="108" y="${347 + idx * 62}" fill="#F4F4F5" font-family="Helvetica, Arial, sans-serif" font-size="18">${escapeSvgText(d.slice(0, 56))}</text>
  `).join('')}

  <text x="744" y="294" fill="#E4E4E7" font-family="Courier, monospace" font-size="17" font-weight="bold">ARTBOARD SPECS</text>
  ${specs.map((s, idx) => `
    <rect x="744" y="${318 + idx * 108}" width="372" height="90" fill="#141418" stroke="#2E2E34" stroke-width="1" />
    <text x="766" y="${352 + idx * 108}" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="bold">${escapeSvgText(s.platform.slice(0, 28))}</text>
    <text x="766" y="${384 + idx * 108}" fill="#FF4D4D" font-family="Courier, monospace" font-size="16">${escapeSvgText(s.dimensions)}</text>
  `).join('')}

  <line x1="84" y1="766" x2="1116" y2="766" stroke="#27272A" stroke-width="1.5" />
  <text x="84" y="810" fill="#71717A" font-family="Courier, monospace" font-size="16">PRODUCTION READY  ·  EXPORT &amp; PRINT CALIBRATED  ·  KEEDOHUB CREATIVE ECOSYSTEM</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves a rich multi-slide preview gallery for any CreativeProduct, combining its custom
 * admin-uploaded gallery (if set) with its primary preview and an interactive specification sheet.
 */
export function resolveProductPreviewGallery(product: CreativeProduct): ProductPreviewItem[] {
  const seen = new Set<string>();
  const items: ProductPreviewItem[] = [];

  const pushUnique = (item: ProductPreviewItem) => {
    if (!item.url || seen.has(item.url)) return;
    seen.add(item.url);
    items.push(item);
  };

  if (product.previewImageUrl) {
    pushUnique({
      url: product.previewImageUrl,
      alt: product.previewAlt || product.title,
      caption: 'Primary Pack Showcase',
    });
  }

  for (const extra of product.previewGallery || []) {
    pushUnique(extra);
  }

  pushUnique({
    url: buildProductSpecSheetDataUrl(product),
    alt: `${product.title} specification sheet`,
    caption: 'Deliverables & Artboard Specification Sheet',
  });

  return items;
}
