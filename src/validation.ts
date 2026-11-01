import { assertString } from './assert.js';

const VKN_FORMAT = /^[0-9]{10}$/;
const TCKN_FORMAT = /^[1-9][0-9]{10}$/;
// TR + 2 check digits + 5-digit bank code + 1 reserved digit + 16-character account.
const TR_IBAN_FORMAT = /^TR[0-9]{2}[0-9]{6}[0-9A-Z]{16}$/;
// ISO 7064 MOD 97-10 only ever produces check digits in this range, so 00, 01
// and 99 are rejected even though they can satisfy the remainder test.
const MIN_IBAN_CHECK = 2;
const MAX_IBAN_CHECK = 98;

function digitAt(value: string, index: number): number {
  return value.charCodeAt(index) - 48;
}

/**
 * Checks the format and check digit of a 10-digit Turkish tax number (VKN).
 *
 * Strict: the value must be exactly 10 ASCII digits, with no surrounding or
 * inner whitespace. Non-strings return `false`. A `true` result only means the
 * checksum holds, not that the number is registered.
 */
export function isValidVkn(value: unknown): boolean {
  if (typeof value !== 'string' || !VKN_FORMAT.test(value)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index++) {
    const placeFromRight = 9 - index;
    const shifted = (digitAt(value, index) + placeFromRight) % 10;
    if (shifted !== 0) {
      sum += (shifted * 2 ** placeFromRight) % 9 || 9;
    }
  }
  return (10 - (sum % 10)) % 10 === digitAt(value, 9);
}

/**
 * Checks the format and check digits of an 11-digit Turkish national ID (TCKN).
 *
 * Strict: the value must be exactly 11 ASCII digits, not starting with 0, with
 * no surrounding or inner whitespace. Non-strings return `false`. A `true`
 * result only means the checksum holds, not that the number was ever issued.
 */
export function isValidTckn(value: unknown): boolean {
  if (typeof value !== 'string' || !TCKN_FORMAT.test(value)) return false;

  let oddPlaces = 0;
  let evenPlaces = 0;
  for (let index = 0; index < 9; index++) {
    if (index % 2 === 0) oddPlaces += digitAt(value, index);
    else evenPlaces += digitAt(value, index);
  }
  // The difference can be negative, and JavaScript's % keeps the sign.
  const tenth = (((7 * oddPlaces - evenPlaces) % 10) + 10) % 10;
  const eleventh = (oddPlaces + evenPlaces + tenth) % 10;
  return tenth === digitAt(value, 9) && eleventh === digitAt(value, 10);
}

/**
 * Checks the format and MOD-97 checksum of a Turkish IBAN.
 *
 * Strict: the value must be the 26-character electronic form, uppercase and
 * without spaces. Use {@link normalizeTrIban} first for user input. Non-strings
 * return `false`. A `true` result does not mean the account exists.
 */
export function isValidTrIban(value: unknown): boolean {
  if (typeof value !== 'string' || !TR_IBAN_FORMAT.test(value)) return false;

  const check = Number(value.slice(2, 4));
  if (check < MIN_IBAN_CHECK || check > MAX_IBAN_CHECK) return false;

  const rearranged = value.slice(4) + value.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    // Base 36 maps 0-9 to themselves and A-Z to 10-35, as ISO 13616 requires.
    const expanded = parseInt(char, 36);
    remainder = (remainder * (expanded < 10 ? 10 : 100) + expanded) % 97;
  }
  return remainder === 1;
}

/**
 * Removes all whitespace and uppercases, producing the form
 * {@link isValidTrIban} accepts. It does not validate.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function normalizeTrIban(value: string): string {
  assertString(value, 'normalizeTrIban');
  return value.replace(/\s/g, '').toUpperCase();
}

/**
 * Normalizes, then groups into blocks of four for display:
 * `TR33 0006 1005 1978 6457 8413 26`. It does not validate.
 *
 * @throws {TypeError} If the input is not a string.
 */
export function formatTrIban(value: string): string {
  assertString(value, 'formatTrIban');
  return (normalizeTrIban(value).match(/.{1,4}/g) ?? []).join(' ');
}
