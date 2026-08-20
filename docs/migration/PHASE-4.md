# Phase 4 — incremental product migration

Status: in progress. Composition, Damage & Healing and Pull Lab are complete in
Angular (3 of 11 product surfaces); production-wide routing remains on the legacy
application.

This is the next original roadmap phase after the Phase 3 Clean Architecture
foundation. It migrates one complete vertical capability at a time and remains
open until all scheduled product surfaces meet the same functional, data,
visual, documentation and rollback gates. Completing one slice never completes
the phase by implication.

## Slice 4.1 — Composition (complete)

### Completed scope

- audited the Golden component, reconstructed React source, active DOM runtime,
  telemetry engine, normalisers, tests, data-truth documentation and desktop/
  mobile baselines;
- migrated Composition into domain, application, infrastructure and
  presentation layers;
- retained real roster, role, class, item level, gear, talent, output,
  Reliability, Wowhead and responsive interaction behaviour;
- removed only fictional peer/fit/recommendation values and recorded each
  decision;
- made report, encounter and difficulty mandatory in request and response;
- added context-required, loading, empty, partial, ready, transport-error and
  contract-error behaviour;
- transferred active frontend behaviour documentation and route ownership to
  Angular;
- retained the React route as a rollback implementation, not a parallel owner.

### Non-goals

- no backend, database, WCL query, Iris, corpus or evidence-formula change;
- no new peer-composition provider or invented comparison cohort;
- no LIVE polling, Loot/SimC, Players reliability calculation or production
  cutover;
- no deletion of rollback code before the global cutover gate.

### Verified gates

- pure domain/application dependency direction;
- runtime-decoded telemetry contract and explicit difficulty isolation;
- 19 Angular tests covering shell/route ownership, rules, safe unknowns, talent
  sanitisation, response scope, exact request URL, safe links, empty data and API
  failures;
- production build and bundle budgets;
- deterministic Edge/CDP browser verification of context and ready/partial/
  expanded-profile states at 1440x900 and 390x844;
- no horizontal overflow, framework overlay or browser exception;
- two intercepted exact-scope API requests and zero dispatched provider calls;
- no `92%`, `184 GUILDS` or other Golden fixture value in the Angular route.

The optional `agent-browser` CLI was not present in the environment. Its `npx`
resolution did not complete and was stopped without changing dependencies. The
repository's Edge/CDP verifier performed the equivalent recorded checks; this
tooling substitution is explicit rather than being reported as an unperformed
CLI pass.

### Ownership and rollback

At the close of slice 4.1, `feature-catalog.ts` marked only Composition as
`angular`. The global production switch remained statically disabled. Rollback
is the still-verified legacy route; no stored data was copied, deleted or
rewritten.

Detailed product truth and contradictions are canonical in
[the Composition feature contract](../features/composition/README.md).

## Slice 4.2 — Damage & Healing (complete)

### Completed scope

- audited Golden, reconstructed React, active runtime, report/telemetry engines,
  graph shapes, throughput formulas, stage normalisation, v3.3 interpretation
  rules, tests and desktop/mobile baselines;
- migrated the route into domain, application, infrastructure and presentation
  layers while extracting only the now-proven shared WCL scope form/parser;
- reused the existing exact-scope `/api/wcl/report` and `/api/wcl/telemetry`
  reads; added no GraphQL query, polling, persistence or corpus operation;
- retained raid DPS/HPS, Stage 3 DPS, overheal, Damage/Healing toggle, WCL Total
  graph, absolute-stage bands, stage output and responsive diagnostic layout;
- removed Golden values, fabricated event markers, peer overlays and unsupported
  sufficiency/failure/cooldown verdicts;
- renamed the misleading visible `Execute DPS` label to `Stage 3 DPS` without
  altering the backend formula;
- preserved repeated semantic phase IDs under the canonical absolute-stage model;
- added context-required, loading, empty, ready, missing-stage, partial graph,
  partial endpoint, transport-error and contract-error behaviour;
- rejected mismatched scopes, best pulls and cross-endpoint metric contradictions;
- transferred active frontend behaviour, metric/null policy and visual decisions
  to the Angular documentation owner.

### Verified gates

- 37 Angular tests across 11 files pass;
- production build and bundle budgets pass;
- Clean Architecture and exact-scope route ownership gates pass;
- the cumulative Phase 4 Edge/CDP verifier passes 12 route/viewport checks,
  including Damage, Healing and partial-Healing interaction at 1440x900 and
  390x844;
- zero horizontal overflow, browser exception, framework overlay or Golden
  fixture finding;
- ten intercepted exact-scope HTTP reads across all visual scenarios and zero
  provider calls or data mutations;
- eight Damage & Healing captures and the refreshed four Composition captures
  are hashed in migration evidence.

The optional `agent-browser` CLI remains unavailable in this environment. The
repository Edge/CDP verifier is the recorded substitute, with external traffic
blocked before dispatch.

### Ownership and rollback

`feature-catalog.ts` now marks Composition and Damage & Healing as
`angular`. The architecture gate rejects accidental ownership drift. The global
production switch remains statically disabled, and both legacy routes remain as
rollback implementations until the later cutover gate.

Detailed truth and contradiction decisions are canonical in
[the Damage & Healing feature contract](../features/damage-healing/README.md).

## Slice 4.3 — Pull Lab (complete)

### Completed scope

- audited Golden, reconstructed React, both legacy runtime generations,
  analytical pull construction/exclusion, operational execution, execution
  context, tests, evidence doctrine and desktop/mobile baselines;
- migrated Pull Lab into domain, application, infrastructure and presentation
  layers using one existing exact-scope `/api/wcl/operational-execution` read;
- made A/B fight selection distinct, URL-owned and deterministic; a lone pull is
  visible but is never compared with itself;
- retained boss progress, duration, absolute stage, first death, meaningful
  deaths, raid DPS/HPS, roster-change context, excluded resets and mechanic
  evidence;
- restored a useful real-data version of the Golden timeline with measured
  absolute stages plus raw/meaningful death markers, without fictional
  Bloodlust/cooldown events;
- corrected DPS direction to same absolute stage only, kept HPS and duration
  observational, and made no-death semantics explicit;
- separated observed mechanic occurrence from classified failure, including
  gated and truncated evidence states;
- rejected scope, population and eligible/excluded-mechanic contradictions;
- extracted the absolute-stage model into `shared` only after this second real
  feature consumer proved the reuse.

### Verified gates

- 49 Angular tests across 15 files pass;
- 20 focused legacy pull-population, execution-context and operational evidence
  tests pass without modifying the backend;
- production build, Clean Architecture and documentation gates pass;
- the cumulative Edge/CDP verifier passes 22 route/viewport checks: ten Pull
  Lab captures plus the refreshed Composition and Damage & Healing baselines;
- desktop and mobile context, ready, changed-selection, mechanics-gated and
  insufficient-data states have zero overflow, browser exception, framework
  overlay or Golden fixture finding;
- sixteen exact-scope stubbed API reads across the cumulative matrix and zero
  provider dispatch or visual-fixture data mutation;
- the first visual run exposed and the implementation corrected a native-select
  display mismatch before evidence was accepted.

### Operational boundary and rollback

The Angular route introduces no endpoint, WCL query, polling loop or new
backend mutation. It reuses the active legacy operational endpoint. That
existing endpoint can, for an eligible HOME report, persist operational roster,
diagnostic/comparison and execution snapshots; this pre-existing server
behaviour is documented rather than incorrectly describing the production call
as read-only. The deterministic visual verifier intercepts it before dispatch
and performs zero provider or persistence operation.

`feature-catalog.ts` now marks exactly Pull Lab, Damage & Healing and
Composition as `angular`. The production switch remains disabled and the legacy
route remains rollback-only until cutover.

Detailed behaviour and contradiction decisions are canonical in
[the Pull Lab feature contract](../features/pull-lab/README.md).

## Next slice inside Phase 4 — Progress

The next recommended vertical slice is **Progress**. It should freeze the
persisted HOME history source, longitudinal eligible population, report/night
grouping, metric version/null policy and excluded-pull visibility before UI
migration. It must ignore an active single-pull selector unless an explicit
detail view opts in, and normal page load must remain zero WCL.

Progress is a **high-complexity** slice because historical aggregation can
silently change denominators, merge difficulties or confuse persisted HOME
history with an Active Report. Use a high-reasoning model. LIVE, Loot and Iris
remain deferred until their own later slices.

## Phase exit condition

Phase 4 is not complete. It can close only after every scheduled product surface
is Angular-owned, its active frontend documentation has transferred, integrated
cross-route flows pass, and an explicitly approved production/rollback plan is
ready. Final legacy deletion remains a later cutover/cleanup concern.
