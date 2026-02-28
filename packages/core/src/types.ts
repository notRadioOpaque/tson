/**
 * Core types for @tson/core.
 *
 * @module
 */

// ─────────────────────────────────────────────────────────────────────────────
// JSON Value Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A JSON primitive value.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * A JSON object (key-value pairs).
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * A JSON array.
 */
export type JsonArray = JsonValue[];

/**
 * Any valid JSON value.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// ─────────────────────────────────────────────────────────────────────────────
// Type Handler (for custom serialization)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context passed to serialize/deserialize functions.
 *
 * Use this when your custom type contains nested values that might also
 * need custom serialization (e.g., a Map containing Dates).
 *
 * @example
 * ```ts
 * const handler: TypeHandler<MyContainer> = {
 *   name: 'MyContainer',
 *   test: (v) => v instanceof MyContainer,
 *   serialize: (v, ctx) => ({
 *     items: v.items.map(item => ctx.serialize(item))
 *   }),
 *   deserialize: (data, ctx) => new MyContainer(
 *     data.items.map(item => ctx.deserialize(item))
 *   ),
 * };
 * ```
 */
export interface SerializeContext {
  /**
   * Serialize a nested value (applies type handlers recursively).
   *
   * @param value - Value to serialize.
   * @returns JSON-safe value.
   */
  serialize(value: unknown): JsonValue;

  /**
   * Deserialize a nested value (revives tagged types recursively).
   *
   * @param data - JSON value to deserialize.
   * @returns Runtime value.
   */
  deserialize(data: JsonValue): unknown;
}

/**
 * Handler for serializing/deserializing a custom type.
 *
 * Register handlers to teach tson how to handle types like Date, Map, Set,
 * or your own custom classes.
 *
 * @typeParam T - The runtime type this handler manages.
 *
 * @example
 * ```ts
 * // Simple handler (no nested custom types)
 * const dateHandler: TypeHandler<Date> = {
 *   name: 'Date',
 *   test: (v) => v instanceof Date,
 *   serialize: (d) => d.toISOString(),
 *   deserialize: (s) => new Date(s as string),
 * };
 *
 * // Handler with nested values
 * const mapHandler: TypeHandler<Map<unknown, unknown>> = {
 *   name: 'Map',
 *   test: (v) => v instanceof Map,
 *   serialize: (m, ctx) => [...m].map(([k, v]) => [ctx.serialize(k), ctx.serialize(v)]),
 *   deserialize: (data, ctx) => new Map(
 *     (data as unknown[][]).map(([k, v]) => [ctx.deserialize(k), ctx.deserialize(v)])
 *   ),
 * };
 * ```
 */
export interface TypeHandler<T = unknown> {
  /**
   * Unique name for this type (written to JSON as `$type`).
   *
   * Choose a stable, descriptive name. This value appears in the serialized
   * JSON, so keep it short but clear.
   */
  readonly name: string;

  /**
   * Test whether a value should be handled by this handler.
   *
   * @param value - Unknown runtime value.
   * @returns True if this handler should serialize the value.
   */
  test(value: unknown): value is T;

  /**
   * Convert a runtime value to JSON-safe data.
   *
   * @param value - Runtime value (guaranteed to pass `test()`).
   * @param ctx - Context for serializing nested values.
   * @returns JSON-safe representation.
   */
  serialize(value: T, ctx: SerializeContext): JsonValue;

  /**
   * Convert JSON data back to the runtime type.
   *
   * @param data - JSON data from the `$value` field.
   * @param ctx - Context for deserializing nested values.
   * @returns Runtime value.
   */
  deserialize(data: JsonValue, ctx: SerializeContext): T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for `parse()`.
 */
export interface ParseOptions {
  /**
   * If true (default), revive tagged values back to their runtime types.
   *
   * Set to false to get raw JSON with `$type`/`$value` objects intact.
   *
   * @default true
   */
  revive?: boolean;
}

/**
 * Options for `stringify()`.
 */
export interface StringifyOptions {
  /**
   * Indentation for pretty-printing.
   *
   * - Number: spaces to indent each level
   * - String: literal string to use for indentation
   * - Undefined: minified output (no whitespace)
   *
   * Same behavior as `JSON.stringify`'s third argument.
   */
  space?: number | string;

  /**
   * If true, sort object keys alphabetically for consistent output.
   *
   * Useful for snapshot testing or caching.
   *
   * @default false
   */
  sorted?: boolean;

  /**
   * If true, throw on values that can't be represented in JSON.
   *
   * By default, undefined/functions/symbols are silently dropped (matching
   * `JSON.stringify` behavior). Set to true to catch these early.
   *
   * @default false
   */
  strict?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Tagged value shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal shape for tagged values in JSON.
 *
 * @internal
 */
export interface TaggedValue {
  /** Type name from the handler. */
  $type: string;
  /** Serialized payload. */
  $value: JsonValue;
}
