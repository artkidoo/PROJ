import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import type {
  BrandColorSwatch,
  BrandIdentityAsset,
  BrandIdentityAssetSlot,
  KeedoBrandIdentity,
} from '../../../types/brandRoom';
import {
  deleteBrandRoomStoragePath,
  downloadBrandRoomFile,
  formatStorageBytes,
  saveKeedoBrandIdentity,
  uploadBrandIdentityAsset,
} from '../../../lib/brandRoomService';
import { DEFAULT_BRAND_IDENTITY } from '../../../lib/brandRoomStudio';
import keedohubLogoTransparent from '../../../assets/images/keedohub_logo_transparent.png';
import keedohubLogoLightBg from '../../../assets/images/keedohub_logo_light_bg.png';
import keedohubMarkTransparent from '../../../assets/images/keedohub_mark_transparent.png';

interface BrandIdentityPanelProps {
  identity: KeedoBrandIdentity;
  adminUid: string;
}

const IDENTITY_SLOTS: { slot: BrandIdentityAssetSlot; label: string; hint: string }[] = [
  { slot: 'primary_logo', label: 'Primary Logo', hint: 'Main KeedoHub master wordmark or emblem (SVG/PNG)' },
  { slot: 'secondary_logo', label: 'Secondary Logo', hint: 'Compact stacked or horizontal lockup' },
  { slot: 'logo_variation', label: 'Logo Variations', hint: 'Monogram, icon badge, or stamp formats' },
  { slot: 'transparent_logo', label: 'Transparent Logo Versions', hint: 'Alpha-channel PNG or vector SVG overlays' },
  { slot: 'light_logo', label: 'Light Logo Variant', hint: 'White / bright foreground for obsidian backgrounds' },
  { slot: 'dark_logo', label: 'Dark Logo Variant', hint: 'Pure black mark for light editorial & print sheets' },
  { slot: 'brand_pattern', label: 'Brand Patterns', hint: 'Modular geometric grids and repeating brand motifs' },
  { slot: 'background_texture', label: 'Background Textures', hint: 'Matte paper, grain, noise, or darkroom surfaces' },
  { slot: 'graphic_element', label: 'Graphic Elements', hint: 'Hairline dividers, index marks, and approved studio accents' },
];

export const BrandIdentityPanel: React.FC<BrandIdentityPanelProps> = ({
  identity,
  adminUid,
}) => {
  const [draft, setDraft] = useState<KeedoBrandIdentity>(identity);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [copiedHex, setCopiedHex] = useState('');

  // Asset upload state
  const [uploadSlot, setUploadSlot] = useState<BrandIdentityAssetSlot>('primary_logo');
  const [assetTitle, setAssetTitle] = useState('');
  const [assetNotes, setAssetNotes] = useState('');
  const [assetDimensions, setAssetDimensions] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  // Color & Message drafts
  const [newMessage, setNewMessage] = useState('');
  const [newColor, setNewColor] = useState<{
    name: string;
    hex: string;
    role: BrandColorSwatch['role'];
    usage: string;
  }>({
    name: '',
    hex: '#FF1E1E',
    role: 'Accent',
    usage: '',
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(identity);
  }, [identity]);

  const handleSaveIdentity = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await saveKeedoBrandIdentity({
        ...draft,
        updatedBy: adminUid,
      });
      setNotice('Saved KeedoHub Brand Identity governance & specifications.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Select an actual logo, pattern, texture, or graphic file to upload.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError('');
    setNotice('');
    try {
      const uploaded = await uploadBrandIdentityAsset({
        slot: uploadSlot,
        title: assetTitle || uploadFile.name,
        notes: assetNotes,
        dimensions: assetDimensions,
        file: uploadFile,
        uploadedBy: adminUid,
        onProgress: setUploadProgress,
      });
      const updatedAssets = [uploaded, ...(draft.assets || [])];
      const next = await saveKeedoBrandIdentity({
        ...draft,
        assets: updatedAssets,
        updatedBy: adminUid,
      });
      setDraft(next);
      setUploadFile(null);
      setAssetTitle('');
      setAssetNotes('');
      setAssetDimensions('');
      setNotice(`Uploaded official "${uploaded.title}" into Brand Identity vault.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAsset = async (asset: BrandIdentityAsset) => {
    setSaving(true);
    setError('');
    try {
      await deleteBrandRoomStoragePath(asset.storagePath);
      const updatedAssets = draft.assets.filter(item => item.id !== asset.id);
      const next = await saveKeedoBrandIdentity({
        ...draft,
        assets: updatedAssets,
        updatedBy: adminUid,
      });
      setDraft(next);
      setConfirmDeleteId(null);
      setNotice(`Removed "${asset.title}" from Brand Identity vault.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(''), 1800);
  };

  const handleAddApprovedMessage = () => {
    if (!newMessage.trim()) return;
    setDraft(prev => ({
      ...prev,
      approvedMessages: [...prev.approvedMessages, newMessage.trim()],
    }));
    setNewMessage('');
  };

  const handleAddColor = () => {
    if (!newColor.name.trim() || !newColor.hex.trim()) return;
    const item: BrandColorSwatch = {
      id: `color-${Date.now()}`,
      name: newColor.name.trim(),
      hex: newColor.hex.trim().toUpperCase(),
      rgb: newColor.hex.trim().toUpperCase(),
      role: newColor.role,
      usage: newColor.usage.trim() || 'Brand marketing accent swatch.',
    };
    setDraft(prev => ({ ...prev, colors: [...prev.colors, item] }));
    setNewColor({ name: '', hex: '#FF1E1E', role: 'Accent', usage: '' });
  };

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

      {/* Official KeedoHub Master Brand Emblem (Transparent Alpha-Channel Architecture) */}
      <section className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3 shrink-0">
            {/* Dark surface preview */}
            <div className="w-28 h-28 bg-[#090909] border border-[#262626] p-2 flex items-center justify-center shrink-0">
              <img
                src={keedohubLogoTransparent}
                alt="KeedoHub Master Logo (Dark Background)"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-transparent"
              />
            </div>
            {/* Light surface preview */}
            <div className="w-28 h-28 bg-[#F4F4F4] border border-[#CCCCCC] p-2 flex items-center justify-center shrink-0">
              <img
                src={keedohubLogoLightBg}
                alt="KeedoHub Master Logo (Light Background)"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-transparent"
              />
            </div>
          </div>
          <div className="space-y-1.5 max-w-xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
              Official Master Brand Mark · Clean Transparent PNG
            </p>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              KH Monogram · Distressed Studio Signature
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Canonical brand lockup featuring the signature vertical-bristle KH monogram with Signal Red (<span className="font-mono text-[#FF1E1E]">#FF1E1E</span>) on the left <strong className="text-white">K</strong>, crisp White (<span className="font-mono text-white">#FFFFFF</span>) / Obsidian (<span className="font-mono text-white">#0B0B0B</span>) on the <strong className="text-white">H</strong>, and crisp typography below. Rendered with clean alpha transparency and no black bounding boxes.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={keedohubLogoTransparent}
            download="keedohub-logo-dark-surface-transparent.png"
            className="inline-flex items-center gap-2 border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Download size={14} className="text-[#FF1E1E]" />
            <span>Dark PNG</span>
          </a>
          <a
            href={keedohubLogoLightBg}
            download="keedohub-logo-light-surface-transparent.png"
            className="inline-flex items-center gap-2 border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Download size={14} className="text-[#FF1E1E]" />
            <span>Light PNG</span>
          </a>
          <a
            href="/favicon.svg"
            download="keedohub-mark-transparent.svg"
            className="inline-flex items-center gap-2 border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Download size={14} className="text-[#FF1E1E]" />
            <span>SVG Mark</span>
          </a>
        </div>
      </section>

      {/* Official Identity Overview & Upload Notice */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Upload Real Brand File Form */}
        <form
          onSubmit={handleUploadAsset}
          className="xl:col-span-5 border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#1A1A1A] pb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                Official File Vault
              </p>
              <h3 className="mt-1 text-base font-bold text-white">
                Upload Brand Identity Asset
              </h3>
              <p className="mt-1 text-xs text-neutral-400">
                Upload verified logos, transparent marks, light/dark variants, patterns, and textures. KeedoHub never invents official logos.
              </p>
            </div>
            <ShieldCheck size={18} className="text-[#FF1E1E] shrink-0" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Identity Slot
              </label>
              <select
                value={uploadSlot}
                onChange={e => setUploadSlot(e.target.value as BrandIdentityAssetSlot)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {IDENTITY_SLOTS.map(s => (
                  <option key={s.slot} value={s.slot}>
                    {s.label} — {s.hint}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Asset Label
                </label>
                <input
                  type="text"
                  value={assetTitle}
                  onChange={e => setAssetTitle(e.target.value)}
                  placeholder="e.g. KeedoHub Wordmark White"
                  className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Dimensions / Spec
                </label>
                <input
                  type="text"
                  value={assetDimensions}
                  onChange={e => setAssetDimensions(e.target.value)}
                  placeholder="e.g. Vector SVG / 2400×600 PNG"
                  className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Usage Notes
              </label>
              <input
                type="text"
                value={assetNotes}
                onChange={e => setAssetNotes(e.target.value)}
                placeholder="Clear-space requirement or preferred background surface"
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Asset File (SVG, PNG, JPG, WebP, PDF)
              </label>
              <input
                type="file"
                accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.psd,.zip"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-neutral-300 file:mr-3 file:border-0 file:bg-[#1E1E1E] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
            </div>

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-neutral-300 tabular-nums">
                  <span>Uploading to Brand Room Storage…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#181818]">
                  <div
                    className="h-full bg-[#FF1E1E] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
            >
              <Upload size={14} />
              <span>{uploading ? `Uploading (${uploadProgress}%)` : 'Upload Official Asset'}</span>
            </button>
          </div>
        </form>

        {/* Official Files Grid */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Official Logo & Visual Asset Slots
              </h3>
              <p className="text-xs text-neutral-400">
                {draft.assets.length} uploaded file(s) stored privately in Firebase Storage (`brand-room/identity/`).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {IDENTITY_SLOTS.map(slotMeta => {
              const slotFiles = draft.assets.filter(a => a.slot === slotMeta.slot);
              const latest = slotFiles[0];
              const isImage =
                latest &&
                (latest.mimeType.startsWith('image/') ||
                  ['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP'].includes(latest.fileFormat.toUpperCase()));

              return (
                <div
                  key={slotMeta.slot}
                  className="border border-[#1E1E1E] bg-[#0B0B0B] p-3 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
                      <span className="truncate">{slotMeta.label}</span>
                      <span className="tabular-nums text-neutral-500 shrink-0">
                        {slotFiles.length}
                      </span>
                    </div>

                    <div
                      className={`mt-2 h-24 border border-[#1B1B1B] flex items-center justify-center overflow-hidden ${
                        slotMeta.slot === 'dark_logo' ? 'bg-[#F3F3F3]' : 'bg-[#060606]'
                      }`}
                    >
                      {latest && isImage ? (
                        <img
                          src={latest.downloadUrl}
                          alt={latest.title}
                          referrerPolicy="no-referrer"
                          className="max-h-20 max-w-[85%] object-contain"
                        />
                      ) : latest ? (
                        <span className="text-xs font-mono text-white px-2 text-center truncate">
                          {latest.fileFormat} · {latest.fileName}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-600 px-2 text-center">
                          No file uploaded yet
                        </span>
                      )}
                    </div>
                  </div>

                  {latest ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-white truncate">
                        {latest.title}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 tabular-nums truncate">
                        {latest.fileFormat} · {formatStorageBytes(latest.fileSizeBytes)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void downloadBrandRoomFile(
                              latest.storagePath,
                              latest.fileName,
                              latest.downloadUrl,
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1 border border-[#282828] bg-[#141414] px-2 py-1 text-[11px] font-medium text-white hover:border-[#FF1E1E]"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                        {confirmDeleteId === latest.id ? (
                          <button
                            type="button"
                            onClick={() => void handleRemoveAsset(latest)}
                            className="border border-red-700 bg-red-950/60 px-2 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-900"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(latest.id)}
                            aria-label={`Delete ${latest.title}`}
                            className="border border-[#282828] bg-[#141414] p-1 text-neutral-400 hover:text-red-400 hover:border-red-900"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUploadSlot(slotMeta.slot)}
                      className="w-full border border-[#242424] bg-[#111111] py-1.5 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                    >
                      Select Slot to Upload
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Colours & Typography System */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-[#FF1E1E]" />
              <h3 className="text-sm font-bold text-white">
                KeedoHub Red & Black Colour System
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {draft.colors.length} Swatches
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {draft.colors.map(swatch => (
              <div
                key={swatch.id}
                className="border border-[#1F1F1F] bg-[#101010] p-2.5 space-y-2"
              >
                <div
                  className="h-12 w-full border border-[#2A2A2A]"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white truncate">
                    {swatch.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 tabular-nums">
                    <span>{swatch.hex}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHex(swatch.hex)}
                      className="text-neutral-400 hover:text-white"
                      title="Copy Hex"
                    >
                      {copiedHex === swatch.hex ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">
                    {swatch.role} · {swatch.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#1A1A1A] grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={newColor.name}
              onChange={e => setNewColor(c => ({ ...c, name: e.target.value }))}
              placeholder="Swatch Name"
              className="border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="text"
              value={newColor.hex}
              onChange={e => setNewColor(c => ({ ...c, hex: e.target.value }))}
              placeholder="#FF1E1E"
              className="border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-xs font-mono text-white"
            />
            <select
              value={newColor.role}
              onChange={e =>
                setNewColor(c => ({ ...c, role: e.target.value as BrandColorSwatch['role'] }))
              }
              className="border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-xs text-white"
            >
              <option value="Primary">Primary</option>
              <option value="Background">Background</option>
              <option value="Surface">Surface</option>
              <option value="Text">Text</option>
              <option value="Border">Border</option>
              <option value="Accent">Accent</option>
            </select>
            <button
              type="button"
              onClick={handleAddColor}
              className="inline-flex items-center justify-center gap-1 border border-[#2C2C2C] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#FF1E1E]"
            >
              <Plus size={12} />
              <span>Add Swatch</span>
            </button>
          </div>
        </div>

        {/* Typography Specification */}
        <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2">
              <Type size={16} className="text-[#FF1E1E]" />
              <h3 className="text-sm font-bold text-white">Typography System</h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Editorial + Monospace Specs
            </span>
          </div>

          <div className="space-y-3">
            {draft.typography.map(spec => (
              <div
                key={spec.id}
                className="border border-[#1C1C1C] bg-[#101010] p-3 space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-white">
                    {spec.role} — {spec.fontFamily}
                  </span>
                  <span className="font-mono text-[11px] text-[#FF1E1E]">{spec.weights}</span>
                </div>
                <p className="text-xs text-neutral-400">{spec.usage}</p>
                <div
                  className={`pt-1 text-white border-t border-[#1A1A1A] ${
                    spec.role === 'Monospace'
                      ? 'font-mono text-[11px] tracking-wider text-neutral-300'
                      : spec.role === 'Display'
                        ? 'text-sm font-black tracking-tight'
                        : 'text-xs'
                  }`}
                >
                  {spec.sampleText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Governance, Positioning, Company Info & Approved Messages */}
      <form
        onSubmit={handleSaveIdentity}
        className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Brand Positioning, Guidelines & Approved Messaging
            </h3>
            <p className="text-xs text-neutral-400">
              Single source of truth referenced when drafting ads, social copy, press announcements, and decks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDraft(prev => ({
                  ...DEFAULT_BRAND_IDENTITY,
                  assets: prev.assets,
                  updatedBy: adminUid,
                }))
              }
              className="border border-[#2A2A2A] bg-[#121212] px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white"
            >
              Restore Copy Defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#FF1E1E] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving…' : 'Save Brand Identity'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={draft.companyName}
              onChange={e => setDraft(d => ({ ...d, companyName: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Legal / Studio Entity
            </label>
            <input
              type="text"
              value={draft.legalEntityName}
              onChange={e => setDraft(d => ({ ...d, legalEntityName: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Primary Tagline
            </label>
            <input
              type="text"
              value={draft.tagline}
              onChange={e => setDraft(d => ({ ...d, tagline: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Studio Contact Email
            </label>
            <input
              type="email"
              value={draft.contactEmail}
              onChange={e => setDraft(d => ({ ...d, contactEmail: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Website URL
            </label>
            <input
              type="text"
              value={draft.websiteUrl}
              onChange={e => setDraft(d => ({ ...d, websiteUrl: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Studio Hubs / Footprint
            </label>
            <input
              type="text"
              value={draft.headquarters}
              onChange={e => setDraft(d => ({ ...d, headquarters: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Official Brand Description
            </label>
            <textarea
              rows={3}
              value={draft.officialDescription}
              onChange={e => setDraft(d => ({ ...d, officialDescription: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Brand Positioning Statement
            </label>
            <textarea
              rows={3}
              value={draft.positioningStatement}
              onChange={e => setDraft(d => ({ ...d, positioningStatement: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Brand Voice &amp; Tone
            </label>
            <textarea
              rows={3}
              value={draft.brandVoiceAndTone}
              onChange={e => setDraft(d => ({ ...d, brandVoiceAndTone: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Visual Brand Guidelines Summary
            </label>
            <textarea
              rows={3}
              value={draft.brandGuidelinesSummary}
              onChange={e => setDraft(d => ({ ...d, brandGuidelinesSummary: e.target.value }))}
              className="w-full border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
        </div>

        {/* Approved Brand Messages */}
        <div className="space-y-2.5 pt-2 border-t border-[#1A1A1A]">
          <label className="block text-[11px] font-mono text-neutral-400">
            Approved Brand &amp; Marketing Messages
          </label>
          <div className="space-y-2">
            {draft.approvedMessages.map((msg, idx) => (
              <div
                key={`${idx}-${msg.slice(0, 12)}`}
                className="flex items-center justify-between gap-3 border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-xs text-neutral-200"
              >
                <span>{msg}</span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft(prev => ({
                      ...prev,
                      approvedMessages: prev.approvedMessages.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-neutral-500 hover:text-red-400 shrink-0"
                  aria-label="Remove approved message"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Add an approved positioning statement or copy line…"
              className="flex-1 border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddApprovedMessage}
              className="border border-[#2A2A2A] bg-[#161616] px-4 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E]"
            >
              Add Message
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
