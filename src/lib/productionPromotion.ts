import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  BrandAsset,
  ClientProject,
  ProductionDeliverableVersion,
} from '../types';
import {
  isDeliverablePromotionRestrictedAsset,
  isInternalStoragePath,
} from './assetSecurity';

export { isDeliverablePromotionRestrictedAsset, isInternalStoragePath };

export const ALLOWED_PRODUCTION_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/avif',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'audio/m4a',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/json',
  'application/xml',
  'application/zip',
  'application/x-zip-compressed',
  'application/font-woff',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'text/plain',
  'text/xml',
]);

export const MAX_PRODUCTION_ASSET_BYTES = 50 * 1024 * 1024;

export function sanitizeStorageFileName(name: string, fallback = 'production-asset'): string {
  const cleaned = name
    .trim()
    .replace(/[\\/]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-100);
  return cleaned || fallback;
}

export function inferMimeFromBrandAsset(asset: BrandAsset): string {
  if (asset.mimeType && ALLOWED_PRODUCTION_MIME_TYPES.has(asset.mimeType)) {
    return asset.mimeType;
  }
  const map: Record<string, string> = {
    SVG: 'image/svg+xml',
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    WEBP: 'image/webp',
    GIF: 'image/gif',
    AVIF: 'image/avif',
    PDF: 'application/pdf',
    JSON: 'application/json',
    MP4: 'video/mp4',
    WEBM: 'video/webm',
    MOV: 'video/quicktime',
    WAV: 'audio/wav',
    MP3: 'audio/mpeg',
    AAC: 'audio/aac',
    FLAC: 'audio/flac',
    ZIP: 'application/zip',
    FONT: 'font/woff2',
    TEXT: 'text/plain',
  };
  return map[asset.fileType] || 'application/octet-stream';
}

export function inferBrandAssetFileType(file: File): BrandAsset['fileType'] {
  const mime = file.type.toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (mime.includes('svg') || ext === 'svg') return 'SVG';
  if (mime.includes('png') || ext === 'png') return 'PNG';
  if (mime.includes('jpeg') || mime.includes('jpg') || ext === 'jpg' || ext === 'jpeg') return 'JPEG';
  if (mime.includes('webp') || ext === 'webp') return 'WEBP';
  if (mime.includes('gif') || ext === 'gif') return 'GIF';
  if (mime.includes('avif') || ext === 'avif') return 'AVIF';
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (mime === 'application/json' || ext === 'json') return 'JSON';
  if (mime === 'video/mp4' || ext === 'mp4') return 'MP4';
  if (mime === 'video/webm' || ext === 'webm') return 'WEBM';
  if (mime === 'video/quicktime' || ext === 'mov') return 'MOV';
  if (mime.includes('wav') || ext === 'wav') return 'WAV';
  if (mime === 'audio/mpeg' || ext === 'mp3') return 'MP3';
  if (mime === 'audio/aac' || ext === 'aac') return 'AAC';
  if (mime === 'audio/flac' || ext === 'flac') return 'FLAC';
  if (mime.includes('zip') || ext === 'zip') return 'ZIP';
  if (mime.startsWith('font/') || ['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'FONT';
  return 'TEXT';
}

async function createDeliverableFromBlob(params: {
  project: ClientProject;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  actorUid: string;
  actorName: string;
  publishImmediately?: boolean;
  activityDetails: string;
}): Promise<string> {
  const {
    project,
    title,
    description,
    fileName,
    mimeType,
    blob,
    actorUid,
    actorName,
    publishImmediately = false,
    activityDetails,
  } = params;

  if (mimeType === 'application/json') {
    throw new Error(
      'JSON specification files are internal production records and cannot be staged as client deliverables. Export and upload a client-ready visual, audio, video, or PDF file instead.'
    );
  }
  if (!ALLOWED_PRODUCTION_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported MIME type (${mimeType}) for production deliverables.`);
  }
  if (blob.size <= 0 || blob.size >= MAX_PRODUCTION_ASSET_BYTES) {
    throw new Error('Deliverable file must be larger than 0 bytes and smaller than 50 MB.');
  }

  const deliverableRef = doc(collection(db, 'clientProjects', project.id, 'deliverables'));
  const safeFileName = sanitizeStorageFileName(fileName, 'deliverable');
  const storagePath = `production/${project.id}/deliverables/${deliverableRef.id}/${safeFileName}`;

  const uploaded = await uploadBytes(ref(storage, storagePath), blob, {
    contentType: mimeType,
  });
  const fileUrl = await getDownloadURL(uploaded.ref);
  const now = new Date().toISOString();

  await setDoc(deliverableRef, {
    id: deliverableRef.id,
    projectId: project.id,
    clientUid: project.clientUid,
    title: title.trim().slice(0, 300),
    description: description.trim().slice(0, 5000),
    fileUrl,
    storagePath,
    fileName: safeFileName,
    fileType: mimeType,
    fileSize: blob.size,
    isClientPublished: publishImmediately,
    reviewStatus: publishImmediately ? 'Awaiting Review' : 'Draft',
    createdAt: now,
    updatedAt: now,
    uploadedBy: actorUid,
    currentVersion: 1,
    versions: [
      {
        version: 1,
        fileUrl,
        storagePath,
        fileName: safeFileName,
        fileType: mimeType,
        fileSize: blob.size,
        uploadedBy: actorUid,
        createdAt: now,
      } satisfies ProductionDeliverableVersion,
    ],
  });

  await addDoc(collection(db, 'clientProjects', project.id, 'activity'), {
    projectId: project.id,
    actorUid,
    actorName,
    action: publishImmediately ? 'Deliverable staged & published' : 'Deliverable staged from studio',
    details: activityDetails.slice(0, 5000),
    clientVisible: publishImmediately,
    createdAt: now,
  });

  return deliverableRef.id;
}

export async function promoteBrandAssetToDeliverable(params: {
  asset: BrandAsset;
  project: ClientProject;
  actorUid: string;
  actorName: string;
  titleOverride?: string;
  descriptionOverride?: string;
}): Promise<string> {
  const { asset, project, actorUid, actorName, titleOverride, descriptionOverride } = params;
  if (isDeliverablePromotionRestrictedAsset(asset)) {
    throw new Error(
      'JSON specification files are internal production records and cannot be staged as client deliverables. Export and upload a client-ready visual, audio, video, or PDF file instead.'
    );
  }
  const mimeType = inferMimeFromBrandAsset(asset);

  let blob: Blob;
  if (asset.storagePath) {
    blob = await getBlob(ref(storage, asset.storagePath));
  } else if (asset.downloadUrl) {
    const response = await fetch(asset.downloadUrl);
    if (!response.ok) {
      throw new Error('Unable to fetch source asset file for promotion.');
    }
    blob = await response.blob();
  } else {
    throw new Error('Selected asset has no backing storage path or download URL.');
  }

  const resolvedMime = ALLOWED_PRODUCTION_MIME_TYPES.has(blob.type) ? blob.type : mimeType;
  if (resolvedMime === 'application/json') {
    throw new Error(
      'JSON specification files are internal production records and cannot be staged as client deliverables. Export and upload a client-ready visual, audio, video, or PDF file instead.'
    );
  }

  const fileExtension = asset.fileType.toLowerCase();
  const baseName = asset.storagePath?.split('/').pop() || `${sanitizeStorageFileName(asset.name)}.${fileExtension}`;
  const description =
    descriptionOverride ||
    [asset.description, asset.usageRules ? `Usage notes: ${asset.usageRules}` : '']
      .filter(Boolean)
      .join('\n');

  return createDeliverableFromBlob({
    project,
    title: titleOverride || asset.name,
    description,
    fileName: baseName,
    mimeType: resolvedMime,
    blob,
    actorUid,
    actorName,
    publishImmediately: false,
    activityDetails: `Staged production deliverable draft "${titleOverride || asset.name}" from workspace asset "${asset.name}".`,
  });
}
