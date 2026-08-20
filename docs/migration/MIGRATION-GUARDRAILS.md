# v3 migration guardrails

1. `golden-master/` is retained as historical design evidence; it is not current product truth.
2. Production remains on the verified legacy application until each Angular route passes its functional, data-truth, responsive and rollback gates.
3. Angular preserves AvoiD's visual language and information hierarchy while fixing documented ownership, accessibility and responsive defects.
4. No metric/table/card is deleted to make integration easier. Unsupported values remain present and are marked pending until a real engine supplies them.
5. Flexible WCL JSON ends in `server/wcl/normalization`; React never parses it.
6. New domain logic is forbidden in legacy compatibility adapters and deployment wrappers.
7. Boss-specific logic is forbidden outside `server/rule-packs/`.
8. Intelligence must expose source, confidence and evidence.
9. Storage providers are adapters; analyzers never depend on their implementation.
10. Pixel equality alone cannot approve or reject a migration. Use `docs/visual/LIVING-VISUAL-BASELINE.md`.
