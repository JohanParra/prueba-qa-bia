# Reporte de defectos

Este documento presenta los cinco defectos identificados durante la ejecución de pruebas funcionales y el análisis de caja blanca. La numeración sigue el orden de detección; la prioridad de cada uno está en su ficha y en el resumen final.

Todas las rutas de API cuelgan de `/api/v1` y requieren `Authorization: Bearer <token>`. Los requests de reproducción están en la colección [postman/](postman/).

**Entorno común:** Commit `026b991` · macOS · Zona horaria `America/Bogota` · Chrome · API `localhost:8080` · UI `localhost:5173` · Sin `OPENAI_API_KEY`

## Criterios de clasificación

- **Severidad:** Impacto en la correctitud de la información o decisiones operativas
- **Prioridad:** Facilidad de ocurrencia y visibilidad del defecto en flujos críticos

---

## DEF-01 · Conversión incorrecta de hora de planta

**Síntoma:** Las marcas de tiempo de anomalías se muestran convertidas a la zona horaria local del navegador, en lugar de mostrarse en hora de planta sin conversión.

**Impacto operativo:** El operador visualiza en el Despacho que el cambio en M-109 fue detectado a las `12/09 09:00`, cuando el motor registró el evento a las `14:00` (hora de planta). Esta diferencia de 5 horas puede alterar la correlación con eventos operativos y afectar la investigación en sitio.

- **Severidad:** Alta — La información incorrecta sobre el momento del evento puede conducir a decisiones erróneas
- **Prioridad:** P1 — El defecto se manifiesta en todas las pantallas principales (Despacho, Libro de Medidores, Panel de Detalle, Investigación) al abrir la aplicación desde Colombia

**Distinción severidad/prioridad:** La severidad evalúa el daño si el usuario confía en la información incorrecta; la prioridad refleja la facilidad de ocurrencia y la ubicuidad del defecto en la interfaz.

### Pasos para reproducir

1. Configurar el navegador o entorno de pruebas con zona horaria `America/Bogota` (o Playwright con `timezoneId: 'America/Bogota'`)
2. Iniciar sesión y navegar al Despacho o sección de Anomalías
3. Observar el campo "Detectada" en la tarjeta del medidor M-109
4. Opcional: Abrir el panel de detalle de M-109 y verificar el campo "Última lectura (hora de planta)"

### Datos de prueba

- `detected_at`: `2026-09-12T14:00:00Z`
- `last_reading_at`: `2026-09-14T23:00:00Z`

### Resultado esperado vs obtenido

| Campo | Esperado según [PRODUCT.md](../frontend/PRODUCT.md) | Obtenido |
|-------|-----------------------------------------------------|----------|
| Detectada (M-109) | `12/09 14:00` | `12/09 09:00` |
| Última lectura | `14/09 23:00` | `14/09 18:00` |

**Especificación:** PRODUCT.md establece explícitamente: "La hora de planta se muestra tal cual, sin convertirla a la zona horaria del navegador."

### Evidencia

- [evidencias/DEF-01-formatPlantTime-bogota.json](evidencias/DEF-01-formatPlantTime-bogota.json)
- [evidencias/DEF-01-api-timestamps.json](evidencias/DEF-01-api-timestamps.json)
- Prueba de regresión automatizada: `qa/e2e/tests/defects/plant-time.spec.ts` (marcada con `test.fail`)

### Causa raíz

En el archivo [format.ts](../frontend/src/lib/format.ts) (líneas 55–57), la función `formatPlantTime` utiliza getters de fecha local (`getHours()`, `getDate()`, `getMonth()`) en lugar de los equivalentes UTC (`getUTCHours()`, `getUTCDate()`, `getUTCMonth()`).

**Inconsistencia interna:** El comentario en el mismo archivo indica la necesidad de usar partes UTC, y las funciones `formatPlantDate` y `formatPlantDay` implementan correctamente este patrón.

### Estrategia de detección en CI

1. **Prueba unitaria:** `vite.config.ts` (línea 33) fija `env: { TZ: 'UTC' }` para Vitest; con UTC los getters locales y los UTC coinciden y el defecto queda oculto. Añadir un test de `formatPlantTime` que corra con `TZ=America/Bogota` (o una segunda ejecución de Vitest con esa zona) y espere `12/09 14:00`
2. **Prueba E2E:** Ejecutar con `timezoneId: 'America/Bogota'` y validar que las marcas de tiempo se muestren sin conversión (ejemplo: `12/09 14:00`)

---

## DEF-02 · Búsqueda de medidores sensitiva a mayúsculas/minúsculas

**Síntoma:** La búsqueda de medidores con identificadores en minúsculas (ejemplo: `m-109`) no retorna resultados, requiriendo entrada con mayúsculas exactas (`M-109`) o búsqueda parcial (`109`).

**Impacto operativo:** Un operador que tipee rápidamente `m-109` obtendrá una lista vacía, pudiendo interpretar erróneamente que el medidor no existe o no tiene anomalías. La documentación especifica que la búsqueda no debe ser case-sensitive.

- **Severidad:** Media — Puede ocultar temporalmente medidores críticos si la búsqueda "falla" silenciosamente
- **Prioridad:** P2 — Existe workaround evidente (búsqueda parcial con `109` o uso de mayúsculas); la ocurrencia es menos frecuente que la visualización del Despacho

### Pasos para reproducir

1. Iniciar sesión y obtener token de autenticación
2. Enviar `POST /api/v1/meter/getAll` con body `{ "pagination": { "page": 1, "size": 10 }, "filter": { "meter_id": "m-109" } }`
3. Observar respuesta con `count: 0`
4. Repetir con `"meter_id": "109"` (búsqueda parcial)
5. Observar respuesta con `count: 1`

### Resultado esperado vs obtenido

| `filter.meter_id` | Esperado según [backend/README.md](../backend/README.md) (línea 96) | Obtenido |
|-------|-------------------------------|----------|
| `m-109` | Incluye medidor M-109 | `count: 0` (lista vacía) |
| `109` | Incluye medidor M-109 | `count: 1` (correcto) |

### Evidencia

- [evidencias/DEF-02-search-m-109.json](evidencias/DEF-02-search-m-109.json)
- [evidencias/DEF-02-search-109.json](evidencias/DEF-02-search-109.json)

### Causa raíz

En [service.go](../backend/internal/meter/service.go) (línea 59), el filtro usa `strings.Contains(sm.MeterID, search)` sin normalizar el caso. `PagedRequest.Normalize` en [dto.go](../backend/internal/meter/dto.go) (línea 44) solo aplica `TrimSpace` al `meter_id`, sin convertir a mayúsculas o minúsculas.

### Estrategia de detección en CI

1. **Prueba unitaria:** Caso de prueba en `GetAll` con parámetro `"m-109"` validando que retorne el medidor M-109
2. **Prueba de API:** Request en Playwright (`qa/e2e/tests/api/meters.api.spec.ts`) con validación del comportamiento case-insensitive (actualmente marcado con `test.fail`)

---

## DEF-03 · Clasificación errónea de falso positivo como alerta

**Síntoma:** El medidor M-106, clasificado por el motor de anomalías como `FALSE_POSITIVE` (tipo que no requiere escalamiento), aparece en la interfaz y API con estado `ALERT` en lugar de `NORMAL`.

**Impacto operativo:** El operador visualiza M-106 en la lista de "Alertas" junto con M-104, lo que contradice la acción recomendada ("no escalar"). El filtro de "Normales" no incluye M-106, inflando artificialmente el conteo de alertas y creando inconsistencia entre el mensaje de producto y el estado visual.

- **Severidad:** Alta — Contradice directamente la acción recomendada y contamina las métricas de alertas activas
- **Prioridad:** P1 — Afecta lo primero que visualiza el operador en el Despacho y los filtros del Libro de Medidores

**Nota:** En este defecto, severidad y prioridad coinciden en su nivel alto debido al impacto directo en la toma de decisiones y su visibilidad inmediata.

### Pasos para reproducir

1. Enviar `GET /api/v1/meter/getById/M-106` y observar el campo `status`
2. Enviar `POST /api/v1/meter/getAll` con `"filter": { "status": "NORMAL" }` y `size: 20`; verificar si M-106 está incluido
3. Repetir con `"status": "ALERT"`
4. En la interfaz: Navegar al Libro de Medidores y comparar las pestañas "Alertas" vs "Normales"

### Resultado esperado vs obtenido

| Campo | Esperado según [backend/README.md](../backend/README.md) (línea 105) | Obtenido |
|-------|-------------------------------|----------|
| Estado de M-106 | `NORMAL` | **`ALERT`** |
| Filtro status=NORMAL | Incluye M-106 | 8 medidores, M-106 ausente |
| Filtro status=ALERT | Solo M-104 | M-104 y M-106 |

### Evidencia

- [evidencias/DEF-03-m106-detail.json](evidencias/DEF-03-m106-detail.json)
- [evidencias/DEF-03-anomaly-statuses.txt](evidencias/DEF-03-anomaly-statuses.txt)
- [evidencias/DEF-03-status-normal.txt](evidencias/DEF-03-status-normal.txt)

### Causa raíz

La función `StatusOf` en [enums.go](../backend/internal/meter/enums.go) (línea 29) evalúa únicamente la presencia de anomalía y la severidad (`HIGH` → `CRITICAL`, cualquier otra → `ALERT`), sin considerar el tipo. No contempla `FALSE_POSITIVE`, que debe mapearse a `NORMAL` independientemente de la severidad.

**Ausencia en suite de pruebas:** `TestStatusOf` en [service_test.go](../backend/internal/meter/service_test.go) (línea 31) cubre `nil`, `HIGH`, `MEDIUM` y `LOW`, pero ningún caso de tipo `FALSE_POSITIVE`; por eso `go test ./...` pasa con el defecto presente.

### Estrategia de detección en CI

1. **Prueba unitaria:** Extender `TestStatusOf` con caso `StatusOf(anomaly{Type: FALSE_POSITIVE}) → NORMAL`
2. **Prueba de integración:** Validar en el dashboard que `alert_count == 1` (únicamente M-104)

---

## DEF-04 · Botón de paginación deshabilitado incorrectamente

**Síntoma:** En el Libro de Medidores, con 12 registros totales y tamaño de página 10, el indicador muestra "1–10 de 12 medidores" pero el botón "Siguiente" permanece deshabilitado, impidiendo el acceso a los medidores M-111 y M-112.

**Impacto operativo:** Aunque actualmente solo afecta a 2 medidores con estado normal, el problema escalará proporcionalmente con el crecimiento del dataset. Los medidores de la segunda página se vuelven inaccesibles desde la interfaz.

- **Severidad:** Media — Con el dataset actual (12 medidores) el impacto es limitado; el problema se agrava con datasets mayores
- **Prioridad:** P2 — Existe workaround (aplicar filtros o consultar API directamente); con 12 elementos el dolor operativo es acotado

### Pasos para reproducir

1. Iniciar sesión y navegar a la sección Medidores
2. Observar el indicador de paginación: "1–10 de 12 medidores"
3. Intentar hacer clic en el botón "Siguiente"
4. Verificar que el botón está deshabilitado

### Datos de prueba

- `count`: 12 medidores
- `size`: 10 registros por página
- `page`: 1
- Página 2 esperada: M-111, M-112

### Resultado esperado vs obtenido

| Elemento | Esperado | Obtenido |
|----------|----------|----------|
| Indicador "1–10 de 12" | Correcto | Correcto |
| Botón "Siguiente" en pág. 1 | Habilitado | **Deshabilitado** |
| Navegación a pág. 2 | Visualizar M-111 y M-112 | No es posible |

### Evidencia

- [evidencias/DEF-04-paginacion-ui.png](evidencias/DEF-04-paginacion-ui.png)
- [evidencias/DEF-04-calculo-paginas.json](evidencias/DEF-04-calculo-paginas.json)

### Causa raíz

En el archivo [Pagination.tsx](../frontend/src/features/meters/components/Pagination.tsx) (línea 13):

```typescript
const pages = Math.max(1, Math.floor(count / size))
```

La función `Math.floor(12/10)` retorna `1`, haciendo que el componente calcule incorrectamente que existe una sola página. El cálculo correcto debe usar `Math.ceil` para redondear hacia arriba.

**Inconsistencia interna:** El comentario del propio componente (línea 11) dice `"11–12 de 12" con anterior / siguiente`, es decir, contempla una segunda página.

### Estrategia de detección en CI

1. **Prueba unitaria:** Validar que con `count=12, size=10` el cálculo retorne `pages=2`
2. **Prueba E2E:** Verificar que el botón "Siguiente" esté habilitado en página 1, hacer clic y validar la presencia de enlace a M-111 o M-112

---

## DEF-05 · Fórmula de confianza con notación ambigua en UI

**Síntoma:** En la pantalla de Investigación (sección "Evidencia y confianza"), cuando la conclusión depende de un evento reportado (`trust = 0,9`), la fórmula se muestra como `0,5 + 0,45 × 1,000 × 0,9 = 0,86`. Leída con la precedencia aritmética habitual da 0,905, no 0,86. El texto de ayuda debajo sí aclara que el resultado "se multiplica por 0,9", pero la expresión en sí es incorrecta.

**Impacto operativo:** Un usuario técnico que valide el cálculo a partir de la expresión obtiene 0,905 en lugar de 0,86 y puede desconfiar del puntaje.

- **Severidad:** Baja — El cálculo del backend es correcto; solo la presentación es engañosa
- **Prioridad:** P3 — No afecta la decisión operativa; aparece únicamente al revisar la fórmula

### Pasos para reproducir

1. Iniciar sesión y abrir la Investigación de M-104 (desde el Despacho, "Investigar"). M-106 también tiene `trust = 0,9` y muestra la misma expresión
2. Ubicar la sección "Evidencia y confianza"
3. Leer la expresión debajo de la lista de señales

### Resultado esperado vs obtenido

| Presentación | Resultado de la fórmula | Valor correcto en backend |
|--------------|------------------------|---------------------------|
| `0,5 + 0,45 × 1,000 × 0,9` | 0,905 (interpretación literal) | 0,86 |

**Fórmula correcta:** `(0,5 + 0,45 × score) × trust`

Para M-104 (valores de la captura):
- `score = 1,000` (suma de peso × cumplimiento de cada señal)
- `trust = 0,9` (la conclusión depende de un evento reportado por una persona)
- `resultado = (0,5 + 0,45 × 1,000) × 0,9 = 0,95 × 0,9 = 0,855 → 0,86` (redondeo a 2 decimales)

### Evidencia

- Captura de pantalla de M-104: [evidencias/DEF-05-formula-confianza.png](evidencias/DEF-05-formula-confianza.png)
- Cálculo correcto en backend: [confidence.go](../backend/internal/analysis/classify/confidence.go) (línea 17)

### Causa raíz

En [EvidenceChecks.tsx](../frontend/src/features/anomalies/components/EvidenceChecks.tsx) (líneas 50–53) la expresión se arma concatenando texto, sin paréntesis:

```tsx
0,5 + 0,45 × {formatNumber(score, 3)}
{trust < 1 ? ' × 0,9' : ''} = {formatConfidence(anomaly.confidence)}
```

Con la precedencia habitual (la multiplicación antes que la suma), se lee como:

```
0,5 + (0,45 × 1,000 × 0,9) = 0,5 + 0,405 = 0,905
```

Cuando el cálculo real implementado en el backend es:

```go
return math.Round((0.5 + 0.45*score) * trust * 100) / 100
```

### Solución propuesta

Cuando `trust < 1`, envolver el subtotal entre paréntesis en `EvidenceChecks.tsx`:

- **Opción 1:** `(0,5 + 0,45 × 1,000) × 0,9 = 0,86`
- **Opción 2:** `0,95 × 0,9 = 0,86` (mostrando el subtotal antes de aplicar trust)

### Estrategia de detección en CI

1. **Prueba de componente (Vitest + Testing Library):** Renderizar `EvidenceChecks` con `trust = 0,9` y verificar que el texto sea `(0,5 + 0,45 × 1,000) × 0,9 = 0,86`
2. **Prueba E2E:** En la Investigación de M-104, verificar el mismo texto

---

## Resumen de defectos

| ID | Título | Severidad | Prioridad | Área |
|----|--------|-----------|-----------|------|
| DEF-01 | Conversión incorrecta de hora de planta | Alta | P1 | Frontend (format.ts) |
| DEF-02 | Búsqueda case-sensitive | Media | P2 | Backend (meter/service.go) |
| DEF-03 | Falso positivo clasificado como alerta | Alta | P1 | Backend (meter/enums.go) |
| DEF-04 | Paginación con cálculo incorrecto | Media | P2 | Frontend (Pagination.tsx) |
| DEF-05 | Fórmula de confianza con notación ambigua | Baja | P3 | Frontend (EvidenceChecks.tsx) |

**Recomendación:** Los defectos DEF-01 y DEF-03 (ambos P1) deben resolverse antes del lanzamiento a producción, ya que afectan directamente la correctitud de la información presentada al operador y pueden conducir a decisiones operativas erróneas.
