/**
 * Strict JSON parser implemented over the tokenizer.
 *
 * This parser is intentionally strict (no comments, no trailing commas) and is used
 * to provide better error messages than native `JSON.parse` in many cases.
 */

import { TokenType, type Token } from './token';
import { Tokenizer } from './tokenizer';
import { TsonParseError } from './error';
import type { JsonObject, JsonValue } from './types';

/**
 * Parse a JSON string into a JSON value.
 *
 * @param text - Raw JSON text.
 * @returns Parsed JSON value.
 */
export function parseJson(text: string): JsonValue {
  const tokenizer = new Tokenizer(text);
  const parser = new Parser(tokenizer, text);
  return parser.parseRoot();
}

/**
 * Internal recursive-descent parser.
 */
class Parser {
  private readonly tokenizer: Tokenizer;
  private readonly input: string;
  private current: Token;

  /**
   * @param tokenizer - Tokenizer for the input.
   */
  constructor(tokenizer: Tokenizer, input: string) {
    this.tokenizer = tokenizer;
    this.input = input;
    this.current = this.tokenizer.nextToken();
  }

  /**
   * Parse a full JSON document and ensure EOF.
   *
   * @returns Parsed JSON value.
   */
  public parseRoot(): JsonValue {
    const value = this.parseValue();
    this.consume(TokenType.EOF, 'Expected end of input');
    return value;
  }

  /**
   * Parse any JSON value.
   */
  private parseValue(): JsonValue {
    switch (this.current.type) {
      case TokenType.LeftBrace:
        return this.parseObject();
      case TokenType.LeftBracket:
        return this.parseArray();
      case TokenType.String: {
        const value = this.current.value as string;
        this.current = this.tokenizer.nextToken();
        return value;
      }
      case TokenType.Number: {
        const value = this.current.value as number;
        this.current = this.tokenizer.nextToken();
        return value;
      }
      case TokenType.True:
        this.current = this.tokenizer.nextToken();
        return true;
      case TokenType.False:
        this.current = this.tokenizer.nextToken();
        return false;
      case TokenType.Null:
        this.current = this.tokenizer.nextToken();
        return null;
      default:
        this.throwUnexpected('Expected a JSON value');
    }
  }

  /**
   * Parse an object: `{ (string : value (, string : value)*)? }`
   */
  private parseObject(): JsonObject {
    this.consume(TokenType.LeftBrace, 'Expected {');
    const obj: JsonObject = {};

    if (this.current.type === TokenType.RightBrace) {
      this.current = this.tokenizer.nextToken();
      return obj;
    }

    for (;;) {
      if (this.current.type !== TokenType.String) {
        this.throwUnexpected('Expected string key in object');
      }
      const key = this.current.value as string;
      this.current = this.tokenizer.nextToken();

      this.consume(TokenType.Colon, 'Expected : after object key');

      const value = this.parseValue();
      obj[key] = value;

      if (this.current.type === TokenType.Comma) {
        this.current = this.tokenizer.nextToken();
        // Strict: disallow trailing comma by requiring another key next.
        if (this.current.type === TokenType.RightBrace) {
          this.throwUnexpected('Trailing comma in object is not allowed');
        }
        continue;
      }

      this.consume(TokenType.RightBrace, 'Expected } after object');
      return obj;
    }
  }

  /**
   * Parse an array: `[ value (, value)* ]`
   */
  private parseArray(): JsonValue[] {
    this.consume(TokenType.LeftBracket, 'Expected [');
    const arr: JsonValue[] = [];

    if (this.current.type === TokenType.RightBracket) {
      this.current = this.tokenizer.nextToken();
      return arr;
    }

    for (;;) {
      const value = this.parseValue();
      arr.push(value);

      if (this.current.type === TokenType.Comma) {
        this.current = this.tokenizer.nextToken();
        // Strict: disallow trailing comma by requiring another value next.
        if (this.current.type === TokenType.RightBracket) {
          this.throwUnexpected('Trailing comma in array is not allowed');
        }
        continue;
      }

      this.consume(TokenType.RightBracket, 'Expected ] after array');
      return arr;
    }
  }

  /**
   * Consume a token of a specific type.
   *
   * @param type - Expected token type.
   * @param message - Error message on mismatch.
   */
  private consume(type: TokenType, message: string): void {
    if (this.current.type !== type) {
      this.throwUnexpected(message);
    }
    this.current = this.tokenizer.nextToken();
  }

  /**
   * Throw a parse error using the tokenizer’s error machinery.
   *
   * We rethrow by triggering an unexpected character-style failure at the current
   * token’s location.
   */
  private throwUnexpected(message: string): never {
    const t = this.current;
    throw new TsonParseError(message, t.line, t.column, t.position, this.input);
  }
}
