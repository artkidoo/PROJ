import { jsPDF } from 'jspdf';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getBlob,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { sanitizeStorageFileName } from './productionPromotion';
import {
  formatBytesCompact,
  inferCreativeFileFormat,
} from './creativeProductAccess';
import {
  renderCanvasDesignToRasterBlob,
  renderCanvasDesignToSvgBlob,
} from './productPackager';
import {
  DEFAULT_BRAND_IDENTITY,
  DEFAULT_CONTENT_PILLARS,
  DEFAULT_CONTENT_SERIES,
  getFormatSpecById,
} from './brandRoomStudio';
import type {
  BrandIdentityAsset,
  BrandIdentityAssetSlot,
  ContentPillar,
  ContentSeries,
  KeedoBrandIdentity,
  MarketingAsset,
  MarketingContentStatus,
  MarketingExportFile,
  MarketingFormatSpec,
  MarketingPlatform,
} from '../types/brandRoom';
import type { CanvasDesign } from '../types/designStudio';

export const MAX_BRAND_ROOM_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_BRAND_ROOM_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/vnd.adobe.photoshop',
  'application/x-photoshop',
  'application/photoshop',
  'application/pdf',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
]);

export function resolveBrandRoomMimeType(file: Blob | File, fileName: string): string {
  const declared = (file.type || '').toLowerCase().trim();
  if (declared && ALLOWED_BRAND_ROOM_MIME_TYPES.has(declared)) {
    return declared;
  }
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
    psd: 'image/vnd.adobe.photoshop',
    pdf: 'application/pdf',
    json: 'application/json',
    zip: 'application/zip',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return map[ext] || declared || '';
}

export function validateBrandRoomUpload(
  file: Blob | File,
  fileName: string,
): { mimeType: string; safeName: string } {
  const safeName = sanitizeStorageFileName(fileName, 'brand-room-asset');
  const mimeType = resolveBrandRoomMimeType(file, safeName);
  if (!ALLOWED_BRAND_ROOM_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported file format (${mimeType || safeName}). Upload PNG, JPG, SVG, WebP, PDF, PSD, ZIP, MP4, WEBM, MOV, JSON, or font files.`,
    );
  }
  if (file.size <= 0 || file.size >= MAX_BRAND_ROOM_FILE_BYTES) {
    throw new Error('File must be larger than 0 bytes and strictly under 50 MB.');
  }
  return { mimeType, safeName };
}

export function isAuthorizedBrandRoomStoragePath(storagePath: string): boolean {
  if (!storagePath || !storagePath.startsWith('brand-room/')) return false;
  if (storagePath.includes('..') || storagePath.includes('\\')) return false;
  return true;
}

async function uploadWithProgress(
  storagePath: string,
  file: Blob | File,
  mimeType: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file, { contentType: mimeType });

  return await new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      error => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.(100);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

// ---------------------------------------------------------------------------
// BRAND IDENTITY MANAGEMENT
// ---------------------------------------------------------------------------

export async function saveKeedoBrandIdentity(
  identity: Omit<KeedoBrandIdentity, 'id' | 'updatedAt'> & { updatedAt?: string },
): Promise<KeedoBrandIdentity> {
  const now = new Date().toISOString();
  const record: KeedoBrandIdentity = stripUndefinedDeep({
    ...identity,
    id: 'keedohub',
    companyName: identity.companyName.trim().slice(0, 120) || 'KEEDOHUB',
    legalEntityName: identity.legalEntityName.trim().slice(0, 160),
    tagline: identity.tagline.trim().slice(0, 240),
    officialDescription: identity.officialDescription.trim().slice(0, 4000),
    positioningStatement: identity.positioningStatement.trim().slice(0, 4000),
    brandVoiceAndTone: identity.brandVoiceAndTone.trim().slice(0, 3000),
    brandGuidelinesSummary: identity.brandGuidelinesSummary.trim().slice(0, 4000),
    approvedMessages: identity.approvedMessages.filter(Boolean).slice(0, 25),
    colors: identity.colors.slice(0, 24),
    typography: identity.typography.slice(0, 12),
    assets: identity.assets.slice(0, 100),
    updatedAt: now,
  });
  await setDoc(doc(db, 'brandRoomIdentity', 'keedohub'), record, { merge: true });
  return record;
}

export async function ensureDefaultBrandIdentity(adminUid: string): Promise<KeedoBrandIdentity> {
  const snap = await getDoc(doc(db, 'brandRoomIdentity', 'keedohub'));
  if (snap.exists()) {
    return snap.data() as KeedoBrandIdentity;
  }
  return await saveKeedoBrandIdentity({
    ...DEFAULT_BRAND_IDENTITY,
    updatedBy: adminUid,
  });
}

export async function uploadBrandIdentityAsset(params: {
  slot: BrandIdentityAssetSlot;
  title: string;
  notes?: string;
  dimensions?: string;
  file: File;
  uploadedBy: string;
  onProgress?: (pct: number) => void;
}): Promise<BrandIdentityAsset> {
  const { slot, title, notes = '', dimensions = '', file, uploadedBy, onProgress } = params;
  const { mimeType, safeName } = validateBrandRoomUpload(file, file.name);
  const assetId = crypto.randomUUID();
  const storagePath = `brand-room/identity/${slot}/${assetId}/${safeName}`;
  const downloadUrl = await uploadWithProgress(storagePath, file, mimeType, onProgress);

  return {
    id: assetId,
    slot,
    title: title.trim().slice(0, 120) || safeName,
    ...(notes.trim() ? { notes: notes.trim().slice(0, 600) } : {}),
    fileName: safeName,
    fileFormat: inferCreativeFileFormat(safeName, mimeType),
    mimeType,
    storagePath,
    downloadUrl,
    fileSizeBytes: file.size,
    ...(dimensions.trim() ? { dimensions: dimensions.trim().slice(0, 80) } : {}),
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
}

export async function deleteBrandRoomStoragePath(storagePath?: string): Promise<void> {
  if (!storagePath || !isAuthorizedBrandRoomStoragePath(storagePath)) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // Ignore already removed storage files cleanly
  }
}

export async function downloadBrandRoomFile(
  storagePath: string,
  fileName: string,
  fallbackUrl?: string,
): Promise<void> {
  if (!isAuthorizedBrandRoomStoragePath(storagePath)) {
    throw new Error('Unauthorized Brand Room file location.');
  }
  try {
    const blob = await getBlob(ref(storage, storagePath));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    const url = fallbackUrl || (await getDownloadURL(ref(storage, storagePath)));
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// ---------------------------------------------------------------------------
// CONTENT PILLARS & SERIES
// ---------------------------------------------------------------------------

export async function seedDefaultPillarsAndSeries(adminUid: string): Promise<{
  pillarsAdded: number;
  seriesAdded: number;
}> {
  const now = new Date().toISOString();
  let pillarsAdded = 0;
  let seriesAdded = 0;

  for (const pillar of DEFAULT_CONTENT_PILLARS) {
    const refDoc = doc(db, 'brandRoomPillars', pillar.id);
    const existing = await getDoc(refDoc);
    if (!existing.exists()) {
      await setDoc(refDoc, {
        ...pillar,
        createdAt: now,
        updatedAt: now,
        createdBy: adminUid,
      });
      pillarsAdded += 1;
    }
  }

  for (const series of DEFAULT_CONTENT_SERIES) {
    const refDoc = doc(db, 'brandRoomSeries', series.id);
    const existing = await getDoc(refDoc);
    if (!existing.exists()) {
      await setDoc(refDoc, {
        ...series,
        createdAt: now,
        updatedAt: now,
        createdBy: adminUid,
      });
      seriesAdded += 1;
    }
  }

  return { pillarsAdded, seriesAdded };
}

export async function saveContentPillar(
  pillar: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<ContentPillar> {
  const now = new Date().toISOString();
  const id = pillar.id || doc(collection(db, 'brandRoomPillars')).id;
  const record: ContentPillar = stripUndefinedDeep({
    ...pillar,
    id,
    name: pillar.name.trim().slice(0, 120),
    description: pillar.description.trim().slice(0, 1200),
    coreObjectives: pillar.coreObjectives.filter(Boolean).slice(0, 10),
    createdAt: pillar.createdAt || now,
    updatedAt: now,
  });
  await setDoc(doc(db, 'brandRoomPillars', id), record, { merge: true });
  return record;
}

export async function deleteContentPillar(pillarId: string): Promise<void> {
  await deleteDoc(doc(db, 'brandRoomPillars', pillarId));
}

export async function saveContentSeries(
  series: Omit<ContentSeries, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<ContentSeries> {
  const now = new Date().toISOString();
  const id = series.id || doc(collection(db, 'brandRoomSeries')).id;
  const record: ContentSeries = stripUndefinedDeep({
    ...series,
    id,
    name: series.name.trim().slice(0, 120),
    description: series.description.trim().slice(0, 1200),
    cadence: series.cadence.trim().slice(0, 60) || 'Weekly',
    recommendedFormats: series.recommendedFormats.filter(Boolean).slice(0, 10),
    createdAt: series.createdAt || now,
    updatedAt: now,
  });
  await setDoc(doc(db, 'brandRoomSeries', id), record, { merge: true });
  return record;
}

export async function deleteContentSeries(seriesId: string): Promise<void> {
  await deleteDoc(doc(db, 'brandRoomSeries', seriesId));
}

// ---------------------------------------------------------------------------
// MARKETING ASSETS & CONTENT ITEMS
// ---------------------------------------------------------------------------

export async function saveMarketingAsset(
  asset: Omit<MarketingAsset, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<MarketingAsset> {
  const now = new Date().toISOString();
  const id = asset.id || doc(collection(db, 'brandRoomAssets')).id;
  const record: MarketingAsset = stripUndefinedDeep({
    ...asset,
    id,
    title: asset.title.trim().slice(0, 160),
    topic: asset.topic.trim().slice(0, 120),
    description: asset.description.trim().slice(0, 4000),
    caption: asset.caption.trim().slice(0, 4000),
    callToAction: asset.callToAction.trim().slice(0, 240),
    hashtags: asset.hashtags.filter(Boolean).slice(0, 30),
    tags: asset.tags.filter(Boolean).slice(0, 30),
    exportedFiles: asset.exportedFiles || [],
    version: Math.max(1, asset.version || 1),
    versionHistory: (asset.versionHistory || []).slice(0, 50),
    reuseCount: Math.max(0, asset.reuseCount || 0),
    createdAt: asset.createdAt || now,
    updatedAt: now,
  });
  await setDoc(doc(db, 'brandRoomAssets', id), record, { merge: true });
  return record;
}

export async function updateMarketingAssetStatus(params: {
  assetId: string;
  status: MarketingContentStatus;
  updatedBy: string;
  publicationDate?: string;
  publishedUrl?: string;
}): Promise<void> {
  const { assetId, status, updatedBy, publicationDate, publishedUrl } = params;
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'brandRoomAssets', assetId), {
    status,
    updatedBy,
    updatedAt: now,
    ...(publicationDate !== undefined ? { publicationDate } : {}),
    ...(publishedUrl !== undefined ? { publishedUrl } : {}),
    ...(status === 'Published' ? { publishedAt: now } : {}),
  });
}

export async function deleteMarketingAsset(asset: MarketingAsset): Promise<void> {
  if (asset.previewStoragePath) {
    await deleteBrandRoomStoragePath(asset.previewStoragePath);
  }
  if (asset.editableSourcePath) {
    await deleteBrandRoomStoragePath(asset.editableSourcePath);
  }
  for (const file of asset.exportedFiles || []) {
    await deleteBrandRoomStoragePath(file.storagePath);
  }
  await deleteDoc(doc(db, 'brandRoomAssets', asset.id));
}

export async function uploadFileToMarketingAsset(params: {
  assetId: string;
  file: File | Blob;
  fileName: string;
  label: string;
  dimensions?: string;
  platform?: MarketingPlatform;
  formatId?: string;
  isEditableSource?: boolean;
  version: number;
  uploadedBy: string;
  onProgress?: (pct: number) => void;
}): Promise<MarketingExportFile> {
  const {
    assetId,
    file,
    fileName,
    label,
    dimensions = '',
    platform,
    formatId,
    isEditableSource = false,
    version,
    uploadedBy,
    onProgress,
  } = params;

  const { mimeType, safeName } = validateBrandRoomUpload(file, fileName);
  const fileId = crypto.randomUUID();
  const folder = isEditableSource ? 'sources' : 'exports';
  const storagePath = `brand-room/assets/${assetId}/${folder}/v${version}/${fileId}-${safeName}`;
  const downloadUrl = await uploadWithProgress(storagePath, file, mimeType, onProgress);

  return {
    id: fileId,
    label: label.trim().slice(0, 120) || safeName,
    fileName: safeName,
    fileFormat: inferCreativeFileFormat(safeName, mimeType),
    mimeType,
    storagePath,
    downloadUrl,
    fileSizeBytes: file.size,
    ...(dimensions ? { dimensions } : {}),
    ...(platform ? { platform } : {}),
    ...(formatId ? { formatId } : {}),
    isEditableSource,
    version,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
}

export function renderPrintMarketingPdfBlob(params: {
  title: string;
  design: CanvasDesign;
  pngDataUrl?: string;
}): Blob {
  const { design, pngDataUrl } = params;
  const isLandscape = design.width > design.height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [design.width, design.height],
  });

  if (pngDataUrl) {
    pdf.addImage(pngDataUrl, 'PNG', 0, 0, design.width, design.height);
  } else {
    pdf.setFillColor(8, 8, 8);
    pdf.rect(0, 0, design.width, design.height, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(36);
    pdf.text(params.title.toUpperCase(), 60, 120);
  }

  return pdf.output('blob');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to encode rendered artwork for PDF.'));
    reader.readAsDataURL(blob);
  });
}

export interface BrandRoomExportAdapters {
  generateAssetId?: () => string;
  renderRaster?: (design: CanvasDesign, format: 'png' | 'jpeg') => Promise<Blob>;
  renderSvg?: (design: CanvasDesign) => Blob;
  renderPdf?: typeof renderPrintMarketingPdfBlob;
  encodeDataUrl?: (blob: Blob) => Promise<string>;
  uploadFile?: typeof uploadFileToMarketingAsset;
  saveAsset?: typeof saveMarketingAsset;
  deleteStoragePath?: typeof deleteBrandRoomStoragePath;
}

/**
 * Renders a CanvasDesign to real PNG + SVG (plus PDF if requested or print format),
 * uploads every artifact + editable JSON source to Firebase Storage, and saves the
 * persistent MarketingAsset record in Firestore.
 * Rolls back any newly uploaded Storage files if a subsequent upload or Firestore write fails.
 */
export async function exportAndSaveCanvasToBrandRoom(
  params: {
    existingAsset?: MarketingAsset | null;
    draftMetadata: Omit<MarketingAsset, 'id' | 'createdAt' | 'updatedAt' | 'exportedFiles' | 'version' | 'versionHistory' | 'reuseCount'>;
    design: CanvasDesign;
    format: MarketingFormatSpec;
    includePdf?: boolean;
    actorUid: string;
    note?: string;
    onProgress?: (pct: number) => void;
  },
  adapters: BrandRoomExportAdapters = {},
): Promise<MarketingAsset> {
  const {
    existingAsset,
    draftMetadata,
    design,
    format,
    includePdf = false,
    actorUid,
    note = 'Canvas export rendered & published to Brand Room library',
    onProgress,
  } = params;

  const generateAssetId = adapters.generateAssetId || (() => doc(collection(db, 'brandRoomAssets')).id);
  const renderRaster = adapters.renderRaster || renderCanvasDesignToRasterBlob;
  const renderSvg = adapters.renderSvg || renderCanvasDesignToSvgBlob;
  const renderPdf = adapters.renderPdf || renderPrintMarketingPdfBlob;
  const encodeDataUrl = adapters.encodeDataUrl || blobToDataUrl;
  const uploadFile = adapters.uploadFile || uploadFileToMarketingAsset;
  const saveAsset = adapters.saveAsset || saveMarketingAsset;
  const deleteStoragePath = adapters.deleteStoragePath || deleteBrandRoomStoragePath;

  const assetId = existingAsset?.id || generateAssetId();
  const nextVersion = existingAsset ? existingAsset.version + 1 : 1;
  const baseSlug = sanitizeStorageFileName(
    `${draftMetadata.title}-${format.platform}-${format.aspectLabel}`,
    'keedohub-marketing',
  ).replace(/\.[^.]+$/, '');

  const uploadedStoragePaths: string[] = [];

  try {
    onProgress?.(10);
    const pngBlob = await renderRaster(design, 'png');
    onProgress?.(30);
    const svgBlob = renderSvg(design);

    const jsonBlob = new Blob([JSON.stringify(design, null, 2)], {
      type: 'application/json',
    });

    const pngExport = await uploadFile({
      assetId,
      file: pngBlob,
      fileName: `${baseSlug}-${design.width}x${design.height}.png`,
      label: `${format.label} (PNG)`,
      dimensions: `${design.width}×${design.height}px`,
      platform: format.platform,
      formatId: format.id,
      isEditableSource: false,
      version: nextVersion,
      uploadedBy: actorUid,
      onProgress: p => onProgress?.(30 + Math.round(p * 0.25)),
    });
    uploadedStoragePaths.push(pngExport.storagePath);

    const svgExport = await uploadFile({
      assetId,
      file: svgBlob,
      fileName: `${baseSlug}-${design.width}x${design.height}.svg`,
      label: `${format.label} (Editable SVG)`,
      dimensions: `${design.width}×${design.height}px`,
      platform: format.platform,
      formatId: format.id,
      isEditableSource: true,
      version: nextVersion,
      uploadedBy: actorUid,
      onProgress: p => onProgress?.(55 + Math.round(p * 0.2)),
    });
    uploadedStoragePaths.push(svgExport.storagePath);

    const sourceJsonExport = await uploadFile({
      assetId,
      file: jsonBlob,
      fileName: `${baseSlug}-source.json`,
      label: `Canvas Source Master (v${nextVersion})`,
      dimensions: `${design.width}×${design.height}px`,
      platform: format.platform,
      formatId: format.id,
      isEditableSource: true,
      version: nextVersion,
      uploadedBy: actorUid,
      onProgress: p => onProgress?.(75 + Math.round(p * 0.15)),
    });
    uploadedStoragePaths.push(sourceJsonExport.storagePath);

    const newExports: MarketingExportFile[] = [pngExport, svgExport, sourceJsonExport];

    if (includePdf || format.platform === 'Print & Offline' || format.recommendedFormats.includes('PDF')) {
      const pngDataUrl = await encodeDataUrl(pngBlob);
      const pdfBlob = renderPdf({
        title: draftMetadata.title,
        design,
        pngDataUrl,
      });
      const pdfExport = await uploadFile({
        assetId,
        file: pdfBlob,
        fileName: `${baseSlug}-${design.width}x${design.height}.pdf`,
        label: `${format.label} (Print/Carousel PDF)`,
        dimensions: `${design.width}×${design.height}px`,
        platform: format.platform,
        formatId: format.id,
        isEditableSource: false,
        version: nextVersion,
        uploadedBy: actorUid,
      });
      uploadedStoragePaths.push(pdfExport.storagePath);
      newExports.push(pdfExport);
    }

    onProgress?.(95);

    const now = new Date().toISOString();
    const prevFiles = existingAsset?.exportedFiles || [];
    const mergedFiles = [...newExports, ...prevFiles].slice(0, 50);

    const saved = await saveAsset({
      ...draftMetadata,
      id: assetId,
      platform: format.platform,
      formatId: format.id,
      formatLabel: format.label,
      dimensions: `${design.width}×${design.height}px`,
      canvasDesignJson: JSON.stringify(design),
      previewUrl: pngExport.downloadUrl || existingAsset?.previewUrl || '',
      previewStoragePath: pngExport.storagePath,
      editableSourcePath: sourceJsonExport.storagePath,
      editableSourceUrl: sourceJsonExport.downloadUrl || '',
      exportedFiles: mergedFiles,
      version: nextVersion,
      versionHistory: [
        {
          version: nextVersion,
          note,
          storagePath: pngExport.storagePath,
          fileName: pngExport.fileName,
          fileFormat: pngExport.fileFormat,
          updatedAt: now,
          updatedBy: actorUid,
        },
        ...(existingAsset?.versionHistory || []),
      ].slice(0, 50),
      reuseCount: existingAsset ? existingAsset.reuseCount + 1 : 0,
      createdAt: existingAsset?.createdAt || now,
      createdBy: existingAsset?.createdBy || actorUid,
      updatedBy: actorUid,
    });

    onProgress?.(100);
    return saved;
  } catch (err) {
    for (const orphanPath of uploadedStoragePaths) {
      await deleteStoragePath(orphanPath).catch(() => {});
    }
    throw err;
  }
}

export interface BrandRoomAnalyticsSummary {
  totalAssets: number;
  draftCount: number;
  plannedCount: number;
  approvedCount: number;
  scheduledCount: number;
  publishedCount: number;
  archivedCount: number;
  totalExportFiles: number;
  totalReuses: number;
  platformDistribution: { platform: MarketingPlatform; count: number }[];
  pillarDistribution: { pillarName: string; count: number }[];
  recentPublished: MarketingAsset[];
}

export function computeBrandRoomAnalytics(assets: MarketingAsset[]): BrandRoomAnalyticsSummary {
  const active = assets;
  const draftCount = active.filter(a => a.status === 'Draft').length;
  const plannedCount = active.filter(a => a.status === 'Planned').length;
  const approvedCount = active.filter(a => a.status === 'Approved').length;
  const scheduledCount = active.filter(a => a.status === 'Scheduled').length;
  const publishedCount = active.filter(a => a.status === 'Published').length;
  const archivedCount = active.filter(a => a.status === 'Archived').length;

  const totalExportFiles = active.reduce(
    (sum, item) => sum + (item.exportedFiles?.length || 0),
    0,
  );
  const totalReuses = active.reduce((sum, item) => sum + (item.reuseCount || 0), 0);

  const byPlatform = new Map<MarketingPlatform, number>();
  const byPillar = new Map<string, number>();

  for (const item of active) {
    byPlatform.set(item.platform, (byPlatform.get(item.platform) || 0) + 1);
    const pillarKey = item.contentPillarName || 'Unassigned';
    byPillar.set(pillarKey, (byPillar.get(pillarKey) || 0) + 1);
  }

  const platformDistribution = Array.from(byPlatform.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  const pillarDistribution = Array.from(byPillar.entries())
    .map(([pillarName, count]) => ({ pillarName, count }))
    .sort((a, b) => b.count - a.count);

  const recentPublished = active
    .filter(a => a.status === 'Published')
    .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt))
    .slice(0, 12);

  return {
    totalAssets: active.length,
    draftCount,
    plannedCount,
    approvedCount,
    scheduledCount,
    publishedCount,
    archivedCount,
    totalExportFiles,
    totalReuses,
    platformDistribution,
    pillarDistribution,
    recentPublished,
  };
}

export function formatStorageBytes(bytes?: number): string {
  return formatBytesCompact(bytes ?? 0);
}

export { getFormatSpecById };
