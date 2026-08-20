# AvoiD Raid Operations — Angular

Incremental Angular replacement for the legacy `avoid-raid-ops` frontend.

Current status: **Phase 2 foundation**. Angular owns only its technical foundation page. Every product surface remains explicitly owned by the verified legacy application until its vertical slice passes data-contract, behaviour, visual and rollback gates.

## Commands

```powershell
npm start
npm test
npm run build
npm run verify
```

## Structure

```text
src/app/
  core/       runtime configuration and backend boundary
  shell/      application composition and navigation
  features/   vertical slices with domain/application/infrastructure/presentation
  shared/     genuinely reusable UI or utilities only
```

Architecture and migration decisions live under [`docs/`](./docs/).
