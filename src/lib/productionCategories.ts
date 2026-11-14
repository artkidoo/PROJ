import type { ClientProject } from '../types';

export const UNIFIED_PRODUCTION_CATEGORIES = [
  'Business Cards',
  'Brand Identity',
  'Streaming Pack',
  'Flyers & Posters',
  'Music Cover Artwork',
  'Artist Promotional Graphics',
  'Social Media Designs',
  '2D Animation',
  'Motion Graphics',
  'Video Production',
  'Other Creative Work',
] as const;

export type UnifiedProductionCategory = (typeof UNIFIED_PRODUCTION_CATEGORIES)[number];

export function defaultCategoryForAudience(isArtist: boolean): UnifiedProductionCategory {
  return isArtist ? 'Music Cover Artwork' : 'Brand Identity';
}

/**
 * Returns the canonical unified creative production categories first, followed
 * by any distinct legacy category strings found on historical project records
 * so existing projects remain filterable and editable without data migration.
 */
export function getCategoryOptionsForProjects(projects: Pick<ClientProject, 'category'>[]): string[] {
  const canonicalSet = new Set<string>(UNIFIED_PRODUCTION_CATEGORIES);
  const legacyExtras = Array.from(
    new Set(
      projects
        .map(project => (project.category || '').trim())
        .filter(category => category.length > 0 && !canonicalSet.has(category))
    )
  ).sort((a, b) => a.localeCompare(b));

  return [...UNIFIED_PRODUCTION_CATEGORIES, ...legacyExtras];
}

/**
 * Validates an optional YYYY-MM-DD calendar date (matching Cloud Functions optionalDate validation).
 */
export function isValidCalendarDate(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === trimmed;
}
