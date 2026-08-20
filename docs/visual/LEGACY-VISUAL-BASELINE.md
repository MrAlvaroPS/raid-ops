# Visual baseline

Canonical policy: [`LIVING-VISUAL-BASELINE.md`](./LIVING-VISUAL-BASELINE.md).
This document records the Angular migration's Phase 0 capture set and known defects.

## Baseline role

The Golden master is now a design reference, not immutable product truth. The Angular visual contract is the combination of:

1. current offline screenshots;
2. extracted visual tokens and spacing;
3. functional/evidence requirements in the parity matrix;
4. intentional visual decisions recorded during migration.

Angular must preserve identity and information density while fixing current ownership, responsive and data-truth defects.

## Captured set

`npm run migration:visuals` captured all ten navigation sections at:

- desktop: 1600 × 1000;
- mobile: 390 × 844.

The 20 WebP files and their SHA-256 hashes are registered in
`../migration/evidence/visual/offline/manifest.json`. The harness uses a fresh
profile, clears local storage, forces stored mode, stubs `/api`, blocks external
HTTP and disables transitions.

This is the **offline/no-authoritative-data state**. It executes zero WCL/provider calls and does not mutate the corpus.

## Current defects explicitly excluded from visual parity

| Defect | Evidence | Angular expectation |
|---|---|---|
| Mobile execution header overflows | mobile screenshots | Responsive grouping or progressive disclosure with all controls reachable. |
| Golden content survives missing data | Command Center, Damage & Healing, Defensive Audit, Players | Explicit empty/partial state; never fictional values. |
| Players mixes zero profiles with fictional roster | Players screenshots | A single real-data owner controls banner, roster and detail. |
| Loot retains Composition breadcrumb and active state | Loot screenshots and manifest heading | Router derives breadcrumb and exactly one active navigation item. |
| Data & Logs button is absent | visual manifest `unreachableSurfaces` | Shell owns and exposes one operations entry point. |
| Release labels differ across layers | sidebar, Loot banner, HTML assets | One generated application release source. |

## Visual characteristics to preserve

- Near-black layered surfaces rather than flat black.
- Mint/teal as the primary operational accent.
- Compact uppercase metadata labels.
- Strong numeric hierarchy and dense operational tables.
- Thin borders, restrained radii and low-noise shadows.
- Fixed desktop navigation with a compact mobile header.
- Clear green/amber/red semantic tones that do not depend on colour alone.
- Section banner followed by metrics and analytical detail.

## Required future capture states

Offline screenshots are sufficient to freeze the legacy shell before Phase 1, but each feature migration must add sanitised deterministic captures for its applicable states:

- loading;
- no data;
- stored data;
- connected data;
- partial provider failure;
- terminal error;
- Live waiting, active and closed-pull transition;
- narrow mobile and desktop.

Those payloads must come from persisted, sanitised evidence or contract fixtures. No new WCL acquisition is authorised by visual testing.

## Review rule

A pixel difference is not automatically a regression. It is accepted when:

- the visual language is preserved;
- information and actions remain present;
- provenance and state become clearer;
- accessibility or responsive behaviour improves;
- the decision is recorded in the migration PR.

A screenshot that matches while changing a metric population, evidence meaning or user action is a functional regression and must fail regardless of pixel similarity.
