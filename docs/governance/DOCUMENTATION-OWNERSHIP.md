# Documentation ownership

Status: active from the Phase 2–3 documentary hand-off.

The migration uses transfer of ownership, not permanent mirroring. Each active
contract has one canonical repository. A historical copy may remain frozen for
audit and rollback, but it must identify its successor and must not receive new
changes.

| Documentation set | Active owner now | Status in Angular | Transfer trigger |
|---|---|---|---|
| Migration phases, parity and guardrails | `raid-ops/docs/migration` | Transferred | Already satisfied |
| Product changelog and release provenance | `raid-ops/docs/releases` | Transferred | Already satisfied |
| Living visual policy and Phase 0 captures | `raid-ops/docs/visual` and `docs/migration/evidence/visual` | Transferred | New accepted captures replace route baselines individually |
| Angular architecture and ADRs | `raid-ops/docs/architecture` | Native | Always owned by Angular |
| Per-route frontend behaviour | `raid-ops`, as each route passes its slice gate | Progress, Pull Lab, Damage & Healing and Composition transferred; seven routes pending | Functional, data, visual, documentation and rollback gates pass |
| Backend API implementation | `avoid-raid-ops/server` | Referenced, not copied | Backend moves or a stable published API contract is extracted |
| Iris/WCL/provider/evidence doctrine | `avoid-raid-ops` root and `docs` | Referenced, not copied | The owning backend capability moves |
| Persistence and corpus operations | `avoid-raid-ops` | Baseline copied; operating contract remains at source | Storage implementation changes owner |
| Vercel production deployment | `avoid-raid-ops/docs/current/deployment` | Pending | Angular becomes a production route owner |
| Historical release/checkpoint files | `avoid-raid-ops/docs/archive/releases/legacy` | Indexed through provenance only | Never; immutable evidence remains archived |

## Rules

1. New migration decisions, visual decisions and product release notes are
   written only in `raid-ops`.
2. A migrated route brings its active user behaviour, state matrix, API contract
   and visual decision record with it.
3. Backend documentation stays beside executable backend code. Angular may link
   to it but cannot silently redefine evidence, formula, difficulty or approval
   semantics.
4. A source document becomes historical at hand-off; it is not maintained in
   parallel.
5. Final cutover cannot close while this table contains a frontend-owned active
   document in the legacy repository without a target owner.
