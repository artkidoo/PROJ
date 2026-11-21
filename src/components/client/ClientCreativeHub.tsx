import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  FolderCheck,
  Image as ImageIcon,
  Layers,
  Lock,
  Package,
  Ruler,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type { ClientProfile, Workspace } from '../../types';
import type {
  CreativeProduct,
  CreativeProductAudience,
  CreativeProductDeliverableFile,
} from '../../types/creativeProduct';
import {
  ARTIST_CREATIVE_SERVICES,
  BRAND_BUSINESS_CREATIVE_SERVICES,
  buildProductRequestPrefill,
  type ClientExperienceConfig,
  type ClientTab,
  type ProductionRequestPrefill,
} from '../../lib/clientOS';
import {
  ARTIST_PRODUCT_FAMILIES,
  BRAND_BUSINESS_PRODUCT_FAMILIES,
  formatBytesCompact,
  getApprovedDownloadableFiles,
  getProductDownloadStatusSummary,
  isClientEligibleForProductDownload,
  isClientEligibleForProductView,
  isWorkspaceStatusEligible,
  resolveActiveWorkspacePackageIds,
  resolveClientAudienceBucket,
  resolveProductFamily,
  STREAMING_PLATFORM_DIMENSIONS,
} from '../../lib/creativeProductAccess';
import { downloadProductStorageFile } from '../../lib/creativeProducts';
import { Modal } from '../common/Modal';

export interface ClientCreativeHubProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  experience: ClientExperienceConfig;
  onRequestProduction: (prefill?: Partial<ProductionRequestPrefill>) => void;
  onNavigateSection: (tab: ClientTab) => void;
}

type AccessFilterMode = 'all' | 'downloadable' | 'package' | 'assigned' | 'request-only';

export const ClientCreativeHub: React.FC<ClientCreativeHubProps> = ({
  workspace,
  clientProfile,
  experience,
  onRequestProduction,
  onNavigateSection,
}) => {
  const clientBucket = useMemo(
    () => resolveClientAudienceBucket(clientProfile?.accountType, workspace.type),
    [clientProfile?.accountType, workspace.type],
  );

  const allowedQueryAudiences = useMemo<CreativeProductAudience[]>(() => {
    if (clientBucket === 'Artist') return ['Artist', 'Shared'];
    if (clientBucket === 'Business') return ['Business', 'Brand & Business', 'Shared'];
    return ['Brand', 'Brand & Business', 'Shared'];
  }, [clientBucket]);

  const productFamilies = useMemo(
    () => (experience.isArtist ? ARTIST_PRODUCT_FAMILIES : BRAND_BUSINESS_PRODUCT_FAMILIES),
    [experience.isArtist],
  );

  const serviceOptions = useMemo(
    () => (experience.isArtist ? ARTIST_CREATIVE_SERVICES : BRAND_BUSINESS_CREATIVE_SERVICES),
    [experience.isArtist],
  );

  const [productsByQueryKey, setProductsByQueryKey] = useState<Record<string, CreativeProduct[]>>({});
  const [activeServicePackageIds, setActiveServicePackageIds] = useState<Set<string> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadNotice, setDownloadNotice] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState('');

  const [activeFamily, setActiveFamily] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [accessFilter, setAccessFilter] = useState<AccessFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStreamingMatrix, setShowStreamingMatrix] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CreativeProduct | null>(null);

  useEffect(() => {
    setActiveFamily('All');
    setActiveSubcategory('All');
  }, [experience.isArtist]);

  useEffect(() => {
    setActiveSubcategory('All');
  }, [activeFamily]);

  // Subscribe to active service packages so deactivated or unknown packages never unlock products
  useEffect(() => {
    if (!workspace.id || clientProfile?.onboardingComplete !== true) {
      setActiveServicePackageIds(new Set());
      return;
    }
    const unsubServices = onSnapshot(
      query(collection(db, 'services'), where('isActive', '==', true)),
      snap => {
        setActiveServicePackageIds(new Set(snap.docs.map(d => d.id)));
      },
      err => {
        console.warn('Unable to load active service package catalog:', err);
        setActiveServicePackageIds(new Set());
      },
    );
    return () => unsubServices();
  }, [workspace.id, clientProfile?.onboardingComplete]);

  const validContractedPackageIds = useMemo(
    () =>
      resolveActiveWorkspacePackageIds({
        workspaceId: workspace.id,
        workspaceStatus: workspace.status,
        contractedPackageIds: workspace.contractedPackageIds,
        activeServicePackageIds,
        packageEntitlements: workspace.packageEntitlements,
      }),
    [
      workspace.id,
      workspace.status,
      workspace.contractedPackageIds,
      workspace.packageEntitlements,
      activeServicePackageIds,
    ],
  );

  useEffect(() => {
    if (
      !workspace.id ||
      clientProfile?.onboardingComplete !== true ||
      !isWorkspaceStatusEligible(workspace.status)
    ) {
      setProductsByQueryKey({});
      setLoading(false);
      return;
    }

    // Wait for active service packages to settle if workspace declares contractedPackageIds
    if (
      Array.isArray(workspace.contractedPackageIds) &&
      workspace.contractedPackageIds.length > 0 &&
      activeServicePackageIds === undefined
    ) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError('');
    setProductsByQueryKey({});

    const expectedKeys = new Set<string>();
    const settledKeys = new Set<string>();
    const unsubs: Array<() => void> = [];

    const markSettled = (key: string) => {
      settledKeys.add(key);
      if (settledKeys.size >= expectedKeys.size) {
        setLoading(false);
      }
    };

    for (const aud of allowedQueryAudiences) {
      const publicKey = `open:${aud}`;
      expectedKeys.add(publicKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('accessType', 'in', ['Free', 'RequestRequired']),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [publicKey]: rows }));
            markSettled(publicKey);
          },
          err => {
            setError(err?.message || 'Unable to load Creative Hub products.');
            markSettled(publicKey);
          },
        ),
      );

      const assignedKey = `assigned:${aud}`;
      expectedKeys.add(assignedKey);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'creativeProducts'),
            where('status', '==', 'Published'),
            where('audience', '==', aud),
            where('assignedWorkspaceIds', 'array-contains', workspace.id),
          ),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
            setProductsByQueryKey(prev => ({ ...prev, [assignedKey]: rows }));
            markSettled(assignedKey);
          },
          err => {
            setError(err?.message || 'Unable to load workspace-assigned creative products.');
            markSettled(assignedKey);
          },
        ),
      );

      for (const pkgId of validContractedPackageIds.slice(0, 5)) {
        const pkgKey = `pkg:${aud}:${pkgId}`;
        expectedKeys.add(pkgKey);
        unsubs.push(
          onSnapshot(
            query(
              collection(db, 'creativeProducts'),
              where('status', '==', 'Published'),
              where('audience', '==', aud),
              where('accessType', '==', 'IncludedInPackage'),
              where('includedPackageIds', 'array-contains', pkgId),
            ),
            snap => {
              const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeProduct));
              setProductsByQueryKey(prev => ({ ...prev, [pkgKey]: rows }));
              markSettled(pkgKey);
            },
            err => {
              setError(err?.message || 'Unable to load package-entitled creative products.');
              markSettled(pkgKey);
            },
          ),
        );
      }
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [
    workspace.id,
    workspace.status,
    workspace.contractedPackageIds,
    clientProfile?.onboardingComplete,
    allowedQueryAudiences,
    validContractedPackageIds,
    activeServicePackageIds,
  ]);

  const eligibilityBase = useMemo(
    () => ({
      clientBucket,
      workspaceId: workspace.id,
      workspaceStatus: workspace.status,
      contractedPackageIds: workspace.contractedPackageIds || [],
      activeServicePackageIds,
      packageEntitlements: workspace.packageEntitlements,
    }),
    [
      clientBucket,
      workspace.id,
      workspace.status,
      workspace.contractedPackageIds,
      activeServicePackageIds,
      workspace.packageEntitlements,
    ],
  );

  const eligibleProducts = useMemo(() => {
    const merged = new Map<string, CreativeProduct>();
    for (const group of Object.values(productsByQueryKey)) {
      for (const product of group) {
        if (
          isClientEligibleForProductView({
            product,
            ...eligibilityBase,
          })
        ) {
          merged.set(product.id, product);
        }
      }
    }
    return Array.from(merged.values()).sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [productsByQueryKey, eligibilityBase]);

  const downloadableCount = useMemo(
    () =>
      eligibleProducts.filter(
        product =>
          isClientEligibleForProductDownload({
            product,
            ...eligibilityBase,
          }) && getApprovedDownloadableFiles(product.files).length > 0,
      ).length,
    [eligibleProducts, eligibilityBase],
  );

  const assignedCount = useMemo(
    () => eligibleProducts.filter(product => product.assignedWorkspaceIds?.includes(workspace.id)).length,
    [eligibleProducts, workspace.id],
  );

  const availableSubcategories = useMemo(() => {
    const pool =
      activeFamily === 'All' || activeFamily === '__assigned__'
        ? eligibleProducts
        : eligibleProducts.filter(p => resolveProductFamily(p) === activeFamily);
    return Array.from(new Set(pool.map(p => (p.subcategory || '').trim()).filter(Boolean)));
  }, [eligibleProducts, activeFamily]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eligibleProducts.filter(product => {
      const family = resolveProductFamily(product);
      const summary = getProductDownloadStatusSummary({
        product,
        ...eligibilityBase,
      });

      if (activeFamily === '__assigned__') {
        if (!summary.isAssignedToWorkspace && summary.approvedFilesCount === 0) return false;
      } else if (activeFamily !== 'All' && family !== activeFamily) {
        return false;
      }

      if (activeSubcategory !== 'All' && (product.subcategory || '').trim() !== activeSubcategory) {
        return false;
      }

      if (accessFilter === 'downloadable' && summary.approvedFilesCount === 0) return false;
      if (
        accessFilter === 'package' &&
        product.accessType !== 'Free' &&
        product.accessType !== 'IncludedInPackage'
      ) {
        return false;
      }
      if (accessFilter === 'assigned' && !summary.isAssignedToWorkspace) return false;
      if (accessFilter === 'request-only' && product.accessType !== 'RequestRequired') return false;

      if (!q) return true;
      return (
        product.title.toLowerCase().includes(q) ||
        family.toLowerCase().includes(q) ||
        product.summary.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.subcategory || '').toLowerCase().includes(q) ||
        product.deliverablesSummary.some(item => item.toLowerCase().includes(q))
      );
    });
  }, [
    eligibleProducts,
    activeFamily,
    activeSubcategory,
    accessFilter,
    searchQuery,
    eligibilityBase,
  ]);

  const handleDownloadFile = async (product: CreativeProduct, file: CreativeProductDeliverableFile) => {
    const canDownload = isClientEligibleForProductDownload({
      product,
      ...eligibilityBase,
    });
    const isApprovedSafeFile = getApprovedDownloadableFiles(product.files).some(f => f.id === file.id);
    if (!canDownload || !file.isApprovedForClient || !isApprovedSafeFile) {
      setError('This deliverable is not currently unlocked for download in your workspace.');
      return;
    }
    setDownloadingFileId(file.id);
    setError('');
    setDownloadNotice('');
    try {
      await downloadProductStorageFile({
        storagePath: file.storagePath,
        fileName: file.fileName,
        isApprovedForClient: file.isApprovedForClient,
      });
      setDownloadNotice(`Downloaded "${file.label || file.fileName}" (${file.fileFormat}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download deliverable file.');
    } finally {
      setDownloadingFileId('');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}
      {downloadNotice && (
        <div role="status" className="border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </span>
          <button type="button" onClick={() => setDownloadNotice('')} className="underline text-emerald-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Hub Summary Hero & Metrics */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              {experience.isArtist ? 'Artist Creative Hub' : 'Brand & Business Creative Hub'}
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {experience.isArtist
                ? 'Streaming Visual Packs, Release Kits & Artist Press Systems'
                : 'Brand Identity Systems, Business Documents & Marketing Kits'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              {experience.isArtist
                ? 'Explore organized platform packs, release rollout graphics, EPKs, and lyric visuals built by KeedoHub Studio. Download approved workspace files directly or request a bespoke release kit.'
                : 'Browse complete Brand Identity systems, social content kits, executive Business Documents (profiles, proposals, quotations, invoices, pitch decks), and marketing flyers tailored to your workspace.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {experience.isArtist && (
              <button
                type="button"
                onClick={() => setShowStreamingMatrix(prev => !prev)}
                className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-white"
              >
                <Ruler size={13} className="text-[#FF1E1E]" />
                <span>{showStreamingMatrix ? 'Hide Streaming Specs' : 'Streaming Dimensions'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateSection('deliverables')}
              className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-white"
            >
              <FolderCheck size={13} />
              <span>Project Deliverables</span>
            </button>
            <button
              type="button"
              onClick={() => onRequestProduction()}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <Send size={13} />
              <span>Request Custom Service</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Available Products</p>
            <p className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">{eligibleProducts.length}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Ready Downloads</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-400 font-mono tabular-nums">{downloadableCount}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Workspace Assigned</p>
            <p className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">{assignedCount}</p>
          </div>
          <div className="border border-[#1E1E1E] bg-[#111111] p-3.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Custom Services</p>
            <p className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">{serviceOptions.length}</p>
          </div>
        </div>
      </section>

      {/* Product Family Selector Cards (Responsive Grid, No Horizontal Carousel) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              Product Families
            </p>
            <h3 className="text-sm font-bold text-white">Browse by Creative Collection</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFamily('All')}
              className={`border px-3 py-1 text-xs font-mono ${
                activeFamily === 'All'
                  ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                  : 'border-[#252525] bg-[#101010] text-neutral-400 hover:text-white'
              }`}
            >
              All Families ({eligibleProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFamily('__assigned__')}
              className={`border px-3 py-1 text-xs font-mono ${
                activeFamily === '__assigned__'
                  ? 'border-emerald-500/70 bg-emerald-950/30 text-emerald-200'
                  : 'border-[#252525] bg-[#101010] text-neutral-400 hover:text-white'
              }`}
            >
              Downloadable &amp; Assigned ({downloadableCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {productFamilies.map((family, idx) => {
            const count = eligibleProducts.filter(p => resolveProductFamily(p) === family.label).length;
            const readyInFamily = eligibleProducts.filter(
              p =>
                resolveProductFamily(p) === family.label &&
                isClientEligibleForProductDownload({
                  product: p,
                  ...eligibilityBase,
                }) &&
                getApprovedDownloadableFiles(p.files).length > 0,
            ).length;
            const active = activeFamily === family.label;
            return (
              <button
                key={family.id}
                type="button"
                onClick={() => setActiveFamily(active ? 'All' : family.label)}
                className={`text-left border p-4 transition-colors flex flex-col justify-between gap-2 ${
                  active
                    ? 'border-[#FF1E1E] bg-[#FF1E1E]/10'
                    : 'border-[#202020] bg-[#0C0C0C] hover:border-[#3A3A3A]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase">
                    <span className="text-[#FF1E1E]">0{idx + 1}</span>
                    <span className="text-neutral-400 tabular-nums">{count} packs</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{family.label}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{family.description}</p>
                </div>
                <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono">
                  <span className={readyInFamily > 0 ? 'text-emerald-400' : 'text-neutral-500'}>
                    {readyInFamily > 0 ? `${readyInFamily} download ready` : 'Specs & custom studio'}
                  </span>
                  <span className="text-neutral-400">{active ? 'Active' : 'Filter'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Artist Streaming Platform Dimension Guide */}
      {experience.isArtist &&
        (showStreamingMatrix || activeFamily === 'Streaming & Music Platform Assets') && (
          <section className="rounded-lg border border-[#242424] bg-[#0B0B0B] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Streaming Platform Visual Specifications</h3>
                <p className="text-xs text-neutral-500">
                  KeedoHub production specs across Spotify, Apple Music, YouTube Music, Audiomack &amp; Boomplay.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onRequestProduction({
                    title: `${workspace.name} — Multi-Platform Streaming Pack`,
                    category: 'Streaming Pack',
                    description: 'Full DSP visual suite formatted for Spotify, Apple Music, YouTube Music, Audiomack & Boomplay.',
                    targetPlatforms: ['Spotify Canvas', 'Spotify Header', 'Apple Music', 'YouTube Music', 'Audiomack', 'Boomplay'],
                    requiredDeliverables: ['3000×3000 Master Cover', '1080×1920 Canvas/Reel', 'Wide Artist Headers', 'Milestone Cards'],
                    intendedUse: 'Multi-platform DSP release rollout',
                  })
                }
                className="text-xs font-semibold text-[#FF1E1E] hover:text-white inline-flex items-center gap-1"
              >
                <span>Request full streaming pack</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {STREAMING_PLATFORM_DIMENSIONS.map(spec => (
                <div key={spec.platform} className="border border-[#1E1E1E] bg-[#111111] p-3 space-y-1">
                  <p className="text-xs font-bold text-white">{spec.platform}</p>
                  <p className="text-[11px] font-mono text-[#FF1E1E] tabular-nums">{spec.dimensions}</p>
                  <p className="text-[11px] text-neutral-400">
                    {spec.aspectRatio} · {spec.notes}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Brand/Business Document Systems Callout */}
      {!experience.isArtist && (activeFamily === 'All' || activeFamily === 'Business Documents') && (
        <section className="rounded-lg border border-[#242424] bg-[#0B0B0B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white">
              <FileText size={15} className="text-[#FF1E1E]" />
              <h3 className="text-sm font-bold">Business Documents &amp; Executive Collateral</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Commission custom company profiles, commercial proposals, quotation &amp; invoice layouts, pitch decks, brochures, or client onboarding packs aligned with {workspace.name}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection('documents')}
              className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:border-white"
            >
              Open Business Vault
            </button>
            <button
              type="button"
              onClick={() =>
                onRequestProduction({
                  title: `${workspace.name} — Business Document System`,
                  category: 'Business Cards',
                  description: `Requesting custom branded business documents (company profile, proposal layout, quotation/invoice suite, pitch deck, and onboarding packet) for ${workspace.name}.`,
                  intendedUse: 'Client proposals, sales collateral & executive presentations',
                  targetPlatforms: ['A4 / US Letter Print PDF', '16:9 Pitch Deck', 'Email PDF'],
                  requiredDeliverables: ['Company Profile PDF', 'Proposal & Quotation Template', 'Invoice & Receipt Layout', 'Brochure / Pitch Deck'],
                  packagingSpec: 'PDF, SVG, ZIP',
                })
              }
              className="bg-[#FF1E1E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
            >
              Request Document Suite
            </button>
          </div>
        </section>
      )}

      {/* Subcategory Chips + Search + Access Filters */}
      <section className="space-y-3 border-t border-[#181818] pt-4">
        {availableSubcategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubcategory('All')}
              className={`border px-2.5 py-1 text-[11px] font-mono ${
                activeSubcategory === 'All'
                  ? 'border-white bg-white/10 text-white'
                  : 'border-[#232323] bg-[#0F0F0F] text-neutral-400 hover:text-white'
              }`}
            >
              All Focus Areas
            </button>
            {availableSubcategories.map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveSubcategory(activeSubcategory === sub ? 'All' : sub)}
                className={`border px-2.5 py-1 text-[11px] font-mono ${
                  activeSubcategory === sub
                    ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white'
                    : 'border-[#232323] bg-[#0F0F0F] text-neutral-400 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search creative packs, platforms, documents, specs…"
              className="w-full border border-[#262626] bg-[#111111] pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter creative products by access"
            value={accessFilter}
            onChange={event => setAccessFilter(event.target.value as AccessFilterMode)}
            className="border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white"
          >
            <option value="all">All Access Levels</option>
            <option value="downloadable">Download Ready (Approved Files)</option>
            <option value="package">Free &amp; Included in Package</option>
            <option value="assigned">Assigned to Your Workspace</option>
            <option value="request-only">Custom Production Request Only</option>
          </select>
        </div>
      </section>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-12 text-center text-xs text-neutral-400">
          Loading Creative Hub catalog…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-dashed border-[#2C2C2C] bg-[#0C0C0C] p-10 text-center space-y-3">
          <Package size={26} className="mx-auto text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-200">
            No published Creative Products match the current filter.
          </p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Switch Product Families or request any custom creative pack below — KeedoHub Studio will produce and publish files directly to your workspace.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveFamily('All');
              setActiveSubcategory('All');
              setAccessFilter('all');
              setSearchQuery('');
            }}
            className="border border-[#333] bg-[#141414] px-3.5 py-2 text-xs text-white hover:border-[#FF1E1E]"
          >
            Reset Catalog Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const family = resolveProductFamily(product);
            const accessSummary = getProductDownloadStatusSummary({
              product,
              ...eligibilityBase,
            });
            const approvedFiles = accessSummary.canDownload
              ? getApprovedDownloadableFiles(product.files)
              : [];

            return (
              <article
                key={product.id}
                className="border border-[#1E1E1E] bg-[#0C0C0C] flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="relative h-44 bg-[#121212] border-b border-[#1A1A1A] overflow-hidden">
                    {product.previewImageUrl ? (
                      <img
                        src={product.previewImageUrl}
                        alt={product.previewAlt || product.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-neutral-600">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-4 py-2.5 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider">
                      <span className="text-neutral-200 truncate">{family}</span>
                      <span
                        className={`shrink-0 ${
                          accessSummary.state === 'download-ready'
                            ? 'text-emerald-400'
                            : accessSummary.state === 'workspace-assigned'
                              ? 'text-white'
                              : accessSummary.state === 'included-in-package'
                                ? 'text-amber-300'
                                : 'text-neutral-300'
                        }`}
                      >
                        {accessSummary.badgeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {product.subcategory && (
                          <p className="text-[10px] font-mono uppercase tracking-wider text-[#FF1E1E] truncate">
                            {product.subcategory}
                          </p>
                        )}
                        <h3 className="text-base font-bold text-white leading-snug">{product.title}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0 tabular-nums">{product.version}</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {product.summary || product.description}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-500">
                      Formats: {product.supportedFormats.join(' · ') || 'Custom'}
                    </p>
                    {product.deliverablesSummary.length > 0 && (
                      <ul className="pt-1 space-y-1 text-xs text-neutral-300">
                        {product.deliverablesSummary.slice(0, 3).map(item => (
                          <li key={item} className="truncate">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#181818] bg-[#090909] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-white hover:text-white"
                  >
                    Specs &amp; Deliverables
                  </button>
                  <div className="flex items-center gap-2">
                    {approvedFiles.length === 1 && (
                      <button
                        type="button"
                        disabled={downloadingFileId === approvedFiles[0].id}
                        onClick={() => void handleDownloadFile(product, approvedFiles[0])}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <Download size={12} />
                        <span>{downloadingFileId === approvedFiles[0].id ? 'Downloading…' : 'Download'}</span>
                      </button>
                    )}
                    {approvedFiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <Download size={12} />
                        <span>Files ({approvedFiles.length})</span>
                      </button>
                    )}
                    {approvedFiles.length === 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onRequestProduction(buildProductRequestPrefill({ product, workspaceName: workspace.name }))
                        }
                        className="inline-flex items-center gap-1 bg-[#FF1E1E] hover:bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <Send size={12} />
                        <span>Request Custom</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Additional Creative Services Grid */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 space-y-4">
        <div className="border-b border-[#1A1A1A] pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              Additional Creative Services
            </p>
            <h3 className="mt-1 text-base font-bold text-white">
              {experience.isArtist ? 'Commission Artist Production Services' : 'Commission Brand & Business Creative Services'}
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">Routes directly to KeedoHub Admin HQ pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceOptions.map(service => (
            <div key={service.id} className="border border-[#1E1E1E] bg-[#111111] p-4 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                      {service.category} · Est. {service.turnaroundHint}
                    </p>
                    <h4 className="mt-1 text-sm font-bold text-white">{service.title}</h4>
                  </div>
                  <Layers size={15} className="text-[#FF1E1E] shrink-0" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{service.subtitle}</p>
                <div className="text-[11px] text-neutral-300 space-y-0.5 pt-1">
                  {service.deliverables.map(item => (
                    <p key={item}>· {item}</p>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#1A1A1A] pt-3">
                <span className="text-[11px] font-mono text-neutral-500">
                  Formats: {service.defaultFormats.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onRequestProduction({
                      title: `${workspace.name} — ${service.title}`,
                      category: service.category,
                      description: `Commissioning "${service.title}" for ${workspace.name}.\n\n${service.subtitle}`,
                      requirements: `Included deliverables:\n- ${service.deliverables.join('\n- ')}`,
                      intendedUse: service.title,
                      requiredDeliverables: service.deliverables,
                      packagingSpec: service.defaultFormats.join(', '),
                    })
                  }
                  className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                >
                  <Sparkles size={12} />
                  <span>Request</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Detail & Approved Download Modal */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        maxWidth="xl"
        title={selectedProduct?.title || 'Creative Product Details'}
        subtitle={
          selectedProduct
            ? `${resolveProductFamily(selectedProduct)}${selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ''} · ${selectedProduct.version}`
            : undefined
        }
      >
        {selectedProduct && (() => {
          const accessSummary = getProductDownloadStatusSummary({
            product: selectedProduct,
            ...eligibilityBase,
          });
          const approvedFiles = accessSummary.canDownload
            ? getApprovedDownloadableFiles(selectedProduct.files)
            : [];

          return (
            <div className="space-y-5 text-xs">
              {selectedProduct.previewImageUrl && (
                <div className="max-h-72 overflow-hidden border border-[#222222] bg-[#111111]">
                  <img
                    src={selectedProduct.previewImageUrl}
                    alt={selectedProduct.previewAlt || selectedProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-72 object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-[#1E1E1E] bg-[#101010] p-3.5">
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Availability Status</p>
                  <p className="mt-0.5 font-semibold text-white">{accessSummary.badgeLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Formats</p>
                  <p className="mt-0.5 font-mono text-white">{selectedProduct.supportedFormats.join(', ') || 'Custom'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-neutral-500">Version</p>
                  <p className="mt-0.5 font-mono text-white tabular-nums">{selectedProduct.version}</p>
                </div>
              </div>

              <div className="border border-[#1E1E1E] bg-[#0D0D0D] px-3.5 py-2.5 text-neutral-300">
                {accessSummary.explanation}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Overview</h4>
                <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {selectedProduct.description || selectedProduct.summary}
                </p>
              </div>

              {selectedProduct.deliverablesSummary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Included Deliverables</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-neutral-300">
                    {selectedProduct.deliverablesSummary.map(item => (
                      <li key={item} className="border border-[#1E1E1E] bg-[#111111] px-3 py-2">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProduct.dimensionSpecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Platform &amp; Print Dimensions</h4>
                  <div className="overflow-x-auto border border-[#1E1E1E]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E1E] bg-[#121212] text-[10px] font-mono uppercase text-neutral-400">
                          <th className="px-3 py-2">Platform / Placement</th>
                          <th className="px-3 py-2">Dimensions</th>
                          <th className="px-3 py-2">Aspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {selectedProduct.dimensionSpecs.map((spec, idx) => (
                          <tr key={`${spec.platform}-${idx}`} className="bg-[#0B0B0B]">
                            <td className="px-3 py-2 font-medium text-white">{spec.platform}</td>
                            <td className="px-3 py-2 font-mono text-[#FF1E1E] tabular-nums">{spec.dimensions}</td>
                            <td className="px-3 py-2 text-neutral-400">{spec.aspectRatio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 border-t border-[#1E1E1E] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Approved Client Deliverables</h4>
                {!accessSummary.canDownload ? (
                  <div className="border border-[#262626] bg-[#121212] p-4 flex items-start gap-2.5 text-neutral-300">
                    <Lock size={14} className="text-[#FF1E1E] shrink-0 mt-0.5" />
                    <p>
                      This Creative Product is prepared custom for your workspace via production request. Use the button below to commission your customized release or brand version.
                    </p>
                  </div>
                ) : approvedFiles.length === 0 ? (
                  <div className="border border-[#262626] bg-[#121212] p-4 text-neutral-400">
                    No approved client files are attached to this product yet. Commission a customized version for your workspace below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedFiles.map(file => (
                      <div
                        key={file.id}
                        className="border border-[#222222] bg-[#111111] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{file.label || file.fileName}</p>
                          <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                            {file.fileFormat}
                            {file.dimensions ? ` · ${file.dimensions}` : ''}
                            {` · ${formatBytesCompact(file.fileSizeBytes)} · ${file.version}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={downloadingFileId === file.id}
                          onClick={() => void handleDownloadFile(selectedProduct, file)}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <Download size={12} />
                          <span>{downloadingFileId === file.id ? 'Downloading…' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1E1E] pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-300 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prefill = buildProductRequestPrefill({
                      product: selectedProduct,
                      workspaceName: workspace.name,
                    });
                    setSelectedProduct(null);
                    onRequestProduction(prefill);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Send size={13} />
                  <span>Request Custom Version for {workspace.name}</span>
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default ClientCreativeHub;
