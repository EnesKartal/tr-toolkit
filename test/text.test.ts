import { describe, expect, it } from 'vitest';
import {
  trCompare,
  trIncludes,
  trLowerCase,
  trNormalizeForSearch,
  trTitleCase,
  trUpperCase,
} from '../src/text.js';
import { randomInt, seededRandom } from './helpers.js';

const RUNS = 2000;
const ALPHABET = 'abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZâîûqwx 0-9.\'';

function randomText(random: () => number): string {
  let text = '';
  const length = randomInt(random, 30);
  for (let index = 0; index < length; index++) text += ALPHABET[randomInt(random, ALPHABET.length)];
  return text;
}

describe('trUpperCase', () => {
  it('maps i to İ and ı to I', () => {
    expect(trUpperCase('istanbul ılık')).toBe('İSTANBUL ILIK');
    expect(trUpperCase('çığ şöğüt')).toBe('ÇIĞ ŞÖĞÜT');
  });

  it('matches the runtime Turkish locale on random text', () => {
    const random = seededRandom(1);
    for (let run = 0; run < RUNS; run++) {
      const text = randomText(random);
      expect(trUpperCase(text)).toBe(text.toLocaleUpperCase('tr'));
    }
  });
});

describe('trLowerCase', () => {
  it('maps İ to a plain i and I to ı', () => {
    expect(trLowerCase('İSTANBUL ILIK')).toBe('istanbul ılık');
    expect(trLowerCase('İ')).toHaveLength(1);
  });

  it('treats a decomposed İ like the composed form', () => {
    expect(trLowerCase('I\u0307STANBUL')).toBe('istanbul');
  });

  it('matches the runtime Turkish locale on random text', () => {
    const random = seededRandom(2);
    for (let run = 0; run < RUNS; run++) {
      const text = randomText(random);
      expect(trLowerCase(text)).toBe(text.toLocaleLowerCase('tr'));
    }
  });

  it('round-trips Turkish letters through upper and lower case', () => {
    const letters = 'abcçdefgğhıijklmnoöprsştuüvyz';
    expect(trLowerCase(trUpperCase(letters))).toBe(letters);
  });
});

describe('trTitleCase', () => {
  it.each([
    ['istanbul', 'İstanbul'],
    ['ISPARTA', 'Isparta'],
    ['ıŞIK iĞDIR', 'Işık İğdır'],
    ["İSTANBUL'DA GÜZEL BİR GÜN", "İstanbul'da Güzel Bir Gün"],
    ['İSTANBUL’DA', 'İstanbul’da'],
    ['ali-veli', 'Ali-Veli'],
    ['  çift   boşluk ', '  Çift   Boşluk '],
    ['3d yazıcı', '3d Yazıcı'],
    ['(ankara)', '(Ankara)'],
    ['', ''],
  ])('converts %j to %j', (input, expected) => {
    expect(trTitleCase(input)).toBe(expected);
  });

  it('is idempotent on random text', () => {
    const random = seededRandom(3);
    for (let run = 0; run < RUNS; run++) {
      const once = trTitleCase(randomText(random));
      expect(trTitleCase(once)).toBe(once);
    }
  });
});

describe('trNormalizeForSearch', () => {
  it.each([
    ['IŞIK', 'isik'],
    ['ışık', 'isik'],
    ['ISIK', 'isik'],
    ['İSİK', 'isik'],
    ['Çağrı', 'cagri'],
    ['ÖĞÜT', 'ogut'],
    ['Kâğıt', 'kagit'],
    ['  İSTANBUL \t Üsküdar\n', 'istanbul uskudar'],
    ['   ', ''],
  ])('folds %j to %j', (input, expected) => {
    expect(trNormalizeForSearch(input)).toBe(expected);
  });

  it('folds composed and decomposed forms alike', () => {
    expect(trNormalizeForSearch('Şişli'.normalize('NFD'))).toBe(trNormalizeForSearch('Şişli'));
  });

  it('is idempotent and ignores case on random text', () => {
    const random = seededRandom(4);
    for (let run = 0; run < RUNS; run++) {
      const text = randomText(random);
      const folded = trNormalizeForSearch(text);
      expect(trNormalizeForSearch(folded)).toBe(folded);
      expect(trNormalizeForSearch(trUpperCase(text))).toBe(folded);
      expect(trNormalizeForSearch(trLowerCase(text))).toBe(folded);
    }
  });
});

describe('trIncludes', () => {
  it('matches across case and Turkish letters', () => {
    expect(trIncludes('Üsküdar, İSTANBUL', 'istanbul')).toBe(true);
    expect(trIncludes('Üsküdar, İSTANBUL', 'USKUDAR')).toBe(true);
    expect(trIncludes('Yağmur', 'ağm')).toBe(true);
  });

  it('returns false when the text is absent', () => {
    expect(trIncludes('Ankara', 'izmir')).toBe(false);
  });

  it('matches an empty or whitespace-only query, like String.prototype.includes', () => {
    expect(trIncludes('Ankara', '')).toBe(true);
    expect(trIncludes('Ankara', '   ')).toBe(true);
  });
});

describe('trCompare', () => {
  it('sorts the Turkish alphabet in order', () => {
    const alphabet = [...'abcçdefgğhıijklmnoöprsştuüvyz'];
    expect([...alphabet].reverse().sort(trCompare)).toEqual(alphabet);
  });

  it('sorts words where the code-point order is wrong', () => {
    const sorted = ['Zonguldak', 'Çorum', 'Şırnak', 'İzmir', 'Iğdır', 'Cizre', 'Düzce'].sort(trCompare);
    expect(sorted).toEqual(['Cizre', 'Çorum', 'Düzce', 'Iğdır', 'İzmir', 'Şırnak', 'Zonguldak']);
  });

  it('returns zero for equal strings and is antisymmetric', () => {
    expect(trCompare('Şişli', 'Şişli')).toBe(0);
    expect(Math.sign(trCompare('ılık', 'ilik'))).toBe(-1);
    expect(Math.sign(trCompare('ilik', 'ılık'))).toBe(1);
  });
});

describe('non-string input', () => {
  const helpers: Array<(value: string) => unknown> = [
    trUpperCase,
    trLowerCase,
    trTitleCase,
    trNormalizeForSearch,
    (value) => trIncludes(value, 'a'),
    (value) => trIncludes('a', value),
    (value) => trCompare(value, 'a'),
    (value) => trCompare('a', value),
  ];

  it('throws a TypeError', () => {
    for (const helper of helpers) {
      expect(() => helper(null as unknown as string)).toThrow(TypeError);
      expect(() => helper(1 as unknown as string)).toThrow(TypeError);
    }
  });
});
