import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileText,
  FolderPlus,
  Grid,
  History,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Music2,
  Palette,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Type,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  ClientProject,
  CreativeProduct,
  Workspace,
} from '../../types';
import type {
  CreativeProductionItem,
  MultiFormatPreset,
  ProductionDesignState,
  ProductionExportedFile,
  ProductionLifecycleStatus,
} from '../../types/creativeProduction';
import {
  generateProductionPdfBlob,
  getFormatPresetById,
  loadProductionSnapshots,
  loadStudioImage,
  MULTI_FORMAT_PRESETS,
  packageProductionVariationsZip,
  type ProductionSnapshot,
  renderProductionToCanvas2D,
  renderProductionToRasterBlob,
  renderProductionToSvgString,
  saveProductionSnapshot,
  saveStudioProduction,
} from '../../lib/creativeStudioEngine';
import type { StudioAsset, StudioRelease } from '../client/ClientStudio';

export interface CreativeProductionStudioProps {
  production: CreativeProductionItem;
  workspace: Workspace;
  releases?: StudioRelease[];
  projects?: ClientProject[];
  assets?: StudioAsset[];
  onBack: () => void;
  onUpdateProduction: (updated: CreativeProductionItem) => void;
  onOpenDocumentBuilder?: (toolId: string) => void;
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

export const CreativeProductionStudio: React.FC<CreativeProductionStudioProps> = ({
  production: initialProduction,
  workspace,
  releases = [],
  projects = [],
  assets = [],
  onBack,
  onUpdateProduction,
  onOpenDocumentBuilder,
  onSaveToAssetLibrary,
  onAttachToRelease,
  onAttachToProject,
}) => {
  const [production, setProduction] = useState<CreativeProductionItem>(initialProduction);
  const [activeFormatId, setActiveFormatId] = useState<string>(initialProduction.currentFormat || '1:1-square');
  const [activeTab, setActiveTab] = useState<'content' | 'brand' | 'image' | 'texture' | 'variations' | 'export'>('content');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [undoStack, setUndoStack] = useState<ProductionDesignState[]>([]);
  const [redoStack, setRedoStack] = useState<ProductionDesignState[]>([]);
  const [snapshots, setSnapshots] = useState<ProductionSnapshot[]>(() =>
    loadProductionSnapshots(workspace.id, initialProduction.id),
  );
  const [snapshotLabel, setSnapshotLabel] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeFormatPreset = getFormatPresetById(activeFormatId);

  // Sync state if user opens a different production item
  useEffect(() => {
    setProduction(initialProduction);
    setActiveFormatId(initialProduction.currentFormat || '1:1-square');
    setUndoStack([]);
    setRedoStack([]);
    setSnapshots(loadProductionSnapshots(workspace.id, initialProduction.id));
  }, [initialProduction.id, workspace.id]);

  // Re-render canvas whenever design state, attached visual, or active format changes
  useEffect(() => {
    let active = true;
    if (!canvasRef.current) return;
    renderProductionToCanvas2D(canvasRef.current, production, activeFormatPreset);

    if (production.designState.imageUrl?.trim()) {
      void loadStudioImage(production.designState.imageUrl).then(img => {
        if (!active || !canvasRef.current || !img) return;
        renderProductionToCanvas2D(canvasRef.current, production, activeFormatPreset, img);
      });
    }
    return () => {
      active = false;
    };
  }, [production, activeFormatPreset]);

  const commitProduction = (updated: CreativeProductionItem) => {
    setProduction(updated);
    saveStudioProduction(workspace.id, updated);
    onUpdateProduction(updated);
  };

  // Update design state helper with undo/redo tracking
  const updateDesign = (patch: Partial<CreativeProductionItem['designState']>) => {
    setUndoStack(prev => [...prev.slice(-24), production.designState]);
    setRedoStack([]);
    const updated: CreativeProductionItem = {
      ...production,
      designState: {
        ...production.designState,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    };
    commitProduction(updated);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, production.designState]);
    commitProduction({
      ...production,
      designState: previous,
      updatedAt: new Date().toISOString(),
    });
    setStatusNotice('Reverted previous design change.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev.slice(-24), production.designState]);
    commitProduction({
      ...production,
      designState: nextState,
      updatedAt: new Date().toISOString(),
    });
    setStatusNotice('Restored design change.');
  };

  const handleSaveSnapshot = () => {
    const saved = saveProductionSnapshot(workspace.id, production, snapshotLabel);
    if (saved) {
      setSnapshots(loadProductionSnapshots(workspace.id, production.id));
      setSnapshotLabel('');
      setStatusNotice(`Saved snapshot "${saved.label}".`);
    }
  };

  const handleRestoreSnapshot = (snap: ProductionSnapshot) => {
    setUndoStack(prev => [...prev.slice(-24), production.designState]);
    setRedoStack([]);
    const preset = getFormatPresetById(snap.currentFormat);
    setActiveFormatId(preset.id);
    commitProduction({
      ...production,
      currentFormat: preset.id,
      dimensions: {
        width: preset.width,
        height: preset.height,
        aspectRatio: preset.aspectRatio,
        label: preset.label,
      },
      designState: { ...snap.designState },
      updatedAt: new Date().toISOString(),
    });
    setStatusNotice(`Restored version "${snap.label}".`);
  };

  const handleStatusChange = (newStatus: ProductionLifecycleStatus) => {
    commitProduction({
      ...production,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    setStatusNotice(`Production status updated to "${newStatus}".`);
  };

  const handleTitleChange = (newTitle: string) => {
    commitProduction({
      ...production,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSwitchFormat = (formatId: string) => {
    setActiveFormatId(formatId);
    const preset = getFormatPresetById(formatId);
    commitProduction({
      ...production,
      currentFormat: formatId,
      dimensions: {
        width: preset.width,
        height: preset.height,
        aspectRatio: preset.aspectRatio,
        label: preset.label,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const appendExportHistory = (
    format: ProductionExportedFile['format'],
    fileName: string,
    bytes: number,
  ) => {
    const record: ProductionExportedFile = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: fileName,
      format,
      fileSize: bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`,
      exportedAt: new Date().toISOString(),
    };
    commitProduction({
      ...production,
      exportedFiles: [record, ...(production.exportedFiles || [])].slice(0, 15),
      updatedAt: new Date().toISOString(),
    });
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportRaster = async (format: 'png' | 'jpeg') => {
    setIsExporting(true);
    setErrorMessage('');
    setStatusNotice('');
    try {
      const blob = await renderProductionToRasterBlob(production, format, activeFormatPreset);
      const safeTitle = production.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
      const fileName = `${safeTitle}-${activeFormatPreset.id}.${format}`;
      triggerDownload(blob, fileName);
      appendExportHistory(format === 'jpeg' ? 'JPEG' : 'PNG', fileName, blob.size);
      setStatusNotice(`Exported ${activeFormatPreset.label} (${format.toUpperCase()}).`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = () => {
    setIsExporting(true);
    try {
      const svgStr = renderProductionToSvgString(production, activeFormatPreset);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const safeTitle = production.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
      const fileName = `${safeTitle}-${activeFormatPreset.id}.svg`;
      triggerDownload(blob, fileName);
      appendExportHistory('SVG', fileName, blob.size);
      setStatusNotice(`Exported scalable vector SVG (${activeFormatPreset.label}).`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setStatusNotice('');
    try {
      const previewUrl = canvasRef.current?.toDataURL('image/jpeg', 0.9);
      const blob = await generateProductionPdfBlob(production, workspace.name, previewUrl);
      const safeTitle = production.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
      const fileName = `${safeTitle}-proof-spec.pdf`;
      triggerDownload(blob, fileName);
      appendExportHistory('PDF', fileName, blob.size);
      setStatusNotice(`Exported high-contrast Proof & Specification PDF.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllVariationsZip = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setStatusNotice('');
    try {
      const zipBlob = await packageProductionVariationsZip({
        item: production,
        workspaceName: workspace.name,
      });
      const safeTitle = production.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
      const fileName = `${safeTitle}-all-variations.zip`;
      triggerDownload(zipBlob, fileName);
      appendExportHistory('ZIP', fileName, zipBlob.size);
      setStatusNotice(`Exported complete multi-format ZIP package with spec sheet PDF.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToAssetLibraryDirect = async () => {
    if (!onSaveToAssetLibrary) {
      setStatusNotice('Asset Library saving is not enabled in this environment.');
      return;
    }
    setIsExporting(true);
    setErrorMessage('');
    try {
      const blob = await renderProductionToRasterBlob(production, 'png', activeFormatPreset);
      const safeTitle = production.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio-asset';
      const category = production.audience === 'Artist' ? 'Cover Art' : 'Social Content';
      await onSaveToAssetLibrary({
        blob,
        fileName: `${safeTitle}-${activeFormatPreset.id}.png`,
        category,
        releaseId: production.releaseId,
        projectId: production.projectId,
      });
      setStatusNotice(`Saved high-resolution render directly to ${production.audience} Asset Library.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleAttachToReleaseDirect = async (releaseId: string) => {
    if (!onAttachToRelease) return;
    setIsExporting(true);
    setErrorMessage('');
    try {
      const masterPreset = getFormatPresetById('1:1-master-cover');
      const blob = await renderProductionToRasterBlob(production, 'png', masterPreset);
      await onAttachToRelease(releaseId, blob);
      const rel = releases.find(r => r.id === releaseId);
      commitProduction({
        ...production,
        releaseId,
        releaseTitle: rel?.title,
        updatedAt: new Date().toISOString(),
      });
      setStatusNotice(`Artwork successfully attached to release "${rel?.title || releaseId}".`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleAttachToProjectDirect = async (projectId: string) => {
    if (!onAttachToProject || !projectId) return;
    setIsExporting(true);
    setErrorMessage('');
    try {
      const blob = await renderProductionToRasterBlob(production, 'png', activeFormatPreset);
      await onAttachToProject(projectId, blob);
      const prj = projects.find(p => p.id === projectId);
      commitProduction({
        ...production,
        projectId,
        projectTitle: prj?.title,
        updatedAt: new Date().toISOString(),
      });
      setStatusNotice(`Production master uploaded and linked to project "${prj?.title || projectId}".`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPEG, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateDesign({ imageUrl: reader.result });
        setStatusNotice('Custom image loaded into production canvas.');
      }
    };
    reader.readAsDataURL(file);
  };

  const d = production.designState;

  return (
    <div className="flex flex-col min-h-screen bg-[#080808] text-[#F3F3F3]">
      {/* Studio Production Navigation Header */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-xs text-neutral-300 hover:border-[#383838] hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Studio Directory</span>
          </button>
          <div className="h-4 w-px bg-[#222]" />
          <div className="min-w-0">
            <input
              type="text"
              value={production.title}
              onChange={e => handleTitleChange(e.target.value)}
              className="bg-transparent text-sm sm:text-base font-bold text-white outline-none focus:ring-1 focus:ring-[#FF1E1E] rounded px-1 max-w-[260px] sm:max-w-md truncate"
              title="Edit production title"
            />
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              {production.toolId} · {production.audience} OS
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Undo / Redo / Snapshot */}
          <div className="flex items-center gap-1 rounded border border-[#242424] bg-[#121212] p-0.5">
            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-[#1C1C1C] disabled:opacity-30"
              title="Undo last change"
              aria-label="Undo"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              disabled={redoStack.length === 0}
              onClick={handleRedo}
              className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-[#1C1C1C] disabled:opacity-30"
              title="Redo change"
              aria-label="Redo"
            >
              <Redo2 size={13} />
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-neutral-300 hover:text-white hover:bg-[#1C1C1C]"
              title="Save version snapshot"
            >
              <Save size={12} />
              <span className="hidden md:inline">Save Version</span>
            </button>
          </div>

          {/* Status Lifecycle Dropdown */}
          <div className="flex items-center gap-1.5 rounded border border-[#242424] bg-[#121212] px-2 py-1 text-xs font-mono">
            <span className="text-[10px] uppercase text-neutral-500">Status:</span>
            <select
              value={production.status}
              onChange={e => handleStatusChange(e.target.value as ProductionLifecycleStatus)}
              className="bg-transparent text-white outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="Draft" className="bg-[#121212]">Draft</option>
              <option value="In Progress" className="bg-[#121212]">In Progress</option>
              <option value="Saved" className="bg-[#121212]">Saved</option>
              <option value="Under Review" className="bg-[#121212]">Under Review</option>
              <option value="Approved" className="bg-[#121212]">Approved</option>
              <option value="Completed" className="bg-[#121212]">Completed</option>
              <option value="Archived" className="bg-[#121212]">Archived</option>
            </select>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => void handleExportAllVariationsZip()}
            className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>
      </header>

      {/* Notices */}
      {statusNotice && (
        <div role="status" className="border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <span>{statusNotice}</span>
          <button type="button" onClick={() => setStatusNotice('')} className="text-emerald-400 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="border-b border-red-500/30 bg-red-950/30 px-4 py-2 text-xs text-red-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="text-red-400 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Format Variation Navigation Strip */}
      <div className="flex items-center justify-between gap-3 border-b border-[#181818] bg-[#0C0C0C] px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mr-1 hidden sm:inline">
            Active Format:
          </span>
          {MULTI_FORMAT_PRESETS.map(preset => {
            const isActive = activeFormatId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSwitchFormat(preset.id)}
                className={`rounded px-2.5 py-1 text-xs font-mono transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1C1C1C] text-white border border-[#FF1E1E] font-bold'
                    : 'border border-transparent text-neutral-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                {preset.aspectRatio} · {preset.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Viewport Zoom */}
        <div className="flex items-center gap-1 shrink-0 text-xs text-neutral-400">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
            className="p-1 hover:text-white rounded border border-[#222]"
            title="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <span className="font-mono text-[11px] w-10 text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
            className="p-1 hover:text-white rounded border border-[#222]"
            title="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="px-1.5 py-0.5 text-[10px] font-mono hover:text-white rounded border border-[#222]"
            title="Reset zoom"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Workspace Body: Canvas Preview + Tool Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Left: Interactive Canvas Work Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#060606] overflow-auto min-h-[460px]">
          <div
            className="relative shadow-2xl transition-all duration-200 border border-[#222]"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              maxWidth: '100%',
              maxHeight: '75vh',
              aspectRatio: activeFormatPreset.aspectRatio === '9:16' ? '9/16' : activeFormatPreset.aspectRatio === '4:5' ? '4/5' : activeFormatPreset.aspectRatio === '16:9' ? '16/9' : activeFormatPreset.aspectRatio === '2:3' ? '2/3' : '1/1',
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain block bg-[#080808]"
              style={{
                width: activeFormatPreset.aspectRatio === '9:16' ? '360px' : activeFormatPreset.aspectRatio === '16:9' ? '640px' : activeFormatPreset.aspectRatio === '4:5' ? '400px' : '460px',
                height: 'auto',
                aspectRatio: activeFormatPreset.aspectRatio === '9:16' ? '9/16' : activeFormatPreset.aspectRatio === '4:5' ? '4/5' : activeFormatPreset.aspectRatio === '16:9' ? '16/9' : activeFormatPreset.aspectRatio === '2:3' ? '2/3' : '1/1',
              }}
            />
          </div>

          <p className="mt-4 font-mono text-[11px] text-neutral-500 tabular-nums">
            {activeFormatPreset.label} · {activeFormatPreset.width} × {activeFormatPreset.height} px
          </p>
        </div>

        {/* Right: Studio Customization Inspector Panels */}
        <aside className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1A1A1A] bg-[#0A0A0A] flex flex-col">
          {/* Panel Selector Tabs */}
          <div className="flex items-center border-b border-[#1A1A1A] bg-[#0E0E0E] overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brand')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'brand'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Colors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'image'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('texture')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'texture'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Theme
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('variations')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'variations'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Formats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 min-w-[70px] py-2.5 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-[#FF1E1E] text-white bg-[#141414]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Export
            </button>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* CONTENT & TYPOGRAPHY */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                    Primary Headline
                  </label>
                  <textarea
                    rows={2}
                    value={d.headline}
                    onChange={e => updateDesign({ headline: e.target.value })}
                    className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                    Subtitle / Release Summary
                  </label>
                  <textarea
                    rows={3}
                    value={d.subtitle}
                    onChange={e => updateDesign({ subtitle: e.target.value })}
                    className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Artist / Brand Name
                    </label>
                    <input
                      type="text"
                      value={d.artistOrBrandName}
                      onChange={e => updateDesign({ artistOrBrandName: e.target.value })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Tagline / Badge
                    </label>
                    <input
                      type="text"
                      value={d.tagline}
                      onChange={e => updateDesign({ tagline: e.target.value })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Font Family
                    </label>
                    <select
                      value={d.fontFamily}
                      onChange={e => updateDesign({ fontFamily: e.target.value as any })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="sans">Editorial Sans</option>
                      <option value="serif">Monochrome Serif</option>
                      <option value="mono">Precision Mono</option>
                      <option value="display">Heavy Display</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={d.fontWeight}
                      onChange={e => updateDesign({ fontWeight: e.target.value as any })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Regular (400)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Footer Plate Badge
                    </label>
                    <input
                      type="text"
                      value={d.badgeText || ''}
                      onChange={e => updateDesign({ badgeText: e.target.value })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                      Date / Release Edition
                    </label>
                    <input
                      type="text"
                      value={d.dateText}
                      onChange={e => updateDesign({ dateText: e.target.value })}
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                </div>

                {/* Tool-Specific Structured Metadata Fields */}
                {production.toolId === 'lyric-card-studio' && (
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E] mb-1">
                      Featured Song Lyrics / Spoken Quote
                    </label>
                    <textarea
                      rows={3}
                      value={d.quoteOrLyricsText || ''}
                      onChange={e => updateDesign({ quoteOrLyricsText: e.target.value })}
                      placeholder="Paste featured song lyric or artist quote…"
                      className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                )}

                {production.toolId === 'release-artwork-studio' && (
                  <div className="pt-2 border-t border-[#1C1C1C] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                          ISRC Code
                        </label>
                        <input
                          type="text"
                          value={d.isrcSnippet || ''}
                          onChange={e => updateDesign({ isrcSnippet: e.target.value })}
                          placeholder="US-XXX-26-00001"
                          className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#FF1E1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                          UPC / Barcode
                        </label>
                        <input
                          type="text"
                          value={d.barcodeOrUpc || ''}
                          onChange={e => updateDesign({ barcodeOrUpc: e.target.value })}
                          placeholder="198000000001"
                          className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#FF1E1E]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                        Tracklist Snippet
                      </label>
                      <textarea
                        rows={2}
                        value={d.trackListSnippet || ''}
                        onChange={e => updateDesign({ trackListSnippet: e.target.value })}
                        placeholder="01. Intro · 02. Main Single…"
                        className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>
                  </div>
                )}

                {production.toolId === 'product-ad-designer' && (
                  <div className="pt-2 border-t border-[#1C1C1C] space-y-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E] mb-1">
                        Advertisement CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={d.customCtaText || ''}
                        onChange={e => updateDesign({ customCtaText: e.target.value })}
                        placeholder="SHOP COLLECTION / ORDER NOW"
                        className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                        Feature Bullet Highlights (One Per Line)
                      </label>
                      <textarea
                        rows={3}
                        value={(d.productFeaturePoints || []).join('\n')}
                        onChange={e =>
                          updateDesign({
                            productFeaturePoints: e.target.value.split('\n').map(l => l.trim()).filter(Boolean),
                          })
                        }
                        className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>
                  </div>
                )}

                {onOpenDocumentBuilder &&
                  (production.toolId === 'artist-epk-studio' ||
                    production.toolId === 'split-sheet-studio' ||
                    production.toolId === 'brand-collateral-studio') && (
                    <div className="rounded border border-[#2B2B2B] bg-[#121212] p-3 space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        Structured Document &amp; Collateral Builder
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Design the cover visual here, or open the interactive legal/collateral generator for full PDF packet controls.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenDocumentBuilder(production.toolId)}
                        className="w-full rounded border border-[#383838] bg-[#181818] px-3 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] transition-colors"
                      >
                        Open {production.audience} Document &amp; Collateral Builder →
                      </button>
                    </div>
                  )}

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.textTransform === 'uppercase'}
                      onChange={e => updateDesign({ textTransform: e.target.checked ? 'uppercase' : 'none' })}
                      className="rounded border-[#333] bg-[#141414] text-[#FF1E1E]"
                    />
                    <span>Force Uppercase</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.showDivider}
                      onChange={e => updateDesign({ showDivider: e.target.checked })}
                      className="rounded border-[#333] bg-[#141414] text-[#FF1E1E]"
                    />
                    <span>Show Divider Line</span>
                  </label>
                </div>
              </div>
            )}

            {/* BRANDING & COLORS */}
            {activeTab === 'brand' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                    Live Workspace Brand Tokens
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateDesign({ primaryColor: workspace.brand?.primaryColor || '#FF1E1E' })}
                      className="rounded border border-[#282828] bg-[#121212] p-2.5 text-left hover:border-white transition-colors"
                    >
                      <div className="h-4 w-4 rounded-full mb-1 border border-white/20" style={{ backgroundColor: workspace.brand?.primaryColor || '#FF1E1E' }} />
                      <p className="text-[10px] text-neutral-400">Primary</p>
                      <p className="font-mono text-[11px] text-white truncate">{workspace.brand?.primaryColor || '#FF1E1E'}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDesign({ secondaryColor: workspace.brand?.secondaryColor || '#141414' })}
                      className="rounded border border-[#282828] bg-[#121212] p-2.5 text-left hover:border-white transition-colors"
                    >
                      <div className="h-4 w-4 rounded-full mb-1 border border-white/20" style={{ backgroundColor: workspace.brand?.secondaryColor || '#141414' }} />
                      <p className="text-[10px] text-neutral-400">Secondary</p>
                      <p className="font-mono text-[11px] text-white truncate">{workspace.brand?.secondaryColor || '#141414'}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDesign({ accentColor: workspace.brand?.accentColor || '#FF1E1E' })}
                      className="rounded border border-[#282828] bg-[#121212] p-2.5 text-left hover:border-white transition-colors"
                    >
                      <div className="h-4 w-4 rounded-full mb-1 border border-white/20" style={{ backgroundColor: workspace.brand?.accentColor || '#FF1E1E' }} />
                      <p className="text-[10px] text-neutral-400">Accent</p>
                      <p className="font-mono text-[11px] text-white truncate">{workspace.brand?.accentColor || '#FF1E1E'}</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                    Primary Accent Hex Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={d.primaryColor.startsWith('#') ? d.primaryColor : '#FF1E1E'}
                      onChange={e => updateDesign({ primaryColor: e.target.value })}
                      className="h-8 w-8 rounded border border-[#333] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={d.primaryColor}
                      onChange={e => updateDesign({ primaryColor: e.target.value })}
                      className="flex-1 rounded border border-[#262626] bg-[#121212] px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                    Studio Palette Presets
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { name: 'Keedo Red / Noir', primary: '#FF1E1E', theme: 'noir' as const },
                      { name: 'Monochrome Gold', primary: '#E5A93C', theme: 'pitch_black' as const },
                      { name: 'Emerald Highline', primary: '#10B981', theme: 'dark_grid' as const },
                      { name: 'Pure Minimalist', primary: '#0A0A0A', theme: 'minimal_white' as const },
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => updateDesign({ primaryColor: preset.primary, theme: preset.theme })}
                        className="rounded border border-[#242424] bg-[#121212] p-2 text-left hover:border-neutral-400 transition-colors flex items-center gap-2"
                      >
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: preset.primary }} />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* IMAGERY & ARTWORK */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                    Upload Local Visual
                  </p>
                  <label className="flex flex-col items-center justify-center rounded border border-dashed border-[#2C2C2C] bg-[#101010] p-4 text-center cursor-pointer hover:border-[#FF1E1E] transition-colors">
                    <Upload size={18} className="text-neutral-500 mb-1" />
                    <span className="text-xs text-neutral-300">Choose PNG, JPG or WebP</span>
                    <span className="text-[10px] text-neutral-500 mt-0.5">High-resolution master recommended</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>

                {assets.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                        From Workspace Assets ({assets.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAssetSelector(!showAssetSelector)}
                        className="text-[10px] font-mono text-red-300 hover:text-white"
                      >
                        {showAssetSelector ? 'Close' : 'Browse'}
                      </button>
                    </div>

                    {showAssetSelector && (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-[#202020] rounded bg-[#0E0E0E]">
                        {assets.map(asset => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              if (asset.downloadUrl) {
                                updateDesign({ imageUrl: asset.downloadUrl });
                                setStatusNotice(`Loaded asset "${asset.name}".`);
                              }
                            }}
                            className="group relative rounded overflow-hidden border border-[#222] bg-[#141414] aspect-square flex flex-col items-center justify-center p-1 text-left hover:border-[#FF1E1E]"
                          >
                            {asset.downloadUrl ? (
                              <img src={asset.downloadUrl} alt={asset.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={16} className="text-neutral-600" />
                            )}
                            <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] font-mono text-neutral-300 truncate p-0.5">
                              {asset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {d.imageUrl && (
                  <div className="rounded border border-[#242424] bg-[#121212] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Attached Image</span>
                      <button
                        type="button"
                        onClick={() => updateDesign({ imageUrl: '' })}
                        className="text-xs text-red-400 hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Filter</label>
                        <select
                          value={d.imageFilter || 'none'}
                          onChange={e => updateDesign({ imageFilter: e.target.value as any })}
                          className="w-full rounded border border-[#262626] bg-[#141414] px-2 py-1 text-xs text-white"
                        >
                          <option value="none">Normal</option>
                          <option value="grayscale">Grayscale</option>
                          <option value="noir">High Contrast Noir</option>
                          <option value="contrast">Saturated Punch</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Scale</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.05"
                          value={d.imageScale ?? 1}
                          onChange={e => updateDesign({ imageScale: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* THEME & TEXTURES */}
            {activeTab === 'texture' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                    Background Theme
                  </label>
                  <select
                    value={d.theme}
                    onChange={e => updateDesign({ theme: e.target.value as any })}
                    className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="noir">Noir Charcoal (#080808)</option>
                    <option value="pitch_black">Deep Pitch Black (#000000)</option>
                    <option value="dark_grid">Precision Studio Grid</option>
                    <option value="crimson_accent">Crimson Atmospheric Glow</option>
                    <option value="silver_slate">Silver Slate Highline</option>
                    <option value="minimal_white">Minimal White Editorial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                    Texture Overlay
                  </label>
                  <select
                    value={d.textureOverlay || 'none'}
                    onChange={e => updateDesign({ textureOverlay: e.target.value as any })}
                    className="w-full rounded border border-[#262626] bg-[#121212] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="none">None (Clean Flat)</option>
                    <option value="film_grain">Organic 35mm Film Grain</option>
                    <option value="subtle_noise">Subtle Studio Noise</option>
                    <option value="scan_lines">Cathode Scan Lines</option>
                    <option value="fine_grid">Precision Coordinate Grid</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[10px] font-mono uppercase text-neutral-500">Texture Opacity</span>
                    <span className="font-mono text-neutral-400">{Math.round((d.textureOpacity ?? 0.35) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={d.textureOpacity ?? 0.35}
                    onChange={e => updateDesign({ textureOpacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="pt-2 border-t border-[#1C1C1C] space-y-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.showBorder}
                      onChange={e => updateDesign({ showBorder: e.target.checked })}
                      className="rounded border-[#333] bg-[#141414] text-[#FF1E1E]"
                    />
                    <span>Show Outer Border &amp; Crosshairs</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.showAdvisoryBadge}
                      onChange={e => updateDesign({ showAdvisoryBadge: e.target.checked })}
                      className="rounded border-[#333] bg-[#141414] text-[#FF1E1E]"
                    />
                    <span>Parental Advisory Badge</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.spotifySafeZoneOverlay}
                      onChange={e => updateDesign({ spotifySafeZoneOverlay: e.target.checked })}
                      className="rounded border-[#333] bg-[#141414] text-[#FF1E1E]"
                    />
                    <span>Spotify 9:16 Safe Center Zone Guides</span>
                  </label>
                </div>
              </div>
            )}

            {/* MULTI-FORMAT VARIATIONS & VERSION SNAPSHOTS */}
            {activeTab === 'variations' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Compare and switch proportional outputs across social, streaming DSPs, and print collateral without losing visual balance.
                </p>

                {/* Proportional Visual Comparison Strip */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: '1:1-square', ratioClass: 'aspect-square', label: '1:1 Square' },
                    { id: '4:5-portrait', ratioClass: 'aspect-[4/5]', label: '4:5 Feed' },
                    { id: '9:16-vertical-story', ratioClass: 'aspect-[9/16]', label: '9:16 Canvas' },
                    { id: '16:9-landscape', ratioClass: 'aspect-video', label: '16:9 Hero' },
                  ].map(tile => {
                    const isSelected = activeFormatId === tile.id;
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => handleSwitchFormat(tile.id)}
                        className={`rounded border p-2 text-left transition-colors ${
                          isSelected
                            ? 'border-[#FF1E1E] bg-[#181818]'
                            : 'border-[#242424] bg-[#101010] hover:border-[#3A3A3A]'
                        }`}
                      >
                        <div className="flex items-center justify-center h-24 bg-[#070707] rounded border border-[#1E1E1E] p-1.5 overflow-hidden">
                          <div
                            className={`max-h-full max-w-full ${tile.ratioClass} h-full rounded-sm border p-1.5 flex flex-col justify-between overflow-hidden`}
                            style={{
                              backgroundColor: d.theme === 'minimal_white' ? '#F5F5F7' : '#0A0A0A',
                              borderColor: d.primaryColor || '#FF1E1E',
                            }}
                          >
                            <div className="h-0.5 w-5" style={{ backgroundColor: d.primaryColor || '#FF1E1E' }} />
                            <p
                              className="text-[7px] font-black leading-tight line-clamp-2"
                              style={{ color: d.theme === 'minimal_white' ? '#0A0A0A' : '#FFFFFF' }}
                            >
                              {d.headline}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] font-mono text-white font-semibold truncate">{tile.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {MULTI_FORMAT_PRESETS.map(preset => {
                    const isSelected = activeFormatId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSwitchFormat(preset.id)}
                        className={`rounded border p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#FF1E1E] bg-[#161616]'
                            : 'border-[#222] bg-[#111] hover:border-[#383838]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-white">{preset.label}</span>
                          <span className="font-mono text-[10px] text-neutral-500">{preset.aspectRatio}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">{preset.notes}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Version Snapshots */}
                <div className="pt-3 border-t border-[#1C1C1C] space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                    <History size={11} className="text-[#FF1E1E]" />
                    <span>Saved Version Snapshots ({snapshots.length})</span>
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={snapshotLabel}
                      onChange={e => setSnapshotLabel(e.target.value)}
                      placeholder="Version label (e.g. Noir V2)…"
                      className="flex-1 rounded border border-[#262626] bg-[#121212] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSnapshot}
                      className="rounded border border-[#2E2E2E] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#FF1E1E]"
                    >
                      Save
                    </button>
                  </div>
                  {snapshots.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {snapshots.map(snap => (
                        <div
                          key={snap.id}
                          className="flex items-center justify-between gap-2 rounded border border-[#222] bg-[#111] px-2.5 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{snap.label}</p>
                            <p className="text-[10px] font-mono text-neutral-500">
                              {new Date(snap.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(snap)}
                            className="rounded border border-[#303030] px-2 py-0.5 text-[10px] font-mono text-red-300 hover:text-white hover:border-[#FF1E1E]"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => void handleExportAllVariationsZip()}
                  className="w-full rounded bg-[#FF1E1E] py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Export All Formats (.ZIP)
                </button>
              </div>
            )}

            {/* EXPORT & WORKSPACE INTEGRATION */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                    Direct File Downloads
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => void handleExportRaster('png')}
                      className="rounded border border-[#2E2E2E] bg-[#141414] p-2.5 text-xs text-white hover:border-[#FF1E1E] transition-colors text-left"
                    >
                      <Download size={14} className="text-[#FF1E1E] mb-1" />
                      <div className="font-semibold">PNG Raster</div>
                      <div className="text-[10px] text-neutral-500">Lossless Master</div>
                    </button>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => void handleExportRaster('jpeg')}
                      className="rounded border border-[#2E2E2E] bg-[#141414] p-2.5 text-xs text-white hover:border-[#FF1E1E] transition-colors text-left"
                    >
                      <Download size={14} className="text-amber-400 mb-1" />
                      <div className="font-semibold">JPEG File</div>
                      <div className="text-[10px] text-neutral-500">Web Compressed</div>
                    </button>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={handleExportSvg}
                      className="rounded border border-[#2E2E2E] bg-[#141414] p-2.5 text-xs text-white hover:border-[#FF1E1E] transition-colors text-left"
                    >
                      <Download size={14} className="text-blue-400 mb-1" />
                      <div className="font-semibold">Vector SVG</div>
                      <div className="text-[10px] text-neutral-500">Infinite Scale</div>
                    </button>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => void handleExportPdf()}
                      className="rounded border border-[#2E2E2E] bg-[#141414] p-2.5 text-xs text-white hover:border-[#FF1E1E] transition-colors text-left"
                    >
                      <FileText size={14} className="text-purple-400 mb-1" />
                      <div className="font-semibold">Proof Spec PDF</div>
                      <div className="text-[10px] text-neutral-500">Client Presentation</div>
                    </button>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => void handleExportAllVariationsZip()}
                      className="col-span-2 rounded border border-[#2E2E2E] bg-[#141414] p-2.5 text-xs text-white hover:border-[#FF1E1E] transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold">Complete Multi-Format ZIP Bundle</div>
                        <div className="text-[10px] text-neutral-500">PNG + SVG variations + Proof PDF + README spec sheet</div>
                      </div>
                      <FileArchive size={16} className="text-emerald-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Integration Bridges */}
                <div className="pt-2 border-t border-[#1C1C1C] space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                    Connect to Workspace
                  </p>

                  {/* Save to Asset Library */}
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => void handleSaveToAssetLibraryDirect()}
                    className="w-full inline-flex items-center justify-between rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-white transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <FolderPlus size={14} className="text-emerald-400" />
                      <span>Save to Asset Library</span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">PNG Master</span>
                  </button>

                  {/* Attach to Release (For Artist OS) */}
                  {production.audience === 'Artist' && releases.length > 0 && (
                    <div className="rounded border border-[#242424] bg-[#121212] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Music2 size={13} className="text-amber-400" />
                          <span>Attach Cover to Music Release</span>
                        </span>
                      </div>
                      <select
                        value={production.releaseId || ''}
                        onChange={e => {
                          const relId = e.target.value;
                          if (relId) void handleAttachToReleaseDirect(relId);
                        }}
                        className="w-full rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">Select a release to attach artwork…</option>
                        {releases.map(rel => (
                          <option key={rel.id} value={rel.id}>
                            {rel.title} ({rel.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Attach to Project */}
                  {projects.length > 0 && (
                    <div className="rounded border border-[#242424] bg-[#121212] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <FileCheck2 size={13} className="text-purple-400" />
                          <span>Attach to Active Project</span>
                        </span>
                      </div>
                      <select
                        value={production.projectId || ''}
                        onChange={e => {
                          const pId = e.target.value;
                          const prj = projects.find(p => p.id === pId);
                          commitProduction({
                            ...production,
                            projectId: pId,
                            projectTitle: prj?.title,
                            updatedAt: new Date().toISOString(),
                          });
                          if (pId) setStatusNotice(`Linked to project "${prj?.title || pId}".`);
                        }}
                        className="w-full rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">Select an active project…</option>
                        {projects.map(proj => (
                          <option key={proj.id} value={proj.id}>
                            {proj.title} ({proj.category})
                          </option>
                        ))}
                      </select>
                      {production.projectId && onAttachToProject && (
                        <button
                          type="button"
                          disabled={isExporting}
                          onClick={() => void handleAttachToProjectDirect(production.projectId!)}
                          className="w-full rounded border border-purple-500/40 bg-purple-950/20 px-3 py-1.5 text-xs font-medium text-purple-200 hover:text-white hover:border-purple-400 disabled:opacity-50"
                        >
                          Upload Master PNG to Project Assets
                        </button>
                      )}
                    </div>
                  )}

                  {/* Recent Export History */}
                  {(production.exportedFiles || []).length > 0 && (
                    <div className="rounded border border-[#222] bg-[#101010] p-3 space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        Session Export Log ({production.exportedFiles.length})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {production.exportedFiles.map(ef => (
                          <div key={ef.id} className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                            <span className="truncate">{ef.name}</span>
                            <span className="shrink-0 text-neutral-500">{ef.format} · {ef.fileSize || ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
