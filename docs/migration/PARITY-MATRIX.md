# Functional parity matrix

Status values:

- **real**: current runtime has an identified real-data implementation.
- **partial**: real implementation exists but Golden or another runtime still leaks through.
- **fixture leak**: fictional Golden content is visible without qualifying data.
- **degraded**: safe empty/error behaviour is visible.
- **unverified**: behaviour requires a sanitised stored fixture or controlled live rehearsal.

No Angular slice may be marked complete until all required states in its row are covered by contract tests and visual baselines.

| Surface | Current owner(s) | Data/API boundary | Offline observation | Required parity states | Angular completion gate | Complexity |
|---|---|---|---|---|---|---|
| Shell/navigation | Golden bundle, execution-context runtime, Loot loader | HOME history summary, active report manifest | Partial: navigation works; Loot leaves Composition breadcrumb/active state; mobile header overflows | desktop, mobile, long labels, no history, partial history, active report | One router-owned active route, one responsive header, no DOM/text page inference | High |
| Command Center | Golden bundle | Intended aggregation of history, progress, telemetry and intelligence | **Fixture leak**: Golden readiness, blocker and pull values survive with APIs offline | empty, stored, connected, partial, error, active pull, completed pull | Every metric has source/provenance; no metric renders from Golden fixture | High |
| LIVE | Golden plus operational/fallback/RL runtimes | active-report-manifest, operational-execution, live diagnostic | Degraded empty/error surface is reachable | no URL, invalid URL, waiting for combat, in-progress, closed pull changed/unchanged, partial hydration, stopped | Change-driven polling, one owner, bounded calls, cancellation and safe degraded UI | Very high |
| Progress | Golden plus progress runtime | home-history and derived progress contracts | Partial; must distinguish runtime empty state from underlying Golden series | no history, one night, multiple nights, partial sync, excluded pulls, report filter | Canonical eligible population and metric version remain identical | High |
| Pull Lab | Golden plus operational UI | active report analytical pulls | Degraded when no Active Report | no report, one pull, two pulls, selected fight, excluded reset, partial mechanics | Exact same-report/scope comparison; no mock substitution | High |
| Damage & Healing | **Angular frontend**; legacy route retained for rollback | exact-scope report + telemetry throughput/graphs | **Angular complete:** explicit no-context/empty/partial/error states; Golden metrics/events/peers removed | context required, loading, empty, Damage/Healing ready, partial graph/endpoint, missing stage, contract/transport error | **Passed in Phase 4:** versioned metric/null contract, absolute stages, Total series, responsive interaction, zero provider calls | Medium |
| Mechanics: Raid Execution | Golden, Mechanics state/header and operational UI | raid-execution, operational-execution | Degraded HOME execution empty state is present | boss knowledge/no HOME, HOME ready, partial HOME, contradiction, error | Explicit raid/boss/difficulty and HOME isolation preserved | Very high |
| Mechanics: Iris Boss Knowledge | multiple Iris Mechanics runtimes | raid catalog, official/structural knowledge, global reference, learning APIs | Degraded catalog unavailable; Data & Logs controls not reachable | official-only, unresolved applicability, GLOBAL absent/available, learning/publication next, provider error | Evidence classes visible; no difficulty fallback or empirical gate bypass | Very high |
| Defensive Audit | Golden bundle, intended operational data | telemetry, operational death chains and defensives | **Fixture leak**: Golden audit remains without qualifying active data | empty, deaths without classification, classified chain, defensives pending, partial/error | No invented defensives or causal classification; exact evidence labels | High |
| Players | Golden plus player-intelligence runtime | telemetry players, HOME history, Reliability contracts | **Fixture leak**: zero profiles is shown beside fictional roster and scores | empty roster, WCL roster, partial profiles, Reliability pending/available/contradicted | Real roster owns entire surface; pending is not coerced to a score | High |
| Composition | **Angular frontend**; legacy route retained for rollback | exact-scope WCL telemetry roster/CombatantInfo | **Angular complete:** explicit no-context/empty/partial/error states; Golden peers removed | context required, loading, empty, partial roster, role groups, missing gear/talents, Wowhead unavailable, contract/transport error | **Passed in Phase 4:** real actors, safe unknowns, 13 classes, pending Reliability, desktop/mobile, zero provider calls | Medium |
| Loot | dynamic Loot runtimes and profile bridge | loot API, raid catalog, HOME roster, ledger, SimC worker | Real degraded surface; stale Composition breadcrumb and dual active navigation | no roster, no catalog, item selected, unsupported spec/slot, worker offline, ST/MT5 result, ledger update/error | No auto-award; independent signals; SimC remains backend job | Very high |
| Data & Logs | data-hub runtime plus execution-context runtime | reports, history, knowledge, capabilities, live controls | **Unreachable** in fresh offline profile: button not mounted | stored, connected, cache miss, sync, WCL error, live lifecycle, knowledge candidate/activation | One shell-owned operations surface; destructive/paid actions retain approvals | Very high |

## Cross-cutting parity gates

Every vertical slice must demonstrate:

1. Explicit `report`, `encounter`, `difficulty` and `partition` where applicable.
2. No cross-difficulty fallback.
3. No HOME contribution to GLOBAL training, validation, holdout or promotion.
4. No mock substitution in connected or empty states.
5. Loading, empty, partial and error behaviour.
6. Desktop and mobile visual comparison.
7. Stable API contract with runtime validation.
8. No additional WCL evidence purchase for already persisted questions.
9. Polling cancellation and rate-budget accounting where applicable.
10. Rollback to the legacy surface while the feature flag remains active.

## Fixture policy

The current Golden fixtures are evidence of old visual intent, not valid migration fixtures. Connected/live Angular fixtures must be produced from sanitised persisted payloads and retain their evidence/provenance fields. They must never be synthesized by copying displayed Golden numbers.
