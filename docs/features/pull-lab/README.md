# Pull Lab

Status: Angular frontend owner from Phase 4 slice 4.3. The legacy route remains
rollback evidence until the final production cutover.

## Product purpose

Pull Lab compares two distinct completed analytical pulls from one explicit WCL
report, encounter and difficulty. It helps the raid understand what changed
without promoting correlation into causality. The view retains the control-room
visual hierarchy, two-pull selector, timelines, comparator and mechanics detail,
but every visible value now comes from the operational contract.

## Clean Architecture boundary

```text
presentation/PullLabPage
  -> application/LoadPullLab + PullLabRepository port
     <- infrastructure/PullLabApiRepository + strict decoder
        -> existing GET /api/wcl/operational-execution
  -> domain comparison/death-marker rules
  -> shared absolute-stage and WCL-scope contracts
```

The repository issues one request with mandatory `report`, `encounter` and
`difficulty`. It introduces no endpoint, GraphQL query, timer or fallback
provider. `pullA` and `pullB` are fight IDs in the URL and affect presentation
selection only; changing them does not repeat the API request.

## Selection and population contract

- Both sides belong to the same report, encounter and difficulty.
- Only `pullIntelligence.pulls` may enter comparison.
- `excludedPulls` remain visible as first-class history but never enter metrics,
  selectors or baselines.
- Default A is the newest eligible pull; default B is the previous distinct
  eligible pull.
- Invalid, excluded or duplicate URL selections are resolved deterministically
  to two distinct eligible pulls.
- One eligible pull produces `insufficient-data`, not a self-comparison.
- Response scope, unique eligible IDs and `raw = eligible + excluded` are
  runtime-validated. Contradictions fail closed.

## Metric contract: `pull-lab-comparison-v1`

| Metric | Value | Direction policy |
|---|---|---|
| Boss remaining | WCL `fightPercentage` | lower is improved |
| Duration | closed-pull duration | observational only |
| Stage reached | ordered absolute-stage count | higher is improved |
| First death | first raw friendly death event | later is improved; no death beats a recorded death |
| Meaningful deaths | death events before the wipe cutoff | fewer is improved |
| Raid DPS | WCL Summary for each exact pull | directional only when stage count matches |
| Raid HPS | WCL Summary for each exact pull | always observational/demand-dependent |

Repeated semantic phase IDs remain valid because alignment uses
`absoluteStageIndex`. The timeline displays measured stage bands and raw death
markers; meaningful deaths receive a separate visual mark. The Golden
Bloodlust, raid-cooldown and fabricated death markers were removed because the
contract does not expose them.

## Mechanics evidence contract

Observed mechanic occurrences and classified failures are different evidence
classes and appear in separate sections. A ready classifier with no failures may
state that none was proven for that pull, but never that execution was perfect.
When operational reference/rehearsal is unavailable, the view says
`CLASSIFICATION GATED` and makes no zero-failure claim. Truncated mechanic event
streams produce a partial-evidence warning.

The frontend does not calculate causality, promote mechanics, change evidence
denominators or write WCL evidence. The existing operational endpoint can, for
an eligible HOME report, persist roster, diagnostic/comparison and execution
snapshots. That is inherited server behaviour already used by the legacy active
runtime, not a new Angular side effect. The visual verifier intercepts the call
before dispatch and therefore performs zero provider and persistence work.

## UX, responsive and accessibility decisions

- Context-required, loading, empty, insufficient, ready, partial/gated,
  transport-error and contract-error states are explicit.
- Native labelled selectors disable the opposite selection and keep the visible
  value synchronized with the comparison.
- Desktop uses aligned pull rows and two mechanics columns; mobile stacks these
  without horizontal scrolling.
- Timeline markers have accessible labels/tooltips with actor and elapsed time.
- Status uses text plus colour, never colour alone.
- Excluded resets use a disclosure so auditability does not overwhelm the main
  comparison.

## Legacy contradictions resolved

| Legacy behaviour | Risk | Angular decision |
|---|---|---|
| Golden comparison and root-cause copy were static | fictional operational conclusion | removed; only decoded evidence renders |
| Active runtime could select the same sole pull on both sides | false comparison | explicit insufficient-data state |
| Active runtime labelled DPS better/worse across stages | duration/stage confounding | direction only at equal absolute stage |
| Empty failure array always read as no failures observed | gated classification looked like success | gated and proven-zero states separated |
| Golden timeline contained cooldown/Bloodlust markers absent from the contract | fabricated evidence | only measured stages and death events retained |
| Earlier endpoints omitted difficulty | cross-difficulty contamination | exact scope mandatory in URL, request and response |

## Verification and rollback

Pure rules and the adapter cover direction, no-death semantics, population,
scope, gating and endpoint identity. The cumulative browser verifier records
context, ready, changed-selection, mechanics-gated and insufficient states at
1440×900 and 390×844 with external traffic blocked. The legacy implementation
remains untouched as rollback; the global production switch remains disabled.
