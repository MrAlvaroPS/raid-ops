# Composition

Status: Angular frontend owner. The legacy Node/Nitro backend remains the active
owner of WCL acquisition and telemetry persistence.

## User purpose

Composition answers what the selected pull's roster actually contains: tanks,
healers, melee and ranged DPS, represented classes, item level, gear, talents,
output and publishable Reliability state. It does not currently answer what an
ideal or peer-kill composition should be.

The route is `/composition`. A request is permitted only after the user provides
an explicit WCL `report`, `encounter` and `difficulty`. There is no default
report, inferred encounter or cross-difficulty fallback in Angular.

## Architecture and contract

```text
presentation/composition-page
  -> application/LoadComposition + CompositionRepository port
     <- infrastructure/CompositionApiRepository
        -> GET /api/wcl/telemetry?report=...&encounter=...&difficulty=...
  -> domain/composition.rules (pure role/class/talent rules)
```

The backend response is received as `unknown` and decoded by
`composition-api.contract.ts`. A ready response is rejected unless:

- the response scope matches the requested encounter and difficulty;
- `scopeKey` equals `<encounter>:d<difficulty>`;
- `evidenceContract.scopeIdentity` is `encounter+difficulty`;
- `crossDifficultyComparisonForbidden` is `true`;
- actor identities are positive and roles are `TANK`, `HEAL`, `DPS` or explicit
  unknown;
- external build links are HTTPS Wowhead links.

Composition deliberately consumes only a typed roster projection of the broad
telemetry response. It adds no WCL query, polling loop, persistence write,
corpus mutation or provider acquisition. Extracting a smaller backend read model
is future backend refactoring, not a reason to duplicate acquisition now.

## States and truth policy

| UI state | Trigger | Behaviour |
|---|---|---|
| Context required | one or more scope fields absent/invalid | zero API requests; form remains actionable |
| Loading | exact scope submitted or restored from URL | one telemetry request; no Golden fallback |
| Empty | no matching/completed pull or no actors | explicit reason and zero roster metrics |
| Partial | actors exist but roles/profiles/subqueries are incomplete | real known values plus named gaps |
| Ready | decoded WCL actors exist | observed roster panels and expandable profiles |
| Transport error | backend unavailable/HTTP failure | safe error and retry only when meaningful |
| Contract error | malformed or cross-scope response | safe non-retryable evidence-contract failure |

Unknown roles are not coerced to ranged DPS. Reliability `null` is rendered as
`PENDING`, never as zero. Opaque talent node/entry identifiers are hidden;
resolved names or spell IDs may be shown. Missing gear or talents stay
unavailable. Wowhead links keep working without making tooltip availability a
data-truth prerequisite.

## Migrated visual and interaction contract

Retained from the living legacy baseline:

- dark compact raid-operations visual language and mint evidence accent;
- page banner, roster summary, role distribution, verdict, all 13 retail class
  rows and expandable player details;
- class colours, item/build links and high information density.

Intentional improvements:

- an explicit scope form replaces hidden URL/default scope behaviour;
- mobile roster rows become labelled two-column cards instead of requiring a
  940px horizontal table;
- empty, partial and contract-error states replace surviving Golden content;
- Angular router ownership fixes stale breadcrumb/dual-active navigation;
- peer bars, the 92% fit, 184-guild sample, kill averages and speculative roster
  recommendations are removed until a cohort-matched contract exists.

## Audited contradictions and obsolete behaviour

| Legacy behaviour | Finding | Angular decision |
|---|---|---|
| Golden `92%`, `184 GUILDS`, role peers and recommendation cards | fictional fixture data can survive offline | rejected; explicit pending states |
| active `wcl-runtime.js` telemetry URL omits `difficulty` | contradicts the difficulty-isolation contract | fixed; all three parameters mandatory and response scope revalidated |
| unknown class/role falls through to ranged classification | invents a role from absence | fixed; counted as unclassified |
| reconstructed React Composition is treated as source truth | it omits later runtime adapters and imports Golden mocks | retained only as historical/rollback implementation |
| no-roster state leaves scrubbed Golden structure | confusing mixed ownership | replaced by one explicit Angular empty surface |

The legacy implementation remains executable only for immediate rollback while
the overall production switch stays disabled. It must not receive new frontend
Composition behaviour. Its deletion belongs to final cutover cleanup, after the
rollback window and production route switch are explicitly approved.
