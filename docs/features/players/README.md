# Players frontend contract

Status: Angular frontend owner from Phase 4 slice 4.5. The Reliability formula,
evidence producers, HOME boundary and WCL implementation remain owned by the
legacy backend until that capability is migrated.

## Product purpose

Players helps a Raid Leader inspect what is actually known about one HOME
raider in one report, encounter and difficulty:

- best-pull DPS/HPS as independent Performance context;
- report-scoped deaths, raw utility and player-attributed mechanic evidence;
- publication-gated Reliability and its Mechanics, Survival, Defensives and
  Duties dimensions;
- current-report participation;
- persisted longitudinal HOME presence since the character's first indexed
  appearance.

It is not a parse table, guild roster, attendance grade, player-worth ranking or
automatic coaching system. A missing failure is not proof of success, a raw
interrupt is not a completed duty, and observed presence is not a membership,
bench or excused-absence register.

## Audited sources

The slice was frozen only after reviewing:

- the reconstructed React Players page and its Golden fixture;
- active `player-intelligence-v392.js`, historical v386 behaviour and their
  responsive CSS;
- `/api/wcl/telemetry`, `/api/wcl/intelligence` and persisted
  `/api/wcl/home-history` engines and services;
- the `PlayerAnalysis` TypeScript contract, player normalisation, stable
  attendance identity and report-local player matrix;
- Reliability contract `1.1.0`, metric registry, evidence ledger, scorer,
  publication gate, data-integrity rules and shadow checkpoint;
- v3.8.6/v3.8.8/v3.9.2 tests and release notes;
- desktop and mobile Phase 0 captures.

The Golden screen remains visual intent only. Its names, scores, eight-night
trend, status labels and coaching sentence are fictional and never enter an
Angular payload or fallback.

## Data and scope flow

```text
report + encounter + difficulty
        |
        +-- /api/wcl/telemetry -------- best-pull roster, output, deaths, utility
        +-- /api/wcl/intelligence ----- HOME gate, player matrix, Reliability

encounter + difficulty
        |
        +-- /api/wcl/home-history ----- persisted HOME presence, 0 WCL read
```

All report reads carry all three explicit parameters. Responses are rejected if
the report, encounter, difficulty, `scopeKey`, Reliability profile context or
difficulty-isolation declaration disagrees. HOME attendance deliberately omits
the Active Report because it is longitudinal and report-independent.

The two report endpoints currently cause duplicated telemetry work inside the
legacy backend because Intelligence calls Telemetry internally but does not
return its roster. Angular does not hide this architectural debt or add another
provider query. Removing it requires a backend composite read contract in a
later backend slice; changing the Reliability/WCL engine was outside this
frontend migration.

## Population and identity

Players is HOME-only. If Intelligence classifies the source as external, the
route shows a not-applicable boundary and admits no external identity, player
matrix, attendance or Reliability data.

The current telemetry roster is technically the selected best-pull roster, not
the complete encounter roster promised by old copy. Angular also retains real
classified execution actors that appear in `playerMatrix` outside that best
pull, labels their origin and leaves unavailable output/role facts null. This
still cannot recover clean substitutes absent from both populations, so the
coverage limitation is always disclosed. A future backend union-participant
ledger remains required for a truly complete roster.

Report actor IDs own only in-page selection and the `player` query parameter.
They are not longitudinal identity. Attendance joins only on the exact
normalised `realm:name` identity supplied by persisted HOME history. Name-only
matching is forbidden because same-name characters and transfers can collide.

## Reliability publication and null policy

The frontend never calculates or reweights Reliability. A public number needs
both:

```text
profile.status === "published"
publication.publishable === true
finite profile.value
```

Any contradiction fails the response contract. `shadowValue` is not decoded
into the Angular domain. Numeric component results remain gated until the
overall profile is publishable; their internal state may be described, but is
not displayed as public Reliability. Roster Reliability is the arithmetic mean
of published finite profiles only.

Distinct visible states are preserved:

- `RELIABLE`: published value and all public dimensions;
- `PENDING`: a profile exists but evidence gates are open;
- `DATA ERROR`: scorer data-integrity failure;
- `NO PROFILE`: the backend produced no profile for that actor;
- `NOT APPLICABLE`: external population rejected.

DPS/HPS stays labeled `OUTPUT · NOT SCORE`. Raw interrupt/dispels and classified
failures remain descriptive. Probable death links explicitly avoid claiming
causation. `0` is used only where the ready Intelligence matrix proves no
classified row for an actor; unavailable matrices, telemetry fields, profiles
or identity joins use an em dash or an explicit state.

## Interaction and responsive behaviour

- report, encounter and difficulty are URL-owned;
- the selected report-local actor is URL-owned and does not refetch the scope;
- roster, dossier and evidence matrix share one Angular signal owner;
- desktop keeps the bounded roster beside the dossier;
- tablet stacks roster and dossier;
- mobile keeps all dossier dimensions visible and reduces the wide matrix to
  the leading evidence columns behind its own horizontal container;
- context-required, loading, empty, external, partial, pending, published,
  integrity-error, transport-error and contract-error states never reveal a
  Golden fallback.

## Audited contradictions and Angular decisions

| Legacy behaviour                                            | Finding                                                 | Angular decision                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Golden roster, scores, trend and coaching                   | fictional data survives with zero profiles              | removed; explicit real-data states                               |
| Golden copy says `Avoid roster · last 10 progression pulls` | backend roster is selected best pull                    | relabeled and coverage debt disclosed                            |
| v392 waits for `__AVOID_WCL_INTELLIGENCE__`                 | modern execution context no longer hydrates that global | explicit `/api/wcl/intelligence` dependency                      |
| v386 treated any non-null value as public                   | obsolete before the v392 hotfix                         | double publication gate enforced by decoder                      |
| pending profiles could show numeric component scores        | ambiguous public/shadow boundary                        | all numeric dimensions gated with the overall profile            |
| absent profile rendered `PENDING`                           | absence is not a scored profile state                   | distinct `NO PROFILE`                                            |
| unknown role fell through to DPS/output grouping            | invents classification from missing data                | nullable `Unclassified`, no output unit                          |
| historical attendance joined by normalised name only        | can merge different realms/characters                   | exact realm+name only; otherwise unavailable                     |
| old `/api/wcl/history` populated attendance                 | can buy fresh WCL evidence during page load             | persisted `/api/wcl/home-history`, zero-WCL declaration required |
| matrix omitted Duties                                       | incomplete public Reliability explanation               | Duties shown in dossier and matrix                               |
| fake eight-night line implied Current Form                  | no versioned current-form series backs it               | removed until a longitudinal Reliability product exists          |

## Ownership and rollback

Angular owns new Players frontend behaviour, tests, route documentation and
visual baselines. The React route remains frozen solely as rollback while the
global production switch is disabled. Backend Reliability doctrine and code are
referenced at their implementation owner rather than copied into a second
canonical contract.
