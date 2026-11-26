import React, { useState } from 'react';
import {
  Briefcase,
  Check,
  Disc3,
  FileCheck2,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Music2,
  Package,
  Palette,
  Plus,
  Sparkles,
  Upload,
  User,
  Wand2,
  X,
} from 'lucide-react';
import type {
  ClientProfile,
  ClientProject,
  CreativeProduct,
  Workspace,
} from '../../types';
import type {
  CreativeStarterParams,
  CreativeStarterSource,
  CreativeStudioToolId,
  StudioToolDefinition,
} from '../../types/creativeProduction';
import {
  createStarterProduction,
  getToolsForAudience,
  MULTI_FORMAT_PRESETS,
  STUDIO_TOOL_DIRECTORY,
} from '../../lib/creativeStudioEngine';
import type { StudioAsset, StudioRelease } from '../client/ClientStudio';

export interface CreativeProjectStarterModalProps {
  workspace: Workspace;
  clientProfile?: ClientProfile | null;
  experienceMode: 'artist' | 'brand';
  releases?: StudioRelease[];
  projects?: ClientProject[];
  assets?: StudioAsset[];
  products?: CreativeProduct[];
  initialSource?: CreativeStarterSource;
  initialToolId?: CreativeStudioToolId;
  onClose: () => void;
  onLaunchProduction: (starterParams: CreativeStarterParams) => void;
}

export const CreativeProjectStarterModal: React.FC<CreativeProjectStarterModalProps> = ({
  workspace,
  clientProfile,
  experienceMode,
  releases = [],
  projects = [],
  assets = [],
  products = [],
  initialSource,
  initialToolId,
  onClose,
  onLaunchProduction,
}) => {
  const isArtist = experienceMode === 'artist';
  const audience = isArtist ? 'Artist' : 'Brand';

  const [selectedSource, setSelectedSource] = useState<CreativeStarterSource>(initialSource || 'scratch');
  const [selectedToolId, setSelectedToolId] = useState<CreativeStudioToolId>(
    initialToolId || (isArtist ? 'release-artwork-studio' : 'product-ad-designer'),
  );
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    isArtist ? '1:1-master-cover' : '1:1-square',
  );
  const [customTitle, setCustomTitle] = useState('');

  // Selected entities for starter bridges
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(releases[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(projects[0]?.id || '');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  const availableTools = getToolsForAudience(audience);

  const handleStart = () => {
    let prefillTitle = customTitle.trim();
    let prefillDesign: CreativeStarterParams['prefillDesign'] = {};
    let linkedReleaseTitle: string | undefined;
    let linkedProjectTitle: string | undefined;
    let linkedProductTitle: string | undefined;

    if (selectedSource === 'release' && selectedReleaseId) {
      const rel = releases.find(r => r.id === selectedReleaseId);
      if (rel) {
        linkedReleaseTitle = rel.title;
        if (!prefillTitle) prefillTitle = `${rel.title} — Official Cover Artwork`;
        prefillDesign = {
          headline: rel.title.toUpperCase(),
          subtitle: `OFFICIAL ${rel.type.toUpperCase()} RELEASE`,
          artistOrBrandName: (workspace.artistProfile?.biography ? workspace.name : workspace.name).toUpperCase(),
          tagline: `CATALOG ID: ${rel.isrc || rel.id.slice(0, 8).toUpperCase()}`,
          dateText: rel.releaseDate || `EST. ${new Date().getFullYear()}`,
          imageUrl: rel.artworkUrl || '',
          trackListSnippet: rel.trackList || '',
          isrcSnippet: rel.isrc || '',
        };
      }
    } else if (selectedSource === 'project' && selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        linkedProjectTitle = proj.title;
        if (!prefillTitle) prefillTitle = `${proj.title} — Studio Production`;
        prefillDesign = {
          headline: proj.title.toUpperCase(),
          subtitle: proj.description || `${proj.category} Deliverables`,
          artistOrBrandName: workspace.name.toUpperCase(),
        };
      }
    } else if (selectedSource === 'resource' && selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        linkedProductTitle = prod.title;
        if (!prefillTitle) prefillTitle = `${prod.title} — Customization`;
        prefillDesign = {
          headline: prod.title.toUpperCase(),
          subtitle: prod.summary || prod.description,
          tagline: prod.category.toUpperCase(),
        };
      }
    } else if (selectedSource === 'asset' && selectedAssetId) {
      const ast = assets.find(a => a.id === selectedAssetId);
      if (ast) {
        if (!prefillTitle) prefillTitle = `${ast.name} — Visual Design`;
        prefillDesign = {
          imageUrl: ast.downloadUrl || '',
          tagline: ast.category.toUpperCase(),
        };
      }
    } else if (selectedSource === 'profile') {
      if (!prefillTitle) prefillTitle = `${workspace.name} — Brand Visual System`;
      prefillDesign = {
        artistOrBrandName: workspace.name.toUpperCase(),
        headline: isArtist ? 'OFFICIAL ARTIST PROFILE' : 'BRAND IDENTITY ARCHITECTURE',
        subtitle:
          workspace.brandProfile?.brandVoice ||
          workspace.artistProfile?.biography ||
          'Precision design specifications and media assets.',
        primaryColor: workspace.brand?.primaryColor || '#FF1E1E',
        secondaryColor: workspace.brand?.secondaryColor || '#141414',
        accentColor: workspace.brand?.accentColor || '#FF1E1E',
      };
    } else if (selectedSource === 'request' && selectedRequestId) {
      const req = projects.find(p => p.id === selectedRequestId);
      if (req) {
        linkedProjectTitle = req.title;
        if (!prefillTitle) prefillTitle = `${req.title} — Brief Execution`;
        prefillDesign = {
          headline: req.title.toUpperCase(),
          subtitle: req.description || `${req.category} Creative Brief`,
          tagline: `BRIEF · ${(req.requestStatus || req.stage || 'ACTIVE').toUpperCase()}`,
          genreOrCategory: req.category,
          artistOrBrandName: workspace.name.toUpperCase(),
        };
      }
    }

    onLaunchProduction({
      source: selectedSource,
      toolId: selectedToolId,
      title: prefillTitle || undefined,
      formatId: selectedFormatId,
      prefillDesign,
      linkedReleaseId: selectedSource === 'release' ? selectedReleaseId : undefined,
      linkedReleaseTitle,
      linkedProjectId:
        selectedSource === 'project'
          ? selectedProjectId
          : selectedSource === 'request'
            ? selectedRequestId
            : undefined,
      linkedProjectTitle,
      linkedRequestId: selectedSource === 'request' ? selectedRequestId : undefined,
      linkedProductId: selectedSource === 'resource' ? selectedProductId : undefined,
      linkedProductTitle,
      linkedAssetId: selectedSource === 'asset' ? selectedAssetId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-[#242424] bg-[#0E0E0E] p-6 text-white shadow-2xl space-y-5 my-8">
        <div className="flex items-start justify-between border-b border-[#1C1C1C] pb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              {isArtist ? 'Artist OS · Studio Starter' : 'Brand OS · Studio Starter'}
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Start New Creative Production</h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              Configure production context, select tool engine, and set initial format.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:text-white"
            aria-label="Close starter modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Choose Starting Point (8 Sources) */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            1. Select Starting Point
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'scratch' as const, label: 'From Scratch', icon: Plus, desc: 'Blank canvas' },
              { id: 'template' as const, label: 'Curated Template', icon: Sparkles, desc: 'Preset layout' },
              { id: 'resource' as const, label: 'Creative Hub Pack', icon: Package, desc: 'Phase 4 resource' },
              { id: 'asset' as const, label: 'Existing Asset', icon: ImageIcon, desc: 'From asset library' },
              { id: 'release' as const, label: 'Music Release', icon: Disc3, desc: 'Preload metadata' },
              { id: 'project' as const, label: 'Project Brief', icon: Briefcase, desc: 'Link active project' },
              { id: 'profile' as const, label: 'Brand / Artist Tokens', icon: User, desc: 'Colors & type' },
              { id: 'request' as const, label: 'Creative Request', icon: FileCheck2, desc: 'Production brief' },
            ].map(source => {
              const Icon = source.icon;
              const isSelected = selectedSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSource(source.id)}
                  className={`rounded border p-2.5 text-left transition-colors flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-[#FF1E1E] bg-[#1A1A1A] text-white'
                      : 'border-[#222] bg-[#121212] text-neutral-400 hover:text-white hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon size={14} className={isSelected ? 'text-[#FF1E1E]' : 'text-neutral-500'} />
                    {isSelected && <Check size={12} className="text-[#FF1E1E]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">{source.label}</div>
                    <div className="text-[10px] text-neutral-500 leading-tight">{source.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Context Selector based on chosen source */}
        {selectedSource === 'release' && (
          <div className="rounded border border-[#222] bg-[#141414] p-3 space-y-2">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Select Release ({releases.length} available)
            </label>
            {releases.length === 0 ? (
              <p className="text-xs text-neutral-500">No music releases logged yet. Head to Music &amp; Releases to catalog one first.</p>
            ) : (
              <select
                value={selectedReleaseId}
                onChange={e => setSelectedReleaseId(e.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs text-white"
              >
                {releases.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.type}) — {r.releaseDate || 'No date'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {selectedSource === 'project' && (
          <div className="rounded border border-[#222] bg-[#141414] p-3 space-y-2">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Select Project ({projects.length} active)
            </label>
            {projects.length === 0 ? (
              <p className="text-xs text-neutral-500">No active projects found in this workspace.</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs text-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category}) — {p.stage}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {selectedSource === 'resource' && (
          <div className="rounded border border-[#222] bg-[#141414] p-3 space-y-2">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Select Creative Hub Product ({products.length} unlocked)
            </label>
            {products.length === 0 ? (
              <p className="text-xs text-neutral-500">Browse the Creative Hub to discover and unlock packs first.</p>
            ) : (
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs text-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {selectedSource === 'asset' && (
          <div className="rounded border border-[#222] bg-[#141414] p-3 space-y-2">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Select Source Asset ({assets.length} stored)
            </label>
            {assets.length === 0 ? (
              <p className="text-xs text-neutral-500">No assets stored in library yet.</p>
            ) : (
              <select
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs text-white"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {selectedSource === 'request' && (
          <div className="rounded border border-[#222] bg-[#141414] p-3 space-y-2">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Select Creative Request Brief ({projects.length} logged)
            </label>
            {projects.length === 0 ? (
              <p className="text-xs text-neutral-500">No creative request briefs submitted in this workspace yet.</p>
            ) : (
              <select
                value={selectedRequestId}
                onChange={e => setSelectedRequestId(e.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs text-white"
              >
                {projects.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.requestStatus || r.stage || 'Pending'})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 2. Choose Tool Engine */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            2. Choose Studio Tool Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {availableTools.map(tool => {
              const isSelected = selectedToolId === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`rounded border p-3 text-left transition-colors flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-[#FF1E1E] bg-[#1A1A1A] text-white'
                      : 'border-[#222] bg-[#121212] text-neutral-400 hover:text-white hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">{tool.category}</span>
                    <span className="font-mono text-[9px] uppercase text-[#FF1E1E]">{tool.badge}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">{tool.name}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{tool.headline}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Choose Initial Format */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            3. Choose Initial Dimensions
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {MULTI_FORMAT_PRESETS.map(preset => {
              const isSelected = selectedFormatId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedFormatId(preset.id)}
                  className={`rounded border p-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#FF1E1E] bg-[#1A1A1A] text-white'
                      : 'border-[#222] bg-[#121212] text-neutral-400 hover:text-white hover:border-[#383838]'
                  }`}
                >
                  <div className="font-semibold text-xs text-white truncate">{preset.label}</div>
                  <div className="font-mono text-[10px] text-neutral-500">{preset.platform}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Start Button */}
        <div className="pt-2 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Custom production title (optional)…"
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            className="w-full sm:w-80 rounded border border-[#2E2E2E] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <Wand2 size={13} />
              <span>Launch Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
