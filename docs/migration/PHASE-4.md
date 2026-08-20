# Phase 4 — incremental product migration

Status: in progress. Players, Progress, Pull Lab, Damage & Healing and
Composition are complete in Angular (5 of 11 product surfaces); production-wide
routing remains on the legacy application.

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

## Slice 4.4 — Progress (complete)

### Completed scope

- audited the Golden/React page, every Progress runtime generation, active
  presentation contract, v1/v2 metric documents, HOME persistence/read path,
  raid-night clustering, tests and desktop/mobile baselines before editing;
- migrated Progress into domain, application, infrastructure and presentation
  layers using the existing persisted HOME index and scoped reads;
- introduced a visible encounter+difficulty HOME selector and removed report/
  pull/Active Report parameters from the longitudinal request;
- retained model v2 state, CURRENT/PREVIOUS FORM, breakthroughs, measured depth,
  raw night grouping, stage matrix, retention, throughput and full audit rows;
- separated raw, metric-eligible and depth-measured populations, preserving
  exact-100 rows without graphing them as fake 100% depth;
- retained signal-first presentation for REVIEW/sparse depth and withheld every
  strategic panel when canonical invariants are BLOCKED;
- replaced 750 ms DOM polling and text-based page ownership with Angular router
  ownership, signals and pure presentation rules;
- removed Golden cohort velocity, static stats/matrix and causal composition
  recommendation while keeping the control-room hierarchy and responsive shape;
- transferred active frontend, scope, metric/null, interaction, contradiction
  and visual documentation to Angular.

### Verified gates

- active `progress-model-v2`, metrics `2.0.0` and persisted HOME evidence are
  runtime-decoded; older v1 notes remain historical only;
- response scope, zero-WCL declaration, raw/eligible/night reconciliation,
  contiguous global numbering and difficulty isolation fail closed;
- cumulative Edge/CDP verification passes 30 route/viewport checks, including
  eight Progress captures for HOME empty, ready, limited and blocked states;
- 30 deterministic local API reads are intercepted across the cumulative suite,
  with zero external/provider calls and no data mutation;
- desktop/mobile have zero page overflow, browser exception, framework overlay
  or Golden fixture finding.

### Ownership and rollback

`feature-catalog.ts` now marks exactly Progress, Pull Lab, Damage & Healing and
Composition as Angular-owned. Normal Progress load performs local reads only;
HOME refresh remains an explicit later Data & Logs capability. The production
switch remains disabled and the legacy route remains rollback-only.

Detailed behaviour and contradiction decisions are canonical in
[the Progress feature contract](../features/progress/README.md).

## Slice 4.5 — Players (complete)

### Completed scope

- audited Golden/React, both active and historical Players runtimes, telemetry,
  Intelligence, persisted HOME history, Reliability `1.1.0`, identity rules,
  tests, releases and desktop/mobile evidence before editing;
- migrated Players into domain, application, infrastructure and presentation
  layers with exact report+encounter+difficulty reads and a separate persisted
  HOME attendance read;
- retained real best-pull output, deaths, utility, classified mechanics,
  current-report participation, longitudinal presence and the four mandatory
  Reliability dimensions;
- enforced the public Reliability double gate and excluded shadow values,
  parse/output and unpublished component numbers;
- separated published, pending, data-error, no-profile and external-not-
  applicable states without inventing a fallback score;
- prohibited external identities and name-only longitudinal joins;
- retained matrix-only classified actors with explicit provenance while
  disclosing that the backend still lacks a complete encounter participant
  union;
- removed the fictional Golden roster, trend, coaching, scores and status
  labels while preserving the dense roster+dossier hierarchy and responsive
  interaction;
- made optional transport failures partial but optional contract
  contradictions fail closed;
- transferred active Players frontend behaviour, scope, metric/null,
  interaction, contradiction and visual documentation to Angular.

### Verified gates

- 71 Angular tests across 21 files pass, including contract decoders, exact
  requests, HOME/external isolation, identity joins and publication gates;
- 44 focused legacy tests preserve the active Players header, attendance,
  Intelligence and Reliability evidence/formula contracts;
- production build, bundle budgets, Clean Architecture and documentation gates
  pass;
- cumulative Edge/CDP verification passes 40 route/viewport checks, including
  ten Players captures for context, pending, published, data-integrity and
  external states at 1440x900 and 390x844;
- 54 deterministic local reads are intercepted cumulatively, 24 for Players,
  with zero provider calls, persistence mutations, overflow, browser errors,
  framework overlays or Golden fixture findings.

### Operational boundary and rollback

Angular adds no endpoint, WCL query, polling or mutation. The current backend
performs duplicated telemetry work because Intelligence internally invokes
Telemetry but does not return its roster; this is recorded debt for a later
backend composite-read slice, not hidden by a second frontend truth. Persisted
HOME history remains a zero-WCL read.

`feature-catalog.ts` now marks exactly Players, Progress, Pull Lab, Damage &
Healing and Composition as Angular-owned. The global production switch remains
disabled and the React implementation remains rollback-only.

Detailed behaviour and contradiction decisions are canonical in
[the Players feature contract](../features/players/README.md).

## Next slice inside Phase 4 — Defensive Audit

The next recommended vertical slice is **Defensive Audit**. Before changing its
UI it must freeze the exact report/encounter/difficulty population, death-chain
semantics, defensive-availability evidence, player attribution, null policy and
the boundary between observed sequence and proven causality. Golden audit
fixtures must never become readiness or blame claims.

Defensive Audit is a **high-complexity** slice because incomplete availability
and causal evidence can easily be presented as a player failure. Use a
high-reasoning model. LIVE, Loot and Iris remain deferred until their own later
slices.

## Phase exit condition

Phase 4 is not complete. It can close only after every scheduled product surface
is Angular-owned, its active frontend documentation has transferred, integrated
cross-route flows pass, and an explicitly approved production/rollback plan is
ready. Final legacy deletion remains a later cutover/cleanup concern.
