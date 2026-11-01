import { describe, expect, it } from 'vitest';
import {
  formatTrIban,
  isValidTckn,
  isValidTrIban,
  isValidVkn,
  normalizeTrIban,
} from '../src/validation.js';
import { makeTckn, makeTrIban, makeVkn, randomDigits, randomInt, seededRandom } from './helpers.js';

const RUNS = 2000;
const NON_STRINGS: unknown[] = [
  undefined,
  null,
  12345678950,
  4540536920n,
  true,
  {},
  ['4540536920'],
  new String('4540536920'),
];

function substituteDigit(value: string, index: number, offset: number): string {
  const replaced = (Number(value[index]) + offset) % 10;
  return value.slice(0, index) + replaced + value.slice(index + 1);
}

describe('isValidVkn', () => {
  it('accepts the example published by python-stdnum (stdnum.tr.vkn)', () => {
    expect(isValidVkn('4540536920')).toBe(true);
  });

  it('accepts a hand-derived value from the sequential body 123456789', () => {
    // Each digit plus its place from the right is 10, so every term is skipped: sum 0, check 0.
    expect(isValidVkn('1234567890')).toBe(true);
  });

  it('rejects the invalid examples published by python-stdnum', () => {
    expect(isValidVkn('4540536921')).toBe(false);
    expect(isValidVkn('454053692')).toBe(false);
  });

  it('accepts a leading zero, which VKNs may have', () => {
    expect(isValidVkn(makeVkn('012345678'))).toBe(true);
  });

  it.each(NON_STRINGS)('rejects the non-string %s', (value) => {
    expect(isValidVkn(value)).toBe(false);
  });

  it.each(['', ' 4540536920', '4540536920 ', '45405 36920', '4540536920\n', '454053692a', '٤٥٤٠٥٣٦٩٢٠'])(
    'rejects the malformed string %j',
    (value) => {
      expect(isValidVkn(value)).toBe(false);
    },
  );

  it('accepts exactly one check digit for any nine-digit body', () => {
    const random = seededRandom(1);
    for (let run = 0; run < RUNS; run++) {
      const body = randomDigits(random, 9);
      const valid = [...'0123456789'].filter((digit) => isValidVkn(body + digit));
      expect(valid).toEqual([makeVkn(body).slice(-1)]);
    }
  });
});

describe('isValidTckn', () => {
  it('accepts a hand-derived value from the sequential body 123456789', () => {
    // Odd places sum to 25 and even places to 20: (7*25 - 20) % 10 = 5, (45 + 5) % 10 = 0.
    expect(isValidTckn('12345678950')).toBe(true);
  });

  it('handles a negative intermediate in the tenth-digit formula', () => {
    // Odd places sum to 1 and even places to 36: 7 - 36 = -29, whose floored
    // modulo is 1. A bare % gives -9 and would reject this value.
    expect(isValidTckn('19090909018')).toBe(true);
  });

  it('rejects a leading zero even when the check digits hold', () => {
    expect(isValidTckn(makeTckn('012345678'))).toBe(false);
  });

  it.each(NON_STRINGS)('rejects the non-string %s', (value) => {
    expect(isValidTckn(value)).toBe(false);
  });

  it.each(['', ' 12345678950', '12345678950 ', '123456 78950', '1234567895', '123456789501', '1234567895a'])(
    'rejects the malformed string %j',
    (value) => {
      expect(isValidTckn(value)).toBe(false);
    },
  );

  it('accepts generated values and satisfies the 8 x odd-places identity', () => {
    const random = seededRandom(2);
    for (let run = 0; run < RUNS; run++) {
      const value = makeTckn(`${randomInt(random, 9) + 1}${randomDigits(random, 8)}`);
      const oddPlaces = [0, 2, 4, 6, 8].reduce((sum, index) => sum + Number(value[index]), 0);
      expect(isValidTckn(value)).toBe(true);
      expect(Number(value[10])).toBe((8 * oddPlaces) % 10);
    }
  });

  it('detects every single-digit substitution', () => {
    const random = seededRandom(3);
    for (let run = 0; run < RUNS; run++) {
      const value = makeTckn(`${randomInt(random, 9) + 1}${randomDigits(random, 8)}`);
      const mutated = substituteDigit(value, randomInt(random, 11), randomInt(random, 9) + 1);
      expect(isValidTckn(mutated)).toBe(false);
    }
  });
});

describe('isValidTrIban', () => {
  const EXAMPLE = 'TR330006100519786457841326';

  it('accepts the example from the SWIFT IBAN registry', () => {
    expect(isValidTrIban(EXAMPLE)).toBe(true);
  });

  it('accepts generated values, including letters in the account field', () => {
    const random = seededRandom(4);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let run = 0; run < RUNS; run++) {
      let account = '';
      for (let index = 0; index < 16; index++) account += letters[randomInt(random, letters.length)];
      expect(isValidTrIban(makeTrIban(`${randomDigits(random, 6)}${account}`))).toBe(true);
    }
  });

  it('does not require the reserved digit to be zero', () => {
    expect(isValidTrIban(makeTrIban(`000615${'1'.repeat(16)}`))).toBe(true);
  });

  it('detects every single-digit substitution', () => {
    const random = seededRandom(5);
    for (let run = 0; run < RUNS; run++) {
      const value = makeTrIban(randomDigits(random, 22));
      const index = randomInt(random, 24) + 2;
      expect(isValidTrIban(substituteDigit(value, index, randomInt(random, 9) + 1))).toBe(false);
    }
  });

  it.each([
    ['02', '99'],
    ['98', '01'],
    ['97', '00'],
  ])('accepts check digits %s but rejects %s, which share a remainder', (valid, invalid) => {
    const random = seededRandom(6);
    let iban = makeTrIban(randomDigits(random, 22));
    while (iban.slice(2, 4) !== valid) iban = makeTrIban(randomDigits(random, 22));
    const alias = `TR${invalid}${iban.slice(4)}`;
    expect(isValidTrIban(iban)).toBe(true);
    expect(isValidTrIban(alias)).toBe(false);
  });

  it.each(NON_STRINGS)('rejects the non-string %s', (value) => {
    expect(isValidTrIban(value)).toBe(false);
  });

  it.each([
    '',
    'TR33 0006 1005 1978 6457 8413 26',
    ' TR330006100519786457841326',
    'tr330006100519786457841326',
    'TR33000610051978645784132',
    'TR3300061005197864578413260',
    'DE330006100519786457841326',
    'TR33000A100519786457841326',
    'TR330006100519786457841-26',
  ])('rejects the malformed string %j', (value) => {
    expect(isValidTrIban(value)).toBe(false);
  });
});

describe('normalizeTrIban and formatTrIban', () => {
  it('turns user input into the form the validator accepts', () => {
    const normalized = normalizeTrIban(' tr33 0006\u00a01005\t1978 6457 8413 26\n');
    expect(normalized).toBe('TR330006100519786457841326');
    expect(isValidTrIban(normalized)).toBe(true);
  });

  it('groups into blocks of four, whatever the input spacing', () => {
    expect(formatTrIban('tr330006100519786457841326')).toBe('TR33 0006 1005 1978 6457 8413 26');
    expect(formatTrIban('TR33 0006 1005 1978 6457 8413 26')).toBe('TR33 0006 1005 1978 6457 8413 26');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeTrIban('  ')).toBe('');
    expect(formatTrIban('  ')).toBe('');
  });

  it('throws on non-strings', () => {
    expect(() => normalizeTrIban(1 as unknown as string)).toThrow(TypeError);
    expect(() => formatTrIban(null as unknown as string)).toThrow(TypeError);
  });
});
