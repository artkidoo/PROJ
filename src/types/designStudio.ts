/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Graphic Design Engine & Canvas Types
 */

export type AspectRatioType = 
  | '1:1 Square' 
  | '9:16 Vertical Story' 
  | '16:9 Landscape' 
  | '4:5 Portrait' 
  | 'Print / Poster' 
  | 'YouTube Thumbnail';

export type TextureOverlayType = 
  | 'none'
  | 'film_grain'
  | 'paper_texture'
  | 'subtle_noise'
  | 'halftone_dots'
  | 'photocopy'
  | 'fine_grid'
  | 'scan_lines'
  | 'light_leak'
  | 'vignette'
  | 'monochrome_grain';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo' | 'badge' | 'illustration';
  name: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width?: number; // percentage (0 - 100)
  height?: number; // percentage (0 - 100)
  rotation: number; // degrees
  opacity: number; // 0 - 1
  zIndex: number;
  visible: boolean;
  locked?: boolean;

  // Text attributes
  text?: string;
  fontFamily?: 'serif' | 'sans' | 'mono' | 'display';
  fontSize?: number; // scaled px
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number; // px
  lineHeight?: number;
  color?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase';

  // Image attributes
  src?: string;
  objectFit?: 'cover' | 'contain';
  filter?: 'none' | 'grayscale' | 'contrast' | 'noir' | 'film_grain';

  // Shape attributes
  shapeType?: 'rectangle' | 'line' | 'frame' | 'circle' | 'divider';
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;

  // Logo attributes
  logoVariant?: 'monogram' | 'primary' | 'horizontal' | 'seal' | 'wordmark' | 'icon';
  logoTheme?: 'white' | 'black' | 'gold' | 'charcoal';
  logoConceptId?: 'classic' | 'mic_integrated' | 'soundwave_vinyl' | 'mic_negative' | 'label_seal' | 'bespoke_wordmark' | 'monoline_icon';

  // Illustration / Line Art attributes
  illustrationId?: string;
  illustrationCategory?: string;
  strokeColor?: string;
  strokeWidth?: number;
  isFilled?: boolean;
}

export interface CanvasDesign {
  id: string;
  workspaceId?: string; // Multi-tenancy support
  name: string;
  aspectRatio: AspectRatioType;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundTheme: 'black' | 'charcoal' | 'pitch' | 'cream' | 'crimson' | 'silver';
  elements: CanvasElement[];
  templateFamily?: string;
  category?: string;
  textureOverlay?: TextureOverlayType;
  textureOpacity?: number; // 0 - 1
  createdAt: string;
  updatedAt: string;
}

export type TemplateFamilyId = 
  | 'premium_editorial'
  | 'urban_music'
  | 'cinematic'
  | 'clean_commercial'
  | 'experimental_design'
  | 'artist_branding';

export interface TemplateFamilyItem {
  id: string;
  title: string;
  familyId: TemplateFamilyId;
  familyName: string;
  aspectRatio: AspectRatioType;
  description: string;
  design: CanvasDesign;
}
