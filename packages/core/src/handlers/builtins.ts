/**
 * Built-in type handlers for common JavaScript types.
 *
 * These handlers are registered by default, enabling automatic
 * serialization of Date, Map, Set, BigInt, RegExp, and URL.
 *
 * @module
 */

import type { JsonValue, SerializeContext, TypeHandler } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Date
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for JavaScript Date objects.
 *
 * Serializes to ISO 8601 string format.
 *
 * @example
 * ```ts
 * stringify({ created: new Date('2024-01-01') })
 * // {"created":{"$type":"Date","$value":"2024-01-01T00:00:00.000Z"}}
 * ```
 */
export const dateHandler: TypeHandler<Date> = {
  name: 'Date',
  test: (v): v is Date => v instanceof Date,
  serialize: (d): JsonValue => d.toISOString(),
  deserialize: (data): Date => {
    if (typeof data !== 'string') {
      throw new TypeError('Date: expected ISO string');
    }
    const date = new Date(data);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(`Date: invalid date string "${data}"`);
    }
    return date;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BigInt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for BigInt values.
 *
 * Serializes to string (JSON doesn't support BigInt natively).
 *
 * @example
 * ```ts
 * stringify({ id: 9007199254740993n })
 * // {"id":{"$type":"BigInt","$value":"9007199254740993"}}
 * ```
 */
export const bigintHandler: TypeHandler<bigint> = {
  name: 'BigInt',
  test: (v): v is bigint => typeof v === 'bigint',
  serialize: (n): JsonValue => n.toString(),
  deserialize: (data): bigint => {
    if (typeof data !== 'string') {
      throw new TypeError('BigInt: expected string');
    }
    return BigInt(data);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RegExp
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for RegExp objects.
 *
 * Serializes pattern and flags separately.
 *
 * @example
 * ```ts
 * stringify({ pattern: /hello/gi })
 * // {"pattern":{"$type":"RegExp","$value":{"source":"hello","flags":"gi"}}}
 * ```
 */
export const regexpHandler: TypeHandler<RegExp> = {
  name: 'RegExp',
  test: (v): v is RegExp => v instanceof RegExp,
  serialize: (r): JsonValue => ({ source: r.source, flags: r.flags }),
  deserialize: (data): RegExp => {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new TypeError('RegExp: expected {source, flags}');
    }
    const obj = data as Record<string, unknown>;
    if (typeof obj['source'] !== 'string' || typeof obj['flags'] !== 'string') {
      throw new TypeError('RegExp: expected {source: string, flags: string}');
    }
    return new RegExp(obj['source'], obj['flags']);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for URL objects.
 *
 * Serializes to string form.
 *
 * @example
 * ```ts
 * stringify({ link: new URL('https://example.com') })
 * // {"link":{"$type":"URL","$value":"https://example.com/"}}
 * ```
 */
export const urlHandler: TypeHandler<URL> = {
  name: 'URL',
  test: (v): v is URL => typeof URL !== 'undefined' && v instanceof URL,
  serialize: (u): JsonValue => u.href,
  deserialize: (data): URL => {
    if (typeof data !== 'string') {
      throw new TypeError('URL: expected string');
    }
    return new URL(data);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Set
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for Set objects.
 *
 * Serializes as array of values. Nested custom types are handled recursively.
 *
 * @example
 * ```ts
 * stringify({ tags: new Set(['a', 'b']) })
 * // {"tags":{"$type":"Set","$value":["a","b"]}}
 * ```
 */
export const setHandler: TypeHandler<Set<unknown>> = {
  name: 'Set',
  test: (v): v is Set<unknown> => v instanceof Set,
  serialize: (s, ctx: SerializeContext): JsonValue => [...s].map((v) => ctx.serialize(v)),
  deserialize: (data, ctx: SerializeContext): Set<unknown> => {
    if (!Array.isArray(data)) {
      throw new TypeError('Set: expected array');
    }
    return new Set(data.map((v) => ctx.deserialize(v)));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Map
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler for Map objects.
 *
 * Serializes as array of [key, value] pairs. Both keys and values
 * can contain custom types.
 *
 * @example
 * ```ts
 * stringify({ data: new Map([['a', 1], ['b', 2]]) })
 * // {"data":{"$type":"Map","$value":[["a",1],["b",2]]}}
 * ```
 */
export const mapHandler: TypeHandler<Map<unknown, unknown>> = {
  name: 'Map',
  test: (v): v is Map<unknown, unknown> => v instanceof Map,
  serialize: (m, ctx: SerializeContext): JsonValue =>
    [...m].map(([k, v]) => [ctx.serialize(k), ctx.serialize(v)]),
  deserialize: (data, ctx: SerializeContext): Map<unknown, unknown> => {
    if (!Array.isArray(data)) {
      throw new TypeError('Map: expected array of entries');
    }
    return new Map(
      data.map((entry) => {
        if (!Array.isArray(entry) || entry.length !== 2) {
          throw new TypeError('Map: each entry must be [key, value]');
        }
        return [ctx.deserialize(entry[0] as JsonValue), ctx.deserialize(entry[1] as JsonValue)];
      })
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Export all built-in handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All built-in type handlers.
 *
 * Registered by default when using `parse()` and `stringify()`.
 * Order determines precedence (first match wins).
 */
export const builtinHandlers: readonly TypeHandler<unknown>[] = [
  dateHandler,
  bigintHandler,
  regexpHandler,
  urlHandler,
  mapHandler,
  setHandler,
];
