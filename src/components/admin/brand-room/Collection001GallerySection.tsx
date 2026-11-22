import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  CheckCircle2,
  Edit3,
  FileCode2,
  FileImage,
  Layers,
  Sparkles,
} from 'lucide-react';
import type {
  ContentPillar,
  ContentSeries,
  MarketingAsset,
  MarketingFormatSpec,
} from '../../../types/brandRoom';
import type { CanvasDesign } from '../../../types/designStudio';
import {
  COLLECTION_001_MULTI_FORMAT_IDS,
  COLLECTION_001_SPECS,
  MARKETING_COLLECTION_001_NAME,
  MARKETING_COLLECTION_001_SERIES_ID,
  type Collection001Chapter,
  type Collection001PieceSpec,
} from '../../../data/marketingCollection001';
import {
  adaptCanvasDesignToFormat,
  getFormatSpecById,
} from '../../../lib/brandRoomStudio';
import {
  renderCanvasDesignToRasterBlob,
  renderCanvasDesignToSvgBlob,
} from '../../../lib/productPackager';
import {
  exportAndSaveCanvasToBrandRoom,
  renderPrintMarketingPdfBlob,
} from '../../../lib/brandRoomService';
import { BrandRoomCanvasPreview } from './BrandRoomCanvasPreview';

interface Collection001GallerySectionProps {
  assets: MarketingAsset[];
  pillars: ContentPillar[];
  series: ContentSeries[];
  adminUid: string;
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

const CHAPTER_FILTERS: Array<'ALL' | Collection001Chapter> = [
  'ALL',
  'Collection A — Brand Identity & Awareness',
  'Collection B — What We Do',
  'Collection C — Creative Services & Products',
  'Collection D — Brand Culture & Thought Leadership',
];

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const Collection001GallerySection: React.FC<Collection001GallerySectionProps> = ({
  assets,
  pillars,
  series,
  adminUid,
  onOpenCanvasEditor,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<'ALL' | Collection001Chapter>('ALL');
  const [previewFormatId, setPreviewFormatId] = useState<string>('ig-feed-portrait');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const activeFormat = useMemo(
    () => getFormatSpecById(previewFormatId),
    [previewFormatId],
  );

  const visiblePieces = useMemo(
    () =>
      selectedChapter === 'ALL'
        ? COLLECTION_001_SPECS
        : COLLECTION_001_SPECS.filter(p => p.chapter === selectedChapter),
    [selectedChapter],
  );

  const savedCollectionAssetsMap = useMemo(() => {
    const map = new Map<string, MarketingAsset>();
    for (const item of assets) {
      if (item.masterTemplateId && item.masterTemplateId.startsWith('mkt-c001-')) {
        if (!map.has(item.masterTemplateId) || item.formatId === previewFormatId) {
          map.set(item.masterTemplateId, item);
        }
      }
    }
    return map;
  }, [assets, previewFormatId]);

  const buildPieceDesign = (spec: Collection001PieceSpec, fmt: MarketingFormatSpec): CanvasDesign => {
    const portrait = spec.buildPortraitMaster(getFormatSpecById('ig-feed-portrait'));
    if (
      fmt.id === 'ig-feed-portrait' ||
      (fmt.width === 1080 && fmt.height === 1350 && fmt.safeAreaTopPct <= 8)
    ) {
      return {
        ...portrait,
        aspectRatio: fmt.canvasAspectRatio,
      };
    }
    return adaptCanvasDesignToFormat(portrait, fmt);
  };

  const buildPieceDraftMetadata = (spec: Collection001PieceSpec, fmt: MarketingFormatSpec) => {
    const resolvedPillar = pillars.find(p => p.id === spec.pillarId) || pillars[0];
    const resolvedSeries = series.find(
      s => s.id === MARKETING_COLLECTION_001_SERIES_ID || s.name === MARKETING_COLLECTION_001_NAME,
    );

    return {
      title: `${spec.title} — ${fmt.platform} (${fmt.aspectLabel})`,
      categoryArea: spec.categoryArea,
      topic: spec.topic,
      contentPillarId: resolvedPillar?.id || spec.pillarId,
      contentPillarName: resolvedPillar?.name || spec.pillarName,
      seriesId: resolvedSeries?.id || MARKETING_COLLECTION_001_SERIES_ID,
      seriesName: resolvedSeries?.name || MARKETING_COLLECTION_001_NAME,
      contentType: spec.contentType,
      targetAudience: spec.targetAudience,
      platform: fmt.platform,
      formatId: fmt.id,
      formatLabel: fmt.label,
      dimensions: `${fmt.width}×${fmt.height}px`,
      description: `${spec.chapter} · ${spec.compositionArchetype}. Headline: "${spec.headlineExact}". ${spec.conceptSummary}`,
      caption: spec.defaultCaption,
      callToAction: spec.defaultCallToAction,
      hashtags: spec.defaultHashtags,
      tags: ['collection-001', 'creative-universe', `piece-${spec.number}`, fmt.platform],
      status: 'Approved' as const,
      promotionObjective: spec.chapter,
      masterTemplateId: spec.id,
      createdBy: adminUid,
      updatedBy: adminUid,
    };
  };

  const handleDownloadSvg = (spec: Collection001PieceSpec) => {
    try {
      const design = buildPieceDesign(spec, activeFormat);
      const blob = renderCanvasDesignToSvgBlob(design);
      triggerBlobDownload(
        blob,
        `keedohub-${spec.number}-${spec.id.replace('mkt-c001-', '')}-${activeFormat.width}x${activeFormat.height}.svg`,
      );
      setStatusMessage(`Exported vector SVG for ${spec.title} (${activeFormat.width}×${activeFormat.height}).`);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDownloadPng = async (spec: Collection001PieceSpec) => {
    setBusyAction(`png-${spec.id}`);
    setErrorMessage('');
    try {
      const design = buildPieceDesign(spec, activeFormat);
      const blob = await renderCanvasDesignToRasterBlob(design, 'png');
      triggerBlobDownload(
        blob,
        `keedohub-${spec.number}-${spec.id.replace('mkt-c001-', '')}-${activeFormat.width}x${activeFormat.height}.png`,
      );
      setStatusMessage(`Rendered & downloaded high-resolution PNG for ${spec.title}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleDownloadFullCollectionZip = async () => {
    setBusyAction('zip-pack');
    setProgressPct(0);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const zip = new JSZip();
      const briefLines = [
        MARKETING_COLLECTION_001_NAME,
        '==========================================================================',
        `Active Format Rendering: ${activeFormat.label} (${activeFormat.width}×${activeFormat.height}px)`,
        `Generated: ${new Date().toISOString()}`,
        '',
        ...COLLECTION_001_SPECS.flatMap(spec => [
          `${spec.number}. ${spec.title.toUpperCase()} [${spec.code}]`,
          `Chapter: ${spec.chapter}`,
          `Audience: ${spec.targetAudience} | Pillar: ${spec.pillarName}`,
          `Archetype: ${spec.compositionArchetype}`,
          `Exact Headline: "${spec.headlineExact}"`,
          `Creative Concept: ${spec.conceptSummary}`,
          `Art Direction: ${spec.artDirectionNotes}`,
          '--------------------------------------------------------------------------',
        ]),
      ].join('\n');

      zip.file('00_CREATIVE_DIRECTION_BRIEF.txt', briefLines);

      for (let i = 0; i < COLLECTION_001_SPECS.length; i++) {
        const spec = COLLECTION_001_SPECS[i];
        const design = buildPieceDesign(spec, activeFormat);
        const slug = `${spec.number}_${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

        const svgBlob = renderCanvasDesignToSvgBlob(design);
        zip.file(`svg/${slug}_${activeFormat.width}x${activeFormat.height}.svg`, svgBlob);

        const pngBlob = await renderCanvasDesignToRasterBlob(design, 'png');
        zip.file(`png/${slug}_${activeFormat.width}x${activeFormat.height}.png`, pngBlob);

        zip.file(`canvas-masters/${slug}.json`, JSON.stringify(design, null, 2));

        if (i === COLLECTION_001_SPECS.length - 1 || i === 0) {
          const readerDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Failed converting PNG for campaign PDF sheet.'));
            reader.readAsDataURL(pngBlob);
          });
          const pdfBlob = renderPrintMarketingPdfBlob({
            title: spec.title,
            design,
            pngDataUrl: readerDataUrl,
          });
          zip.file(`pdf/${slug}.pdf`, pdfBlob);
        }

        setProgressPct(Math.round(((i + 1) / COLLECTION_001_SPECS.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerBlobDownload(
        zipBlob,
        `keedohub-collection-001-${activeFormat.id}-${activeFormat.width}x${activeFormat.height}.zip`,
      );
      setStatusMessage(
        `Packaged all 12 Collection 001 artworks (PNG, Editable SVG, Canvas JSON, PDF Highlights + Creative Brief) in ${activeFormat.label}.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction('');
    }
  };

  const handlePublishAll12ToBrandRoom = async () => {
    setBusyAction('publish-12');
    setProgressPct(0);
    setErrorMessage('');
    setStatusMessage('');
    try {
      let savedCount = 0;
      for (let i = 0; i < COLLECTION_001_SPECS.length; i++) {
        const spec = COLLECTION_001_SPECS[i];
        const design = buildPieceDesign(spec, activeFormat);
        const existing = savedCollectionAssetsMap.get(spec.id) || null;
        await exportAndSaveCanvasToBrandRoom({
          existingAsset: existing,
          draftMetadata: buildPieceDraftMetadata(spec, activeFormat),
          design,
          format: activeFormat,
          includePdf: activeFormat.id === 'ig-feed-portrait' || activeFormat.id === 'li-portrait',
          actorUid: adminUid,
          note: `${MARKETING_COLLECTION_001_NAME} · ${spec.code} (${activeFormat.width}×${activeFormat.height})`,
          onProgress: itemPct =>
            setProgressPct(
              Math.round(((i + itemPct / 100) / COLLECTION_001_SPECS.length) * 100),
            ),
        });
        savedCount += 1;
      }
      setStatusMessage(
        `Rendered & published all ${savedCount} Collection 001 masters (PNG, Editable SVG, JSON, PDF) to Brand Room Storage & Library.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <section className="border border-[#242424] bg-[#080808] p-5 sm:p-6 space-y-6">
      {/* Header & Campaign Batch Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1A1A1A] pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
            <Sparkles size={12} />
            <span>Signature Campaign Series · 12 Bespoke Artworks</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
            {MARKETING_COLLECTION_001_NAME}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Twelve museum-grade editorial and surreal sculptural compositions created exclusively for KeedoHub. Switch formats cleanly using safe-zone composition preservation, inspect Stage 1 creative direction, edit any layer in the Canvas Editor, or export production PNG/SVG/PDF/ZIP files directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => void handleDownloadFullCollectionZip()}
            className="inline-flex items-center gap-2 border border-[#2F2F2F] bg-[#141414] px-3.5 py-2 text-xs font-bold text-white hover:border-[#FF1E1E] disabled:opacity-50"
          >
            <Archive size={14} className="text-[#FF1E1E]" />
            <span>
              {busyAction === 'zip-pack'
                ? `Packaging ZIP ${progressPct}%`
                : `Export All 12 Pack (${activeFormat.aspectLabel} ZIP)`}
            </span>
          </button>

          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => void handlePublishAll12ToBrandRoom()}
            className="inline-flex items-center gap-2 bg-[#FF1E1E] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-50"
          >
            <Layers size={14} />
            <span>
              {busyAction === 'publish-12'
                ? `Publishing ${progressPct}%...`
                : 'Produce & Save All 12 to Library'}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {(statusMessage || errorMessage) && (
        <div
          className={`border px-4 py-2.5 text-xs flex items-center justify-between gap-3 ${
            errorMessage
              ? 'border-red-900 bg-red-950/30 text-red-200'
              : 'border-emerald-900/70 bg-emerald-950/20 text-emerald-200'
          }`}
        >
          <span>{errorMessage || statusMessage}</span>
          <button
            type="button"
            onClick={() => {
              setStatusMessage('');
              setErrorMessage('');
            }}
            className="font-mono text-[10px] uppercase text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {/* Progress Indicator for Batch Actions */}
      {busyAction && (busyAction === 'zip-pack' || busyAction === 'publish-12') && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-neutral-300 tabular-nums">
            <span>
              {busyAction === 'publish-12'
                ? 'Rendering & uploading Collection 001 masters (PNG + Editable SVG + JSON + PDF) to Brand Room…'
                : 'Rendering 12 PNG + SVG + JSON + Campaign PDF files into ZIP archive…'}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#191919]">
            <div className="h-full bg-[#FF1E1E] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Chapter Filters + Multi-Format Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CHAPTER_FILTERS.map(ch => {
            const active = selectedChapter === ch;
            const shortLabel =
              ch === 'ALL' ? 'All 12 Artworks' : ch.replace('Collection ', '');
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setSelectedChapter(ch)}
                className={`border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-[#FF1E1E] bg-[#FF1E1E] text-white font-bold'
                    : 'border-[#242424] bg-[#111111] text-neutral-400 hover:text-white'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-neutral-500">
            Adapt Preview Format:
          </span>
          <select
            value={previewFormatId}
            onChange={e => setPreviewFormatId(e.target.value)}
            aria-label="Collection 001 Preview Platform Format"
            className="border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-[11px] font-mono text-white focus:border-[#FF1E1E] focus:outline-none"
          >
            {COLLECTION_001_MULTI_FORMAT_IDS.map(fmtId => {
              const fmt = getFormatSpecById(fmtId);
              return (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.platform} · {fmt.aspectLabel} ({fmt.width}×{fmt.height})
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => setShowSafeZones(v => !v)}
            className={`border px-2.5 py-1.5 text-[11px] font-mono ${
              showSafeZones
                ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-[#FF1E1E]'
                : 'border-[#242424] bg-[#111111] text-neutral-400'
            }`}
          >
            {showSafeZones ? 'Safe Zone: ON' : 'Safe Zone: OFF'}
          </button>
        </div>
      </div>

      {/* 12 Artworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visiblePieces.map(spec => {
          const pieceDesign = buildPieceDesign(spec, activeFormat);
          const existingSaved = savedCollectionAssetsMap.get(spec.id) || null;
          return (
            <article
              key={spec.id}
              className="border border-[#202020] bg-[#0D0D0D] flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-[#FF1E1E] font-bold tracking-wider">
                    {spec.code} · {spec.targetAudience.toUpperCase()}
                  </span>
                  {existingSaved ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={11} />
                      <span>Saved v{existingSaved.version}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500">
                      {activeFormat.width}×{activeFormat.height}
                    </span>
                  )}
                </div>

                <div className="border border-[#1A1A1A] bg-[#050505] aspect-[4/5] w-full overflow-hidden flex items-center justify-center">
                  <BrandRoomCanvasPreview
                    design={pieceDesign}
                    format={activeFormat}
                    showSafeZones={showSafeZones}
                    alt={spec.title}
                    className="h-full w-full"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <h4 className="text-sm font-extrabold text-white tracking-tight">
                    {spec.title}
                  </h4>
                  <p className="text-[11px] font-mono text-[#FF1E1E] leading-snug">
                    “{spec.headlineExact}”
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <span className="font-semibold text-neutral-300">
                      {spec.compositionArchetype}:
                    </span>{' '}
                    {spec.artDirectionNotes}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onOpenCanvasEditor({
                      design: pieceDesign,
                      format: activeFormat,
                      existingAsset: existingSaved,
                      draftMetadata: buildPieceDraftMetadata(spec, activeFormat),
                    })
                  }
                  className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-600 transition-colors"
                >
                  <Edit3 size={12} />
                  <span>Open in Canvas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSvg(spec)}
                  title="Download Editable Vector SVG"
                  className="inline-flex items-center gap-1 border border-[#2B2B2B] bg-[#141414] px-2.5 py-1.5 text-[11px] font-mono text-neutral-200 hover:border-[#FF1E1E]"
                >
                  <FileCode2 size={12} className="text-[#FF1E1E]" />
                  <span>SVG</span>
                </button>

                <button
                  type="button"
                  disabled={busyAction === `png-${spec.id}`}
                  onClick={() => void handleDownloadPng(spec)}
                  title="Render & Download High-Res PNG"
                  className="inline-flex items-center gap-1 border border-[#2B2B2B] bg-[#141414] px-2.5 py-1.5 text-[11px] font-mono text-neutral-200 hover:border-[#FF1E1E] disabled:opacity-50"
                >
                  <FileImage size={12} className="text-[#FF1E1E]" />
                  <span>{busyAction === `png-${spec.id}` ? '...' : 'PNG'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
