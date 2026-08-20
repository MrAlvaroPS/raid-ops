# Phase 0 exit checklist

Phase 0 is complete when the current system can be reconstructed and compared without relying on memory or on the outdated Golden bundle alone.

## Repository and scope

- [x] Work is isolated from `main` on `phase0-angular-migration-baseline`.
- [x] Source and Angular target repositories are identified.
- [x] Phase 0 makes no functional Angular or Iris behaviour change.
- [x] WCL/provider acquisition is explicitly zero.

## Architecture and functionality

- [x] Current frontend, backend and persistence topology documented.
- [x] All product sections and cross-cutting Data & Logs surface mapped.
- [x] Evidence planes and difficulty/partition boundaries documented.
- [x] Current owner and intended data boundary recorded per section.
- [x] Known fixture leakage and ownership conflicts recorded as defects.

## Reproducible evidence

- [x] Machine-readable file, route, asset, documentation and duplicate inventory generated.
- [x] Dynamic Loot asset references included.
- [x] Desktop offline screenshot captured for all ten sections.
- [x] Mobile offline screenshot captured for all ten sections.
- [x] Screenshot hashes and audit metadata generated.
- [x] Data & Logs reachability failure recorded instead of hidden.
- [x] No raw corpus or credentials included in committed evidence.

## Data safety

- [x] Local corpus copied to a Git-ignored snapshot.
- [x] Backup verified per file and with an aggregate digest.
- [x] Browser cache classified as derived rather than authoritative.
- [x] Missing persistent `IRIS_DATA_DIR` state recorded.
- [x] External/local database discrepancy recorded for confirmation.
- [x] Restore procedure documented without adding a destructive automated command.

## Quality baseline

- [x] Existing unit and critical test failures counted before migration.
- [x] Failures classified at a high level as stale exact-wiring expectations or real contract/ownership regressions.
- [x] Phase 1 is assigned responsibility for returning `test`, `test:critical` and `build` to green.
- [x] Angular target is recorded as a clean scaffold, not a partially migrated product.

## Exit decision

**Decision: GO to Phase 1.** `npm run migration:verify` passes with all committed artefacts, screenshot hashes and the local backup marker consistent.

Known product defects do not block Phase 0 because they are now reproducible inputs to Phase 1. They do block feature migration: no Angular vertical slice may begin while its source contract or fixture ownership remains ambiguous.

Phase 1 should run with a high-reasoning model. It must classify failing tests, correct explicit-difficulty regressions, centralise release/configuration truth and establish a green legacy baseline without weakening evidence contracts.
