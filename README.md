# AvoiD Raid Operations — Angular

Incremental Angular replacement for the legacy `avoid-raid-ops` frontend.

Current status: **Phase 3 foundation and documentary hand-off complete**. Angular owns only its technical foundation page. Every product surface remains explicitly owned by the verified legacy application until its vertical slice passes data-contract, behaviour, visual, documentation and rollback gates.

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

The canonical documentation entry point is [`docs/README.md`](./docs/README.md). It includes the migrated phase history, release changelog, visual evidence, ownership rules and the integral definition of done. Backend/Iris/WCL operating contracts remain beside the legacy backend until that backend changes owner.
