/**
 * JSON stringification utilities.
 *
 * @module
 */

import { isPlainObject } from './lib/utils';
import type { JsonValue } from './types';

/**
 * Options for JSON stringification.
 */
export interface JsonStringifyOptions {
  /**
   * Indentation (number of spaces or string).
   */
  space?: number | string;

  /**
   * Sort object keys alphabetically for deterministic output.
   */
  deterministic?: boolean;
}

/**
 * Stringify a JSON-safe value to a JSON string.
 *
 * @param value - JSON-safe value.
 * @param options - Stringify options.
 * @returns JSON string.
 */
export function stringifyJson(value: JsonValue, options?: JsonStringifyOptions): string {
  const { space, deterministic } = options ?? {};

  if (deterministic) {
    return JSON.stringify(sortKeys(value), null, space);
  }

  return JSON.stringify(value, null, space);
}

/**
 * Recursively sort object keys.
 *
 * @param value - Value to process.
 * @returns Value with sorted keys (deep).
 */
function sortKeys(value: JsonValue): JsonValue {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!isPlainObject(value)) return value;

  const sorted: Record<string, JsonValue> = {};
  const keys = Object.keys(value).sort();

  for (const k of keys) {
    const v = value[k];
    if (v === undefined) continue;
    sorted[k] = sortKeys(v);
  }

  return sorted;
}
