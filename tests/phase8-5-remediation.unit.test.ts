import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

function makeProduct(overrides: Partial<CreativeProduct> = {}): CreativeProduct {
  return {
    id: 'prod-85-01',
    title: 'Phase 8.5 Studio Resource',
    slug: 'phase-85-studio-resource',
    audience: 'Artist',
    productFamily: 'Streaming & Music Platform Assets',
    category: 'Streaming Platform Packs',
    summary: 'Studio pack summary',
    description: 'Studio pack full description',
    status: 'Published',
    accessType: 'IncludedInPackage',
    assignedWorkspaceIds: [],
    includedPackageIds: ['pkg-music-promo-deluxe'],
    linkedServiceCategory: 'Streaming Pack',
    version: 'v1.0',
    supportedFormats: ['PNG', 'PDF'],
    deliverablesSummary: ['Master pack'],
    dimensionSpecs: [],
    previewImageUrl: '/preview.jpg',
    files: [
      {
        id: 'file-approved-1',
        label: 'Approved Release Kit',
        fileName: 'release-kit.png',
        fileFormat: 'PNG',
        mimeType: 'image/png',
        storagePath: 'products/prod-85-01/deliverables/file-approved-1/release-kit.png',
        fileSizeBytes: 102400,
        fileSizeLabel: '100.0 KB',
        version: 'v1.0',
        isApprovedForClient: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        uploadedBy: 'admin-1',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
    ...overrides,
  };
}

async function run() {
  const {
    getApprovedDownloadableFiles,
    getProductDownloadStatusSummary,
    isClientEligibleForProductDownload,
    isClientEligibleForProductView,
    resolveActiveWorkspacePackageIds,
    sanitizeIdList,
  } = await import('../src/lib/creativeProductAccess');
  const {
    downloadProductStorageFile,
    saveCreativeProduct,
  } = await import('../src/lib/creativeProducts');
  const { INITIAL_SERVICE_PACKAGES } = await import('../src/data/initialData');

  const activeCatalogIds = new Set(INITIAL_SERVICE_PACKAGES.filter(p => p.isActive).map(p => p.id));

  console.log('------------------------------------------------------------');
  console.log('KEEDOHUB PHASE 8.5: INCLUDED-IN-PACKAGE REMEDIATION TESTS');
  console.log('------------------------------------------------------------');

  // =========================================================================
  // 1. NEGATIVE CASES FOR IncludedInPackage
  // =========================================================================
  console.log('[TEST 1] IncludedInPackage negative cases (empty, missing, unknown, inactive, cross-workspace)');

  // 1a. Missing package list (undefined)
  const missingPkgList = makeProduct({ accessType: 'IncludedInPackage', includedPackageIds: undefined });
  assert.equal(
    isClientEligibleForProductView({
      product: missingPkgList,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'IncludedInPackage with missing includedPackageIds must be denied view',
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: missingPkgList,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'IncludedInPackage with missing includedPackageIds must be denied download',
  );
  const missingSummary = getProductDownloadStatusSummary({
    product: missingPkgList,
    clientBucket: 'Artist',
    workspaceId: 'ws-sariyah-artist',
    workspaceStatus: 'Active',
    contractedPackageIds: ['pkg-music-promo-deluxe'],
    activeServicePackageIds: activeCatalogIds,
  });
  assert.equal(missingSummary.canDownload, false);
  assert.equal(missingSummary.state, 'access-restricted');
  assert.notEqual(missingSummary.state, 'download-ready');

  // 1b. Empty package list []
  const emptyPkgList = makeProduct({ accessType: 'IncludedInPackage', includedPackageIds: [] });
  assert.equal(
    isClientEligibleForProductView({
      product: emptyPkgList,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'IncludedInPackage with empty includedPackageIds [] must NOT act as public access',
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: emptyPkgList,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
  );

  // 1c. Malformed package IDs on product or workspace
  assert.deepEqual(sanitizeIdList(['', '   ', '../etc', null, 123, 'pkg-valid_1']), ['pkg-valid_1']);
  const malformedPkgProd = makeProduct({
    accessType: 'IncludedInPackage',
    includedPackageIds: ['', '   ', '../exploit'] as unknown as string[],
  });
  assert.equal(
    isClientEligibleForProductDownload({
      product: malformedPkgProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['', 'pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'Malformed package IDs must never grant access',
  );

  // 1d. Unknown package ID (not in workspace AND/OR not in active services catalog)
  const unknownPkgProd = makeProduct({
    accessType: 'IncludedInPackage',
    includedPackageIds: ['pkg-unknown-nonexistent'],
  });
  assert.equal(
    isClientEligibleForProductView({
      product: unknownPkgProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'Unknown package ID not held by workspace must be denied',
  );
  // Even if workspace somehow carried the bogus/unknown ID not present in active service catalog:
  assert.equal(
    isClientEligibleForProductDownload({
      product: unknownPkgProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-unknown-nonexistent'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'Unknown package ID absent from activeServicePackageIds must be denied',
  );

  // 1e. Package belonging to another workspace
  const brandPkgProd = makeProduct({
    audience: 'Brand & Business',
    accessType: 'IncludedInPackage',
    includedPackageIds: ['pkg-brand-monolith'],
  });
  assert.equal(
    isClientEligibleForProductDownload({
      product: brandPkgProd,
      clientBucket: 'Brand',
      workspaceId: 'ws-other-brand',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-biz-corporate'], // holds a different package than ws-apex-brand
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'Package belonging to another workspace must be denied',
  );

  // 1f. Inactive / deactivated / expired package entitlement & paused workspace
  const deactivatedCatalog = new Set(
    INITIAL_SERVICE_PACKAGES.filter(p => p.isActive && p.id !== 'pkg-music-promo-deluxe').map(p => p.id),
  );
  const validDeluxProd = makeProduct({
    accessType: 'IncludedInPackage',
    includedPackageIds: ['pkg-music-promo-deluxe'],
  });
  assert.equal(
    isClientEligibleForProductDownload({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: deactivatedCatalog,
    }),
    false,
    'Deactivated ServicePackage (isActive=false) must deny IncludedInPackage access',
  );

  // Explicit packageEntitlements status / expiry checks
  assert.equal(
    isClientEligibleForProductDownload({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
      packageEntitlements: [{ packageId: 'pkg-music-promo-deluxe', status: 'Expired' }],
    }),
    false,
    'Expired package entitlement status must deny access',
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
      packageEntitlements: [
        { packageId: 'pkg-music-promo-deluxe', status: 'Active', expiresAt: '2025-01-01T00:00:00.000Z' },
      ],
      nowIso: '2026-11-21T00:00:00.000Z',
    }),
    false,
    'Past expiresAt timestamp must deny access',
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Paused',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
    'Paused workspace status must deny access',
  );

  // =========================================================================
  // 2. POSITIVE CASES: VALID PACKAGE ENTITLEMENT & VALID ADMIN ASSIGNMENT
  // =========================================================================
  console.log('[TEST 2] Positive cases (valid active package entitlement & explicit Admin assignment)');

  assert.deepEqual(
    resolveActiveWorkspacePackageIds({
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe', 'pkg-unknown'],
      activeServicePackageIds: activeCatalogIds,
    }),
    ['pkg-music-promo-deluxe'],
  );

  assert.equal(
    isClientEligibleForProductView({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
      packageEntitlements: [
        { packageId: 'pkg-music-promo-deluxe', status: 'Active', expiresAt: '2027-12-31T23:59:59.000Z' },
      ],
      nowIso: '2026-11-21T00:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: validDeluxProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-sariyah-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: ['pkg-music-promo-deluxe'],
      activeServicePackageIds: activeCatalogIds,
    }),
    true,
  );
  const pkgReadySummary = getProductDownloadStatusSummary({
    product: validDeluxProd,
    clientBucket: 'Artist',
    workspaceId: 'ws-sariyah-artist',
    workspaceStatus: 'Active',
    contractedPackageIds: ['pkg-music-promo-deluxe'],
    activeServicePackageIds: activeCatalogIds,
  });
  assert.equal(pkgReadySummary.state, 'download-ready');
  assert.equal(pkgReadySummary.canDownload, true);
  assert.equal(pkgReadySummary.approvedFilesCount, 1);

  // Valid explicit Admin assignment overrides package requirement only for the assigned open workspace
  const pkgAssignedProd = makeProduct({
    accessType: 'IncludedInPackage',
    includedPackageIds: ['pkg-album-rollout'],
    assignedWorkspaceIds: ['ws-vip-artist'],
  });
  assert.equal(
    isClientEligibleForProductDownload({
      product: pkgAssignedProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-vip-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: [],
      activeServicePackageIds: activeCatalogIds,
    }),
    true,
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: pkgAssignedProd,
      clientBucket: 'Artist',
      workspaceId: 'ws-other-artist',
      workspaceStatus: 'Active',
      contractedPackageIds: [],
      activeServicePackageIds: activeCatalogIds,
    }),
    false,
  );

  // =========================================================================
  // 3. OTHER ACCESS MODES & STATUS ISOLATION
  // =========================================================================
  console.log('[TEST 3] Free, AdminAssigned, RequestRequired, Draft & Archived gates');

  const adminAssigned = makeProduct({
    accessType: 'AdminAssigned',
    assignedWorkspaceIds: ['ws-vip-artist'],
    includedPackageIds: [],
  });
  assert.equal(
    isClientEligibleForProductDownload({
      product: adminAssigned,
      clientBucket: 'Artist',
      workspaceId: 'ws-wrong-artist',
      workspaceStatus: 'Active',
    }),
    false,
  );
  const wrongAssignedSummary = getProductDownloadStatusSummary({
    product: adminAssigned,
    clientBucket: 'Artist',
    workspaceId: 'ws-wrong-artist',
    workspaceStatus: 'Active',
  });
  assert.equal(wrongAssignedSummary.state, 'access-restricted');
  assert.equal(wrongAssignedSummary.canDownload, false);
  assert.notEqual(wrongAssignedSummary.badgeLabel, 'Assigned to Workspace');

  const requestReq = makeProduct({
    accessType: 'RequestRequired',
    assignedWorkspaceIds: [],
    includedPackageIds: [],
  });
  assert.equal(
    isClientEligibleForProductView({ product: requestReq, clientBucket: 'Artist', workspaceId: 'ws-a', workspaceStatus: 'Active' }),
    true,
  );
  assert.equal(
    isClientEligibleForProductDownload({ product: requestReq, clientBucket: 'Artist', workspaceId: 'ws-a', workspaceStatus: 'Active' }),
    false,
  );
  const reqSummary = getProductDownloadStatusSummary({
    product: requestReq,
    clientBucket: 'Artist',
    workspaceId: 'ws-a',
    workspaceStatus: 'Active',
  });
  assert.equal(reqSummary.state, 'request-required');
  assert.equal(reqSummary.canDownload, false);
  assert.equal(reqSummary.approvedFilesCount, 0);

  const freeProd = makeProduct({ accessType: 'Free', includedPackageIds: [], assignedWorkspaceIds: [] });
  assert.equal(
    isClientEligibleForProductDownload({ product: freeProd, clientBucket: 'Artist', workspaceId: 'ws-a', workspaceStatus: 'Active' }),
    true,
  );

  // Draft and Archived stay inaccessible even with valid package and assignment
  for (const badStatus of ['Draft', 'Archived'] as const) {
    const hiddenProd = makeProduct({
      status: badStatus,
      accessType: 'IncludedInPackage',
      includedPackageIds: ['pkg-music-promo-deluxe'],
      assignedWorkspaceIds: ['ws-sariyah-artist'],
    });
    assert.equal(
      isClientEligibleForProductView({
        product: hiddenProd,
        clientBucket: 'Artist',
        workspaceId: 'ws-sariyah-artist',
        workspaceStatus: 'Active',
        contractedPackageIds: ['pkg-music-promo-deluxe'],
        activeServicePackageIds: activeCatalogIds,
      }),
      false,
    );
    assert.equal(
      isClientEligibleForProductDownload({
        product: hiddenProd,
        clientBucket: 'Artist',
        workspaceId: 'ws-sariyah-artist',
        workspaceStatus: 'Active',
        contractedPackageIds: ['pkg-music-promo-deluxe'],
        activeServicePackageIds: activeCatalogIds,
      }),
      false,
    );
  }

  // =========================================================================
  // 4. STORAGE DELIVERABLE SECURITY (UNAPPROVED & INTERNAL FILES BLOCKED)
  // =========================================================================
  console.log('[TEST 4] Unapproved, internal & cross-workspace storage path blocks');

  const mixedFiles: CreativeProductDeliverableFile[] = [
    {
      id: 'f-ok',
      label: 'Client Ready',
      fileName: 'ready.png',
      fileFormat: 'PNG',
      mimeType: 'image/png',
      storagePath: 'products/p1/deliverables/f-ok/ready.png',
      fileSizeBytes: 1000,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      uploadedBy: 'admin',
    },
    {
      id: 'f-unapproved',
      label: 'Internal Staging File',
      fileName: 'staging.png',
      fileFormat: 'PNG',
      mimeType: 'image/png',
      storagePath: 'products/p1/deliverables/f-unapproved/staging.png',
      fileSizeBytes: 1000,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      uploadedBy: 'admin',
    },
    {
      id: 'f-internal',
      label: 'Internal Source PSD',
      fileName: 'master.psd',
      fileFormat: 'PSD',
      mimeType: 'image/vnd.adobe.photoshop',
      storagePath: 'products/p1/internal/f-internal/master.psd',
      fileSizeBytes: 1000,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      uploadedBy: 'admin',
    },
    {
      id: 'f-preview-spoof',
      label: 'Preview folder spoof',
      fileName: 'preview.png',
      fileFormat: 'PNG',
      mimeType: 'image/png',
      storagePath: 'products/p1/previews/preview.png',
      fileSizeBytes: 1000,
      fileSizeLabel: '1 KB',
      version: 'v1.0',
      isApprovedForClient: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      uploadedBy: 'admin',
    },
  ];
  assert.deepEqual(getApprovedDownloadableFiles(mixedFiles).map(f => f.id), ['f-ok']);

  await assert.rejects(
    async () =>
      downloadProductStorageFile({
        storagePath: 'products/p1/deliverables/f-unapproved/staging.png',
        fileName: 'staging.png',
        isApprovedForClient: false,
      }),
    /not approved for client download/,
  );

  await assert.rejects(
    async () =>
      downloadProductStorageFile({
        storagePath: 'products/p1/internal/f-internal/master.psd',
        fileName: 'master.psd',
      }),
    /Unauthorized or invalid deliverable file path/,
  );

  // =========================================================================
  // 5. PERSISTENCE GUARD + RULES & CLIENT HUB RECONCILIATION
  // =========================================================================
  console.log('[TEST 5] Persistence validation & Firestore/Storage/UI parity verification');

  await assert.rejects(
    async () =>
      saveCreativeProduct({
        id: 'prod-invalid-pkg',
        title: 'Broken Package Product',
        audience: 'Artist',
        category: 'Streaming Platform Packs',
        summary: 'Test',
        description: 'Test',
        status: 'Published',
        accessType: 'IncludedInPackage',
        assignedWorkspaceIds: [],
        includedPackageIds: [],
        linkedServiceCategory: 'Streaming Pack',
        version: 'v1.0',
        supportedFormats: ['PNG'],
        deliverablesSummary: [],
        dimensionSpecs: [],
        previewImageUrl: '/preview.jpg',
        files: [],
        createdBy: 'admin',
        updatedBy: 'admin',
      }),
    /Use Free access mode/,
    'Publishing an IncludedInPackage product without packages or assigned workspaces must be rejected',
  );

  const rootDir = process.cwd();
  const firestoreRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  const storageRules = fs.readFileSync(path.join(rootDir, 'storage.rules'), 'utf8');
  const clientHub = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientCreativeHub.tsx'), 'utf8');

  // Verify old bypasses are completely absent
  assert.ok(
    !firestoreRules.includes("accessType in ['Free', 'IncludedInPackage', 'RequestRequired']"),
    'firestore.rules must NOT include IncludedInPackage in open client read branch',
  );
  assert.ok(
    !storageRules.includes("accessType in ['Free', 'IncludedInPackage', 'RequestRequired']"),
    'storage.rules must NOT include IncludedInPackage in open preview branch',
  );
  assert.ok(
    !storageRules.includes('includedPackageIds.size() == 0'),
    'storage.rules must NOT treat empty includedPackageIds as open access',
  );
  assert.ok(
    firestoreRules.includes('clientHasPackageEntitlementForProduct(resource.data.includedPackageIds)') &&
      firestoreRules.includes('isServicePackageActive('),
    'firestore.rules must enforce active service package entitlement',
  );
  assert.ok(
    storageRules.includes('clientHasActivePackageForProduct(productId)') &&
      storageRules.includes('isServicePackageActive('),
    'storage.rules must enforce active service package entitlement',
  );
  assert.ok(
    !clientHub.includes("where('accessType', 'in', ['Free', 'IncludedInPackage', 'RequestRequired'])"),
    'ClientCreativeHub must NOT query IncludedInPackage without contracted package IDs',
  );
  assert.ok(
    clientHub.includes("where('accessType', 'in', ['Free', 'RequestRequired'])") &&
      clientHub.includes("where('includedPackageIds', 'array-contains', pkgId)"),
    'ClientCreativeHub must align queries with hardened firestore.rules',
  );

  console.log('------------------------------------------------------------');
  console.log('ALL PHASE 8.5 SECURITY REMEDIATION TESTS PASSED');
  console.log('------------------------------------------------------------');
  process.exit(0);
}

run().catch(err => {
  console.error('Phase 8.5 remediation test failed:', err);
  process.exit(1);
});
