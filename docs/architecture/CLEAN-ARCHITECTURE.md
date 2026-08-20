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

`npm run verify:architecture` enforces the dependency direction and prevents Phase 2 from claiming product ownership.

## Backend boundary

The existing Nitro backend remains authoritative during incremental migration. Angular receives `unknown`, validates it through a contract decoder and only then exposes typed data. Transport failures and contract failures stay distinct. Missing or invalid data never becomes a mock payload.

Every future endpoint adapter must retain report, encounter, difficulty and partition where applicable, plus the existing HOME/GLOBAL and evidence-class boundaries.
