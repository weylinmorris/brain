# AGENTS Instructions

This repository contains a Next.js project written in TypeScript.

## Programmatic Checks

Before committing any changes ensure the following script runs without errors:

```bash
npm run checkall
```

This script runs linting, TypeScript type checks and formatting.

## Commit Guidelines

- Use concise commit messages in the imperative mood (e.g. "Add feature" or "Fix bug").
- Keep each commit focused on a single logical change.

## Project Structure

- `src/app` – Next.js app router pages and layouts
- `src/components` – React components grouped by feature
- `src/context` – React context providers for global state
- `src/hooks` – custom hooks used to interact with context state
- `src/reducers` – reducer functions and state/action types
- `src/lib` – client side API helpers
- `src/db` – Neo4j database client and repositories
- `src/types` – shared TypeScript types

The `@/*` path alias points to the `src` directory.

## State Conventions

State is managed using React context with reducers. Each slice lives in
`src/context` with a corresponding reducer under `src/reducers` and typed
actions in `src/reducers/<slice>/types.ts`. Custom hooks in `src/hooks`
(`useBlock`, `useProject`, `useSearch`) expose helper functions and dispatch
actions. The `RootProvider` combines all providers via `combineComponents`.

Prettier rules are configured in `.prettierrc` and Tailwind is enabled via
`tailwind.config.mjs`.

