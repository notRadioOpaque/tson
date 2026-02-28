import { describe, expect, test } from 'bun:test';

import { TsonParseError } from '../src/error';
import { TokenType } from '../src/token';
import { Tokenizer } from '../src/tokenizer';

/**
 * Tokenize all tokens until EOF.
 *
 * @param input - Raw JSON text input.
 * @returns Tokens including the trailing EOF token.
 */
function tokenizeAll(input: string) {
  const tokenizer = new Tokenizer(input);
  const tokens = [];
  for (;;) {
    const token = tokenizer.nextToken();
    tokens.push(token);
    if (token.type === TokenType.EOF) {
      break;
    }
  }
  return tokens;
}

describe('Tokenizer', () => {
  test('tokenizes structural tokens', () => {
    const tokens = tokenizeAll('{[]}:,');
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.LeftBrace,
      TokenType.LeftBracket,
      TokenType.RightBracket,
      TokenType.RightBrace,
      TokenType.Colon,
      TokenType.Comma,
      TokenType.EOF,
    ]);
  });

  test('tokenizes keywords', () => {
    const tokens = tokenizeAll('true false null');
    expect(tokens.map((t) => [t.type, t.value])).toEqual([
      [TokenType.True, true],
      [TokenType.False, false],
      [TokenType.Null, null],
      [TokenType.EOF, null],
    ]);
  });

  test('tokenizes numbers (including exponent)', () => {
    const tokens = tokenizeAll('-1 0 1.25 1e3 1E-3');
    expect(tokens.map((t) => [t.type, t.value])).toEqual([
      [TokenType.Number, -1],
      [TokenType.Number, 0],
      [TokenType.Number, 1.25],
      [TokenType.Number, 1000],
      [TokenType.Number, 0.001],
      [TokenType.EOF, null],
    ]);
  });

  test('rejects leading zeros', () => {
    expect(() => tokenizeAll('01')).toThrow(TsonParseError);
  });

  test('tokenizes strings with escapes and unicode', () => {
    const tokens = tokenizeAll('"a\\\\b\\n\\t\\u0041"');
    expect(tokens.map((t) => [t.type, t.value])).toEqual([
      [TokenType.String, 'a\\b\n\tA'],
      [TokenType.EOF, null],
    ]);
  });

  test('rejects unterminated string', () => {
    expect(() => tokenizeAll('"unterminated')).toThrow(TsonParseError);
  });

  test('tracks line/column in errors', () => {
    try {
      tokenizeAll('{\n  "a": 1,\n  @\n}');
      throw new Error('Expected tokenizeAll to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(TsonParseError);
      const e = err as TsonParseError;
      // '@' is on line 3, column 3 in the input above.
      expect(e.line).toBe(3);
      expect(e.column).toBe(3);
    }
  });
});
