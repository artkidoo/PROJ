import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LyricalMonogram, LyricalHorizontalLogo, LyricalPrimaryLogo } from '../brand/LogoSystem';
import { 
  Download, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Maximize2, 
  RotateCcw,
  CheckCircle2,
  Sliders,
  Copy
} from 'lucide-react';

export type CreativeTemplateType = 
  | 'brand_announcement'
  | 'logo_reveal'
  | 'company_intro'
  | 'artist_signing'
  | 'coming_soon'
  | 'out_now'
  | 'social_quote';

export type CreativeFormat = '1:1 Square' | '9:16 Vertical' | '16:9 Landscape';

interface CreativePreset {
  id: CreativeTemplateType;
  name: string;
  category: string;
  defaultHeadline: string;
  defaultSubtitle: string;
  defaultArtist: string;
  defaultTagline: string;
  defaultDate: string;
}

const TEMPLATE_PRESETS: CreativePreset[] = [
  {
    id: 'brand_announcement',
    name: 'Brand Announcement',
    category: 'Corporate Reveal',
    defaultHeadline: 'A NEW ERA IN SOUND',
    defaultSubtitle: 'LYRICAL ENT officially launches its flagship Sound Lab and sovereign artist development roster.',
    defaultArtist: 'LYRICAL ENT',
    defaultTagline: 'LONDON · LOS ANGELES',
    defaultDate: 'GLOBAL LAUNCH 2026'
  },
  {
    id: 'logo_reveal',
    name: 'Logo & Monogram Reveal',
    category: 'Identity Showcase',
    defaultHeadline: 'THE ARCHITECTURE OF SOUND',
    defaultSubtitle: 'Introducing the official LE monogram — engineered with mathematical precision for contemporary vinyl, digital soundwaves, and visual identity.',
    defaultArtist: 'LE EMBLEM',
    defaultTagline: 'REGISTERED TRADEMARK',
    defaultDate: 'ESTABLISHED 2026'
  },
  {
    id: 'company_intro',
    name: 'Company Introduction',
    category: 'Press & Media',
    defaultHeadline: 'REDEFINING CONTEMPORARY ENTERTAINMENT',
    defaultSubtitle: 'Independent record label, Dolby Atmos production sound lab, and worldwide master rights management.',
    defaultArtist: 'LYRICAL ENT LLC',
    defaultTagline: 'SONIC ARCHITECTURE & A&R',
    defaultDate: 'LONDON · LOS ANGELES'
  },
  {
    id: 'artist_signing',
    name: 'Artist Signing Reveal',
    category: 'Roster Announcement',
    defaultHeadline: 'WELCOME TO THE ROSTER',
    defaultSubtitle: 'LYRICAL ENT is proud to announce the exclusive worldwide signing of recording artist Sariyah Cole.',
    defaultArtist: 'SARIYAH COLE',
    defaultTagline: 'EXCLUSIVE MASTER RECORDING AGREEMENT',
    defaultDate: 'DEBUT SINGLE FORTHCOMING'
  },
  {
    id: 'coming_soon',
    name: 'Coming-Soon Music Release',
    category: 'Release Rollout',
    defaultHeadline: 'COMING SOON',
    defaultSubtitle: 'The highly anticipated debut studio single engineered at London Sound Lab A.',
    defaultArtist: 'SARIYAH COLE — "MONOCHROME STATE"',
    defaultTagline: 'PRE-SAVE ON ALL PLATFORMS',
    defaultDate: '07 · 11 · 2026'
  },
  {
    id: 'out_now',
    name: 'Out-Now Music Release',
    category: 'Release Rollout',
    defaultHeadline: 'OUT NOW WORLDWIDE',
    defaultSubtitle: 'Stream in uncompressed 24-bit/96kHz lossless audio and Dolby Atmos spatial sound on all DSP platforms.',
    defaultArtist: 'SARIYAH COLE — "MONOCHROME STATE"',
    defaultTagline: 'AVAILABLE EVERYWHERE',
    defaultDate: 'NOW STREAMING'
  },
  {
    id: 'social_quote',
    name: 'General Editorial / Lyric Card',
    category: 'Social Media',
    defaultHeadline: '“IN THE SILENCE BETWEEN FREQUENCIES, WE BUILD TIMELESS SOUND.”',
    defaultSubtitle: 'A philosophy of uncompromising sonic clarity, high-contrast visual identity, and true artistic ownership.',
    defaultArtist: 'LYRICAL ENT EDITORIAL',
    defaultTagline: 'STUDIO NOTE NO. 04',
    defaultDate: 'Q4 2026'
  }
];

export const LaunchCreativeStudio: React.FC = () => {
  const { artists, releases } = useApp();

  const [selectedPresetId, setSelectedPresetId] = useState<CreativeTemplateType>('brand_announcement');
  const [format, setFormat] = useState<CreativeFormat>('1:1 Square');
  const [theme, setTheme] = useState<'noir' | 'minimal_white' | 'dark_grid'>('noir');

  const currentPreset = TEMPLATE_PRESETS.find(p => p.id === selectedPresetId) || TEMPLATE_PRESETS[0];

  // Editable fields
  const [headline, setHeadline] = useState(currentPreset.defaultHeadline);
  const [subtitle, setSubtitle] = useState(currentPreset.defaultSubtitle);
  const [artistName, setArtistName] = useState(currentPreset.defaultArtist);
  const [tagline, setTagline] = useState(currentPreset.defaultTagline);
  const [dateStr, setDateStr] = useState(currentPreset.defaultDate);

  const handleSelectPreset = (p: CreativePreset) => {
    setSelectedPresetId(p.id);
    setHeadline(p.defaultHeadline);
    setSubtitle(p.defaultSubtitle);
    setArtistName(p.defaultArtist);
    setTagline(p.defaultTagline);
    setDateStr(p.defaultDate);
  };

  // Canvas High-Res Export
  const handleExportImage = (fileType: 'png' | 'jpeg') => {
    let targetWidth = 1080;
    let targetHeight = 1080;

    if (format === '9:16 Vertical') {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (format === '16:9 Landscape') {
      targetWidth = 1920;
      targetHeight = 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background
    if (theme === 'noir') {
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Subtle architectural perimeter line
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, targetWidth - 120, targetHeight - 120);

    } else if (theme === 'minimal_white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeRect(60, 60, targetWidth - 120, targetHeight - 120);

    } else { // dark_grid
      ctx.fillStyle = '#0F0F0F';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Grid pattern
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = 2;
      const step = 80;
      for (let x = 0; x < targetWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
        ctx.stroke();
      }
      for (let y = 0; y < targetHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, targetWidth - 120, targetHeight - 120);
    }

    const isLight = theme === 'minimal_white';
    const primaryColor = isLight ? '#000000' : '#FFFFFF';
    const secondaryColor = isLight ? '#555555' : '#888888';
    const accentLineColor = isLight ? '#CCCCCC' : '#2A2A2A';

    // 2. Draw Top Bar Brand
    ctx.textAlign = 'left';
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LYRICAL ENT', 100, 140);

    ctx.fillStyle = secondaryColor;
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText('RECORD LABEL & PRODUCTION LAB', 100, 175);

    // Top Right Monogram mark
    if (isLight) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(targetWidth - 190, 95, 90, 90);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LE', targetWidth - 145, 158);
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(targetWidth - 190, 95, 90, 90);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LE', targetWidth - 145, 158);
    }

    // 3. Central Monogram Watermark or Accent
    if (selectedPresetId === 'logo_reveal') {
      const centerX = targetWidth / 2;
      const centerY = format === '9:16 Vertical' ? targetHeight * 0.42 : targetHeight * 0.45;

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(centerX - 160, centerY - 160, 320, 320);

      ctx.textAlign = 'center';
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 160px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LE', centerX, centerY + 58);
    }

    // 4. Middle / Bottom Typography
    const textStartY = format === '9:16 Vertical' ? targetHeight * 0.58 : targetHeight * 0.52;
    ctx.textAlign = 'left';

    // Category / Tagline
    ctx.fillStyle = secondaryColor;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(tagline.toUpperCase(), 100, textStartY);

    // Headline
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
    
    // Multi-line wrap headline
    const maxTextWidth = targetWidth - 200;
    const words = headline.split(' ');
    let line = '';
    let curY = textStartY + 75;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(line, 100, curY);
        line = words[n] + ' ';
        curY += 75;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 100, curY);

    curY += 30;

    // Subtitle
    ctx.fillStyle = secondaryColor;
    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    const subWords = subtitle.split(' ');
    let subLine = '';
    for (let n = 0; n < subWords.length; n++) {
      const testLine = subLine + subWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(subLine, 100, curY);
        subLine = subWords[n] + ' ';
        curY += 36;
      } else {
        subLine = testLine;
      }
    }
    ctx.fillText(subLine, 100, curY);

    // 5. Bottom Metadata Bar
    const footerY = targetHeight - 110;
    ctx.strokeStyle = accentLineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, footerY - 30);
    ctx.lineTo(targetWidth - 100, footerY - 30);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(artistName.toUpperCase(), 100, footerY + 10);

    ctx.textAlign = 'right';
    ctx.fillStyle = secondaryColor;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(dateStr.toUpperCase(), targetWidth - 100, footerY + 10);

    // Trigger download
    const mime = fileType === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = fileType === 'jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.download = `LYRICAL_${selectedPresetId.toUpperCase()}_${format.replace(/\s+/g, '_')}.${ext}`;
    a.href = canvas.toDataURL(mime, 0.95);
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>CREATIVE CAMPAIGN STUDIO</span>
            <span>/</span>
            <span className="text-white font-semibold">LAUNCH CREATIVE TEMPLATES</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            Official Launch Creative Generator
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Produce professional social announcements, artist signing reveals, and release rollout graphics in 1:1, 9:16, and 16:9 aspect ratios
          </p>
        </div>

        {/* Quick Export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportImage('png')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white text-black hover:bg-neutral-200 rounded font-semibold transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download PNG (1080p)</span>
          </button>

          <button
            onClick={() => handleExportImage('jpeg')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download JPEG</span>
          </button>
        </div>
      </div>

      {/* Preset Picker Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TEMPLATE_PRESETS.map(preset => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-2.5 rounded text-left border transition-all ${
                isSelected
                  ? 'bg-[#181818] border-white text-white shadow-sm'
                  : 'bg-[#0E0E0E] border-[#222222] text-neutral-400 hover:text-white hover:border-[#333333]'
              }`}
            >
              <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                {preset.category}
              </div>
              <div className="text-xs font-bold truncate text-white">
                {preset.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Controls vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              DELIVERABLE SPECIFICATIONS
            </span>
          </div>

          {/* Aspect Ratio Switcher */}
          <div>
            <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5">
              FORMAT / ASPECT RATIO
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1 Square', '9:16 Vertical', '16:9 Landscape'] as CreativeFormat[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                    format === f
                      ? 'bg-white text-black font-semibold border-white'
                      : 'bg-[#141414] text-neutral-400 border-[#242424] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Switcher */}
          <div>
            <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5">
              VISUAL PALETTE THEME
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('noir')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                  theme === 'noir'
                    ? 'bg-black text-white border-white'
                    : 'bg-[#141414] text-neutral-400 border-[#242424] hover:text-white'
                }`}
              >
                Noir Black
              </button>
              <button
                type="button"
                onClick={() => setTheme('minimal_white')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                  theme === 'minimal_white'
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#141414] text-neutral-400 border-[#242424] hover:text-white'
                }`}
              >
                Pure White
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark_grid')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                  theme === 'dark_grid'
                    ? 'bg-[#1F1F1F] text-white border-white'
                    : 'bg-[#141414] text-neutral-400 border-[#242424] hover:text-white'
                }`}
              >
                Studio Grid
              </button>
            </div>
          </div>

          {/* Text Form */}
          <div className="space-y-3 pt-2 border-t border-[#1C1C1C]">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                CATEGORY / TAGLINE
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                MAIN HEADLINE *
              </label>
              <textarea
                rows={2}
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                SUPPORTING COPY / SUBTITLE
              </label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  ARTIST / SUBJECT
                </label>
                <input
                  type="text"
                  value={artistName}
                  onChange={e => setArtistName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  RELEASE DATE / STAMP
                </label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#080808] border border-[#1A1A1A] rounded-lg min-h-[520px]">
          {/* Dynamic Aspect Ratio Preview Box */}
          <div
            className={`w-full max-w-[460px] rounded shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden select-none border ${
              format === '1:1 Square'
                ? 'aspect-square'
                : format === '9:16 Vertical'
                ? 'aspect-[9/16] max-w-[340px]'
                : 'aspect-[16/9]'
            } ${
              theme === 'noir'
                ? 'bg-[#0A0A0A] text-white border-[#242424]'
                : theme === 'minimal_white'
                ? 'bg-white text-black border-neutral-300'
                : 'bg-[#111111] text-white border-[#2A2A2A]'
            }`}
          >
            {/* Top Brand Bar */}
            <div className="flex items-start justify-between border-b border-current/20 pb-3">
              <div>
                <div className="text-sm font-extrabold tracking-widest uppercase">LYRICAL ENT</div>
                <div className="text-[8px] font-mono opacity-60 uppercase tracking-wider">
                  Record Label &amp; Production Lab
                </div>
              </div>
              <LyricalMonogram
                size={30}
                framed={true}
                theme={theme === 'minimal_white' ? 'monochrome-black' : 'monochrome-white'}
              />
            </div>

            {/* Central Graphic for Logo Reveal */}
            {selectedPresetId === 'logo_reveal' && (
              <div className="my-auto flex justify-center">
                <div className="w-24 h-24 border-2 border-current flex items-center justify-center text-4xl font-extrabold font-mono">
                  LE
                </div>
              </div>
            )}

            {/* Main Typography */}
            <div className="my-auto space-y-2">
              <div className="text-[9px] font-mono font-bold tracking-wider opacity-70 uppercase">
                {tagline}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight uppercase font-sans">
                {headline}
              </h2>
              <p className="text-[11px] opacity-70 leading-relaxed max-w-sm">
                {subtitle}
              </p>
            </div>

            {/* Bottom Strip */}
            <div className="border-t border-current/20 pt-3 flex items-center justify-between text-[9px] font-mono">
              <span className="font-bold uppercase tracking-wider">{artistName}</span>
              <span className="opacity-70 uppercase">{dateStr}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-[10px] font-mono text-neutral-400">
            <span>FORMAT: <strong className="text-white">{format}</strong></span>
            <span>·</span>
            <span>THEME: <strong className="text-white uppercase">{theme}</strong></span>
            <span>·</span>
            <span>READY FOR INSTANT PNG / JPEG DOWNLOAD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
