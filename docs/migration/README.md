# Incremental Angular migration

This directory is the controlled migration hub. It preserves the original phase
sequence and does not convert the migration into a big-bang rewrite.

| Phase | Original objective | Status |
|---|---|---|
| 0 | Understand and freeze architecture, functionality, data and visual evidence | Complete |
| 1 | Stabilise the React/Vite legacy reference without weakening contracts | Complete |
| 2 | Order documentation and releases; retire obsolete deployment guidance; adopt a living visual baseline | Complete, including target hand-off |
| 3 | Establish the Angular Clean Architecture foundation and coexistence boundary | Complete |
| 4 | Migrate product surfaces incrementally with full vertical-slice gates | **In progress:** Progress, Pull Lab, Damage & Healing and Composition complete (4/11); production switch disabled |

The documentary hand-off performed at the end of Phase 3 closes an omission in
the execution of Phase 2; it does not create, rename or reorder a phase.

## Current ownership

- Angular owns its foundation, migration coordination, changelog, visual
  migration policy, Progress, Pull Lab, Damage & Healing and Composition frontend routes.
- The verified legacy frontend owns the remaining seven product surfaces and is
  the immediate rollback for all migrated routes until production cutover.
- The legacy Node/Nitro application owns backend, Iris, WCL, provider and
  persistence contracts.
- Production routing remains on the legacy application.

## Gate for the next original step

The first four complete vertical slices are implemented and recorded in
[Phase 4](./PHASE-4.md). The next product slice in that same phase should be
**Players**: freeze roster/profile ownership, HOME attendance, Reliability
version/publication gates, missing-profile semantics and the distinction between
character facts and performance evidence before changing its UI.

Players is a high-complexity slice because it joins report-scoped roster facts
with longitudinal HOME evidence and versioned Reliability without coercing
pending or contradicted evidence into a score. LIVE, Loot and Iris remain
deliberately deferred.

The following files are binding inputs:

- [parity matrix](./PARITY-MATRIX.md);
- [integral definition of done](../governance/MIGRATION-DEFINITION-OF-DONE.md);
- [living visual baseline](../visual/LIVING-VISUAL-BASELINE.md);
- [incremental ownership ADR](../architecture/ADR-001-INCREMENTAL-OWNERSHIP.md).
- [Composition frontend contract](../features/composition/README.md).
- [Damage & Healing frontend contract](../features/damage-healing/README.md).
- [Pull Lab frontend contract](../features/pull-lab/README.md).
- [Progress frontend contract](../features/progress/README.md).
