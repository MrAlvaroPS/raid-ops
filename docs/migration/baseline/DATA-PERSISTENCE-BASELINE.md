# Data and persistence baseline

## Authority before migration

The frontend migration must not move, rewrite or reinterpret persisted evidence. Angular initially consumes the existing Nitro APIs.

| Store | Current role | Migration treatment |
|---|---|---|
| Vercel Blob | Production corpus when configured | Keep behind the existing corpus adapter. |
| `AVOID_CORPUS_LOCAL_DIR` | Primary local corpus JSON | Back up and preserve byte-for-byte before persistence changes. |
| `.raidops-corpus` | Default local fallback | Same corpus contract; never commit. |
| `IRIS_DATA_DIR/knowledge` | Optional persistent active/candidate game knowledge | Preserve when configured; otherwise current runtime is process-memory. |
| Browser Cache Storage | Derived delivery cache | Not authoritative; may be discarded and rebuilt from persistent stores. |
| Loot ledger | Corpus-backed local/Blob data | Preserve keys and award history; no automatic award semantics. |
| `.raidops-simc` | Managed SimulationCraft worker state | Operational cache/tooling, not raid evidence or database. |

## Verified snapshot

Phase 0 created a verified local snapshot under the Git-ignored `.migration-backups/` directory.

The committed evidence manifest contains no raw corpus, filenames, report codes or credentials. It records only:

- snapshot identifier;
- source kind and status;
- file count and bytes;
- aggregate SHA-256 used to verify the copied snapshot.

Current baseline:

- corpus: **1,251 files**;
- corpus bytes: **292,735,585**;
- copy verified by per-file hashes;
- WCL/provider calls: **0**;
- source mutations: **0**.

The exact snapshot identifier and aggregate digest are stored in `evidence/persistence-baseline.json`.

No `IRIS_DATA_DIR` source was configured during the snapshot. The generic game-knowledge store therefore remains process-memory in the observed local configuration. This does not affect corpus-backed official knowledge, but it is a persistence gap to resolve deliberately.

## Restore procedure

Before any restore:

1. Stop the local application and all corpus workers.
2. Read `.migration-backups/<snapshot>/manifest.json`.
3. Resolve the configured corpus destination explicitly; never restore to a drive root, home directory or repository root.
4. Copy the snapshot into a new sibling directory first.
5. Verify file count, bytes and aggregate SHA-256.
6. Switch `AVOID_CORPUS_LOCAL_DIR` to the verified restored directory.
7. Start in stored mode and run read-only smoke checks.
8. Do not delete the previous corpus until the migration is fully accepted.

The automated Phase 0 command only creates snapshots. It intentionally does not implement destructive restore or cleanup.

## Database discrepancy

The repository contains a future PostgreSQL adapter and SQL schema, but no active database client, connection configuration or compose file was observed. Docker integration currently manages SimulationCraft.

Before Phase 1 changes any persistence-related test or configuration, confirm whether a database exists outside these repositories. If it does, record:

- owner and startup command;
- container/volume names without credentials;
- schema and migration authority;
- backup and restore procedure;
- which API routes actually use it.

Until confirmed, the migration treats the local JSON corpus as the authoritative local persistent store.

## Non-negotiable data gates

- Raw WCL evidence is immutable.
- Knowledge revision activation only re-derives products.
- Incomplete Deep streams never become complete evidence.
- Surgical probes remain diagnostic and do not count as canonical Deep.
- HOME and GLOBAL stay physically and semantically isolated.
- Difficulty and partition stay in every applicable storage key.
- Provider cache/licensing terms continue to govern persistence.
- No schema or metric population changes silently.
