/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS, Transparent Logo & Dynamic Journal Unit & Integration Tests
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    slugifyTitle,
    ensureUniqueSlug,
    calculateReadingTimeMinutes,
    parseJournalContentBlocks,
    repairNavigationConfig,
    findMediaAssetUsages,
  } = await import('../src/lib/websiteCms');

  console.log('------------------------------------------------------------');
  console.log('KEEDOHUB — WEBSITE CMS & JOURNAL UNIT & INTEGRATION TESTS');
  console.log('------------------------------------------------------------');

  // Test 1: Transparent logo master PNG assets exist and no black JPEG logo remains in src
  const logoMarkPath = path.resolve(__dirname, '../src/assets/images/keedohub_mark_transparent.png');
  const logoTextPath = path.resolve(__dirname, '../src/assets/images/keedohub_logo_transparent.png');
  assert(fs.existsSync(logoMarkPath), 'Transparent mark PNG must exist');
  assert(fs.existsSync(logoTextPath), 'Transparent wordmark PNG must exist');

  const srcDir = path.resolve(__dirname, '../src');
  function walkDir(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walkDir(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  const allSrcFiles = walkDir(srcDir);
  let oldLogoOccurrences = 0;
  allSrcFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('keedohub_brand_logo_1795340542093.jpg')) {
      oldLogoOccurrences++;
    }
  });
  assert.strictEqual(oldLogoOccurrences, 0, 'Zero occurrences of black JPEG logo should remain in src');
  console.log('[TEST 1] Transparent logo master assets verified & zero black boxes in src');

  // Test 2: Slugify & Unique Slug generation
  const rawTitle = 'Designing A Release Identity That Travels Beyond The Cover!';
  const slug = slugifyTitle(rawTitle);
  assert.strictEqual(slug, 'designing-a-release-identity-that-travels-beyond-the-cover');

  const uniqueSlug = ensureUniqueSlug(
    'designing-a-release-identity-that-travels-beyond-the-cover',
    [{ id: '1', slug: 'designing-a-release-identity-that-travels-beyond-the-cover' }],
    '2',
  );
  assert.strictEqual(uniqueSlug, 'designing-a-release-identity-that-travels-beyond-the-cover-2');
  console.log('[TEST 2] Slugify and unique slug disambiguation passed');

  // Test 3: Reading Time calculation
  const sampleText = 'Word '.repeat(450); // 450 words -> ~2 minutes at 225 wpm
  const rTime = calculateReadingTimeMinutes(sampleText);
  assert(rTime >= 2, 'Reading time should be at least 2 minutes');
  console.log(`[TEST 3] Reading time calculation passed (${rTime} min)`);

  // Test 4: Markdown Content Block AST Parser
  const sampleMd = `## Introduction to Studio Craft\n\nThis is a leading paragraph.\n\n> Important quote about identity design.\n\n- Bullet item one\n- Bullet item two\n\n![Studio Desk](https://example.com/desk.jpg)`;
  const blocks = parseJournalContentBlocks(sampleMd);
  assert(blocks.length >= 5, 'Parser should extract heading, paragraph, quote, list, and image blocks');
  assert.strictEqual(blocks[0].type, 'heading2');
  assert.strictEqual(blocks[2].type, 'blockquote');
  assert.strictEqual(blocks[3].type, 'bullet_list');
  assert.strictEqual(blocks[4].type, 'image');
  console.log('[TEST 4] Markdown content block AST parser passed');

  // Test 5: Navigation Safeguard
  const repaired = repairNavigationConfig({
    headerItems: [{ id: 'custom', label: 'Custom', route: 'about', visible: true, order: 1, location: 'header' }],
    mobileItems: [],
    footerColumns: [],
    primaryCtaLabel: 'Brief',
    primaryCtaRoute: 'contact',
    updatedAt: new Date().toISOString(),
    updatedBy: 'test',
  });
  assert(
    repaired.headerItems.some(i => i.route === 'contact'),
    'Navigation safeguard must ensure contact route is never dropped',
  );
  console.log('[TEST 5] Navigation recovery safeguard passed');

  // Test 6: Media Asset Usage Detection
  const usages = findMediaAssetUsages('https://example.com/hero.jpg', {
    homepage: {
      id: 'homepage',
      heroKicker: '',
      heroHeadline: '',
      heroSubheadline: '',
      heroPrimaryCtaLabel: '',
      heroPrimaryCtaTarget: '#ecosystem',
      heroSecondaryCtaLabel: '',
      heroSecondaryCtaTarget: 'register',
      heroTertiaryCtaLabel: '',
      heroTertiaryCtaTarget: 'contact',
      heroBackgroundImageUrl: 'https://example.com/hero.jpg',
      heroVisualLeftLabel: '',
      heroVisualLeftTitle: '',
      heroVisualLeftImageUrl: '',
      heroVisualLeftAlt: '',
      heroVisualRightLabel: '',
      heroVisualRightTitle: '',
      heroVisualRightImageUrl: '',
      heroVisualRightAlt: '',
      ecosystemHeading: '',
      ecosystemDescription: '',
      servicesHeading: '',
      showcaseHeading: '',
      showcaseDescription: '',
      featuredPortfolioIds: [],
      featuredArtistIds: [],
      featuredServiceIds: [],
      featuredJournalSlugs: [],
      processHeading: '',
      processDescription: '',
      studioHeading: '',
      studioDescription: '',
      communityHeading: '',
      journalHeading: '',
      packagesHeading: '',
      testimonialsHeading: '',
      testimonials: [],
      ctaHeading: '',
      ctaDescription: '',
      ctaPrimaryLabel: '',
      ctaSecondaryLabel: '',
      sectionVisibility: {
        ecosystem: true,
        services: true,
        showcase: true,
        process: true,
        studio: true,
        community: true,
        testimonials: true,
        journal: true,
        packages: true,
        cta: true,
      },
      sectionOrder: [],
      updatedAt: '',
      updatedBy: '',
    },
  });
  assert(usages.includes('Homepage Hero Background'), 'Should detect hero background usage');
  console.log('[TEST 6] Media usage detection passed');

  console.log('------------------------------------------------------------');
  console.log('ALL WEBSITE CMS & JOURNAL UNIT & INTEGRATION TESTS PASSED.');
  console.log('------------------------------------------------------------');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
