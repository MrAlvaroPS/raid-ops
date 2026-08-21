# Command Center frontend contract

Status: active Angular owner from Phase 4 slice 4.7. The legacy implementation
is retained only as rollback until production cutover.

## Product purpose

Command Center answers one question for a raid lead: what does the latest
completed analytical evidence say about this exact report, encounter and
difficulty, and where should the detailed review continue?

It is an operational overview, not a new source of truth. It projects:

- best completed pull and chronological report progression;
- deepest absolute stage and stage-reach coverage;
- raw, meaningful and first-death populations;
- best-pull raid DPS;
- latest eligible pull versus its previous eligible pull;
- an evidence-ranked classified blocker when the operational reference is
  ready;
- exact-scope navigation to Pull Lab, Defensive Audit and Mechanics, plus a
  HOME-only longitudinal link to Progress.

It does not calculate kill readiness, infer roster effect, compare raid nights,
poll LIVE state or turn an observed mechanic occurrence into a failure.

## Audited sources and active data flow

The migration audited the Golden/React component and fixtures, the active DOM
runtime, report/telemetry/intelligence/history/status reads, the consolidated
operational execution engine and service, pull intelligence, blocker and death-
chain analysers, kill-readiness placeholder, dashboard contract, data-truth
matrix, execution/evidence documentation, tests and desktop/mobile baselines.

The active legacy renderer issued report, telemetry, history and intelligence
reads plus global status polling, then filled only some Golden regions. This
created mixed freshness and left fictional readiness, wipe-signature and peer
benchmark values visible. Angular replaces those reads with one existing exact-
scope boundary:

`GET /api/wcl/operational-execution?report=<code>&encounter=<id>&difficulty=<id>`

This endpoint consolidates the completed analytical pulls, telemetry and
operational classification required by the overview. Angular adds no endpoint,
GraphQL query, polling loop, persistence or corpus operation.

The endpoint is not intrinsically read-only. For an eligible HOME report the
legacy backend may acquire WCL evidence and persist operational HOME products;
an external report remains evaluation-only and must never become HOME evidence.
Deterministic visual verification intercepts the request before dispatch.

## Scope, freshness and population contract

- Request and response identity is `report + encounter + difficulty`.
- Evidence identity is `encounter + difficulty`; cross-difficulty reuse is
  rejected.
- The view is one manually loaded snapshot. Its `generatedAt` timestamp and
  no-polling posture are visible.
- Eligible and excluded pulls are disjoint and reconcile to raw completed
  pulls. Eligible fight IDs and chronological pull identities are unique.
- Best, latest and previous pulls must belong to the eligible population.
- Raw, meaningful and first deaths reconcile before display.
- A blocker may reference eligible pulls only; recurrence, failure,
  opportunity, recent-failure and linked-death populations are checked.
- Called-wipe/reset pulls remain excluded from analytical metrics and visible in
  the population count.

If an active pull exists, the page labels it but continues to show only the last
completed analytical snapshot. An open pull is never promoted to a completed
pull, failure, readiness change or progress point. LIVE owns change-driven
polling in its later migration slice. The rehearsal-gated service response does
not expose open-pull status; Angular labels that fact as unavailable and does
not infer `false` from the missing field.

## Metric and evidence policy

The frontend metric contract is `command-center-operational-overview-v1`.

| Surface value               | Source / policy                                                     |
| --------------------------- | ------------------------------------------------------------------- |
| Best pull                   | eligible WCL `fightPercentage`; kill is a distinct observed fact    |
| Progress curve              | raw chronological eligible pulls in this report only                |
| Deepest stage / stage reach | ordered absolute-stage model                                        |
| Deaths                      | WCL raw, wipe-cutoff meaningful and first-death populations         |
| Raid DPS                    | best-pull WCL Summary                                               |
| Latest changes              | latest eligible pull versus immediately previous eligible pull      |
| Roster change               | roster fingerprint changed/unchanged; no performance effect claimed |
| Current blocker             | active rule-pack classification and evidence-ranked blocker model   |
| Blocker linked deaths       | temporal association only, never causal proof                       |
| Kill readiness              | `NOT ASSESSED`                                                      |
| Wipe signatures             | not displayed; no implemented versioned product contract            |
| Peer benchmark              | not displayed; no connected cohort/provider contract                |

Raid DPS receives no directional latest-pull label when the compared pulls
reached different absolute stages. A ready rule pack with no derived blocker is
`insufficient-data`, not zero failures or perfect execution. Gated or truncated
classification remains visibly partial.

## UX and interaction contract

- A shared exact-scope form is required before loading.
- Context, loading, waiting/empty, active-first-pull, ready, gated, insufficient,
  partial/truncated, external, transport-error and contract-error states are
  explicit.
- Scope changes are URL-owned and trigger one new snapshot request.
- Review links do not mutate data. Pull Lab, Defensive Audit and Mechanics keep
  report scope; Progress receives encounter+difficulty only because it reads
  persisted HOME history and must not be contaminated by Active Report.
- The dense Golden control-room hierarchy is retained: hero assessment, metric
  strip, progression/blocker split, change summary and compact lower panels.
- Mobile stacks those regions without horizontal page overflow; no table or
  chart requires desktop width.
- Partial reasons, source posture, evidence contract and snapshot freshness are
  visible instead of hidden behind a nominal ready state.

## Resolved legacy contradictions

| Legacy/Golden behaviour                                   | Angular decision                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Static `68 Kill Readiness / KILLABLE`                     | `NOT ASSESSED`; no readiness engine exists                              |
| Golden values survive offline/API failure                 | explicit context, empty, gated or error state; no fallback value        |
| Four reads with different freshness                       | one consolidated operational snapshot                                   |
| Global 15-second status polling                           | removed from this route; LIVE will own polling                          |
| “What changed” presented as Thursday versus Tuesday       | latest eligible pull versus previous eligible pull                      |
| Roster association phrased as an effect                   | fingerprint change only; causality explicitly withheld                  |
| Active pull can coexist ambiguously with closed telemetry | active label plus last-completed-snapshot boundary                      |
| Current blocker shown while reference is unavailable      | gated; safe telemetry remains, no fabricated mechanic claim             |
| Linked death described as mechanic causation              | bounded temporal association only                                       |
| Static wipe signatures and peer benchmark                 | replaced by evidence coverage and real review destinations              |
| Generic `dashboard.ts` accepts `unknown` metrics          | not copied; route decoder validates the concrete operational projection |

The Golden mock remains visual-composition evidence, never a data, formula or
product-truth authority.

## Ownership, rollback and later work

Angular owns the Command Center route, projection contract, presentation and
frontend documentation. The legacy backend owns WCL acquisition, operational
classification and HOME persistence. Production switching remains disabled and
the verified legacy route remains the immediate rollback.

A future versioned kill-readiness engine, peer cohort or wipe-signature model
must define scope, formula, evidence, null, freshness and publication contracts
before adding a value. LIVE must migrate its own change-driven polling,
cancellation and budget behaviour rather than reusing this manual snapshot.
