# Integral migration definition of done

A route or capability is not migrated because an Angular page exists. It is done
only when all applicable gates below pass and the evidence is committed.

## Functional and data parity

- Every user action and intentional analytical distinction is mapped.
- Loading, empty, partial, success and error states use real decoded contracts.
- Metric formulas, populations, denominators, null policy and provenance remain
  unchanged unless an explicit versioned decision approves a change.
- Report, encounter, difficulty, partition, HOME/GLOBAL and evidence-class
  boundaries remain explicit.
- Persisted data is neither deleted nor rewritten by a frontend migration.

## Visual and interaction parity

- Desktop and mobile captures are reviewed against the living baseline.
- A removed card, field or action requires an explicit product decision.
- Responsive and accessibility improvements are recorded, not hidden as drift.
- Golden fixture values and fake interactions never substitute unavailable data.

## Architecture and operation

- Domain, application, infrastructure and presentation dependencies obey the
  Clean Architecture rule.
- The endpoint decoder distinguishes transport, contract and domain failures.
- Polling, cancellation, rate budgets and approvals are preserved where relevant.
- Production ownership changes only behind a tested rollback switch.

## Documentation and release evidence

- The parity-matrix row and feature ownership catalog agree.
- Active behaviour/API/state documentation is transferred to Angular.
- The changelog is updated once, in `docs/releases/CHANGELOG.md`.
- Intentional visual changes and verification output are recorded with the slice.
- The legacy owner is marked historical only after every preceding gate passes.

Failing any applicable item leaves the feature owned by the legacy application.
