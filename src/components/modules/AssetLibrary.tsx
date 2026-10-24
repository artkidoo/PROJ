import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FolderArchive, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Plus, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { triggerSvgDownload, triggerPngDownload } from '../brand/LogoSystem';

interface AssetItem {
  id: string;
  name: string;
  category: 'Brand Identity' | 'Corporate Documents' | 'Artists' | 'Music Releases' | 'Campaigns' | 'Website' | 'Press and Media' | 'Archive';
  fileFormat: string;
  fileSize: string;
  version: string;
  status: 'Approved' | 'Review' | 'Draft';
  fileUrl?: string;
  uploadedDate: string;
  metadata: string;
  logoType?: 'primary' | 'monogram';
}

export const AssetLibrary: React.FC = () => {
  const { searchQuery, brandAssets, releases, artists, campaigns } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Aggregated library assets
  const libraryAssets: AssetItem[] = [
    {
      id: 'ast-01',
      name: 'LYRICAL ENT Master Wordmark Vector (Black & White)',
      category: 'Brand Identity',
      fileFormat: 'SVG / Vector',
      fileSize: '14.2 KB',
      version: 'v2.4 Final',
      status: 'Approved',
      uploadedDate: '2026-01-10',
      metadata: 'Master vector logotype for physical packaging, vinyl labels, and digital syndication.',
      logoType: 'primary'
    },
    {
      id: 'ast-02',
      name: 'LYRICAL Monogram Seal "LE" Vector',
      category: 'Brand Identity',
      fileFormat: 'SVG / Vector',
      fileSize: '8.4 KB',
      version: 'v2.1',
      status: 'Approved',
      uploadedDate: '2026-01-12',
      metadata: 'Vinyl runout matrix emblem, streaming avatar, and corporate document seal.',
      logoType: 'monogram'
    },
    {
      id: 'ast-09',
      name: 'LYRICAL ENT Executive Stationery Suite (Embossed & Foiled)',
      category: 'Brand Identity',
      fileFormat: 'JPEG High-Res',
      fileSize: '3.4 MB',
      version: 'v1.0 Final',
      status: 'Approved',
      fileUrl: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg',
      uploadedDate: '2026-03-02',
      metadata: 'Master physical brand collateral featuring debossed business cards, A4 letterhead, and vinyl sleeve.'
    },
    {
      id: 'ast-03',
      name: 'London Sound Lab A — Control Room Press Photograph',
      category: 'Press and Media',
      fileFormat: 'JPEG High-Res',
      fileSize: '4.2 MB',
      version: 'v1.0',
      status: 'Approved',
      fileUrl: '/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg',
      uploadedDate: '2026-02-14',
      metadata: 'Leica 35mm documentary press photo of mixing console.'
    },
    {
      id: 'ast-04',
      name: 'Sariyah Cole — Official 2026 Studio Press Portrait',
      category: 'Artists',
      fileFormat: 'JPEG High-Res',
      fileSize: '3.8 MB',
      version: 'v1.2',
      status: 'Approved',
      fileUrl: '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
      uploadedDate: '2026-02-20',
      metadata: '300 DPI high-contrast black & white portrait for press and billboards.'
    },
    {
      id: 'ast-05',
      name: 'Monochrome State — 12-Inch Vinyl Pressing Packaging Master',
      category: 'Music Releases',
      fileFormat: 'JPEG / Print Spec',
      fileSize: '5.1 MB',
      version: 'v2.0',
      status: 'Approved',
      fileUrl: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
      uploadedDate: '2026-02-28',
      metadata: '3000x3000px master packaging for single and physical vinyl press.'
    },
    {
      id: 'ast-06',
      name: 'Official Label Letterhead & Master Dispatch Template',
      category: 'Corporate Documents',
      fileFormat: 'A4 Layout / TXT',
      fileSize: '120 KB',
      version: 'v2026.1',
      status: 'Approved',
      uploadedDate: '2026-01-05',
      metadata: 'Official executive letterhead for licensing and contract execution.'
    },
    {
      id: 'ast-07',
      name: 'Songwriter Split Sheet Agreement Master Template',
      category: 'Corporate Documents',
      fileFormat: 'TXT / Doc',
      fileSize: '45 KB',
      version: 'v1.8',
      status: 'Approved',
      uploadedDate: '2026-01-15',
      metadata: 'Formal songwriting and mechanical royalty allocation agreement.'
    },
    {
      id: 'ast-08',
      name: 'Official LYRICAL ENT Blogger XML Theme File',
      category: 'Website',
      fileFormat: 'XML Template',
      fileSize: '24.5 KB',
      version: 'v2.4.0',
      status: 'Approved',
      uploadedDate: '2026-03-01',
      metadata: 'Fully tested Blogger layout v3 theme preserving native Blog1 widget.'
    }
  ];

  const CATEGORIES = [
    'All',
    'Brand Identity',
    'Corporate Documents',
    'Artists',
    'Music Releases',
    'Campaigns',
    'Website',
    'Press and Media',
    'Archive'
  ];

  const filteredAssets = libraryAssets.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            DIGITAL ASSET VAULT & REPOSITORY
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Master logos, vinyl packaging artwork, press photography, Blogger theme code, and legal documents
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          INDEXED ASSETS: <span className="text-white font-semibold tabular-nums">{libraryAssets.length}</span>
        </div>
      </div>

      {/* Category Filter Pills (Anti-pill interactive buttons) */}
      <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap rounded transition-colors ${
              activeCategory === cat ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Assets Grid & Metadata Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAssets.map(asset => (
          <div 
            key={asset.id}
            className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] flex flex-col justify-between overflow-hidden hover:border-[#333333] transition-colors"
          >
            {/* Visual Thumbnail or Icon Container */}
            <div className="h-44 bg-[#141414] border-b border-[#1E1E1E] relative overflow-hidden flex items-center justify-center p-4">
              {asset.fileUrl ? (
                <img 
                  src={asset.fileUrl} 
                  alt={asset.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 border border-[#2B2B2B] rounded flex items-center justify-center mx-auto mb-2 text-white font-mono font-bold text-sm">
                    {asset.fileFormat.slice(0, 3)}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">{asset.fileFormat}</span>
                </div>
              )}

              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 bg-black/80 backdrop-blur border border-[#2B2B2B] rounded text-[10px] font-mono text-white">
                  {asset.version}
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  {asset.category}
                </div>
                <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                  {asset.name}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {asset.metadata}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>{asset.fileSize}</span>
                {asset.logoType ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerSvgDownload(asset.logoType!, 'white-on-black')}
                      className="text-neutral-300 hover:text-white hover:underline flex items-center gap-1 font-semibold"
                      title="Download Vector SVG"
                    >
                      <Download size={11} />
                      <span>.SVG</span>
                    </button>
                    <button
                      onClick={() => triggerPngDownload(asset.logoType!, 'white-on-black', 1200)}
                      className="text-white hover:underline flex items-center gap-1 font-semibold"
                      title="Download 1200px PNG"
                    >
                      <Download size={11} />
                      <span>.PNG</span>
                    </button>
                  </div>
                ) : asset.fileUrl ? (
                  <a 
                    href={asset.fileUrl} 
                    download 
                    className="text-white hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download size={11} />
                    <span>Download</span>
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const blob = new Blob([asset.metadata], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${asset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-white hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download size={11} />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
