import React, { useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Music2,
  Package,
  Palette,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type {
  ClientProfile,
  ClientProject,
  CreativeProduct,
  CreativeResourceDrop,
  InvoiceRecord,
  ProductionActivity,
  ProductionDeliverable,
  ProductionRevisionRequest,
  ProposalRecord,
  ResourceAccessHistoryItem,
  Workspace,
} from '../../types';
import {
  buildBrandProductionPrefill,
  buildReleaseProductionPrefill,
  buildUnifiedWorkspaceActivity,
  type ClientExperienceConfig,
  type ClientTab,
  computeArtistProfileCompleteness,
  computeBrandProfileCompleteness,
  evaluateReleaseReadiness,
  type ProductionRequestPrefill,
} from '../../lib/clientOS';
import { getProductDownloadStatusSummary, resolveClientAudienceBucket } from '../../lib/creativeProductAccess';
import { deriveClientInvoiceStatus, formatMoney } from '../../lib/financeDocuments';
import { loadStudioProductions } from '../../lib/creativeStudioEngine';
import type { CreativeStarterParams } from '../../types/creativeProduction';
import type { StudioAsset, StudioContentItem, StudioDocument, StudioRelease } from './ClientStudio';

export interface WorkspaceHomeProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  accountName: string;
  experience: ClientExperienceConfig;
  projects: ClientProject[];
  deliverables: ProductionDeliverable[];
  revisions: ProductionRevisionRequest[];
  activities: ProductionActivity[];
  releases: StudioRelease[];
  contentItems: StudioContentItem[];
  assets: StudioAsset[];
  documents: StudioDocument[];
  invoices: InvoiceRecord[];
  proposals: ProposalRecord[];
  recommendedProducts: CreativeProduct[];
  activeDrops: CreativeResourceDrop[];
  resourceHistory: ResourceAccessHistoryItem[];
  activeServicePackageIds?: ReadonlySet<string>;
  loading: boolean;
  onSelectTab: (tab: ClientTab) => void;
  onOpenRequestModal: (prefill?: Partial<ProductionRequestPrefill>) => void;
  onSelectProject?: (project: ClientProject) => void;
  onOpenInStudio?: (starter: CreativeStarterParams) => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({
  workspace,
  clientProfile,
  accountName,
  experience,
  projects,
  deliverables,
  revisions,
  activities,
  releases,
  contentItems,
  assets,
  documents,
  invoices,
  proposals,
  recommendedProducts,
  activeDrops,
  resourceHistory,
  activeServicePackageIds,
  loading,
  onSelectTab,
  onOpenRequestModal,
  onSelectProject,
  onOpenInStudio,
}) => {
  const isArtist = experience.isArtist;
  const recentStudioDrafts = useMemo(
    () => loadStudioProductions(workspace.id).slice(0, 3),
    [workspace.id],
  );
  const clientBucket = useMemo(
    () => resolveClientAudienceBucket(clientProfile?.accountType, workspace.type),
    [clientProfile?.accountType, workspace.type],
  );
  const activeProjects = useMemo(
    () => projects.filter(p => p.stage !== 'Delivered' && p.requestStatus !== 'Rejected'),
    [projects],
  );
  const awaitingDeliverables = useMemo(
    () =>
      deliverables.filter(
        d => d.reviewStatus === 'Awaiting Review' || d.reviewStatus === 'Revised - Awaiting Review',
      ),
    [deliverables],
  );
  const approvedDeliverables = useMemo(
    () => deliverables.filter(d => d.reviewStatus === 'Approved'),
    [deliverables],
  );
  const clarificationRequests = useMemo(
    () => projects.filter(p => p.requestStatus === 'Clarification Requested'),
    [projects],
  );
  const openRequests = useMemo(
    () =>
      projects.filter(
        p => p.requestStatus === 'Pending' || p.requestStatus === 'Clarification Requested' || p.stage === 'New Request',
      ),
    [projects],
  );
  const unpaidInvoices = useMemo(
    () =>
      invoices.filter(
        inv => deriveClientInvoiceStatus(inv) !== 'Paid' && inv.status !== 'Void' && (inv.balanceDue ?? 0) > 0,
      ),
    [invoices],
  );
  const pendingProposals = useMemo(
    () => proposals.filter(prop => ['Issued', 'Sent', 'Under Review'].includes(prop.status)),
    [proposals],
  );
  const approvedAssets = useMemo(() => assets.filter(a => a.status === 'Approved'), [assets]);

  const completeness = useMemo(
    () =>
      isArtist
        ? computeArtistProfileCompleteness(workspace)
        : computeBrandProfileCompleteness(workspace),
    [isArtist, workspace],
  );

  const upcomingReleases = useMemo(
    () =>
      [...releases]
        .filter(r => r.status !== 'Archived')
        .sort((a, b) => (a.releaseDate || '9999-99-99').localeCompare(b.releaseDate || '9999-99-99')),
    [releases],
  );

  const unifiedActivity = useMemo(
    () =>
      buildUnifiedWorkspaceActivity({
        isArtist,
        activities,
        revisions,
        releases,
        contentItems,
        assets,
        invoices,
        proposals,
        limit: 8,
      }),
    [isArtist, activities, revisions, releases, contentItems, assets, invoices, proposals],
  );

  const scheduledContentCount = useMemo(
    () => contentItems.filter(item => Boolean(item.scheduledDate)).length,
    [contentItems],
  );

  const coverBannerUrl = isArtist
    ? workspace.artistProfile?.coverImageUrl
    : workspace.brandProfile?.coverImageUrl;

  const brandTokens = workspace.brand;
  const recentHistoryIds = useMemo(() => new Set(resourceHistory.map(h => h.productId)), [resourceHistory]);
  const highlightedResources = useMemo(() => {
    const used = recommendedProducts.filter(p => recentHistoryIds.has(p.id));
    const others = recommendedProducts.filter(p => !recentHistoryIds.has(p.id));
    return [...used, ...others].slice(0, 4);
  }, [recommendedProducts, recentHistoryIds]);

  return (
    <div className="space-y-6">
      {/* Top Personalized OS Hero */}
      <section className="relative overflow-hidden rounded-lg border border-[#222222] bg-[#0C0C0C]">
        {coverBannerUrl && (
          <div className="h-24 sm:h-28 w-full overflow-hidden border-b border-[#1E1E1E] bg-[#090909]">
            <img
              src={coverBannerUrl}
              alt={`${workspace.name} cover`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover opacity-55"
            />
          </div>
        )}
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
              {experience.osTitle} · {workspace.name}
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome back, {accountName}.
            </h2>
            <p className="text-sm text-neutral-400 max-w-2xl">{experience.osSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenRequestModal()}
              className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>New Creative Request</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('studio')}
              className="inline-flex items-center gap-1.5 rounded border border-[#2C2C2C] bg-[#141414] px-3.5 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] whitespace-nowrap shrink-0"
            >
              <Wand2 size={13} className="text-[#FF1E1E]" />
              <span>Open {isArtist ? 'Artist Studio' : 'Brand Studio'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('creative-hub')}
              className="inline-flex items-center gap-1.5 rounded border border-[#242424] bg-[#101010] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
            >
              <Package size={13} />
              <span>Creative Hub</span>
            </button>
          </div>
        </div>
      </section>

      {/* Actionable Attention Banners */}
      {(clarificationRequests.length > 0 ||
        awaitingDeliverables.length > 0 ||
        pendingProposals.length > 0 ||
        unpaidInvoices.length > 0) && (
        <section className="grid gap-3 md:grid-cols-2">
          {clarificationRequests.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-200">
                  Clarification needed ({clarificationRequests.length})
                </p>
                <p className="text-xs text-amber-100/80 mt-0.5 truncate">
                  {clarificationRequests[0].title} awaits your reply to move forward.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('requests')}
                className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 whitespace-nowrap shrink-0"
              >
                Reply now
              </button>
            </div>
          )}
          {awaitingDeliverables.length > 0 && (
            <div className="rounded-lg border border-red-500/35 bg-red-950/20 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">
                  Deliverables ready for review ({awaitingDeliverables.length})
                </p>
                <p className="text-xs text-neutral-300 mt-0.5 truncate">
                  Approve final outputs or submit revision notes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('deliverables')}
                className="rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0"
              >
                Review files
              </button>
            </div>
          )}
          {pendingProposals.length > 0 && (
            <div className="rounded-lg border border-purple-500/35 bg-purple-950/20 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-purple-200">
                  Pending proposals &amp; quotes ({pendingProposals.length})
                </p>
                <p className="text-xs text-neutral-300 mt-0.5 truncate">
                  {pendingProposals[0].title} ({pendingProposals[0].referenceNo})
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('proposals')}
                className="rounded border border-purple-400/50 bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-100 hover:bg-purple-500/30 whitespace-nowrap shrink-0"
              >
                Review scope
              </button>
            </div>
          )}
          {unpaidInvoices.length > 0 && (
            <div className="rounded-lg border border-blue-500/35 bg-blue-950/20 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-200">
                  Open invoices ({unpaidInvoices.length})
                </p>
                <p className="text-xs text-neutral-300 mt-0.5 truncate">
                  Latest: {unpaidInvoices[0].referenceNo} ·{' '}
                  {formatMoney(unpaidInvoices[0].balanceDue ?? unpaidInvoices[0].totalAmount, unpaidInvoices[0].currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('invoices')}
                className="rounded border border-blue-400/50 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:bg-blue-500/30 whitespace-nowrap shrink-0"
              >
                View billing
              </button>
            </div>
          )}
        </section>
      )}

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('projects')}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Active Projects</p>
          <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{activeProjects.length}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {openRequests.length} open request(s) · {projects.length} total
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('deliverables')}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Deliverables</p>
          <p
            className={`mt-2 text-2xl font-black font-mono tabular-nums ${
              awaitingDeliverables.length > 0 ? 'text-amber-400' : 'text-white'
            }`}
          >
            {deliverables.length}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {awaitingDeliverables.length} awaiting review · {approvedDeliverables.length} final
          </p>
        </button>

        {isArtist ? (
          <button
            type="button"
            onClick={() => onSelectTab('releases')}
            className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Release Catalog</p>
            <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{releases.length}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {releases.filter(r => r.status === 'Live').length} live ·{' '}
              {releases.filter(r => r.status === 'Scheduled').length} scheduled
            </p>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectTab('invoices')}
            className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Commercial Desk</p>
            <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">
              {unpaidInvoices.length + pendingProposals.length}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {unpaidInvoices.length} open invoice(s) · {pendingProposals.length} pending quote(s)
            </p>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectTab('assets')}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            {isArtist ? 'Assets & Docs' : 'Brand Assets & Docs'}
          </p>
          <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">
            {assets.length + documents.length}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {approvedAssets.length} approved assets · {documents.length} docs
          </p>
        </button>
      </div>

      {/* OS Identity Snapshot + Completeness & Spotlight */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,.75fr)]">
        {/* Left Column: Releases Pipeline (Artist) OR Brand Identity Snapshot + Active Projects (Brand) */}
        <div className="space-y-5">
          {isArtist ? (
            <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Artist OS</p>
                  <h3 className="text-sm font-bold text-white">Upcoming &amp; Active Release Pipeline</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectTab('releases')}
                    className="text-xs font-medium text-neutral-300 hover:text-white"
                  >
                    Manage catalog ({releases.length})
                  </button>
                </div>
              </div>

              {upcomingReleases.length === 0 ? (
                <div className="rounded border border-dashed border-[#2C2C2C] p-6 text-center space-y-3">
                  <Music2 size={24} className="mx-auto text-neutral-600" />
                  <p className="text-sm text-neutral-400">
                    Add your next Single, EP, or Album to track artwork readiness, ISRC/UPC codes, and rollout copy.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectTab('releases')}
                    className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    <Plus size={13} />
                    Add First Release
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingReleases.slice(0, 4).map(release => {
                    const readiness = evaluateReleaseReadiness(release);
                    return (
                      <div key={release.id} className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 space-y-2.5 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{release.title}</p>
                            <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                              {release.type} · {release.status} · {release.releaseDate || 'Date TBC'}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono text-amber-300 tabular-nums shrink-0">
                            {readiness.completed}/{readiness.total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded bg-[#222]">
                          <div
                            className="h-full bg-[#FF1E1E]"
                            style={{ width: `${readiness.percent}%` }}
                          />
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => onSelectTab('releases')}
                            className="text-neutral-300 hover:text-white"
                          >
                            Open release
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenRequestModal(buildReleaseProductionPrefill(release, workspace))}
                            className="text-red-300 hover:text-white"
                          >
                            Request visual pack
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Brand OS</p>
                  <h3 className="text-sm font-bold text-white">Brand Identity Snapshot</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab('brand')}
                  className="text-xs font-medium text-neutral-300 hover:text-white"
                >
                  Edit identity &amp; tokens
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Brand Colors</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { label: 'Primary', hex: brandTokens?.primaryColor || '#FF1E1E' },
                      { label: 'Accent', hex: brandTokens?.accentColor || '#FF1E1E' },
                      { label: 'Secondary', hex: brandTokens?.secondaryColor || '#0A0A0A' },
                    ].map(tok => (
                      <div key={tok.label} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-5 w-5 rounded border border-white/20 shrink-0"
                          style={{ backgroundColor: tok.hex }}
                        />
                        <div>
                          <p className="text-[10px] text-neutral-500">{tok.label}</p>
                          <p className="font-mono text-[11px] text-white tabular-nums">{tok.hex.toUpperCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    Typography &amp; Category
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {brandTokens?.typography?.displayFont || 'Plus Jakarta Sans'} /{' '}
                    {brandTokens?.typography?.bodyFont || 'Plus Jakarta Sans'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    {workspace.brandProfile?.businessCategory ||
                      workspace.brandProfile?.industry ||
                      'Add business category in Brand Identity'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectTab('content')}
                  className="rounded border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                >
                  Content Studio ({contentItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('documents')}
                  className="rounded border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                >
                  Collateral &amp; Business Docs ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRequestModal(buildBrandProductionPrefill(workspace, workspace.brandProfile))}
                  className="rounded border border-red-500/40 bg-red-950/20 px-3 py-1.5 text-red-200 hover:text-white"
                >
                  Request Brand Work
                </button>
              </div>
            </section>
          )}

          {/* Active Projects */}
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Active Production Projects</h3>
                <p className="text-xs text-neutral-500">Live progress across workspace production briefs.</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('projects')}
                className="text-xs font-medium text-neutral-300 hover:text-white"
              >
                All projects
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-neutral-500 py-4">Loading projects…</p>
            ) : activeProjects.length === 0 ? (
              <div className="rounded border border-dashed border-[#2C2C2C] p-6 text-center space-y-3">
                <FolderKanban size={22} className="mx-auto text-neutral-600" />
                <p className="text-sm text-neutral-400">
                  {projects.length === 0
                    ? 'No production projects in this workspace yet.'
                    : 'All workspace projects are delivered or closed.'}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenRequestModal()}
                  className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600"
                >
                  <Plus size={13} />
                  Request Production
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjects.slice(0, 4).map(project => (
                  <div
                    key={project.id}
                    className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => (onSelectProject ? onSelectProject(project) : onSelectTab('projects'))}
                        className="text-sm font-semibold text-white hover:text-red-300 text-left truncate"
                      >
                        {project.title}
                      </button>
                      <span className="text-[11px] font-mono text-neutral-300 shrink-0">
                        {project.stage || project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#242424]">
                        <div
                          className="h-full bg-[#FF1E1E]"
                          style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                      {project.category} · Target delivery: {project.expectedDeliveryDate || 'TBC'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Profile Completeness Card + Quick Actions + Recent Deliverables/Assets */}
        <div className="space-y-5">
          {/* Profile Completeness & OS Identity Card */}
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {isArtist ? <Music2 size={15} className="text-amber-400" /> : <Palette size={15} className="text-blue-400" />}
                <span>{isArtist ? 'Artist Profile Health' : 'Brand Profile Health'}</span>
              </h3>
              <span className="font-mono text-xs font-bold text-white tabular-nums">{completeness.score}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-[#222]">
              <div
                className={`h-full ${completeness.score === 100 ? 'bg-emerald-500' : 'bg-[#FF1E1E]'}`}
                style={{ width: `${completeness.score}%` }}
              />
            </div>
            {completeness.missingFields.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>All core {isArtist ? 'artist' : 'brand'} identity details completed.</span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-400">
                  Complete {completeness.totalCount - completeness.completedCount} remaining item(s):
                </p>
                <ul className="space-y-1 text-xs text-neutral-300">
                  {completeness.missingFields.slice(0, 3).map(field => (
                    <li key={field} className="text-neutral-400">
                      · {field}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelectTab(isArtist ? 'artist-profile' : 'brand')}
              className="w-full flex items-center justify-between rounded border border-[#282828] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
            >
              <span>{completeness.score === 100 ? 'View & Refine Profile' : 'Complete Workspace Identity'}</span>
              <ArrowRight size={13} />
            </button>
          </section>

          {/* OS Quick Actions */}
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-2.5">
            <h3 className="text-sm font-bold text-white">Quick Workspace Shortcuts</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onSelectTab('content')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Layers size={13} className="text-[#FF1E1E]" />
                  {isArtist ? 'Content Engine' : 'Brand Content Studio'} ({contentItems.length} · {scheduledContentCount} dated)
                </span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('studio')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Wand2 size={13} className="text-amber-400" />
                  {isArtist ? 'Artist Studio & Templates' : 'Brand Studio & Collateral'}
                </span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('documents')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <FileText size={13} className="text-blue-400" />
                  {isArtist ? 'EPK, Split Sheets & Docs' : 'Business Cards, IDs & Docs'} ({documents.length})
                </span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('assets')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <ImageIcon size={13} className="text-emerald-400" />
                  Asset Library ({assets.length})
                </span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab(unpaidInvoices.length > 0 ? 'invoices' : 'proposals')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Briefcase size={13} className="text-purple-400" />
                  Invoices &amp; Proposals ({invoices.length + proposals.length})
                </span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          {/* Recent Creative Studio Productions */}
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Wand2 size={14} className="text-[#FF1E1E]" />
                <span>Recent Studio Productions</span>
              </h3>
              <button
                type="button"
                onClick={() => onSelectTab('studio')}
                className="text-xs text-red-300 hover:text-white"
              >
                Open Studio
              </button>
            </div>
            {recentStudioDrafts.length === 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-neutral-500">
                  Create release covers, Spotify Canvas cards, product ads, and campaign graphics directly inside {isArtist ? 'Artist Studio' : 'Brand Studio'}.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInStudio
                      ? onOpenInStudio({
                          source: 'profile',
                          toolId: isArtist ? 'release-artwork-studio' : 'product-ad-designer',
                          title: `${workspace.name} — Flagship Creative`,
                        })
                      : onSelectTab('studio')
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E]"
                >
                  <Wand2 size={12} className="text-[#FF1E1E]" />
                  <span>Start Studio Production</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentStudioDrafts.map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onSelectTab('studio')}
                    className="w-full text-left flex items-center justify-between gap-2 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs hover:border-[#FF1E1E]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{prod.title}</p>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">
                        {prod.status} · {prod.dimensions.aspectRatio}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#FF1E1E] shrink-0">Resume</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Recent Deliverables & Assets */}
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Recent Outputs &amp; Assets</h3>
              <button
                type="button"
                onClick={() => onSelectTab('deliverables')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                All deliverables
              </button>
            </div>
            {deliverables.length === 0 && assets.length === 0 ? (
              <p className="text-xs text-neutral-500">
                Published deliverables and uploaded studio assets appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {deliverables.slice(0, 3).map(del => (
                  <div
                    key={del.id}
                    className="flex items-center justify-between gap-2 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{del.title}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{del.reviewStatus}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab('deliverables')}
                      className="text-[11px] text-red-300 hover:text-white shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ))}
                {assets.slice(0, 2).map(asset => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-2 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{asset.name}</p>
                      <p className="text-[10px] font-mono text-neutral-400">
                        {asset.category} · {asset.status || 'Draft'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab('assets')}
                      className="text-[11px] text-neutral-300 hover:text-white shrink-0"
                    >
                      Library
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Creative Hub Connected Resources & Monthly Drops + Real Workspace Activity */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(310px,.8fr)]">
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                Creative Ecosystem · Phase 4 Connected
              </p>
              <h3 className="text-sm font-bold text-white">
                {recentHistoryIds.size > 0
                  ? 'Recently Used & Recommended Resources'
                  : `Recommended ${isArtist ? 'Artist' : 'Brand'} Packs`}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {activeDrops.length > 0 && (
                <span className="font-mono text-[11px] text-amber-300">
                  {activeDrops.length} active drop(s)
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('creative-hub')}
                className="text-neutral-300 hover:text-white font-medium"
              >
                Explore Creative Hub
              </button>
            </div>
          </div>

          {highlightedResources.length === 0 ? (
            <div className="rounded border border-dashed border-[#2C2C2C] p-6 text-center space-y-2">
              <Sparkles size={20} className="mx-auto text-neutral-600" />
              <p className="text-xs text-neutral-400">
                Open {isArtist ? 'Artist Creative Hub' : 'Brand Creative Hub'} to browse templates, packs, and monthly drops.
              </p>
              <button
                type="button"
                onClick={() => onSelectTab('creative-hub')}
                className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
              >
                Browse Resources
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {highlightedResources.map(product => {
                const accessSummary = getProductDownloadStatusSummary({
                  product,
                  clientBucket,
                  workspaceId: workspace.id,
                  workspaceStatus: workspace.status,
                  contractedPackageIds: workspace.contractedPackageIds,
                  activePackageIds: workspace.activePackageIds,
                  activeServicePackageIds,
                  packageEntitlements: workspace.packageEntitlements,
                });
                const usedRecently = recentHistoryIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      {product.previewImageUrl ? (
                        <img
                          src={product.previewImageUrl}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded border border-[#282828] object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border border-[#282828] bg-[#181818] flex items-center justify-center text-neutral-500 shrink-0">
                          <Package size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{product.title}</p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {product.category} · {product.resourceType || product.audience}
                        </p>
                        <p className="mt-0.5 text-[10px] font-mono text-neutral-500 truncate">
                          {usedRecently ? 'Used recently · ' : ''}
                          {accessSummary.badgeLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#1C1C1C] pt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onSelectTab('creative-hub')}
                        className="inline-flex items-center gap-1 text-red-300 hover:text-white"
                      >
                        <span>Open in Creative Hub</span>
                        <ExternalLink size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTab('studio')}
                        className="text-neutral-400 hover:text-white"
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Chronological Workspace Activity */}
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Bell size={14} className="text-[#FF1E1E]" />
              <span>Workspace Activity Feed</span>
            </h3>
            <button
              type="button"
              onClick={() => onSelectTab('updates')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Full timeline
            </button>
          </div>
          {unifiedActivity.length === 0 ? (
            <div className="rounded border border-dashed border-[#2A2A2A] p-6 text-center text-xs text-neutral-500">
              <Activity size={18} className="mx-auto mb-2 text-neutral-600" />
              Real project updates, releases, content drafts, and billing milestones appear here automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {unifiedActivity.map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectTab(entry.targetTab)}
                  className="w-full text-left rounded border border-[#1E1E1E] bg-[#111] px-3 py-2.5 text-xs hover:border-[#333] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white truncate">{entry.title}</span>
                    <span className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0">
                      {entry.source} · {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-neutral-400 line-clamp-1">{entry.detail}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
