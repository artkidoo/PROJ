import assert from 'node:assert/strict';
import {
  buildBrandProductionPrefill,
  buildClientCanvasDesign,
  buildClientWorkspaceCanvasAssetMetadata,
  buildReleaseProductionPrefill,
  getRequestCategoriesForExperience,
  resolveClientExperience,
  validatePersonalAccountUpdate,
} from '../src/lib/clientOS';
import { isInternalStoragePath } from '../src/lib/assetSecurity';
import type { Workspace } from '../src/types';

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws-artist-1',
    name: 'Kaelen Ross',
    type: 'Artist',
    clientCategory: 'artist',
    ownerId: 'user-1',
    status: 'Active',
    description: 'Music workspace',
    contactEmail: 'kaelen@example.com',
    brand: {
      name: 'Kaelen Ross',
      tagline: 'Sound & Vision',
      primaryColor: '#FF1E1E',
      secondaryColor: '#0A0A0A',
      accentColor: '#F59E0B',
      typography: {
        displayFont: 'Syne',
        bodyFont: 'Plus Jakarta Sans',
      },
      logoUrl: '',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function run() {
  // 1. Artist experience resolution & unique tab IDs
  const artistExp = resolveClientExperience('Artist', 'Artist');
  assert.equal(artistExp.osMode, 'artist');
  assert.equal(artistExp.osTitle, 'Artist OS');
  assert.equal(artistExp.isArtist, true);
  assert.equal(artistExp.isBrandOrCompany, false);

  const artistIds = artistExp.navGroups.flatMap(g => g.items.map(i => i.id));
  assert.equal(new Set(artistIds).size, artistIds.length, 'Artist nav tab IDs must be strictly unique');
  for (const requiredId of ['overview', 'projects', 'requests', 'deliverables', 'updates', 'artist-profile', 'releases', 'content', 'assets', 'account']) {
    assert.ok(artistIds.includes(requiredId as typeof artistIds[number]), `Artist OS missing tab ${requiredId}`);
  }
  assert.ok(!artistIds.includes('brand'), 'Artist OS must not expose Brand Identity tab');
  assert.ok(!artistIds.includes('documents'), 'Artist OS must not expose Brand Business Documents tab');

  // 2. Brand experience resolution & isolation from Artist-only features
  const brandExp = resolveClientExperience('Brand', 'Brand');
  assert.equal(brandExp.osMode, 'brand');
  assert.equal(brandExp.osTitle, 'Brand OS');
  assert.equal(brandExp.isArtist, false);
  assert.equal(brandExp.isBrandOrCompany, true);

  const brandIds = brandExp.navGroups.flatMap(g => g.items.map(i => i.id));
  assert.equal(new Set(brandIds).size, brandIds.length, 'Brand nav tab IDs must be strictly unique');
  for (const requiredId of ['overview', 'projects', 'requests', 'deliverables', 'updates', 'brand', 'content', 'documents', 'assets', 'account']) {
    assert.ok(brandIds.includes(requiredId as typeof brandIds[number]), `Brand OS missing tab ${requiredId}`);
  }
  assert.ok(!brandIds.includes('releases'), 'Brand OS must not expose Artist Music & Releases tab');
  assert.ok(!brandIds.includes('artist-profile'), 'Brand OS must not expose Artist Profile tab');

  // 3. Company experience receives Business OS (brand/business capabilities without artist-only features)
  const companyExp = resolveClientExperience('Company', 'Business');
  assert.equal(companyExp.osMode, 'company');
  assert.equal(companyExp.osTitle, 'Business OS');
  assert.equal(companyExp.isArtist, false);
  assert.equal(companyExp.isBrandOrCompany, true);
  const companyIds = companyExp.navGroups.flatMap(g => g.items.map(i => i.id));
  assert.equal(new Set(companyIds).size, companyIds.length, 'Company nav tab IDs must be strictly unique');
  assert.ok(companyIds.includes('brand'));
  assert.ok(companyIds.includes('documents'));
  assert.ok(companyIds.includes('content'));
  assert.ok(companyIds.includes('assets'));
  assert.ok(!companyIds.includes('releases'), 'Company account must not expose Artist-only Music & Releases');
  assert.ok(!companyIds.includes('artist-profile'), 'Company account must not expose Artist-only Profile');

  // 4. Audience-scoped Creative Request categories isolate Artist vs Brand-only services
  const artistCategories = getRequestCategoriesForExperience(true);
  assert.equal(artistCategories[0], 'Music Cover Artwork');
  assert.ok(!artistCategories.includes('Brand Identity'), 'Artist OS request list must hide Brand Identity');
  assert.ok(!artistCategories.includes('Business Cards'), 'Artist OS request list must hide Business Cards');

  const brandCategories = getRequestCategoriesForExperience(false);
  assert.equal(brandCategories[0], 'Brand Identity');
  assert.ok(!brandCategories.includes('Music Cover Artwork'), 'Brand OS request list must hide Music Cover Artwork');
  assert.ok(!brandCategories.includes('Artist Promotional Graphics'), 'Brand OS request list must hide Artist Promotional Graphics');

  // 5. Release and Brand Production Request prefill builders
  const artistWorkspace = makeWorkspace();
  const releasePrefill = buildReleaseProductionPrefill(
    {
      title: 'Midnight Echoes',
      type: 'EP',
      releaseDate: '2026-08-15',
      trackList: '1. Intro\n2. Midnight Echoes',
      featuredArtists: 'Nia Sol',
      producer: 'Devon Cole',
      songwriters: 'Kaelen Ross, Nia Sol',
      rightsInfo: '℗ 2026 Independent',
      streamingUrl: 'https://open.spotify.com/artist/test',
      isrc: 'USRC12600001',
    },
    artistWorkspace,
  );
  assert.equal(releasePrefill.category, 'Music Cover Artwork');
  assert.equal(releasePrefill.dueDate, '2026-08-15');
  assert.ok(releasePrefill.title.includes('Midnight Echoes'));
  assert.ok(releasePrefill.description.includes('Nia Sol'));
  assert.ok(releasePrefill.requirements?.includes('Devon Cole'));
  assert.ok(releasePrefill.requirements?.includes('USRC12600001'));
  assert.ok(releasePrefill.requirements?.includes('℗ 2026 Independent'));

  const brandWorkspace = makeWorkspace({
    id: 'ws-brand-1',
    name: 'Northbound Co.',
    type: 'Brand',
    clientCategory: 'brand',
    brand: {
      name: 'Northbound Co.',
      primaryColor: 'invalid-hex',
      secondaryColor: '#111827',
    },
  });
  const brandPrefill = buildBrandProductionPrefill(brandWorkspace, {
    description: 'Sustainable outdoor goods label.',
    brandVoice: 'Crisp, grounded, direct.',
    website: 'https://northbound.example.com',
  });
  assert.equal(brandPrefill.category, 'Brand Identity');
  assert.ok(brandPrefill.description.includes('Sustainable outdoor goods label.'));
  assert.ok(brandPrefill.references?.includes('https://northbound.example.com'));

  const collateralPrefill = buildBrandProductionPrefill(
    brandWorkspace,
    { brandVoice: 'Crisp, grounded, direct.' },
    { category: 'Business Cards', titleSuffix: 'Business Cards & Corporate Collateral' },
  );
  assert.equal(collateralPrefill.category, 'Business Cards');
  assert.ok(collateralPrefill.title.includes('Business Cards & Corporate Collateral'));

  // 6. Client Canvas Design generator stays scoped to client workspace & brand tokens
  const design1 = buildClientCanvasDesign({
    workspace: artistWorkspace,
    isArtist: true,
    title: 'Night Drive',
    subtitle: 'SINGLE · 2026-06-01',
    aspectRatio: '9:16 Vertical Story',
  });
  assert.equal(design1.workspaceId, 'ws-artist-1');
  assert.equal(design1.width, 1080);
  assert.equal(design1.height, 1920);
  assert.equal(design1.backgroundColor, '#0A0A0A');
  assert.ok(design1.elements.length >= 3);

  const design2 = buildClientCanvasDesign({
    workspace: brandWorkspace,
    isArtist: false,
    aspectRatio: '16:9 Landscape',
  });
  assert.equal(design2.workspaceId, 'ws-brand-1');
  assert.equal(design2.width, 1920);
  assert.equal(design2.height, 1080);
  const frame = design2.elements.find(el => el.id === 'el-frame-1');
  assert.equal(frame?.borderColor, '#FF1E1E', 'Invalid hex brand primary color must fall back cleanly');

  // 7. Client Canvas Asset Library metadata strictly enforces non-internal visibility & valid path
  const storagePath = 'workspaces/ws-brand-1/assets/asset-123/brand-visual.png';
  assert.equal(isInternalStoragePath(storagePath), false);
  const assetMeta = buildClientWorkspaceCanvasAssetMetadata({
    workspaceId: 'ws-brand-1',
    assetId: 'asset-123',
    name: '  Brand Launch Graphic  ',
    storagePath,
    fileSizeBytes: 2_500_000,
    uid: 'user-99',
  });
  assert.equal(assetMeta.isInternal, false, 'Client-saved canvas asset must never be marked internal');
  assert.equal(assetMeta.name, 'Brand Launch Graphic');
  assert.equal(assetMeta.fileSize, '2.4 MB');
  assert.equal(assetMeta.uploadedBy, 'user-99');

  // 8. Separated Personal Account validation enforces firestore.rules bounds
  const validAccount = validatePersonalAccountUpdate('  Jane Doe  ', 'https://example.com/avatar.png');
  assert.deepEqual(validAccount, { displayName: 'Jane Doe', photoURL: 'https://example.com/avatar.png' });

  assert.throws(() => validatePersonalAccountUpdate('   '), /1 and 100 characters/);
  assert.throws(() => validatePersonalAccountUpdate('x'.repeat(101)), /1 and 100 characters/);
  assert.throws(() => validatePersonalAccountUpdate('Jane', `https://example.com/${'a'.repeat(2040)}`), /2048/);

  console.log('ALL CLIENT OS PHASE 3 UNIT TESTS PASSED');
}

run();
