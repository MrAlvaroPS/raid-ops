# Clean Architecture contract

The Angular application is feature-first. A feature may contain:

```text
feature/
  domain/          entities, value objects and pure rules
  application/     use cases and ports
  infrastructure/ adapters for HTTP, storage and providers
  presentation/   Angular route components and UI state
```

Dependency direction is inward:

```text
presentation → application → domain
infrastructure → application/domain
```

`domain` and `application` cannot import Angular, RxJS, infrastructure or presentation. `core` contains cross-cutting framework configuration and the legacy HTTP anti-corruption boundary; it must not become a second domain layer. `shared` accepts only code proven reusable by more than one feature.

`npm run verify:architecture` enforces the dependency direction. During Phase 4
it permits only the surfaces whose complete slice gate has transferred:
Progress, Pull Lab, Damage & Healing and Composition. It verifies their explicit
report/encounter/difficulty adapters and the pre-existing reads used by the
throughput and pull-comparison routes, plus Progress's report-independent HOME
history boundary. `shared` now contains WCL scope plus the
absolute-stage model, each with at least two real consumers.

## Backend boundary

The existing Nitro backend remains authoritative during incremental migration. Angular receives `unknown`, validates it through a contract decoder and only then exposes typed data. Transport failures and contract failures stay distinct. Missing or invalid data never becomes a mock payload.

Every future endpoint adapter must retain report, encounter, difficulty and partition where applicable, plus the existing HOME/GLOBAL and evidence-class boundaries.
