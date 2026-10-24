/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Original Line Art, Vector Illustrations & Ornaments Library
 * Comprehensive vector dataset covering Music, Performance, Editorial, Urban, Celebration, and Business
 */

export type LineArtCategory = 
  | 'music_recording'
  | 'artist_performance'
  | 'editorial_luxury'
  | 'urban_experimental'
  | 'celebration_campaign'
  | 'business_branding';

export interface LineArtPath {
  type: 'path' | 'line' | 'circle' | 'rect' | 'polygon' | 'polyline';
  d?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  width?: number;
  height?: number;
  points?: string;
  fill?: 'none' | 'currentColor' | 'inherit' | string;
  stroke?: 'currentColor' | 'none' | string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'square' | 'butt';
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  strokeDasharray?: string;
  opacity?: number;
}

export interface LineArtItem {
  id: string;
  name: string;
  category: LineArtCategory;
  categoryLabel: string;
  tags: string[];
  viewBox: string;
  defaultStrokeWidth: number;
  hasFill: boolean;
  paths: LineArtPath[];
  description: string;
}

export const LINE_ART_CATEGORIES: { id: LineArtCategory; label: string; count: number }[] = [
  { id: 'music_recording', label: 'Music & Recording', count: 22 },
  { id: 'artist_performance', label: 'Artist & Performance', count: 10 },
  { id: 'editorial_luxury', label: 'Editorial & Luxury', count: 13 },
  { id: 'urban_experimental', label: 'Urban & Experimental', count: 10 },
  { id: 'celebration_campaign', label: 'Celebration & Campaign', count: 8 },
  { id: 'business_branding', label: 'Business & Branding', count: 8 }
];

export const MASTER_LINE_ART_LIBRARY: LineArtItem[] = [
  // =========================================================================
  // 1. MUSIC & RECORDING (22 Items)
  // =========================================================================
  {
    id: 'mic_studio_condenser',
    name: 'Studio Condenser Microphone',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['microphone', 'studio', 'condenser', 'vocal', 'recording', 'capsule'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Professional vocal studio condenser microphone with acoustic mesh diaphragm and shockmount ring.',
    paths: [
      // Cylindrical Body
      { type: 'rect', x: 38, y: 38, width: 24, height: 38, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Dome Capsule
      { type: 'path', d: 'M 38 38 C 38 22, 62 22, 62 38 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Grille mesh lines
      { type: 'line', x1: 42, y1: 27, x2: 58, y2: 27, stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 40, y1: 32, x2: 60, y2: 32, stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 40, y1: 37, x2: 60, y2: 37, stroke: 'currentColor', strokeWidth: 1.2 },
      // Center split band
      { type: 'line', x1: 38, y1: 44, x2: 62, y2: 44, stroke: 'currentColor', strokeWidth: 1.5 },
      // Cardioid pattern polar badge
      { type: 'circle', cx: 50, cy: 52, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      // Shockmount outer ring
      { type: 'circle', cx: 50, cy: 56, r: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '6 3' },
      // Stand connection stem
      { type: 'line', x1: 50, y1: 76, x2: 50, y2: 92, stroke: 'currentColor', strokeWidth: 3 }
    ]
  },
  {
    id: 'mic_vintage_ribbon',
    name: 'Vintage Ribbon Microphone',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['microphone', 'vintage', 'ribbon', 'classic', 'broadcasting', 'radio'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Art-Deco style vintage velocity ribbon microphone with slotted vertical grilles.',
    paths: [
      { type: 'rect', x: 34, y: 16, width: 32, height: 50, rx: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 42, y1: 22, x2: 42, y2: 60, stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 50, y1: 20, x2: 50, y2: 62, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 58, y1: 22, x2: 58, y2: 60, stroke: 'currentColor', strokeWidth: 1.2 },
      // U-Mount Yoke
      { type: 'path', d: 'M 26 42 L 26 72 C 26 84, 74 84, 74 72 L 74 42', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      { type: 'circle', cx: 26, cy: 42, r: 2.5, fill: 'currentColor' },
      { type: 'circle', cx: 74, cy: 42, r: 2.5, fill: 'currentColor' },
      { type: 'line', x1: 50, y1: 84, x2: 50, y2: 94, stroke: 'currentColor', strokeWidth: 3 }
    ]
  },
  {
    id: 'studio_headphones',
    name: 'Circumaural Studio Headphones',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['headphones', 'monitoring', 'cans', 'audio', 'sound'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'High-end closed-back studio monitoring headphones with padded headband and coiled cable.',
    paths: [
      // Cushioned Headband
      { type: 'path', d: 'M 22 55 C 22 22, 78 22, 78 55', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'path', d: 'M 28 50 C 28 28, 72 28, 72 50', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeDasharray: '3 2' },
      // Left Ear Cup
      { type: 'rect', x: 15, y: 48, width: 14, height: 26, rx: 6, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'circle', cx: 22, cy: 61, r: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      // Right Ear Cup
      { type: 'rect', x: 71, y: 48, width: 14, height: 26, rx: 6, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'circle', cx: 78, cy: 61, r: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      // Coiled Cable
      { type: 'path', d: 'M 22 74 Q 20 82 25 84 T 27 90 T 32 94', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'studio_monitor',
    name: 'Active Studio Monitor Speaker',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['speaker', 'monitor', 'audio', 'bass', 'subwoofer', 'studio'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Nearfield studio active reference monitor with silk dome tweeter and Kevlar woofer cone.',
    paths: [
      { type: 'rect', x: 24, y: 14, width: 52, height: 72, rx: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      // Silk Dome Tweeter
      { type: 'circle', cx: 50, cy: 32, r: 8, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 50, cy: 32, r: 3, fill: 'currentColor' },
      // Woofer Cone
      { type: 'circle', cx: 50, cy: 62, r: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 50, cy: 62, r: 8, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'circle', cx: 50, cy: 62, r: 3.5, fill: 'currentColor' },
      // Bass Reflex Port
      { type: 'rect', x: 40, y: 79, width: 20, height: 3, rx: 1.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'vinyl_record',
    name: 'Vinyl LP Record',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['vinyl', 'record', 'album', 'wax', 'lp', 'analog'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: '12-inch vinyl LP with concentric microgrooves and center spindle label.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 44, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      // Sound Grooves
      { type: 'circle', cx: 50, cy: 50, r: 38, fill: 'none', stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.5 },
      { type: 'circle', cx: 50, cy: 50, r: 32, fill: 'none', stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.6 },
      { type: 'circle', cx: 50, cy: 50, r: 26, fill: 'none', stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.7 },
      // Center A-Side Label
      { type: 'circle', cx: 50, cy: 50, r: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      // Spindle hole
      { type: 'circle', cx: 50, cy: 50, r: 3.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'record_player',
    name: 'Turntable & Tonearm',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['turntable', 'dj', 'record player', 'vinyl', 'deck'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Direct-drive DJ turntable with precision S-shaped tonearm and platter pitch dots.',
    paths: [
      { type: 'rect', x: 12, y: 20, width: 76, height: 60, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Platter
      { type: 'circle', cx: 42, cy: 50, r: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 42, cy: 50, r: 8, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'circle', cx: 42, cy: 50, r: 2.5, fill: 'currentColor' },
      // Tonearm Pivot & S-Arm
      { type: 'circle', cx: 76, cy: 32, r: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 76 32 Q 72 50 64 56 L 56 60', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'rect', x: 53, y: 58, width: 5, height: 4, rx: 1, fill: 'currentColor' },
      // Pitch Slider
      { type: 'line', x1: 76, y1: 52, x2: 76, y2: 72, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'rect', x: 74, y: 60, width: 4, height: 3, fill: 'currentColor' }
    ]
  },
  {
    id: 'audio_waveform',
    name: 'Acoustic Audio Waveform',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['waveform', 'soundwave', 'frequency', 'hertz', 'audio', 'stem'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Harmonic acoustic soundwave oscillation with stereo peak variations.',
    paths: [
      { type: 'line', x1: 6, y1: 50, x2: 94, y2: 50, stroke: 'currentColor', strokeWidth: 1, opacity: 0.3 },
      { type: 'path', d: 'M 6 50 Q 14 38 20 50 T 32 50 T 44 26 T 52 74 T 60 32 T 70 65 T 80 44 T 94 50', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
      { type: 'path', d: 'M 6 50 Q 18 44 28 50 T 44 38 T 52 62 T 62 42 T 74 58 T 94 50', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.5 }
    ]
  },
  {
    id: 'soundwave_rings',
    name: 'Radiating Soundwave Rings',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['soundwave', 'rings', 'resonance', 'acoustic', 'pulse', 'broadcast'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Acoustic resonance pulse radiating outward in circular soundwave ripples.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 6, fill: 'currentColor' },
      { type: 'circle', cx: 50, cy: 50, r: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 50, cy: 50, r: 26, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '4 3' },
      { type: 'circle', cx: 50, cy: 50, r: 36, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeDasharray: '6 4' },
      { type: 'circle', cx: 50, cy: 50, r: 46, fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '8 5' }
    ]
  },
  {
    id: 'equalizer_bars',
    name: 'Graphic Equalizer Spectrum',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['equalizer', 'eq', 'bars', 'frequency', 'meter', 'spectrum'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: '10-band studio frequency analyzer spectrum display.',
    paths: [
      { type: 'rect', x: 12, y: 55, width: 5, height: 30, fill: 'currentColor' },
      { type: 'rect', x: 20, y: 40, width: 5, height: 45, fill: 'currentColor' },
      { type: 'rect', x: 28, y: 25, width: 5, height: 60, fill: 'currentColor' },
      { type: 'rect', x: 36, y: 35, width: 5, height: 50, fill: 'currentColor' },
      { type: 'rect', x: 44, y: 15, width: 5, height: 70, fill: 'currentColor' },
      { type: 'rect', x: 52, y: 20, width: 5, height: 65, fill: 'currentColor' },
      { type: 'rect', x: 60, y: 30, width: 5, height: 55, fill: 'currentColor' },
      { type: 'rect', x: 68, y: 45, width: 5, height: 40, fill: 'currentColor' },
      { type: 'rect', x: 76, y: 35, width: 5, height: 50, fill: 'currentColor' },
      { type: 'rect', x: 84, y: 60, width: 5, height: 25, fill: 'currentColor' },
      { type: 'line', x1: 8, y1: 87, x2: 92, y2: 87, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'studio_mixing_console',
    name: 'Studio Mixing Console',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['mixer', 'console', 'board', 'recording', 'knobs', 'faders'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Professional multi-track analog mixing desk with channel strips and master bus.',
    paths: [
      { type: 'rect', x: 12, y: 18, width: 76, height: 64, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Channel Strips Dividers
      { type: 'line', x1: 30, y1: 18, x2: 30, y2: 82, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 48, y1: 18, x2: 48, y2: 82, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 66, y1: 18, x2: 66, y2: 82, stroke: 'currentColor', strokeWidth: 1 },
      // Rotary EQ Potentiometers
      { type: 'circle', cx: 21, cy: 30, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'circle', cx: 39, cy: 30, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'circle', cx: 57, cy: 30, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'circle', cx: 77, cy: 30, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      // Fader Slots
      { type: 'line', x1: 21, y1: 45, x2: 21, y2: 74, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'rect', x: 18, y: 56, width: 6, height: 4, fill: 'currentColor' },
      { type: 'line', x1: 39, y1: 45, x2: 39, y2: 74, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'rect', x: 36, y: 50, width: 6, height: 4, fill: 'currentColor' },
      { type: 'line', x1: 57, y1: 45, x2: 57, y2: 74, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'rect', x: 54, y: 64, width: 6, height: 4, fill: 'currentColor' },
      // Master Fader
      { type: 'line', x1: 77, y1: 45, x2: 77, y2: 74, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 74, y: 52, width: 6, height: 5, fill: 'currentColor' }
    ]
  },
  {
    id: 'studio_fader_array',
    name: 'Precision Fader Array',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['fader', 'volume', 'gain', 'dB', 'levels', 'slider'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Precision motorized dB fader slider controls with decibel scale markings.',
    paths: [
      // Fader 1
      { type: 'line', x1: 25, y1: 20, x2: 25, y2: 80, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 19, y: 35, width: 12, height: 8, rx: 1.5, fill: 'currentColor' },
      // Fader 2
      { type: 'line', x1: 50, y1: 20, x2: 50, y2: 80, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 44, y: 55, width: 12, height: 8, rx: 1.5, fill: 'currentColor' },
      // Fader 3
      { type: 'line', x1: 75, y1: 20, x2: 75, y2: 80, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 69, y: 28, width: 12, height: 8, rx: 1.5, fill: 'currentColor' },
      // Calibration Ticks
      { type: 'line', x1: 14, y1: 35, x2: 17, y2: 35, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 39, y1: 55, x2: 42, y2: 55, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 64, y1: 28, x2: 67, y2: 28, stroke: 'currentColor', strokeWidth: 1 }
    ]
  },
  {
    id: 'cassette_tape',
    name: 'Vintage Compact Cassette',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['cassette', 'tape', 'vintage', 'mixtape', 'retro', 'analog'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Analog C-90 mixtape audio cassette tape with spools and window.',
    paths: [
      { type: 'rect', x: 14, y: 25, width: 72, height: 50, rx: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      // Center Label Frame
      { type: 'rect', x: 22, y: 32, width: 56, height: 32, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      // Spool Window
      { type: 'rect', x: 30, y: 40, width: 40, height: 16, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      // Left Spool
      { type: 'circle', cx: 38, cy: 48, r: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 38, cy: 48, r: 2, fill: 'currentColor' },
      // Right Spool
      { type: 'circle', cx: 62, cy: 48, r: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 62, cy: 48, r: 2, fill: 'currentColor' },
      // Trapezoid Head Zone
      { type: 'polygon', points: '24,75 32,66 68,66 76,75', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'compact_disc',
    name: 'Compact Disc CD / DVD',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['cd', 'disc', 'album', 'optical', 'laser', 'audio'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Digital audio compact disc with laser data reflection tracks.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 42, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'circle', cx: 50, cy: 50, r: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 50, cy: 50, r: 7, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      // Laser Sheen Angle Rays
      { type: 'path', d: 'M 22 22 L 36 36', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.6 },
      { type: 'path', d: 'M 64 64 L 78 78', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.6 },
      { type: 'path', d: 'M 78 22 L 64 36', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.6 },
      { type: 'path', d: 'M 36 64 L 22 78', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.6 }
    ]
  },
  {
    id: 'mic_boom_stand',
    name: 'Stage Boom Microphone Stand',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['stand', 'boom', 'stage', 'live', 'tripod', 'microphone'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Telescoping studio boom arm with tripod base and microphone clip.',
    paths: [
      // Tripod Legs
      { type: 'line', x1: 50, y1: 75, x2: 24, y2: 92, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
      { type: 'line', x1: 50, y1: 75, x2: 76, y2: 92, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
      { type: 'line', x1: 50, y1: 75, x2: 50, y2: 92, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
      // Vertical Shaft
      { type: 'line', x1: 50, y1: 42, x2: 50, y2: 75, stroke: 'currentColor', strokeWidth: 2.5 },
      // Boom Clutch
      { type: 'circle', cx: 50, cy: 42, r: 3.5, fill: 'currentColor' },
      // Diagonal Boom Arm
      { type: 'line', x1: 68, y1: 54, x2: 26, y2: 24, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      // Mic Clip & Mic
      { type: 'line', x1: 26, y1: 24, x2: 22, y2: 18, stroke: 'currentColor', strokeWidth: 3 },
      { type: 'circle', cx: 20, cy: 15, r: 3, fill: 'currentColor' }
    ]
  },
  {
    id: 'stage_spotlight',
    name: 'Concert Spotlight Beam',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['spotlight', 'light', 'beam', 'concert', 'stage', 'show'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Parabolic stage luminaire casting dramatic conical spotlight beams.',
    paths: [
      // Spotlight Housing
      { type: 'path', d: 'M 18 18 L 32 32 L 26 38 L 12 24 Z', fill: 'currentColor' },
      { type: 'circle', cx: 16, cy: 16, r: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      // Expanding Light Rays
      { type: 'line', x1: 30, y1: 34, x2: 88, y2: 70, stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '4 3' },
      { type: 'line', x1: 24, y1: 40, x2: 64, y2: 90, stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '4 3' },
      // Oval Light Pool on Floor
      { type: 'path', d: 'M 64 90 C 70 82, 84 76, 88 70', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'mic_dynamic_handheld',
    name: 'Handheld Dynamic Vocal Mic',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['mic', 'vocal', 'shure', 'handheld', 'stage', 'performance'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Legendary stage dynamic cardioid microphone with steel mesh ball grille.',
    paths: [
      // Mesh Ball
      { type: 'circle', cx: 32, cy: 32, r: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 22, y1: 22, x2: 42, y2: 42, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 42, y1: 22, x2: 22, y2: 42, stroke: 'currentColor', strokeWidth: 1 },
      // Handle Shaft
      { type: 'path', d: 'M 40 40 L 76 76 C 79 79, 74 84, 71 81 L 35 45 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // On/Off Switch
      { type: 'rect', x: 48, y: 52, width: 4, height: 6, rx: 1, fill: 'currentColor' }
    ]
  },
  {
    id: 'studio_rec_indicator',
    name: 'Studio "ON AIR / REC" Light',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['rec', 'record', 'on air', 'tally', 'studio', 'indicator'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Illuminated studio recording tally badge with warning indicator.',
    paths: [
      { type: 'rect', x: 16, y: 32, width: 68, height: 36, rx: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      // Glowing REC circle
      { type: 'circle', cx: 30, cy: 50, r: 6, fill: 'currentColor' },
      // Audio Wave Bars inside badge
      { type: 'line', x1: 44, y1: 50, x2: 44, y2: 50, stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round' },
      { type: 'line', x1: 52, y1: 44, x2: 52, y2: 56, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'line', x1: 60, y1: 40, x2: 60, y2: 60, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'line', x1: 68, y1: 45, x2: 68, y2: 55, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'line', x1: 76, y1: 48, x2: 76, y2: 52, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'musical_notes_stave',
    name: 'Musical Treble Clef & Stave',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['notes', 'treble clef', 'music', 'melody', 'notation', 'score'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Modern geometric musical stave lines with stylized treble clef.',
    paths: [
      { type: 'line', x1: 10, y1: 30, x2: 90, y2: 30, stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 },
      { type: 'line', x1: 10, y1: 40, x2: 90, y2: 40, stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 },
      { type: 'line', x1: 10, y1: 50, x2: 90, y2: 50, stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 },
      { type: 'line', x1: 10, y1: 60, x2: 90, y2: 60, stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 },
      { type: 'line', x1: 10, y1: 70, x2: 90, y2: 70, stroke: 'currentColor', strokeWidth: 1, opacity: 0.5 },
      // Stylized Treble Clef
      { type: 'path', d: 'M 32 80 C 30 75, 34 70, 38 72 C 42 74, 40 82, 35 82 C 30 82, 28 72, 35 60 C 44 44, 46 22, 38 20 C 34 18, 30 22, 32 30 C 36 46, 18 56, 24 68 C 28 74, 36 74, 38 68', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'xlr_audio_cable',
    name: 'XLR Cable Connector & Jack',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['xlr', 'cable', 'jack', 'balanced', 'audio', 'wire'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: '3-pin balanced studio XLR male connector with heavy-duty rubber strain relief.',
    paths: [
      { type: 'rect', x: 26, y: 38, width: 28, height: 24, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // 3 Gold Pins
      { type: 'circle', cx: 34, cy: 46, r: 2.5, fill: 'currentColor' },
      { type: 'circle', cx: 34, cy: 54, r: 2.5, fill: 'currentColor' },
      { type: 'circle', cx: 44, cy: 50, r: 2.5, fill: 'currentColor' },
      // Strain Relief Boot
      { type: 'path', d: 'M 54 44 L 68 46 L 76 48 L 76 52 L 68 54 L 54 56 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      // Coiled Cable Tail
      { type: 'path', d: 'M 76 50 Q 86 48 88 56 T 94 62', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'stage_truss_grid',
    name: 'Stage Lighting Truss Grid',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['truss', 'stage', 'festival', 'lighting', 'rig', 'arena'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Modular aluminum concert stage triangular truss framework.',
    paths: [
      { type: 'line', x1: 8, y1: 42, x2: 92, y2: 42, stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'line', x1: 8, y1: 58, x2: 92, y2: 58, stroke: 'currentColor', strokeWidth: 2.5 },
      // Diagonal Bracing
      { type: 'line', x1: 14, y1: 42, x2: 26, y2: 58, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 26, y1: 58, x2: 38, y2: 42, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 38, y1: 42, x2: 50, y2: 58, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 50, y1: 58, x2: 62, y2: 42, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 62, y1: 42, x2: 74, y2: 58, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 74, y1: 58, x2: 86, y2: 42, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'studio_fader_single_master',
    name: 'Master Output Fader',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['fader', 'master', 'volume', 'stereo', 'level'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Master stereo output fader channel with unity zero dB indicator.',
    paths: [
      { type: 'line', x1: 50, y1: 16, x2: 50, y2: 84, stroke: 'currentColor', strokeWidth: 3 },
      { type: 'rect', x: 38, y: 44, width: 24, height: 12, rx: 2, fill: 'currentColor' },
      { type: 'line', x1: 38, y1: 50, x2: 62, y2: 50, stroke: '#000000', strokeWidth: 1.5 },
      // Side Scale dB
      { type: 'line', x1: 28, y1: 30, x2: 34, y2: 30, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 24, y1: 50, x2: 34, y2: 50, stroke: 'currentColor', strokeWidth: 2 }, // 0 dB
      { type: 'line', x1: 28, y1: 70, x2: 34, y2: 70, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'metronome_tempo',
    name: 'Acoustic Studio Metronome',
    category: 'music_recording',
    categoryLabel: 'Music & Recording',
    tags: ['metronome', 'tempo', 'bpm', 'click', 'timing', 'rhythm'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Mechanical pyramid tempo metronome with swinging pendulum arm and weight slider.',
    paths: [
      // Pyramid Body
      { type: 'polygon', points: '50,16 28,84 72,84', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      { type: 'line', x1: 24, y1: 84, x2: 76, y2: 84, stroke: 'currentColor', strokeWidth: 3 },
      // Pendulum Arm
      { type: 'line', x1: 50, y1: 76, x2: 64, y2: 24, stroke: 'currentColor', strokeWidth: 2 },
      // Sliding Weight
      { type: 'rect', x: 57, y: 38, width: 8, height: 6, fill: 'currentColor' }
    ]
  },

  // =========================================================================
  // 2. ARTIST & PERFORMANCE (10 Items)
  // =========================================================================
  {
    id: 'perf_singer_silhouette',
    name: 'Vocalist Singer Silhouette',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['singer', 'vocalist', 'artist', 'silhouette', 'performance', 'live'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Expressive live stage vocalist delivering dynamic high notes into a microphone.',
    paths: [
      {
        type: 'path',
        d: 'M 40 88 L 40 68 C 40 56, 44 48, 52 44 C 56 42, 60 36, 58 30 C 56 22, 48 20, 44 26 C 40 32, 42 40, 36 44 C 30 48, 26 56, 26 68 L 26 88 Z',
        fill: 'currentColor'
      },
      // Microphone held in hand
      { type: 'line', x1: 58, y1: 34, x2: 68, y2: 26, stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'circle', cx: 70, cy: 24, r: 3.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'perf_rapper_mic',
    name: 'Rapper Microphone Performance',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['rapper', 'mc', 'hip hop', 'mic', 'flow', 'performance'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Dynamic hip-hop MC delivering verses with angled stage mic.',
    paths: [
      {
        type: 'path',
        d: 'M 32 86 C 32 64, 38 52, 48 48 C 54 45, 56 38, 54 32 C 52 24, 42 22, 38 28 C 34 34, 36 42, 30 46 C 24 50, 20 62, 20 86 Z',
        fill: 'currentColor'
      },
      // Mic Arm Extended Forward
      { type: 'path', d: 'M 48 54 L 66 42 L 74 48', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'line', x1: 72, y1: 44, x2: 84, y2: 36, stroke: 'currentColor', strokeWidth: 3 },
      { type: 'circle', cx: 86, cy: 34, r: 4, fill: 'currentColor' }
    ]
  },
  {
    id: 'perf_dj_deck',
    name: 'DJ Turntable Rig & Mixer',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['dj', 'decks', 'mixer', 'club', 'turntables', 'scratch'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Complete dual-turntable battle setup with central two-channel battle mixer.',
    paths: [
      // Left Turntable
      { type: 'rect', x: 8, y: 32, width: 28, height: 38, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 22, cy: 51, r: 11, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 22, cy: 51, r: 3, fill: 'currentColor' },
      // Center Mixer
      { type: 'rect', x: 40, y: 34, width: 20, height: 34, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'line', x1: 50, y1: 38, x2: 50, y2: 60, stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 44, y1: 62, x2: 56, y2: 62, stroke: 'currentColor', strokeWidth: 1.8 }, // Crossfader
      { type: 'rect', x: 48, y: 60, width: 4, height: 4, fill: 'currentColor' },
      // Right Turntable
      { type: 'rect', x: 64, y: 32, width: 28, height: 38, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 78, cy: 51, r: 11, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 78, cy: 51, r: 3, fill: 'currentColor' }
    ]
  },
  {
    id: 'perf_concert_crowd',
    name: 'Concert Audience Crowd',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['crowd', 'audience', 'concert', 'fans', 'festival', 'live'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Vibrant festival crowd silhouettes viewed from behind with stage lighting rays.',
    paths: [
      {
        type: 'path',
        d: 'M 6 88 C 10 74, 18 72, 22 88 C 26 76, 34 74, 38 88 C 42 70, 50 68, 54 88 C 58 72, 66 70, 70 88 C 74 76, 82 74, 86 88 C 90 78, 96 80, 98 88 L 6 88 Z',
        fill: 'currentColor'
      },
      // Individual Silhouette Heads
      { type: 'circle', cx: 20, cy: 72, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 36, cy: 68, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 52, cy: 62, r: 4.5, fill: 'currentColor' },
      { type: 'circle', cx: 68, cy: 66, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 84, cy: 70, r: 4, fill: 'currentColor' }
    ]
  },
  {
    id: 'perf_raised_hands',
    name: 'Raised Hands at Concert',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['hands', 'applause', 'praise', 'crowd', 'energy', 'cheer'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Iconic raised audience hands and peace signs reaching toward the stage.',
    paths: [
      // Left Hand
      { type: 'path', d: 'M 22 88 L 22 62 C 22 54, 28 54, 28 62 L 28 88 Z', fill: 'currentColor' },
      { type: 'line', x1: 25, y1: 54, x2: 25, y2: 44, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' },
      // Center Peace Sign
      { type: 'path', d: 'M 48 88 L 48 58 C 48 52, 54 52, 54 58 L 54 88 Z', fill: 'currentColor' },
      { type: 'line', x1: 49, y1: 52, x2: 46, y2: 36, stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' },
      { type: 'line', x1: 53, y1: 52, x2: 56, y2: 36, stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' },
      // Right Hand
      { type: 'path', d: 'M 74 88 L 74 60 C 74 54, 80 54, 80 60 L 80 88 Z', fill: 'currentColor' },
      { type: 'line', x1: 77, y1: 54, x2: 77, y2: 42, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'perf_tour_ticket',
    name: 'VIP Concert Tour Ticket Stub',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['ticket', 'stub', 'vip', 'pass', 'tour', 'admission'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Perforated VIP concert admission ticket with barcodes and seat details.',
    paths: [
      { type: 'rect', x: 12, y: 32, width: 76, height: 36, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Perforation Line
      { type: 'line', x1: 64, y1: 32, x2: 64, y2: 68, stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '3 2' },
      // Circular Notches on Perforation
      { type: 'path', d: 'M 64 32 C 67 32, 67 36, 64 36 C 61 36, 61 32, 64 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      // Barcode on Stub
      { type: 'line', x1: 70, y1: 40, x2: 70, y2: 60, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 74, y1: 40, x2: 74, y2: 60, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 77, y1: 40, x2: 77, y2: 60, stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'line', x1: 82, y1: 40, x2: 82, y2: 60, stroke: 'currentColor', strokeWidth: 1.5 },
      // Ticket Typography lines
      { type: 'line', x1: 20, y1: 44, x2: 52, y2: 44, stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'line', x1: 20, y1: 52, x2: 44, y2: 52, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'perf_backstage_pass',
    name: 'All-Access Backstage Pass',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['pass', 'backstage', 'all access', 'lanyard', 'vip', 'badge'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Hanging laminated VIP laminate pass with slot punch and holographic seal.',
    paths: [
      // Lanyard Slot
      { type: 'rect', x: 42, y: 14, width: 16, height: 4, rx: 2, fill: 'currentColor' },
      // Laminate Card
      { type: 'rect', x: 26, y: 22, width: 48, height: 66, rx: 4, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Hologram Diamond
      { type: 'polygon', points: '50,34 60,44 50,54 40,44', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'circle', cx: 50, cy: 44, r: 3, fill: 'currentColor' },
      // AAA Bold Letters
      { type: 'line', x1: 34, y1: 66, x2: 66, y2: 66, stroke: 'currentColor', strokeWidth: 3.5 },
      { type: 'line', x1: 38, y1: 74, x2: 62, y2: 74, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'perf_festival_crest',
    name: 'Music Festival Crest Badge',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['crest', 'festival', 'shield', 'laurel', 'emblem'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Heraldic music festival insignia with protective shield and victory laurels.',
    paths: [
      { type: 'path', d: 'M 50 16 L 76 26 L 76 56 C 76 74, 50 86, 50 86 C 50 86, 24 74, 24 56 L 24 26 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Center Star
      { type: 'polygon', points: '50,36 53,44 61,44 55,49 57,57 50,52 43,57 45,49 39,44 47,44', fill: 'currentColor' },
      // Laurel Branches
      { type: 'path', d: 'M 18 42 C 14 56, 20 70, 32 78', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 82 42 C 86 56, 80 70, 68 78', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'perf_cross_spotlights',
    name: 'Dual Cross-Spotlight Beams',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['spotlights', 'stage', 'lighting', 'arena', 'cross', 'beams'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Dual criss-crossing concert searchlight beams illuminating the stadium sky.',
    paths: [
      { type: 'line', x1: 14, y1: 86, x2: 86, y2: 14, stroke: 'currentColor', strokeWidth: 1.8, strokeDasharray: '5 3' },
      { type: 'line', x1: 86, y1: 86, x2: 14, y2: 14, stroke: 'currentColor', strokeWidth: 1.8, strokeDasharray: '5 3' },
      // Parabolic Lamps at Bases
      { type: 'path', d: 'M 8 86 C 8 80, 20 80, 20 86 Z', fill: 'currentColor' },
      { type: 'path', d: 'M 80 86 C 80 80, 92 80, 92 86 Z', fill: 'currentColor' },
      // Intersection Starlight
      { type: 'circle', cx: 50, cy: 50, r: 4, fill: 'currentColor' }
    ]
  },
  {
    id: 'perf_poster_corner_ornament',
    name: 'Concert Poster Corner Frame',
    category: 'artist_performance',
    categoryLabel: 'Artist & Performance',
    tags: ['frame', 'corner', 'poster', 'ornament', 'flourish'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Angular concert tour poster corner decoration with geometric chevrons.',
    paths: [
      { type: 'polyline', points: '14,46 14,14 46,14', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'polyline', points: '22,38 22,22 38,22', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'polygon', points: '14,14 26,14 14,26', fill: 'currentColor' },
      { type: 'circle', cx: 30, cy: 30, r: 2.5, fill: 'currentColor' }
    ]
  },

  // =========================================================================
  // 3. EDITORIAL & LUXURY (13 Items)
  // =========================================================================
  {
    id: 'edit_double_frame',
    name: 'Minimal Luxury Double Frame',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['frame', 'border', 'editorial', 'luxury', 'double', 'poster'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Refined double keyline border frame with hairline inset spacing.',
    paths: [
      { type: 'rect', x: 8, y: 8, width: 84, height: 84, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 14, y: 14, width: 72, height: 72, fill: 'none', stroke: 'currentColor', strokeWidth: 0.8 }
    ]
  },
  {
    id: 'edit_bauhaus_arch',
    name: 'Bauhaus Architectural Arch',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['arch', 'bauhaus', 'architecture', 'minimal', 'monolith'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Geometric modernist archway line art inspired by Bauhaus architecture.',
    paths: [
      { type: 'path', d: 'M 25 86 L 25 45 C 25 31, 75 31, 75 45 L 75 86', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      { type: 'path', d: 'M 35 86 L 35 48 C 35 39, 65 39, 65 48 L 65 86', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 18, y1: 86, x2: 82, y2: 86, stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'circle', cx: 50, cy: 30, r: 3, fill: 'currentColor' }
    ]
  },
  {
    id: 'edit_celestial_rings',
    name: 'Concentric Celestial Orbital Rings',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['rings', 'celestial', 'orbit', 'astronomy', 'luxury', 'circles'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Fine celestial orbital rings intersecting with astronomical cardinal axes.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 42, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 50, cy: 50, r: 32, fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 3' },
      { type: 'circle', cx: 50, cy: 50, r: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 50, y1: 4, x2: 50, y2: 96, stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.5 },
      { type: 'line', x1: 4, y1: 50, x2: 96, y2: 50, stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.5 },
      { type: 'circle', cx: 50, cy: 50, r: 4, fill: 'currentColor' }
    ]
  },
  {
    id: 'edit_caliper_scale',
    name: 'Technical Caliper & Measurement Scale',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['caliper', 'scale', 'technical', 'measurement', 'vernier', 'precision'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Precision engineering vernier caliper rule with millimeter tick marks.',
    paths: [
      { type: 'line', x1: 10, y1: 50, x2: 90, y2: 50, stroke: 'currentColor', strokeWidth: 2 },
      // Millimeter Scale Ticks
      { type: 'line', x1: 10, y1: 42, x2: 10, y2: 58, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 20, y1: 46, x2: 20, y2: 54, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 30, y1: 44, x2: 30, y2: 56, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 40, y1: 46, x2: 40, y2: 54, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 50, y1: 40, x2: 50, y2: 60, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 60, y1: 46, x2: 60, y2: 54, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 70, y1: 44, x2: 70, y2: 56, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 80, y1: 46, x2: 80, y2: 54, stroke: 'currentColor', strokeWidth: 1 },
      { type: 'line', x1: 90, y1: 42, x2: 90, y2: 58, stroke: 'currentColor', strokeWidth: 2 }
    ]
  },
  {
    id: 'edit_corner_brackets',
    name: 'Editorial Crosshair Corner Brackets',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['brackets', 'corners', 'crosshair', 'camera', 'editorial'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Four minimalist optical crosshair corner brackets for magazine layouts.',
    paths: [
      // Top-Left
      { type: 'polyline', points: '14,24 14,14 24,14', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Top-Right
      { type: 'polyline', points: '76,14 86,14 86,24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Bottom-Left
      { type: 'polyline', points: '14,76 14,86 24,86', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Bottom-Right
      { type: 'polyline', points: '86,76 86,86 76,86', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Center Optical Dot
      { type: 'circle', cx: 50, cy: 50, r: 2, fill: 'currentColor' }
    ]
  },
  {
    id: 'edit_starlight_sparkle',
    name: 'Minimalist Starlight Sparkles',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['stars', 'sparkles', 'glamour', 'luxury', 'gleam'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: true,
    description: '4-point curved starlight vectors creating an editorial diamond gleam.',
    paths: [
      // Major Center Star
      { type: 'path', d: 'M 50 18 Q 50 50 18 50 Q 50 50 50 82 Q 50 50 82 50 Q 50 50 50 18 Z', fill: 'currentColor' },
      // Minor Top-Right Sparkle
      { type: 'path', d: 'M 78 18 Q 78 30 66 30 Q 78 30 78 42 Q 78 30 90 30 Q 78 30 78 18 Z', fill: 'currentColor', opacity: 0.7 },
      // Minor Bottom-Left Sparkle
      { type: 'path', d: 'M 24 68 Q 24 76 16 76 Q 24 76 24 84 Q 24 76 32 76 Q 24 76 24 68 Z', fill: 'currentColor', opacity: 0.6 }
    ]
  },
  {
    id: 'edit_metric_grid',
    name: 'Metric Layout Coordinate Matrix',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['grid', 'dots', 'matrix', 'swiss', 'alignment'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1,
    hasFill: true,
    description: 'Swiss Modernist 5x5 alignment dot coordinate grid.',
    paths: [
      { type: 'circle', cx: 20, cy: 20, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 35, cy: 20, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 50, cy: 20, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 65, cy: 20, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 80, cy: 20, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 20, cy: 50, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 50, cy: 50, r: 3, fill: 'currentColor' }, // Focus point
      { type: 'circle', cx: 80, cy: 50, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 20, cy: 80, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 35, cy: 80, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 50, cy: 80, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 65, cy: 80, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 80, cy: 80, r: 1.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'edit_diamond_divider',
    name: 'Diamond Typographic Divider',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['divider', 'line', 'diamond', 'separator', 'rule'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: true,
    description: 'Editorial line divider featuring a center diamond lozenge ornament.',
    paths: [
      { type: 'line', x1: 6, y1: 50, x2: 44, y2: 50, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'polygon', points: '50,44 56,50 50,56 44,50', fill: 'currentColor' },
      { type: 'line', x1: 56, y1: 50, x2: 94, y2: 50, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'edit_art_deco_border',
    name: 'Art Deco Geometric Border',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['art deco', 'border', 'vintage', 'gatsby', 'luxury'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Stepped chevron Art-Deco luxury packaging border element.',
    paths: [
      { type: 'polyline', points: '14,30 26,14 74,14 86,30 86,70 74,86 26,86 14,70 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'polyline', points: '20,32 30,18 70,18 80,32 80,68 70,82 30,82 20,68 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1 }
    ]
  },
  {
    id: 'edit_botanical_olive',
    name: 'Minimalist Botanical Laurel',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['botanical', 'olive', 'laurel', 'leaves', 'organic', 'monoline'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Stylized monoline olive branch representing prestige and quality.',
    paths: [
      { type: 'path', d: 'M 20 82 Q 50 60 76 22', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      // Leaves along stem
      { type: 'path', d: 'M 35 68 C 30 64, 28 54, 34 52 C 40 54, 38 64, 35 68', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 48 55 C 44 48, 48 40, 54 42 C 58 46, 54 52, 48 55', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 62 40 C 60 32, 66 26, 72 28 C 74 34, 68 38, 62 40', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 76 22 C 78 14, 86 16, 86 22 C 84 26, 78 26, 76 22', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'edit_calligraphic_flourish',
    name: 'Calligraphic Terminal Flourish',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['flourish', 'calligraphy', 'swirl', 'luxury', 'tail'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Swirling typographic terminal flourish scroll.',
    paths: [
      { type: 'path', d: 'M 14 54 C 28 32, 54 34, 66 48 C 76 60, 88 56, 88 44 C 88 34, 76 34, 74 42 C 72 50, 80 54, 84 50', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'edit_guilloche_security',
    name: 'Guilloche Banknote Rosette',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['guilloche', 'engraving', 'security', 'currency', 'intricate'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1,
    hasFill: false,
    description: 'Interlocking sinusoidal guilloche wave pattern from vintage currency and stock certificates.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 40, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 50 10 Q 78 30 90 50 Q 78 70 50 90 Q 22 70 10 50 Q 22 30 50 10 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1 },
      { type: 'path', d: 'M 10 50 Q 30 78 50 90 Q 70 78 90 50 Q 70 22 50 10 Q 30 22 10 50 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1 },
      { type: 'circle', cx: 50, cy: 50, r: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
    ]
  },
  {
    id: 'edit_monolith_pillar',
    name: 'Editorial Classical Monolith Pillar',
    category: 'editorial_luxury',
    categoryLabel: 'Editorial & Luxury',
    tags: ['pillar', 'column', 'classical', 'monolith', 'architecture'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Classical architectural fluted column silhouette.',
    paths: [
      { type: 'rect', x: 28, y: 18, width: 44, height: 6, fill: 'currentColor' },
      { type: 'line', x1: 34, y1: 24, x2: 34, y2: 76, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 42, y1: 24, x2: 42, y2: 76, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 50, y1: 24, x2: 50, y2: 76, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 58, y1: 24, x2: 58, y2: 76, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 66, y1: 24, x2: 66, y2: 76, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 24, y: 76, width: 52, height: 8, fill: 'currentColor' }
    ]
  },

  // =========================================================================
  // 4. URBAN & EXPERIMENTAL (10 Items)
  // =========================================================================
  {
    id: 'urban_city_skyline',
    name: 'Metropolis City Skyline',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['city', 'skyline', 'buildings', 'urban', 'metropolis', 'towers'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Modern metropolitan architectural skyscraper skyline silhouette.',
    paths: [
      {
        type: 'polygon',
        points: '10,88 10,54 22,54 22,42 32,42 32,24 38,24 38,16 42,16 42,24 48,24 48,36 60,36 60,48 72,48 72,32 82,32 82,60 90,60 90,88',
        fill: 'currentColor'
      },
      // Antenna Tower
      { type: 'line', x1: 40, y1: 8, x2: 40, y2: 16, stroke: 'currentColor', strokeWidth: 2 }
    ]
  },
  {
    id: 'urban_street_map',
    name: 'Cartographic Street Grid Matrix',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['map', 'streets', 'grid', 'city', 'urban', 'gps'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Abstract metropolitan street cartography map vector lines.',
    paths: [
      { type: 'line', x1: 12, y1: 28, x2: 88, y2: 28, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 12, y1: 56, x2: 88, y2: 56, stroke: 'currentColor', strokeWidth: 3 }, // Major Boulevard
      { type: 'line', x1: 12, y1: 78, x2: 88, y2: 78, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 34, y1: 12, x2: 34, y2: 88, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 64, y1: 12, x2: 64, y2: 88, stroke: 'currentColor', strokeWidth: 2.5 },
      // Diagonal expressway
      { type: 'line', x1: 12, y1: 84, x2: 84, y2: 16, stroke: 'currentColor', strokeWidth: 1.8, strokeDasharray: '4 2' }
    ]
  },
  {
    id: 'urban_geometric_arrow',
    name: 'Brutalist Directional Arrow',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['arrow', 'brutalist', 'direction', 'swiss', 'experimental'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Heavy architectural Swiss Modernist directional arrow.',
    paths: [
      { type: 'polygon', points: '50,14 86,50 68,50 68,86 32,86 32,50 14,50', fill: 'currentColor' }
    ]
  },
  {
    id: 'urban_broken_grid',
    name: 'Deconstructed Brutalist Wireframe',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['grid', 'brutalist', 'broken', 'wireframe', 'glitch'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Offset fragmented architectural wireframe with dimensional tension.',
    paths: [
      { type: 'rect', x: 18, y: 18, width: 44, height: 44, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 38, y: 38, width: 44, height: 44, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeDasharray: '6 4' },
      { type: 'line', x1: 18, y1: 18, x2: 38, y2: 38, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 62, y1: 18, x2: 82, y2: 38, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 18, y1: 62, x2: 38, y2: 82, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'urban_motion_streaks',
    name: 'Kinetic Velocity Motion Streaks',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['motion', 'speed', 'streaks', 'velocity', 'blur', 'kinetic'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Horizontal kinetic motion blur lines conveying high speed and rhythm.',
    paths: [
      { type: 'line', x1: 12, y1: 24, x2: 88, y2: 24, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' },
      { type: 'line', x1: 28, y1: 36, x2: 94, y2: 36, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'line', x1: 8, y1: 48, x2: 78, y2: 48, stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round' },
      { type: 'line', x1: 34, y1: 60, x2: 92, y2: 60, stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' },
      { type: 'line', x1: 16, y1: 72, x2: 84, y2: 72, stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' }
    ]
  },
  {
    id: 'urban_distortion_wave',
    name: 'Oscilloscope Glitch Distortion',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['glitch', 'distortion', 'oscilloscope', 'noise', 'analog'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Electronic distortion glitch waveform with displaced scan traces.',
    paths: [
      { type: 'path', d: 'M 10 38 L 32 38 L 40 22 L 48 54 L 56 30 L 64 46 L 72 38 L 90 38', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'path', d: 'M 10 50 L 28 50 L 36 66 L 46 34 L 54 58 L 62 42 L 70 50 L 90 50', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, opacity: 0.6 },
      { type: 'path', d: 'M 10 62 L 34 62 L 42 46 L 50 78 L 58 54 L 66 70 L 74 62 L 90 62', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
    ]
  },
  {
    id: 'urban_technical_stamp',
    name: 'Industrial Inspection Stamp',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['stamp', 'inspection', 'qc', 'industrial', 'approved'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Circular industrial quality inspection stamp with technical code marks.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 42, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 },
      { type: 'circle', cx: 50, cy: 50, r: 35, fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 2' },
      { type: 'line', x1: 15, y1: 50, x2: 85, y2: 50, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'polygon', points: '50,22 53,30 61,30 55,35 57,43 50,38 43,43 45,35 39,30 47,30', fill: 'currentColor' }
    ]
  },
  {
    id: 'urban_halftone_cluster',
    name: 'Halftone Dot Matrix Cluster',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['halftone', 'dots', 'screen', 'matrix', 'texture'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1,
    hasFill: true,
    description: 'Graduated halftone dot matrix cluster mimicking vintage newsprint.',
    paths: [
      { type: 'circle', cx: 20, cy: 30, r: 6, fill: 'currentColor' },
      { type: 'circle', cx: 38, cy: 30, r: 5, fill: 'currentColor' },
      { type: 'circle', cx: 54, cy: 30, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 68, cy: 30, r: 3, fill: 'currentColor' },
      { type: 'circle', cx: 80, cy: 30, r: 2, fill: 'currentColor' },
      { type: 'circle', cx: 20, cy: 50, r: 5, fill: 'currentColor' },
      { type: 'circle', cx: 38, cy: 50, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 54, cy: 50, r: 3, fill: 'currentColor' },
      { type: 'circle', cx: 68, cy: 50, r: 2, fill: 'currentColor' },
      { type: 'circle', cx: 80, cy: 50, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 20, cy: 70, r: 4, fill: 'currentColor' },
      { type: 'circle', cx: 38, cy: 70, r: 3, fill: 'currentColor' },
      { type: 'circle', cx: 54, cy: 70, r: 2, fill: 'currentColor' },
      { type: 'circle', cx: 68, cy: 70, r: 1.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'urban_barcode_stamp',
    name: 'Digital Optical Barcode',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['barcode', 'code', 'upc', 'product', 'retail', 'scan'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: true,
    description: 'Clean optical retail barcode with catalog numeric frame.',
    paths: [
      { type: 'rect', x: 12, y: 28, width: 4, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 20, y: 28, width: 2, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 26, y: 28, width: 5, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 35, y: 28, width: 2, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 41, y: 28, width: 6, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 51, y: 28, width: 3, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 58, y: 28, width: 1.5, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 63, y: 28, width: 6, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 73, y: 28, width: 2, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 79, y: 28, width: 4, height: 44, fill: 'currentColor' },
      { type: 'rect', x: 86, y: 28, width: 2, height: 44, fill: 'currentColor' }
    ]
  },
  {
    id: 'urban_geometric_fragment',
    name: 'Deconstructed Geometric Polygon',
    category: 'urban_experimental',
    categoryLabel: 'Urban & Experimental',
    tags: ['polygon', 'fragment', 'geometric', 'facet', 'abstract'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Angular deconstructed geometric diamond shard with faceted internal lines.',
    paths: [
      { type: 'polygon', points: '50,12 88,38 74,86 26,86 12,38', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 50, y1: 12, x2: 50, y2: 86, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 12, y1: 38, x2: 88, y2: 38, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'line', x1: 50, y1: 50, x2: 26, y2: 86, stroke: 'currentColor', strokeWidth: 1.2 },
      { type: 'line', x1: 50, y1: 50, x2: 74, y2: 86, stroke: 'currentColor', strokeWidth: 1.2 }
    ]
  },

  // =========================================================================
  // 5. CELEBRATION & CAMPAIGN (8 Items)
  // =========================================================================
  {
    id: 'celeb_champagne_flutes',
    name: 'Toasting Champagne Flutes',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['champagne', 'toast', 'glasses', 'cheers', 'celebration', 'party'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Clinking champagne flutes with rising effervescent celebratory bubbles.',
    paths: [
      // Left Flute
      { type: 'path', d: 'M 24 22 L 38 42 L 36 68 L 24 68', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'line', x1: 34, y1: 68, x2: 34, y2: 84, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 24, y1: 84, x2: 44, y2: 84, stroke: 'currentColor', strokeWidth: 2 },
      // Right Flute Clinking
      { type: 'path', d: 'M 76 22 L 62 42 L 64 68 L 76 68', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'line', x1: 66, y1: 68, x2: 66, y2: 84, stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 56, y1: 84, x2: 76, y2: 84, stroke: 'currentColor', strokeWidth: 2 },
      // Spark at Clink Point
      { type: 'circle', cx: 50, cy: 32, r: 3, fill: 'currentColor' },
      { type: 'circle', cx: 48, cy: 22, r: 1.5, fill: 'currentColor' },
      { type: 'circle', cx: 52, cy: 16, r: 1, fill: 'currentColor' }
    ]
  },
  {
    id: 'celeb_gift_box',
    name: 'Ribbon Wrapped Gift Box',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['gift', 'box', 'present', 'ribbon', 'birthday', 'holiday'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Elegant wrapped gift package with bow ribbon and tag.',
    paths: [
      { type: 'rect', x: 22, y: 38, width: 56, height: 46, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 18, y: 30, width: 64, height: 10, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Vertical Ribbon
      { type: 'line', x1: 50, y1: 30, x2: 50, y2: 84, stroke: 'currentColor', strokeWidth: 3 },
      // Horizontal Ribbon
      { type: 'line', x1: 22, y1: 60, x2: 78, y2: 60, stroke: 'currentColor', strokeWidth: 3 },
      // Top Bow Loops
      { type: 'path', d: 'M 50 30 C 40 18, 32 24, 46 30', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'path', d: 'M 50 30 C 60 18, 68 24, 54 30', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
    ]
  },
  {
    id: 'celeb_firework_burst',
    name: 'Radial Firework Blast',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['firework', 'burst', 'explosion', 'new year', 'party'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Radial celebratory explosion of starlight particles and streamers.',
    paths: [
      { type: 'line', x1: 50, y1: 14, x2: 50, y2: 30, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'line', x1: 50, y1: 70, x2: 50, y2: 86, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'line', x1: 14, y1: 50, x2: 30, y2: 50, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'line', x1: 70, y1: 50, x2: 86, y2: 50, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      // Diagonal Rays
      { type: 'line', x1: 24, y1: 24, x2: 36, y2: 36, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' },
      { type: 'line', x1: 76, y1: 24, x2: 64, y2: 36, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' },
      { type: 'line', x1: 24, y1: 76, x2: 36, y2: 64, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' },
      { type: 'line', x1: 76, y1: 76, x2: 64, y2: 64, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' },
      { type: 'circle', cx: 50, cy: 50, r: 4, fill: 'currentColor' }
    ]
  },
  {
    id: 'celeb_monoline_heart',
    name: 'Geometric Monoline Heart',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['heart', 'love', 'valentines', 'affection', 'romance'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Sleek architectural monoline heart vector with concentric inner resonance.',
    paths: [
      { type: 'path', d: 'M 50 82 C 18 56, 14 32, 32 20 C 44 12, 50 24, 50 24 C 50 24, 56 12, 68 20 C 86 32, 82 56, 50 82 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinejoin: 'round' },
      { type: 'path', d: 'M 50 68 C 30 50, 26 36, 36 28 C 44 22, 50 30, 50 30 C 50 30, 56 22, 64 28 C 74 36, 70 50, 50 68 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
    ]
  },
  {
    id: 'celeb_star_wreath',
    name: 'Festive Holiday Star Wreath',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['wreath', 'holiday', 'christmas', 'seasonal', 'stars'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Circular holiday evergreen wreath crowned with five-pointed starlight.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 36, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'circle', cx: 50, cy: 50, r: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '4 3' },
      // Top Crown Star
      { type: 'polygon', points: '50,10 53,18 61,18 55,23 57,31 50,26 43,31 45,23 39,18 47,18', fill: 'currentColor' }
    ]
  },
  {
    id: 'celeb_confetti_streamers',
    name: 'Dynamic Confetti Streamers',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['confetti', 'party', 'streamers', 'carnival', 'festival'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Curving celebratory party streamers and scattered confetti bursts.',
    paths: [
      { type: 'path', d: 'M 22 18 Q 36 34 26 50 T 40 82', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      { type: 'path', d: 'M 78 18 Q 64 34 74 50 T 60 82', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' },
      // Confetti Shapes
      { type: 'circle', cx: 34, cy: 26, r: 2.5, fill: 'currentColor' },
      { type: 'rect', x: 62, y: 28, width: 4, height: 4, fill: 'currentColor' },
      { type: 'circle', cx: 50, cy: 44, r: 2.5, fill: 'currentColor' },
      { type: 'polygon', points: '42,66 45,71 39,71', fill: 'currentColor' },
      { type: 'circle', cx: 58, cy: 68, r: 2.5, fill: 'currentColor' }
    ]
  },
  {
    id: 'celeb_laurel_banner',
    name: 'Seasonal Laurel Ribbon Banner',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['banner', 'ribbon', 'laurel', 'scroll', 'award'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Symmetrical banner scroll with laurel leaves for milestone announcements.',
    paths: [
      { type: 'path', d: 'M 18 54 L 82 54 L 86 42 L 14 42 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'polyline', points: '14,42 8,50 18,54', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'polyline', points: '86,42 92,50 82,54', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      // Laurel leaf accents
      { type: 'path', d: 'M 50 62 C 42 68, 32 64, 28 58', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'path', d: 'M 50 62 C 58 68, 68 64, 72 58', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'celeb_anniversary_seal',
    name: 'Milestone Anniversary Emblem',
    category: 'celebration_campaign',
    categoryLabel: 'Celebration & Campaign',
    tags: ['anniversary', 'milestone', 'jubilee', 'years', 'celebration'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Circular anniversary commemorative medallion with laurel crown.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 42, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'circle', cx: 50, cy: 50, r: 35, fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 3' },
      { type: 'path', d: 'M 30 50 C 30 62, 40 70, 50 70 C 60 70, 70 62, 70 50', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
    ]
  },

  // =========================================================================
  // 6. BUSINESS & BRANDING (8 Items)
  // =========================================================================
  {
    id: 'biz_drafting_pen',
    name: 'Technical Drafting Pen & Stylus',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['pen', 'stylus', 'design', 'drawing', 'tools', 'creative'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Architectural technical drawing pen with precision steel nib.',
    paths: [
      // Pen Nib
      { type: 'polygon', points: '50,14 42,32 58,32', fill: 'currentColor' },
      { type: 'line', x1: 50, y1: 14, x2: 50, y2: 26, stroke: '#000000', strokeWidth: 1.2 },
      // Pen Barrel
      { type: 'rect', x: 44, y: 32, width: 12, height: 48, rx: 1, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 46, y: 80, width: 8, height: 6, fill: 'currentColor' }
    ]
  },
  {
    id: 'biz_laptop_device',
    name: 'Unibody Laptop Workstation',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['laptop', 'macbook', 'computer', 'digital', 'workstation'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Sleek unibody laptop computer with 16:10 display ratio and trackpad notch.',
    paths: [
      // Screen Display
      { type: 'rect', x: 22, y: 24, width: 56, height: 40, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'rect', x: 26, y: 28, width: 48, height: 32, rx: 1, fill: 'none', stroke: 'currentColor', strokeWidth: 1 },
      // Base Keyboard Deck
      { type: 'polygon', points: '14,68 86,68 82,74 18,74', fill: 'currentColor' },
      // Trackpad Notch
      { type: 'line', x1: 44, y1: 69, x2: 56, y2: 69, stroke: '#000000', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'biz_browser_window',
    name: 'Minimal Browser Window UI',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['browser', 'website', 'ui', 'web', 'internet', 'window'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Minimalist desktop browser frame with navigation window controls.',
    paths: [
      { type: 'rect', x: 14, y: 22, width: 72, height: 56, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 14, y1: 34, x2: 86, y2: 34, stroke: 'currentColor', strokeWidth: 1.5 },
      // Three Window Buttons
      { type: 'circle', cx: 22, cy: 28, r: 2, fill: 'currentColor' },
      { type: 'circle', cx: 28, cy: 28, r: 2, fill: 'currentColor' },
      { type: 'circle', cx: 34, cy: 28, r: 2, fill: 'currentColor' },
      // Search Bar
      { type: 'rect', x: 42, y: 26, width: 36, height: 4, rx: 1, fill: 'none', stroke: 'currentColor', strokeWidth: 1 }
    ]
  },
  {
    id: 'biz_cinema_camera',
    name: 'Cinema Production Camera',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['camera', 'cinema', 'video', 'film', 'production', 'lens'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Professional cinematic camera body with matte box lens shade and top handle.',
    paths: [
      { type: 'rect', x: 30, y: 36, width: 44, height: 38, rx: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Lens & Matte Box
      { type: 'polygon', points: '30,42 16,34 16,68 30,60', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Top Handle
      { type: 'path', d: 'M 40 36 L 40 24 L 64 24 L 64 36', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      // Viewfinder
      { type: 'rect', x: 68, y: 30, width: 14, height: 8, rx: 1, fill: 'currentColor' }
    ]
  },
  {
    id: 'biz_bezier_pen_tool',
    name: 'Vector Bézier Pen Tool',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['pen tool', 'bezier', 'vector', 'curves', 'anchor', 'illustrator'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: true,
    description: 'Graphic design vector anchor node with cubic Bézier control handles.',
    paths: [
      // Curved Path
      { type: 'path', d: 'M 16 68 C 34 24, 66 24, 84 68', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      // Tangent Handle Line
      { type: 'line', x1: 26, y1: 34, x2: 74, y2: 34, stroke: 'currentColor', strokeWidth: 1.2, strokeDasharray: '3 2' },
      { type: 'circle', cx: 26, cy: 34, r: 2.5, fill: 'currentColor' },
      { type: 'circle', cx: 74, cy: 34, r: 2.5, fill: 'currentColor' },
      // Center Anchor Node
      { type: 'rect', x: 47, y: 31, width: 6, height: 6, fill: 'currentColor' }
    ]
  },
  {
    id: 'biz_card_target_mark',
    name: 'Print Registration Target Mark',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['registration', 'print', 'bleed', 'target', 'crop mark'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.5,
    hasFill: false,
    description: 'Offset lithography 4-color print registration alignment crosshair mark.',
    paths: [
      { type: 'circle', cx: 50, cy: 50, r: 32, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'line', x1: 50, y1: 10, x2: 50, y2: 90, stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'line', x1: 10, y1: 50, x2: 90, y2: 50, stroke: 'currentColor', strokeWidth: 1.8 },
      { type: 'circle', cx: 50, cy: 50, r: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1 }
    ]
  },
  {
    id: 'biz_identity_monogram_shield',
    name: 'Brand Identity Monogram Shield',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['shield', 'brand', 'monogram', 'crest', 'corporate'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 2,
    hasFill: false,
    description: 'Corporate heraldic label identity shield with central vertical divider.',
    paths: [
      { type: 'path', d: 'M 50 16 L 80 26 L 80 58 C 80 74, 50 86, 50 86 C 50 86, 20 74, 20 58 L 20 26 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
      { type: 'line', x1: 50, y1: 16, x2: 50, y2: 86, stroke: 'currentColor', strokeWidth: 1.5 }
    ]
  },
  {
    id: 'biz_portfolio_folder',
    name: 'Executive Portfolio Dossier',
    category: 'business_branding',
    categoryLabel: 'Business & Branding',
    tags: ['portfolio', 'dossier', 'folder', 'documents', 'archive'],
    viewBox: '0 0 100 100',
    defaultStrokeWidth: 1.8,
    hasFill: false,
    description: 'Executive document portfolio folder with index tab and document clip.',
    paths: [
      { type: 'path', d: 'M 18 32 L 40 32 L 48 40 L 82 40 L 82 78 L 18 78 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      { type: 'line', x1: 18, y1: 44, x2: 82, y2: 44, stroke: 'currentColor', strokeWidth: 1.5 },
      { type: 'rect', x: 26, y: 52, width: 36, height: 4, rx: 1, fill: 'currentColor' }
    ]
  }
];

/**
 * Helper to find an illustration by ID
 */
export function getLineArtItemById(id: string): LineArtItem | undefined {
  return MASTER_LINE_ART_LIBRARY.find(item => item.id === id);
}

/**
 * Filter line art by category and search query
 */
export function queryLineArtLibrary(category?: string, query?: string): LineArtItem[] {
  return MASTER_LINE_ART_LIBRARY.filter(item => {
    const matchesCategory = !category || category === 'ALL' || item.category === category;
    const q = query ? query.toLowerCase().trim() : '';
    const matchesQuery = !q || 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
}
