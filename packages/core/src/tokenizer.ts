/**
 * Tokenizer for JSON
 *
 * Converts a JSON string into a stream of tokens.
 */

import { TsonParseError } from './error';
import { createToken, TokenType, type Token } from './token';

/**
 * Tokenizer class for tokenizing JSON input
 */
export class Tokenizer {
  private input: string;
  private line: number = 1;
  private column: number = 1;
  private position: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Get the next token from input
   */
  public nextToken(): Token {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      return this.makeToken(TokenType.EOF, null);
    }

    const char = this.peek();

    switch (char) {
      case '{':
        return this.makeToken(TokenType.LeftBrace, char, 1);
      case '}':
        return this.makeToken(TokenType.RightBrace, char, 1);
      case '[':
        return this.makeToken(TokenType.LeftBracket, char, 1);
      case ']':
        return this.makeToken(TokenType.RightBracket, char, 1);
      case ':':
        return this.makeToken(TokenType.Colon, char, 1);
      case ',':
        return this.makeToken(TokenType.Comma, char, 1);
      case '"':
        return this.scanString();
    }

    // Keywords
    if (this.match('true')) {
      return this.makeToken(TokenType.True, true, 4);
    }
    if (this.match('false')) {
      return this.makeToken(TokenType.False, false, 5);
    }
    if (this.match('null')) {
      return this.makeToken(TokenType.Null, null, 4);
    }

    // Numbers
    if (this.isDigit(char) || char === '-') {
      return this.scanNumber();
    }

    this.error(`Unexpected character: '${char}'`);
  }

  /**
   * Skip whitespaces
   */
  private skipWhitespace() {
    while (!this.isAtEnd()) {
      const char = this.peek();
      switch (char) {
        case ' ':
        case '\r':
        case '\t':
          this.advance();
          break;
        case '\n':
          this.line++;
          this.column = 0;
          this.advance();
          break;
        default:
          return;
      }
    }
  }

  /**
   * Create a token and advance position
   */
  private makeToken(type: TokenType, value: unknown, length: number = 0): Token {
    const token = createToken(type, value, this.line, this.column, this.position);
    for (let i = 0; i < length; i++) {
      this.advance();
    }
    return token;
  }

  /**
   * Check if at end of input
   */
  private isAtEnd() {
    return this.position >= this.input.length;
  }

  /**
   * Peek at the next character without consuming
   */
  private peek(): string {
    if (this.isAtEnd()) return '\0';

    return this.input[this.position] ?? '\0';
  }

  /**
   * Consume and return current character
   */
  private advance(): string {
    const char = this.input[this.position] ?? '\0';
    this.position++;
    this.column++;
    return char;
  }

  /**
   * Check if string at current position matches expected
   */
  private match(expected: string): boolean {
    if (this.position + expected.length > this.input.length) {
      return false;
    }

    for (let i = 0; i < expected.length; i++) {
      if (this.input[this.position + i] !== expected[i]) {
        return false;
      }
    }

    // Check that keyword is not part of a longer identifier
    const nextChar = this.input[this.position + expected.length];
    if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) {
      return false;
    }

    return true;
  }

  /**
   * Scan a number token
   */
  private scanNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const startPosition = this.position;

    let numStr = '';

    // Optional minus sign
    if (this.peek() === '-') {
      numStr += this.advance();
    }

    // Integer part
    if (this.peek() === '0') {
      numStr += this.advance();
      // After leading 0, must be decimal point, exponent, or end
      if (this.isDigit(this.peek())) {
        this.error('Invalid number: leading zeros not allowed');
      }
    } else if (this.isDigit(this.peek())) {
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    } else {
      this.error('Invalid number: expected digit after minus sign');
    }

    // Fractional part
    if (this.peek() === '.') {
      numStr += this.advance();
      if (!this.isDigit(this.peek())) {
        this.error('Invalid number: expected digit after decimal point');
      }
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    // Exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      numStr += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.advance();
      }
      if (!this.isDigit(this.peek())) {
        this.error('Invalid number: expected digit in exponent');
      }
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    const value = parseFloat(numStr);
    if (!isFinite(value)) {
      this.error('Invalid number: value out of range');
    }

    return createToken(TokenType.Number, value, startLine, startColumn, startPosition);
  }

  /**
   * Scan a string token
   */
  private scanString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const startPosition = this.position;

    // skip opening quote
    this.advance();

    let value = '';

    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\\') {
        //handle escape sequences
        this.advance();
        if (this.isAtEnd()) {
          this.error('Unterminated string');
        }

        const escaped = this.advance();
        switch (escaped) {
          case '"':
            value += '"';
            break;
          case '\\':
            value += '\\';
            break;
          case '/':
            value += '/';
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case 'n':
            value += '\n';
            break;
          case 'r':
            value += '\r';
            break;
          case 't':
            value += '\t';
            break;
          case 'u': {
            // Unicode escape sequence \uXXXX
            const hex = this.readHexDigits(4);
            if (hex === null) {
              this.error('Invalid unicode escape sequence');
            }
            value += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            this.error(`Invalid escape sequence: \\${escaped}`);
        }
      } else {
        if (this.peek() === '\n' || this.peek() === '\r') {
          this.error('Unterminated string (newline in string)');
        }
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error('Unterminated string');
    }

    // Skip closing quote
    this.advance();

    return createToken(TokenType.String, value, startLine, startColumn, startPosition);
  }

  /**
   * Read hex digits from unicode escape
   */
  private readHexDigits(count: number): string | null {
    let hex = '';
    for (let i = 0; i < count; i++) {
      if (this.isAtEnd()) {
        return null;
      }
      const char = this.peek();
      if (!this.isHexDigit(char)) {
        return null;
      }

      hex += this.advance();
    }

    return hex;
  }

  /**
   * Check if character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Check if character is a hex digit
   */
  private isHexDigit(char: string): boolean {
    return (
      (char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')
    );
  }

  /**
   * Throw a parse error
   */
  private error(message: string): never {
    throw new TsonParseError(message, this.line, this.column, this.position, this.input);
  }
}
