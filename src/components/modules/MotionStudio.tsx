/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Motion Studio & Animated Promotional Assets
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  Pause, 
  Film, 
  Sliders, 
  Download, 
  Sparkles, 
  Clock, 
  Smartphone, 
  Monitor,
  CheckCircle2,
  Layers,
  FileCode
} from 'lucide-react';
import { LyricalMonogram } from '../brand/LogoSystem';

interface MotionTemplate {
  id: string;
  title: string;
  category: string;
  aspectRatio: '1:1 Square' | '9:16 Vertical Story' | '16:9 Landscape';
  defaultDuration: number;
  preset: 'Cinematic Reveal' | 'Typewriter' | 'Slow Zoom' | 'Beat Typography' | 'Glitch' | 'Sliding Title';
  description: string;
}

const MOTION_TEMPLATES: MotionTemplate[] = [
  { id: 'mot-01', title: 'Song Announcement Motion Banner', category: 'Music Promotion', aspectRatio: '1:1 Square', defaultDuration: 15, preset: 'Cinematic Reveal', description: 'Smooth atmospheric opacity fade with architectural border expansion' },
  { id: 'mot-02', title: 'Coming Soon Countdown Story', category: 'Pre-Launch', aspectRatio: '9:16 Vertical Story', defaultDuration: 10, preset: 'Typewriter', description: 'Monospace terminal character-by-character reveal with blinking cursor' },
  { id: 'mot-03', title: 'Cover-Art 35mm Reveal', category: 'Launch Day', aspectRatio: '1:1 Square', defaultDuration: 12, preset: 'Slow Zoom', description: 'Continuous optical push-in with subtle analog film grain texture' },
  { id: 'mot-04', title: 'OUT NOW Kinetic Video Drop', category: 'Launch Day', aspectRatio: '16:9 Landscape', defaultDuration: 20, preset: 'Beat Typography', description: 'Rhythmic scale-bounce synced to 120 BPM tempo transients' },
  { id: 'mot-05', title: 'Artist Introduction Feature', category: 'Artist Branding', aspectRatio: '9:16 Vertical Story', defaultDuration: 15, preset: 'Glitch', description: 'RGB split displacement with horizontal scanline interference' },
  { id: 'mot-06', title: 'Music Video Premiere Trailer', category: 'Video Promotion', aspectRatio: '16:9 Landscape', defaultDuration: 30, preset: 'Sliding Title', description: 'Left-to-right cinematic letter-spacing slide with shutter release' }
];

export const MotionStudio: React.FC = () => {
  const { releases, artists, activeWorkspace } = useApp();
  const [templates] = useState<MotionTemplate[]>(MOTION_TEMPLATES);
  const [selectedTpl, setSelectedTpl] = useState<MotionTemplate>(MOTION_TEMPLATES[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [customText, setCustomText] = useState<string>('MONOCHROME STATE · OUT NOW');
  const [artistName, setArtistName] = useState<string>('SARIYAH COLE');
  const [durationSec, setDurationSec] = useState<number>(15);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real Export: Downloads Keyframe Motion Canvas PNG + Motion Specification JSON
  const handleExportMotionAsset = () => {
    const canvas = document.createElement('canvas');
    let w = 1200;
    let h = 1200;
    if (selectedTpl.aspectRatio === '9:16 Vertical Story') {
      w = 1080;
      h = 1920;
    } else if (selectedTpl.aspectRatio === '16:9 Landscape') {
      w = 1920;
      h = 1080;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, w, h);

    // Frame
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Top Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${activeWorkspace.name.toUpperCase()} · MOTION ATELIER`, 80, 130);

    ctx.fillStyle = '#888888';
    ctx.font = '500 20px monospace';
    ctx.fillText(`PRESET: ${selectedTpl.preset.toUpperCase()} · ${selectedTpl.aspectRatio.toUpperCase()}`, 80, 170);

    // Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 64px sans-serif';
    ctx.fillText(customText.toUpperCase(), 80, h / 2 - 20);

    // Subtitle
    ctx.fillStyle = '#D4D4D4';
    ctx.font = '600 32px monospace';
    ctx.fillText(artistName.toUpperCase(), 80, h / 2 + 50);

    // Motion timing info
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '400 22px monospace';
    ctx.fillText(`TIMECODE: 00:00:${durationSec < 10 ? '0' + durationSec : durationSec}:00 · 60 FPS MOTION KEYFRAME`, 80, h - 140);
    ctx.fillText(`ANIMATION PRESET: ${selectedTpl.preset} (${selectedTpl.description})`, 80, h - 100);

    // Download Keyframe PNG
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    const wsSlug = activeWorkspace.name.toLowerCase().replace(/\s+/g, '_');
    a.download = `${wsSlug}_motion_${selectedTpl.preset.toLowerCase().replace(/\s+/g, '_')}_keyframe.png`;
    a.click();

    // Also download Motion Spec JSON
    const spec = {
      label: activeWorkspace.name.toUpperCase(),
      templateTitle: selectedTpl.title,
      preset: selectedTpl.preset,
      aspectRatio: selectedTpl.aspectRatio,
      durationSeconds: durationSec,
      targetFrameRate: 60,
      audioSyncBpm: 120,
      headline: customText,
      artist: artistName,
      created: new Date().toISOString()
    };
    const specBlob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const specUrl = URL.createObjectURL(specBlob);
    const specLink = document.createElement('a');
    specLink.href = specUrl;
    const wsSlug2 = activeWorkspace.name.toLowerCase().replace(/\s+/g, '_');
    specLink.download = `${wsSlug2}_motion_${selectedTpl.preset.toLowerCase().replace(/\s+/g, '_')}_spec.json`;
    specLink.click();
    URL.revokeObjectURL(specUrl);

    showToast('Motion Keyframe PNG & Animation Spec JSON exported');
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-white/20 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              ANIMATED PROMOTIONAL ASSETS · REELS, STORIES &amp; TEASERS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase break-words">
            MOTION STUDIO &amp; ANIMATED ASSETS
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Configure dynamic motion graphics with cinematic reveals, typewriter effects, slow zooms, and beat typography for social platforms and streaming announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-neutral-400">RENDER ENGINE:</span>
          <span className="text-white bg-[#161616] border border-[#2B2B2B] px-2.5 py-1 rounded">
            CSS / CANVAS 60FPS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Templates Selection (4 cols) */}
        <div className="lg:col-span-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 sm:p-5 space-y-4">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight uppercase font-mono border-b border-[#1C1C1C] pb-3">
            Motion Design Presets
          </h2>

          <div className="space-y-2.5 font-mono text-xs">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => {
                  setSelectedTpl(tpl);
                  setDurationSec(tpl.defaultDuration);
                }}
                className={`w-full text-left p-3 rounded border transition-all ${
                  selectedTpl.id === tpl.id 
                    ? 'bg-[#1C1C1C] border-white text-white font-bold shadow-sm' 
                    : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-white text-xs truncate">{tpl.title}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0">{tpl.aspectRatio.split(' ')[0]}</span>
                </div>
                <div className="text-[10px] text-neutral-400">Preset: {tpl.preset} · {tpl.defaultDuration}s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Preview & Controls (8 cols) */}
        <div className="lg:col-span-8 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1C1C] pb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white tracking-tight uppercase font-mono truncate">
                {selectedTpl.title}
              </h2>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                Preset: <strong className="text-white">{selectedTpl.preset}</strong> — {selectedTpl.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-mono font-bold text-xs rounded hover:bg-neutral-200 transition-colors shadow-sm"
              >
                {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                <span>{isPlaying ? 'Pause Motion' : 'Play Motion'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport Simulator with CSS Keyframe Animation */}
          <div className="aspect-video w-full bg-[#050505] border border-[#222222] rounded-lg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-3 font-mono text-[10px] text-neutral-500 flex items-center gap-1.5">
              <Film size={12} />
              <span>CANVAS ({selectedTpl.aspectRatio}) — {durationSec} SEC TIMECODE</span>
            </div>

            {/* Dynamic Animated Content Container */}
            <div 
              className={`space-y-3 z-10 p-4 transition-all duration-700 ${
                isPlaying
                  ? selectedTpl.preset === 'Slow Zoom'
                    ? 'scale-105 transition-transform duration-1000'
                    : selectedTpl.preset === 'Glitch'
                    ? 'animate-pulse'
                    : selectedTpl.preset === 'Sliding Title'
                    ? 'translate-x-1 transition-transform'
                    : 'animate-in fade-in duration-500'
                  : 'opacity-90'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white flex items-center justify-center mx-auto font-mono font-black text-lg sm:text-xl bg-black text-white shadow-xl uppercase">
                {activeWorkspace.name.substring(0, 2)}
              </div>
              <h1 className="font-mono font-black text-xl sm:text-2xl lg:text-3xl text-white uppercase tracking-tight break-words max-w-lg">
                {customText}
              </h1>
              <p className="font-mono text-xs sm:text-sm text-neutral-300 uppercase tracking-widest">
                {artistName} · {activeWorkspace.name.toUpperCase()} SOUND LABS
              </p>
              <div className="font-mono text-[10px] text-neutral-500 uppercase">
                MOTION PATTERN: {selectedTpl.preset}
              </div>
            </div>
          </div>

          {/* Controls Form (Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-neutral-400 mb-1">ANIMATED TITLE TEXT</label>
              <input
                type="text"
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                className="w-full bg-[#121212] border border-[#262626] rounded px-3 py-2 text-white uppercase focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">DURATION (SECONDS)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={durationSec}
                onChange={e => setDurationSec(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#262626] rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          {/* Export Action */}
          <div className="pt-4 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-neutral-500">
              EXPORTS LOSSLESS KEYFRAME PNG + ANIMATION JSON TIMECODE
            </span>
            <button
              onClick={handleExportMotionAsset}
              className="flex items-center gap-2 py-2.5 px-5 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 rounded transition-colors shadow"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Export Motion Package</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
