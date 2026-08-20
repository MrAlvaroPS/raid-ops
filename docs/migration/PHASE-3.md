# Phase 3 — Angular foundation

Status: complete, including the Phase 2–3 documentary hand-off (2026-08-20).

## Scope

- standalone Angular shell and lazy product routes;
- runtime configuration without environment-file secrets;
- typed, runtime-decoded legacy API boundary;
- feature-first Clean Architecture folders and automated dependency rule;
- explicit legacy ownership and disabled production switch;
- desktop/mobile foundation verification.

## Out of scope

- migrating product metrics or Golden fixture values;
- LIVE polling;
- Iris learning, evidence acquisition or corpus changes;
- Loot and SimulationCraft;
- production routing or Vercel deployment changes.

Source baseline: legacy Phase 2 commit `ec7968b` on `phase2-documentation-releases`.
Legacy documentary hand-off: commit `c300993` on the same branch.

## Exit evidence

- architecture rule: PASS across 13 production TypeScript files;
- tests: 8/8 PASS across runtime config, API contract, migration ownership and routing;
- production build: PASS;
- browser verification: 4/4 route/viewport checks PASS (`/foundation` and `/mechanics`, desktop and mobile);
- browser runtime errors: 0;
- horizontal overflow findings: 0;
- browser-observed `/api` requests: 0;
- WCL/provider calls and corpus/database mutations: 0;
- Angular-owned product surfaces: 0; all 11 remain explicitly legacy-owned;
- production switch: statically disabled.

Screenshots and the browser report are generated under the Git-ignored
`.migration-evidence/phase3/` directory by `npm run verify:visual` while the local
Angular server is running.

## Product-slice hand-off

The first product vertical slice is not assigned a phase number by this foundation.
When the roadmap schedules it, **Composition** remains the safest candidate to
establish the repeatable feature pattern end to end: explicit backend contract, domain model,
application port/use case, infrastructure adapter, real empty/partial/error states,
responsive visual parity, tests, feature ownership gate and immediate rollback to
the verified legacy route. LIVE, Loot and Iris remain out of scope.

## Documentary closure

Before beginning that slice, the target repository received the Phase 0–2
reports, architecture/data baselines, parity matrix, living visual policy and all
twenty frozen visual captures. Angular is now the active owner of migration
coordination and the single changelog. Server/Iris/WCL contracts remain beside
the backend implementation and are governed by the documentation ownership
matrix; they were not duplicated.
