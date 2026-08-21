# Incremental Angular migration

This directory is the controlled migration hub. It preserves the original phase
sequence and does not convert the migration into a big-bang rewrite.

| Phase | Original objective                                                                                    | Status                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Understand and freeze architecture, functionality, data and visual evidence                           | Complete                                                                                                                                                    |
| 1     | Stabilise the React/Vite legacy reference without weakening contracts                                 | Complete                                                                                                                                                    |
| 2     | Order documentation and releases; retire obsolete deployment guidance; adopt a living visual baseline | Complete, including target hand-off                                                                                                                         |
| 3     | Establish the Angular Clean Architecture foundation and coexistence boundary                          | Complete                                                                                                                                                    |
| 4     | Migrate product surfaces incrementally with full vertical-slice gates                                 | **In progress:** Command Center, Defensive Audit, Players, Progress, Pull Lab, Damage & Healing and Composition complete (7/11); production switch disabled |

The documentary hand-off performed at the end of Phase 3 closes an omission in
the execution of Phase 2; it does not create, rename or reorder a phase.

## Current ownership

- Angular owns its foundation, migration coordination, changelog, visual
  migration policy, Command Center, Defensive Audit, Players, Progress, Pull
  Lab, Damage & Healing and Composition frontend routes.
- The verified legacy frontend owns the remaining four product surfaces and is
  the immediate rollback for all migrated routes until production cutover.
- The legacy Node/Nitro application owns backend, Iris, WCL, provider and
  persistence contracts.
- Production routing remains on the legacy application.

## Gate for the next original step

The first seven complete vertical slices are implemented and recorded in
[Phase 4](./PHASE-4.md). The next recommended slice in that same phase is
**LIVE**: freeze manifest ownership, change-driven polling, cancellation,
closed-pull change detection, partial hydration, rate-budget accounting and
stop/restart semantics before replacing its overlapping legacy runtimes.

LIVE is a **very-high-complexity** slice because incorrect polling can spend WCL
budget, race scopes, duplicate persisted work or render an open pull as closed.
Loot and the two Mechanics products remain deliberately deferred.

The following files are binding inputs:

- [parity matrix](./PARITY-MATRIX.md);
- [integral definition of done](../governance/MIGRATION-DEFINITION-OF-DONE.md);
- [living visual baseline](../visual/LIVING-VISUAL-BASELINE.md);
- [incremental ownership ADR](../architecture/ADR-001-INCREMENTAL-OWNERSHIP.md).
- [Composition frontend contract](../features/composition/README.md).
- [Damage & Healing frontend contract](../features/damage-healing/README.md).
- [Pull Lab frontend contract](../features/pull-lab/README.md).
- [Progress frontend contract](../features/progress/README.md).
- [Players frontend contract](../features/players/README.md).
- [Defensive Audit frontend contract](../features/defensive-audit/README.md).
- [Command Center frontend contract](../features/command-center/README.md).
