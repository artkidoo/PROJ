import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import type { MarketingAsset } from '../src/types/brandRoom';

// Allow TSX Node runner to import static image assets cleanly without Vite bundling
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
  const {
    ADVERTISING_TOPICS,
    ARTIST_MARKETING_TOPICS,
    BRAND_BUSINESS_MARKETING_TOPICS,
    DEFAULT_BRAND_IDENTITY,
    DEFAULT_CONTENT_PILLARS,
    DEFAULT_CONTENT_SERIES,
    MARKETING_CONTENT_TYPES,
    MARKETING_MASTER_TEMPLATES,
    MARKETING_PLATFORM_FORMATS,
    MARKETING_PLATFORMS,
    MOTION_VIDEO_TOPICS,
    PRINT_OFFLINE_TOPICS,
    WEBSITE_DIGITAL_TOPICS,
    adaptCanvasDesignToFormat,
    createMarketingCanvasFromTemplate,
    getFormatSpecById,
    getFormatsForPlatform,
  } = await import('../src/lib/brandRoomStudio');

  const {
    computeBrandRoomAnalytics,
    exportAndSaveCanvasToBrandRoom,
    isAuthorizedBrandRoomStoragePath,
    renderPrintMarketingPdfBlob,
    stripUndefinedDeep,
    validateBrandRoomUpload,
  } = await import('../src/lib/brandRoomService');

  const {
    drawShapeOnCanvas2D,
    getShapePreviewStyle,
    renderShapeToSvgString,
  } = await import('../src/lib/canvasShapeRenderer');

  const { renderCanvasDesignToSvgString } = await import('../src/lib/productPackager');

  console.log('------------------------------------------------------------');
  console.log('KEEDOHUB BRAND ROOM — MARKETING KIT VERIFICATION TESTS');
  console.log('------------------------------------------------------------');

  // 1. Platform & Format Registry
  console.log('[TEST 1] Platform registry, safe areas & content taxonomy');
  assert.equal(MARKETING_PLATFORMS.length, 9);
  for (const platform of MARKETING_PLATFORMS) {
    const formats = getFormatsForPlatform(platform);
    assert.ok(formats.length >= 2, `Expected >=2 formats for platform ${platform}`);
    for (const fmt of formats) {
      assert.ok(fmt.width > 0 && fmt.height > 0);
      assert.ok(fmt.safeAreaTopPct >= 0 && fmt.safeAreaBottomPct >= 0 && fmt.safeAreaSidePct >= 0);
      assert.ok(fmt.cropRule.length > 10);
      assert.ok(fmt.recommendedFormats.length > 0);
    }
  }
  assert.equal(MARKETING_CONTENT_TYPES.length, 19);
  assert.equal(DEFAULT_CONTENT_PILLARS.length, 15);
  assert.equal(DEFAULT_CONTENT_SERIES.length, 11);
  assert.equal(ARTIST_MARKETING_TOPICS.length, 11);
  assert.equal(BRAND_BUSINESS_MARKETING_TOPICS.length, 12);
  assert.equal(ADVERTISING_TOPICS.length, 9);
  assert.equal(MOTION_VIDEO_TOPICS.length, 10);
  assert.equal(WEBSITE_DIGITAL_TOPICS.length, 6);
  assert.equal(PRINT_OFFLINE_TOPICS.length, 9);

  // Verify KeedoHub Red & Black Identity Defaults (zero synthetic logo strings)
  assert.equal(DEFAULT_BRAND_IDENTITY.assets.length, 0);
  assert.ok(DEFAULT_BRAND_IDENTITY.colors.some(c => c.hex === '#FF1E1E'));
  assert.ok(DEFAULT_BRAND_IDENTITY.colors.some(c => c.hex === '#080808' || c.hex === '#000000'));
  assert.ok(MARKETING_PLATFORM_FORMATS.some(f => f.platform === 'Print & Offline' && f.printDpi === 300));

  // 2. Master Templates + Real SVG & Print PDF Rendering
  console.log('[TEST 2] Marketing templates produce CanvasDesign, real SVG & PDF output');
  assert.ok(MARKETING_MASTER_TEMPLATES.length >= 10);
  for (const tpl of MARKETING_MASTER_TEMPLATES) {
    const design = createMarketingCanvasFromTemplate(tpl);
    assert.ok(design.elements.length >= 3, `Template ${tpl.id} should have multiple canvas layers`);
    const svg = renderCanvasDesignToSvgString(design);
    assert.ok(svg.startsWith('<svg') && svg.includes('</svg>'));
    assert.ok(svg.includes(`width="${design.width}"`));
    assert.ok(svg.includes(`height="${design.height}"`));
    assert.ok(svg.includes('fill="#FF1E1E"'), `Template ${tpl.id} red bar rectangle should render filled #FF1E1E in SVG`);
  }

  const printFormat = getFormatSpecById('print-poster-a3');
  const printDesign = createMarketingCanvasFromTemplate(MARKETING_MASTER_TEMPLATES[MARKETING_MASTER_TEMPLATES.length - 1], printFormat);
  const pdfBlob = renderPrintMarketingPdfBlob({ title: 'Print Proof Test', design: printDesign });
  const pdfHeader = await pdfBlob.slice(0, 5).text();
  assert.equal(pdfHeader, '%PDF-');
  assert.ok(pdfBlob.size > 200);

  // 3. Composition-preserving Safe-Area Multi-Format Conversion
  console.log('[TEST 3] Safe-zone layout conversion across 4:5 -> 9:16 -> 16:9 -> 1:1');
  const baseTemplate = MARKETING_MASTER_TEMPLATES[0];
  const baseDesign = createMarketingCanvasFromTemplate(baseTemplate);
  const targets = [
    getFormatSpecById('ig-story'),
    getFormatSpecById('yt-thumbnail'),
    getFormatSpecById('li-square'),
    getFormatSpecById('print-flyer-a5'),
  ];

  for (const fmt of targets) {
    const adapted = adaptCanvasDesignToFormat(baseDesign, fmt);
    assert.equal(adapted.width, fmt.width);
    assert.equal(adapted.height, fmt.height);
    assert.equal(adapted.aspectRatio, fmt.canvasAspectRatio);
    const safeMinXPct = fmt.safeAreaSidePct;
    const safeMaxXPct = 100 - fmt.safeAreaSidePct;
    const safeMinYPct = fmt.safeAreaTopPct;
    const safeMaxYPct = 100 - fmt.safeAreaBottomPct;

    // Every adapted text element center must sit inside platform safe-area percentage envelope
    for (const el of adapted.elements) {
      if (el.type === 'text') {
        assert.ok(el.x >= safeMinXPct, `Text element ${el.id} escaped left safe zone in ${fmt.id} (${el.x} < ${safeMinXPct})`);
        assert.ok(el.y >= safeMinYPct, `Text element ${el.id} escaped top safe zone in ${fmt.id} (${el.y} < ${safeMinYPct})`);
        assert.ok(el.x <= safeMaxXPct, `Text element ${el.id} escaped right safe zone in ${fmt.id} (${el.x} > ${safeMaxXPct})`);
        assert.ok(el.y <= safeMaxYPct, `Text element ${el.id} escaped bottom safe zone in ${fmt.id} (${el.y} > ${safeMaxYPct})`);
      }
    }
  }

  // 4. Upload Security & Storage Path Validation
  console.log('[TEST 4] Upload MIME/size validation & storage path boundary');
  const validPng = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
  const okPng = validateBrandRoomUpload(validPng, 'keedo logo?.png');
  assert.equal(okPng.mimeType, 'image/png');
  assert.ok(!okPng.safeName.includes(' '));

  const validVideo = new Blob([new Uint8Array([0, 0, 0, 24])], { type: 'video/mp4' });
  assert.equal(validateBrandRoomUpload(validVideo, 'reel-promo.mp4').mimeType, 'video/mp4');

  const maliciousHtml = new Blob(['<script>alert(1)</script>'], { type: 'text/html' });
  assert.throws(() => validateBrandRoomUpload(maliciousHtml, 'payload.html'), /Unsupported file format/);

  const emptyBlob = new Blob([], { type: 'image/png' });
  assert.throws(() => validateBrandRoomUpload(emptyBlob, 'empty.png'), /larger than 0 bytes/);

  assert.equal(isAuthorizedBrandRoomStoragePath('brand-room/assets/a1/exports/v1/post.png'), true);
  assert.equal(isAuthorizedBrandRoomStoragePath('products/p1/post.png'), false);
  assert.equal(isAuthorizedBrandRoomStoragePath('brand-room/../secrets.json'), false);

  // 5. Undefined Field Stripping & Live Analytics Calculation
  console.log('[TEST 5] Firestore undefined sanitization & honest analytics aggregation');
  const dirty = {
    a: 'keep',
    b: undefined,
    nested: { c: 123, d: undefined },
    arr: [{ ok: true, drop: undefined }],
  };
  const cleaned = stripUndefinedDeep(dirty);
  assert.equal('b' in cleaned, false);
  assert.equal('d' in cleaned.nested, false);
  assert.equal('drop' in cleaned.arr[0], false);

  const sampleAssets: MarketingAsset[] = [
    {
      id: 'a1',
      title: 'Artist Pack Launch',
      categoryArea: 'Artist Marketing',
      topic: 'Streaming platform graphics',
      contentPillarId: 'pillar-artist-focus',
      contentPillarName: 'Artist-Focused Promotions',
      contentType: 'Single-image post',
      targetAudience: 'Artists',
      platform: 'Instagram',
      formatId: 'ig-feed-portrait',
      formatLabel: 'Instagram Feed Portrait (4:5)',
      dimensions: '1080x1350px',
      description: 'Desc',
      caption: 'Cap',
      callToAction: 'Open Hub',
      hashtags: ['#KeedoHub'],
      tags: ['artist'],
      status: 'Published',
      exportedFiles: [
        {
          id: 'f1',
          label: 'PNG',
          fileName: 'a1.png',
          fileFormat: 'PNG',
          mimeType: 'image/png',
          storagePath: 'brand-room/assets/a1/exports/v1/a1.png',
          fileSizeBytes: 5000,
          version: 1,
          uploadedAt: '2026-03-01T00:00:00.000Z',
          uploadedBy: 'admin-1',
        },
        {
          id: 'f2',
          label: 'SVG',
          fileName: 'a1.svg',
          fileFormat: 'SVG',
          mimeType: 'image/svg+xml',
          storagePath: 'brand-room/assets/a1/sources/v1/a1.svg',
          fileSizeBytes: 4000,
          isEditableSource: true,
          version: 1,
          uploadedAt: '2026-03-01T00:00:00.000Z',
          uploadedBy: 'admin-1',
        },
      ],
      version: 1,
      versionHistory: [],
      reuseCount: 3,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: '2026-03-02T00:00:00.000Z',
      createdBy: 'admin-1',
      updatedBy: 'admin-1',
    },
    {
      id: 'a2',
      title: 'B2B Brand Deck Offer',
      categoryArea: 'Brand & Business Marketing',
      topic: 'Brand identity',
      contentPillarId: 'pillar-brand-focus',
      contentPillarName: 'Brand & Business Promotions',
      contentType: 'Service advertisement',
      targetAudience: 'Brands & Businesses',
      platform: 'LinkedIn',
      formatId: 'li-square',
      formatLabel: 'LinkedIn Square Post (1:1)',
      dimensions: '1080x1080px',
      description: 'Desc',
      caption: 'Cap',
      callToAction: 'Book Brief',
      hashtags: ['#KeedoHub'],
      tags: ['brand'],
      status: 'Scheduled',
      publicationDate: '2026-04-10',
      exportedFiles: [],
      version: 1,
      versionHistory: [],
      reuseCount: 1,
      createdAt: '2026-03-03T00:00:00.000Z',
      updatedAt: '2026-03-03T00:00:00.000Z',
      createdBy: 'admin-1',
      updatedBy: 'admin-1',
    },
  ];

  const stats = computeBrandRoomAnalytics(sampleAssets);
  assert.equal(stats.totalAssets, 2);
  assert.equal(stats.publishedCount, 1);
  assert.equal(stats.scheduledCount, 1);
  assert.equal(stats.totalExportFiles, 2);
  assert.equal(stats.totalReuses, 4);
  assert.equal(stats.platformDistribution.length, 2);
  assert.equal(stats.pillarDistribution.length, 2);
  assert.equal(stats.recentPublished.length, 1);

  // 6. Structural Security Parity Verification (Rules + Admin-Only Isolation)
  console.log('[TEST 6] Structural security rules & Admin-only UI isolation verification');
  const root = process.cwd();
  const firestoreRules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const storageRules = fs.readFileSync(path.join(root, 'storage.rules'), 'utf8');
  const brandRoomSrc = fs.readFileSync(path.join(root, 'src/components/admin/brand-room/BrandRoom.tsx'), 'utf8');
  const adminHqSrc = fs.readFileSync(path.join(root, 'src/components/admin/AdminHQ.tsx'), 'utf8');
  const designCanvasSrc = fs.readFileSync(path.join(root, 'src/components/studio/DesignCanvasEditor.tsx'), 'utf8');

  for (const col of ['brandRoomIdentity', 'brandRoomPillars', 'brandRoomSeries', 'brandRoomAssets']) {
    assert.ok(firestoreRules.includes(col), `firestore.rules must explicitly guard ${col}`);
  }
  assert.ok(storageRules.includes('match /brand-room/{allPaths=**}'));
  assert.ok(brandRoomSrc.includes("doc(db, 'admins', firebaseUser.uid)") && brandRoomSrc.includes('getDocFromServer'));
  assert.ok(adminHqSrc.includes("case 'brand-room'"));

  // Confirm ClientCreativeHub or ClientWorkspace never imports BrandRoom or DesignCanvasEditor
  const clientFiles = [
    path.join(root, 'src/components/client/ClientCreativeHub.tsx'),
    path.join(root, 'src/components/workspace/WorkspaceApp.tsx'),
  ];
  for (const file of clientFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(!content.includes('BrandRoom'), `${file} must NOT import BrandRoom`);
      assert.ok(!content.includes('DesignCanvasEditor'), `${file} must NOT import DesignCanvasEditor`);
    }
  }

  // 7. BUG 1 Verification — Rectangle Shape Rendering (Preview + SVG + PNG Canvas 2D)
  console.log('[TEST 7] BUG 1: Rectangle shape preview, SVG export, and Canvas 2D draw parity');
  const rectLayer = {
    id: 'rect-1',
    type: 'shape' as const,
    name: 'KeedoHub Signal Red Bar',
    shapeType: 'rectangle' as const,
    x: 50,
    y: 18,
    width: 26,
    height: 2,
    rotation: 15,
    opacity: 0.85,
    zIndex: 3,
    visible: true,
    fillColor: '#FF1E1E',
  };
  const frameLayer = {
    id: 'frame-1',
    type: 'shape' as const,
    name: 'Outer Frame',
    shapeType: 'frame' as const,
    x: 50,
    y: 50,
    width: 90,
    height: 90,
    rotation: 0,
    opacity: 0.65,
    zIndex: 2,
    visible: true,
    borderColor: '#2E2E2E',
    borderWidth: 2,
  };
  const lineLayer = {
    id: 'line-1',
    type: 'shape' as const,
    name: 'Divider Line',
    shapeType: 'line' as const,
    x: 50,
    y: 80,
    width: 60,
    height: 1,
    rotation: 0,
    opacity: 1,
    zIndex: 4,
    visible: true,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  };
  const circleLayer = {
    id: 'circle-1',
    type: 'shape' as const,
    name: 'Orbit Circle',
    shapeType: 'circle' as const,
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    rotation: 0,
    opacity: 1,
    zIndex: 5,
    visible: true,
    borderColor: '#FF1E1E',
    borderWidth: 3,
  };

  // Interactive DOM preview styles
  const rectPreview = getShapePreviewStyle(rectLayer);
  assert.equal(rectPreview.backgroundColor, '#FF1E1E');
  assert.equal(rectPreview.border, 'none');
  assert.equal(rectPreview.borderRadius, '0px');
  const framePreview = getShapePreviewStyle(frameLayer);
  assert.equal(framePreview.backgroundColor, 'transparent');
  assert.equal(framePreview.border, '2px solid #2E2E2E');
  const circlePreview = getShapePreviewStyle(circleLayer);
  assert.equal(circlePreview.borderRadius, '9999px');

  // SVG export markup
  const rectSvg = renderShapeToSvgString(rectLayer, 1080, 1350);
  assert.ok(rectSvg.includes('<rect'));
  assert.ok(rectSvg.includes('fill="#FF1E1E"'));
  assert.ok(rectSvg.includes('opacity="0.85"'));
  assert.ok(rectSvg.includes('rotate(15'));
  assert.ok(!rectSvg.includes('stroke="#FFFFFF"'), 'Filled rectangle without borderColor must not emit a white outline stroke');

  const frameSvg = renderShapeToSvgString(frameLayer, 1080, 1350);
  const lineSvg = renderShapeToSvgString(lineLayer, 1080, 1350);
  const circleSvg = renderShapeToSvgString(circleLayer, 1080, 1350);
  assert.ok(frameSvg.includes('<rect') && frameSvg.includes('fill="none"'));
  assert.ok(lineSvg.includes('<line'));
  assert.ok(circleSvg.includes('<circle'));

  // Canvas 2D draw calls (used by PNG/JPEG raster export)
  const calls: { op: string; fillStyle: unknown; strokeStyle: unknown; args: number[] }[] = [];
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ op: 'fillRect', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [x, y, w, h] });
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      calls.push({ op: 'strokeRect', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [x, y, w, h] });
    },
    beginPath() {
      calls.push({ op: 'beginPath', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [] });
    },
    moveTo(x: number, y: number) {
      calls.push({ op: 'moveTo', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [x, y] });
    },
    lineTo(x: number, y: number) {
      calls.push({ op: 'lineTo', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [x, y] });
    },
    arc(x: number, y: number, r: number) {
      calls.push({ op: 'arc', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [x, y, r] });
    },
    fill() {
      calls.push({ op: 'fill', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [] });
    },
    stroke() {
      calls.push({ op: 'stroke', fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, args: [] });
    },
  };

  drawShapeOnCanvas2D(mockCtx, rectLayer, 1080, 1350);
  const fillCall = calls.find(c => c.op === 'fillRect');
  assert.ok(fillCall, 'Rectangle must call ctx.fillRect');
  assert.equal(fillCall?.fillStyle, '#FF1E1E');
  assert.equal(calls.filter(c => c.op === 'strokeRect').length, 0);

  drawShapeOnCanvas2D(mockCtx, frameLayer, 1080, 1350);
  drawShapeOnCanvas2D(mockCtx, lineLayer, 1080, 1350);
  drawShapeOnCanvas2D(mockCtx, circleLayer, 1080, 1350);
  assert.ok(calls.some(c => c.op === 'strokeRect'));
  assert.ok(calls.some(c => c.op === 'lineTo'));
  assert.ok(calls.some(c => c.op === 'arc'));

  assert.ok(designCanvasSrc.includes('getShapePreviewStyle'));
  assert.ok(designCanvasSrc.includes('renderShapeToSvgString'));
  assert.ok(designCanvasSrc.includes('drawShapeOnCanvas2D'));

  // 8. BUG 2 Verification — Asynchronous Save/Export Failure Propagation & Orphaned Storage Rollback
  console.log('[TEST 8] BUG 2: Failed Storage/Firestore saves reject and roll back orphaned uploads');
  const baseDraft = {
    title: 'Rollback Verification Asset',
    categoryArea: 'Social Media' as const,
    topic: 'Creative production ecosystem',
    contentPillarId: 'pillar-brand-awareness',
    contentPillarName: 'Brand Awareness',
    contentType: 'Single-image post' as const,
    targetAudience: 'All Audiences' as const,
    platform: baseTemplate.platform,
    formatId: baseTemplate.formatId,
    formatLabel: 'Instagram Feed Portrait (4:5)',
    dimensions: '1080×1350px',
    description: 'Test',
    caption: 'Cap',
    callToAction: 'Learn More',
    hashtags: ['#KeedoHub'],
    tags: ['test'],
    status: 'Draft' as const,
    createdBy: 'admin-uid-1',
    updatedBy: 'admin-uid-1',
  };
  const igFormat = getFormatSpecById('ig-feed-portrait');

  // Case A: 2nd upload fails -> 1st uploaded file must be rolled back & error must reject
  const rollbackPathsA: string[] = [];
  let uploadCountA = 0;
  await assert.rejects(
    async () => {
      await exportAndSaveCanvasToBrandRoom(
        {
          draftMetadata: baseDraft,
          design: baseDesign,
          format: igFormat,
          includePdf: false,
          actorUid: 'admin-uid-1',
        },
        {
          generateAssetId: () => 'asset-fail-upload',
          renderRaster: async () => new Blob(['png-bytes'], { type: 'image/png' }),
          renderSvg: () => new Blob(['<svg></svg>'], { type: 'image/svg+xml' }),
          uploadFile: async p => {
            uploadCountA += 1;
            if (uploadCountA === 2) {
              throw new Error('storage/unauthorized: SVG upload rejected');
            }
            return {
              id: `f-${uploadCountA}`,
              label: p.label,
              fileName: p.fileName,
              fileFormat: 'PNG',
              mimeType: 'image/png',
              storagePath: `brand-room/assets/${p.assetId}/exports/v1/${p.fileName}`,
              downloadUrl: 'https://example.invalid/mock.png',
              fileSizeBytes: 100,
              version: p.version,
              uploadedAt: new Date().toISOString(),
              uploadedBy: p.uploadedBy,
            };
          },
          saveAsset: async () => {
            throw new Error('Should not reach Firestore when Storage upload fails');
          },
          deleteStoragePath: async pathArg => {
            if (pathArg) rollbackPathsA.push(pathArg);
          },
        },
      );
    },
    /storage\/unauthorized/,
  );
  assert.equal(rollbackPathsA.length, 1, 'First uploaded Storage file must be cleaned up when 2nd upload fails');

  // Case B: All Storage uploads succeed, then Firestore saveMarketingAsset rejects -> ALL 3 files cleaned up
  const rollbackPathsB: string[] = [];
  let uploadCountB = 0;
  await assert.rejects(
    async () => {
      await exportAndSaveCanvasToBrandRoom(
        {
          draftMetadata: baseDraft,
          design: baseDesign,
          format: igFormat,
          includePdf: false,
          actorUid: 'admin-uid-1',
        },
        {
          generateAssetId: () => 'asset-fail-firestore',
          renderRaster: async () => new Blob(['png-bytes'], { type: 'image/png' }),
          renderSvg: () => new Blob(['<svg></svg>'], { type: 'image/svg+xml' }),
          uploadFile: async p => {
            uploadCountB += 1;
            return {
              id: `f-${uploadCountB}`,
              label: p.label,
              fileName: p.fileName,
              fileFormat: 'PNG',
              mimeType: 'image/png',
              storagePath: `brand-room/assets/${p.assetId}/${p.isEditableSource ? 'sources' : 'exports'}/v1/${p.fileName}`,
              downloadUrl: `https://example.invalid/${p.fileName}`,
              fileSizeBytes: 100,
              version: p.version,
              uploadedAt: new Date().toISOString(),
              uploadedBy: p.uploadedBy,
            };
          },
          saveAsset: async () => {
            throw new Error('PERMISSION_DENIED: Firestore write denied');
          },
          deleteStoragePath: async pathArg => {
            if (pathArg) rollbackPathsB.push(pathArg);
          },
        },
      );
    },
    /PERMISSION_DENIED/,
  );
  assert.equal(rollbackPathsB.length, 3, 'All 3 newly uploaded Storage files must be rolled back on Firestore failure');

  // Case C: Full success resolves with saved asset and zero rollbacks
  const rollbackPathsC: string[] = [];
  let uploadCountC = 0;
  const okResult = await exportAndSaveCanvasToBrandRoom(
    {
      draftMetadata: baseDraft,
      design: baseDesign,
      format: igFormat,
      includePdf: false,
      actorUid: 'admin-uid-1',
    },
    {
      generateAssetId: () => 'asset-success',
      renderRaster: async () => new Blob(['png-bytes'], { type: 'image/png' }),
      renderSvg: () => new Blob(['<svg></svg>'], { type: 'image/svg+xml' }),
      uploadFile: async p => {
        uploadCountC += 1;
        return {
          id: `f-${uploadCountC}`,
          label: p.label,
          fileName: p.fileName,
          fileFormat: 'PNG',
          mimeType: 'image/png',
          storagePath: `brand-room/assets/${p.assetId}/exports/v1/${p.fileName}`,
          downloadUrl: `https://example.invalid/${p.fileName}`,
          fileSizeBytes: 100,
          version: p.version,
          uploadedAt: new Date().toISOString(),
          uploadedBy: p.uploadedBy,
        };
      },
      saveAsset: async payload => ({
        ...payload,
        id: payload.id || 'asset-success',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      }),
      deleteStoragePath: async pathArg => {
        if (pathArg) rollbackPathsC.push(pathArg);
      },
    },
  );
  assert.equal(okResult.id, 'asset-success');
  assert.equal(okResult.exportedFiles.length, 3);
  assert.equal(rollbackPathsC.length, 0);

  // Confirm BrandRoom re-throws error in onSaveAsWorkingAsset and shows inline canvasError in fullscreen overlay
  assert.ok(brandRoomSrc.includes('throw err;'), 'BrandRoom must re-throw save/export errors instead of swallowing');
  assert.ok(brandRoomSrc.includes('Export / Save Error:'), 'BrandRoom fullscreen overlay must render canvasError directly');
  assert.ok(designCanvasSrc.includes("toastType === 'error'"), 'DesignCanvasEditor must support error toast styling');

  // 9. Official Red-K Brand Logo Asset & Cross-App Integration
  console.log('[TEST 9] Official Red-K KH brand logo file and integration verification');
  const logoFile = path.join(root, 'src/assets/images/keedohub_brand_logo_1795340542093.jpg');
  assert.ok(fs.existsSync(logoFile) && fs.statSync(logoFile).size > 5000, 'Generated Red-K KH logo JPG must exist');
  const logoConsumers = [
    'src/components/public/PublicHeader.tsx',
    'src/components/public/PublicFooter.tsx',
    'src/components/brand/KeedohubLogo.tsx',
    'src/components/brand/LogoSystem.tsx',
    'src/components/admin/AdminHQ.tsx',
    'src/components/client/ClientWorkspace.tsx',
    'src/components/admin/brand-room/BrandRoom.tsx',
    'src/components/admin/brand-room/BrandIdentityPanel.tsx',
    'src/components/admin/brand-room/MarketingOverviewPanel.tsx',
    'src/lib/brandRoomStudio.ts',
  ];
  for (const relPath of logoConsumers) {
    const content = fs.readFileSync(path.join(root, relPath), 'utf8');
    assert.ok(
      content.includes('keedohub_brand_logo_1795340542093.jpg'),
      `${relPath} must reference the generated official Red-K brand logo`,
    );
    assert.ok(
      !content.includes('KEEDO<span'),
      `${relPath} must use white KEEDOHUB typography rather than coloring HUB red`,
    );
  }

  // 10. Collection 001 — Out-of-This-World Marketing Creative Production Verification
  console.log('[TEST 10] Collection 001 (12 artworks): headlines, plates, distinct layouts, SVG & multi-format adaptation');
  const {
    COLLECTION_001_MULTI_FORMAT_IDS,
    COLLECTION_001_SPECS,
    MARKETING_COLLECTION_001_NAME,
    MARKETING_COLLECTION_001_SERIES_ID,
  } = await import('../src/data/marketingCollection001');

  assert.equal(COLLECTION_001_SPECS.length, 12);
  assert.ok(
    DEFAULT_CONTENT_SERIES.some(
      s => s.id === MARKETING_COLLECTION_001_SERIES_ID && s.name === MARKETING_COLLECTION_001_NAME,
    ),
    'Collection 001 series must be registered in DEFAULT_CONTENT_SERIES',
  );

  const expectedHeadlines: Record<string, string> = {
    '01': 'WELCOME TO A DIFFERENT KIND OF CREATIVE WORLD.',
    '02': 'IDEAS ARE EVERYWHERE. EXECUTION CHANGES EVERYTHING.',
    '03': "WE'RE BUILDING A CREATIVE ECOSYSTEM.",
    '04': 'YOUR ART DESERVES A BIGGER WORLD.',
    '05': 'MAKE YOUR BRAND IMPOSSIBLE TO IGNORE.',
    '06': 'YOUR BUSINESS HAS A STORY. MAKE IT VISIBLE.',
    '07': 'FROM CONCEPT TO CREATION.',
    '08': 'CREATIVE TOOLS. REAL POSSIBILITIES.',
    '09': 'GOOD DESIGN GETS ATTENTION. GREAT EXECUTION EARNS TRUST.',
    '10': 'STOP DESIGNING LIKE EVERYONE ELSE.',
    '11': "DON'T JUST MAKE CONTENT. MAKE SOMETHING THAT MATTERS.",
    '12': 'THE FUTURE IS CREATED. NOT COPIED.',
  };

  const uniquePlates = new Set<string>();
  const uniqueArchetypes = new Set<string>();
  const portraitFmt = getFormatSpecById('ig-feed-portrait');

  for (const spec of COLLECTION_001_SPECS) {
    assert.equal(spec.headlineExact, expectedHeadlines[spec.number]);
    uniquePlates.add(spec.plateImage);
    uniqueArchetypes.add(spec.compositionArchetype);

    const master = spec.buildPortraitMaster(portraitFmt);
    assert.equal(master.width, 1080);
    assert.equal(master.height, 1350);
    assert.equal(master.templateFamily, MARKETING_COLLECTION_001_NAME);
    assert.ok(
      master.elements.some(el => el.type === 'image' && el.id.endsWith('-logo')),
      `Collection 001 piece ${spec.number} must include the official Red-K brand logo`,
    );

    // Check full headline words exist across text layers cleanly
    const combinedText = master.elements
      .filter(el => el.type === 'text' && el.text)
      .map(el => el.text!.replace(/\s+/g, ' ').trim())
      .join(' ');
    for (const token of spec.headlineExact.split(/\s+/)) {
      assert.ok(
        combinedText.includes(token),
        `Piece ${spec.number} missing headline word "${token}" inside CanvasDesign text layers`,
      );
    }

    // Verify real editable SVG output at 1080x1350
    const svg = renderCanvasDesignToSvgString(master);
    assert.ok(svg.startsWith('<svg') && svg.includes('width="1080"') && svg.includes('height="1350"'));
    assert.ok(svg.includes('#FF1E1E'), `Piece ${spec.number} SVG must feature KeedoHub Signal Red accent`);

    // Verify all 7 multi-format safe-zone adaptations keep text safely bounded
    for (const fmtId of COLLECTION_001_MULTI_FORMAT_IDS) {
      const targetFmt = getFormatSpecById(fmtId);
      const adapted = adaptCanvasDesignToFormat(master, targetFmt);
      assert.equal(adapted.width, targetFmt.width);
      assert.equal(adapted.height, targetFmt.height);
      const minX = targetFmt.safeAreaSidePct;
      const maxX = 100 - targetFmt.safeAreaSidePct;
      const minY = targetFmt.safeAreaTopPct;
      const maxY = 100 - targetFmt.safeAreaBottomPct;
      for (const el of adapted.elements) {
        if (el.type === 'text') {
          assert.ok(el.x >= minX && el.x <= maxX, `${spec.number} text ${el.id} X out of safe zone in ${fmtId}`);
          assert.ok(el.y >= minY && el.y <= maxY, `${spec.number} text ${el.id} Y out of safe zone in ${fmtId}`);
        }
      }
    }
  }

  assert.equal(uniquePlates.size, 12, 'All 12 Collection 001 artworks must use 12 distinct generated visual plates');
  assert.equal(uniqueArchetypes.size, 12, 'All 12 Collection 001 artworks must use 12 distinct composition archetypes');

  // Verify every generated Collection 001 JPEG plate exists cleanly on disk
  const assetDir = path.join(root, 'src/assets/images');
  const plateFiles = fs.readdirSync(assetDir).filter(f => f.startsWith('kh_') && f.endsWith('.jpg'));
  assert.equal(plateFiles.length, 12, 'All 12 generated kh_*.jpg campaign plates must exist in src/assets/images');

  console.log('ALL BRAND ROOM UNIT, CANVAS BUG FIX, COLLECTION 001 & LOGO INTEGRATION TESTS PASSED.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
