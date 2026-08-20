# Phase 4 — incremental product migration

Status: in progress. Composition and Damage & Healing are complete in Angular
(2 of 11 product surfaces); production-wide routing remains on the legacy
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

`feature-catalog.ts` now marks exactly Composition and Damage & Healing as
`angular`. The architecture gate rejects accidental ownership drift. The global
production switch remains statically disabled, and both legacy routes remain as
rollback implementations until the later cutover gate.

Detailed truth and contradiction decisions are canonical in
[the Damage & Healing feature contract](../features/damage-healing/README.md).

## Next slice inside Phase 4 — Pull Lab

The next recommended vertical slice is **Pull Lab**. It should reuse the exact
scope and analytical-population decisions already proven here, then freeze pull
selection, same-report comparison, excluded-reset visibility and partial
mechanics semantics before implementation. It must not absorb LIVE polling or
invent comparison data.

This next slice is **high complexity**: it combines selection state, two-pull
comparisons, absolute-stage alignment and operational/mechanics evidence whose
absence must remain explicit. Use a high-reasoning model. LIVE, Loot and Iris
remain deferred until their own slices.

## Phase exit condition

Phase 4 is not complete. It can close only after every scheduled product surface
is Angular-owned, its active frontend documentation has transferred, integrated
cross-route flows pass, and an explicitly approved production/rollback plan is
ready. Final legacy deletion remains a later cutover/cleanup concern.
