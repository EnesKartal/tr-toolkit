# Contributing

Bug reports and pull requests are welcome. For a new feature, please open an issue first so we can
agree that it fits the package.

## Setup

Requires Node.js 22 or newer.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

## Rules

- **No runtime dependencies.**
- **Behaviour changes come with tests.** Bug fixes should include a test that fails without the fix.
- **Never add a real person's or company's number to the repository or to issues.** Generate values
  with the helpers in `test/helpers.ts`, or use a sequential body such as `123456789`. The only
  exceptions are examples already published with an algorithm's reference documentation, and those
  must be cited.
- **Record where data comes from.** A pull request that adds or corrects data must link a source
  and confirm its licence is compatible with MIT. Do not add data written from memory or copied
  from a source with an unclear or incompatible licence.
- **Add a line to `CHANGELOG.md`** for any user-visible change.
