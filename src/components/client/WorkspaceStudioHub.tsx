import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Copy,
  Disc3,
  FileArchive,
  FileText,
  Filter,
  FolderKanban,
  FolderPlus,
  Layers,
  Mail,
  Music2,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type {
  ClientProfile,
  ClientProject,
  CreativeProduct,
  ProductionDeliverable,
  Workspace,
} from '../../types';
import type { BrandGuidelinesData } from '../../types';
import {
  ARTIST_CREATIVE_SERVICES,
  BRAND_BUSINESS_CREATIVE_SERVICES,
  buildBrandProductionPrefill,
  buildProductRequestPrefill,
  type ClientExperienceConfig,
  type ClientTab,
  type ProductionRequestPrefill,
} from '../../lib/clientOS';
import {
  getApprovedDownloadableFiles,
  getProductDownloadStatusSummary,
  isClientEligibleForProductDownload,
  resolveClientAudienceBucket,
} from '../../lib/creativeProductAccess';
import { downloadProductStorageFile } from '../../lib/creativeProducts';
import { recordResourceHistoryEntry, verifyResourceDownloadAccess } from '../../lib/creativeEcosystem';
import {
  generateEditableProductSvgBlob,
  generateStructuredDocumentPdfBlob,
  packageProductDeliverablesZip,
} from '../../lib/productPackager';
import { generateBrandGuidelinesPdf } from '../../utils/pdfGenerator';
import type {
  CreativeProductionItem,
  CreativeStarterParams,
  CreativeStudioToolId,
  StudioToolCategory,
  StudioToolDefinition,
} from '../../types/creativeProduction';
import {
  createStarterProduction,
  deleteStudioProduction,
  duplicateStudioProduction,
  getToolsForAudience,
  loadStudioProductions,
  saveStudioProduction,
  STUDIO_TOOL_DIRECTORY,
} from '../../lib/creativeStudioEngine';
import { CreativeProductionStudio } from '../studio/CreativeProductionStudio';
import { CreativeProjectStarterModal } from '../studio/CreativeProjectStarterModal';
import type { StudioAsset, StudioContentItem, StudioDocument, StudioRelease } from './ClientStudio';

export interface WorkspaceStudioHubProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  experience: ClientExperienceConfig;
  products: CreativeProduct[];
  activeServicePackageIds?: ReadonlySet<string>;
  projects?: ClientProject[];
  deliverables?: ProductionDeliverable[];
  releases?: StudioRelease[];
  contentItems?: StudioContentItem[];
  assets?: StudioAsset[];
  documents?: StudioDocument[];
  initialStarter?: CreativeStarterParams | null;
  onConsumeInitialStarter?: () => void;
  onNavigateSection: (tab: ClientTab) => void;
  onRequestProduction: (prefill?: Partial<ProductionRequestPrefill>) => void;
  onSaveToAssetLibrary?: (params: {
    blob: Blob;
    fileName: string;
    category: string;
    releaseId?: string;
    projectId?: string;
  }) => Promise<void> | void;
  onAttachToRelease?: (releaseId: string, artworkBlob: Blob, artworkUrl?: string) => Promise<void> | void;
  onAttachToProject?: (projectId: string, deliverableBlob: Blob) => Promise<void> | void;
}

function stripUndefinedForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const WorkspaceStudioHub: React.FC<WorkspaceStudioHubProps> = ({
  workspace,
  clientProfile,
  experience,
  products,
  activeServicePackageIds,
  projects = [],
  deliverables = [],
  releases = [],
  contentItems = [],
  assets = [],
  documents = [],
  initialStarter = null,
  onConsumeInitialStarter,
  onNavigateSection,
  onRequestProduction,
  onSaveToAssetLibrary,
  onAttachToRelease,
  onAttachToProject,
}) => {
  const isArtist = experience.isArtist;
  const audience = isArtist ? 'Artist' : 'Brand';
  const clientBucket = useMemo(
    () => resolveClientAudienceBucket(clientProfile?.accountType, workspace.type),
    [clientProfile?.accountType, workspace.type],
  );

  const [activeProduction, setActiveProduction] = useState<CreativeProductionItem | null>(null);
  const [starterModalOpen, setStarterModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [savedProductions, setSavedProductions] = useState<CreativeProductionItem[]>([]);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Load saved productions from localStorage AND subscribe to Firestore workspace studioProductions
  useEffect(() => {
    if (!workspace?.id) return;
    const localItems = loadStudioProductions(workspace.id);
    setSavedProductions(localItems);

    const studioRef = collection(db, 'workspaces', workspace.id, 'studioProductions');
    const unsub = onSnapshot(
      studioRef,
      snapshot => {
        const remoteItems = snapshot.docs.map(d => d.data() as CreativeProductionItem);
        const byId = new Map<string, CreativeProductionItem>();
        loadStudioProductions(workspace.id).forEach(item => byId.set(item.id, item));
        remoteItems.forEach(item => {
          const existing = byId.get(item.id);
          if (!existing || (item.updatedAt || '') >= (existing.updatedAt || '')) {
            byId.set(item.id, item);
            saveStudioProduction(workspace.id, item);
          }
        });
        const merged = Array.from(byId.values()).sort((a, b) =>
          (b.updatedAt || '').localeCompare(a.updatedAt || ''),
        );
        setSavedProductions(merged);
      },
      () => {
        // Silently retain localStorage drafts when offline or unauthenticated in preview
      },
    );
    return () => unsub();
  }, [workspace?.id]);

  const persistProductionEverywhere = (item: CreativeProductionItem) => {
    saveStudioProduction(workspace.id, item);
    try {
      const payload = stripUndefinedForFirestore(item);
      void setDoc(doc(db, 'workspaces', workspace.id, 'studioProductions', item.id), payload, {
        merge: true,
      }).catch(() => {});
    } catch {
      // Non-blocking remote sync
    }
  };

  const refreshSavedProductions = () => {
    if (!workspace?.id) return;
    setSavedProductions(loadStudioProductions(workspace.id));
  };

  const availableTools = useMemo(() => {
    const list = getToolsForAudience(audience, categoryFilter);
    if (!toolSearchQuery.trim()) return list;
    const q = toolSearchQuery.toLowerCase();
    return list.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.headline.toLowerCase().includes(q) ||
        t.formats.some(f => f.toLowerCase().includes(q)),
    );
  }, [audience, categoryFilter, toolSearchQuery]);

  const exportablePacks = useMemo(
    () =>
      products
        .filter(product =>
          isClientEligibleForProductDownload({
            product,
            clientBucket,
            workspaceId: workspace.id,
            workspaceStatus: workspace.status,
            contractedPackageIds: workspace.contractedPackageIds,
            activePackageIds: workspace.activePackageIds,
            activeServicePackageIds,
            packageEntitlements: workspace.packageEntitlements,
          }),
        )
        .slice(0, 6),
    [products, clientBucket, workspace, activeServicePackageIds],
  );

  const studioServices = useMemo(
    () => (isArtist ? ARTIST_CREATIVE_SERVICES : BRAND_BUSINESS_CREATIVE_SERVICES),
    [isArtist],
  );

  const handleLaunchProductionWithStarter = (starterParams: CreativeStarterParams) => {
    const newProduction = createStarterProduction({
      workspace,
      clientProfile,
      starter: starterParams,
    });
    persistProductionEverywhere(newProduction);
    refreshSavedProductions();
    setActiveProduction(newProduction);
    setStarterModalOpen(false);
  };

  // Auto-launch if deep-linked from Releases, Content Engine, Assets, Creative Hub, or Projects
  useEffect(() => {
    if (!initialStarter || !workspace?.id) return;
    handleLaunchProductionWithStarter(initialStarter);
    onConsumeInitialStarter?.();
  }, [initialStarter, workspace?.id]);

  const handleLaunchToolDirect = (tool: StudioToolDefinition) => {
    handleLaunchProductionWithStarter({
      source: 'scratch',
      toolId: tool.id,
      title: `${workspace.name} — ${tool.name}`,
    });
  };

  const handleOpenProduction = (item: CreativeProductionItem) => {
    setActiveProduction(item);
  };

  const handleDeleteProduction = (productionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStudioProduction(workspace.id, productionId);
    void deleteDoc(doc(db, 'workspaces', workspace.id, 'studioProductions', productionId)).catch(() => {});
    refreshSavedProductions();
    if (activeProduction?.id === productionId) {
      setActiveProduction(null);
    }
  };

  const handleDuplicateProduction = (productionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = duplicateStudioProduction(workspace.id, productionId);
    if (copy) {
      persistProductionEverywhere(copy);
      refreshSavedProductions();
      setNotice(`Duplicated production "${copy.title}".`);
    }
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleInstantPackExport = async (
    product: CreativeProduct,
    format: 'ZIP' | 'SVG' | 'PDF',
  ) => {
    setBusyId(`${product.id}:${format}`);
    setError('');
    setNotice('');
    try {
      const verified = await verifyResourceDownloadAccess({
        productId: product.id,
        workspaceId: workspace.id,
        accessType: product.accessType,
        unlockedByDefault: product.unlockedByDefault,
      });
      if (!verified.allowed) {
        throw new Error(verified.reason || 'Your current workspace package does not authorize instant download.');
      }

      const safeTitle = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pack';

      if (format === 'SVG') {
        const blob = generateEditableProductSvgBlob(product);
        triggerBlobDownload(blob, `${safeTitle}-studio-template.svg`);
      } else if (format === 'PDF') {
        const blob = generateStructuredDocumentPdfBlob(product, workspace.name);
        triggerBlobDownload(blob, `${safeTitle}-studio-guide.pdf`);
      } else {
        const files = getApprovedDownloadableFiles(product.files);
        if (files.length === 1) {
          await downloadProductStorageFile(files[0]);
        } else {
          const zipBlob = await packageProductDeliverablesZip({
            product,
            includeDocumentPdf: true,
            workspaceLabel: workspace.name,
          });
          triggerBlobDownload(zipBlob, `${safeTitle}-studio-pack.zip`);
        }
      }

      if (clientProfile?.uid) {
        await recordResourceHistoryEntry({
          uid: clientProfile.uid,
          workspaceId: workspace.id,
          product,
          action: 'download',
          format,
        });
      }
      setNotice(`Exported "${product.title}" (${format}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId('');
    }
  };

  const handleCustomizeProductInStudio = (product: CreativeProduct) => {
    handleLaunchProductionWithStarter({
      source: 'resource',
      toolId: 'pack-template-customizer',
      title: `${product.title} (Customization)`,
      linkedProductId: product.id,
      linkedProductTitle: product.title,
      prefillDesign: {
        headline: product.title.toUpperCase(),
        subtitle: product.summary || product.description,
        tagline: product.category.toUpperCase(),
      },
    });
  };

  const handleDownloadBrandGuide = () => {
    const bp = workspace.brandProfile;
    const payload: BrandGuidelinesData = {
      brandVoice:
        bp?.brandVoice?.trim() ||
        `${workspace.name} communicates with clarity, discipline, and consistent visual authority.`,
      photographyDirection:
        bp?.photographyDirection?.trim() ||
        'Use crisp editorial lighting, controlled contrast, and brand-aligned framing.',
      graphicDesignPrinciples:
        bp?.graphicDesignPrinciples?.trim() ||
        'Maintain modular grids, clean spacing, and readable typographic hierarchy.',
      clearSpaceRules:
        bp?.usageGuidelines?.trim() ||
        'Maintain clear exclusion space equal to the cap-height of the primary mark.',
      minLogoSizePrint: '24 mm minimum width',
      minLogoSizeDigital: '96 px minimum width',
      backgroundRules: `Primary lockup sits on clean white (#FFFFFF) or deep charcoal (${workspace.brand?.secondaryColor || '#0A0A0A'}) with accent (${workspace.brand?.primaryColor || '#FF1E1E'}).`,
      incorrectUsageRules: [
        'Do not stretch, shear, or compress logotype proportions.',
        'Do not recolor using unapproved vibrant secondary hues outside token palette.',
        'Do not drop low-resolution pixelated raster copies onto dark hero banners.',
        'Do not place primary logo over busy unmuted photographic compositions.',
      ],
    };
    generateBrandGuidelinesPdf(payload, workspace);
    setNotice(`Generated official Brand Guidelines PDF for ${workspace.name}.`);
  };

  // IF ACTIVE PRODUCTION SESSION IS OPEN -> RENDER STUDIO CANVAS EDITOR
  if (activeProduction) {
    return (
      <CreativeProductionStudio
        production={activeProduction}
        workspace={workspace}
        releases={releases}
        projects={projects}
        assets={assets}
        onBack={() => {
          setActiveProduction(null);
          refreshSavedProductions();
        }}
        onUpdateProduction={updated => {
          setActiveProduction(updated);
          persistProductionEverywhere(updated);
          refreshSavedProductions();
        }}
        onOpenDocumentBuilder={() => onNavigateSection('documents')}
        onSaveToAssetLibrary={onSaveToAssetLibrary}
        onAttachToRelease={onAttachToRelease}
        onAttachToProject={onAttachToProject}
      />
    );
  }

  // OTHERWISE -> RENDER STUDIO DASHBOARD & TOOL DIRECTORY
  return (
    <div className="space-y-6">
      {/* Studio Overview Header */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              {isArtist ? 'Artist OS · Creative Studio' : 'Brand OS · Creative Studio'}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-neutral-400">Production Engine Ready</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isArtist
              ? 'Artist Creative Studio & Production Engine'
              : 'Brand Creative Studio & Production Engine'}
          </h2>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
            {isArtist
              ? 'Produce DSP-compliant master release covers, 9:16 vertical Spotify Canvas loops, multi-format social teasers, and signed songwriter split sheets.'
              : 'Create conversion-ready product advertisements, branded social media campaigns, print collateral, and official brand guideline systems.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateSection('creative-hub')}
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Package size={13} />
            <span>Creative Hub</span>
          </button>
          <button
            type="button"
            onClick={() => setStarterModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/20"
          >
            <Plus size={14} />
            <span>New Production</span>
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* CONTINUED WORK / RECENT SAVED PRODUCTIONS */}
      {savedProductions.length > 0 && (
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">In-Progress Work</p>
              <h3 className="text-base font-bold text-white">Continue Production ({savedProductions.length})</h3>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">Persistent creative work across reloads</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedProductions.slice(0, 6).map(prod => (
              <div
                key={prod.id}
                onClick={() => handleOpenProduction(prod)}
                className="group rounded border border-[#222] bg-[#111] p-3.5 flex flex-col justify-between gap-3 cursor-pointer hover:border-[#FF1E1E] hover:bg-[#141414] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-white line-clamp-1 group-hover:text-red-300 transition-colors">
                      {prod.title}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        prod.status === 'Completed'
                          ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                          : prod.status === 'Approved'
                            ? 'border-blue-500/30 bg-blue-950/30 text-blue-400'
                            : 'border-amber-500/30 bg-amber-950/30 text-amber-400'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500">
                    {prod.dimensions.label} · {prod.toolId}
                  </p>
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    "{prod.designState.headline}" — {prod.designState.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#1C1C1C] pt-2 text-[10px] font-mono text-neutral-500">
                  <span>Edited: {new Date(prod.updatedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => handleDuplicateProduction(prod.id, e)}
                      className="p-1 hover:text-white rounded border border-[#242424] hover:border-[#383838]"
                      title="Duplicate production"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={e => handleDeleteProduction(prod.id, e)}
                      className="p-1 hover:text-red-400 rounded border border-[#242424] hover:border-red-900"
                      title="Delete draft"
                    >
                      <Trash2 size={11} />
                    </button>
                    <span className="text-[#FF1E1E] group-hover:translate-x-0.5 transition-transform font-bold">
                      Resume →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STUDIO TOOL DIRECTORY */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Directory</p>
            <h3 className="text-base font-bold text-white">Creative Production Tools</h3>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search studio tools…"
              value={toolSearchQuery}
              onChange={e => setToolSearchQuery(e.target.value)}
              className="w-full rounded border border-[#262626] bg-[#121212] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['All', 'Music & Releases', 'Social & Marketing', 'Brand & Identity', 'Motion & DSPs', 'Documents & Legal'].map(
            cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded px-3 py-1 text-xs font-mono transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#1C1C1C] text-white border border-[#FF1E1E] font-bold'
                    : 'border border-[#222] text-neutral-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                {cat}
              </button>
            ),
          )}
        </div>

        {/* Tools Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableTools.map(tool => (
            <article
              key={tool.id}
              className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3 hover:border-[#383838] transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                    {tool.category}
                  </span>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-[#FF1E1E]/40 text-[#FF1E1E]">
                    {tool.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{tool.name}</h4>
                <p className="text-[11px] font-mono text-neutral-400 leading-snug">{tool.headline}</p>
                <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">{tool.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tool.formats.map(fmt => (
                    <span key={fmt} className="text-[9px] font-mono rounded bg-[#161616] border border-[#242424] px-1.5 py-0.5 text-neutral-400">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1C1C1C] pt-3">
                <button
                  type="button"
                  onClick={() => handleLaunchToolDirect(tool)}
                  className="w-full inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Wand2 size={13} className="text-[#FF1E1E]" />
                    <span>Launch Studio</span>
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BUILT-IN STUDIO COLLATERAL & PRESS BUILDERS */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Built-In Studio Tools</p>
            <h3 className="text-base font-bold text-white">
              {isArtist ? 'Artist Document & Press Builders' : 'Brand Identity & Collateral Builders'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('documents')}
            className="text-xs font-medium text-neutral-300 hover:text-white"
          >
            Open full {isArtist ? 'Artist Documents' : 'Brand & Business Docs'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isArtist ? (
            <>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <Music2 size={18} className="text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Artist EPK &amp; Press Bio PDF</h4>
                  <p className="text-xs text-neutral-400">
                    Compile artist profile, releases, booking details, and press links into a structured A4 EPK packet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection('documents')}
                  className="inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <span>Open EPK Builder</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <FileText size={18} className="text-[#FF1E1E]" />
                  <h4 className="text-sm font-bold text-white">100% Split Sheet &amp; Tracklist</h4>
                  <p className="text-xs text-neutral-400">
                    Verify songwriter and producer royalty percentages before release distribution and export a signed PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection('documents')}
                  className="inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <span>Open Split Sheet Tool</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <Layers size={18} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Release Copy &amp; Rollout Kit</h4>
                  <p className="text-xs text-neutral-400">
                    Draft scheduled captions, lyric cards, and pre-release notes tied directly to your catalog releases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection('content')}
                  className="inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <span>Open Content Engine</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <Palette size={18} className="text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Brand Guidelines PDF Export</h4>
                  <p className="text-xs text-neutral-400">
                    Export your live brand palette tokens, typography pairing, and usage rules as a crisp A4 Brand Guide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBrandGuide}
                  className="inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <span>Download Brand Guide PDF</span>
                  <ArrowDownToLine size={13} />
                </button>
              </div>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <CreditCard size={18} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Business Cards &amp; Staff IDs</h4>
                  <p className="text-xs text-neutral-400">
                    Design print-ready business cards and staff identification badges using your Brand OS tokens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection('documents')}
                  className="inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <span>Open Collateral Designers</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <Mail size={18} className="text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Email Signature &amp; Copy Studio</h4>
                  <p className="text-xs text-neutral-400">
                    Build branded corporate email signatures or manage product/social content schedules in Content Studio.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateSection('documents')}
                    className="flex-1 rounded border border-[#2E2E2E] bg-[#161616] px-2.5 py-2 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    Signatures
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('content')}
                    className="flex-1 rounded border border-[#2E2E2E] bg-[#161616] px-2.5 py-2 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    Content Studio
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* UNLOCKED CREATIVE HUB PACKS */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              Unlocked Creative Packs
            </p>
            <h3 className="text-base font-bold text-white">Instant Template &amp; Pack Exports</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('creative-hub')}
            className="text-xs font-medium text-neutral-300 hover:text-white"
          >
            Browse full Creative Hub ({products.length})
          </button>
        </div>

        {exportablePacks.length === 0 ? (
          <div className="rounded border border-dashed border-[#2C2C2C] p-6 text-center space-y-2">
            <Sparkles size={20} className="mx-auto text-neutral-600" />
            <p className="text-xs text-neutral-400">
              No unlocked instant packs yet. Explore the Creative Hub for free packs, monthly drops, or request custom customization.
            </p>
            <button
              type="button"
              onClick={() => onNavigateSection('creative-hub')}
              className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
            >
              Browse Creative Hub
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exportablePacks.map(product => {
              const statusSummary = getProductDownloadStatusSummary({
                product,
                clientBucket,
                workspaceId: workspace.id,
                workspaceStatus: workspace.status,
                contractedPackageIds: workspace.contractedPackageIds,
                activePackageIds: workspace.activePackageIds,
                activeServicePackageIds,
                packageEntitlements: workspace.packageEntitlements,
              });
              return (
                <article
                  key={product.id}
                  className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{product.title}</h4>
                      <BadgeCheck size={14} className="text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] font-mono text-neutral-500">
                      {product.category} · {statusSummary.badgeLabel}
                    </p>
                    <p className="text-xs text-neutral-400 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[#1C1C1C] pt-3">
                    <button
                      type="button"
                      onClick={() => handleCustomizeProductInStudio(product)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-2.5 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                    >
                      <Wand2 size={12} className="text-[#FF1E1E]" />
                      <span>Customize in Studio</span>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === `${product.id}:SVG`}
                        onClick={() => void handleInstantPackExport(product, 'SVG')}
                        className="flex-1 rounded border border-[#2A2A2A] bg-[#161616] px-2 py-1 text-[11px] font-mono text-neutral-300 hover:text-white disabled:opacity-50"
                      >
                        {busyId === `${product.id}:SVG` ? 'Exporting…' : 'SVG'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `${product.id}:PDF`}
                        onClick={() => void handleInstantPackExport(product, 'PDF')}
                        className="flex-1 rounded border border-[#2A2A2A] bg-[#161616] px-2 py-1 text-[11px] font-mono text-neutral-300 hover:text-white disabled:opacity-50"
                      >
                        {busyId === `${product.id}:PDF` ? 'Exporting…' : 'PDF'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `${product.id}:ZIP`}
                        onClick={() => void handleInstantPackExport(product, 'ZIP')}
                        className="flex-1 rounded border border-[#2A2A2A] bg-[#161616] px-2 py-1 text-[11px] font-mono text-neutral-300 hover:text-white disabled:opacity-50"
                      >
                        {busyId === `${product.id}:ZIP` ? 'Packaging…' : 'ZIP'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* GUIDED PRODUCTION BRIEFS */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Bespoke Production</p>
            <h3 className="text-base font-bold text-white">
              {isArtist ? 'Artist Creative Production Services' : 'Brand Identity & Media Production'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('requests')}
            className="text-xs font-medium text-neutral-300 hover:text-white"
          >
            View all Creative Requests
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studioServices.map(svc => (
            <div
              key={svc.id}
              className="rounded border border-[#222] bg-[#111] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{svc.title}</h4>
                  <span className="text-[10px] font-mono uppercase text-neutral-500">{svc.turnaroundHint}</span>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">{svc.subtitle}</p>
                <ul className="space-y-1 text-[11px] text-neutral-400">
                  {svc.deliverables.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="h-1 w-1 rounded-full bg-[#FF1E1E] shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  onRequestProduction({
                    title: `${workspace.name} — ${svc.title}`,
                    category: svc.category,
                    description: `Creative request for ${svc.title}. ${svc.subtitle}`,
                    requiredDeliverables: svc.deliverables,
                  })
                }
                className="w-full rounded border border-[#2E2E2E] bg-[#161616] px-3 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] transition-colors text-center"
              >
                Submit {svc.title} Brief
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 8-WAY PROJECT STARTER MODAL */}
      {starterModalOpen && (
        <CreativeProjectStarterModal
          workspace={workspace}
          clientProfile={clientProfile}
          experienceMode={isArtist ? 'artist' : 'brand'}
          releases={releases}
          projects={projects}
          assets={assets}
          products={products}
          onClose={() => setStarterModalOpen(false)}
          onLaunchProduction={handleLaunchProductionWithStarter}
        />
      )}
    </div>
  );
};
