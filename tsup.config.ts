import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/validation.ts', 'src/text.ts', 'src/provinces.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2020',
});
