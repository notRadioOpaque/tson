// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

import type { TaggedValue } from '../types';

/**
 * Check if a value is a plain object (not null, not an array).
 *
 * @param value - Value to check.
 * @returns True if plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value looks like a tagged type (has $type and $value).
 *
 * @param value - Value to check.
 * @returns True if tagged.
 * @internal
 */
export function isTaggedValue(value: unknown): value is TaggedValue {
  if (!isPlainObject(value)) return false;
  return (
    typeof value['$type'] === 'string' && Object.prototype.hasOwnProperty.call(value, '$value')
  );
}
