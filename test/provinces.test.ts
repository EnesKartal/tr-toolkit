import { describe, expect, it } from 'vitest';
import { getProvinceByName, getProvinceByPlateCode, provinces } from '../src/provinces.js';
import { trNormalizeForSearch } from '../src/text.js';

describe('provinces', () => {
  it('holds plate codes 01 to 81 once each, in order', () => {
    const expected = Array.from({ length: 81 }, (_, index) => String(index + 1).padStart(2, '0'));
    expect(provinces.map((province) => province.plateCode)).toEqual(expected);
  });

  it('holds 81 names that stay distinct after search folding', () => {
    expect(new Set(provinces.map((province) => trNormalizeForSearch(province.name))).size).toBe(81);
  });

  it.each([
    ['01', 'Adana'],
    ['06', 'Ankara'],
    ['33', 'Mersin'],
    ['34', 'İstanbul'],
    ['35', 'İzmir'],
    ['42', 'Konya'],
    ['63', 'Şanlıurfa'],
    ['64', 'Uşak'],
    ['76', 'Iğdır'],
    ['81', 'Düzce'],
  ])('maps plate %s to %s', (plateCode, name) => {
    expect(getProvinceByPlateCode(plateCode)?.name).toBe(name);
  });
});

describe('getProvinceByPlateCode', () => {
  it('accepts numbers and unpadded strings', () => {
    expect(getProvinceByPlateCode(34)?.name).toBe('İstanbul');
    expect(getProvinceByPlateCode(6)?.name).toBe('Ankara');
    expect(getProvinceByPlateCode('6')?.name).toBe('Ankara');
  });

  it.each([0, 82, -1, 1.5, NaN, '', '00', '82', '034', ' 34', 'ab'])(
    'returns undefined for %j',
    (code) => {
      expect(getProvinceByPlateCode(code)).toBeUndefined();
    },
  );
});

describe('getProvinceByName', () => {
  it.each(['istanbul', 'İSTANBUL', 'Istanbul', '  İstanbul '])('finds İstanbul from %j', (name) => {
    expect(getProvinceByName(name)?.plateCode).toBe('34');
  });

  it('finds every province by its exact name and ASCII-folded name', () => {
    for (const province of provinces) {
      expect(getProvinceByName(province.name)).toBe(province);
      expect(getProvinceByName(trNormalizeForSearch(province.name))).toBe(province);
    }
  });

  it.each(['', 'Atlantis', 'İçel', 'Afyon'])('returns undefined for %j', (name) => {
    expect(getProvinceByName(name)).toBeUndefined();
  });

  it('throws on non-strings', () => {
    expect(() => getProvinceByName(34 as unknown as string)).toThrow(TypeError);
  });
});
