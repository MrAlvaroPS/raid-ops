# Fase 1 — estabilización del legado

Estado: **completa; preparada para iniciar la fase 2**

Rama: `phase1-legacy-stabilization`

Base de fase 0: `3c5ed37`

## Objetivo y límites

Esta fase convierte el proyecto React/Vite legado en una referencia migrable y verificable. No inicia todavía la implementación Angular, no cambia el almacenamiento, no recompila el corpus y no compra evidencia externa.

- Llamadas WCL: **0**
- Llamadas a proveedores: **0**
- Mutaciones de corpus o base de datos: **0**
- Cambios en `../raid-ops`: **0**
- Eliminación de funcionalidad o de estilos activos: **0**

## Resultado

| Puerta | Fase 0 | Fase 1 |
|---|---:|---:|
| Unitarios | 439/456 | **458/458** |
| Críticos | 120/141 | **141/141** |
| `verify:vercel` | bloqueado por la versión | **correcto** |
| Build Nitro/Vite | bloqueado por las pruebas | **correcto** |
| Capturas offline | 20 de referencia | **20 verificadas** |
| Errores de navegador | no aplicable al cierre | **0** |
| Diferencias estructurales visuales | no aplicable | **0** |

El aumento de 456 a 458 unitarios corresponde a dos contratos nuevos: fuente única de versión y dificultad obligatoria en los puntos de entrada.

## Clasificación de los fallos heredados

Los 17 fallos unitarios y 21 críticos congelados en fase 0 no tenían una única causa:

1. **Defecto real de release:** `0.3.9-13-vercel.4` incumplía el contador entero exigido por el contrato de despliegue.
2. **Defectos funcionales o de seguridad:** defaults silenciosos a Mythic, estado oficial demasiado genérico, detección incompleta de perfiles SimC no soportados y ownership de DOM basado en observadores globales.
3. **Pruebas obsoletas:** varias comprobaban cachebusters, copias, versiones de capability o nombres de opciones anteriores en vez del contrato activo.
4. **Falsos positivos de las propias pruebas:** expresiones como `table(` coincidían dentro de `stable(` y algunas exigían literales que el runtime genera de forma compuesta.
5. **Deuda conocida, no falsamente resuelta:** fixtures Golden, timers globales, navegación inferida por texto y generaciones históricas coexistentes siguen registradas en la matriz de paridad. Son entradas explícitas para la migración, no comportamiento certificado.

Las pruebas obsoletas se actualizaron contra el runtime activo. No se relajaron los límites de evidencia, HOME/GLOBAL, top-up, Holdout, promoción, presupuesto WCL ni dificultad.

## Versión y configuración

`package.json` es ahora la única fuente editable de la versión global. Vite valida el formato `0.3.9-<entero>-vercel.0`, deriva la versión visible y publica `window.__AVOID_RELEASE__` antes de los runtimes clásicos.

La aplicación muestra `v3.9.14`, derivada de `0.3.9-14-vercel.0`. Las constantes `RELEASE` que permanecen dentro de assets antiguos son revisiones técnicas de componentes y compatibilidad de cache; ya no pueden sobrescribir la versión global visible.

## Dificultad explícita

Se eliminaron los defaults silenciosos a `difficulty=5` en:

- claves y scopes persistentes GLOBAL/HOME;
- rutas de Episode, Matched Null, Evidence Groups, Stability, Holdout y semantic probes;
- creación, adquisición Wide/Deep y ejecución del corpus;
- planificadores y ejecutores quirúrgicos;
- runtime público activo y assets históricos conservados.

Los puntos de entrada fallan cerrados cuando falta la dificultad. Un valor Mythic explícito continúa siendo válido; una omisión ya no se transforma en Mythic.

## Ownership del frontend legado

Se retiraron cuatro `MutationObserver` globales activos de Mechanics/Operational UI y el monkeypatch global que interceptaba `window.MutationObserver` dejó de cargarse desde `index.html`.

Mechanics coordina ahora sus propietarios mediante `avoid:mechanics-layout`. La verificación visual detectó inicialmente que el estado vacío de Raid Execution podía ocultarse en móvil; se corrigió distinguiendo “sin reporte abierto” de “reporte abierto con otro scope” y se repitió toda la captura.

Esto estabiliza la referencia sin pretender que el modelo heredado de timers y DOM patching ya sea la arquitectura objetivo. Angular no debe copiar ese modelo.

## Verificación visual

El capturador propio acepta ahora `--output`, lo que permite verificar una fase en `.migration-backups/` sin sobrescribir la línea base inmutable de fase 0.

Resultado final sobre perfil limpio y APIs bloqueadas:

- 10 superficies en desktop y mobile, 20 capturas totales;
- 0 excepciones de navegador;
- 0 peticiones API observadas;
- 0 llamadas WCL/proveedor;
- mismas cabeceras, breadcrumbs, navegación activa, marcadores Golden y overflow que fase 0;
- 2 instancias de Data & Logs inalcanzable, idénticas al defecto documentado de fase 0.

Las capturas de comprobación están en `.migration-backups/phase1-visual` y no se versionan. La línea base oficial continúa en `evidence/visual/offline`.

## Deuda que pasa deliberadamente a fase 2+

- El bundle Golden continúa siendo el shell y contiene fixtures visuales.
- Persisten runtimes acumulativos, timers, globals y CSS con ownership compartido.
- Los assets históricos siguen disponibles para regresión; todavía no se borran.
- Data & Logs sigue sin ser alcanzable en perfil offline fresco.
- Permanecen los defectos responsive y de navegación consignados en la matriz.
- El warning no bloqueante de Nitro/Rolldown sobre `codeSplitting` sigue presente en build.

Eliminar cualquiera de estos elementos antes de que Angular posea su reemplazo probado rompería la estrategia incremental y el rollback.

## Puerta de salida

**GO a fase 2.** Corrección de secuencia acordada: la fase 2 ordena y transfiere
documentación/releases; la arquitectura base Angular y la capa anticorrupción
corresponden a la fase 3. No se migra todavía Iris learning, LIVE ni Loot.

**Complejidad de fase 3: ALTA.** Recomendación: usar razonamiento alto, porque fija
límites de Clean Architecture, routing, contratos runtime, configuración por
entorno y estrategia de convivencia/rollback que condicionarán todas las
migraciones posteriores.
