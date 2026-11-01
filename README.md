# @eneskartal/tr-toolkit

Turkish validation and locale helpers for TypeScript and JavaScript.

- **Validation:** VKN (tax number), TCKN (national ID) and Turkish IBAN checksums.
- **Casing:** `i`/`İ` and `ı`/`I` handled correctly, without relying on the runtime's locale data.
- **Search and sorting:** accent-insensitive matching and Turkish alphabetical order.
- **Provinces:** all 81 provinces with their official plate codes.

No runtime dependencies. Ships ESM, CommonJS and TypeScript types.

[Türkçe özet](#türkçe-özet)

## Install

```sh
npm install @eneskartal/tr-toolkit
```

Import from the package root, or from a subpath (`@eneskartal/tr-toolkit/validation`, `@eneskartal/tr-toolkit/text`,
`@eneskartal/tr-toolkit/provinces`) to load only that part. Both forms work with `import` and `require`.

## Validation

```ts
import { isValidVkn, isValidTckn, isValidTrIban } from '@eneskartal/tr-toolkit';

isValidVkn('1234567890'); // true
isValidVkn('1234567891'); // false: wrong check digit

isValidTckn('12345678950'); // true
isValidTckn('02345678950'); // false: cannot start with 0

isValidTrIban('TR330006100519786457841326'); // true
isValidTrIban('TR33 0006 1005 1978 6457 8413 26'); // false: contains spaces
```

These functions check format and checksum only. They make no network calls, so `true` does not
mean a number was ever issued or that an account exists. Some values that pass are obviously
fake, such as `11111111110`. To verify a real identity or tax record, use the official services.

### Input rules

| | `isValidVkn` | `isValidTckn` | `isValidTrIban` |
|---|---|---|---|
| Accepted form | exactly 10 ASCII digits | exactly 11 ASCII digits, first digit not 0 | 26 characters, uppercase |
| Whitespace | rejected | rejected | rejected |
| Non-string input | returns `false` | returns `false` | returns `false` |

The validators never trim or clean their input, so a `true` result means the exact string you
passed is safe to store. For the IDs, call `.trim()` first if you want to tolerate pasted
whitespace. For IBANs, use `normalizeTrIban`:

```ts
import { formatTrIban, isValidTrIban, normalizeTrIban } from '@eneskartal/tr-toolkit';

const iban = normalizeTrIban(' tr33 0006 1005 1978 6457 8413 26 ');
iban; // 'TR330006100519786457841326'
isValidTrIban(iban); // true
formatTrIban(iban); // 'TR33 0006 1005 1978 6457 8413 26'
```

`normalizeTrIban` removes all whitespace and uppercases. `formatTrIban` also groups the result in
fours for display. Neither one validates, and both throw a `TypeError` on non-strings.

`isValidTrIban` checks the structure (`TR`, 2 check digits, 5-digit bank code, 1 reserved digit,
16-character account) and MOD-97. It requires a digit in the reserved position but does not
require it to be `0`. It rejects check digits `00`, `01` and `99`, which pass the remainder test
but can never be produced by the ISO 7064 algorithm.

## Casing

JavaScript's default `toUpperCase` and `toLowerCase` get Turkish wrong:

```ts
import { trLowerCase, trTitleCase, trUpperCase } from '@eneskartal/tr-toolkit';

'istanbul'.toUpperCase(); // 'ISTANBUL', should be 'İSTANBUL'
trUpperCase('istanbul'); // 'İSTANBUL'
trUpperCase('ılık'); // 'ILIK'

'ISPARTA'.toLowerCase(); // 'isparta', should be 'ısparta'
trLowerCase('ISPARTA'); // 'ısparta'
trLowerCase('İZMİR'); // 'izmir'

trTitleCase("İSTANBUL'DA GÜZEL BİR GÜN"); // "İstanbul'da Güzel Bir Gün"
trTitleCase('ali-veli ışık'); // 'Ali-Veli Işık'
```

`trTitleCase` capitalizes every word, including conjunctions such as `ve`. Hyphens start a new
word and apostrophes do not.

## Search

```ts
import { trIncludes, trNormalizeForSearch } from '@eneskartal/tr-toolkit';

trNormalizeForSearch('  IŞIK  Çağrı '); // 'isik cagri'

trIncludes('Üsküdar, İSTANBUL', 'istanbul'); // true
trIncludes('Üsküdar, İSTANBUL', 'USKUDAR'); // true
```

`trNormalizeForSearch` folds case and diacritics, treats `ı` and `i` as the same letter, collapses
whitespace and trims. Use its output as a match key, for example in a search column, not as
display text. As with `String.prototype.includes`, an empty query matches everything.

## Sorting

```ts
import { trCompare } from '@eneskartal/tr-toolkit';

['Zonguldak', 'Çorum', 'Şırnak', 'İzmir', 'Iğdır'].sort(trCompare);
// ['Çorum', 'Iğdır', 'İzmir', 'Şırnak', 'Zonguldak']
```

`trCompare` uses `Intl.Collator('tr')`. Unlike the other helpers, it depends on the runtime
shipping Turkish ICU data. Node.js and browsers do by default. In a runtime without it, the order
silently falls back to the root collation.

All casing, search and sorting helpers throw a `TypeError` on non-strings.

## Provinces

```ts
import { getProvinceByName, getProvinceByPlateCode, provinces } from '@eneskartal/tr-toolkit';

provinces.length; // 81
provinces[0]; // { plateCode: '01', name: 'Adana' }

getProvinceByPlateCode(34); // { plateCode: '34', name: 'İstanbul' }
getProvinceByPlateCode('6'); // { plateCode: '06', name: 'Ankara' }
getProvinceByName('ISTANBUL'); // { plateCode: '34', name: 'İstanbul' }
```

Lookups return `undefined` when nothing matches. `getProvinceByName` only knows current official
names, so `İçel` (now Mersin) and the short form `Afyon` do not match.

District (ilçe) data is not included. See the roadmap.

## API

| Export | Subpath | Signature |
|---|---|---|
| `isValidVkn` | `@eneskartal/tr-toolkit/validation` | `(value: unknown) => boolean` |
| `isValidTckn` | `@eneskartal/tr-toolkit/validation` | `(value: unknown) => boolean` |
| `isValidTrIban` | `@eneskartal/tr-toolkit/validation` | `(value: unknown) => boolean` |
| `normalizeTrIban` | `@eneskartal/tr-toolkit/validation` | `(value: string) => string` |
| `formatTrIban` | `@eneskartal/tr-toolkit/validation` | `(value: string) => string` |
| `trUpperCase` | `@eneskartal/tr-toolkit/text` | `(value: string) => string` |
| `trLowerCase` | `@eneskartal/tr-toolkit/text` | `(value: string) => string` |
| `trTitleCase` | `@eneskartal/tr-toolkit/text` | `(value: string) => string` |
| `trNormalizeForSearch` | `@eneskartal/tr-toolkit/text` | `(value: string) => string` |
| `trIncludes` | `@eneskartal/tr-toolkit/text` | `(text: string, query: string) => boolean` |
| `trCompare` | `@eneskartal/tr-toolkit/text` | `(a: string, b: string) => number` |
| `provinces` | `@eneskartal/tr-toolkit/provinces` | `readonly Province[]` |
| `getProvinceByPlateCode` | `@eneskartal/tr-toolkit/provinces` | `(code: string \| number) => Province \| undefined` |
| `getProvinceByName` | `@eneskartal/tr-toolkit/provinces` | `(name: string) => Province \| undefined` |

## Roadmap

- **v0.2:** e-Fatura UBL-TR generation and validation.
- **District data:** to be added once there is a source that is both correct and under a licence
  compatible with MIT. No such source has been verified yet.

## Compatibility

Tested on Node.js 22, 24 and 26. The code targets ES2020.

## Licence

[MIT](./LICENSE)

## Türkçe özet

`@eneskartal/tr-toolkit`, Türkiye'ye özgü doğrulama ve yerel ayar yardımcıları sunan, bağımlılığı olmayan bir
TypeScript/JavaScript paketidir.

- **Doğrulama:** `isValidVkn`, `isValidTckn`, `isValidTrIban`. Yalnız biçimi ve sağlama basamağını
  denetler; numaranın gerçekten verilmiş olduğunu kanıtlamaz, ağ çağrısı yapmaz.
- **Boşluklar:** Doğrulayıcılar girdiyi temizlemez; boşluklu değer `false` döner. IBAN için önce
  `normalizeTrIban` kullanın.
- **Büyük/küçük harf:** `trUpperCase`, `trLowerCase`, `trTitleCase` (`i/İ` ve `ı/I` doğru çalışır).
- **Arama ve sıralama:** `trNormalizeForSearch`, `trIncludes`, `trCompare`.
- **İller:** `provinces`, `getProvinceByPlateCode`, `getProvinceByName` (81 il, plaka kodlarıyla).

```ts
import { isValidTrIban, normalizeTrIban, trIncludes, trUpperCase } from '@eneskartal/tr-toolkit';

trUpperCase('istanbul'); // 'İSTANBUL'
trIncludes('Üsküdar, İSTANBUL', 'uskudar'); // true
isValidTrIban(normalizeTrIban('tr33 0006 1005 1978 6457 8413 26')); // true
```

İlçe verisi bu sürümde yok: hem doğru hem de MIT ile uyumlu lisanslı bir kaynak henüz
doğrulanmadı.
