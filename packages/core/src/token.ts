/**
 * Token types and definitions for Tokenizer
 */

/**
 * Token types in JSON
 */
export enum TokenType {
  LeftBrace = 'LeftBrace', // {
  RightBrace = 'RightBrace', // }
  LeftBracket = 'LeftBracket', // [
  RightBracket = 'RightBracket', // ]
  Colon = 'Colon', // :
  Comma = 'Comma', // ,
  String = 'String', // 'text'
  Number = 'Number', // 123
  True = 'True', // true
  False = 'False', // false
  Null = 'Null', // null
  EOF = 'EOF', // End of file
}

/**
 * Token interface
 */
export interface Token {
  type: TokenType;
  value: unknown;
  line: number;
  column: number;
  position: number;
}

/**
 * Create a token
 */
export function createToken(
  type: TokenType,
  value: unknown,
  line: number,
  column: number,
  position: number
): Token {
  return { type, value, line, column, position };
}
