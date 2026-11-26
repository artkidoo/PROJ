import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { ClientProfile, Workspace } from '../src/types';
import type { CreativeStarterSource, CreativeStudioToolId } from '../src/types/creativeProduction';
import {
  createStarterProduction,
  deleteStudioProduction,
  duplicateStudioProduction,
  generateProductionPdfBlob,
  getFormatPresetById,
  getToolsForAudience,
  loadProductionSnapshots,
  loadStudioProductions,
  MULTI_FORMAT_PRESETS,
  renderProductionToSvgString,
  saveProductionSnapshot,
  saveStudioProduction,
  STUDIO_TOOL_DIRECTORY,
} from '../src/lib/creativeStudioEngine';

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws-phase6-studio',
    name: 'Kairo Vance Records',
    type: 'Artist',
    clientCategory: 'artist',
    ownerId: 'uid-artist-1',
    ownerEmail: 'kairo@example.com',
    brand: {
      name: 'Kairo Vance',
      primaryColor: '#FF1E1E',
      secondaryColor: '#0E0E0E',
      accentColor: '#E5A93C',
    },
    artistProfile: {
      biography: 'Alt-R&B visionary blending analog synths with nocturnal cadence.',
      genre: 'Alternative R&B',
      profileImageUrl: 'https://cdn.example.com/kairo.jpg',
      instagram: '',
      spotify: '',
      appleMusic: '',
      youtube: '',
      website: '',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeClientProfile(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    uid: 'uid-artist-1',
    email: 'kairo@example.com',
    displayName: 'Kairo Vance',
    accountType: 'Artist',
    workspaceId: 'ws-phase6-studio',
    onboardingCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function run() {
  // 1. Directory & Audience Segmentation
  assert.equal(STUDIO_TOOL_DIRECTORY.length, 9, 'Expected 9 core studio production tool engines');

  const artistTools = getToolsForAudience('Artist');
  const brandTools = getToolsForAudience('Brand');
  assert.ok(artistTools.some(t => t.id === 'release-artwork-studio'), 'Artist Studio must include Release Artwork Studio');
  assert.ok(artistTools.some(t => t.id === 'motion-visualizer-studio'), 'Artist Studio must include Spotify Canvas tool');
  assert.ok(artistTools.some(t => t.id === 'split-sheet-studio'), 'Artist Studio must include Split Sheet Builder');
  assert.ok(!artistTools.some(t => t.id === 'product-ad-designer'), 'Artist Studio must not include Brand Product Ad Designer');
  assert.ok(!artistTools.some(t => t.id === 'brand-collateral-studio'), 'Artist Studio must not include Brand Collateral Studio');

  assert.ok(brandTools.some(t => t.id === 'product-ad-designer'), 'Brand Studio must include Product Ad Designer');
  assert.ok(brandTools.some(t => t.id === 'brand-collateral-studio'), 'Brand Studio must include Brand Collateral Studio');
  assert.ok(brandTools.some(t => t.id === 'launch-social-studio'), 'Brand Studio must include Shared Social Studio');
  assert.ok(brandTools.some(t => t.id === 'pack-template-customizer'), 'Brand Studio must include Pack Template Customizer');
  assert.ok(!brandTools.some(t => t.id === 'split-sheet-studio'), 'Brand Studio must not expose Artist Split Sheets');

  // Category filter check
  const musicReleaseTools = getToolsForAudience('Artist', 'Music & Releases');
  assert.deepEqual(
    musicReleaseTools.map(t => t.id),
    ['release-artwork-studio', 'lyric-card-studio'],
  );

  // 2. Multi-Format Preset Verification
  assert.equal(MULTI_FORMAT_PRESETS.length, 6);
  const dspMaster = getFormatPresetById('1:1-master-cover');
  assert.equal(dspMaster.width, 3000);
  assert.equal(dspMaster.height, 3000);
  assert.equal(dspMaster.aspectRatio, '1:1');

  const spotifyCanvas = getFormatPresetById('9:16-vertical-story');
  assert.equal(spotifyCanvas.width, 1080);
  assert.equal(spotifyCanvas.height, 1920);
  assert.equal(spotifyCanvas.aspectRatio, '9:16');

  const fallbackPreset = getFormatPresetById('unknown-preset-id');
  assert.equal(fallbackPreset.id, '1:1-square');

  // 3. All 8 Production Starter Sources Prefill Correctly
  const artistWs = makeWorkspace();
  const brandWs = makeWorkspace({
    id: 'ws-phase6-brand',
    name: 'Vespera Maison',
    type: 'Brand',
    clientCategory: 'brand',
    brand: {
      name: 'Vespera Maison',
      primaryColor: '#C9A227',
      secondaryColor: '#0A0A0A',
      accentColor: '#FFFFFF',
    },
    brandProfile: {
      description: 'Architectural leather goods and scent objects.',
      industry: 'Luxury Retail',
      businessCategory: 'Fashion & Apparel',
      website: 'https://vespera.example.com',
      contactEmail: 'atelier@vespera.example.com',
      contactPhone: '',
      logoUrl: '',
      brandVoice: 'Minimal architectural poise.',
      photographyDirection: '',
      graphicDesignPrinciples: '',
      usageGuidelines: '',
      creativeReferences: '',
    },
  });

  const starterCases: Array<{
    source: CreativeStarterSource;
    toolId: CreativeStudioToolId;
    ws: Workspace;
  }> = [
    { source: 'scratch', toolId: 'launch-social-studio', ws: artistWs },
    { source: 'template', toolId: 'motion-visualizer-studio', ws: artistWs },
    { source: 'resource', toolId: 'pack-template-customizer', ws: brandWs },
    { source: 'asset', toolId: 'release-artwork-studio', ws: artistWs },
    { source: 'release', toolId: 'release-artwork-studio', ws: artistWs },
    { source: 'project', toolId: 'product-ad-designer', ws: brandWs },
    { source: 'request', toolId: 'brand-collateral-studio', ws: brandWs },
    { source: 'profile', toolId: 'artist-epk-studio', ws: artistWs },
  ];

  for (const sc of starterCases) {
    const prod = createStarterProduction({
      workspace: sc.ws,
      clientProfile: makeClientProfile({ workspaceId: sc.ws.id }),
      starter: {
        source: sc.source,
        toolId: sc.toolId,
        linkedReleaseId: sc.source === 'release' ? 'rel-1' : undefined,
        linkedReleaseTitle: sc.source === 'release' ? 'MIDNIGHT ECHO' : undefined,
        linkedProjectId: sc.source === 'project' || sc.source === 'request' ? 'proj-1' : undefined,
        linkedProjectTitle: sc.source === 'project' || sc.source === 'request' ? 'Q4 Campaign' : undefined,
        linkedRequestId: sc.source === 'request' ? 'req-1' : undefined,
        linkedProductId: sc.source === 'resource' ? 'pack-1' : undefined,
        linkedProductTitle: sc.source === 'resource' ? 'Social Launch Kit' : undefined,
        linkedAssetId: sc.source === 'asset' ? 'asset-1' : undefined,
        prefillDesign: {
          isrcSnippet: sc.source === 'release' ? 'US-KDO-26-00421' : undefined,
        },
      },
    });

    assert.equal(prod.workspaceId, sc.ws.id);
    assert.equal(prod.toolId, sc.toolId);
    assert.equal(prod.status, 'In Progress');
    assert.ok(prod.variations.length >= 4, 'Starter production must scaffold multi-format variations');
    assert.equal(prod.designState.primaryColor, sc.ws.brand.primaryColor);
    if (sc.source === 'release') {
      assert.equal(prod.releaseId, 'rel-1');
      assert.equal(prod.designState.isrcSnippet, 'US-KDO-26-00421');
    }
    if (sc.source === 'request') {
      assert.equal(prod.requestId, 'req-1');
      assert.equal(prod.projectId, 'proj-1');
    }
  }

  // 4. SVG Output, Escaping & Tool Extensions
  const unsafeProd = createStarterProduction({
    workspace: artistWs,
    starter: {
      source: 'release',
      toolId: 'lyric-card-studio',
      prefillDesign: {
        headline: 'SHADOW & <SCRIPT>LIGHT</SCRIPT>',
        subtitle: '50% "Explicit" Edition',
        quoteOrLyricsText: 'Walking past <noise> in neon rain',
        imageUrl: 'https://cdn.example.com/art.png?a=1&b=2',
        showAdvisoryBadge: true,
      },
    },
  });

  const svgOut = renderProductionToSvgString(unsafeProd);
  assert.ok(svgOut.startsWith('<svg '), 'SVG output must begin with <svg tag');
  assert.ok(!svgOut.includes('<SCRIPT>'), 'Raw <SCRIPT> tag must be XML-escaped');
  assert.ok(svgOut.includes('&lt;SCRIPT&gt;LIGHT&lt;/SCRIPT&gt;'), 'Headline XML escaping failed');
  assert.ok(svgOut.includes('&amp;b=2'), 'Image query ampersand must be XML-escaped');
  assert.ok(svgOut.includes('PARENTAL'), 'Advisory badge SVG block must render when enabled');
  assert.ok(svgOut.includes('&lt;noise&gt;'), 'Lyric quote SVG block must render & escape safely');

  const adProd = createStarterProduction({
    workspace: brandWs,
    starter: {
      source: 'project',
      toolId: 'product-ad-designer',
      prefillDesign: {
        customCtaText: 'ORDER CAPSULE',
        showAdvisoryBadge: false,
      },
    },
  });
  const adSvg = renderProductionToSvgString(adProd, getFormatPresetById('4:5-portrait'));
  assert.ok(adSvg.includes('viewBox="0 0 1080 1350"'));
  assert.ok(adSvg.includes('ORDER CAPSULE'));

  // 5. Structured Proof PDF Blob Generation (Works Headless in Node)
  const pdfBlob = await generateProductionPdfBlob(unsafeProd, artistWs.name);
  assert.ok(pdfBlob.size > 400, 'Proof PDF blob should contain valid document bytes');
  const pdfHeader = await pdfBlob.slice(0, 5).text();
  assert.equal(pdfHeader, '%PDF-', 'Generated PDF blob must start with %PDF- signature');

  // 6. Node-Safe Storage Helpers (Zero ReferenceError without window)
  assert.deepEqual(loadStudioProductions('ws-phase6-studio'), []);
  assert.deepEqual(loadProductionSnapshots('ws-phase6-studio', 'prod-none'), []);
  saveStudioProduction('ws-phase6-studio', unsafeProd);
  deleteStudioProduction('ws-phase6-studio', unsafeProd.id);
  assert.equal(duplicateStudioProduction('ws-phase6-studio', unsafeProd.id), null);
  assert.equal(saveProductionSnapshot('ws-phase6-studio', unsafeProd), null);

  // 7. Static Security & Architectural Boundary Checks
  const root = process.cwd();
  const workspaceStudioHubSrc = fs.readFileSync(
    path.join(root, 'src/components/client/WorkspaceStudioHub.tsx'),
    'utf8',
  );
  const clientWorkspaceSrc = fs.readFileSync(
    path.join(root, 'src/components/client/ClientWorkspace.tsx'),
    'utf8',
  );
  const clientStudioSrc = fs.readFileSync(
    path.join(root, 'src/components/client/ClientStudio.tsx'),
    'utf8',
  );
  const clientHubSrc = fs.readFileSync(
    path.join(root, 'src/components/client/ClientCreativeHub.tsx'),
    'utf8',
  );
  const adminProdSrc = fs.readFileSync(
    path.join(root, 'src/components/admin/AdminProduction.tsx'),
    'utf8',
  );
  const firestoreRulesSrc = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');

  assert.ok(!workspaceStudioHubSrc.includes('DesignCanvasEditor'), 'WorkspaceStudioHub must not expose Admin DesignCanvasEditor');
  assert.ok(!clientWorkspaceSrc.includes('DesignCanvasEditor'), 'ClientWorkspace must not expose Admin DesignCanvasEditor');
  assert.ok(!clientWorkspaceSrc.includes('Design Canvas'), 'ClientWorkspace must not advertise Design Canvas to clients');
  assert.ok(!clientStudioSrc.includes('DesignCanvasEditor'), 'ClientStudio must not expose Admin DesignCanvasEditor');
  assert.ok(!clientHubSrc.includes('DesignCanvasEditor'), 'ClientCreativeHub must not expose Admin DesignCanvasEditor');
  assert.ok(
    !workspaceStudioHubSrc.includes('generateBrandGuidelinesPdf(workspace'),
    'WorkspaceStudioHub must call generateBrandGuidelinesPdf(payload, workspace) in correct parameter order',
  );
  assert.ok(
    workspaceStudioHubSrc.includes('generateBrandGuidelinesPdf(payload, workspace)'),
    'WorkspaceStudioHub must call generateBrandGuidelinesPdf(payload, workspace)',
  );
  assert.ok(
    clientHubSrc.includes('exportReady && onOpenInStudio'),
    'Customize in Studio on Creative Hub cards must remain strictly gated by exportReady',
  );
  assert.ok(
    adminProdSrc.includes('Launch Studio Canvas for Brief'),
    'AdminProduction should allow Admin reviewers to launch Studio Canvas for briefs',
  );
  assert.ok(
    firestoreRulesSrc.includes('match /studioProductions/{productionId}'),
    'firestore.rules must validate workspace studioProductions subcollection',
  );

  console.log('ALL PHASE 6 CREATIVE STUDIO ENGINE UNIT TESTS PASSED');
}

void run().catch(err => {
  console.error(err);
  process.exit(1);
});
