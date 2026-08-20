# Incremental Angular migration

This directory is the controlled migration hub. It preserves the original phase
sequence and does not convert the migration into a big-bang rewrite.

| Phase | Original objective | Status |
|---|---|---|
| 0 | Understand and freeze architecture, functionality, data and visual evidence | Complete |
| 1 | Stabilise the React/Vite legacy reference without weakening contracts | Complete |
| 2 | Order documentation and releases; retire obsolete deployment guidance; adopt a living visual baseline | Complete, including target hand-off |
| 3 | Establish the Angular Clean Architecture foundation and coexistence boundary | Complete |

The documentary hand-off performed at the end of Phase 3 closes an omission in
the execution of Phase 2; it does not create, rename or reorder a phase.

## Current ownership

- Angular owns its foundation, migration coordination, changelog and visual
  migration policy.
- The verified legacy frontend owns all eleven product surfaces.
- The legacy Node/Nitro application owns backend, Iris, WCL, provider and
  persistence contracts.
- Production routing remains on the legacy application.

## Gate for the next original step

The next product work is the first complete vertical slice, using Composition as
the agreed low-risk pattern. It cannot start merely by copying markup. It must
include API decoding, domain/application boundaries, real states, responsive
visual comparison, accessibility, documentation, ownership switch and immediate
rollback. LIVE, Loot and Iris remain excluded from the first slice.

The following files are binding inputs:

- [parity matrix](./PARITY-MATRIX.md);
- [integral definition of done](../governance/MIGRATION-DEFINITION-OF-DONE.md);
- [living visual baseline](../visual/LIVING-VISUAL-BASELINE.md);
- [incremental ownership ADR](../architecture/ADR-001-INCREMENTAL-OWNERSHIP.md).
