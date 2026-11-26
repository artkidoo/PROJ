import assert from 'node:assert/strict';
import * as clientOS from '../src/lib/clientOS';
import {
  ARTIST_ASSET_CATEGORIES,
  BRAND_ASSET_CATEGORIES,
  BRAND_BUSINESS_CATEGORIES,
  buildUnifiedWorkspaceActivity,
  buildWorkspaceSearchResults,
  computeArtistProfileCompleteness,
  computeBrandProfileCompleteness,
  evaluateReleaseReadiness,
  resolveClientExperience,
} from '../src/lib/clientOS';

function run() {
  // 1. Unified OS Experience Verification: Studio Hubs, Content Engine vs Content Studio, Zero Legacy Terms
  const artistExp = resolveClientExperience('Artist', 'Artist');
  const brandExp = resolveClientExperience('Brand', 'Brand');
  const legacyCompanyExp = resolveClientExperience('Company', 'Business');

  assert.equal(artistExp.osMode, 'artist');
  assert.equal(artistExp.isOverride, false);
  assert.equal(brandExp.osMode, 'brand');
  assert.equal(brandExp.isOverride, false);
  assert.equal(legacyCompanyExp.osMode, 'brand');
  assert.equal(legacyCompanyExp.isOverride, false);

  // OS Mode Switcher override capability
  const artistSwitchedToBrand = resolveClientExperience('Artist', 'Artist', 'brand');
  assert.equal(artistSwitchedToBrand.osMode, 'brand');
  assert.equal(artistSwitchedToBrand.isArtist, false);
  assert.equal(artistSwitchedToBrand.isOverride, true);

  const brandSwitchedToArtist = resolveClientExperience('Brand', 'Brand', 'artist');
  assert.equal(brandSwitchedToArtist.osMode, 'artist');
  assert.equal(brandSwitchedToArtist.isArtist, true);
  assert.equal(brandSwitchedToArtist.isOverride, true);

  const artistItems = artistExp.navGroups.flatMap(g => g.items);
  const brandItems = brandExp.navGroups.flatMap(g => g.items);

  assert.equal(artistItems.find(i => i.id === 'studio')?.title, 'Artist Studio');
  assert.equal(artistItems.find(i => i.id === 'content')?.title, 'Content Engine');
  assert.equal(brandItems.find(i => i.id === 'studio')?.title, 'Brand Studio');
  assert.equal(brandItems.find(i => i.id === 'content')?.title, 'Content Studio');

  // Ensure legacy "Campaign Management" nav labels never resurface
  for (const item of [...artistItems, ...brandItems]) {
    assert.ok(!/campaign management/i.test(item.title), `Unexpected Campaign Management tab: ${item.title}`);
  }

  // Ensure Admin HQ Canvas Editor / BrandRoom helpers remain strictly absent from clientOS
  assert.equal('buildClientCanvasDesign' in clientOS, false);
  assert.equal('buildClientWorkspaceCanvasAssetMetadata' in clientOS, false);

  // 2. Category Taxonomies for Artist OS vs Brand OS
  assert.ok(ARTIST_ASSET_CATEGORIES.includes('Cover Art'));
  assert.ok(ARTIST_ASSET_CATEGORIES.includes('Visualizer'));
  assert.ok(ARTIST_ASSET_CATEGORIES.includes('EPK'));
  assert.ok(BRAND_ASSET_CATEGORIES.includes('Logo'));
  assert.ok(BRAND_ASSET_CATEGORIES.includes('Stationery'));
  assert.ok(BRAND_ASSET_CATEGORIES.includes('Packaging'));
  assert.ok(BRAND_BUSINESS_CATEGORIES.length >= 8);

  // 3. Artist Profile Completeness Calculation
  const emptyArtistScore = computeArtistProfileCompleteness({ name: '', contactEmail: '' });
  assert.equal(emptyArtistScore.score, 0);
  assert.equal(emptyArtistScore.missingFields.length, emptyArtistScore.totalCount);

  const partialArtistScore = computeArtistProfileCompleteness({
    name: 'Kaelen Ross',
    contactEmail: '',
    artistProfile: {
      genre: 'Alt-R&B',
      biography: 'Too short',
    },
  });
  assert.equal(partialArtistScore.completedCount, 2);
  assert.ok(partialArtistScore.missingFields.includes('Artist biography'));

  const fullArtistScore = computeArtistProfileCompleteness({
    name: 'Kaelen Ross',
    contactEmail: 'mgmt@kaelen.example',
    artistProfile: {
      genre: 'Alt-R&B',
      biography: 'Independent vocalist and producer crafting nocturnal electronic soul from Lagos & London.',
      profileImageUrl: 'https://example.com/artist.jpg',
      spotify: 'https://open.spotify.com/artist/test',
      location: 'London, UK',
    },
  });
  assert.equal(fullArtistScore.score, 100);
  assert.equal(fullArtistScore.missingFields.length, 0);

  // 4. Brand Profile Completeness Calculation
  const invalidColorBrandScore = computeBrandProfileCompleteness({
    name: 'Northbound Co.',
    description: 'Outdoor apparel',
    contactEmail: 'hello@northbound.example',
    brand: {
      name: 'Northbound Co.',
      primaryColor: 'not-a-hex',
      typography: { displayFont: 'Syne', bodyFont: 'Inter' },
      logoUrl: 'https://example.com/logo.svg',
    },
    brandProfile: {
      businessCategory: 'Retail / E-Commerce',
      brandVoice: 'Confident and clear.',
    },
  });
  assert.ok(
    invalidColorBrandScore.missingFields.includes('Color palette tokens'),
    'Non-hex brand colors must count as missing color tokens',
  );

  const fullBrandScore = computeBrandProfileCompleteness({
    name: 'Northbound Co.',
    description: 'Outdoor apparel studio.',
    contactEmail: 'hello@northbound.example',
    brand: {
      name: 'Northbound Co.',
      primaryColor: '#FF1E1E',
      typography: { displayFont: 'Syne', bodyFont: 'Inter' },
      logoUrl: 'https://example.com/logo.svg',
    },
    brandProfile: {
      businessCategory: 'Retail / E-Commerce',
      brandVoice: 'Confident and clear.',
    },
  });
  assert.equal(fullBrandScore.score, 100);
  assert.equal(fullBrandScore.missingFields.length, 0);

  // 5. Release Readiness Evaluation
  const unreadyRelease = evaluateReleaseReadiness({});
  assert.equal(unreadyRelease.completed, 0);
  assert.equal(unreadyRelease.total, 7);
  assert.equal(unreadyRelease.percent, 0);
  assert.equal(unreadyRelease.warnings.length, 4);

  const readyRelease = evaluateReleaseReadiness({
    releaseDate: '2026-10-01',
    artworkUrl: 'https://example.com/cover.jpg',
    trackList: '1. Midnight Echoes',
    isrc: 'USRC12600001',
    checklist: {
      audioMastered: true,
      artworkApproved: true,
      splitSheetSigned: true,
      metadataVerified: true,
      distributionSubmitted: true,
      pressKitReady: true,
      marketingAssetsReady: true,
    },
  });
  assert.equal(readyRelease.completed, 7);
  assert.equal(readyRelease.percent, 100);
  assert.equal(readyRelease.warnings.length, 0);

  // 6. Global Workspace Search Results & Artist/Brand Scope Isolation
  const sampleSearchInput = {
    queryText: 'Midnight',
    projects: [{ id: 'p1', title: 'Midnight Rollout', category: 'Music Cover Artwork', stage: 'In Production', status: 'Active' }],
    releases: [{ id: 'r1', title: 'Midnight Echoes', type: 'EP', status: 'Scheduled', releaseDate: '2026-10-01' }],
    contentItems: [{ id: 'c1', title: 'Midnight Teaser Caption', kind: 'Caption', status: 'Ready', phase: 'Pre-release' }],
    assets: [{ id: 'a1', name: 'Midnight Cover Master', category: 'Cover Art', fileType: 'PNG' }],
    documents: [{ id: 'd1', title: 'Midnight Split Sheet', type: 'Split Sheet', referenceNo: 'DOC-01' }],
    invoices: [{ id: 'i1', title: 'Midnight EP Package', referenceNo: 'INV-1001', status: 'Issued' as const }],
    proposals: [{ id: 'pr1', title: 'Midnight Deluxe Scope', referenceNo: 'PROP-1001', status: 'Sent' as const }],
    products: [{ id: 'prod1', title: 'Midnight Spotify Canvas Pack', category: 'Streaming Platform Packs', resourceType: 'Template Pack' as const }],
  };

  const artistSearch = buildWorkspaceSearchResults({ ...sampleSearchInput, isArtist: true });
  assert.equal(artistSearch.length, 8);
  assert.ok(artistSearch.some(r => r.kind === 'Release' && r.targetTab === 'releases'));
  assert.ok(artistSearch.some(r => r.kind === 'Creative Hub' && r.targetTab === 'creative-hub'));

  const brandSearch = buildWorkspaceSearchResults({ ...sampleSearchInput, isArtist: false });
  assert.equal(brandSearch.length, 7);
  assert.ok(!brandSearch.some(r => r.kind === 'Release'), 'Brand OS search must exclude Music Releases');

  const emptySearch = buildWorkspaceSearchResults({ ...sampleSearchInput, isArtist: true, queryText: '   ' });
  assert.equal(emptySearch.length, 0);

  // 7. Unified Workspace Activity Feed Aggregation & Sorting
  const artistTimeline = buildUnifiedWorkspaceActivity({
    isArtist: true,
    activities: [
      {
        id: 'a1',
        projectId: 'p1',
        action: 'Stage updated',
        details: 'Moved to Client Review',
        actorUid: 'admin-1',
        actorName: 'Studio Director',
        clientVisible: true,
        createdAt: '2026-10-05T10:00:00.000Z',
      },
    ],
    releases: [{ id: 'r1', title: 'Midnight Echoes', status: 'Scheduled', createdAt: '2026-10-06T12:00:00.000Z' }],
    contentItems: [{ id: 'c1', title: 'Countdown Post', kind: 'Social post', status: 'Ready', updatedAt: '2026-10-04T08:00:00.000Z' }],
    assets: [{ id: 'ast1', name: 'Cover V2', category: 'Cover Art', uploadedAt: '2026-10-07T09:00:00.000Z' }],
    invoices: [{ id: 'inv1', title: 'Artwork Retainer', referenceNo: 'INV-22', status: 'Issued', updatedAt: '2026-10-08T09:00:00.000Z', createdAt: '2026-10-01T00:00:00.000Z' }],
  });

  assert.equal(artistTimeline.length, 5);
  assert.equal(artistTimeline[0].source, 'Invoice', 'Most recent activity must appear first');
  assert.equal(artistTimeline[artistTimeline.length - 1].source, 'Content');

  const brandTimeline = buildUnifiedWorkspaceActivity({
    isArtist: false,
    releases: [{ id: 'r1', title: 'Should Not Leak', status: 'Live', createdAt: '2026-10-09T12:00:00.000Z' }],
    invoices: [{ id: 'inv1', title: 'Brand Suite', referenceNo: 'INV-23', status: 'Issued', createdAt: '2026-10-08T09:00:00.000Z' }],
  });
  assert.equal(brandTimeline.length, 1);
  assert.equal(brandTimeline[0].source, 'Invoice');

  console.log('ALL PHASE 5 CLIENT OS & STUDIO INTEGRATION UNIT TESTS PASSED');
}

run();
