import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Copy,
  Download,
  Edit3,
  Eye,
  Layers,
  Sparkles,
  Square,
  Wand2,
} from 'lucide-react';
import type {
  ContentPillar,
  ContentSeries,
  MarketingAsset,
  MarketingCategoryArea,
  MarketingContentType,
  MarketingFormatSpec,
  MarketingMasterTemplate,
  MarketingPlatform,
  MarketingTargetAudience,
} from '../../../types/brandRoom';
import type { CanvasDesign } from '../../../types/designStudio';
import {
  adaptCanvasDesignToFormat,
  createMarketingCanvasFromTemplate,
  getFormatSpecById,
  getFormatsForPlatform,
  MARKETING_CONTENT_TYPES,
  MARKETING_MASTER_TEMPLATES,
  MARKETING_PLATFORM_FORMATS,
  MARKETING_PLATFORMS,
} from '../../../lib/brandRoomStudio';
import { exportAndSaveCanvasToBrandRoom } from '../../../lib/brandRoomService';
import { BrandRoomCanvasPreview } from './BrandRoomCanvasPreview';
import { Collection001GallerySection } from './Collection001GallerySection';

interface MarketingStudioPanelProps {
  assets: MarketingAsset[];
  pillars: ContentPillar[];
  series: ContentSeries[];
  adminUid: string;
  initialPreset?: {
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
  } | null;
  onConsumeInitialPreset?: () => void;
  onOpenCanvasEditor: (params: {
    design: CanvasDesign;
    format: MarketingFormatSpec;
    existingAsset?: MarketingAsset | null;
    draftMetadata: Omit<
      MarketingAsset,
      'id' | 'createdAt' | 'updatedAt' | 'exportedFiles' | 'version' | 'versionHistory' | 'reuseCount'
    >;
  }) => void;
}

const CATEGORY_AREAS: MarketingCategoryArea[] = [
  'Social Media',
  'Advertising & Promotions',
  'Artist Marketing',
  'Brand & Business Marketing',
  'Motion & Video',
  'Website & Email',
  'Print & Offline',
  'Portfolio & Showcases',
];

export const MarketingStudioPanel: React.FC<MarketingStudioPanelProps> = ({
  assets,
  pillars,
  series,
  adminUid,
  initialPreset,
  onConsumeInitialPreset,
  onOpenCanvasEditor,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<MarketingPlatform>(
    initialPreset?.platform || 'Instagram',
  );
  const platformFormats = useMemo(
    () => getFormatsForPlatform(selectedPlatform),
    [selectedPlatform],
  );
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    initialPreset?.formatId || platformFormats[0]?.id || 'ig-feed-portrait',
  );
  const activeFormat = useMemo(
    () => getFormatSpecById(selectedFormatId),
    [selectedFormatId],
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialPreset?.templateId || MARKETING_MASTER_TEMPLATES[0].id,
  );
  const activeTemplate = useMemo<MarketingMasterTemplate>(
    () =>
      MARKETING_MASTER_TEMPLATES.find(t => t.id === selectedTemplateId) ||
      MARKETING_MASTER_TEMPLATES[0],
    [selectedTemplateId],
  );

  const [categoryArea, setCategoryArea] = useState<MarketingCategoryArea>(
    initialPreset?.categoryArea || activeTemplate.categoryArea,
  );
  const [contentType, setContentType] = useState<MarketingContentType>(
    activeTemplate.contentType,
  );
  const [topic, setTopic] = useState<string>(initialPreset?.topic || activeTemplate.topic);
  const [title, setTitle] = useState<string>(initialPreset?.title || activeTemplate.title);
  const [audience, setAudience] = useState<MarketingTargetAudience>(
    initialPreset?.audience || activeTemplate.targetAudience,
  );
  const [pillarId, setPillarId] = useState<string>(
    initialPreset?.pillarId || activeTemplate.pillarId || pillars[0]?.id || '',
  );
  const [seriesId, setSeriesId] = useState<string>(initialPreset?.seriesId || '');
  const [caption, setCaption] = useState<string>(activeTemplate.defaultCaption);
  const [callToAction, setCallToAction] = useState<string>(
    activeTemplate.defaultCallToAction,
  );
  const [hashtagsText, setHashtagsText] = useState<string>(
    activeTemplate.defaultHashtags.join(' '),
  );
  const [showSafeZones, setShowSafeZones] = useState(true);

  // Multi-platform batch format generator
  const [batchFormatIds, setBatchFormatIds] = useState<string[]>([
    'ig-feed-portrait',
    'ig-story',
    'li-landscape',
    'yt-thumbnail',
  ]);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!initialPreset) return;
    if (initialPreset.title) setTitle(initialPreset.title);
    if (initialPreset.categoryArea) setCategoryArea(initialPreset.categoryArea);
    if (initialPreset.topic) setTopic(initialPreset.topic);
    if (initialPreset.pillarId) setPillarId(initialPreset.pillarId);
    if (initialPreset.seriesId) setSeriesId(initialPreset.seriesId);
    if (initialPreset.audience) setAudience(initialPreset.audience);
    if (initialPreset.platform) setSelectedPlatform(initialPreset.platform);
    if (initialPreset.formatId) setSelectedFormatId(initialPreset.formatId);
    if (initialPreset.templateId) {
      const tpl = MARKETING_MASTER_TEMPLATES.find(t => t.id === initialPreset.templateId);
      if (tpl) {
        setSelectedTemplateId(tpl.id);
        setCaption(tpl.defaultCaption);
        setCallToAction(tpl.defaultCallToAction);
        setHashtagsText(tpl.defaultHashtags.join(' '));
      }
    }
    onConsumeInitialPreset?.();
  }, [initialPreset, onConsumeInitialPreset]);

  const handlePlatformChange = (platform: MarketingPlatform) => {
    setSelectedPlatform(platform);
    const nextFormats = getFormatsForPlatform(platform);
    if (nextFormats[0]) {
      setSelectedFormatId(nextFormats[0].id);
    }
  };

  const handleSelectTemplate = (tpl: MarketingMasterTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.title);
    setCategoryArea(tpl.categoryArea);
    setContentType(tpl.contentType);
    setTopic(tpl.topic);
    setAudience(tpl.targetAudience);
    setPillarId(tpl.pillarId);
    const matchedSeries = series.find(s => s.name === tpl.seriesName);
    setSeriesId(matchedSeries?.id || '');
    setCaption(tpl.defaultCaption);
    setCallToAction(tpl.defaultCallToAction);
    setHashtagsText(tpl.defaultHashtags.join(' '));
    setSelectedPlatform(tpl.platform);
    setSelectedFormatId(tpl.formatId);
  };

  const previewDesign = useMemo(
    () => createMarketingCanvasFromTemplate(activeTemplate, activeFormat),
    [activeTemplate, activeFormat],
  );

  const buildDraftMetadata = (fmt: MarketingFormatSpec) => {
    const resolvedPillar =
      pillars.find(p => p.id === pillarId) || pillars[0];
    const resolvedSeries = series.find(s => s.id === seriesId);
    const parsedTags = hashtagsText
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 30);

    return {
      title: `${title.trim() || activeTemplate.title}`,
      categoryArea,
      topic: topic.trim() || activeTemplate.topic,
      contentPillarId: resolvedPillar?.id || 'pillar-brand-awareness',
      contentPillarName: resolvedPillar?.name || 'Brand Awareness',
      ...(resolvedSeries
        ? { seriesId: resolvedSeries.id, seriesName: resolvedSeries.name }
        : {}),
      contentType,
      targetAudience: audience,
      platform: fmt.platform,
      formatId: fmt.id,
      formatLabel: fmt.label,
      dimensions: `${fmt.width}×${fmt.height}px`,
      description: activeTemplate.description,
      caption,
      callToAction,
      hashtags: parsedTags,
      tags: [fmt.platform, categoryArea, contentType],
      status: 'Draft' as const,
      masterTemplateId: activeTemplate.id,
      createdBy: adminUid,
      updatedBy: adminUid,
    };
  };

  const handleLaunchEditor = (designOverride?: CanvasDesign, existing?: MarketingAsset | null) => {
    const designToEdit = designOverride || previewDesign;
    const fmt = designOverride
      ? getFormatSpecById(existing?.formatId || activeFormat.id)
      : activeFormat;
    onOpenCanvasEditor({
      design: designToEdit,
      format: fmt,
      existingAsset: existing || null,
      draftMetadata: buildDraftMetadata(fmt),
    });
  };

  const handleGenerateSingleAndSave = async () => {
    setBatchSaving(true);
    setBatchProgress(0);
    setError('');
    setNotice('');
    try {
      const saved = await exportAndSaveCanvasToBrandRoom({
        draftMetadata: buildDraftMetadata(activeFormat),
        design: previewDesign,
        format: activeFormat,
        actorUid: adminUid,
        note: `Exported from Master Template "${activeTemplate.title}"`,
        onProgress: setBatchProgress,
      });
      setNotice(
        `Rendered PNG, Editable SVG & Canvas Source into Storage and saved "${saved.title}" (${saved.dimensions}).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBatchSaving(false);
    }
  };

  const toggleBatchFormat = (formatId: string) => {
    setBatchFormatIds(prev =>
      prev.includes(formatId)
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId],
    );
  };

  const handleGenerateMultiPlatformSuite = async () => {
    if (batchFormatIds.length === 0) {
      setError('Select at least one target platform format to generate multi-format exports.');
      return;
    }
    setBatchSaving(true);
    setBatchProgress(0);
    setError('');
    setNotice('');
    try {
      const baseDesign = createMarketingCanvasFromTemplate(
        activeTemplate,
        getFormatSpecById(activeTemplate.formatId),
      );
      let completed = 0;
      for (const fmtId of batchFormatIds) {
        const fmt = getFormatSpecById(fmtId);
        const adapted = adaptCanvasDesignToFormat(baseDesign, fmt);
        await exportAndSaveCanvasToBrandRoom({
          draftMetadata: {
            ...buildDraftMetadata(fmt),
            title: `${title.trim() || activeTemplate.title} — ${fmt.platform} (${fmt.aspectLabel})`,
          },
          design: adapted,
          format: fmt,
          actorUid: adminUid,
          note: `Safe-zone multi-format export (${fmt.width}×${fmt.height})`,
          onProgress: pct =>
            setBatchProgress(
              Math.round(((completed + pct / 100) / batchFormatIds.length) * 100),
            ),
        });
        completed += 1;
      }
      setNotice(
        `Generated and uploaded ${completed} platform-adapted assets (PNG, Editable SVG, Source JSON) directly to the Brand Room Library.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBatchSaving(false);
    }
  };

  const editableSavedAssets = useMemo(
    () => assets.filter(a => Boolean(a.canvasDesignJson)).slice(0, 8),
    [assets],
  );

  return (
    <div className="space-y-8">
      {(notice || error) && (
        <div
          className={`border px-4 py-3 text-xs flex items-center justify-between gap-3 ${
            error
              ? 'border-red-900 bg-red-950/30 text-red-200'
              : 'border-emerald-900/70 bg-emerald-950/20 text-emerald-200'
          }`}
        >
          <span>{error || notice}</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              setNotice('');
            }}
            className="text-[11px] font-mono uppercase text-neutral-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Production Workspace: Configuration Left, Safe-Zone Preview Right */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Briefing, Platform & Template Configuration */}
        <div className="xl:col-span-7 border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                Admin-Only Canvas Production Engine
              </p>
              <h3 className="mt-1 text-base font-bold text-white">
                Configure Marketing Master &amp; Platform Target
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {MARKETING_MASTER_TEMPLATES.length} Master Templates · {MARKETING_PLATFORM_FORMATS.length} Formats
            </span>
          </div>

          {/* Step 1: Reusable Master Template Grid */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono text-neutral-400">
              1. Start from Reusable Master Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MARKETING_MASTER_TEMPLATES.map(tpl => {
                const isSelected = tpl.id === activeTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-[#FF1E1E] bg-[#161010] text-white'
                        : 'border-[#202020] bg-[#111111] text-neutral-300 hover:border-[#3A3A3A]'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[#FF1E1E] truncate">
                      {tpl.categoryArea}
                    </div>
                    <div className="mt-1 text-xs font-bold leading-snug line-clamp-2">
                      {tpl.title}
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-neutral-500 truncate">
                      {tpl.contentType} · {tpl.targetAudience}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Platform & Format Spec */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1A1A1A]">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                2. Target Platform
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {MARKETING_PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlatformChange(p)}
                    className={`border px-2 py-1.5 text-[11px] font-medium truncate transition-colors ${
                      selectedPlatform === p
                        ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-bold'
                        : 'border-[#222222] bg-[#121212] text-neutral-300 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                  3. Placement Format &amp; Dimensions
                </label>
                <select
                  value={activeFormat.id}
                  onChange={e => setSelectedFormatId(e.target.value)}
                  className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                >
                  {platformFormats.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label} — {f.width}×{f.height}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="border border-[#1D1D1D] bg-[#0F0F0F] p-2.5 text-[11px] space-y-1">
                <div className="flex justify-between font-mono text-neutral-300 tabular-nums">
                  <span>{activeFormat.width} × {activeFormat.height} PX</span>
                  <span className="text-[#FF1E1E]">{activeFormat.aspectLabel}</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">{activeFormat.cropRule}</p>
              </div>
            </div>
          </div>

          {/* Step 3: Content Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-[#1A1A1A]">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Asset Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Category Area
              </label>
              <select
                value={categoryArea}
                onChange={e => setCategoryArea(e.target.value as MarketingCategoryArea)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              >
                {CATEGORY_AREAS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value as MarketingContentType)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              >
                {MARKETING_CONTENT_TYPES.map(ct => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value as MarketingTargetAudience)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              >
                <option value="All Audiences">All Audiences</option>
                <option value="Artists">Artists</option>
                <option value="Brands">Brands</option>
                <option value="Businesses">Businesses</option>
                <option value="Brands & Businesses">Brands &amp; Businesses</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Content Pillar
              </label>
              <select
                value={pillarId}
                onChange={e => setPillarId(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              >
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Content Series (Optional)
              </label>
              <select
                value={seriesId}
                onChange={e => setSeriesId(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              >
                <option value="">Standalone / No Series</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Topic Tag
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Post Caption
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Call to Action
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={e => setCallToAction(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Hashtags
              </label>
              <input
                type="text"
                value={hashtagsText}
                onChange={e => setHashtagsText(e.target.value)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* Right: Large Preview & Canvas Editor / Multi-Format Export Controls */}
        <div className="xl:col-span-5 border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
            <div>
              <h4 className="text-sm font-bold text-white">
                Composition Preview
              </h4>
              <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {activeFormat.label} · {activeFormat.width}×{activeFormat.height}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSafeZones(v => !v)}
              className={`border px-2.5 py-1 text-[11px] font-mono transition-colors ${
                showSafeZones
                  ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-[#FF1E1E]'
                  : 'border-[#262626] bg-[#121212] text-neutral-400'
              }`}
            >
              {showSafeZones ? 'Safe Zone: ON' : 'Safe Zone: OFF'}
            </button>
          </div>

          <BrandRoomCanvasPreview
            design={previewDesign}
            format={activeFormat}
            showSafeZones={showSafeZones}
            alt={title || activeTemplate.title}
            className="h-80 sm:h-96"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleLaunchEditor()}
              className="inline-flex items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-colors"
            >
              <Edit3 size={14} />
              <span>Open in Canvas Editor</span>
            </button>
            <button
              type="button"
              disabled={batchSaving}
              onClick={() => void handleGenerateSingleAndSave()}
              className="inline-flex items-center justify-center gap-2 border border-[#2C2C2C] bg-[#151515] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#FF1E1E] disabled:opacity-50"
            >
              <Download size={14} className="text-[#FF1E1E]" />
              <span>Render &amp; Save Files</span>
            </button>
          </div>

          {/* Multi-Platform Safe-Zone Batch Conversion */}
          <div className="border-t border-[#1A1A1A] pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wand2 size={13} className="text-[#FF1E1E]" />
                  <span>Generate Multi-Platform Variations</span>
                </h5>
                <p className="text-[11px] text-neutral-400">
                  Safely repositions and scales composition inside each platform’s safe area—no stretching distortion.
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {batchFormatIds.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {[
                'ig-feed-portrait',
                'ig-square',
                'ig-story',
                'ig-reels',
                'fb-feed-portrait',
                'fb-promo-ad',
                'tt-vertical-video',
                'li-portrait',
                'li-landscape',
                'li-document-carousel',
                'yt-thumbnail',
                'x-landscape',
                'web-hero-banner',
                'email-header',
                'print-poster-a3',
                'print-business-card',
              ].map(fmtId => {
                const fmt = getFormatSpecById(fmtId);
                const checked = batchFormatIds.includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => toggleBatchFormat(fmt.id)}
                    className={`flex items-center gap-2 border px-2 py-1.5 text-left text-[11px] transition-colors ${
                      checked
                        ? 'border-[#FF1E1E]/80 bg-[#171010] text-white'
                        : 'border-[#202020] bg-[#101010] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare size={12} className="text-[#FF1E1E] shrink-0" />
                    ) : (
                      <Square size={12} className="text-neutral-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {fmt.platform} · {fmt.aspectLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {batchSaving && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-neutral-300 tabular-nums">
                  <span>Rendering &amp; uploading real exports to Storage…</span>
                  <span>{batchProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#181818]">
                  <div
                    className="h-full bg-[#FF1E1E] transition-all"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={batchSaving || batchFormatIds.length === 0}
              onClick={() => void handleGenerateMultiPlatformSuite()}
              className="w-full inline-flex items-center justify-center gap-2 border border-[#FF1E1E]/60 bg-[#180E0E] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#FF1E1E] disabled:opacity-40 transition-colors"
            >
              <Layers size={14} />
              <span>Generate &amp; Save All Selected Formats ({batchFormatIds.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Saved Editable Masters Quick Resume Grid */}
      {editableSavedAssets.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">
              Editable Canvas Masters in Library ({editableSavedAssets.length})
            </h4>
            <span className="text-[11px] font-mono text-neutral-400">
              Re-open, duplicate, or export new platform sizes
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {editableSavedAssets.map(item => {
              let parsedDesign: CanvasDesign | null = null;
              try {
                if (item.canvasDesignJson) {
                  parsedDesign = JSON.parse(item.canvasDesignJson) as CanvasDesign;
                }
              } catch {
                parsedDesign = null;
              }
              return (
                <article
                  key={item.id}
                  className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <BrandRoomCanvasPreview
                      design={parsedDesign}
                      previewUrl={item.previewUrl}
                      alt={item.title}
                      className="h-40"
                    />
                    <div className="text-[11px] font-mono text-neutral-400 truncate tabular-nums">
                      {item.platform} · {item.dimensions} · v{item.version}
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-2">
                      {item.title}
                    </h5>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {parsedDesign && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleLaunchEditor(parsedDesign!, item)}
                          className="flex-1 inline-flex items-center justify-center gap-1 border border-[#282828] bg-[#141414] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:border-[#FF1E1E]"
                        >
                          <Edit3 size={12} className="text-[#FF1E1E]" />
                          <span>Edit Master</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleLaunchEditor(
                              adaptCanvasDesignToFormat(parsedDesign!, activeFormat),
                              null,
                            )
                          }
                          title={`Adapt into ${activeFormat.label}`}
                          className="border border-[#282828] bg-[#141414] px-2.5 py-1.5 text-[11px] text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                        >
                          <Copy size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {/* KEEDOHUB — CREATIVE UNIVERSE / MARKETING COLLECTION 001 */}
      <Collection001GallerySection
        assets={assets}
        pillars={pillars}
        series={series}
        adminUid={adminUid}
        onOpenCanvasEditor={onOpenCanvasEditor}
      />
    </div>
  );
};
