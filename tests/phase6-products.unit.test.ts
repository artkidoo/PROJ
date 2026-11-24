import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatBytesCompact,
  getApprovedDownloadableFiles,
  inferCreativeFileFormat,
  isClientEligibleForProductDownload,
  isClientEligibleForProductView,
  resolveClientAudienceBucket,
  slugifyProductTitle,
} from '../src/lib/creativeProductAccess';
import type { CreativeProduct, CreativeProductDeliverableFile } from '../src/types/creativeProduct';

function makeProduct(overrides: Partial<CreativeProduct> = {}): CreativeProduct {
  return {
    id: 'prod-1',
    title: 'Sample Product',
    slug: 'sample-product',
    audience: 'Artist',
    category: 'Streaming Platform Packs',
    subcategory: 'Spotify',
    summary: 'Summary',
    description: 'Description',
    status: 'Published',
    accessType: 'Free',
    assignedWorkspaceIds: [],
    includedPackageIds: [],
    linkedServiceCategory: 'Streaming Pack',
    version: 'v1.0',
    supportedFormats: ['PNG', 'PSD'],
    deliverablesSummary: ['Cover Art'],
    dimensionSpecs: [],
    previewImageUrl: '/preview.jpg',
    files: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
    ...overrides,
  };
}

function makeFile(overrides: Partial<CreativeProductDeliverableFile> = {}): CreativeProductDeliverableFile {
  return {
    id: 'file-1',
    label: 'Master PNG',
    fileName: 'cover.png',
    fileFormat: 'PNG',
    mimeType: 'image/png',
    storagePath: 'products/prod-1/deliverables/file-1-cover.png',
    fileSizeBytes: 204800,
    fileSizeLabel: '200.0 KB',
    version: 'v1.0',
    isApprovedForClient: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    uploadedBy: 'admin-1',
    ...overrides,
  };
}

function run() {
  // 1. Audience resolution & isolation (two canonical buckets: Artist | Brand)
  assert.equal(resolveClientAudienceBucket('Artist', 'Artist'), 'Artist');
  assert.equal(resolveClientAudienceBucket('Brand', 'Brand'), 'Brand');
  assert.equal(resolveClientAudienceBucket('Company', 'Business'), 'Brand');

  const artistFree = makeProduct({ audience: 'Artist', accessType: 'Free' });
  const brandShared = makeProduct({ audience: 'Brand & Business', accessType: 'Free' });
  const businessOnly = makeProduct({ audience: 'Business', accessType: 'Free' });
  const universal = makeProduct({ audience: 'Shared', accessType: 'Free' });

  assert.equal(isClientEligibleForProductView({ product: artistFree, clientBucket: 'Artist', workspaceId: 'ws-a' }), true);
  assert.equal(isClientEligibleForProductView({ product: artistFree, clientBucket: 'Brand', workspaceId: 'ws-b' }), false);

  assert.equal(isClientEligibleForProductView({ product: brandShared, clientBucket: 'Artist', workspaceId: 'ws-a' }), false);
  assert.equal(isClientEligibleForProductView({ product: brandShared, clientBucket: 'Brand', workspaceId: 'ws-b' }), true);

  assert.equal(isClientEligibleForProductView({ product: businessOnly, clientBucket: 'Artist', workspaceId: 'ws-a' }), false);
  assert.equal(isClientEligibleForProductView({ product: businessOnly, clientBucket: 'Brand', workspaceId: 'ws-b' }), true);

  assert.equal(isClientEligibleForProductView({ product: universal, clientBucket: 'Artist', workspaceId: 'ws-a' }), true);
  assert.equal(isClientEligibleForProductView({ product: universal, clientBucket: 'Brand', workspaceId: 'ws-b' }), true);

  // 2. Status visibility (Draft & Archived strictly excluded for clients)
  assert.equal(
    isClientEligibleForProductView({ product: makeProduct({ status: 'Draft' }), clientBucket: 'Artist', workspaceId: 'ws-a' }),
    false,
  );
  assert.equal(
    isClientEligibleForProductView({ product: makeProduct({ status: 'Archived' }), clientBucket: 'Artist', workspaceId: 'ws-a' }),
    false,
  );

  // 3. Access Type rules (AdminAssigned, IncludedInPackage, RequestRequired)
  const adminAssigned = makeProduct({ accessType: 'AdminAssigned', assignedWorkspaceIds: ['ws-vip'] });
  assert.equal(isClientEligibleForProductView({ product: adminAssigned, clientBucket: 'Artist', workspaceId: 'ws-other' }), false);
  assert.equal(isClientEligibleForProductView({ product: adminAssigned, clientBucket: 'Artist', workspaceId: 'ws-vip' }), true);
  assert.equal(isClientEligibleForProductDownload({ product: adminAssigned, clientBucket: 'Artist', workspaceId: 'ws-vip' }), true);

  const packageScoped = makeProduct({ accessType: 'IncludedInPackage', includedPackageIds: ['pkg-pro'] });
  assert.equal(
    isClientEligibleForProductView({ product: packageScoped, clientBucket: 'Artist', workspaceId: 'ws-a', contractedPackageIds: [] }),
    false,
  );
  assert.equal(
    isClientEligibleForProductView({ product: packageScoped, clientBucket: 'Artist', workspaceId: 'ws-a', contractedPackageIds: ['pkg-pro'] }),
    true,
  );

  const requestOnly = makeProduct({ accessType: 'RequestRequired' });
  assert.equal(isClientEligibleForProductView({ product: requestOnly, clientBucket: 'Artist', workspaceId: 'ws-a' }), true);
  assert.equal(
    isClientEligibleForProductDownload({ product: requestOnly, clientBucket: 'Artist', workspaceId: 'ws-a' }),
    false,
    'RequestRequired product must not permit direct download without workspace assignment',
  );

  // 4. Deliverable file filtering blocks unapproved, internal, and traversal paths
  const files: CreativeProductDeliverableFile[] = [
    makeFile({ id: 'ok', isApprovedForClient: true }),
    makeFile({ id: 'draft', isApprovedForClient: false }),
    makeFile({ id: 'internal-leak', isApprovedForClient: true, storagePath: 'products/prod-1/internal/master.psd' }),
    makeFile({ id: 'traversal', isApprovedForClient: true, storagePath: 'products/../secret/file.psd' }),
  ];
  const approved = getApprovedDownloadableFiles(files);
  assert.deepEqual(
    approved.map(f => f.id),
    ['ok'],
  );

  // 5. File format inference & helpers
  assert.equal(inferCreativeFileFormat('brand-master.psd', ''), 'PSD');
  assert.equal(inferCreativeFileFormat('brochure.pdf', 'application/pdf'), 'PDF');
  assert.equal(inferCreativeFileFormat('logo-lockup.svg', 'image/svg+xml'), 'SVG');
  assert.equal(inferCreativeFileFormat('bundle.zip', 'application/zip'), 'ZIP');
  assert.equal(inferCreativeFileFormat('canvas.mp4', 'video/mp4'), 'MP4');
  assert.equal(formatBytesCompact(1536), '1.5 KB');
  assert.equal(slugifyProductTitle('Spotify Canvas & Press Pack!'), 'spotify-canvas-press-pack');

  // 6. Static security boundary verification: NO DesignCanvasEditor in Client components & admin guard enforced
  const rootDir = process.cwd();
  const clientStudioSrc = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientStudio.tsx'), 'utf8');
  const clientWorkspaceSrc = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientWorkspace.tsx'), 'utf8');
  const clientHubSrc = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientCreativeHub.tsx'), 'utf8');
  const sidebarSrc = fs.readFileSync(path.join(rootDir, 'src/components/common/Sidebar.tsx'), 'utf8');
  const canvasEditorSrc = fs.readFileSync(path.join(rootDir, 'src/components/studio/DesignCanvasEditor.tsx'), 'utf8');
  const creativeTplSrc = fs.readFileSync(path.join(rootDir, 'src/components/modules/CreativeTemplateLibrary.tsx'), 'utf8');
  const promoStudioSrc = fs.readFileSync(path.join(rootDir, 'src/components/modules/MusicPromotionStudio.tsx'), 'utf8');
  const firestoreRulesSrc = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  const storageRulesSrc = fs.readFileSync(path.join(rootDir, 'storage.rules'), 'utf8');

  assert.ok(!clientStudioSrc.includes('DesignCanvasEditor'), 'ClientStudio must never reference DesignCanvasEditor');
  assert.ok(!clientWorkspaceSrc.includes('DesignCanvasEditor'), 'ClientWorkspace must never reference DesignCanvasEditor');
  assert.ok(!clientWorkspaceSrc.includes('Design Canvas'), 'ClientWorkspace must not advertise Design Canvas to clients');
  assert.ok(!clientHubSrc.includes('DesignCanvasEditor'), 'ClientCreativeHub must never reference DesignCanvasEditor');
  assert.ok(!sidebarSrc.includes("id: 'templates'"), 'Legacy client templates nav route must remain removed');

  assert.ok(canvasEditorSrc.includes('canAccessAdminCenter'), 'DesignCanvasEditor must enforce canAccessAdminCenter');
  assert.ok(canvasEditorSrc.includes("doc(db, 'admins'"), 'DesignCanvasEditor must verify active admin record from server');
  assert.ok(creativeTplSrc.includes('canAccessAdminCenter'), 'CreativeTemplateLibrary must fail closed without admin access');
  assert.ok(promoStudioSrc.includes('canAccessAdminCenter'), 'MusicPromotionStudio must fail closed without admin access');

  assert.ok(firestoreRulesSrc.includes('match /creativeProducts/{productId}'), 'firestore.rules missing creativeProducts match');
  assert.ok(firestoreRulesSrc.includes('match /internalSpecs/{specId}'), 'firestore.rules missing internalSpecs admin isolation');
  assert.ok(storageRulesSrc.includes('match /products/{productId}/internal/{allPaths=**}'), 'storage.rules missing admin-only internal products path');
  assert.ok(storageRulesSrc.includes('match /products/{productId}/deliverables/{allPaths=**}'), 'storage.rules missing deliverables guard');

  console.log('ALL PHASE 6 CREATIVE PRODUCTS UNIT TESTS PASSED');
}

run();
