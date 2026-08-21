# Living visual baseline

## Purpose

The retained Golden bundle and Phase 0 screenshots describe where the product
came from. They are strong design evidence, but they are not immutable product
truth and do not overrule real data, accessibility, responsive behavior or an
intentional documented improvement.

The baseline lives through four evidence classes:

1. retained legacy screenshots and visual assets;
2. stable design tokens, density and information hierarchy;
3. functional/data-truth requirements in the parity matrix;
4. accepted decisions and new captures for each migrated route/state.

## What must remain recognizable

- near-black layered surfaces and thin operational borders;
- mint/teal primary accent and explicit semantic status tones;
- compact uppercase metadata and strong numeric hierarchy;
- dense raid-leader information without hiding provenance;
- desktop navigation, usable mobile navigation and clear active route;
- every action and analytical distinction that remains valid.

## What may change

- layout needed to remove overflow or improve accessibility;
- copy needed to state evidence, empty, partial or error status honestly;
- components whose original ownership depended on DOM mutation or text inference;
- obsolete Golden fixture values and fake interactions;
- spacing or responsive grouping when the decision is recorded.

## Per-route approval gate

A migrated route passes only when:

- functional and API-contract parity pass;
- real loading, empty, partial, success and error states are covered;
- desktop and mobile captures are reviewed against the previous accepted baseline;
- no unexplained action, field or evidence meaning disappears;
- accessibility and overflow checks pass;
- intentional visual differences are recorded;
- legacy ownership can be restored immediately.

Pixel similarity is diagnostic, not the decision. A pixel-perfect screen with
invented data fails; a documented responsive improvement with preserved product
meaning may pass.

## Baseline evolution

After a route is accepted, its Angular captures and decision record become the
new baseline for that route. The old Golden capture remains archived context and
is never silently overwritten. No visual verification may acquire WCL/provider
data or mutate the corpus merely to populate a screenshot.

Accepted Phase 4 route baselines currently cover Composition, Damage & Healing,
Pull Lab, Progress, Players and Defensive Audit. The Defensive Audit baseline
retains the dense metrics, participant ledger and evidence-replay hierarchy but
replaces fictional preventability, personal readiness, opportunity rates and
cooldown plans with observed counts, probable-association labels and explicit
unknown/not-assessed boundaries on desktop and mobile.

The former immutable hash manifest is archived because it had drifted from the
retained files before this policy was adopted. `npm run verify:visual-reference`
checks that the currently served legacy fallback and reusable design assets remain
consistent; it deliberately does not turn old hashes into product requirements.
