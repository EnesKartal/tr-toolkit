import { assertString } from './assert.js';

/**
 * Uppercases with Turkish rules: `i` becomes `İ` and `ı` becomes `I`.
 * Does not depend on the runtime's locale data.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function trUpperCase(value: string): string {
  assertString(value, 'trUpperCase');
  return value.replace(/i/g, 'İ').toUpperCase();
}

/**
 * Lowercases with Turkish rules: `İ` becomes `i` and `I` becomes `ı`.
 * Does not depend on the runtime's locale data.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function trLowerCase(value: string): string {
  assertString(value, 'trLowerCase');
  return value
    .replace(/I\u0307|İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

/**
 * Capitalizes the first letter of each word and lowercases the rest, with
 * Turkish rules. Hyphens start a new word; apostrophes do not, so
 * `İSTANBUL'DA` becomes `İstanbul'da`. Every word is capitalized, including
 * conjunctions such as `ve`.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function trTitleCase(value: string): string {
  assertString(value, 'trTitleCase');
  return trLowerCase(value).replace(
    /(^|[^\p{L}\p{M}\p{N}'’])(\p{L})/gu,
    (_match, boundary: string, letter: string) => boundary + trUpperCase(letter),
  );
}

/**
 * Folds text for accent- and case-insensitive matching: lowercases, maps
 * `ı` and `i` together, strips diacritics (`ş` to `s`, `â` to `a`), collapses
 * whitespace runs to one space and trims. `IŞIK`, `ışık` and `isik` all give
 * `isik`. The result is a match key, not display text.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function trNormalizeForSearch(value: string): string {
  assertString(value, 'trNormalizeForSearch');
  return trLowerCase(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tests whether `text` contains `query` after {@link trNormalizeForSearch} is
 * applied to both. As with `String.prototype.includes`, an empty query matches.
 *
 * @throws {TypeError} If either input is not a string.
 */
export function trIncludes(text: string, query: string): boolean {
  return trNormalizeForSearch(text).includes(trNormalizeForSearch(query));
}

let collator: Intl.Collator | undefined;

/**
 * Compares strings in Turkish alphabetical order, for `Array.prototype.sort`.
 * Uses `Intl.Collator('tr')`, so it depends on the runtime shipping Turkish
 * ICU data; without it, the order silently falls back to the root collation.
 *
 * @throws {TypeError} If either input is not a string.
 */
export function trCompare(a: string, b: string): number {
  assertString(a, 'trCompare');
  assertString(b, 'trCompare');
  collator ??= new Intl.Collator('tr');
  return collator.compare(a, b);
}
