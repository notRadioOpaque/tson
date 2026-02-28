/**
 * Main tson API - parse and stringify with custom type support.
 *
 * @module
 */

import { parseJson } from './parser';
import { builtinHandlers } from './handlers/builtins';
import { stringifyJson } from './stringify';
import type {
  JsonObject,
  JsonValue,
  ParseOptions,
  StringifyOptions,
  SerializeContext,
  TaggedValue,
  TypeHandler,
} from './types';
import { isTaggedValue } from './lib/utils';

/** Symbol for values that should be skipped (undefined, functions, symbols). */
const SKIP = Symbol('skip');

// ─────────────────────────────────────────────────────────────────────────────
// Tson Instance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A tson instance with its own set of type handlers.
 *
 * @example
 * ```ts
 * const tson = create();
 *
 * // Register a custom type
 * tson.register({
 *   name: 'Money',
 *   test: (v) => v instanceof Money,
 *   serialize: (m) => ({ amount: m.amount, currency: m.currency }),
 *   deserialize: (d) => new Money(d.amount, d.currency),
 * });
 *
 * const json = tson.stringify({ price: new Money(100, 'USD') });
 * const obj = tson.parse(json);
 * ```
 */
export interface Tson {
  /**
   * Parse JSON string to JavaScript value.
   *
   * Custom types (Date, Map, Set, BigInt, etc.) are automatically restored.
   *
   * @param text - JSON string to parse.
   * @param options - Parse options.
   * @returns Parsed value with custom types restored.
   *
   * @example
   * ```ts
   * const data = tson.parse<User>('{"name":"Jo","created":{"$type":"Date","$value":"2024-01-01T00:00:00.000Z"}}');
   * // data.created is a Date object
   * ```
   */
  parse<T = unknown>(text: string, options?: ParseOptions): T;

  /**
   * Convert JavaScript value to JSON string.
   *
   * Custom types are automatically tagged for later restoration.
   *
   * @param value - Value to stringify.
   * @param options - Stringify options.
   * @returns JSON string.
   *
   * @example
   * ```ts
   * const json = tson.stringify({ created: new Date(), tags: new Set(['a', 'b']) });
   * ```
   */
  stringify(value: unknown, options?: StringifyOptions): string;

  /**
   * Register a custom type handler.
   *
   * @param handler - Type handler to register.
   *
   * @example
   * ```ts
   * tson.register({
   *   name: 'Decimal',
   *   test: (v) => v instanceof Decimal,
   *   serialize: (d) => d.toString(),
   *   deserialize: (s) => new Decimal(s),
   * });
   * ```
   */
  register<T>(handler: TypeHandler<T>): void;

  /**
   * Remove a type handler by name.
   *
   * @param name - Handler name to remove.
   * @returns True if handler was removed.
   *
   * @example
   * ```ts
   * tson.unregister('Date'); // Dates will now serialize as ISO strings
   * ```
   */
  unregister(name: string): boolean;

  /**
   * List registered handler names.
   *
   * @returns Array of handler names in precedence order.
   */
  handlers(): readonly string[];
}

/**
 * Options for creating a new tson instance.
 */
export interface CreateOptions {
  /**
   * If true (default), register built-in handlers for Date, Map, Set, etc.
   *
   * Set to false for a minimal instance with no handlers.
   *
   * @default true
   */
  builtins?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new tson instance.
 *
 * Each instance has its own set of type handlers, allowing different
 * configurations for different use cases.
 *
 * @param options - Creation options.
 * @returns New tson instance.
 *
 * @example
 * ```ts
 * // Default: includes Date, Map, Set, BigInt, RegExp, URL handlers
 * const tson = create();
 *
 * // Minimal: no built-in handlers
 * const minimal = create({ builtins: false });
 * ```
 */
export function create(options?: CreateOptions): Tson {
  const handlers = new Map<string, TypeHandler<unknown>>();
  const handlerList: TypeHandler<unknown>[] = [];

  // Register built-ins unless disabled
  if (options?.builtins !== false) {
    for (const h of builtinHandlers) {
      handlers.set(h.name, h);
      handlerList.push(h);
    }
  }

  /**
   * Find handler for a value.
   */
  function findHandler(value: unknown): TypeHandler<unknown> | undefined {
    return handlerList.find((h) => h.test(value));
  }

  /**
   * Get handler by name.
   */
  function getHandler(name: string): TypeHandler<unknown> | undefined {
    return handlers.get(name);
  }

  /**
   * Create serialize context for handlers.
   */
  function createContext(strict: boolean, seen: WeakSet<object>): SerializeContext {
    const ctx: SerializeContext = {
      serialize: (value: unknown): JsonValue => {
        const result = convertValue(value, strict, seen, ctx);
        if (result === SKIP) {
          if (strict) throw new TypeError('Cannot serialize value');
          return null;
        }
        return result;
      },
      deserialize: (data: JsonValue): unknown => reviveValue(data, ctx),
    };
    return ctx;
  }

  /**
   * Convert a value to JSON-safe form.
   */
  function convertValue(
    value: unknown,
    strict: boolean,
    seen: WeakSet<object>,
    ctx: SerializeContext
  ): JsonValue | typeof SKIP {
    // Check custom handlers first
    const handler = findHandler(value);
    if (handler) {
      const isObj = typeof value === 'object' && value !== null;
      if (isObj) {
        if (seen.has(value)) {
          throw new TypeError('Circular reference detected');
        }
        seen.add(value);
      }
      try {
        const payload = handler.serialize(value, ctx);
        const tag: TaggedValue = { $type: handler.name, $value: payload };
        return tag as unknown as JsonValue;
      } finally {
        if (isObj) seen.delete(value);
      }
    }

    // Primitives
    if (value === null) return null;

    const type = typeof value;
    switch (type) {
      case 'string':
      case 'boolean':
        return value as JsonValue;

      case 'number':
        if (!Number.isFinite(value as number)) {
          if (strict) throw new TypeError('Infinity/NaN not allowed in JSON');
          return null;
        }
        return value as JsonValue;

      case 'undefined':
      case 'function':
      case 'symbol':
        if (strict) throw new TypeError(`Cannot serialize ${type}`);
        return SKIP;

      case 'bigint':
        // Should be caught by handler, but fallback if handler missing
        if (strict) throw new TypeError('BigInt requires a handler');
        return SKIP;
    }

    // Arrays
    if (Array.isArray(value)) {
      if (seen.has(value)) throw new TypeError('Circular reference detected');
      seen.add(value);
      const arr = value.map((item) => {
        const result = convertValue(item, strict, seen, ctx);
        return result === SKIP ? null : result;
      });
      seen.delete(value);
      return arr;
    }

    // Objects with toJSON method
    const maybeToJson = (value as { toJSON?: unknown }).toJSON;
    if (typeof maybeToJson === 'function') {
      const converted = (maybeToJson as () => unknown).call(value);
      return convertValue(converted, strict, seen, ctx);
    }

    // Plain objects
    if (seen.has(value as object)) {
      throw new TypeError('Circular reference detected');
    }
    seen.add(value as object);

    const obj: JsonObject = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const result = convertValue(v, strict, seen, ctx);
      if (result !== SKIP) {
        obj[k] = result;
      }
    }
    seen.delete(value as object);
    return obj;
  }

  /**
   * Revive JSON value to runtime types.
   */
  function reviveValue(value: JsonValue, ctx: SerializeContext): unknown {
    if (value === null) return null;
    if (Array.isArray(value)) return value.map((v) => reviveValue(v, ctx));
    if (typeof value !== 'object') return value;

    // Check for tagged value
    if (isTaggedValue(value)) {
      const keys = Object.keys(value);
      if (keys.length !== 2 || !keys.includes('$type') || !keys.includes('$value')) {
        throw new TypeError('Invalid tagged value shape');
      }
      const handler = getHandler(value.$type);
      if (!handler) {
        throw new TypeError(`Unknown type: ${value.$type}`);
      }
      return handler.deserialize(value.$value, ctx);
    }

    // Regular object
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = reviveValue(v, ctx);
    }
    return obj;
  }

  // Return public API
  return {
    parse<T>(text: string, options?: ParseOptions): T {
      const json = parseJson(text);
      const revive = options?.revive !== false;
      if (!revive) return json as T;
      const ctx = createContext(false, new WeakSet());
      return reviveValue(json, ctx) as T;
    },

    stringify(value: unknown, options?: StringifyOptions): string {
      const strict = options?.strict === true;
      const ctx = createContext(strict, new WeakSet());
      const result = convertValue(value, strict, new WeakSet(), ctx);
      const json = result === SKIP ? null : result;
      return stringifyJson(json, {
        space: options?.space,
        deterministic: options?.sorted,
      });
    },

    register<T>(handler: TypeHandler<T>): void {
      if (handlers.has(handler.name)) {
        throw new Error(`Handler "${handler.name}" already registered`);
      }
      handlers.set(handler.name, handler as TypeHandler<unknown>);
      handlerList.push(handler as TypeHandler<unknown>);
    },

    unregister(name: string): boolean {
      const handler = handlers.get(name);
      if (!handler) return false;
      handlers.delete(name);
      const idx = handlerList.indexOf(handler);
      if (idx >= 0) handlerList.splice(idx, 1);
      return true;
    },

    handlers(): readonly string[] {
      return handlerList.map((h) => h.name);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Instance + Exports
// ─────────────────────────────────────────────────────────────────────────────

/** Default tson instance with built-in handlers. */
const defaultInstance = create();

/**
 * Parse JSON string to JavaScript value.
 *
 * Uses the default tson instance with built-in type handlers.
 *
 * @param text - JSON string to parse.
 * @param options - Parse options.
 * @returns Parsed value with custom types restored.
 *
 * @example
 * ```ts
 * import { parse } from '@tson/core';
 *
 * const data = parse<User>('{"created":{"$type":"Date","$value":"2024-01-01T00:00:00.000Z"}}');
 * console.log(data.created instanceof Date); // true
 * ```
 */
export function parse<T = unknown>(text: string, options?: ParseOptions): T {
  return defaultInstance.parse<T>(text, options);
}

/**
 * Convert JavaScript value to JSON string.
 *
 * Uses the default tson instance with built-in type handlers.
 *
 * @param value - Value to stringify.
 * @param options - Stringify options.
 * @returns JSON string.
 *
 * @example
 * ```ts
 * import { stringify } from '@tson/core';
 *
 * const json = stringify({
 *   created: new Date(),
 *   tags: new Set(['a', 'b']),
 *   data: new Map([['key', 'value']]),
 * });
 * ```
 */
export function stringify(value: unknown, options?: StringifyOptions): string {
  return defaultInstance.stringify(value, options);
}

/**
 * Register a custom type handler on the default instance.
 *
 * For isolated handlers, use `create()` to make a new instance.
 *
 * @param handler - Type handler to register.
 *
 * @example
 * ```ts
 * import { register, stringify, parse } from '@tson/core';
 *
 * class Money {
 *   constructor(public amount: number, public currency: string) {}
 * }
 *
 * register({
 *   name: 'Money',
 *   test: (v) => v instanceof Money,
 *   serialize: (m) => ({ amount: m.amount, currency: m.currency }),
 *   deserialize: (d) => new Money(d.amount, d.currency),
 * });
 *
 * const json = stringify({ price: new Money(100, 'USD') });
 * const obj = parse<{ price: Money }>(json);
 * ```
 */
export function register<T>(handler: TypeHandler<T>): void {
  defaultInstance.register(handler);
}

/**
 * Remove a type handler from the default instance.
 *
 * @param name - Handler name to remove.
 * @returns True if handler was removed.
 */
export function unregister(name: string): boolean {
  return defaultInstance.unregister(name);
}

/**
 * List handler names on the default instance.
 *
 * @returns Array of handler names.
 */
export function handlers(): readonly string[] {
  return defaultInstance.handlers();
}
