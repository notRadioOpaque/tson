import { describe, expect, test } from 'bun:test';
import { parse, TsonParseError } from '../src';

describe('parse()', () => {
  describe('Primitives', () => {
    test('parses true', () => {
      expect(parse('true')).toBe(true);
    });

    test('parses false', () => {
      expect(parse('false')).toBe(false);
    });

    test('parses null', () => {
      expect(parse('null')).toBeNull();
    });

    test('parses integers', () => {
      expect(parse('123')).toBe(123);
      expect(parse('-42')).toBe(-42);
      expect(parse('0')).toBe(0);
    });

    test('parses floats', () => {
      expect(parse('3.14')).toBe(3.14);
      expect(parse('-0.5')).toBe(-0.5);
      expect(parse('1.23e10')).toBe(1.23e10);
    });

    test('parses strings', () => {
      expect(parse('"hello"')).toBe('hello');
      expect(parse('""')).toBe('');
      expect(parse('"with spaces"')).toBe('with spaces');
    });

    test('handles escape sequences', () => {
      expect(parse('"line1\\nline2"')).toBe('line1\nline2');
      expect(parse('"tab\\there"')).toBe('tab\there');
      expect(parse('"quote: \\"yes\\""')).toBe('quote: "yes"');
    });
  });

  describe('Objects', () => {
    test('parses empty object', () => {
      expect(parse('{}')).toEqual({});
    });

    test('parses simple object', () => {
      expect(parse('{"a": 1, "b": "x"}')).toEqual({ a: 1, b: 'x' });
    });

    test('parses nested objects', () => {
      expect(parse('{"outer": {"inner": true}}')).toEqual({
        outer: { inner: true },
      });
    });
  });

  describe('Arrays', () => {
    test('parses empty array', () => {
      expect(parse('[]')).toEqual([]);
    });

    test('parses simple array', () => {
      expect(parse('[1, 2, 3]')).toEqual([1, 2, 3]);
    });

    test('parses mixed array', () => {
      expect(parse('[1, "a", true, null]')).toEqual([1, 'a', true, null]);
    });

    test('parses nested arrays', () => {
      expect(parse('[[1, 2], [3, 4]]')).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('Complex structures', () => {
    test('parses mixed object and array', () => {
      const input = '{"users": [{"name": "Jo"}, {"name": "Sam"}], "count": 2}';
      expect(parse(input)).toEqual({
        users: [{ name: 'Jo' }, { name: 'Sam' }],
        count: 2,
      });
    });
  });

  describe('Strict JSON compliance', () => {
    test('rejects trailing comma in array', () => {
      expect(() => parse('[1, 2, 3,]')).toThrow(TsonParseError);
    });

    test('rejects trailing comma in object', () => {
      expect(() => parse('{"a": 1,}')).toThrow(TsonParseError);
    });

    test('rejects comments', () => {
      expect(() => parse('{"a": 1 /* comment */}')).toThrow(TsonParseError);
      expect(() => parse('{"a": 1} // comment')).toThrow();
    });

    test('rejects single quotes', () => {
      expect(() => parse("{'a': 1}")).toThrow(TsonParseError);
    });

    test('rejects unquoted keys', () => {
      expect(() => parse('{a: 1}')).toThrow(TsonParseError);
    });
  });

  describe('Options', () => {
    test('revive: false returns raw JSON', () => {
      const json = '{"$type": "Date", "$value": "2024-01-01T00:00:00.000Z"}';
      const raw = parse(json, { revive: false });
      expect(raw).toEqual({ $type: 'Date', $value: '2024-01-01T00:00:00.000Z' });
    });
  });
});
