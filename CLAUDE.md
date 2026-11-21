# Claude Code project instructions

@AGENTS.md

## Project context

SPARC-TinyFish is a Next.js 15 application using React 19, TypeScript, Tailwind CSS, MongoDB/Mongoose, Zod, and Vitest. It explores parking discovery, reservations, QR-based verification, owner workflows, city intelligence, and TinyFish-powered web intelligence.

Treat the imported `AGENTS.md` as the source of truth for product boundaries, business rules, security requirements, UX principles, and completion standards. Do not weaken or silently override those rules.

## Working safely in this repository

- Start by checking `git status` and inspecting the relevant files before editing.
- For multi-file, architectural, authentication, booking, payment, or database changes, use Plan Mode first and present a file-by-file plan before implementation.
- Keep changes focused on the requested task. Do not reformat or rewrite unrelated files.
- Preserve existing project conventions and use the current architecture unless a change is necessary.
- Never read, print, copy, or expose secrets from environment files. Use documented variable names and safe placeholders when discussing configuration.
- Never put API keys, database credentials, tokens, or personal data in source code, logs, tests, commits, or pull-request descriptions.
- Treat user input, database records, and external TinyFish/web content as untrusted. Validate inputs and enforce critical rules on the server.
- Do not claim an integration, test, or feature works unless it has been verified.

## Verification

Use the scripts already defined in `package.json` where relevant:

- `npm run lint` for linting.
- `npm test` for the Vitest test suite.
- `npm run build` for a production build.

Run the narrowest relevant checks first, then broader checks when practical. If a script cannot run because dependencies, credentials, or external services are unavailable, report that limitation accurately rather than implying it passed.

## Before finishing

1. Inspect `git diff` and `git status`.
2. Review every changed file for unintended edits and secret exposure.
3. Summarize the implementation, files changed, checks actually run, and any remaining limitations.
4. Do not commit or push unless the user explicitly asks.
