import React, { useMemo, useState } from 'react';
import {
  Archive,
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  Film,
  History,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  BrandRoomSection,
  ContentPillar,
  ContentSeries,
  MarketingAsset,
  MarketingCategoryArea,
  MarketingContentStatus,
  MarketingContentType,
  MarketingFormatSpec,
  MarketingMasterTemplate,
  MarketingPlatform,
  MarketingTargetAudience,
} from '../../../types/brandRoom';
import type { CanvasDesign } from '../../../types/designStudio';
import {
  ADVERTISING_TOPICS,
  ARTIST_MARKETING_TOPICS,
  BRAND_BUSINESS_MARKETING_TOPICS,
  createMarketingCanvasFromTemplate,
  getFormatSpecById,
  MARKETING_CONTENT_TYPES,
  MARKETING_MASTER_TEMPLATES,
  MARKETING_PLATFORM_FORMATS,
  MARKETING_PLATFORMS,
  MARKETING_STATUS_OPTIONS,
  MOTION_VIDEO_TOPICS,
  PRINT_OFFLINE_TOPICS,
  WEBSITE_DIGITAL_TOPICS,
} from '../../../lib/brandRoomStudio';
import {
  deleteMarketingAsset,
  downloadBrandRoomFile,
  formatStorageBytes,
  saveMarketingAsset,
  updateMarketingAssetStatus,
  uploadFileToMarketingAsset,
} from '../../../lib/brandRoomService';
import { BrandRoomCanvasPreview } from './BrandRoomCanvasPreview';

export interface StudioLaunchPreset {
  title?: string;
  categoryArea?: MarketingCategoryArea;
  topic?: string;
  pillarId?: string;
  pillarName?: string;
  seriesId?: string;
  seriesName?: string;
  audience?: MarketingTargetAudience;
  platform?: MarketingPlatform;
  formatId?: string;
  templateId?: string;
}

interface MarketingAssetLibraryPanelProps {
  section: BrandRoomSection;
  assets: MarketingAsset[];
  pillars: ContentPillar[];
  series: ContentSeries[];
  adminUid: string;
  onLaunchStudio: (preset: StudioLaunchPreset) => void;
  onOpenAssetInCanvas: (asset: MarketingAsset, design: CanvasDesign, format: MarketingFormatSpec) => void;
}

type SortKey = 'newest' | 'oldest' | 'title' | 'reused' | 'pub-date';

const SECTION_META: Record<
  string,
  {
    eyebrow: string;
    heading: string;
    description: string;
    defaultCategory: MarketingCategoryArea;
    defaultPlatform?: MarketingPlatform;
    defaultAudience: MarketingTargetAudience;
    topics?: readonly string[];
  }
> = {
  'social-media-library': {
    eyebrow: 'Multi-Platform Channel Library',
    heading: 'Social Media Asset & Format Library',
    description:
      'Browse, preview, upload, duplicate, version, and download platform-calibrated KeedoHub creatives across Instagram, Facebook, TikTok, LinkedIn, YouTube, X, and Pinterest.',
    defaultCategory: 'Social Media',
    defaultAudience: 'All Audiences',
  },
  'advertising-promotions': {
    eyebrow: 'Performance & Offer Creatives',
    heading: 'Advertising & Promotions Library',
    description:
      'Commercial acquisition graphics, special studio offers, product launches, seasonal promotions, and retargeting creative variations.',
    defaultCategory: 'Advertising & Promotions',
    defaultAudience: 'All Audiences',
    topics: ADVERTISING_TOPICS,
  },
  'artist-marketing': {
    eyebrow: 'Artist Acquisition & Music Services',
    heading: 'Artist-Focused Marketing',
    description:
      'Showcase KeedoHub creative support for independent and label artists—cover artwork, streaming packs, EPKs, visualisers, lyric videos, and music promotional suites—while maintaining balanced positioning alongside Brands & Businesses.',
    defaultCategory: 'Artist Marketing',
    defaultAudience: 'Artists',
    topics: ARTIST_MARKETING_TOPICS,
  },
  'brand-business-marketing': {
    eyebrow: 'B2B, Corporate & Brand Systems',
    heading: 'Brand & Business Marketing',
    description:
      'Communicate KeedoHub identity systems, social media management design, company profiles, proposals, quotations, invoices, presentations, and executive collateral.',
    defaultCategory: 'Brand & Business Marketing',
    defaultAudience: 'Brands & Businesses',
    topics: BRAND_BUSINESS_MARKETING_TOPICS,
  },
  'motion-video-marketing': {
    eyebrow: 'Motion, Reels & Video Production',
    heading: 'Motion & Video Marketing',
    description:
      'Upload real MP4, WEBM, or MOV promos, link thumbnail/cover graphics, preview playback inline, and launch 9:16 Reels, TikTok, Shorts, and 16:9 thumbnail masters.',
    defaultCategory: 'Motion & Video',
    defaultPlatform: 'TikTok',
    defaultAudience: 'All Audiences',
    topics: MOTION_VIDEO_TOPICS,
  },
  'website-digital-marketing': {
    eyebrow: 'Web Heroes, Dispatches & Email Banners',
    heading: 'Website & Digital Marketing',
    description:
      'Produce desktop/mobile web banners, homepage hero strips, service headers, newsletter graphics, and digital promotional placements.',
    defaultCategory: 'Website & Email',
    defaultPlatform: 'Website & Email',
    defaultAudience: 'All Audiences',
    topics: WEBSITE_DIGITAL_TOPICS,
  },
  'print-offline-marketing': {
    eyebrow: '300-DPI Print & Event Collateral',
    heading: 'Print & Offline Marketing',
    description:
      'Design and export print-ready posters, flyers, brochures, exhibition banners, business cards, company profile spreads, and PDF proofs.',
    defaultCategory: 'Print & Offline',
    defaultPlatform: 'Print & Offline',
    defaultAudience: 'All Audiences',
    topics: PRINT_OFFLINE_TOPICS,
  },
  'marketing-archive': {
    eyebrow: 'Historical Storage & Version Vault',
    heading: 'Marketing Archive',
    description:
      'Inspect archived campaigns, restore timeless evergreen assets back to Draft or Approved, or permanently purge deprecated Storage exports.',
    defaultCategory: 'Social Media',
    defaultAudience: 'All Audiences',
  },
};

function matchesSectionFilter(section: BrandRoomSection, asset: MarketingAsset): boolean {
  if (section === 'marketing-archive') return asset.status === 'Archived';
  if (asset.status === 'Archived') return false;

  switch (section) {
    case 'social-media-library':
      return (
        asset.platform !== 'Print & Offline' ||
        asset.categoryArea === 'Social Media'
      );
    case 'advertising-promotions':
      return (
        asset.categoryArea === 'Advertising & Promotions' ||
        asset.contentType === 'Service advertisement' ||
        asset.contentType === 'Product advertisement' ||
        asset.contentType === 'Promotional poster'
      );
    case 'artist-marketing':
      return (
        asset.categoryArea === 'Artist Marketing' ||
        asset.targetAudience === 'Artists'
      );
    case 'brand-business-marketing':
      return (
        asset.categoryArea === 'Brand & Business Marketing' ||
        asset.targetAudience === 'Brands' ||
        asset.targetAudience === 'Businesses' ||
        asset.targetAudience === 'Brands & Businesses'
      );
    case 'motion-video-marketing':
      return (
        asset.categoryArea === 'Motion & Video' ||
        asset.contentType === 'Reel' ||
        asset.contentType === 'Short-form video' ||
        asset.contentType === 'Motion graphic' ||
        asset.exportedFiles.some(f => f.mimeType.startsWith('video/'))
      );
    case 'website-digital-marketing':
      return (
        asset.categoryArea === 'Website & Email' ||
        asset.platform === 'Website & Email' ||
        asset.contentType === 'Website banner'
      );
    case 'print-offline-marketing':
      return (
        asset.categoryArea === 'Print & Offline' ||
        asset.platform === 'Print & Offline' ||
        asset.contentType === 'Print advertisement' ||
        asset.contentType === 'Brochure'
      );
    default:
      return true;
  }
}

export const MarketingAssetLibraryPanel: React.FC<MarketingAssetLibraryPanelProps> = ({
  section,
  assets,
  pillars,
  series,
  adminUid,
  onLaunchStudio,
  onOpenAssetInCanvas,
}) => {
  const meta = SECTION_META[section] || SECTION_META['social-media-library'];

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showAllUnscoped, setShowAllUnscoped] = useState(false);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modals
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null);
  const [historyAsset, setHistoryAsset] = useState<MarketingAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<MarketingAsset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [replaceTargetAsset, setReplaceTargetAsset] = useState<MarketingAsset | null>(null);

  // New upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTopic, setUploadTopic] = useState(meta.topics?.[0] || 'Creative studio asset');
  const [uploadPlatform, setUploadPlatform] = useState<MarketingPlatform>(
    meta.defaultPlatform || 'Instagram',
  );
  const [uploadFormatId, setUploadFormatId] = useState<string>('ig-feed-portrait');
  const [uploadContentType, setUploadContentType] = useState<MarketingContentType>(
    section === 'motion-video-marketing'
      ? 'Reel'
      : section === 'print-offline-marketing'
        ? 'Print advertisement'
        : section === 'website-digital-marketing'
          ? 'Website banner'
          : 'Single-image post',
  );
  const [uploadPillarId, setUploadPillarId] = useState(pillars[0]?.id || '');
  const [uploadSeriesId, setUploadSeriesId] = useState('');
  const [uploadAudience, setUploadAudience] = useState<MarketingTargetAudience>(meta.defaultAudience);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCta, setUploadCta] = useState('Explore KeedoHub at keedohub.com');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Replace file state
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceNote, setReplaceNote] = useState('');
  const [replaceProgress, setReplaceProgress] = useState(0);

  // Edit metadata state
  const [editDraft, setEditDraft] = useState<MarketingAsset | null>(null);

  const relevantTemplates = useMemo<MarketingMasterTemplate[]>(() => {
    const exact = MARKETING_MASTER_TEMPLATES.filter(
      t => t.categoryArea === meta.defaultCategory,
    );
    return exact.length > 0 ? exact : MARKETING_MASTER_TEMPLATES.slice(0, 4);
  }, [meta.defaultCategory]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets
      .filter(a => (showAllUnscoped && section !== 'marketing-archive' ? a.status !== 'Archived' : matchesSectionFilter(section, a)))
      .filter(a => platformFilter === 'ALL' || a.platform === platformFilter)
      .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
      .filter(a => pillarFilter === 'ALL' || a.contentPillarId === pillarFilter)
      .filter(a => seriesFilter === 'ALL' || a.seriesId === seriesFilter)
      .filter(a => {
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          a.topic.toLowerCase().includes(q) ||
          a.caption.toLowerCase().includes(q) ||
          a.formatLabel.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q)) ||
          a.hashtags.some(h => h.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'reused') return (b.reuseCount || 0) - (a.reuseCount || 0);
        if (sortBy === 'pub-date') {
          return (a.publicationDate || '9999-12-31').localeCompare(b.publicationDate || '9999-12-31');
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [assets, section, showAllUnscoped, platformFilter, statusFilter, pillarFilter, seriesFilter, searchQuery, sortBy]);

  const handleUploadNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Select an image, video, PDF, SVG, PSD, or ZIP file to upload.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    setUploadProgress(5);
    try {
      const format = getFormatSpecById(uploadFormatId);
      const chosenPillar = pillars.find(p => p.id === uploadPillarId);
      const chosenSeries = series.find(s => s.id === uploadSeriesId);
      const newId = crypto.randomUUID();
      const uploadedExport = await uploadFileToMarketingAsset({
        assetId: newId,
        file: uploadFile,
        fileName: uploadFile.name,
        label: `${uploadTitle.trim() || uploadFile.name} (Primary Upload)`,
        dimensions: `${format.width}×${format.height}px`,
        platform: uploadPlatform,
        formatId: format.id,
        isEditableSource: uploadedIsSource(uploadFile.name),
        version: 1,
        uploadedBy: adminUid,
        onProgress: setUploadProgress,
      });

      await saveMarketingAsset({
        id: newId,
        title: uploadTitle.trim() || uploadFile.name.replace(/\.[^.]+$/, ''),
        categoryArea: meta.defaultCategory,
        topic: uploadTopic.trim() || meta.topics?.[0] || 'Marketing asset',
        contentPillarId: chosenPillar?.id || '',
        contentPillarName: chosenPillar?.name || 'General Brand Marketing',
        ...(chosenSeries ? { seriesId: chosenSeries.id, seriesName: chosenSeries.name } : {}),
        contentType: uploadContentType,
        targetAudience: uploadAudience,
        platform: uploadPlatform,
        formatId: format.id,
        formatLabel: format.label,
        dimensions: `${format.width}×${format.height}px`,
        description: `Uploaded direct production file (${uploadedExport.fileFormat}).`,
        caption: uploadCaption.trim(),
        callToAction: uploadCta.trim(),
        hashtags: ['#KeedoHub'],
        tags: uploadTags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        status: 'Draft',
        ...(uploadedExport.mimeType.startsWith('image/')
          ? { previewUrl: uploadedExport.downloadUrl, previewStoragePath: uploadedExport.storagePath }
          : {}),
        exportedFiles: [uploadedExport],
        version: 1,
        versionHistory: [
          {
            version: 1,
            note: `Initial file upload (${uploadedExport.fileName})`,
            storagePath: uploadedExport.storagePath,
            fileName: uploadedExport.fileName,
            fileFormat: uploadedExport.fileFormat,
            updatedAt: new Date().toISOString(),
            updatedBy: adminUid,
          },
        ],
        reuseCount: 0,
        createdBy: adminUid,
        updatedBy: adminUid,
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadCaption('');
      setUploadProgress(0);
      setNotice('Uploaded new Brand Room asset to Firebase Storage & Firestore.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceAssetFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetAsset || !replaceFile) return;
    setBusy(true);
    setError('');
    setNotice('');
    setReplaceProgress(5);
    try {
      const nextVersion = replaceTargetAsset.version + 1;
      const uploadedExport = await uploadFileToMarketingAsset({
        assetId: replaceTargetAsset.id,
        file: replaceFile,
        fileName: replaceFile.name,
        label: `${replaceTargetAsset.title} v${nextVersion} (${inferSimpleExt(replaceFile.name)})`,
        dimensions: replaceTargetAsset.dimensions,
        platform: replaceTargetAsset.platform,
        formatId: replaceTargetAsset.formatId,
        isEditableSource: uploadedIsSource(replaceFile.name),
        version: nextVersion,
        uploadedBy: adminUid,
        onProgress: setReplaceProgress,
      });

      await saveMarketingAsset({
        ...replaceTargetAsset,
        ...(uploadedExport.mimeType.startsWith('image/')
          ? { previewUrl: uploadedExport.downloadUrl, previewStoragePath: uploadedExport.storagePath }
          : {}),
        exportedFiles: [uploadedExport, ...(replaceTargetAsset.exportedFiles || [])].slice(0, 50),
        version: nextVersion,
        versionHistory: [
          {
            version: nextVersion,
            note: replaceNote.trim() || `Replaced file with ${uploadedExport.fileName}`,
            storagePath: uploadedExport.storagePath,
            fileName: uploadedExport.fileName,
            fileFormat: uploadedExport.fileFormat,
            updatedAt: new Date().toISOString(),
            updatedBy: adminUid,
          },
          ...(replaceTargetAsset.versionHistory || []),
        ].slice(0, 50),
        updatedBy: adminUid,
      });

      setReplaceTargetAsset(null);
      setReplaceFile(null);
      setReplaceNote('');
      setReplaceProgress(0);
      setNotice(`Uploaded v${nextVersion} for "${replaceTargetAsset.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEditMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft) return;
    setBusy(true);
    setError('');
    try {
      await saveMarketingAsset({
        ...editDraft,
        updatedBy: adminUid,
      });
      setEditingAsset(null);
      setEditDraft(null);
      setNotice(`Updated metadata for "${editDraft.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicateAsset = async (asset: MarketingAsset) => {
    setBusy(true);
    setError('');
    try {
      const copyId = crypto.randomUUID();
      await saveMarketingAsset({
        ...asset,
        id: copyId,
        title: `${asset.title} (Copy)`,
        status: 'Draft',
        reuseCount: 0,
        version: 1,
        exportedFiles: [],
        previewUrl: '',
        previewStoragePath: '',
        editableSourcePath: '',
        editableSourceUrl: '',
        publishedAt: undefined,
        publishedUrl: undefined,
        publicationDate: undefined,
        versionHistory: [
          {
            version: 1,
            note: `Duplicated from "${asset.title}"`,
            updatedAt: new Date().toISOString(),
            updatedBy: adminUid,
          },
        ],
        createdBy: adminUid,
        updatedBy: adminUid,
      });
      await saveMarketingAsset({
        ...asset,
        reuseCount: (asset.reuseCount || 0) + 1,
        updatedBy: adminUid,
      });
      setNotice(`Created editable copy of "${asset.title}" in Draft status.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (asset: MarketingAsset, nextStatus: MarketingContentStatus) => {
    setBusy(true);
    setError('');
    try {
      await updateMarketingAssetStatus({
        assetId: asset.id,
        status: nextStatus,
        updatedBy: adminUid,
      });
      setNotice(`Updated "${asset.title}" to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (asset: MarketingAsset) => {
    setBusy(true);
    setError('');
    try {
      await deleteMarketingAsset(asset);
      setConfirmDeleteId(null);
      setNotice(`Deleted "${asset.title}" and its associated Storage files.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenInCanvas = (asset: MarketingAsset) => {
    const format = getFormatSpecById(asset.formatId);
    if (asset.canvasDesignJson) {
      try {
        const parsed = JSON.parse(asset.canvasDesignJson) as CanvasDesign;
        onOpenAssetInCanvas(asset, parsed, format);
        return;
      } catch {
        // fallback below
      }
    }
    const tpl =
      MARKETING_MASTER_TEMPLATES.find(t => t.id === asset.masterTemplateId) ||
      relevantTemplates[0] ||
      MARKETING_MASTER_TEMPLATES[0];
    const generated = createMarketingCanvasFromTemplate(tpl, format);
    onOpenAssetInCanvas(asset, { ...generated, name: asset.title }, format);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
            {meta.eyebrow}
          </p>
          <h3 className="mt-1 text-base font-bold text-white">{meta.heading}</h3>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{meta.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {section !== 'marketing-archive' && (
            <>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E]"
              >
                <Upload size={13} className="text-[#FF1E1E]" />
                <span>Upload Asset</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onLaunchStudio({
                    categoryArea: meta.defaultCategory,
                    audience: meta.defaultAudience,
                    platform: meta.defaultPlatform || 'Instagram',
                    topic: meta.topics?.[0],
                    templateId: relevantTemplates[0]?.id,
                  })
                }
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#e01919]"
              >
                <Sparkles size={13} />
                <span>Create in Studio</span>
              </button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div className="border border-emerald-900 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="border border-red-900 bg-red-950/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Domain Quick-Launch Topics (Artist, Brand & Business, Ads, Motion, Website, Print) */}
      {meta.topics && meta.topics.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Topic Focuses ({meta.topics.length}) · Click Any Topic to Launch Pre-Configured Studio Draft
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {meta.topics.map(topicLabel => (
              <button
                key={topicLabel}
                type="button"
                onClick={() =>
                  onLaunchStudio({
                    title: `KeedoHub — ${topicLabel}`,
                    categoryArea: meta.defaultCategory,
                    topic: topicLabel,
                    audience: meta.defaultAudience,
                    platform: meta.defaultPlatform || 'Instagram',
                    templateId: relevantTemplates[0]?.id,
                  })
                }
                className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 text-left hover:border-[#FF1E1E] transition-colors flex flex-col justify-between gap-2"
              >
                <span className="text-xs font-semibold text-white leading-snug">{topicLabel}</span>
                <span className="text-[10px] font-mono uppercase text-[#FF1E1E]">
                  Create Design →
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filter & Search Bar */}
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search titles, topics, captions, hashtags..."
              className="w-full border border-[#242424] bg-[#121212] pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500"
            />
          </div>

          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            aria-label="Filter by platform"
            className="border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Platforms</option>
            {MARKETING_PLATFORMS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            {MARKETING_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={pillarFilter}
            onChange={e => setPillarFilter(e.target.value)}
            aria-label="Filter by content pillar"
            className="border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Pillars</option>
            {pillars.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            aria-label="Sort assets"
            className="border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
          >
            <option value="newest">Sort: Recently Updated</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title A–Z</option>
            <option value="reused">Sort: Most Reused</option>
            <option value="pub-date">Sort: Scheduled Date</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums text-neutral-300">
              Showing {filteredAssets.length} item{filteredAssets.length === 1 ? '' : 's'}
            </span>
            {series.length > 0 && (
              <select
                value={seriesFilter}
                onChange={e => setSeriesFilter(e.target.value)}
                aria-label="Filter by series"
                className="border border-[#222222] bg-[#101010] px-2 py-1 text-[11px] text-neutral-300"
              >
                <option value="ALL">All Series</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    Series: {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {section !== 'marketing-archive' && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-400 hover:text-white">
              <input
                type="checkbox"
                checked={showAllUnscoped}
                onChange={e => setShowAllUnscoped(e.target.checked)}
                className="accent-[#FF1E1E]"
              />
              <span>Include all active Brand Room categories</span>
            </label>
          )}
        </div>
      </div>

      {/* Asset Grid (Responsive: grid-cols-2 on mobile where practical, 2-3 tablet, 3-4 desktop) */}
      {filteredAssets.length === 0 ? (
        <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-white">
            No {section === 'marketing-archive' ? 'archived' : 'matching'} marketing assets yet.
          </p>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            {section === 'marketing-archive'
              ? 'Move completed or retired assets to Archived status from any library section to store them here.'
              : 'Launch the Marketing Design Studio with one of the starter templates below or upload a finished graphic, motion video, or print PDF directly.'}
          </p>
          {section !== 'marketing-archive' && relevantTemplates.length > 0 && (
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left max-w-4xl mx-auto">
              {relevantTemplates.slice(0, 3).map(tpl => (
                <div
                  key={tpl.id}
                  className="border border-[#222222] bg-[#101010] p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#FF1E1E]">
                      {tpl.platform} · {tpl.contentType}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">{tpl.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                      {tpl.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onLaunchStudio({
                        title: tpl.title,
                        categoryArea: tpl.categoryArea,
                        topic: tpl.topic,
                        pillarId: tpl.pillarId,
                        pillarName: tpl.pillarName,
                        audience: tpl.targetAudience,
                        platform: tpl.platform,
                        formatId: tpl.formatId,
                        templateId: tpl.id,
                      })
                    }
                    className="w-full border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
                  >
                    Use Starter Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => {
            const videoFile = asset.exportedFiles.find(f => f.mimeType.startsWith('video/'));
            const primaryDownload =
              asset.exportedFiles.find(f => !f.isEditableSource) || asset.exportedFiles[0];

            return (
              <article
                key={asset.id}
                className="border border-[#1E1E1E] bg-[#0B0B0B] flex flex-col justify-between"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-[4/3] bg-[#060606] border-b border-[#1A1A1A] overflow-hidden flex items-center justify-center p-2">
                  {videoFile?.downloadUrl ? (
                    <video
                      src={videoFile.downloadUrl}
                      poster={asset.previewUrl || undefined}
                      controls
                      preload="metadata"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <BrandRoomCanvasPreview
                      canvasDesignJson={asset.canvasDesignJson}
                      previewUrl={asset.previewUrl}
                      title={asset.title}
                      maxHeightPx={210}
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-black/85 border border-[#2B2B2B] px-2 py-0.5 text-[10px] font-mono uppercase text-white">
                    {asset.platform}
                  </span>
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-mono uppercase border ${
                      asset.status === 'Published'
                        ? 'bg-emerald-950/90 border-emerald-700 text-emerald-300'
                        : asset.status === 'Approved' || asset.status === 'Scheduled'
                          ? 'bg-red-950/90 border-[#FF1E1E] text-white'
                          : 'bg-black/85 border-[#2B2B2B] text-neutral-300'
                    }`}
                  >
                    {asset.status} · v{asset.version}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-neutral-500 truncate">
                      {asset.categoryArea} · {asset.dimensions || asset.formatLabel}
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{asset.title}</h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {asset.topic || asset.caption || asset.description}
                    </p>
                    <div className="text-[10px] font-mono text-neutral-500 pt-1">
                      {asset.exportedFiles.length} export file(s) · {asset.reuseCount || 0} reuses
                      {asset.publicationDate ? ` · Due ${asset.publicationDate}` : ''}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-[#181818]">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewAsset(asset)}
                        className="inline-flex items-center justify-center gap-1 border border-[#262626] bg-[#121212] px-2 py-1.5 text-[11px] font-medium text-neutral-200 hover:border-[#FF1E1E]"
                      >
                        <Eye size={12} />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInCanvas(asset)}
                        className="inline-flex items-center justify-center gap-1 border border-[#262626] bg-[#121212] px-2 py-1.5 text-[11px] font-medium text-white hover:border-[#FF1E1E]"
                      >
                        <Layers size={12} className="text-[#FF1E1E]" />
                        <span>Canvas</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        disabled={!primaryDownload}
                        onClick={() =>
                          primaryDownload &&
                          void downloadBrandRoomFile(
                            primaryDownload.storagePath,
                            primaryDownload.fileName,
                            primaryDownload.downloadUrl,
                          )
                        }
                        className="inline-flex items-center justify-center gap-1 border border-[#242424] bg-[#101010] px-2 py-1.5 text-[10px] text-neutral-300 hover:text-white hover:border-[#FF1E1E] disabled:opacity-40"
                        title={
                          primaryDownload
                            ? `Download ${primaryDownload.fileName}`
                            : 'Open Canvas and save exports first'
                        }
                      >
                        <Download size={11} />
                        <span>Export</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplaceTargetAsset(asset)}
                        className="inline-flex items-center justify-center gap-1 border border-[#242424] bg-[#101010] px-2 py-1.5 text-[10px] text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                        title="Upload replacement / new version"
                      >
                        <RefreshCw size={11} />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDuplicateAsset(asset)}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1 border border-[#242424] bg-[#101010] px-2 py-1.5 text-[10px] text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                        title="Duplicate as reusable Draft"
                      >
                        <Copy size={11} />
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAsset(asset);
                          setEditDraft({ ...asset });
                        }}
                        className="text-[10px] font-mono text-neutral-400 hover:text-white inline-flex items-center gap-1"
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHistoryAsset(asset)}
                        className="text-[10px] font-mono text-neutral-400 hover:text-white inline-flex items-center gap-1"
                      >
                        <History size={11} />
                        <span>v{asset.version}</span>
                      </button>

                      {section === 'marketing-archive' ? (
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(asset, 'Draft')}
                          disabled={busy}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                        >
                          <RotateCcw size={11} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(asset, 'Archived')}
                          disabled={busy}
                          className="text-[10px] font-mono text-neutral-500 hover:text-amber-300 inline-flex items-center gap-1"
                        >
                          <Archive size={11} />
                          <span>Archive</span>
                        </button>
                      )}

                      {confirmDeleteId === asset.id ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(asset)}
                          disabled={busy}
                          className="text-[10px] font-mono text-[#FF1E1E] font-bold hover:underline"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(asset.id)}
                          className="text-[10px] font-mono text-neutral-500 hover:text-[#FF1E1E] inline-flex items-center gap-1"
                          aria-label={`Delete ${asset.title}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase text-[#FF1E1E]">
                  {previewAsset.platform} · {previewAsset.formatLabel} · v{previewAsset.version}
                </p>
                <h4 className="text-lg font-bold text-white mt-0.5">{previewAsset.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 text-neutral-400 hover:text-white"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#1F1F1F] bg-[#060606] p-4 flex items-center justify-center min-h-[280px]">
                {previewAsset.exportedFiles.find(f => f.mimeType.startsWith('video/'))?.downloadUrl ? (
                  <video
                    src={previewAsset.exportedFiles.find(f => f.mimeType.startsWith('video/'))!.downloadUrl}
                    controls
                    className="max-h-[420px] max-w-full"
                  />
                ) : (
                  <BrandRoomCanvasPreview
                    canvasDesignJson={previewAsset.canvasDesignJson}
                    previewUrl={previewAsset.previewUrl}
                    title={previewAsset.title}
                    maxHeightPx={420}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="text-neutral-500 font-mono uppercase text-[10px]">
                    Topic &amp; Strategy Alignment
                  </div>
                  <p className="text-white font-semibold">{previewAsset.topic}</p>
                  <p className="text-neutral-400">
                    Pillar: {previewAsset.contentPillarName || 'Unassigned'}
                    {previewAsset.seriesName ? ` · Series: ${previewAsset.seriesName}` : ''}
                  </p>
                  <p className="text-neutral-400">
                    Type: {previewAsset.contentType} · Audience: {previewAsset.targetAudience}
                  </p>
                </div>

                {previewAsset.caption && (
                  <div className="border border-[#1E1E1E] bg-[#101010] p-3 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-neutral-500">
                      Caption &amp; Call To Action
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap">
                      {previewAsset.caption}
                    </p>
                    {previewAsset.callToAction && (
                      <p className="text-[11px] font-mono text-[#FF1E1E] pt-1">
                        CTA: {previewAsset.callToAction}
                      </p>
                    )}
                    {previewAsset.hashtags.length > 0 && (
                      <p className="text-[11px] font-mono text-neutral-400">
                        {previewAsset.hashtags.join(' ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-500">
                    Verified Stored Deliverables ({previewAsset.exportedFiles.length})
                  </div>
                  {previewAsset.exportedFiles.length === 0 ? (
                    <p className="text-xs text-neutral-400">
                      No exported Storage files yet. Open in Canvas Editor to render PNG/SVG/PDF deliverables or upload a file.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {previewAsset.exportedFiles.map(file => (
                        <div
                          key={file.id}
                          className="border border-[#222222] bg-[#111111] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{file.label}</div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              {file.fileFormat} · {formatStorageBytes(file.fileSizeBytes)} · v{file.version}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void downloadBrandRoomFile(
                                file.storagePath,
                                file.fileName,
                                file.downloadUrl,
                              )
                            }
                            className="shrink-0 inline-flex items-center gap-1 border border-[#2F2F2F] bg-[#181818] px-2.5 py-1 text-[11px] text-white hover:border-[#FF1E1E]"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {historyAsset && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Version History — {historyAsset.title}
                </h4>
                <p className="text-[11px] font-mono text-neutral-500">
                  Current Version: v{historyAsset.version}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryAsset(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(historyAsset.versionHistory || []).length === 0 ? (
                <p className="text-xs text-neutral-400">No revision log recorded yet.</p>
              ) : (
                historyAsset.versionHistory.map((ver, idx) => (
                  <div
                    key={`${ver.version}-${idx}`}
                    className="border border-[#1E1E1E] bg-[#111111] p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#FF1E1E] font-bold">Version {ver.version}</span>
                      <span className="text-neutral-500">
                        {new Date(ver.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-neutral-200">{ver.note}</p>
                    {ver.fileName && (
                      <p className="text-[10px] font-mono text-neutral-500">
                        {ver.fileName} ({ver.fileFormat})
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NEW ASSET MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadNewAsset}
            className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Film size={15} className="text-[#FF1E1E]" />
                <span>Upload Marketing Asset to {meta.heading}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Title</span>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g., KeedoHub Artist EPK Reel Promo v1"
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Platform</span>
                <select
                  value={uploadPlatform}
                  onChange={e => {
                    const p = e.target.value as MarketingPlatform;
                    setUploadPlatform(p);
                    const firstFmt = MARKETING_PLATFORM_FORMATS.find(f => f.platform === p);
                    if (firstFmt) setUploadFormatId(firstFmt.id);
                  }}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {MARKETING_PLATFORMS.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Format Dimension</span>
                <select
                  value={uploadFormatId}
                  onChange={e => setUploadFormatId(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {MARKETING_PLATFORM_FORMATS.filter(f => f.platform === uploadPlatform).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Content Type</span>
                <select
                  value={uploadContentType}
                  onChange={e => setUploadContentType(e.target.value as MarketingContentType)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {MARKETING_CONTENT_TYPES.map(ct => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Target Audience</span>
                <select
                  value={uploadAudience}
                  onChange={e => setUploadAudience(e.target.value as MarketingTargetAudience)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {(['All Audiences', 'Artists', 'Brands', 'Businesses', 'Brands & Businesses'] as MarketingTargetAudience[]).map(
                    a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Topic</span>
                <input
                  type="text"
                  value={uploadTopic}
                  onChange={e => setUploadTopic(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Content Pillar</span>
                <select
                  value={uploadPillarId}
                  onChange={e => setUploadPillarId(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Series (Optional)</span>
                <select
                  value={uploadSeriesId}
                  onChange={e => setUploadSeriesId(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  <option value="">None</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Tags (comma separated)</span>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  placeholder="reel, release, black-red"
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Caption / Copy</span>
                <textarea
                  rows={2}
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Call To Action</span>
                <input
                  type="text"
                  value={uploadCta}
                  onChange={e => setUploadCta(e.target.value)}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">
                  File (&lt; 50 MB · PNG, JPG, SVG, PDF, PSD, ZIP, MP4, WEBM, MOV, JSON)
                </span>
                <input
                  type="file"
                  required
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-[#262626] bg-[#121212] p-2 text-xs text-neutral-300"
                />
              </label>
            </div>

            {uploadProgress > 0 && (
              <div className="w-full h-1.5 bg-[#1B1B1B]">
                <div
                  className="h-full bg-[#FF1E1E] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="border border-[#2A2A2A] px-4 py-2 text-xs text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#e01919] disabled:opacity-50"
              >
                <Upload size={13} />
                <span>{busy ? `Uploading ${uploadProgress}%...` : 'Upload & Save Asset'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPLACE FILE MODAL */}
      {replaceTargetAsset && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleReplaceAssetFile}
            className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h4 className="text-sm font-bold text-white">
                Upload New Version (v{replaceTargetAsset.version + 1}) — {replaceTargetAsset.title}
              </h4>
              <button
                type="button"
                onClick={() => setReplaceTargetAsset(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="text-neutral-400">Replacement / Updated File</span>
              <input
                type="file"
                required
                onChange={e => setReplaceFile(e.target.files?.[0] || null)}
                className="w-full border border-[#262626] bg-[#121212] p-2 text-neutral-300"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-neutral-400">Version Note</span>
              <input
                type="text"
                value={replaceNote}
                onChange={e => setReplaceNote(e.target.value)}
                placeholder="e.g., Adjusted safe-zone headline spacing and exported final MP4"
                className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
              />
            </label>
            {replaceProgress > 0 && (
              <div className="w-full h-1.5 bg-[#1B1B1B]">
                <div
                  className="h-full bg-[#FF1E1E]"
                  style={{ width: `${replaceProgress}%` }}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplaceTargetAsset(null)}
                className="border border-[#2A2A2A] px-4 py-2 text-xs text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white"
              >
                <Plus size={13} />
                <span>{busy ? `Uploading ${replaceProgress}%...` : 'Save New Version'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editingAsset && editDraft && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditMetadata}
            className="border border-[#2A2A2A] bg-[#0C0C0C] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h4 className="text-sm font-bold text-white">Edit Asset Details</h4>
              <button
                type="button"
                onClick={() => {
                  setEditingAsset(null);
                  setEditDraft(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Title</span>
                <input
                  type="text"
                  required
                  value={editDraft.title}
                  onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Status</span>
                <select
                  value={editDraft.status}
                  onChange={e =>
                    setEditDraft({ ...editDraft, status: e.target.value as MarketingContentStatus })
                  }
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {MARKETING_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Scheduled / Target Date</span>
                <input
                  type="date"
                  value={editDraft.publicationDate || ''}
                  onChange={e =>
                    setEditDraft({ ...editDraft, publicationDate: e.target.value || undefined })
                  }
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Topic</span>
                <input
                  type="text"
                  value={editDraft.topic}
                  onChange={e => setEditDraft({ ...editDraft, topic: e.target.value })}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-neutral-400">Content Pillar</span>
                <select
                  value={editDraft.contentPillarId}
                  onChange={e => {
                    const p = pillars.find(item => item.id === e.target.value);
                    setEditDraft({
                      ...editDraft,
                      contentPillarId: e.target.value,
                      contentPillarName: p?.name || '',
                    });
                  }}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                >
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Caption</span>
                <textarea
                  rows={3}
                  value={editDraft.caption}
                  onChange={e => setEditDraft({ ...editDraft, caption: e.target.value })}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Call To Action</span>
                <input
                  type="text"
                  value={editDraft.callToAction}
                  onChange={e => setEditDraft({ ...editDraft, callToAction: e.target.value })}
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white"
                />
              </label>

              <label className="block space-y-1 sm:col-span-2">
                <span className="text-neutral-400">Hashtags (space or comma separated)</span>
                <input
                  type="text"
                  value={editDraft.hashtags.join(' ')}
                  onChange={e =>
                    setEditDraft({
                      ...editDraft,
                      hashtags: e.target.value
                        .split(/[\s,]+/)
                        .map(h => h.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full border border-[#262626] bg-[#121212] px-3 py-2 text-white font-mono"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingAsset(null);
                  setEditDraft(null);
                }}
                className="border border-[#2A2A2A] px-4 py-2 text-xs text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-bold text-white"
              >
                <Check size={13} />
                <span>{busy ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function inferSimpleExt(name: string): string {
  const parts = name.split('.');
  return (parts.pop() || 'FILE').toUpperCase();
}

function uploadedIsSource(name: string): boolean {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return ['psd', 'svg', 'json', 'zip'].includes(ext);
}
