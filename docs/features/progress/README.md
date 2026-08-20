# Progress

Status: Angular frontend owner from Phase 4 slice 4.4. The legacy route remains
rollback evidence until the final production cutover.

## Product purpose

Progress answers whether the raid is moving forward across reports and raid
nights for one boss and one difficulty. It is strategic and longitudinal; LIVE
owns the current night and Pull Lab owns exact-pull comparison. Progress must
not turn correlation into blame, prescribe composition changes, or treat an
Active Report selector as persisted HOME history.

The page shows progression state, raw/eligible/measured population, personal
best depth, CURRENT FORM repeatability, breakthroughs, a measured-depth trend,
night-over-night movement, absolute-stage consistency, retention, throughput
and auditable data-quality exceptions.

## Clean Architecture and data flow

```text
presentation/ProgressPage + ProgressChart
  -> application/LoadProgress + ProgressRepository port
     <- infrastructure/ProgressApiRepository + strict decoder
        -> GET /api/wcl/home-history                         (local index)
        -> GET /api/wcl/home-history?encounter=&difficulty= (local scope)
  -> domain scope, measured-depth and chart rules
```

The first read discovers persisted HOME scopes. The selected scope is explicit
in the URL as `encounter+difficulty`; a missing/invalid selection resolves to
the most recently active stored scope and remains visible in the selector. The
second read obtains its canonical model. Neither read may declare WCL network
execution. `report`, pull selectors and Active Report state are removed from
Progress navigation and never enter its repository request.

Refreshing HOME history remains an explicit Data & Logs operation. Progress is
read-only and reports stale/empty history without hiding it behind an automatic
provider request.

## Scope, population and ownership contract

- Empirical scope is exactly one HOME guild raid, encounter and difficulty.
- Cross-difficulty aggregation or fallback is forbidden.
- The raw population is every deduplicated analytical pull in canonical order.
- The strategic population is `progressMetricEligible === true`.
- CURRENT FORM is the latest 20 eligible pulls; PREVIOUS FORM is the preceding
  20. Angular consumes these server metrics and does not recalculate them.
- Raid-night totals must reconcile to raw and eligible model totals; global pull
  numbers must be contiguous.
- Excluded and flagged pulls remain visible in the quality disclosure with
  report/fight source identity.
- Failed canonical invariants withhold strategic KPIs and graphs while retaining
  the audit surface.

The only strategic writer is backend `progress-model-v2`, metric version
`2.0.0`. Angular derives presentation-only coverage, measured chart points,
best-so-far, five-measured-pull form and per-night stage reach from the same
canonical rows. These do not change metric denominators or state formulas.

## Depth and null policy

A pull has measured depth only when it is metric-eligible and is a kill or has a
finite WCL `fightPercentage < 99.999`. Exact 100% rows remain raw and, when
eligible, remain in the strategic population, but they are displayed as WCL
depth unavailable rather than as a real 100% observation. Missing/invalid
values and hard contradictions never acquire a synthetic depth.

Depth presentation is limited when quality is `REVIEW`/`BLOCKED` or measured
coverage is below 65%. For `REVIEW` or sparse coverage, the page leads with
stage conversion and depth coverage while preserving the candidate strategic
signal with an explicit warning. `BLOCKED` withholds the signal and all derived
strategic panels. Null retention and throughput show their evidence reason,
never zero.

## Interaction and visual contract

- The persisted HOME scope selector changes the URL and performs one scoped
  local read.
- `ALL`, `LAST 100`, `LAST 50` and `LAST 25` filter raw chronological rows for
  the chart only; they do not recompute KPIs, nights, matrix or health.
- The chart retains raw x positions, best-so-far measured depth, five-measured-
  pull form, new PBs, night boundaries and separate unavailable-depth ticks.
- KPI cards, night rows, matrix cells and health cards are indicators, not fake
  buttons. Data quality is the only disclosure control.
- Desktop preserves the Golden control-room hierarchy; mobile stacks the
  header, population, chart, nights and health without page overflow. The stage
  matrix may scroll inside its own bounded panel.
- Empty, loading, local-history-empty, scoped-empty, limited, blocked,
  transport-error and contract-error states never expose Golden fixtures.

## Legacy contradictions resolved

| Legacy source | Contradiction/risk | Angular decision |
|---|---|---|
| Reconstructed Golden React page | static metrics, cohort velocity, recommendation and matrix looked real | visual hierarchy retained; every fictional value and causal recommendation removed |
| Runtime 3.7.13 | 750 ms DOM polling and page detection by banner text | router-owned component and signal state; no DOM ownership wrappers or timer |
| Global execution-context header | silently selected latest scope and mixed Progress discovery with Active Report controls | explicit HOME boss+difficulty selector; Active Report ignored |
| `PROGRESS-METRICS-CONTRACT-V2` section 10 | calls chart range eligible-only | newer presentation contract/runtime 3.7.13 govern: raw range, measured/unmeasured rows preserved |
| `server/analysis/progression/PROGRESS-METRICS.md` | still describes model v1 as implementation | retained only as historical backend note; active frontend contract is v2/2.0.0 |
| Scoped HOME read status | can say ready with zero pulls | Angular derives an explicit scoped-empty state from canonical rows |

## Verification and rollback

Pure rules cover scope parsing, measured-depth/null semantics, quality gating and
raw-range chart behaviour. The decoder covers HOME provenance, zero-WCL reads,
exact scope, v2/version acceptance, population reconciliation and invariant
blocking. The cumulative browser gate records HOME-empty, ready, limited and
blocked states at 1440×900 and 390×844, with external traffic blocked.

The Angular slice adds no endpoint, WCL query, database/corpus mutation or
backend formula. The legacy implementation remains untouched as rollback and
the global production switch remains disabled.
