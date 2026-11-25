import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from './firebase';
import { sanitizeStorageFileName } from './productionPromotion';
import {
  formatBytesCompact,
  inferCreativeFileFormat,
  resolveProductFamily,
  sanitizeIdList,
  slugifyProductTitle,
} from './creativeProductAccess';
import type {
  CreativeDropStatus,
  CreativeProduct,
  CreativeProductDeliverableFile,
  CreativeProductInternalSpec,
  CreativeResourceDrop,
} from '../types/creativeProduct';

export const ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES = new Set([
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
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
]);

export const MAX_PRODUCT_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export function resolveUploadMimeType(file: File | Blob, fileName: string): string {
  const declared = (file.type || '').toLowerCase().trim();
  if (declared && ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has(declared)) {
    return declared;
  }
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const byExt: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    psd: 'image/vnd.adobe.photoshop',
    zip: 'application/zip',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return byExt[ext] || declared || '';
}

export async function saveCreativeProduct(
  product: Omit<CreativeProduct, 'slug' | 'createdAt' | 'updatedAt'> & {
    slug?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<CreativeProduct> {
  const assignedWorkspaceIds = sanitizeIdList(product.assignedWorkspaceIds || []);
  const includedPackageIds = sanitizeIdList(product.includedPackageIds || []);

  const unsafeApprovedFile = (product.files || []).find(
    f =>
      f &&
      f.isApprovedForClient === true &&
      (!f.storagePath ||
        !f.storagePath.startsWith('products/') ||
        !f.storagePath.includes('/deliverables/') ||
        f.storagePath.includes('/internal/') ||
        f.storagePath.includes('..') ||
        f.storagePath.includes('\\')),
  );
  if (unsafeApprovedFile) {
    throw new Error(
      `Client-approved file "${unsafeApprovedFile.fileName || unsafeApprovedFile.label}" must reside under products/{id}/deliverables/ and never under internal/ paths.`,
    );
  }

  if (
    product.accessType === 'IncludedInPackage' &&
    product.status === 'Published' &&
    includedPackageIds.length === 0 &&
    assignedWorkspaceIds.length === 0
  ) {
    throw new Error(
      'Published IncludedInPackage products require at least one valid linked Service Package ID or explicit workspace assignment. Use Free access mode for open audience resources.',
    );
  }

  const now = new Date().toISOString();
  const id = product.id || doc(collection(db, 'creativeProducts')).id;
  const record: CreativeProduct = {
    ...product,
    id,
    productFamily: resolveProductFamily(product),
    slug: product.slug || slugifyProductTitle(product.title),
    assignedWorkspaceIds,
    includedPackageIds,
    supportedFormats: Array.from(new Set(product.supportedFormats || [])),
    deliverablesSummary: (product.deliverablesSummary || []).filter(Boolean),
    dimensionSpecs: product.dimensionSpecs || [],
    files: product.files || [],
    createdAt: product.createdAt || now,
    updatedAt: now,
  };
  if (record.status === 'Published') {
    const publishCheck = validateProductForPublish(record);
    if (!publishCheck.valid) {
      throw new Error(publishCheck.missingRequirements[0]);
    }
  }
  try {
    await setDoc(doc(db, 'creativeProducts', id), record, { merge: true });
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `creativeProducts/${id}`);
    throw err;
  }
}

export async function uploadProductPreviewImage(params: {
  productId: string;
  file: File;
}): Promise<{ previewImageUrl: string; previewStoragePath: string }> {
  const { productId, file } = params;
  const mime = resolveUploadMimeType(file, file.name);
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime)) {
    throw new Error('Preview images must be JPEG, PNG, WebP, or AVIF.');
  }
  if (file.size <= 0 || file.size > 15 * 1024 * 1024) {
    throw new Error('Preview image must be smaller than 15 MB.');
  }
  const safeName = sanitizeStorageFileName(file.name, 'preview.png');
  const storagePath = `products/${productId}/previews/${Date.now()}-${safeName}`;
  const uploaded = await uploadBytes(ref(storage, storagePath), file, { contentType: mime });
  const previewImageUrl = await getDownloadURL(uploaded.ref);
  return { previewImageUrl, previewStoragePath: storagePath };
}

export async function uploadProductPreviewBlob(params: {
  productId: string;
  blob: Blob;
  fileName: string;
}): Promise<{ previewImageUrl: string; previewStoragePath: string }> {
  const { productId, blob, fileName } = params;
  const safeName = sanitizeStorageFileName(fileName, 'preview.png');
  const mime = resolveUploadMimeType(blob, safeName) || 'image/png';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime)) {
    throw new Error('Preview images must be JPEG, PNG, WebP, or AVIF.');
  }
  if (blob.size <= 0 || blob.size >= 15 * 1024 * 1024) {
    throw new Error('Preview image must be smaller than 15 MB.');
  }
  const storagePath = `products/${productId}/previews/${Date.now()}-${safeName}`;
  const uploaded = await uploadBytes(ref(storage, storagePath), blob, { contentType: mime });
  const previewImageUrl = await getDownloadURL(uploaded.ref);
  return { previewImageUrl, previewStoragePath: storagePath };
}

export async function uploadProductDeliverableFile(params: {
  productId: string;
  file: File | Blob;
  fileName: string;
  label: string;
  dimensions?: string;
  version?: string;
  isApprovedForClient?: boolean;
  isInternalSource?: boolean;
  uploadedBy: string;
}): Promise<CreativeProductDeliverableFile> {
  const {
    productId,
    file,
    fileName,
    label,
    dimensions = '',
    version = 'v1.0',
    isApprovedForClient = true,
    isInternalSource = false,
    uploadedBy,
  } = params;

  const mimeType = resolveUploadMimeType(file, fileName);
  if (!ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported creative deliverable file type (${mimeType || fileName}).`);
  }
  if (file.size <= 0 || file.size >= MAX_PRODUCT_FILE_BYTES) {
    throw new Error('Deliverable file must be larger than 0 bytes and smaller than 50 MB.');
  }

  const fileId = crypto.randomUUID();
  const safeName = sanitizeStorageFileName(fileName, 'deliverable');
  const folder = isInternalSource ? 'internal' : 'deliverables';
  const storagePath = `products/${productId}/${folder}/${fileId}/${safeName}`;

  await uploadBytes(ref(storage, storagePath), file, { contentType: mimeType });

  return {
    id: fileId,
    label: label.trim().slice(0, 120) || safeName,
    fileName: safeName,
    fileFormat: inferCreativeFileFormat(safeName, mimeType),
    mimeType,
    storagePath,
    fileSizeBytes: file.size,
    fileSizeLabel: formatBytesCompact(file.size),
    dimensions: dimensions.trim().slice(0, 80),
    version: version.trim().slice(0, 32) || 'v1.0',
    isApprovedForClient: isInternalSource ? false : Boolean(isApprovedForClient),
    createdAt: new Date().toISOString(),
    uploadedBy,
  };
}

export async function deleteProductDeliverableStorageFile(storagePath: string): Promise<void> {
  if (!storagePath || !storagePath.startsWith('products/')) return;
  if (storagePath.includes('..') || storagePath.includes('\\')) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // Ignore already-deleted storage objects cleanly
  }
}

export async function downloadProductStorageFile(
  file: Pick<CreativeProductDeliverableFile, 'storagePath' | 'fileName'> & {
    isApprovedForClient?: boolean;
  },
  options?: { allowInternal?: boolean; allowUnapproved?: boolean },
): Promise<void> {
  if (!file.storagePath || !file.storagePath.startsWith('products/')) {
    throw new Error('This file does not have a valid storage location.');
  }
  if (file.storagePath.includes('..') || file.storagePath.includes('\\')) {
    throw new Error('Unauthorized or invalid deliverable file path.');
  }
  if (!options?.allowInternal && file.storagePath.includes('/internal/')) {
    throw new Error('Unauthorized or invalid deliverable file path.');
  }
  if (!options?.allowUnapproved && file.isApprovedForClient === false) {
    throw new Error('This deliverable is not approved for client download.');
  }
  try {
    const blob = await getBlob(ref(storage, file.storagePath));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch {
    const fallbackUrl = await getDownloadURL(ref(storage, file.storagePath));
    const anchor = document.createElement('a');
    anchor.href = fallbackUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = file.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

export async function saveProductInternalSpec(params: {
  productId: string;
  productionNotes: string;
  internalCanvasDesignJson?: string;
  sourceFiles?: CreativeProductDeliverableFile[];
  updatedBy: string;
}): Promise<void> {
  const { productId, productionNotes, internalCanvasDesignJson, sourceFiles = [], updatedBy } = params;
  const specRef = doc(db, 'creativeProducts', productId, 'internalSpecs', 'master');
  const existing = await getDoc(specRef);
  const record: CreativeProductInternalSpec = {
    id: 'master',
    productId,
    productionNotes: productionNotes.trim().slice(0, 5000),
    ...(internalCanvasDesignJson ? { internalCanvasDesignJson } : {}),
    sourceFiles: sourceFiles.length > 0 ? sourceFiles : (existing.data()?.sourceFiles || []),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await setDoc(specRef, record, { merge: true });
}

export interface ProductPublishValidationResult {
  valid: boolean;
  missingRequirements: string[];
}

export function validateProductForPublish(
  product: Partial<CreativeProduct>,
): ProductPublishValidationResult {
  const missing: string[] = [];

  if (!product.title || !product.title.trim()) {
    missing.push('Product title is required.');
  }
  if (!product.summary || !product.summary.trim()) {
    missing.push('Concise summary is required.');
  }
  if (!product.description || !product.description.trim()) {
    missing.push('Full creative description is required.');
  }
  if (!product.category || !product.category.trim()) {
    missing.push('Category is required.');
  }
  if (!product.previewImageUrl || !product.previewImageUrl.trim()) {
    missing.push('Valid preview image artwork is required before publishing.');
  }
  if (!Array.isArray(product.deliverablesSummary) || product.deliverablesSummary.filter(Boolean).length === 0) {
    missing.push('At least one included deliverable item must be listed.');
  }

  const includedPkgIds = sanitizeIdList(product.includedPackageIds || []);
  const assignedWsIds = sanitizeIdList(product.assignedWorkspaceIds || []);

  if (
    product.accessType === 'IncludedInPackage' &&
    includedPkgIds.length === 0 &&
    assignedWsIds.length === 0
  ) {
    missing.push('IncludedInPackage products require at least one Service Package ID or workspace assignment.');
  }

  if (product.accessType !== 'RequestRequired') {
    const approvedFiles = Array.isArray(product.files)
      ? product.files.filter(f => f && f.isApprovedForClient === true && Boolean(f.storagePath))
      : [];
    if (approvedFiles.length === 0 && product.instantStudioPackEligible !== true) {
      missing.push(
        'Downloadable published products require at least one approved deliverable file or Instant Studio Pack export enabled.',
      );
    }
  }

  return { valid: missing.length === 0, missingRequirements: missing };
}

export async function updateCreativeProductStatus(
  productId: string,
  status: CreativeProduct['status'],
  updatedBy: string,
): Promise<void> {
  const productRef = doc(db, 'creativeProducts', productId);
  try {
    if (status === 'Published') {
      const existing = await getDoc(productRef);
      if (!existing.exists()) {
        throw new Error('Creative product record could not be found.');
      }
      const data = existing.data() as Partial<CreativeProduct>;
      const check = validateProductForPublish({ ...data, status: 'Published' });
      if (!check.valid) {
        throw new Error(check.missingRequirements[0]);
      }
    }
    await updateDoc(productRef, {
      status,
      reviewStatus: status,
      updatedBy,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('permission') || err.message.includes('insufficient'))) {
      handleFirestoreError(err, OperationType.UPDATE, `creativeProducts/${productId}`);
    }
    throw err;
  }
}

export async function deleteCreativeProductRecord(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'creativeProducts', productId, 'internalSpecs', 'master'));
  } catch {
    // Ignore if internalSpecs subdoc does not exist
  }
  try {
    await deleteDoc(doc(db, 'creativeProducts', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `creativeProducts/${productId}`);
  }
}

export async function saveCreativeDrop(
  drop: Omit<CreativeResourceDrop, 'slug' | 'createdAt' | 'updatedAt'> & {
    slug?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<CreativeResourceDrop> {
  const trimmedTitle = (drop.title || '').trim();
  if (!trimmedTitle || trimmedTitle.length > 160) {
    throw new Error('Drop title is required and must be 160 characters or fewer.');
  }
  const trimmedMonthKey = (drop.monthKey || '').trim();
  if (!/^[0-9]{4}-[0-9]{2}$/.test(trimmedMonthKey)) {
    throw new Error('Drop month key must use YYYY-MM format (for example, 2026-11).');
  }

  const now = new Date().toISOString();
  const id = drop.id || doc(collection(db, 'creativeDrops')).id;
  const cleanProductIds = sanitizeIdList(drop.productIds || []);
  const record: CreativeResourceDrop = {
    ...drop,
    id,
    title: trimmedTitle,
    monthKey: trimmedMonthKey,
    slug: drop.slug || slugifyProductTitle(trimmedTitle),
    productIds: cleanProductIds,
    highlightTags: Array.isArray(drop.highlightTags) ? drop.highlightTags.filter(Boolean).slice(0, 15) : [],
    publishDate: drop.publishDate || now,
    createdAt: drop.createdAt || now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, 'creativeDrops', id), record, { merge: true });
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `creativeDrops/${id}`);
    throw err;
  }
}

export async function updateCreativeDropStatus(
  dropId: string,
  status: CreativeDropStatus,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'creativeDrops', dropId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `creativeDrops/${dropId}`);
  }
}

export async function deleteCreativeDropRecord(dropId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'creativeDrops', dropId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `creativeDrops/${dropId}`);
  }
}
