/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Media Library
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  deleteCmsMediaAsset,
  findMediaAssetUsages,
  replaceCmsMediaAsset,
  subscribeCmsMediaAssets,
  uploadCmsMediaAsset,
} from '../../../lib/websiteCms';
import type { CmsMediaAsset, CmsMediaFolder } from '../../../types/cms';
import { useWebsiteCms } from '../../../context/WebsiteCmsContext';

interface Props {
  onSelectAsset?: (url: string, alt: string) => void;
  selectionMode?: boolean;
}

const FOLDERS: Array<{ id: 'all' | CmsMediaFolder; label: string }> = [
  { id: 'all', label: 'All Files' },
  { id: 'journal', label: 'Journal' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'pages', label: 'Pages' },
  { id: 'branding', label: 'Branding' },
  { id: 'general', label: 'General' },
];

export const AdminMediaLibrary: React.FC<Props> = ({ onSelectAsset, selectionMode = false }) => {
  const { firebaseUser } = useApp();
  const { homepageCms, sitePages, siteSettings, publishedArticles } = useWebsiteCms();

  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<'all' | CmsMediaFolder>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFolder, setUploadFolder] = useState<CmsMediaFolder>('journal');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Delete state
  const [previewAsset, setPreviewAsset] = useState<CmsMediaAsset | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsMediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replacingAssetId, setReplacingAssetId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeCmsMediaAssets(data => {
      setAssets(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter(a => {
      if (selectedFolder !== 'all' && a.folder !== selectedFolder) {
        return false;
      }
      if (q) {
        const matchTitle = a.title?.toLowerCase().includes(q);
        const matchName = a.fileName?.toLowerCase().includes(q);
        const matchAlt = a.altText?.toLowerCase().includes(q);
        const matchTags = (a.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchName && !matchAlt && !matchTags) return false;
      }
      return true;
    });
  }, [assets, selectedFolder, searchQuery]);

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPEG, PNG, WebP, SVG, GIF) are supported.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const newAsset = await uploadCmsMediaAsset(
        file,
        uploadFolder,
        {
          title: uploadTitle.trim() || cleanName,
          altText: uploadAlt.trim() || cleanName,
        },
        firebaseUser?.uid || 'admin',
        pct => setUploadProgress(pct),
      );

      setUploadTitle('');
      setUploadAlt('');
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (selectionMode && onSelectAsset) {
        onSelectAsset(newAsset.url, newAsset.altText || newAsset.title);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(msg);
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleReplaceClick = (assetId: string) => {
    setReplacingAssetId(assetId);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingAssetId) return;

    try {
      setUploading(true);
      await replaceCmsMediaAsset(replacingAssetId, file, firebaseUser?.uid || 'admin');
      setUploading(false);
      setReplacingAssetId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Replace failed.';
      setUploadError(msg);
      setUploading(false);
      setReplacingAssetId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCmsMediaAsset(deleteTarget.id, deleteTarget.storagePath);
      setDeleteTarget(null);
      if (previewAsset?.id === deleteTarget.id) setPreviewAsset(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const activeUsages = useMemo(() => {
    if (!deleteTarget) return [];
    return findMediaAssetUsages(deleteTarget.url, {
      homepage: homepageCms,
      pages: Object.values(sitePages || {}),
      settings: siteSettings,
      articles: publishedArticles,
    });
  }, [deleteTarget, homepageCms, sitePages, siteSettings, publishedArticles]);

  const copyText = (text: string, isMarkdown = false) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (isMarkdown) {
          setCopiedMarkdown(true);
          setTimeout(() => setCopiedMarkdown(false), 2000);
        } else {
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {FOLDERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolder(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedFolder === f.id
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#181818]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={uploadFolder}
              onChange={e => setUploadFolder(e.target.value as CmsMediaFolder)}
              className="bg-[#141414] border border-[#262626] text-xs text-neutral-300 px-2.5 py-1.5 focus:outline-none focus:border-[#FF1E1E]"
              aria-label="Upload destination folder"
            >
              <option value="journal">Upload to: Journal</option>
              <option value="homepage">Upload to: Homepage</option>
              <option value="pages">Upload to: Pages</option>
              <option value="branding">Upload to: Branding</option>
              <option value="general">Upload to: General</option>
            </select>

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              <span>{uploading ? `${uploadProgress ?? 0}%` : 'Upload'}</span>
            </button>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="border border-red-900/60 bg-red-950/25 p-3 text-xs text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleReplaceSelected}
        className="hidden"
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 font-mono">
          Loading Media Assets…
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-12 text-center space-y-3">
          <ImageIcon size={32} className="mx-auto text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-300">No media assets found</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Upload images here to use them in Journal articles, homepage hero sections, or public pages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="group border border-[#202020] bg-[#0C0C0C] hover:border-[#FF1E1E] flex flex-col justify-between overflow-hidden transition-colors"
            >
              <div
                className="aspect-square bg-[#121212] overflow-hidden cursor-pointer relative"
                onClick={() => {
                  if (selectionMode && onSelectAsset) {
                    onSelectAsset(asset.url, asset.altText || asset.title);
                  } else {
                    setPreviewAsset(asset);
                  }
                }}
              >
                <img
                  src={asset.url}
                  alt={asset.altText || asset.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute top-1.5 left-1.5 bg-black/80 font-mono text-[9px] uppercase px-1.5 py-0.5 text-neutral-300">
                  {asset.folder}
                </span>
              </div>

              <div className="p-2 space-y-1">
                <p className="text-xs font-semibold text-white truncate" title={asset.title}>
                  {asset.title}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      title="Inspect"
                      className="p-1 hover:text-white"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      title="Delete"
                      className="p-1 hover:text-[#FF1E1E]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#2A2A2A] bg-[#0E0E0E] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#FF1E1E]">
                  Asset Details · {previewAsset.folder}
                </p>
                <h3 className="text-base font-bold text-white">{previewAsset.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="text-neutral-400 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video w-full overflow-hidden border border-[#222] bg-[#121212] flex items-center justify-center">
              <img
                src={previewAsset.url}
                alt={previewAsset.altText || previewAsset.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#121212] p-3 border border-[#222]">
              <div>
                <span className="text-neutral-500 block">File Name:</span>
                <span className="text-neutral-200 truncate block">{previewAsset.fileName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Size:</span>
                <span className="text-neutral-200">{(previewAsset.sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-neutral-500 block">MIME Type:</span>
                <span className="text-neutral-200">{previewAsset.mimeType}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Folder:</span>
                <span className="text-neutral-200 uppercase">{previewAsset.folder}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyText(previewAsset.url)}
                className="inline-flex items-center gap-1.5 bg-white text-black px-3.5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#FF1E1E] hover:text-white transition-colors"
              >
                {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedUrl ? 'Copied URL' : 'Copy Direct URL'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  copyText(`![${previewAsset.altText || previewAsset.title}](${previewAsset.url})`, true)
                }
                className="inline-flex items-center gap-1.5 border border-[#333] hover:border-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors"
              >
                {copiedMarkdown ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedMarkdown ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleReplaceClick(previewAsset.id)}
                className="inline-flex items-center gap-1.5 border border-[#333] hover:border-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors"
              >
                <RefreshCw size={13} />
                <span>Replace File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(previewAsset);
                  setPreviewAsset(null);
                }}
                className="inline-flex items-center gap-1.5 border border-red-900/60 hover:border-red-600 text-red-400 hover:text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ml-auto"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md border border-[#2E2E2E] bg-[#0E0E0E] p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Asset Deletion</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white font-mono">{deleteTarget.fileName}</span>? This will permanently remove the file from Firebase Storage.
            </p>

            {activeUsages.length > 0 && (
              <div className="border border-amber-900/60 bg-amber-950/20 p-3 space-y-1.5">
                <p className="font-mono text-[10px] uppercase font-bold text-amber-400">
                  Warning: Active Usages Detected
                </p>
                <ul className="text-[11px] text-neutral-300 list-disc pl-4 space-y-0.5">
                  {activeUsages.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 border border-[#333] hover:border-white text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                <span>{deleting ? 'Deleting…' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
