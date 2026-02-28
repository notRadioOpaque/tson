import { describe, expect, test } from 'bun:test';
import { parse, stringify, create, register } from '../src';

describe('Custom Types (Built-in handlers)', () => {
  test('Date round-trip', () => {
    const input = { createdAt: new Date('2026-01-31T00:00:00.000Z') };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.createdAt).toBeInstanceOf(Date);
    expect(output.createdAt.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  test('BigInt round-trip', () => {
    const input = { n: 123n };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.n).toBe(123n);
  });

  test('Map round-trip', () => {
    const input = {
      data: new Map<string, number>([
        ['a', 1],
        ['b', 2],
      ]),
    };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.data).toBeInstanceOf(Map);
    expect([...output.data.entries()]).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  test('Set round-trip', () => {
    const input = { tags: new Set(['x', 'y', 'z']) };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.tags).toBeInstanceOf(Set);
    expect([...output.tags].sort()).toEqual(['x', 'y', 'z']);
  });

  test('RegExp round-trip', () => {
    const input = { pattern: /hello/gi };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.pattern).toBeInstanceOf(RegExp);
    expect(output.pattern.source).toBe('hello');
    expect(output.pattern.flags).toBe('gi');
  });

  test('URL round-trip', () => {
    const input = { link: new URL('https://example.com/path') };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.link).toBeInstanceOf(URL);
    expect(output.link.href).toBe('https://example.com/path');
  });

  test('Nested custom types', () => {
    const input = {
      dates: new Set([new Date('2024-01-01'), new Date('2024-06-15')]),
      mapping: new Map<string, Date>([
        ['start', new Date('2024-01-01')],
        ['end', new Date('2024-12-31')],
      ]),
    };
    const json = stringify(input);
    const output = parse<typeof input>(json);

    expect(output.dates).toBeInstanceOf(Set);
    expect([...output.dates].every((d) => d instanceof Date)).toBe(true);

    expect(output.mapping).toBeInstanceOf(Map);
    expect(output.mapping.get('start')).toBeInstanceOf(Date);
  });
});

describe('Custom Types (User-defined handler)', () => {
  test('Custom class handler with isolated instance', () => {
    class Money {
      constructor(
        public amount: number,
        public currency: string
      ) {}
    }

    const tson = create();
    tson.register({
      name: 'Money',
      test: (v): v is Money => v instanceof Money,
      serialize: (m) => ({ amount: m.amount, currency: m.currency }),
      deserialize: (d) => {
        const data = d as { amount: number; currency: string };
        return new Money(data.amount, data.currency);
      },
    });

    const input = { price: new Money(99.99, 'USD') };
    const json = tson.stringify(input);
    const output = tson.parse<typeof input>(json);

    expect(output.price).toBeInstanceOf(Money);
    expect(output.price.amount).toBe(99.99);
    expect(output.price.currency).toBe('USD');
  });
});
