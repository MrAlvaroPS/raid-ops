# Fase 2 - documentacion y releases

Estado: **completada el 2026-08-20**.

## Ejecutado

- Creado `docs/README.md` como indice documental canonico.
- Separados documentos vigentes, planificados e historicos mediante indices y
  subcarpetas de estado.
- Archivados 50 documentos antiguos de releases/checkpoints.
- Movidos los antiguos informes de fidelidad, inventarios y resultados v3.2 al
  archivo de auditorias.
- Archivados Netlify, sus instrucciones Git y los 16 ficheros de `deploy-preview`.
- Movida la guia Vercel vigente a `docs/current/deployment/VERCEL.md`.
- Creado `docs/releases/CHANGELOG.md` como unico changelog mantenido hacia delante.
- Sustituida la regla Golden rigida por `docs/visual/LIVING-VISUAL-BASELINE.md`.
- Archivados el manifest de hashes Golden obsoleto y su verificador; cinco de sus
  seis hashes ya no representaban los ficheros retenidos. La nueva puerta
  `verify:visual-reference` valida el fallback y la evidencia viva sin congelar el producto.
- Actualizadas las pruebas que dependian de `deploy-preview` para inspeccionar los
  assets activos de `public/`.
- Conservados los paths raiz sensibles usados por guardrails y contratos de Iris.

## Seguridad

- No se ha alterado logica de negocio, adquisicion WCL, proveedores, corpus ni base
  de datos.
- El contenido historico se ha movido, no eliminado.
- Netlify queda explicitamente marcado como no desplegable.
- La baseline Golden se conserva como evidencia historica y fallback visual.

## Puerta de salida

La fase se cierra cuando la estructura documental automatizada, tests unitarios,
tests criticos y build de produccion vuelvan a pasar y el repositorio no contenga
un segundo changelog ni dependencias activas de `deploy-preview`.

Resultado: `verify:docs` y `verify:visual-reference` PASS, 458/458 tests
unitarios, 141/141 tests criticos y build de produccion PASS. Los dos helpers
Python restantes no se pueden ejecutar en este Windows porque `python3` resuelve
al alias de Microsoft Store; no forman parte del build y la limitacion queda
registrada para una fase de tooling.

## Cierre posterior de transferencia

Al terminar la fundación Angular de fase 3 se corrigió la omisión de destino:
los informes de fases 0–2, baselines, matriz de paridad, evidencia
machine-readable y veinte capturas se transfirieron a este repositorio. El
changelog activo también se trasladó y reconstruyó aquí. La copia del repositorio
React queda como evidencia histórica; no se abre una fase nueva ni se mantienen
dos fuentes activas.
