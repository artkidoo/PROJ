import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LyricalMonogram, 
  LyricalPrimaryLogo, 
  LyricalHorizontalLogo, 
  LyricalSquareIcon, 
  LyricalFavicon,
  WorkspaceLogo,
  triggerSvgDownload,
  triggerPngDownload,
  getRawSvgString
} from '../brand/LogoSystem';
import { 
  LyricalLogoConcept, 
  LOGO_CONCEPTS_METADATA, 
  LogoConceptId, 
  LogoVariant, 
  LogoColorTheme,
  downloadConceptSvg, 
  downloadConceptPng, 
  getConceptSvgString 
} from '../brand/LogoConcepts';
import { generateBrandGuidelinesPdf } from '../../utils/pdfGenerator';
import { 
  Download, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck, 
  Eye, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Sliders,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const BrandIdentityManager: React.FC = () => {
  const { 
    brandAssets, 
    addBrandAsset, 
    brandGuidelines, 
    updateBrandGuidelines,
    activeWorkspace
  } = useApp();

  const workspaceBrandAssets = brandAssets.filter(a => a.workspaceId === activeWorkspace.id);

  const [activeTab, setActiveTab] = useState<'logos' | 'concepts' | 'guidelines' | 'assets'>('concepts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'white-on-black' | 'black-on-white'>('white-on-black');
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);

  // Logo Concepts Lab State
  const [conceptVariant, setConceptVariant] = useState<LogoVariant>('primary');
  const [conceptTheme, setConceptTheme] = useState<LogoColorTheme>('monochrome-white');
  const [conceptTransparent, setConceptTransparent] = useState<boolean>(true);
  const [activePrimaryConceptId, setActivePrimaryConceptId] = useState<LogoConceptId>(() => {
    try {
      return (localStorage.getItem(`${activeWorkspace.id}_active_logo_concept`) as LogoConceptId) || 'classic';
    } catch {
      return 'classic';
    }
  });

  const handleSetPrimaryConcept = (id: LogoConceptId) => {
    setActivePrimaryConceptId(id);
    try {
      localStorage.setItem(`${activeWorkspace.id}_active_logo_concept`, id);
    } catch {}
  };

  // Editable brand guidelines local state
  const [guidelinesForm, setGuidelinesForm] = useState(brandGuidelines);

  const handleCopySvg = (
    type: 'primary' | 'horizontal' | 'monogram' | 'square' | 'favicon',
    theme: 'black-on-white' | 'white-on-black',
    key: string
  ) => {
    const svgCode = getRawSvgString(type, theme);
    navigator.clipboard.writeText(svgCode);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveGuidelines = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandGuidelines(guidelinesForm);
    setIsEditingGuidelines(false);
  };

  const PALETTE = [
    { name: 'Pure Black', hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)', role: 'Dominant canvas background, primary dark contrast' },
    { name: 'Pure White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)', role: 'Primary logotype, headlines, high-intent action CTAs' },
    { name: 'Charcoal', hex: '#171717', rgb: 'rgb(23, 23, 23)', hsl: 'hsl(0, 0%, 9%)', role: 'Tactile surface elevation, cards, secondary containers' },
    { name: 'Neutral Grey', hex: '#A3A3A3', rgb: 'rgb(163, 163, 163)', hsl: 'hsl(0, 0%, 64%)', role: 'Metadata, secondary labels, divider accents' },
    { name: 'Studio Obsidian', hex: '#0A0A0A', rgb: 'rgb(10, 10, 10)', hsl: 'hsl(0, 0%, 4%)', role: 'Main app workspace field' },
    { name: 'Hairline Charcoal', hex: '#262626', rgb: 'rgb(38, 38, 38)', hsl: 'hsl(0, 0%, 15%)', role: 'Structural 1px hairline dividers' }
  ];

  const LOGO_CARDS = [
    {
      id: 'primary',
      title: 'Primary Logo (Stacked)',
      subtitle: 'Monogram + LYRICAL ENT + Studio Descriptor',
      description: 'The master brand lockup for album covers, corporate stationery, vinyl packaging, and official releases.',
      type: 'primary' as const,
      component: (theme: 'black-on-white' | 'white-on-black') => (
        <LyricalPrimaryLogo 
          size={180} 
          theme={theme === 'black-on-white' ? 'monochrome-black' : 'monochrome-white'} 
          showSubtext={true}
        />
      )
    },
    {
      id: 'horizontal',
      title: 'Horizontal Logo (Inline)',
      subtitle: 'LE Monogram + LYRICAL ENT Wordmark',
      description: 'Optimized for tight horizontal banners, streaming platform headers, navigation bars, and video lower-thirds.',
      type: 'horizontal' as const,
      component: (theme: 'black-on-white' | 'white-on-black') => (
        <WorkspaceLogo 
          workspaceId={activeWorkspace.id} 
          workspaceName={activeWorkspace.name} 
          height={38} 
          theme={theme === 'black-on-white' ? 'monochrome-black' : 'monochrome-white'}
        />
      )
    },
    {
      id: 'monogram',
      title: 'LE Monogram Emblem',
      subtitle: 'Architectural Geometric Seal',
      description: 'Compact standalone monogram for vinyl run-out matrix etching, apparel tags, microphone flags, and watermarks.',
      type: 'monogram' as const,
      component: (theme: 'black-on-white' | 'white-on-black') => (
        <LyricalMonogram 
          size={64} 
          framed={true} 
          theme={theme === 'black-on-white' ? 'monochrome-black' : 'monochrome-white'} 
        />
      )
    },
    {
      id: 'square',
      title: 'Square Social / Cover Icon',
      subtitle: '1:1 Ratio Profile & Streaming Mark',
      description: 'Pixel-perfect 1:1 badge engineered for Spotify artist avatars, Apple Music profile badges, and YouTube channels.',
      type: 'square' as const,
      component: (theme: 'black-on-white' | 'white-on-black') => (
        <LyricalSquareIcon 
          size={80} 
          theme={theme === 'black-on-white' ? 'monochrome-black' : 'monochrome-white'} 
        />
      )
    },
    {
      id: 'favicon',
      title: 'Official Favicon & App Mark',
      subtitle: '32x32 / 64x64 Micro-alignment',
      description: 'High-contrast micro-mark calibrated for browser tabs, mobile bookmarks, and high-DPI application icons.',
      type: 'favicon' as const,
      component: (theme: 'black-on-white' | 'white-on-black') => (
        <div className="flex items-center gap-4">
          <LyricalFavicon size={32} theme={theme === 'black-on-white' ? 'light' : 'dark'} />
          <LyricalFavicon size={48} theme={theme === 'black-on-white' ? 'light' : 'dark'} />
          <LyricalFavicon size={64} theme={theme === 'black-on-white' ? 'light' : 'dark'} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>{activeWorkspace.name}</span>
            <span>/</span>
            <span>OFFICIAL BRAND IDENTITY &amp; DESIGN SYSTEM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
            BRAND IDENTITY &amp; LOGO SYSTEM
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Central repository of the official {activeWorkspace.name} logo system, geometric monogram, and editable guidelines.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'concepts' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles size={12} />
            <span>Logo Concept Lab (7 Directions)</span>
          </button>
          <button
            onClick={() => setActiveTab('logos')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'logos' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Official Approved
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'guidelines' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Brand Guidelines
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'assets' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Asset Vault
          </button>
        </div>
      </div>

      {/* 0. LOGO CONCEPTS LAB TAB (PHASE 3) */}
      {activeTab === 'concepts' && (
        <div className="space-y-6">
          {/* Controls Ribbon */}
          <div className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <h2 className="text-sm font-semibold text-white font-mono uppercase">
                  7 Advanced Logo Directions &amp; Vector System
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Compare original music-industry geometry: studio condenser microphone integration, vinyl soundwaves, optical negative space, archival seal, and bespoke wordmark.
              </p>
            </div>

            {/* Global Variant & Theme Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1 bg-[#161616] border border-[#262626] p-1 rounded">
                {(['primary', 'monogram', 'horizontal', 'seal', 'icon'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setConceptVariant(v)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      conceptVariant === v ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#161616] border border-[#262626] p-1 rounded">
                {(['monochrome-white', 'monochrome-black', 'gold-accent'] as const).map(th => (
                  <button
                    key={th}
                    onClick={() => setConceptTheme(th)}
                    className={`px-2 py-1 rounded text-[11px] capitalize transition-colors ${
                      conceptTheme === th ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {th.replace('monochrome-', '').replace('-accent', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Concept Banner */}
          <div className="p-3 bg-[#121212] border border-white/20 rounded-lg flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-white" />
              <span>
                CURRENT PRIMARY IDENTITY: <strong className="text-white uppercase">{LOGO_CONCEPTS_METADATA.find(m => m.id === activePrimaryConceptId)?.name}</strong>
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Synced across Design Studio, Business Cards &amp; Templates
            </span>
          </div>

          {/* Grid of 7 Logo Concepts */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {LOGO_CONCEPTS_METADATA.map((meta) => {
              const isPrimary = activePrimaryConceptId === meta.id;
              const copyKey = `concept_${meta.id}`;
              const isCopied = copiedKey === copyKey;

              return (
                <div
                  key={meta.id}
                  className={`border rounded-lg bg-[#0C0C0C] flex flex-col justify-between overflow-hidden transition-all ${
                    isPrimary ? 'border-white ring-1 ring-white/50 shadow-xl' : 'border-[#1E1E1E] hover:border-[#333]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#1A1A1A] flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        {meta.category}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                        {meta.name}
                      </h3>
                    </div>
                    {isPrimary && (
                      <span className="px-2 py-0.5 bg-white text-black font-mono font-bold text-[9px] rounded uppercase shrink-0">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Logo Canvas Preview */}
                  <div 
                    className={`h-52 flex items-center justify-center p-6 transition-colors ${
                      conceptTheme === 'monochrome-black' 
                        ? 'bg-[#F5F5F0] text-black' 
                        : 'bg-[#000000] text-white'
                    }`}
                  >
                    <LyricalLogoConcept 
                      conceptId={meta.id}
                      variant={conceptVariant}
                      theme={conceptTheme}
                      size={conceptVariant === 'horizontal' ? 64 : 130}
                      transparent={true}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 bg-[#0A0A0A] border-t border-[#1A1A1A] space-y-3 font-mono text-xs">
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans line-clamp-2">
                      {meta.description}
                    </p>

                    <div className="text-[10px] text-neutral-500 pt-1 border-t border-[#161616]">
                      <strong className="text-neutral-400">BEST FOR:</strong> {meta.bestFor}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-[#1A1A1A] space-y-2">
                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimaryConcept(meta.id)}
                          className="w-full py-1.5 bg-[#171717] hover:bg-white hover:text-black border border-[#2B2B2B] text-neutral-200 rounded font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check size={12} />
                          <span>Set As Primary Identity</span>
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const svgCode = getConceptSvgString(meta.id, conceptVariant, conceptTheme, conceptTransparent);
                            navigator.clipboard.writeText(svgCode);
                            setCopiedKey(copyKey);
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          className="flex-1 py-1.5 px-2 bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] text-neutral-300 rounded text-center text-[10px] flex items-center justify-center gap-1 transition-colors"
                        >
                          {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{isCopied ? 'SVG Copied' : 'Copy SVG'}</span>
                        </button>

                        <button
                          onClick={() => downloadConceptSvg(meta.id, conceptVariant, conceptTheme, true)}
                          className="p-1.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] text-neutral-300 hover:text-white rounded"
                          title="Download Vector SVG"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          onClick={() => downloadConceptPng(meta.id, conceptVariant, conceptTheme, true, 1600)}
                          className="p-1.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] text-neutral-300 hover:text-white rounded"
                          title="Download 300 DPI Transparent PNG"
                        >
                          <FileText size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. OFFICIAL LOGO SYSTEM TAB */}
      {activeTab === 'logos' && (
        <div className="space-y-6">
          {/* Theme switcher banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E]">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono uppercase">
                Active Logo Variants
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Toggle display canvas to inspect both White on Black and Black on White contrast
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500">SURFACE:</span>
              <div className="flex items-center gap-1 p-1 bg-[#161616] border border-[#262626] rounded">
                <button
                  onClick={() => setPreviewTheme('white-on-black')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    previewTheme === 'white-on-black' ? 'bg-[#2E2E2E] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  White on Black
                </button>
                <button
                  onClick={() => setPreviewTheme('black-on-white')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    previewTheme === 'black-on-white' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Black on White
                </button>
              </div>
            </div>
          </div>

          {/* Grid of Verified Logo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOGO_CARDS.map((card) => {
              const copyKey = `${card.id}_${previewTheme}`;
              const isCopied = copiedKey === copyKey;

              return (
                <div
                  key={card.id}
                  className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] flex flex-col justify-between overflow-hidden group hover:border-[#333333] transition-colors"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#1A1A1A]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span className="uppercase">{card.title}</span>
                      <span className="text-white font-semibold">VECTOR APPROVED</span>
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{card.subtitle}</div>
                  </div>

                  {/* Logo Canvas Preview */}
                  <div 
                    className={`h-48 flex items-center justify-center p-6 transition-colors ${
                      previewTheme === 'black-on-white' 
                        ? 'bg-white text-black' 
                        : 'bg-[#000000] text-white'
                    }`}
                  >
                    {card.component(previewTheme)}
                  </div>

                  {/* Card Footer Details & Real Download Controls */}
                  <div className="p-4 bg-[#0A0A0A] border-t border-[#1A1A1A] space-y-3">
                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>

                    <div className="pt-2 border-t border-[#191919] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopySvg(card.type, previewTheme, copyKey)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono bg-[#161616] hover:bg-[#202020] text-neutral-300 hover:text-white rounded border border-[#262626] transition-colors"
                        title="Copy pristine SVG code string"
                      >
                        {isCopied ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Copy SVG'}</span>
                      </button>

                      <button
                        onClick={() => triggerSvgDownload(card.type, previewTheme)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono bg-[#161616] hover:bg-[#202020] text-neutral-300 hover:text-white rounded border border-[#262626] transition-colors"
                        title="Download scalable SVG file"
                      >
                        <Download size={12} />
                        <span>.SVG</span>
                      </button>

                      <button
                        onClick={() => triggerPngDownload(card.type, previewTheme, 1200)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono bg-white text-black hover:bg-neutral-200 rounded font-semibold transition-colors"
                        title="Download high-resolution 1200px PNG"
                      >
                        <Download size={12} strokeWidth={2.5} />
                        <span>.PNG</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real Brand Stationery Showcase Banner */}
          <div className="rounded-lg border border-[#222222] bg-[#0E0E0E] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2 font-mono">
                    <span className="text-white font-semibold">PHYSICAL IDENTITY EMBOSSING</span>
                    <span>/</span>
                    <span>STATIONERY SUITE</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
                    {activeWorkspace.name} Embossed Corporate Suite
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-2.5 leading-relaxed">
                    Exquisite physical reproduction of the LE monogram and typography across matte charcoal business cards, official 120gsm uncompressed letterheads, and vinyl record sleeves.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>PRINT SPECIFICATION: 300 DPI MATRIX FOIL</span>
                  <button
                    onClick={() => triggerSvgDownload('primary', 'black-on-white')}
                    className="text-white hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download size={12} />
                    <span>Download Press Master Pack</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[200px] bg-[#141414] border-t lg:border-t-0 lg:border-l border-[#222222]">
                <img 
                  src="/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg" 
                  alt="LYRICAL ENT Brand Stationery Suite"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDITABLE BRAND GUIDELINES TAB */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono uppercase flex items-center gap-2">
                <BookOpen size={16} />
                <span>{activeWorkspace.name} Brand Identity Constitution</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Official rules governing typography, logo exclusion zones, color distribution, and art direction
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateBrandGuidelinesPdf(brandGuidelines, activeWorkspace)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                title="Download official multi-page Brand Guidelines PDF"
              >
                <Download size={13} strokeWidth={2.5} />
                <span>Download PDF Manual</span>
              </button>

              <button
                onClick={() => setIsEditingGuidelines(!isEditingGuidelines)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#1C1C1C] text-neutral-300 hover:text-white hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
              >
                <Edit3 size={13} />
                <span>{isEditingGuidelines ? 'Close Editor' : 'Edit Guidelines'}</span>
              </button>
            </div>
          </div>

          {/* Edit Form Mode */}
          {isEditingGuidelines && (
            <form onSubmit={handleSaveGuidelines} className="p-6 bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg space-y-4">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider">
                EDIT BRAND SPECIFICATIONS &amp; DIRECTIVES
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">BRAND VOICE &amp; ETHOS</label>
                  <textarea
                    rows={3}
                    value={guidelinesForm.brandVoice}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, brandVoice: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PHOTOGRAPHY ART DIRECTION</label>
                  <textarea
                    rows={3}
                    value={guidelinesForm.photographyDirection}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, photographyDirection: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">GRAPHIC DESIGN PRINCIPLES</label>
                  <textarea
                    rows={3}
                    value={guidelinesForm.graphicDesignPrinciples}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, graphicDesignPrinciples: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CLEAR SPACE &amp; EXCLUSION ZONE</label>
                  <textarea
                    rows={3}
                    value={guidelinesForm.clearSpaceRules}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, clearSpaceRules: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">MINIMUM LOGO SIZE (PRINT)</label>
                  <input
                    type="text"
                    value={guidelinesForm.minLogoSizePrint}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, minLogoSizePrint: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">MINIMUM LOGO SIZE (DIGITAL)</label>
                  <input
                    type="text"
                    value={guidelinesForm.minLogoSizeDigital}
                    onChange={e => setGuidelinesForm({ ...guidelinesForm, minLogoSizeDigital: e.target.value })}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">BACKGROUND RULES</label>
                <textarea
                  rows={2}
                  value={guidelinesForm.backgroundRules}
                  onChange={e => setGuidelinesForm({ ...guidelinesForm, backgroundRules: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGuidelines(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  <Save size={13} />
                  <span>Save Guidelines</span>
                </button>
              </div>
            </form>
          )}

          {/* Section 1: Brand Voice & Core Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">01. BRAND VOICE &amp; TONE</span>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Authoritative &amp; Restrained</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {brandGuidelines.brandVoice}
              </p>
            </div>

            <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">02. PHOTOGRAPHY ART DIRECTION</span>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Documentary Monochrome</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {brandGuidelines.photographyDirection}
              </p>
            </div>

            <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">03. GRAPHIC DESIGN DISCIPLINE</span>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Architectural Grid</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {brandGuidelines.graphicDesignPrinciples}
              </p>
            </div>
          </div>

          {/* Section 2: Clear Space & Minimum Sizes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Clear Space Demonstration */}
            <div className="lg:col-span-7 border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white font-mono uppercase">
                  Logo Clear Space &amp; Exclusion Zone
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">MARGIN = X / 2</span>
              </div>

              <div className="relative p-10 bg-[#000000] border border-dashed border-[#333333] rounded flex items-center justify-center">
                {/* Exclusion Zone Box */}
                <div className="p-8 border border-neutral-700 relative">
                  <div className="absolute top-1 left-2 text-[9px] font-mono text-neutral-500">EXCLUSION BOUNDARY</div>
                  <WorkspaceLogo 
                    workspaceId={activeWorkspace.id} 
                    workspaceName={activeWorkspace.name} 
                    height={42} 
                    theme="monochrome-white" 
                  />
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {brandGuidelines.clearSpaceRules}
              </p>
            </div>

            {/* Minimum Sizes & Background Directives */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-white font-mono uppercase">
                  Minimum Reproduction Sizes
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-[#121212] rounded border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">PRINT REPRODUCTION (300 DPI):</span>
                    <span className="text-white font-medium">{brandGuidelines.minLogoSizePrint}</span>
                  </div>
                  <div className="p-2.5 bg-[#121212] rounded border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">DIGITAL VIEWPORTS (72–144 DPI):</span>
                    <span className="text-white font-medium">{brandGuidelines.minLogoSizeDigital}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg space-y-2">
                <h3 className="text-sm font-semibold text-white font-mono uppercase">
                  Background Permitted Rules
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {brandGuidelines.backgroundRules}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Colour Palette */}
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase">
                  Official Monochrome Palette
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Strict monochrome scale adhering to high-contrast restraint</p>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">CLICK TO COPY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PALETTE.map((color) => (
                <div key={color.hex} className="p-3 bg-[#121212] border border-[#1E1E1E] rounded-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded border border-[#2B2B2B] shrink-0" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white">{color.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">{color.hex}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                    {color.role}
                  </p>

                  <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>{color.rgb}</span>
                    <button
                      onClick={() => copyToClipboard(color.hex, color.hex)}
                      className="text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === color.hex ? <Check size={11} className="text-white" /> : <Copy size={11} />}
                      <span>{copiedKey === color.hex ? 'Copied' : 'Copy Hex'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Typography Architecture */}
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase">
              Typography Architecture &amp; Font Pairing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded">
                <span className="text-[10px] font-mono text-neutral-500 block mb-1">PRIMARY DISPLAY &amp; HEADLINES</span>
                <div className="text-2xl font-extrabold text-white tracking-tight mb-2">Plus Jakarta Sans</div>
                <p className="text-neutral-400 leading-relaxed">
                  Used for logotype wordmarks, release titles, artist monikers, and executive correspondence. High optical balance, crisp geometric legibility, and geometric letterforms.
                </p>
                <div className="mt-3 pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-neutral-500">
                  WEIGHTS: Regular 400 · Medium 500 · SemiBold 600 · ExtraBold 800
                </div>
              </div>

              <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded">
                <span className="text-[10px] font-mono text-neutral-500 block mb-1">METADATA, SPLITS &amp; ISRCS</span>
                <div className="text-xl font-mono font-bold text-white mb-2">JetBrains Mono</div>
                <p className="text-neutral-400 leading-relaxed">
                  Used for catalog numbers, ISRC metadata, UPC barcodes, financial lines, contracts, and tabular alignment. Prevents layout jitter across all data tables.
                </p>
                <div className="mt-3 pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-neutral-500">
                  FEATURE: font-variant-numeric: tabular-nums
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Incorrect Logo Usage */}
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <XCircle size={18} className="text-neutral-400" />
              <h3 className="text-sm font-semibold text-white font-mono uppercase">
                Incorrect Logo Usage Directives
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {brandGuidelines.incorrectUsageRules.map((rule, idx) => (
                <div key={idx} className="p-3 bg-[#121212] border border-[#1E1E1E] rounded flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. ASSET VAULT TAB */}
      {activeTab === 'assets' && (
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono uppercase">
                Official Generated Brand Assets
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Direct downloads for vector SVGs, high-resolution PNGs, and stationery photography
              </p>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">ALL ASSETS VERIFIED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C] text-neutral-400 font-mono text-[11px]">
                  <th className="pb-2.5 font-normal">ASSET NAME</th>
                  <th className="pb-2.5 font-normal">FORMAT</th>
                  <th className="pb-2.5 font-normal">CATEGORY</th>
                  <th className="pb-2.5 font-normal">STATUS</th>
                  <th className="pb-2.5 font-normal text-right">DOWNLOAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL ENT Primary Logo (Stacked Master)</div>
                    <div className="text-[10px] text-neutral-500 font-mono">White on Black &amp; Black on White SVG</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">SVG / Vector</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Primary Logo</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => triggerSvgDownload('primary', 'white-on-black')}
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>SVG</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL ENT Horizontal Header Lockup</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Banners, Navigation, Streaming Titlecards</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">SVG / Vector</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Horizontal Logo</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => triggerSvgDownload('horizontal', 'white-on-black')}
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>SVG</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL LE Monogram Seal</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Architectural Vinyl Runout Emblem</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">SVG / Vector</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Monogram</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => triggerSvgDownload('monogram', 'white-on-black')}
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>SVG</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL ENT Square Social Profile Avatar</div>
                    <div className="text-[10px] text-neutral-500 font-mono">1:1 Streaming &amp; Social Icon</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">PNG / 1200px</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Square Icon</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => triggerPngDownload('square', 'white-on-black', 1200)}
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>PNG</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL ENT Favicon Suite</div>
                    <div className="text-[10px] text-neutral-500 font-mono">32px / 64px Browser Mark</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">SVG / Vector</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Favicon</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => triggerSvgDownload('favicon', 'white-on-black')}
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>SVG</span>
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 pr-3 font-medium text-white">
                    <div>LYRICAL ENT Stationery Suite Press Photograph</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Embossed business cards, vinyl sleeve, letterhead</div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">JPEG High-Res</td>
                  <td className="py-3 pr-3 font-mono text-neutral-400">Photography</td>
                  <td className="py-3 pr-3 font-mono text-neutral-300">APPROVED</td>
                  <td className="py-3 text-right">
                    <a
                      href="/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg"
                      download="lyrical_ent_stationery.jpg"
                      className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>JPG</span>
                    </a>
                  </td>
                </tr>

                {/* User-uploaded workspace assets */}
                {workspaceBrandAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#141414] transition-colors group">
                    <td className="py-3.5 pr-3">
                      <div className="font-medium text-white flex items-center gap-2">
                        <FileText size={14} className="text-neutral-500" />
                        <span>{asset.name}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">{asset.description}</div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-neutral-400">{asset.fileType} {asset.dimensions && `/ ${asset.dimensions}`}</td>
                    <td className="py-3 pr-3 font-mono text-neutral-400">{asset.category}</td>
                    <td className="py-3 pr-3 font-mono text-neutral-300">{asset.status.toUpperCase()}</td>
                    <td className="py-3 text-right">
                      <button
                        className="px-2.5 py-1 text-xs font-mono bg-[#1A1A1A] hover:bg-[#242424] text-white rounded border border-[#2B2B2B] inline-flex items-center gap-1"
                      >
                        <Download size={11} />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
