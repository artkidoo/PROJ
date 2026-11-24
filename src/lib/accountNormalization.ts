/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Canonical Account Type Normalization & Compatibility Bridge
 */

export type CanonicalAccountType = 'Artist' | 'Brand';
export type CanonicalWorkspaceType = 'Artist' | 'Brand';
export type CanonicalClientCategory = 'artist' | 'brand';

export interface NormalizationInspectionResult {
  rawInput: string;
  canonicalType: CanonicalAccountType;
  wasLegacy: boolean;
  isKnownCanonical: boolean;
  isUnknownOrEmpty: boolean;
  hasWorkspaceConflict: boolean;
  legacyCategory?: string;
  warning?: string;
}

const KNOWN_HISTORICAL_BRAND_ALIASES = new Set([
  'company',
  'business',
  'label',
  'enterprise',
  'agency',
  'personal',
  'startup',
  'corporation',
  'commercial',
]);

function classifyRawType(rawType?: string | null): {
  rawInput: string;
  lower: string;
  kind: 'canonical-artist' | 'canonical-brand' | 'legacy-brand' | 'empty' | 'unknown';
  canonicalType: CanonicalAccountType;
} {
  if (!rawType || typeof rawType !== 'string') {
    return { rawInput: '', lower: '', kind: 'empty', canonicalType: 'Brand' };
  }
  const cleaned = rawType.trim();
  const lower = cleaned.toLowerCase();
  if (!lower) {
    return { rawInput: cleaned, lower: '', kind: 'empty', canonicalType: 'Brand' };
  }
  if (lower === 'artist') {
    return { rawInput: cleaned, lower, kind: 'canonical-artist', canonicalType: 'Artist' };
  }
  if (lower === 'brand') {
    return { rawInput: cleaned, lower, kind: 'canonical-brand', canonicalType: 'Brand' };
  }
  if (KNOWN_HISTORICAL_BRAND_ALIASES.has(lower)) {
    return { rawInput: cleaned, lower, kind: 'legacy-brand', canonicalType: 'Brand' };
  }
  return { rawInput: cleaned, lower, kind: 'unknown', canonicalType: 'Brand' };
}

/**
 * Inspects an account type (and optional workspace type) without mutating stored input.
 * Safely resolves canonical 'Artist' | 'Brand' while reporting legacy aliases, empty/unknown inputs,
 * and cross-field conflicts so unknown values on an Artist workspace do not misroute into Brand OS.
 */
export function inspectAccountType(
  rawType?: string | null,
  workspaceType?: string | null,
): NormalizationInspectionResult {
  const account = classifyRawType(rawType);
  const workspace = classifyRawType(workspaceType);
  const hasWorkspaceInput = workspace.kind !== 'empty';
  const hasAccountInput = account.kind !== 'empty';

  const isUnknownOrEmpty = account.kind === 'empty' || account.kind === 'unknown';
  const isKnownCanonical = account.kind === 'canonical-artist' || account.kind === 'canonical-brand';
  const wasLegacy = account.kind === 'legacy-brand';

  let canonicalType: CanonicalAccountType = account.canonicalType;
  let hasWorkspaceConflict = false;
  let warning: string | undefined;

  if (isUnknownOrEmpty && hasWorkspaceInput && workspace.kind !== 'unknown') {
    canonicalType = workspace.canonicalType;
    if (account.kind === 'unknown') {
      warning = `Unrecognized accountType "${account.rawInput}" preserved without overwrite; routed via workspace type "${workspace.rawInput}".`;
    }
  } else if (account.kind === 'unknown') {
    warning = `Unrecognized accountType "${account.rawInput}" preserved without overwrite; safely defaulting experience to Brand.`;
  } else if (
    hasAccountInput &&
    hasWorkspaceInput &&
    workspace.kind !== 'unknown' &&
    account.canonicalType !== workspace.canonicalType
  ) {
    hasWorkspaceConflict = true;
    warning = `Account type "${account.rawInput}" (${account.canonicalType}) conflicts with workspace type "${workspace.rawInput}" (${workspace.canonicalType}).`;
  }

  return {
    rawInput: account.rawInput,
    canonicalType,
    wasLegacy,
    isKnownCanonical,
    isUnknownOrEmpty,
    hasWorkspaceConflict,
    ...(wasLegacy ? { legacyCategory: account.lower } : {}),
    ...(warning ? { warning } : {}),
  };
}

/**
 * Normalizes any historical or new account type string into KeedoHub's two canonical types: 'Artist' or 'Brand'.
 * Mapping rules:
 * - 'Artist', 'artist', 'ARTIST' -> 'Artist'
 * - 'Brand', 'brand', 'BRAND' -> 'Brand'
 * - 'Company', 'Business', 'Label', 'Agency', 'Enterprise', 'Personal', 'Startup', 'Corporation', 'Commercial' -> 'Brand'
 * - Unknown / empty / invalid -> fallback safely to 'Brand' (preserving secure fallback without granting admin/privileged access).
 */
export function normalizeAccountType(rawType?: string | null): CanonicalAccountType {
  return classifyRawType(rawType).canonicalType;
}

/**
 * Normalizes workspace type into canonical 'Artist' or 'Brand'.
 */
export function normalizeWorkspaceType(rawType?: string | null): CanonicalWorkspaceType {
  return normalizeAccountType(rawType);
}

/**
 * Normalizes client category into canonical 'artist' or 'brand'.
 */
export function normalizeClientCategory(rawCategory?: string | null): CanonicalClientCategory {
  const canonical = normalizeAccountType(rawCategory);
  return canonical === 'Artist' ? 'artist' : 'brand';
}

/**
 * Dry-run migration inspector report generator for legacy accounts & workspaces.
 */
export interface MigrationFlaggedRecord {
  id: string;
  reason: 'empty' | 'unknown' | 'conflict';
  accountType?: string;
  type?: string;
  clientCategory?: string;
  details: string;
}

export interface MigrationDryRunReport {
  totalInspected: number;
  artistCount: number;
  brandCount: number;
  historicalCompanyCount: number;
  historicalBusinessCount: number;
  historicalLabelCount: number;
  historicalAgencyCount: number;
  historicalEnterpriseCount: number;
  historicalPersonalCount: number;
  historicalOtherAliasCount: number;
  unknownValuesCount: number;
  conflictCount: number;
  normalizedToArtist: number;
  normalizedToBrand: number;
  recordsNeedingNormalization: number;
  flaggedRecords: MigrationFlaggedRecord[];
  safeToMigrate: boolean;
}

export function runAccountNormalizationDryRun(
  records: Array<{ id: string; accountType?: string; type?: string; clientCategory?: string }>
): MigrationDryRunReport {
  let artistCount = 0;
  let brandCount = 0;
  let historicalCompanyCount = 0;
  let historicalBusinessCount = 0;
  let historicalLabelCount = 0;
  let historicalAgencyCount = 0;
  let historicalEnterpriseCount = 0;
  let historicalPersonalCount = 0;
  let historicalOtherAliasCount = 0;
  let unknownValuesCount = 0;
  let conflictCount = 0;
  let normalizedToArtist = 0;
  let normalizedToBrand = 0;
  let recordsNeedingNormalization = 0;
  const flaggedRecords: MigrationFlaggedRecord[] = [];

  for (const rec of records) {
    const presentFields = [rec.accountType, rec.type, rec.clientCategory]
      .map(value => classifyRawType(value))
      .filter(info => info.kind !== 'empty');

    const knownCanonicals = new Set(
      presentFields
        .filter(info => info.kind !== 'unknown')
        .map(info => info.canonicalType),
    );
    const hasConflict = knownCanonicals.size > 1;
    if (hasConflict) {
      conflictCount++;
      flaggedRecords.push({
        id: rec.id,
        reason: 'conflict',
        accountType: rec.accountType,
        type: rec.type,
        clientCategory: rec.clientCategory,
        details: 'Record fields resolve to conflicting canonical client types (Artist vs Brand).',
      });
    }

    const primaryRaw = rec.accountType ?? rec.type ?? rec.clientCategory ?? '';
    const primary = classifyRawType(primaryRaw);

    if (primary.kind === 'canonical-artist') {
      artistCount++;
      normalizedToArtist++;
    } else {
      if (primary.kind === 'canonical-brand') {
        brandCount++;
      } else if (primary.lower === 'company') {
        historicalCompanyCount++;
        recordsNeedingNormalization++;
      } else if (primary.lower === 'business') {
        historicalBusinessCount++;
        recordsNeedingNormalization++;
      } else if (primary.lower === 'label') {
        historicalLabelCount++;
        recordsNeedingNormalization++;
      } else if (primary.lower === 'agency') {
        historicalAgencyCount++;
        recordsNeedingNormalization++;
      } else if (primary.lower === 'enterprise') {
        historicalEnterpriseCount++;
        recordsNeedingNormalization++;
      } else if (primary.lower === 'personal') {
        historicalPersonalCount++;
        recordsNeedingNormalization++;
      } else if (primary.kind === 'legacy-brand') {
        historicalOtherAliasCount++;
        recordsNeedingNormalization++;
      } else {
        unknownValuesCount++;
        recordsNeedingNormalization++;
        flaggedRecords.push({
          id: rec.id,
          reason: primary.kind === 'empty' ? 'empty' : 'unknown',
          accountType: rec.accountType,
          type: rec.type,
          clientCategory: rec.clientCategory,
          details:
            primary.kind === 'empty'
              ? 'Missing accountType/type/clientCategory; requires manual verification before backfill.'
              : `Unrecognized value "${primary.rawInput}"; preserved for review instead of automatic overwrite.`,
        });
      }
      normalizedToBrand++;
    }
  }

  return {
    totalInspected: records.length,
    artistCount,
    brandCount,
    historicalCompanyCount,
    historicalBusinessCount,
    historicalLabelCount,
    historicalAgencyCount,
    historicalEnterpriseCount,
    historicalPersonalCount,
    historicalOtherAliasCount,
    unknownValuesCount,
    conflictCount,
    normalizedToArtist,
    normalizedToBrand,
    recordsNeedingNormalization,
    flaggedRecords,
    safeToMigrate: unknownValuesCount === 0 && conflictCount === 0,
  };
}
