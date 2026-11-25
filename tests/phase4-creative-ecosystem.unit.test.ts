import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import JSZip from 'jszip';

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
  const { CREATIVE_CATALOG_SEEDS, STARTER_CREATIVE_DROPS } = await import(
    '../src/data/creativeCatalogSeeds'
  );
  const { MASTER_CREATIVE_TEMPLATES } = await import('../src/data/creativeTemplatesData');
  const { TEMPLATE_FAMILIES } = await import('../src/data/templateFamiliesData');
  const {
    SHARED_PRODUCT_FAMILIES,
    isClientEligibleForProductDownload,
    isClientEligibleForProductView,
    resolveActiveWorkspacePackageIds,
    resolveProductFamily,
  } = await import('../src/lib/creativeProductAccess');
  const { validateProductForPublish } = await import('../src/lib/creativeProducts');
  const {
    isDropEligibleForClient,
    mergeUniqueCollectionProductIds,
    shouldSendSessionAnalyticsEvent,
    splitCurrentAndArchivedDrops,
  } = await import('../src/lib/creativeEcosystem');
  const { packageMultipleProductsZip } = await import('../src/lib/productPackager');
  const { buildProductSpecSheetDataUrl, resolveProductPreviewGallery } = await import(
    '../src/lib/creativeResourcePreviews'
  );
  const { ADMIN_HQ_SECTIONS } = await import('../src/lib/adminHQNavigation');

  console.log('[PHASE 4 TEST 1] Expanded seed catalog, distinct previews, industry & shared utilities');
  assert.ok(
    CREATIVE_CATALOG_SEEDS.length >= 50,
    `Expected >= 50 creative seeds after Phase 4 expansion, found ${CREATIVE_CATALOG_SEEDS.length}`,
  );
  const artistSeeds = CREATIVE_CATALOG_SEEDS.filter(s => s.audience === 'Artist');
  const brandSeeds = CREATIVE_CATALOG_SEEDS.filter(
    s => s.audience === 'Brand & Business' || s.audience === 'Brand' || s.audience === 'Business',
  );
  const sharedSeeds = CREATIVE_CATALOG_SEEDS.filter(s => s.audience === 'Shared');
  assert.ok(artistSeeds.length >= 24, `Expected >= 24 Artist seeds (found ${artistSeeds.length})`);
  assert.ok(brandSeeds.length >= 25, `Expected >= 25 Brand & Business seeds (found ${brandSeeds.length})`);
  assert.ok(sharedSeeds.length >= 4, `Expected >= 4 Shared Utility seeds (found ${sharedSeeds.length})`);
  assert.equal(SHARED_PRODUCT_FAMILIES.length, 1);

  const industryTaggedCount = brandSeeds.filter(s => Boolean(s.industryTag)).length;
  assert.ok(industryTaggedCount >= 6, `Expected >= 6 industry-specific packs (found ${industryTaggedCount})`);

  for (const seed of sharedSeeds) {
    assert.equal(seed.unlockedByDefault, true, `Shared seed ${seed.id} should be unlockedByDefault`);
    assert.equal(seed.instantStudioPackEligible, true, `Shared seed ${seed.id} should support instant pack export`);
    assert.equal(resolveProductFamily(seed), 'Shared Utilities & Studio Guides');
  }

  console.log('[PHASE 4 TEST 2] Unlimited package entitlements (>5 packages unlocked + inactive/expired denied)');
  const twelvePackages = Array.from({ length: 12 }, (_, idx) => `pkg-slot-${idx + 1}`);
  const activeSet = new Set(twelvePackages);
  const resolved = resolveActiveWorkspacePackageIds({
    workspaceId: 'ws-artist-1',
    workspaceStatus: 'Active',
    activePackageIds: twelvePackages,
    activeServicePackageIds: activeSet,
  });
  assert.equal(resolved.length, 12, 'All 12 active service packages must resolve without any 5-item cap');

  const pkg9Product = {
    status: 'Published' as const,
    audience: 'Artist' as const,
    accessType: 'IncludedInPackage' as const,
    assignedWorkspaceIds: [],
    includedPackageIds: ['pkg-slot-9'],
    files: [],
    instantStudioPackEligible: true,
  };
  assert.equal(
    isClientEligibleForProductDownload({
      product: pkg9Product,
      clientBucket: 'Artist',
      workspaceId: 'ws-artist-1',
      workspaceStatus: 'Active',
      activePackageIds: twelvePackages,
      activeServicePackageIds: activeSet,
    }),
    true,
    '9th package product (>5 limit) must unlock cleanly for download',
  );

  // Revoked / expired entitlement or Paused workspace must deny
  assert.equal(
    isClientEligibleForProductDownload({
      product: pkg9Product,
      clientBucket: 'Artist',
      workspaceId: 'ws-artist-1',
      workspaceStatus: 'Paused',
      activePackageIds: twelvePackages,
      activeServicePackageIds: activeSet,
    }),
    false,
    'Paused workspace must not download package products',
  );
  assert.equal(
    isClientEligibleForProductDownload({
      product: pkg9Product,
      clientBucket: 'Artist',
      workspaceId: 'ws-artist-1',
      workspaceStatus: 'Active',
      activePackageIds: twelvePackages,
      activeServicePackageIds: activeSet,
      packageEntitlements: [
        { packageId: 'pkg-slot-9', status: 'Active', expiresAt: '2020-01-01T00:00:00.000Z' },
      ],
      nowIso: '2026-11-25T00:00:00.000Z',
    }),
    false,
    'Expired package entitlement must deny download',
  );

  console.log('[PHASE 4 TEST 3] Shared utility cross-audience access & strict Artist/Brand isolation');
  const sharedUtility = sharedSeeds[0];
  assert.equal(
    isClientEligibleForProductView({
      product: sharedUtility,
      clientBucket: 'Artist',
      workspaceId: 'ws-a',
      workspaceStatus: 'Active',
    }),
    true,
  );
  assert.equal(
    isClientEligibleForProductView({
      product: sharedUtility,
      clientBucket: 'Brand',
      workspaceId: 'ws-b',
      workspaceStatus: 'Active',
    }),
    true,
  );
  assert.equal(
    isClientEligibleForProductView({
      product: artistSeeds[0],
      clientBucket: 'Brand',
      workspaceId: 'ws-b',
      workspaceStatus: 'Active',
    }),
    false,
    'Brand client must not view Artist-only packs',
  );

  console.log('[PHASE 4 TEST 4] Collections dedup, Monthly Drops curation & expiry gates');
  const mergedCol = mergeUniqueCollectionProductIds(['p1', 'p2'], 'p2');
  assert.deepEqual(mergedCol, ['p1', 'p2']);
  const appendedCol = mergeUniqueCollectionProductIds(['p1', 'p2'], 'p3');
  assert.deepEqual(appendedCol, ['p1', 'p2', 'p3']);

  assert.ok(STARTER_CREATIVE_DROPS.length >= 3);
  const allSeedIds = new Set(CREATIVE_CATALOG_SEEDS.map(s => s.id));
  for (const drop of STARTER_CREATIVE_DROPS) {
    assert.ok(drop.productIds.length > 0, `Drop ${drop.id} must link products`);
    for (const pid of drop.productIds) {
      assert.ok(allSeedIds.has(pid), `Drop ${drop.id} references unknown seed ${pid}`);
    }
  }

  const dropSplit = splitCurrentAndArchivedDrops(
    STARTER_CREATIVE_DROPS,
    'Artist',
    new Date('2026-11-25T12:00:00.000Z'),
  );
  assert.ok(dropSplit.currentDrops.length >= 1, 'Current November Artist/Shared drop must surface');
  assert.ok(dropSplit.archivedDrops.length >= 1, 'October archive drop must surface in archive');
  assert.ok(dropSplit.newDropProductIds.size > 0, 'Active drop product IDs should mark New Drop badges');

  assert.equal(
    isDropEligibleForClient(
      { ...STARTER_CREATIVE_DROPS[0], expiresAt: '2026-01-01T00:00:00.000Z' },
      'Artist',
      '2026-11-25T00:00:00.000Z',
    ),
    false,
    'Expired monthly drops must not remain eligible',
  );

  console.log('[PHASE 4 TEST 5] Publish readiness validation gate & Preview Spec Gallery');
  const invalidCases = [
    validateProductForPublish({ title: '', status: 'Published', accessType: 'Free' }),
    validateProductForPublish({
      title: 'Missing Summary',
      summary: '',
      description: 'Desc',
      category: 'Brand Identity',
      previewImageUrl: 'https://example.com/p.jpg',
      deliverablesSummary: ['Guide PDF'],
      instantStudioPackEligible: true,
      accessType: 'Free',
      status: 'Published',
    }),
    validateProductForPublish({
      title: 'Missing Preview',
      summary: 'Summary',
      description: 'Desc',
      category: 'Brand Identity',
      previewImageUrl: '',
      deliverablesSummary: ['Guide PDF'],
      instantStudioPackEligible: true,
      accessType: 'Free',
      status: 'Published',
    }),
    validateProductForPublish({
      title: 'Empty Package Links',
      summary: 'Summary',
      description: 'Desc',
      category: 'Brand Identity',
      previewImageUrl: 'https://example.com/p.jpg',
      deliverablesSummary: ['Guide PDF'],
      instantStudioPackEligible: true,
      accessType: 'IncludedInPackage',
      includedPackageIds: [],
      assignedWorkspaceIds: [],
      status: 'Published',
    }),
    validateProductForPublish({
      title: 'Missing Files & Studio Pack',
      summary: 'Summary',
      description: 'Desc',
      category: 'Brand Identity',
      previewImageUrl: 'https://example.com/p.jpg',
      deliverablesSummary: ['Guide PDF'],
      instantStudioPackEligible: false,
      files: [],
      accessType: 'Free',
      status: 'Published',
    }),
  ];
  for (const res of invalidCases) {
    assert.equal(res.valid, false, 'Incomplete Published product must fail validation');
    assert.ok(res.missingRequirements.length >= 1);
  }

  for (const seed of CREATIVE_CATALOG_SEEDS) {
    const res = validateProductForPublish({
      ...seed,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
      createdBy: 'admin-1',
      updatedBy: 'admin-1',
    });
    assert.equal(
      res.valid,
      true,
      `Seed ${seed.id} failed publish validation: ${res.missingRequirements.join('; ')}`,
    );
  }

  const sampleProduct = {
    ...brandSeeds[0],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  };
  const gallery = resolveProductPreviewGallery(sampleProduct);
  assert.ok(gallery.length >= 2, 'Gallery must contain preview image plus interactive architectural spec sheet');
  const specUrl = buildProductSpecSheetDataUrl(sampleProduct);
  assert.ok(specUrl.startsWith('data:image/svg+xml'));

  console.log('[PHASE 4 TEST 6] Analytics deduplication window, fail-closed verification & Batch ZIP packager');
  assert.equal(shouldSendSessionAnalyticsEvent('view', 'prod-dedup-test', 1000), true);
  assert.equal(shouldSendSessionAnalyticsEvent('view', 'prod-dedup-test', 5000), false, 'Duplicate view inside 10m window must dedupe');
  assert.equal(shouldSendSessionAnalyticsEvent('view', 'prod-dedup-test', 1000 + 11 * 60 * 1000), true, 'View after window expires should record');
  assert.equal(shouldSendSessionAnalyticsEvent('download_success', 'prod-dedup-test', 5000), true, 'Downloads must never be suppressed by view dedup');

  const lockedBrandProduct = {
    ...brandSeeds.find(b => b.id === 'prod-brand-logo-systems-pack')!,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  };
  const sharedFull = {
    ...sharedSeeds[0],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  };
  const artistFreeFull = {
    ...artistSeeds.find(a => a.accessType === 'Free')!,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  };

  const batchResult = await packageMultipleProductsZip({
    products: [artistFreeFull, sharedFull, lockedBrandProduct],
    eligibilityContext: {
      clientBucket: 'Artist',
      workspaceId: 'ws-artist-1',
      workspaceStatus: 'Active',
    },
    verifyServerAccess: async prod => ({
      allowed: prod.id !== sharedFull.id,
      reason: prod.id === sharedFull.id ? 'Server entitlement denied in test' : undefined,
    }),
    workspaceLabel: 'Midnight Studio',
  });
  assert.deepEqual(
    batchResult.includedProductIds,
    [artistFreeFull.id],
    'Batch ZIP must include only items passing BOTH client eligibility and verifyServerAccess',
  );
  assert.deepEqual(
    batchResult.skippedProductIds,
    [sharedFull.id, lockedBrandProduct.id],
    'Batch ZIP must exclude server-denied AND unauthorized cross-audience / locked items',
  );
  const parsedZip = await JSZip.loadAsync(await batchResult.blob.arrayBuffer());
  const manifestText = await parsedZip.file('00_COLLECTION_MANIFEST.txt')!.async('string');
  assert.ok(manifestText.includes('[SKIPPED - SERVER VERIFICATION DENIED]'));
  assert.ok(manifestText.includes('[SKIPPED - ENTITLEMENT REQUIRED]'));

  console.log('[PHASE 4 TEST 7] Admin HQ 8-pillar structure preserved & security boundaries intact');
  assert.equal(ADMIN_HQ_SECTIONS.length, 8, 'Admin HQ must preserve exactly 8 top-level pillars');

  const rootDir = process.cwd();
  const clientHubSrc = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientCreativeHub.tsx'), 'utf8');
  const ecosystemSrc = fs.readFileSync(path.join(rootDir, 'src/lib/creativeEcosystem.ts'), 'utf8');
  const functionsSrc = fs.readFileSync(path.join(rootDir, 'functions/src/index.ts'), 'utf8');

  assert.ok(!clientHubSrc.includes('.slice(0, 5)'), 'ClientCreativeHub must not cap contracted packages at 5');
  assert.ok(!clientHubSrc.includes('DesignCanvasEditor'), 'ClientCreativeHub must not reference DesignCanvasEditor');
  assert.ok(!clientHubSrc.includes('snap-x'), 'ClientCreativeHub must not use horizontal snap carousels');
  assert.ok(clientHubSrc.includes('verifyServerAccess:'), 'ClientCreativeHub batch ZIP must verify server access per item');
  assert.ok(ecosystemSrc.includes('isOfflineTransportError && isFreeEligible'), 'verifyResourceDownloadAccess must never fail open on protected or not-found errors');
  assert.ok(functionsSrc.includes('isApprovedForClient === true'), 'verifyCreativeResourceAccess must recognize isApprovedForClient deliverables');

  const masterIds = new Set(MASTER_CREATIVE_TEMPLATES.map(t => t.id));
  const famIds = new Set(TEMPLATE_FAMILIES.map(f => f.id));
  for (const seed of CREATIVE_CATALOG_SEEDS) {
    assert.ok(
      seed.linkedTemplateId && (masterIds.has(seed.linkedTemplateId) || famIds.has(seed.linkedTemplateId)),
      `Seed ${seed.id} linkedTemplateId ${seed.linkedTemplateId} must resolve cleanly`,
    );
  }

  console.log('ALL PHASE 4 CREATIVE RESOURCE ECOSYSTEM TESTS PASSED');
  process.exit(0);
}

run().catch(err => {
  console.error('Phase 4 test failure:', err);
  process.exit(1);
});
