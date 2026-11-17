import type { BrandAsset } from '../types';

export function isInternalStoragePath(storagePath?: string): boolean {
  return Boolean(storagePath && /(?:^|\/)internal(?:\/|$)/.test(storagePath));
}

export function isDeliverablePromotionRestrictedAsset(
  asset: Pick<BrandAsset, 'fileType' | 'mimeType' | 'name' | 'storagePath'>
): boolean {
  const mime = (asset.mimeType || '').toLowerCase();
  const name = (asset.name || '').toLowerCase();
  const path = (asset.storagePath || '').toLowerCase();
  return (
    mime === 'application/json' ||
    asset.fileType === 'JSON' ||
    name.endsWith('.json') ||
    path.endsWith('.json')
  );
}
