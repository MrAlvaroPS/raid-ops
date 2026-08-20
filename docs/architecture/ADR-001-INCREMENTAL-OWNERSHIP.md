# ADR-001: incremental route ownership

Status: accepted in Phase 2.

## Decision

Angular and the legacy frontend coexist through explicit per-surface ownership. During Phase 2 all product routes are registered in Angular for discoverability, but their owner is `legacy`; Angular renders an ownership boundary, not a substitute feature.

The production switch is a literal `false` in the runtime contract. A later phase may move one route to Angular only after its contract, state matrix, visual comparison and rollback gate pass. LIVE, Iris learning and Loot cannot be selected as the first vertical slice.

## Consequences

- The legacy application remains the production rollback.
- No big-bang migration or hidden mock is possible.
- Routing decisions are testable before a reverse proxy or deployment switch exists.
- Temporary duplication is allowed only at the boundary, never for persisted evidence or business formulas.
