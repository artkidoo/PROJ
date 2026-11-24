/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Phase 1 Account Normalization & Legacy Compatibility Unit Tests
 */

import assert from 'node:assert/strict';
import {
  inspectAccountType,
  normalizeAccountType,
  normalizeWorkspaceType,
  normalizeClientCategory,
  runAccountNormalizationDryRun,
} from '../src/lib/accountNormalization';
import { resolveClientExperience } from '../src/lib/clientOS';

function runTests() {
  // 1. Canonical Account Types
  assert.equal(normalizeAccountType('Artist'), 'Artist');
  assert.equal(normalizeAccountType('artist'), 'Artist');
  assert.equal(normalizeAccountType('ARTIST'), 'Artist');
  assert.equal(normalizeAccountType('Brand'), 'Brand');
  assert.equal(normalizeAccountType('brand'), 'Brand');
  assert.equal(normalizeAccountType('BRAND'), 'Brand');

  // 2. Historical Account Normalization to Brand
  const historicalTypes = [
    'Company',
    'business',
    'LABEL',
    'Agency',
    'Enterprise',
    'personal',
    'Startup',
    'Corporation',
    'Commercial',
  ];
  for (const h of historicalTypes) {
    assert.equal(
      normalizeAccountType(h),
      'Brand',
      `Historical account type "${h}" must normalize to "Brand"`,
    );
  }

  // 3. Unknown / Invalid Values Fallback safely to Brand without mutating input
  assert.equal(normalizeAccountType(''), 'Brand');
  assert.equal(normalizeAccountType(null), 'Brand');
  assert.equal(normalizeAccountType(undefined), 'Brand');
  assert.equal(normalizeAccountType('UnknownRole123'), 'Brand');

  // 4. Safe inspection preserves unknown raw input and routes via valid workspaceType
  const unknownNoWorkspace = inspectAccountType('UnknownRole123');
  assert.equal(unknownNoWorkspace.rawInput, 'UnknownRole123');
  assert.equal(unknownNoWorkspace.canonicalType, 'Brand');
  assert.equal(unknownNoWorkspace.isUnknownOrEmpty, true);
  assert.equal(unknownNoWorkspace.isKnownCanonical, false);
  assert.ok(unknownNoWorkspace.warning?.includes('preserved without overwrite'));

  const unknownOnArtistWorkspace = inspectAccountType('UnknownJunk', 'Artist');
  assert.equal(unknownOnArtistWorkspace.rawInput, 'UnknownJunk');
  assert.equal(unknownOnArtistWorkspace.canonicalType, 'Artist');
  assert.equal(unknownOnArtistWorkspace.isUnknownOrEmpty, true);
  assert.ok(unknownOnArtistWorkspace.warning?.includes('Artist'));

  const conflictCheck = inspectAccountType('Artist', 'Business');
  assert.equal(conflictCheck.hasWorkspaceConflict, true);
  assert.equal(conflictCheck.canonicalType, 'Artist');
  assert.ok(conflictCheck.warning?.includes('conflicts'));

  // 5. Workspace & Client Category Normalization
  assert.equal(normalizeWorkspaceType('Company'), 'Brand');
  assert.equal(normalizeWorkspaceType('Artist'), 'Artist');
  assert.equal(normalizeClientCategory('Business'), 'brand');
  assert.equal(normalizeClientCategory('artist'), 'artist');

  // 6. Dual-Read Workspace Experience Resolution
  const artistExp = resolveClientExperience('Artist', 'Artist');
  assert.equal(artistExp.osMode, 'artist');
  assert.equal(artistExp.isArtist, true);

  const brandExp = resolveClientExperience('Brand', 'Brand');
  assert.equal(brandExp.osMode, 'brand');
  assert.equal(brandExp.isArtist, false);

  // Historical Company / Business / Personal resolves to Brand OS
  const companyExp = resolveClientExperience('Company', 'Business');
  assert.equal(companyExp.osMode, 'brand');
  assert.equal(companyExp.isArtist, false);

  const personalExp = resolveClientExperience(null, 'Personal');
  assert.equal(personalExp.osMode, 'brand');
  assert.equal(personalExp.isArtist, false);

  const unknownArtistWsExp = resolveClientExperience('UnknownJunk', 'Artist');
  assert.equal(unknownArtistWsExp.osMode, 'artist');
  assert.equal(unknownArtistWsExp.isArtist, true);
  assert.ok(unknownArtistWsExp.accountTypeWarning?.includes('UnknownJunk'));

  // 7. Dry-Run Migration Report Statistics (clean historical batch vs flagged unknown/conflict batch)
  const cleanHistoricalBatch = [
    { id: '1', accountType: 'Artist' },
    { id: '2', accountType: 'Brand' },
    { id: '3', accountType: 'Company' },
    { id: '4', type: 'Business' },
    { id: '5', clientCategory: 'label' },
    { id: '6', accountType: 'Personal' },
    { id: '7', accountType: 'Startup' },
    { id: '8', accountType: 'Corporation' },
    { id: '9', accountType: 'Commercial' },
  ];
  const cleanReport = runAccountNormalizationDryRun(cleanHistoricalBatch);
  assert.equal(cleanReport.totalInspected, 9);
  assert.equal(cleanReport.artistCount, 1);
  assert.equal(cleanReport.brandCount, 1);
  assert.equal(cleanReport.historicalCompanyCount, 1);
  assert.equal(cleanReport.historicalBusinessCount, 1);
  assert.equal(cleanReport.historicalLabelCount, 1);
  assert.equal(cleanReport.historicalPersonalCount, 1);
  assert.equal(cleanReport.historicalOtherAliasCount, 3);
  assert.equal(cleanReport.unknownValuesCount, 0);
  assert.equal(cleanReport.conflictCount, 0);
  assert.equal(cleanReport.recordsNeedingNormalization, 7);
  assert.equal(cleanReport.safeToMigrate, true);

  const flaggedBatch = [
    ...cleanHistoricalBatch,
    { id: '10', accountType: 'MysteryTier' },
    { id: '11', accountType: 'Artist', type: 'Business' },
  ];
  const flaggedReport = runAccountNormalizationDryRun(flaggedBatch);
  assert.equal(flaggedReport.unknownValuesCount, 1);
  assert.equal(flaggedReport.conflictCount, 1);
  assert.equal(flaggedReport.safeToMigrate, false);
  assert.equal(flaggedReport.flaggedRecords.length, 2);

  console.log('ALL PHASE 1 ACCOUNT NORMALIZATION UNIT TESTS PASSED');
}

runTests();
