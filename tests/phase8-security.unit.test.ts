import assert from 'node:assert/strict';
import { register } from 'node:module';
import type { CreativeProduct, CreativeProductDeliverableFile } from '../src/types/creativeProduct';

const assetLoaderSource = `
export async function load(url, context, nextLoad) {
  if (/\\.(jpg|jpeg|png|webp|svg)(\\?.*)?$/i.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default ' + JSON.stringify('/assets/' + url.split('/').pop()) + ';',
    };
  }
  return nextLoad(url, context);
}
`;
register(`data:text/javascript,${encodeURIComponent(assetLoaderSource)}`);

async function run() {
  const { hasPlatformAdminRole, isAdminRecordActive } = await import('../src/lib/firebaseAuth');
  const {
    matchesProductAudience,
    resolveClientAudienceBucket,
    isClientEligibleForProductView,
    isClientEligibleForProductDownload,
    getApprovedDownloadableFiles,
    getProductDownloadStatusSummary,
  } = await import('../src/lib/creativeProductAccess');
  const {
    ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES,
    MAX_PRODUCT_FILE_BYTES,
    resolveUploadMimeType,
    downloadProductStorageFile,
    deleteProductDeliverableStorageFile,
  } = await import('../src/lib/creativeProducts');
  const { CREATIVE_CATALOG_SEEDS } = await import('../src/data/creativeCatalogSeeds');

  console.log('----------------------------------------------------');
  console.log('KEEDOHUB PHASE 8: SECURITY & DATA INTEGRITY UNIT TESTS');
  console.log('----------------------------------------------------');

  // =========================================================================
  // 1. ROLE PRIVILEGE ESCALATION & ADMIN AUTHORIZATION GATES
  // =========================================================================
  console.log('[TEST 1] Role privilege escalation & platform admin verification');
  
  // Platform admin role variants allowed
  assert.equal(hasPlatformAdminRole({ role: 'PlatformAdmin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'platformadmin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'Platform Admin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'SuperAdmin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'super admin' }), true);
  assert.equal(hasPlatformAdminRole({ Role: 'SUPER ADMIN' }), true);

  // Unauthorized roles strictly denied
  const unauthorizedRoles = ['Client', 'Artist', 'Brand', 'Company', 'User', 'Admin', 'Operator', 'Manager', 'Editor', 'Viewer'];
  for (const role of unauthorizedRoles) {
    assert.equal(hasPlatformAdminRole({ role }), false, `Role "${role}" must NOT have platform admin privileges`);
    assert.equal(hasPlatformAdminRole({ Role: role }), false, `Role "${role}" capitalized must NOT have platform admin privileges`);
  }
  assert.equal(hasPlatformAdminRole({}), false);
  assert.equal(hasPlatformAdminRole(null as any), false);

  // Active status enforcement
  const fakeAdminDoc = (data: Record<string, unknown>, exists = true) => ({
    exists: () => exists,
    data: () => data,
  } as any);

  assert.equal(isAdminRecordActive(fakeAdminDoc({}, false)), false, 'Non-existent admin document must fail');
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', status: 'Active' })), true);
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', status: 'Suspended' })), false, 'Suspended admin must fail');
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', status: 'revoked' })), false, 'Revoked admin must fail');
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', suspended: true })), false, 'suspended=true must fail');
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', revoked: true })), false, 'revoked=true must fail');
  assert.equal(isAdminRecordActive(fakeAdminDoc({ role: 'PlatformAdmin', active: false })), false, 'active=false must fail');

  // =========================================================================
  // 2. AUDIENCE BUCKET RESOLUTION & AUDIENCE ISOLATION
  // =========================================================================
  console.log('[TEST 2] Client audience bucket resolution & strict isolation');

  assert.equal(resolveClientAudienceBucket('Artist'), 'Artist');
  assert.equal(resolveClientAudienceBucket('Brand'), 'Brand');
  assert.equal(resolveClientAudienceBucket('Company'), 'Business');
  assert.equal(resolveClientAudienceBucket(undefined, 'Artist'), 'Artist');
  assert.equal(resolveClientAudienceBucket(undefined, 'Business'), 'Business');
  assert.equal(resolveClientAudienceBucket(undefined, 'Enterprise'), 'Business');

  // Artist cannot view Brand or Business products
  assert.equal(matchesProductAudience('Artist', 'Artist'), true);
  assert.equal(matchesProductAudience('Brand', 'Artist'), false, 'Artist must never match Brand product');
  assert.equal(matchesProductAudience('Business', 'Artist'), false, 'Artist must never match Business product');
  assert.equal(matchesProductAudience('Brand & Business', 'Artist'), false, 'Artist must never match Brand & Business product');
  assert.equal(matchesProductAudience('Shared', 'Artist'), true);

  // Brand cannot view Artist products
  assert.equal(matchesProductAudience('Artist', 'Brand'), false, 'Brand must never match Artist product');
  assert.equal(matchesProductAudience('Brand', 'Brand'), true);
  assert.equal(matchesProductAudience('Brand & Business', 'Brand'), true);
  assert.equal(matchesProductAudience('Shared', 'Brand'), true);

  // Business cannot view Artist products
  assert.equal(matchesProductAudience('Artist', 'Business'), false, 'Business must never match Artist product');
  assert.equal(matchesProductAudience('Business', 'Business'), true);
  assert.equal(matchesProductAudience('Brand & Business', 'Business'), true);
  assert.equal(matchesProductAudience('Shared', 'Business'), true);

  // =========================================================================
  // 3. DRAFT & ARCHIVED PRODUCT ISOLATION
  // =========================================================================
  console.log('[TEST 3] Draft & Archived product isolation (strictly inaccessible to clients)');

  const mockProduct = (overrides: Partial<CreativeProduct>): CreativeProduct => ({
    id: 'prod-test-01',
    title: 'Test Creative Pack',
    slug: 'test-creative-pack',
    audience: 'Artist',
    productFamily: 'Streaming Packs',
    category: 'Streaming Platform Packs',
    summary: 'Test summary',
    description: 'Test description',
    status: 'Published',
    accessType: 'Free',
    assignedWorkspaceIds: [],
    supportedFormats: ['PNG', 'PSD'],
    deliverablesSummary: ['Master graphic'],
    dimensionSpecs: ['3000 x 3000 px'],
    previewImageUrl: '/test.png',
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides,
  });

  // Draft product: view and download MUST return false
  const draftProd = mockProduct({ status: 'Draft' });
  assert.equal(isClientEligibleForProductView({ product: draftProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), false);
  assert.equal(isClientEligibleForProductDownload({ product: draftProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), false);

  // Archived product: view and download MUST return false
  const archivedProd = mockProduct({ status: 'Archived' });
  assert.equal(isClientEligibleForProductView({ product: archivedProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), false);
  assert.equal(isClientEligibleForProductDownload({ product: archivedProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), false);

  // =========================================================================
  // 4. ACCESS TYPE GATING & MULTI-TENANT CROSS-WORKSPACE ISOLATION
  // =========================================================================
  console.log('[TEST 4] Product access-type gating & cross-workspace isolation');

  // A. Free products
  const freeProd = mockProduct({ accessType: 'Free' });
  assert.equal(isClientEligibleForProductView({ product: freeProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), true);
  assert.equal(isClientEligibleForProductDownload({ product: freeProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1' }), true);

  // B. IncludedInPackage products
  const pkgProd = mockProduct({ accessType: 'IncludedInPackage', includedPackageIds: ['pkg-gold', 'pkg-platinum'] });
  // Client workspace without contracted package
  assert.equal(isClientEligibleForProductView({ product: pkgProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1', contractedPackageIds: [] }), false);
  assert.equal(isClientEligibleForProductDownload({ product: pkgProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1', contractedPackageIds: [] }), false);
  // Client workspace WITH contracted package
  assert.equal(isClientEligibleForProductView({ product: pkgProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1', contractedPackageIds: ['pkg-gold'] }), true);
  assert.equal(isClientEligibleForProductDownload({ product: pkgProd, clientBucket: 'Artist', workspaceId: 'ws-artist-1', contractedPackageIds: ['pkg-gold'] }), true);

  // C. AdminAssigned products (cross-tenant security)
  const assignedProd = mockProduct({ accessType: 'AdminAssigned', assignedWorkspaceIds: ['workspace-alpha'] });
  // Workspace Alpha (authorized assignee)
  assert.equal(isClientEligibleForProductView({ product: assignedProd, clientBucket: 'Artist', workspaceId: 'workspace-alpha' }), true);
  assert.equal(isClientEligibleForProductDownload({ product: assignedProd, clientBucket: 'Artist', workspaceId: 'workspace-alpha' }), true);
  // Workspace Beta (unauthorized third-party workspace - MUST be denied)
  assert.equal(isClientEligibleForProductView({ product: assignedProd, clientBucket: 'Artist', workspaceId: 'workspace-beta' }), false);
  assert.equal(isClientEligibleForProductDownload({ product: assignedProd, clientBucket: 'Artist', workspaceId: 'workspace-beta' }), false);

  // D. RequestRequired products (browse allowed, download denied until assigned)
  const reqProd = mockProduct({ accessType: 'RequestRequired', assignedWorkspaceIds: [] });
  // Browse allowed to matching audience
  assert.equal(isClientEligibleForProductView({ product: reqProd, clientBucket: 'Artist', workspaceId: 'workspace-alpha' }), true);
  // Download blocked
  assert.equal(isClientEligibleForProductDownload({ product: reqProd, clientBucket: 'Artist', workspaceId: 'workspace-alpha' }), false);
  // When assigned by Admin HQ to workspace-alpha, download unlocked
  const reqAssignedProd = mockProduct({ accessType: 'RequestRequired', assignedWorkspaceIds: ['workspace-alpha'] });
  assert.equal(isClientEligibleForProductDownload({ product: reqAssignedProd, clientBucket: 'Artist', workspaceId: 'workspace-alpha' }), true);
  assert.equal(isClientEligibleForProductDownload({ product: reqAssignedProd, clientBucket: 'Artist', workspaceId: 'workspace-beta' }), false);

  // =========================================================================
  // 5. STORAGE DELIVERABLE FILE HANDLING & PATH INTEGRITY
  // =========================================================================
  console.log('[TEST 5] Storage deliverable file handling & path integrity');

  const files: CreativeProductDeliverableFile[] = [
    {
      id: 'f1',
      label: 'Approved Master PNG',
      fileName: 'master.png',
      fileFormat: 'PNG',
      mimeType: 'image/png',
      storagePath: 'products/prod-01/deliverables/f1/master.png',
      fileSizeBytes: 2048576,
      fileSizeLabel: '2.0 MB',
      version: 'v1.0',
      isApprovedForClient: true,
      createdAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
    {
      id: 'f2-internal',
      label: 'Internal Canvas Working File',
      fileName: 'internal-source.json',
      fileFormat: 'OTHER',
      mimeType: 'application/json',
      storagePath: 'products/prod-01/internal/f2/internal-source.json',
      fileSizeBytes: 1024,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: false,
      createdAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
    {
      id: 'f3-unapproved',
      label: 'Unapproved Draft Deliverable',
      fileName: 'draft.psd',
      fileFormat: 'PSD',
      mimeType: 'image/vnd.adobe.photoshop',
      storagePath: 'products/prod-01/deliverables/f3/draft.psd',
      fileSizeBytes: 5242880,
      fileSizeLabel: '5.0 MB',
      version: 'v1.0',
      isApprovedForClient: false,
      createdAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
    {
      id: 'f4-traversal',
      label: 'Malicious Traversal Path',
      fileName: 'exploit.zip',
      fileFormat: 'ZIP',
      mimeType: 'application/zip',
      storagePath: 'products/prod-01/deliverables/../../workspaces/secret/exploit.zip',
      fileSizeBytes: 1024,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: true,
      createdAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
  ];

  // getApprovedDownloadableFiles filter test
  const clientVisible = getApprovedDownloadableFiles(files);
  assert.equal(clientVisible.length, 1, 'Only genuine approved non-internal deliverables must be returned');
  assert.equal(clientVisible[0].id, 'f1');
  assert.equal(clientVisible[0].fileName, 'master.png');

  // Path traversal prevention in downloadProductStorageFile
  await assert.rejects(
    async () => {
      await downloadProductStorageFile({ storagePath: 'products/p1/../../etc/passwd', fileName: 'test.png' });
    },
    /Unauthorized or invalid deliverable file path/,
    'Path traversal with .. must be rejected'
  );

  await assert.rejects(
    async () => {
      await downloadProductStorageFile({ storagePath: 'products\\p1\\deliverables\\test.png', fileName: 'test.png' });
    },
    /Unauthorized or invalid deliverable file path|This file does not have a valid storage location/,
    'Path with backslash must be rejected'
  );

  await assert.rejects(
    async () => {
      await downloadProductStorageFile({ storagePath: 'products/p1/internal/confidential.psd', fileName: 'confidential.psd' });
    },
    /Unauthorized or invalid deliverable file path/,
    'Internal path download must be rejected'
  );

  await assert.rejects(
    async () => {
      await downloadProductStorageFile({ storagePath: 'workspaces/w1/file.png', fileName: 'file.png' });
    },
    /This file does not have a valid storage location/,
    'Non-product storage paths must be rejected'
  );

  // MIME type and volumetric boundary checks
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('image/png'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('image/jpeg'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('application/pdf'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('application/zip'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('image/vnd.adobe.photoshop'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('font/otf'));
  assert.ok(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('audio/wav'));

  // Disallowed MIME types
  assert.equal(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('application/x-msdownload'), false);
  assert.equal(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('application/x-sh'), false);
  assert.equal(ALLOWED_PRODUCT_DELIVERABLE_MIME_TYPES.has('text/javascript'), false);

  assert.equal(MAX_PRODUCT_FILE_BYTES, 50 * 1024 * 1024, 'Max deliverable size must be 50 MB');

  // Clean deletion function safety
  await deleteProductDeliverableStorageFile('products/p1/deliverables/../../hack'); // Must safely early-return without executing delete
  await deleteProductDeliverableStorageFile(''); // Must safely early-return

  // =========================================================================
  // 6. ZERO SEED FABRICATION & REAL PRODUCTION INTEGRITY
  // =========================================================================
  console.log('[TEST 6] Seed catalog integrity check (43 seeds)');
  assert.equal(CREATIVE_CATALOG_SEEDS.length, 43, 'Seed catalog must maintain all 43 rich creative products');
  for (const seed of CREATIVE_CATALOG_SEEDS) {
    assert.equal(seed.status, 'Published');
    assert.ok(['Artist', 'Brand', 'Business', 'Brand & Business', 'Shared'].includes(seed.audience));
    assert.equal(seed.files.length, 0, 'Seeds must not fabricate fake Cloud Storage download URLs');
  }

  console.log('----------------------------------------------------');
  console.log('ALL PHASE 8 SECURITY & DATA INTEGRITY UNIT TESTS PASSED');
  console.log('----------------------------------------------------');
  process.exit(0);
}

run().catch((err) => {
  console.error('Phase 8 security test failure:', err);
  process.exit(1);
});
