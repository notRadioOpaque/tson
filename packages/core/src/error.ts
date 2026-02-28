/**
 * Error classes for Tson
 */

/**
 * Base class for Tson errors
 */
export class TsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TsonError';
    Object.setPrototypeOf(this, TsonError.prototype);
  }
}

export class TsonParseError extends TsonError {
  public readonly line: number;
  public readonly column: number;
  public readonly position: number;
  public readonly snippet: string;

  constructor(message: string, line: number, column: number, position: number, input: string) {
    const snippet = TsonParseError.createSnippet(input, line, column);
    const fullMessage = `${message}\n${snippet}`;

    super(fullMessage);
    this.name = 'TsonParseError';
    this.line = line;
    this.column = column;
    this.position = position;
    this.snippet = snippet;
    Object.setPrototypeOf(this, TsonParseError.prototype);
  }

  private static createSnippet(input: string, line: number, column: number): string {
    const lines = input.split('\n');
    const lineIndex = line - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return '';
    }

    const currentLine = lines[lineIndex];
    const pointer = ' '.repeat(column - 1) + '^';

    return ` at line ${line}, column ${column}:\n ${currentLine} ${pointer}`;
  }
}
