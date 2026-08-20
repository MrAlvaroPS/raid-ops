# Damage & Healing

Status: Angular frontend owner from Phase 4 slice 4.2. The legacy React route is
retained only as rollback evidence until final cutover.

## Product purpose

Damage & Healing describes observed raid throughput for the best eligible pull
inside one explicit WCL report, encounter and difficulty. It shows raid DPS,
raid HPS, absolute-stage output, overheal and the WCL Total graph series. It does
not diagnose causality, player failure or roster changes from throughput alone.

The migrated page keeps the established dark/mint control-room hierarchy:
scope form, pull banner, five summary metrics, Damage/Healing graph toggle,
stage bars and diagnostic cards. Desktop and mobile layouts are responsive and
keyboard-operable.

## Clean Architecture boundary

```text
presentation/DamageHealingPage + ThroughputChartComponent
  -> application/LoadDamageHealing + DamageHealingRepository port
     <- infrastructure/DamageHealingApiRepository
        -> existing GET /api/wcl/report
        -> existing GET /api/wcl/telemetry
  -> domain models and pure chart/stage rules
```

The shared WCL scope parser/form is used by both Composition and Damage &
Healing. It accepts only an alphanumeric report code, positive encounter ID and
one supported difficulty. This is proven reuse; product rules and visual
components remain inside their owning features.

## Scope and population contract

- Request identity: `report + encounter + difficulty`.
- Response evidence identity: `encounter+difficulty`.
- Cross-difficulty fallback/comparison: forbidden.
- Pull population: the backend's completed analytical pulls. Called-wipe/reset
  exclusions remain governed by the backend policy; the frontend displays the
  returned raw, eligible and excluded counts and does not recompute them.
- Selected pull: the backend's lowest `fightPercentage` eligible pull. The
  frontend requires `/report` and `/telemetry` to agree on its fight ID when
  both reads succeed.
- This screen does not opt into the execution-context selected pull yet.
- This migration added no WCL GraphQL query, polling loop, persisted evidence,
  database write or corpus mutation. It reuses the two reads already used by
  the legacy runtime.

## Metric contract: `damage-healing-view-v1`

| Visible field | Source | Formula/meaning | Null policy |
|---|---|---|---|
| Raid DPS | telemetry `throughput.best.dps`, with report fallback | sum of friendly damage in the best-pull table divided by exact pull duration | em dash and partial state when unavailable |
| Raid HPS | telemetry `throughput.best.hps`, with report fallback | sum of friendly effective healing in the best-pull table divided by exact pull duration | em dash; remains observational |
| Stage 3 DPS | telemetry `throughput.phases.p3.dps`, with report `overview.executeDps` fallback | friendly damage divided by the third absolute-stage duration | em dash when Stage 3 was not reached |
| Overheal | report `overview.overhealPct` | `overheal / (effective healing + overheal) * 100` for friendly actors in the best pull | em dash and explicit unavailable reason |
| Healing death gap | no current contract | not calculated | always `pending contract`; no Golden `1.4s` fallback |
| Stage bars | telemetry `p1..p3` | current DPS or HPS, normalized only against the same selected metric | unavailable stage is labelled, never copied |
| Graph | telemetry `graphs.damage/healing` | ordered numeric buckets from the WCL series whose name/id is `Total` | invalid/missing series produces a partial graph state |

The graph API does not expose a frontend-stable per-point timestamp contract.
The chart therefore preserves bucket order, spreads the points evenly across
the known best-pull duration and labels that limitation. It never fabricates
mechanic markers, event timestamps or peer overlays.

`overview.executeDps` is a legacy backend field name. Its implementation starts
at the third absolute-stage boundary, which is not universally a unique boss
execute. Angular deliberately labels it **Stage 3 DPS**. This is a semantic
correction, not a formula change.

DPS permits directional comparison only within the same absolute stage and
scope. HPS is observational because healing demand depends on incoming damage,
deaths and encounter execution. No cross-stage or peer verdict is inferred.

## Stage and graph semantics

The required phase model is `absolute-stage`. Each stage retains both its
ordered `absoluteStageIndex` and WCL `semanticPhaseId`; semantic IDs may repeat,
for example `P1 -> P2 -> P1`. The UI therefore renders `Stage 1`, `Stage 2`,
`Stage 3` and optionally the semantic phase alongside it. It never presents
the sequence as three necessarily unique semantic phases.

Only measured stage windows receive timeline bands. Inferred stages without a
start time remain visible in evidence but are not assigned a fabricated width.
The backend currently summarizes output for the first three absolute stages;
later graph bands can remain visible without invented stage metrics.

## State matrix

| State | Behaviour |
|---|---|
| Context required | No request; asks for all three mandatory scope fields |
| Loading | Identifies the existing report/telemetry reads and no peer acquisition |
| Empty | Preserves backend no-fight/no-completed-pull reason; shows no metrics |
| Ready | Shows observed best-pull metrics, graph, stages and population |
| Partial endpoint | One transport read may fail while the other still provides a safe subset |
| Partial graph | Keeps valid metrics but labels the selected graph unavailable |
| Missing stage | Labels the row unavailable and keeps Stage 3 DPS null |
| Contract error | Rejects response scope, evidence, phase, best-pull or metric contradictions |
| Transport error | Shows a retry only when the normalized failure is retryable |

Contract-invalid responses never degrade silently. Transport failure of one
source may degrade because the other endpoint is an independent existing read.
When both endpoints fail the page fails safely.

## Golden and runtime contradictions resolved

| Legacy observation | Problem | Angular decision |
|---|---|---|
| Golden raid DPS/HPS, execute, overheal and death-gap values survive without data | fixture leakage | removed; real decoded values or explicit null only |
| “Execute DPS” names the third stage | not every encounter's third stage is an execute | renamed `Stage 3 DPS`; formula unchanged |
| Static BL/ERUPTION/SHARDS overlays | no event/time provenance in graph contract | removed and explicitly disclosed |
| Static peer lines and `184 GUILDS` copy | no matched cohort contract | peer benchmark remains pending |
| Healing sufficiency, preventable deaths and cooldown stacking verdicts | unsupported by throughput reads | pending cards explain the missing evidence |
| Legacy runtime could omit difficulty from HTTP requests | risk of implicit scope selection | all Angular reads require difficulty |
| Legacy graph accepts only a loosely inspected series | malformed data could look valid | Angular requires the exact `Total` numeric series with at least two non-negative buckets |

## Visual and UX decisions

- The Golden composition and page density are a living baseline, not a pixel
  lock. Typography, panel hierarchy, accent colors and toggle placement remain.
- Damage and Healing use one accessible `aria-pressed` toggle and the same real
  graph component.
- DPS and HPS stage bars normalize separately, avoiding an unreadable mixed-unit
  scale.
- The fifth metric remains in place but clearly says `pending contract`, which
  preserves information architecture without fake data.
- Mobile converts metric and diagnostic grids to readable stacks; verified
  captures have zero horizontal overflow.
- The shell header now shows the global migrated-route count instead of the
  stale hard-coded `COMPOSITION` label.

## Verification and rollback

Unit/contract tests cover chart order, invalid series, repeated semantic phases,
stage nulls, exact request URLs, partial endpoint behaviour and cross-endpoint
contradictions. The cumulative Phase 4 browser verifier covers context, Damage,
Healing and partial-Healing states at 1440x900 and 390x844 with external traffic
blocked before dispatch.

The legacy implementation remains executable only for rollback. New frontend
behaviour and documentation belong here. Deleting the React route is gated by
the later production cutover, rollback window and whole-application cleanup.
