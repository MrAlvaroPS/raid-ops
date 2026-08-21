# Defensive Audit frontend contract

Status: active Angular owner from Phase 4 slice 4.6. The legacy implementation
is retained only as rollback until production cutover.

## Product purpose

Defensive Audit answers a deliberately narrow operational question: what
meaningful deaths occurred in the selected encounter and what classified event,
if any, immediately preceded each death? It lets a raid lead inspect the
evidence player by player without turning an observed sequence into an
unsupported blame or preventability verdict.

The page shows:

- exact report, encounter and difficulty identity;
- raw deaths, meaningful deaths and first deaths from the best-pull telemetry
  population;
- observed Healthstone and potion casts as counts only;
- probable temporal links produced by the existing death-chain analyser;
- the highest-ranked preceding classified event and its bounded replay window;
- explicit gaps in cooldown catalogues, personal availability, inventory and
  raid-cooldown assignment evidence.

It does not assess whether a death was preventable, whether a defensive was
ready, whether a consumable was available, or whether the preceding event
caused the death.

## Audited sources and active data flow

The migration audited the Golden/React component and fixtures, both active
legacy defensive renderers, WCL telemetry, the operational execution service,
death-event extraction, root-cause death chains, the defensive-analysis and
rule-pack placeholders, Reliability/evidence contracts, tests, releases and the
desktop/mobile legacy captures.

Angular makes one existing exact-scope request:

`GET /api/wcl/operational-execution?report=<code>&encounter=<id>&difficulty=<id>`

The infrastructure decoder validates the response before domain rules or UI
consume it. No second frontend request is used to fill gaps and no Golden value
is a fallback.

This endpoint is not intrinsically read-only. For an eligible HOME report the
legacy server may acquire WCL evidence and persist operational roster,
diagnostic/comparison and execution snapshots. External reports are evaluation
only and must never become HOME evidence. The Angular slice adds no endpoint,
query, polling loop, mutation or corpus operation; deterministic browser
verification intercepts the call before dispatch.

## Scope, populations and identity

- Request and response identity is `report + encounter + difficulty`.
- Evidence scope is `encounter + difficulty`; cross-difficulty evidence is
  rejected.
- The telemetry player set is the selected best-pull roster, not a complete
  encounter-wide participant union.
- A death-chain actor outside that roster is retained as a
  `death-chain-actor`, with only the facts supported by that chain.
- Players and chains join by numeric actor ID. Display names never establish
  identity.
- Eligible and excluded fight IDs must be disjoint and every death chain must
  belong to the declared eligible population.
- Raw, meaningful, first-death and classified-chain totals are reconciled. A
  complete death stream cannot silently disagree with its declared totals.

The missing complete encounter participant union remains visible backend debt;
the Angular UI does not disguise it as a complete roster.

## Evidence, causality and null policy

The active frontend metric contract is `defensive-audit-observational-v1`.

| Question                                  | UI value                      | Reason                                                               |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Did a meaningful death occur?             | observed count/event          | WCL death event within the declared population                       |
| Was there a preceding classified event?   | probable temporal association | ranked event in the bounded death-chain window                       |
| Did that event cause the death?           | not claimed                   | temporal adjacency is not causal proof                               |
| Was a personal defensive ready?           | `UNKNOWN`                     | no versioned class/spec/talent cooldown reconstruction               |
| Did the player own a consumable?          | `UNKNOWN`                     | absence of a cast never proves absence of inventory                  |
| Was there a valid consumable opportunity? | not assessed                  | eligibility/opportunity contract is not implemented                  |
| Was the death preventable?                | `NOT ASSESSED`                | availability, opportunity and counterfactual evidence are incomplete |
| Was a raid cooldown assigned?             | not shown                     | no connected assignment/coverage-plan contract                       |

Observed mechanic occurrence does not imply a player failure. The chain's
`probable-causality` status is rendered as an association, its strength remains
visible, and the UI repeats that it is not proof. Unknown is never converted to
zero, miss, ready, failure or preventable.

## UX and interaction contract

- A shared scope form is mandatory before loading.
- The view filter (`deaths` or `linked`) and selected chain are URL-owned via
  `view` and `death`; changing either does not refetch data.
- The participant ledger provides observed death/cast/association facts and
  never an invented defensive score.
- The replay contains only classified mechanic evidence returned by the chain
  plus the death marker. Raw damage/healing events are not available from this
  response and are not fabricated.
- A selected chain remains deterministic across reloads when its URL identity
  still exists; otherwise the newest visible chain is selected safely.
- Desktop keeps the dense control-room hierarchy; mobile converts ledgers and
  replay into readable stacked regions without horizontal page overflow.

Required states are context-required, loading, empty/waiting, operational
reference gated, ready, partial/truncated, external evaluation, transport error
and contract error. Gated operational knowledge retains safe telemetry; it is
not rendered as zero failures. Partial reasons are open and visible rather than
hidden behind a nominal ready state.

## Resolved legacy contradictions

| Legacy/Golden behaviour                                   | Angular decision                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| Static `5 preventable deaths` and counterfactual verdicts | Removed; preventability is `NOT ASSESSED`                            |
| Static personal coverage percentage                       | Removed; availability is `UNKNOWN`                                   |
| Healthstone/potion opportunity rates                      | Replaced by observed cast counts only                                |
| `DIED WITH PERSONAL` / ready-personal claims              | Removed until a build/spec/talent-aware availability contract exists |
| Assigned raid-cooldown plan                               | Replaced by an explicit missing-evidence boundary                    |
| Golden players and mechanics when data is missing         | Explicit context, empty, gated or error state                        |
| Index-position attribution in legacy generated rows       | Numeric actor-ID reconciliation                                      |
| Gated reference treated like an empty audit               | Safe telemetry retained, chain classification visibly gated          |
| External report presented like HOME execution             | Explicit external-evaluation label; never HOME persistence           |
| Temporal chain phrased as a failure cause                 | Probable association with the analyser disclaimer                    |

The Golden mock remains a visual-composition reference, not a data, formula or
product-truth authority.

## Ownership, rollback and later work

Angular owns this route, decoder, presentation contract and documentation. The
legacy backend owns WCL acquisition, operational persistence and evidence
generation. The global production switch remains disabled and the verified
React route is the immediate rollback.

Later backend work may add a versioned personal-defensive catalogue, confirmed
availability reconstruction, opportunity eligibility, inventory evidence and
raid-cooldown assignments. Those additions require their own evidence contract,
tests and migration slice; the current UI must not anticipate their conclusions.
