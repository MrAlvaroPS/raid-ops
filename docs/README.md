# AvoiD Raid Operations documentation

This is the canonical documentation entry point for the Angular migration and
the future frontend. A document has one active owner; frozen evidence may be
retained in the legacy repository, but it is not edited in two places.

## Migration

- [Controlled migration hub](./migration/README.md)
- [Functional parity matrix](./migration/PARITY-MATRIX.md)
- [Migration guardrails](./migration/MIGRATION-GUARDRAILS.md)
- [Current architecture baseline](./migration/baseline/CURRENT-ARCHITECTURE-BASELINE.md)
- [Data and persistence baseline](./migration/baseline/DATA-PERSISTENCE-BASELINE.md)
- [Phase 0](./migration/PHASE-0.md)
- [Phase 1](./migration/PHASE-1.md)
- [Phase 2](./migration/PHASE-2.md)
- [Phase 3](./migration/PHASE-3.md)
- [Phase 4 — incremental product migration](./migration/PHASE-4.md)

## Migrated features

- [Composition behaviour, contract and visual decisions](./features/composition/README.md)
- [Damage & Healing behaviour, metric contract and visual decisions](./features/damage-healing/README.md)

## Architecture and governance

- [Clean Architecture contract](./architecture/CLEAN-ARCHITECTURE.md)
- [Incremental ownership ADR](./architecture/ADR-001-INCREMENTAL-OWNERSHIP.md)
- [Documentation ownership](./governance/DOCUMENTATION-OWNERSHIP.md)
- [Integral migration definition of done](./governance/MIGRATION-DEFINITION-OF-DONE.md)

## Releases and visuals

- [Single active changelog](./releases/CHANGELOG.md)
- [Release provenance and historical limits](./releases/RELEASE-PROVENANCE.md)
- [Living visual baseline](./visual/LIVING-VISUAL-BASELINE.md)
- [Frozen legacy capture description](./visual/LEGACY-VISUAL-BASELINE.md)

## Backend contracts

The Node/Nitro backend still runs from `avoid-raid-ops`. Its WCL, Iris,
provider, evidence, persistence and operational contracts remain canonical in
that repository while it owns the implementation. They are deliberately not
copied here because two active copies would be unsafe. Their ownership and
transfer conditions are recorded in the documentation ownership matrix.
