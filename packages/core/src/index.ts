/**
 * @tson/core - Type-safe JSON with automatic Date, Map, Set, and BigInt support.
 *
 * @example
 * ```ts
 * import { parse, stringify } from '@tson/core';
 *
 * // Stringify - Dates, Maps, Sets just work
 * const json = stringify({
 *   created: new Date(),
 *   tags: new Set(['a', 'b']),
 *   data: new Map([['key', 'value']]),
 * });
 *
 * // Parse - types are automatically restored
 * const obj = parse(json);
 * console.log(obj.created instanceof Date); // true
 * console.log(obj.tags instanceof Set);     // true
 * console.log(obj.data instanceof Map);     // true
 * ```
 *
 * @example Custom Types
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
 *
 * @module
 */

// Main API
export {
  parse,
  stringify,
  register,
  unregister,
  handlers,
  create,
  type Tson,
  type CreateOptions,
} from './tson';

// Types for custom handlers
export type { TypeHandler, SerializeContext, ParseOptions, StringifyOptions } from './types';

// JSON value types
export type { JsonValue, JsonObject, JsonArray, JsonPrimitive } from './types';

// Built-in handlers (for advanced customization)
export {
  dateHandler,
  bigintHandler,
  regexpHandler,
  urlHandler,
  mapHandler,
  setHandler,
  builtinHandlers,
} from './handlers/builtins';

// Errors
export { TsonParseError } from './error';
