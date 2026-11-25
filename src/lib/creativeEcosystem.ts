import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, OperationType, handleFirestoreError } from './firebase';
import type {
  CreativeProduct,
  CreativeProductAudience,
  CreativeResourceDrop,
  FavouriteResource,
  ResourceAccessHistoryItem,
  ResourceAnalyticsAction,
  ResourceCollection,
} from '../types/creativeProduct';
import { matchesProductAudience, sanitizeIdList } from './creativeProductAccess';

// ============================================================================
// FAVOURITES (users/{uid}/favouriteResources/{productId})
// ============================================================================

export function subscribeUserFavourites(
  uid: string,
  onUpdate: (items: FavouriteResource[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }
  const path = `users/${uid}/favouriteResources`;
  return onSnapshot(
    query(collection(db, 'users', uid, 'favouriteResources'), orderBy('savedAt', 'desc')),
    snap => {
      onUpdate(snap.docs.map(d => d.data() as FavouriteResource));
    },
    err => {
      if (onError) onError(err);
      else console.warn(`Favourites listener warning (${path}):`, err.message);
    },
  );
}

export async function toggleFavouriteResource(params: {
  uid: string;
  workspaceId: string;
  product: CreativeProduct;
  currentlyFavourited: boolean;
}): Promise<boolean> {
  const { uid, workspaceId, product, currentlyFavourited } = params;
  const path = `users/${uid}/favouriteResources/${product.id}`;
  const ref = doc(db, 'users', uid, 'favouriteResources', product.id);
  try {
    if (currentlyFavourited) {
      await deleteDoc(ref);
      void trackResourceEvent({
        productId: product.id,
        action: 'favourite_remove',
        workspaceId,
        audience: product.audience,
        category: product.category,
        accessType: product.accessType,
        title: product.title,
      });
      return false;
    }
    const payload: FavouriteResource = {
      productId: product.id,
      uid,
      workspaceId,
      audience: product.audience,
      titleSnapshot: product.title.slice(0, 160),
      categorySnapshot: product.category.slice(0, 120),
      previewImageUrlSnapshot: (product.previewImageUrl || '').slice(0, 1024),
      savedAt: new Date().toISOString(),
    };
    await setDoc(ref, payload);
    void trackResourceEvent({
      productId: product.id,
      action: 'favourite_add',
      workspaceId,
      audience: product.audience,
      category: product.category,
      accessType: product.accessType,
      title: product.title,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return currentlyFavourited;
  }
}

// ============================================================================
// PERSONAL COLLECTIONS (users/{uid}/resourceCollections/{collectionId})
// ============================================================================

export function subscribeUserCollections(
  uid: string,
  onUpdate: (collections: ResourceCollection[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }
  const path = `users/${uid}/resourceCollections`;
  return onSnapshot(
    query(collection(db, 'users', uid, 'resourceCollections'), orderBy('updatedAt', 'desc')),
    snap => {
      onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResourceCollection)));
    },
    err => {
      if (onError) onError(err);
      else console.warn(`Collections listener warning (${path}):`, err.message);
    },
  );
}

export function mergeUniqueCollectionProductIds(
  existingIds: readonly string[],
  productIdToAdd: string,
): string[] {
  const clean = sanitizeIdList(existingIds);
  if (!productIdToAdd || clean.includes(productIdToAdd)) return clean;
  return [...clean, productIdToAdd].slice(0, 100);
}

export async function createResourceCollection(params: {
  uid: string;
  workspaceId: string;
  name: string;
  description?: string;
  initialProductIds?: string[];
}): Promise<ResourceCollection> {
  const { uid, workspaceId, name, description = '', initialProductIds = [] } = params;
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new Error('Collection name is required.');
  const ref = doc(collection(db, 'users', uid, 'resourceCollections'));
  const now = new Date().toISOString();
  const record: ResourceCollection = {
    id: ref.id,
    uid,
    workspaceId,
    name: cleanName,
    description: description.trim().slice(0, 400),
    productIds: sanitizeIdList(initialProductIds).slice(0, 100),
    createdAt: now,
    updatedAt: now,
  };
  try {
    await setDoc(ref, record);
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/resourceCollections/${ref.id}`);
    throw err;
  }
}

export async function renameResourceCollection(params: {
  uid: string;
  collectionItem: ResourceCollection;
  name: string;
  description?: string;
}): Promise<void> {
  const { uid, collectionItem, name, description } = params;
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new Error('Collection name is required.');
  const ref = doc(db, 'users', uid, 'resourceCollections', collectionItem.id);
  try {
    await setDoc(
      ref,
      {
        ...collectionItem,
        name: cleanName,
        description: (description ?? collectionItem.description ?? '').trim().slice(0, 400),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/resourceCollections/${collectionItem.id}`);
  }
}

export async function addProductToCollection(params: {
  uid: string;
  workspaceId: string;
  collectionItem: ResourceCollection;
  product: CreativeProduct;
}): Promise<ResourceCollection> {
  const { uid, workspaceId, collectionItem, product } = params;
  const nextIds = mergeUniqueCollectionProductIds(collectionItem.productIds || [], product.id);
  const now = new Date().toISOString();
  const updated: ResourceCollection = {
    ...collectionItem,
    productIds: nextIds,
    updatedAt: now,
  };
  const ref = doc(db, 'users', uid, 'resourceCollections', collectionItem.id);
  try {
    await setDoc(ref, updated, { merge: true });
    if (nextIds.length > (collectionItem.productIds || []).length) {
      void trackResourceEvent({
        productId: product.id,
        action: 'collection_add',
        workspaceId,
        audience: product.audience,
        category: product.category,
        accessType: product.accessType,
        title: product.title,
      });
    }
    return updated;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/resourceCollections/${collectionItem.id}`);
    throw err;
  }
}

export async function removeProductFromCollection(params: {
  uid: string;
  collectionItem: ResourceCollection;
  productId: string;
}): Promise<ResourceCollection> {
  const { uid, collectionItem, productId } = params;
  const updated: ResourceCollection = {
    ...collectionItem,
    productIds: (collectionItem.productIds || []).filter(id => id !== productId),
    updatedAt: new Date().toISOString(),
  };
  const ref = doc(db, 'users', uid, 'resourceCollections', collectionItem.id);
  try {
    await setDoc(ref, updated, { merge: true });
    return updated;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/resourceCollections/${collectionItem.id}`);
    throw err;
  }
}

export async function deleteResourceCollection(uid: string, collectionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'resourceCollections', collectionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/resourceCollections/${collectionId}`);
  }
}

// ============================================================================
// RESOURCE ACCESS HISTORY (users/{uid}/resourceHistory/{productId})
// ============================================================================

export function subscribeUserResourceHistory(
  uid: string,
  onUpdate: (items: ResourceAccessHistoryItem[]) => void,
): () => void {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'users', uid, 'resourceHistory'), orderBy('lastAccessedAt', 'desc')),
    snap => {
      onUpdate(snap.docs.map(d => d.data() as ResourceAccessHistoryItem));
    },
    err => {
      console.warn('Resource history listener warning:', err.message);
    },
  );
}

export async function recordResourceHistoryEntry(params: {
  uid: string;
  workspaceId: string;
  product: CreativeProduct;
  action: 'view' | 'preview' | 'download';
  format?: string;
  variation?: string;
}): Promise<void> {
  const { uid, workspaceId, product, action, format, variation } = params;
  if (!uid || !product.id) return;
  const ref = doc(db, 'users', uid, 'resourceHistory', product.id);
  try {
    const existing = await getDoc(ref);
    const prevDownloads = existing.exists() ? Number(existing.data()?.downloadCount || 0) : 0;
    const entry: ResourceAccessHistoryItem = {
      productId: product.id,
      uid,
      workspaceId,
      lastAction: action,
      ...(format ? { lastFormat: format } : {}),
      ...(variation ? { lastVariation: variation } : {}),
      downloadCount: action === 'download' ? prevDownloads + 1 : prevDownloads,
      titleSnapshot: product.title.slice(0, 160),
      categorySnapshot: product.category.slice(0, 120),
      previewImageUrlSnapshot: (product.previewImageUrl || '').slice(0, 1024),
      lastAccessedAt: new Date().toISOString(),
    };
    await setDoc(ref, entry, { merge: true });
  } catch (err) {
    // Non-blocking history recording; log context cleanly
    console.warn('Unable to update resource history:', err);
  }
}

// ============================================================================
// MONTHLY CREATIVE RESOURCE DROPS
// ============================================================================

export function getCurrentMonthKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function isDropEligibleForClient(
  drop: CreativeResourceDrop,
  clientBucket: 'Artist' | 'Brand' | 'Business',
  nowIso?: string,
): boolean {
  if (drop.status !== 'Published') return false;
  if (!matchesProductAudience(drop.audience, clientBucket)) return false;
  if (drop.expiresAt) {
    const nowMs = nowIso ? Date.parse(nowIso) : Date.now();
    const expMs = Date.parse(drop.expiresAt);
    if (Number.isFinite(expMs) && expMs <= nowMs) return false;
  }
  return true;
}

export function splitCurrentAndArchivedDrops(
  drops: readonly CreativeResourceDrop[],
  clientBucket: 'Artist' | 'Brand' | 'Business',
  now = new Date(),
): {
  currentDrops: CreativeResourceDrop[];
  archivedDrops: CreativeResourceDrop[];
  newDropProductIds: Set<string>;
} {
  const currentMonth = getCurrentMonthKey(now);
  const nowIso = now.toISOString();

  const eligiblePublished = drops.filter(d => isDropEligibleForClient(d, clientBucket, nowIso));
  const sorted = [...eligiblePublished].sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));

  const currentDrops = sorted.filter(d => d.monthKey >= currentMonth);
  const effectiveCurrent = currentDrops.length > 0 ? currentDrops : sorted.slice(0, 1);
  const currentIds = new Set(effectiveCurrent.map(d => d.id));
  const archivedDrops = sorted.filter(d => !currentIds.has(d.id));

  const newDropProductIds = new Set<string>();
  for (const drop of effectiveCurrent) {
    for (const pid of drop.productIds || []) {
      newDropProductIds.add(pid);
    }
  }

  return { currentDrops: effectiveCurrent, archivedDrops, newDropProductIds };
}

export function subscribeClientCreativeDrops(
  allowedAudiences: CreativeProductAudience[],
  onUpdate: (drops: CreativeResourceDrop[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!allowedAudiences.length) {
    onUpdate([]);
    return () => {};
  }
  const dropsByKey: Record<string, CreativeResourceDrop[]> = {};
  const unsubs = allowedAudiences.map(aud =>
    onSnapshot(
      query(
        collection(db, 'creativeDrops'),
        where('status', '==', 'Published'),
        where('audience', '==', aud),
      ),
      snap => {
        dropsByKey[aud] = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeResourceDrop));
        const merged = new Map<string, CreativeResourceDrop>();
        Object.values(dropsByKey).forEach(list => list.forEach(item => merged.set(item.id, item)));
        onUpdate(Array.from(merged.values()));
      },
      err => {
        if (onError) onError(err);
        else console.warn(`Creative Drops listener warning (${aud}):`, err.message);
      },
    ),
  );
  return () => unsubs.forEach(u => u());
}

// ============================================================================
// SERVER VERIFICATION & ANALYTICS TELEMETRY (WITH SESSION DEDUPLICATION)
// ============================================================================

const SESSION_ANALYTICS_CACHE = new Map<string, number>();
const CLIENT_DEDUP_WINDOW_MS = 10 * 60 * 1000;

export function shouldSendSessionAnalyticsEvent(
  action: ResourceAnalyticsAction,
  entityId: string,
  nowMs = Date.now(),
): boolean {
  if (!['view', 'preview', 'drop_view'].includes(action)) {
    return true;
  }
  const key = `${action}:${entityId}`;
  const prev = SESSION_ANALYTICS_CACHE.get(key);
  if (prev !== undefined && nowMs - prev < CLIENT_DEDUP_WINDOW_MS) {
    return false;
  }
  SESSION_ANALYTICS_CACHE.set(key, nowMs);
  return true;
}

export async function trackResourceEvent(params: {
  productId?: string;
  dropId?: string;
  action: ResourceAnalyticsAction;
  workspaceId: string;
  audience: CreativeProductAudience | 'Unknown';
  category?: string;
  accessType?: CreativeProduct['accessType'];
  title?: string;
  format?: string;
}): Promise<void> {
  const entityId = params.productId || params.dropId || '';
  if (!entityId || !shouldSendSessionAnalyticsEvent(params.action, entityId)) {
    return;
  }
  try {
    const callable = httpsCallable(functions, 'recordCreativeResourceEvent');
    await callable(params);
  } catch {
    // Telemetry must never block client workflows when offline or unprovisioned
  }
}

export async function verifyResourceDownloadAccess(params: {
  productId: string;
  workspaceId: string;
  accessType?: CreativeProduct['accessType'];
  unlockedByDefault?: boolean;
}): Promise<{
  allowed: boolean;
  reason?: string;
  instantStudioPackEligible?: boolean;
  verifiedByServer: boolean;
}> {
  try {
    const callable = httpsCallable<
      { productId: string; workspaceId: string },
      { allowed: boolean; reason?: string; instantStudioPackEligible?: boolean }
    >(functions, 'verifyCreativeResourceAccess');
    const res = await callable({
      productId: params.productId,
      workspaceId: params.workspaceId,
    });
    return {
      allowed: Boolean(res.data?.allowed),
      reason: res.data?.reason,
      instantStudioPackEligible: res.data?.instantStudioPackEligible,
      verifiedByServer: true,
    };
  } catch (err) {
    const code = String((err as { code?: string })?.code || '').toLowerCase();
    const msg = String((err as Error)?.message || '');
    const isOfflineTransportError =
      code.includes('unavailable') ||
      code.includes('deadline-exceeded') ||
      /failed to fetch|networkerror|econnrefused/i.test(msg);

    const isFreeEligible = params.accessType === 'Free' || params.unlockedByDefault === true;
    if (isOfflineTransportError && isFreeEligible) {
      return { allowed: true, verifiedByServer: false };
    }

    return {
      allowed: false,
      reason: msg || 'Access denied: server entitlement verification could not authorize this download.',
      verifiedByServer: !isOfflineTransportError,
    };
  }
}
