import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';

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
  const { CREATIVE_CATALOG_SEEDS } = await import('../src/data/creativeCatalogSeeds');
  const { TEMPLATE_FAMILIES } = await import('../src/data/templateFamiliesData');
  const { MASTER_CREATIVE_TEMPLATES } = await import('../src/data/creativeTemplatesData');
  const { buildHonestDesignForTemplate } = await import('../src/utils/templateDesignBuilder');
  const {
    ARTIST_PRODUCT_FAMILIES,
    BRAND_BUSINESS_PRODUCT_FAMILIES,
    getProductDownloadStatusSummary,
    resolveProductFamily,
  } = await import('../src/lib/creativeProductAccess');
  const { ARTIST_CREATIVE_SERVICES, BRAND_BUSINESS_CREATIVE_SERVICES } = await import('../src/lib/clientOS');
  const {
    generateEditableProductSvgBlob,
    generateStructuredDocumentPdfBlob,
    packageProductDeliverablesZip,
    renderCanvasDesignToSvgString,
  } = await import('../src/lib/productPackager');

  // 1. Seed catalog size, uniqueness, and zero fake Storage paths
  assert.ok(CREATIVE_CATALOG_SEEDS.length >= 36, `Expected >= 36 comprehensive seeds, found ${CREATIVE_CATALOG_SEEDS.length}`);

  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const seed of CREATIVE_CATALOG_SEEDS) {
    assert.ok(!ids.has(seed.id), `Duplicate seed id: ${seed.id}`);
    assert.ok(!slugs.has(seed.slug), `Duplicate seed slug: ${seed.slug}`);
    ids.add(seed.id);
    slugs.add(seed.slug);
    assert.equal(seed.files.length, 0, `Seed ${seed.id} must not fabricate Storage files`);
    assert.ok(seed.previewImageUrl && !seed.previewImageUrl.startsWith('/images/'), `Seed ${seed.id} must reference real bundled asset`);
  }

  // 2. Verify every required Artist family & topic is present
  const artistSeeds = CREATIVE_CATALOG_SEEDS.filter(s => s.audience === 'Artist');
  for (const fam of ARTIST_PRODUCT_FAMILIES) {
    const inFam = artistSeeds.filter(s => resolveProductFamily(s) === fam.label);
    assert.ok(inFam.length >= 4, `Artist family "${fam.label}" needs rich coverage (found ${inFam.length})`);
  }
  const artistTopics = artistSeeds.map(s => `${s.title} ${s.subcategory}`.toLowerCase()).join(' | ');
  for (const kw of ['spotify', 'apple music', 'audiomack', 'boomplay', 'youtube music', 'milestone', 'pre-save', 'single', 'ep ', 'album', 'coming soon', 'out now', 'tracklist', 'countdown', 'music video', 'listening party', 'epk', 'media kit', 'biography', 'press release', 'identity', 'poster', 'tour', 'instagram', 'tiktok', 'story', 'lyric', 'quote', 'teaser', 'thumbnail']) {
    assert.ok(artistTopics.includes(kw), `Artist catalog missing expected coverage for "${kw}"`);
  }

  // 3. Verify every required Brand & Business family & topic is present
  const brandSeeds = CREATIVE_CATALOG_SEEDS.filter(s => s.audience === 'Brand & Business');
  for (const fam of BRAND_BUSINESS_PRODUCT_FAMILIES) {
    const inFam = brandSeeds.filter(s => resolveProductFamily(s) === fam.label);
    assert.ok(inFam.length >= 4, `Brand family "${fam.label}" needs rich coverage (found ${inFam.length})`);
  }
  const brandTopics = brandSeeds.map(s => `${s.title} ${s.subcategory}`.toLowerCase()).join(' | ');
  for (const kw of ['logo', 'guidelines', 'stationery', 'business card', 'letterhead', 'email signature', 'presentation', 'instagram', 'promotional', 'stories', 'product launch', 'testimonial', 'offer', 'company profile', 'proposal', 'quotation', 'invoice', 'receipt', 'pitch deck', 'brochure', 'business report', 'onboarding', 'flyer', 'poster', 'banner', 'catalogue', 'digital advertisement']) {
    assert.ok(brandTopics.includes(kw), `Brand & Business catalog missing expected coverage for "${kw}"`);
  }

  // 4. Verify Additional Creative Services cover 6 Artist + 6 Brand & Business offerings
  assert.equal(ARTIST_CREATIVE_SERVICES.length, 6, 'Expected 6 Artist Additional Creative Services');
  assert.equal(BRAND_BUSINESS_CREATIVE_SERVICES.length, 6, 'Expected 6 Brand & Business Additional Creative Services');

  // 5. Verify Template-to-Product & Document Packager produces real valid PDF, SVG & ZIP outputs
  const sampleSeed = {
    ...brandSeeds[0],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
  };

  const pdfBlob = generateStructuredDocumentPdfBlob(sampleSeed, 'Test Studio');
  assert.ok(pdfBlob.size > 1500, 'Generated PDF blob must contain real document content');
  const pdfHeader = await pdfBlob.slice(0, 5).text();
  assert.equal(pdfHeader, '%PDF-', 'Generated PDF blob must start with valid %PDF- header');

  const svgBlob = generateEditableProductSvgBlob(sampleSeed);
  const svgText = await svgBlob.text();
  assert.ok(svgText.startsWith('<svg') && svgText.includes('id="editable-headline"'), 'Editable SVG master must contain SVG markup & named layers');

  const famDesign = TEMPLATE_FAMILIES[0].design;
  const renderedSvg = renderCanvasDesignToSvgString(famDesign);
  assert.ok(renderedSvg.startsWith('<svg') && renderedSvg.includes(String(famDesign.width)), 'CanvasDesign SVG serializer must render real dimensions');

  const builtMaster = buildHonestDesignForTemplate(MASTER_CREATIVE_TEMPLATES[0]);
  assert.ok(builtMaster.elements.length > 0, 'Master template converter must produce drawable layers');

  const zipBlob = await packageProductDeliverablesZip({
    product: sampleSeed,
    designs: [famDesign],
    includeDocumentPdf: true,
    workspaceLabel: 'Test Studio',
  });
  assert.ok(zipBlob.size > 2000, 'Packaged ZIP archive must be non-empty');
  const zipMagic = new Uint8Array(await zipBlob.slice(0, 2).arrayBuffer());
  assert.deepEqual(Array.from(zipMagic), [0x50, 0x4b], 'Generated ZIP must start with PK archive signature');

  // 6. Verify clear client availability states (Free vs IncludedInPackage vs Assigned vs RequestRequired vs DownloadReady)
  const sampleWithFile = {
    ...sampleSeed,
    accessType: 'Free' as const,
    files: [
      {
        id: 'f-1',
        label: 'Master PDF',
        fileName: 'pack.pdf',
        fileFormat: 'PDF' as const,
        mimeType: 'application/pdf',
        storagePath: `products/${sampleSeed.id}/deliverables/f-1/pack.pdf`,
        fileSizeBytes: 51200,
        fileSizeLabel: '50.0 KB',
        version: 'v1.0',
        isApprovedForClient: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        uploadedBy: 'admin-1',
      },
    ],
  };
  const readySummary = getProductDownloadStatusSummary({
    product: sampleWithFile,
    clientBucket: 'Brand',
    workspaceId: 'ws-brand-1',
  });
  assert.equal(readySummary.state, 'download-ready');
  assert.equal(readySummary.approvedFilesCount, 1);

  const reqSummary = getProductDownloadStatusSummary({
    product: sampleSeed,
    clientBucket: 'Brand',
    workspaceId: 'ws-brand-1',
  });
  assert.equal(reqSummary.state, 'request-required');
  assert.equal(reqSummary.canDownload, false);

  // 7. Verify firestore.rules allowlist includes productFamily & responsive ClientCreativeHub has no horizontal carousel
  const rootDir = process.cwd();
  const rulesSrc = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  assert.ok(rulesSrc.includes("'productFamily'"), 'firestore.rules validCreativeProduct must allowlist productFamily');

  const clientHubSrc = fs.readFileSync(path.join(rootDir, 'src/components/client/ClientCreativeHub.tsx'), 'utf8');
  assert.ok(!clientHubSrc.includes('DesignCanvasEditor'), 'ClientCreativeHub must never import DesignCanvasEditor');
  assert.ok(!clientHubSrc.includes('snap-x'), 'ClientCreativeHub must not use horizontal snap carousels');

  console.log(`ALL PHASE 7 CATALOG, PACKAGER & CLIENT HUB UNIT TESTS PASSED (${CREATIVE_CATALOG_SEEDS.length} seeds verified)`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
