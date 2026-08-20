# Release provenance and historical limits

The repository does not contain a conventional long-running tagged release
history. This document prevents the changelog from presenting inference as fact.

## Audited source

- Legacy production branch examined: `main` at `aff7992`.
- Phase 0–2 source baseline: `ec7968b`.
- Git history available from 2026-08-14 to 2026-08-20.
- Commits reachable from legacy `main`: 1,080.
- First-parent commits on legacy `main`: 55.
- Commits across all local references at audit time: 2,031.
- Git tags: none.
- Earliest package-bearing commit: `e43a6f1`, already at
  `0.3.7-vercel.0`.
- Documents V3.1 through V3.7 were imported together by `8adaed6`; their
  original commit dates are not present.

Commit counts are audit context, not release counts. Merged branches and local
references make the all-reference count unsuitable as a product timeline.

## Evidence classes

- **mainline-confirmed**: the change is reachable from legacy `main` and has a
  release commit, package transition or production merge.
- **mainline-integrated**: the milestone is present inside a consolidated main
  merge, but no standalone package release or tag proves an independent deploy.
- **documented-pre-git**: an archived release document exists, but it arrived in
  the import snapshot and its original date/commit cannot be recovered here.
- **conflicted-documentation**: surviving documents disagree and the changelog
  records the conflict instead of choosing a convenient answer.
- **branch-only**: a version-labelled commit exists outside `main`; it is not
  listed as a production release.

Examples excluded as branch-only are v3.7.14 and v3.8.10–v3.8.16. Their work may
have been superseded or reintegrated later, but the available graph does not prove
those labels were standalone mainline releases.

## Two version streams

The visible product series (`v3.9.13`, component overlays such as
`v3.9.13.14`) is not the npm/Vercel package identifier. During the 0.3.9 line the
valid package form is `0.3.9-<integer>-vercel.0`. Historical values such as
`0.3.9-6.1-vercel.0`, `0.3.9-7.0-vercel.0` and `vercel.1`–`.4` are recorded as
past inconsistencies, not valid templates.

The machine-readable audit is
[`../migration/evidence/release-history.json`](../migration/evidence/release-history.json).
