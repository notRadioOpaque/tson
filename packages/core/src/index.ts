/**
 * @tson/core
 *
 * Core JSON parsing, stringification, and custom type serialization.
 *
 * @example
 * ```typescript
 * import { Tson } from '@tson/core';
 *
 * interface User {
 *   id: string;
 *   name: string;
 *   created: Date;
 * }
 *
 * const user: User = {
 *   id: '1',
 *   name: 'Radio',
 *   created: new Date(),
 * };
 *
 * const json = Tson.stringify(user);
 * const parsed = Tson.parse<User>(json);
 * ```
 */

// exports goes here...
