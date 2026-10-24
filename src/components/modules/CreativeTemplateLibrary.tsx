/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Creative Template Library & Real Design Studio
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Heart, 
  Sliders, 
  Layers, 
  Check, 
  FolderArchive, 
  Maximize2, 
  RefreshCw,
  Share2,
  FileText,
  Image as ImageIcon,
  Palette,
  Eye,
  CheckCircle2,
  Upload,
  ArrowRight,
  FolderHeart,
  Grid,
  Laptop
} from 'lucide-react';
import { 
  CreativeTemplate, 
  MASTER_CREATIVE_TEMPLATES 
} from '../../data/creativeTemplatesData';
import { 
  TEMPLATE_FAMILIES 
} from '../../data/templateFamiliesData';
import { 
  CanvasDesign, 
  TemplateFamilyId 
} from '../../types/designStudio';
import { DesignCanvasEditor } from '../studio/DesignCanvasEditor';
import { HonestCanvasThumbnail } from '../common/HonestCanvasThumbnail';
import { buildHonestDesignForTemplate } from '../../utils/templateDesignBuilder';

export const CreativeTemplateLibrary: React.FC = () => {
  const { releases, artists, activeWorkspace } = useApp();

  // Active top view: 'families' | 'categories' | 'saved'
  const [activeView, setActiveView] = useState<'families' | 'categories' | 'saved'>('families');

  // Active editor mode
  const [activeStudioDesign, setActiveStudioDesign] = useState<CanvasDesign | null>(null);

  // Template categories state
  const [templates, setTemplates] = useState<CreativeTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('lyrical_ent_custom_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MASTER_CREATIVE_TEMPLATES;
  });

  // Saved designs in localStorage
  const [savedDesigns, setSavedDesigns] = useState<CanvasDesign[]>(() => {
    try {
      const saved = localStorage.getItem('lyrical_ent_saved_designs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const filteredSavedDesigns = useMemo(() => {
    return savedDesigns.filter(d => 
      d.workspaceId === activeWorkspace.id || 
      (!d.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [savedDesigns, activeWorkspace.id]);

  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const familyOptions: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All 6 Families' },
    { id: 'premium_editorial', label: 'A. Premium Editorial' },
    { id: 'urban_music', label: 'B. Urban Music' },
    { id: 'cinematic', label: 'C. Cinematic' },
    { id: 'clean_commercial', label: 'D. Clean Commercial' },
    { id: 'experimental_design', label: 'E. Experimental' },
    { id: 'artist_branding', label: 'F. Artist Branding' }
  ];

  const categoryOptions = [
    'ALL',
    'Brand Launch',
    'Pre-Launch Campaigns',
    'Launch Day Designs',
    'Post-Launch Campaigns',
    'Music Promotion',
    'Artist Branding',
    'Social Media Content',
    'Holiday and Celebration Designs',
    'Company Announcements',
    'Business Promotion',
    'Press and Media',
    'Event Promotion',
    'Motion Graphics',
    'Quotes and Motivational Designs',
    'Custom Design Packs'
  ];

  // Filtered families
  const filteredFamilies = useMemo(() => {
    return TEMPLATE_FAMILIES.filter(f => {
      const matchesFam = selectedFamily === 'ALL' || f.familyId === selectedFamily;
      const matchesSearch = searchQuery === '' ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFam && matchesSearch;
    });
  }, [selectedFamily, searchQuery]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return templates.filter(t => {
      const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artistName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Launch any template in the Design Canvas Editor
  const handleLaunchInStudio = (design: CanvasDesign) => {
    setActiveStudioDesign(design);
  };

  // Convert CreativeTemplate into editable CanvasDesign with genuine distinct composition
  const handleLaunchCategoryTemplateInStudio = (t: CreativeTemplate) => {
    const newDesign = buildHonestDesignForTemplate(t);
    setActiveStudioDesign(newDesign);
  };

  // If a design is active in Studio Canvas Editor, render the editor!
  if (activeStudioDesign) {
    return (
      <DesignCanvasEditor 
        initialDesign={activeStudioDesign}
        onSaveDesign={(saved) => {
          setSavedDesigns(prev => {
            const filtered = prev.filter(d => d.id !== saved.id);
            return [saved, ...filtered];
          });
        }}
        onClose={() => setActiveStudioDesign(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-white/20 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs">
          <CheckCircle2 size={15} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              GRAPHIC DESIGN ENGINE · 6 MASTER FAMILIES &amp; 15 BRAND CATEGORIES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase break-words">
            CREATIVE DESIGN STUDIO &amp; TEMPLATE SUITE
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Professional Photoshop-grade canvas editing workspace. Select any master template family or browse 65+ category designs to customize text, upload images, reorder layers, and export print-ready assets.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search all templates..."
            className="bg-[#121212] border border-[#262626] rounded pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 w-full sm:w-60 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Primary Section Mode Selector */}
      <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveView('families')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded transition-all ${
            activeView === 'families'
              ? 'bg-white text-black font-bold shadow'
              : 'bg-[#121212] text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} />
          <span>6 Template Families (36 Master Layouts)</span>
        </button>

        <button
          onClick={() => setActiveView('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded transition-all ${
            activeView === 'categories'
              ? 'bg-white text-black font-bold shadow'
              : 'bg-[#121212] text-neutral-400 hover:text-white'
          }`}
        >
          <Grid size={13} />
          <span>15 Brand Categories (65+ Templates)</span>
        </button>

        <button
          onClick={() => setActiveView('saved')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded transition-all ${
            activeView === 'saved'
              ? 'bg-white text-black font-bold shadow'
              : 'bg-[#121212] text-neutral-400 hover:text-white'
          }`}
        >
          <FolderHeart size={13} />
          <span>Saved Designs ({filteredSavedDesigns.length})</span>
        </button>
      </div>

      {/* VIEW 1: TEMPLATE FAMILIES */}
      {activeView === 'families' && (
        <div className="space-y-5">
          {/* Family Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#242424] scrollbar-track-transparent">
            {familyOptions.map(fam => (
              <button
                key={fam.id}
                onClick={() => setSelectedFamily(fam.id)}
                className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-all ${
                  selectedFamily === fam.id
                    ? 'bg-white text-black font-bold shadow'
                    : 'bg-[#121212] border border-[#222222] text-neutral-400 hover:text-white'
                }`}
              >
                {fam.label}
              </button>
            ))}
          </div>

          {/* Families Responsive Grid (360px to 1440px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 w-full min-w-0">
            {filteredFamilies.map(fam => (
              <div
                key={fam.id}
                className="w-full min-w-0 bg-[#0C0C0C] border border-[#202020] hover:border-[#404040] rounded-lg p-4 sm:p-5 flex flex-col justify-between space-y-4 group transition-all shadow-sm"
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-[#171717] border border-[#282828] text-neutral-300 uppercase">
                      {fam.familyName}
                    </span>
                    <span className="text-neutral-500">{fam.aspectRatio}</span>
                  </div>

                  {/* Honest Vector Thumbnail Preview */}
                  <HonestCanvasThumbnail design={fam.design} />

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-neutral-200 truncate">
                      {fam.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {fam.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {fam.design.width} × {fam.design.height} PX
                  </span>

                  <button
                    onClick={() => handleLaunchInStudio(fam.design)}
                    className="px-3.5 py-1.5 bg-white text-black font-mono font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Sliders size={12} />
                    <span>Open in Studio →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: 15 BRAND CATEGORIES */}
      {activeView === 'categories' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#242424] scrollbar-track-transparent">
            {categoryOptions.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-white text-black font-bold shadow' 
                    : 'bg-[#121212] border border-[#222222] text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
            {filteredCategories.map(tpl => {
              const categoryDesign = buildHonestDesignForTemplate(tpl);
              return (
                <div
                  key={tpl.id}
                  className="w-full min-w-0 bg-[#0C0C0C] border border-[#202020] hover:border-[#383838] rounded-lg p-3.5 sm:p-4.5 flex flex-col justify-between space-y-4 group transition-all shadow-sm"
                >
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 bg-[#171717] border border-[#282828] text-neutral-300 uppercase truncate">
                        {tpl.category}
                      </span>
                      <span className="text-neutral-500">{tpl.aspectRatio.split(' ')[0]}</span>
                    </div>

                    {/* Honest Real Thumbnail Preview */}
                    <HonestCanvasThumbnail design={categoryDesign} />

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-neutral-200 truncate">
                        {tpl.title}
                      </h4>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        Style: <strong className="text-white">{tpl.style}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#1C1C1C] flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => handleLaunchCategoryTemplateInStudio(tpl)}
                      className="w-full py-1.5 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm"
                    >
                      <Sliders size={12} />
                      <span>Open in Studio →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SAVED USER DESIGNS */}
      {activeView === 'saved' && (
        <div className="space-y-4 font-mono">
          {filteredSavedDesigns.length === 0 ? (
            <div className="border border-dashed border-[#242424] rounded-lg p-12 text-center space-y-3">
              <Sparkles size={32} className="mx-auto text-neutral-600" />
              <h3 className="text-sm font-bold text-white uppercase">No Saved Designs Yet</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Open any template from the Families or Categories tabs into the Design Studio and click "Save" to build your custom label archive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSavedDesigns.map(design => (
                <div
                  key={design.id}
                  className="bg-[#0C0C0C] border border-[#222222] hover:border-white rounded-lg p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span>{design.aspectRatio}</span>
                      <span>{design.elements.length} elements</span>
                    </div>
                    {/* Saved Canvas Thumbnail */}
                    <HonestCanvasThumbnail design={design} className="mb-2" />
                    <h4 className="text-xs font-bold text-white truncate">{design.name}</h4>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Last edited: {new Date(design.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                    <button
                      onClick={() => {
                        const updated = savedDesigns.filter(d => d.id !== design.id);
                        setSavedDesigns(updated);
                        localStorage.setItem('lyrical_ent_saved_designs', JSON.stringify(updated));
                        showToast(`Deleted "${design.name}"`);
                      }}
                      className="text-neutral-500 hover:text-red-400 text-xs"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => handleLaunchInStudio(design)}
                      className="px-3 py-1 bg-white text-black font-bold rounded text-xs hover:bg-neutral-200"
                    >
                      Reopen →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
