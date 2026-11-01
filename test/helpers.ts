/** Deterministic PRNG (mulberry32), so a failing property run can be replayed. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(random: () => number, maxExclusive: number): number {
  return Math.floor(random() * maxExclusive);
}

export function randomDigits(random: () => number, length: number): string {
  let digits = '';
  for (let index = 0; index < length; index++) digits += randomInt(random, 10);
  return digits;
}

/** Appends TCKN check digits, using weights 3,1 rather than the 7,-1 form in src. */
export function makeTckn(firstNine: string): string {
  const digits = [...firstNine].map(Number);
  const weighted = digits.reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0);
  const tenth = (10 - (weighted % 10)) % 10;
  const eleventh = (digits.reduce((sum, digit) => sum + digit, 0) + tenth) % 10;
  return `${firstNine}${tenth}${eleventh}`;
}

/** Appends the VKN check digit, walking the digits right to left. */
export function makeVkn(firstNine: string): string {
  let sum = 0;
  [...firstNine].reverse().forEach((char, index) => {
    const place = index + 1;
    const shifted = (Number(char) + place) % 10;
    if (shifted !== 0) {
      const reduced = (shifted * 2 ** place) % 9;
      sum += reduced === 0 ? 9 : reduced;
    }
  });
  return `${firstNine}${(10 - (sum % 10)) % 10}`;
}

/** The IBAN's MOD-97 remainder for a check-digit pair, computed with BigInt. */
function ibanRemainder(check: string, bban: string): number {
  const expanded = [...`${bban}TR${check}`]
    .map((char) => parseInt(char, 36).toString())
    .join('');
  return Number(BigInt(expanded) % 97n);
}

/** Builds a Turkish IBAN from its 22-character BBAN. */
export function makeTrIban(bban: string): string {
  const check = 98 - ibanRemainder('00', bban);
  return `TR${String(check).padStart(2, '0')}${bban}`;
}
