import { describe, expect, test } from 'bun:test';
import { stringify } from '../src';

describe('stringify()', () => {
  describe('Primitives', () => {
    test('stringifies strings', () => {
      expect(stringify('hello')).toBe('"hello"');
    });

    test('stringifies numbers', () => {
      expect(stringify(42)).toBe('42');
      expect(stringify(3.14)).toBe('3.14');
      expect(stringify(-10)).toBe('-10');
    });

    test('stringifies booleans', () => {
      expect(stringify(true)).toBe('true');
      expect(stringify(false)).toBe('false');
    });

    test('stringifies null', () => {
      expect(stringify(null)).toBe('null');
    });
  });

  describe('Objects', () => {
    test('stringifies empty object', () => {
      expect(stringify({})).toBe('{}');
    });

    test('stringifies simple object', () => {
      expect(stringify({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}');
    });

    test('stringifies nested objects', () => {
      expect(stringify({ outer: { inner: true } })).toBe('{"outer":{"inner":true}}');
    });

    test('omits undefined values', () => {
      expect(stringify({ a: 1, b: undefined })).toBe('{"a":1}');
    });

    test('omits function values', () => {
      expect(stringify({ a: 1, fn: () => {} })).toBe('{"a":1}');
    });
  });

  describe('Arrays', () => {
    test('stringifies empty array', () => {
      expect(stringify([])).toBe('[]');
    });

    test('stringifies simple array', () => {
      expect(stringify([1, 2, 3])).toBe('[1,2,3]');
    });

    test('converts undefined to null in arrays', () => {
      expect(stringify([1, undefined, 3])).toBe('[1,null,3]');
    });
  });

  describe('Options', () => {
    test('space: number indents output', () => {
      expect(stringify({ a: 1 }, { space: 2 })).toBe('{\n  "a": 1\n}');
    });

    test('space: string uses custom indent', () => {
      expect(stringify({ a: 1 }, { space: '\t' })).toBe('{\n\t"a": 1\n}');
    });

    test('sorted: true orders keys alphabetically', () => {
      expect(stringify({ c: 1, a: 2, b: 3 }, { sorted: true })).toBe('{"a":2,"b":3,"c":1}');
    });

    test('sorted: true works recursively', () => {
      const obj = { z: { b: 1, a: 2 }, a: { y: 3, x: 4 } };
      expect(stringify(obj, { sorted: true })).toBe('{"a":{"x":4,"y":3},"z":{"a":2,"b":1}}');
    });

    test('strict: true throws on undefined', () => {
      expect(() => stringify(undefined, { strict: true })).toThrow();
    });

    test('strict: true throws on functions', () => {
      expect(() => stringify(() => {}, { strict: true })).toThrow();
    });
  });

  describe('Special values', () => {
    test('Infinity becomes null', () => {
      expect(stringify(Infinity)).toBe('null');
      expect(stringify(-Infinity)).toBe('null');
    });

    test('NaN becomes null', () => {
      expect(stringify(NaN)).toBe('null');
    });

    test('undefined at root becomes null', () => {
      expect(stringify(undefined)).toBe('null');
    });
  });

  describe('Circular reference detection', () => {
    test('throws on circular object', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj['self'] = obj;
      expect(() => stringify(obj)).toThrow(/circular/i);
    });

    test('throws on circular array', () => {
      const arr: unknown[] = [1, 2];
      arr.push(arr);
      expect(() => stringify(arr)).toThrow(/circular/i);
    });
  });
});
