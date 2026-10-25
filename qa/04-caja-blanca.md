# Análisis de caja blanca

Este documento presenta el análisis del código fuente realizado posterior a la ejecución de pruebas funcionales, con el objetivo de identificar la causa raíz de los defectos detectados y evaluar la cobertura de las suites de pruebas existentes.

**Entorno:** Commit `026b991`

El análisis se enfocó en dos áreas de riesgo identificadas: el módulo de formateo de marcas de tiempo en el frontend (`format.ts`) y el servicio de gestión de medidores en el backend (`meter/`), con revisión adicional del motor de clasificación de anomalías.

---

## 1. Módulo de formateo de hora de planta — `frontend/src/lib/format.ts`

La especificación en `PRODUCT.md` establece que las marcas de tiempo deben mostrarse en hora de planta sin conversión a zona horaria local. El mismo archivo incluye un comentario que indica la necesidad de usar los getters UTC.

### Análisis de funciones

| Función | Getters utilizados | ¿Cumple especificación? |
|---------|-------------------|-------------------------|
| `formatPlantDate` | `getUTC*` | Sí |
| `formatPlantDay` | `getUTC*` | Sí |
| `formatPlantTime` | `getHours`, `getDate`, … | **No** — utiliza hora local |
| `formatClockTime` | getters locales | Sí (por diseño, muestra hora "de reloj") |

### Causa raíz de DEF-01

La función `formatPlantTime` utiliza getters de fecha local (`getHours()`, `getDate()`, `getMonth()`) en lugar de los equivalentes UTC (`getUTCHours()`, `getUTCDate()`, `getUTCMonth()`). 

**Impacto:** En la zona horaria `America/Bogota` (UTC-5), un timestamp almacenado como `2026-09-12T14:00:00Z` se renderiza como `12/09 09:00` en lugar de `12/09 14:00`.

### Cobertura de pruebas existentes

El archivo `format.test.ts` contiene una prueba que valida el caso `12/09 14:00`, sin embargo, la configuración de Vitest en `vite.config.ts` fuerza la variable de entorno `TZ: 'UTC'`, lo que enmascara el defecto. La prueba únicamente valida el comportamiento en el entorno de CI ejecutándose en UTC, pero no garantiza el comportamiento correcto para usuarios en otras zonas horarias.

### Propuesta de mejora

Implementar una prueba que valide el contrato UTC de manera explícita, ejecutándose con la zona horaria `America/Bogota` para detectar el defecto. Ver borrador en `qa/propuestas/format-plant-time-bogota.test.ts.txt`.

---

## 2. Servicio de medidores — `backend/internal/meter` (y revisión de `classify`)

### 2.1 Mapeo de estado — `StatusOf` (DEF-03)

**Implementación actual:**

```go
case a == nil:           return StatusNormal
case a.Severity == High: return StatusCritical
default:                 return StatusAlert
```

**Problema identificado:**

La lógica de mapeo evalúa únicamente la severidad de la anomalía, sin considerar el tipo. Según la especificación en el README, las anomalías de tipo `FALSE_POSITIVE` deben mapearse a estado `NORMAL`.

**Comportamiento observado:**

El medidor M-106 (tipo `FALSE_POSITIVE`, severidad `Low`) es procesado por la rama `default` y retorna estado `ALERT` en lugar de `NORMAL`.

**Cobertura de pruebas:**

La función `TestStatusOf` valida los casos:
- Anomalía nula → `NORMAL`
- Severidad `HIGH` → `CRITICAL`
- Severidad `MEDIUM` → `ALERT`
- Severidad `LOW` → `ALERT`

**Ausencia:** No existe prueba que valide el comportamiento esperado para tipo `FALSE_POSITIVE`, por lo que la suite de pruebas existente no detecta esta discrepancia con la especificación.

### 2.2 Búsqueda de medidores — `GetAll` (DEF-02)

**Implementación actual:**

```go
strings.Contains(sm.MeterID, search)
```

La búsqueda no normaliza mayúsculas/minúsculas antes de la comparación. Los identificadores de medidores en los datos están en formato `M-109`, por lo que una búsqueda con `m-109` no retorna resultados.

**Cobertura de pruebas:**

Existe una prueba con búsqueda parcial (`"109"`), pero no se valida el comportamiento con diferentes variaciones de caso.

### 2.3 Motor de clasificación — `classify`

**Evaluación:**

La implementación de las reglas de clasificación (calidad de datos, cambios explicables/no explicables, umbrales de severidad, ajuste ×0,9 por eventos) es consistente con la especificación del README.

**Cobertura de pruebas:**

- `TestAnalyzeRealData` valida el comportamiento con el dataset real
- Las pruebas de eventos cubren los casos de M-109 y M-112 adecuadamente
- **Conclusión:** La cobertura del motor de clasificación es satisfactoria

---

## 3. Evaluación de suites de pruebas existentes

### Backend (`go test ./...`)

**Resultado:** Todas las pruebas pasan exitosamente

**Fortalezas:**
- El motor de clasificación está bien cubierto con datos reales
- La priorización y tipos de anomalías funcionan correctamente
- Los módulos de autenticación y generación de narrativa tienen cobertura adecuada
- Los casos básicos de paginación y filtros están validados

**Debilidades:**
- Ausencia de pruebas para búsqueda con variaciones de mayúsculas/minúsculas
- No se valida el comportamiento de `StatusOf` para tipo `FALSE_POSITIVE`
- Los handlers de `anomaly` y `dashboard` tienen cobertura limitada (mayoría en `server_test` en lugar de tests unitarios dedicados)

### Frontend (`pnpm test`)

**Resultado:** Cobertura limitada y casos sesgados

**Cobertura actual:**
- Formateo de fechas (ejecutándose con `TZ=UTC` forzado)
- Parseo de filtros desde URL (funciona correctamente)
- Componentes de badges y etiquetas de UI

**Debilidades:**
- Cobertura mínima de componentes de páginas/pantallas
- Las pruebas de formato no detectan problemas con zonas horarias no-UTC
- No hay pruebas para el componente de paginación

### Componente de paginación — `Pagination.tsx` (DEF-04)

**Problema identificado:**

```typescript
Math.floor(count / size)  // Con count=12, size=10 → resultado 1 página
```

El cálculo incorrecto utiliza `Math.floor` en lugar de `Math.ceil`, resultando en que con 12 registros y tamaño de página 10 se calcula 1 página en lugar de 2.

**Impacto:** El botón "Siguiente" permanece deshabilitado en la página 1 de 2.

**Nota:** El endpoint de API pagina correctamente; el defecto está aislado en el componente de UI.

---

## 4. Propuesta de pruebas adicionales

Las siguientes pruebas permitirían detectar los defectos identificados sin modificar el código de producción:

### Frontend
1. **Contrato UTC de `formatPlantTime`:** Prueba que ejecute con zona horaria `America/Bogota` y valide el uso de getters UTC
2. **Cálculo de páginas:** Validar que con 12 registros y tamaño 10 se calcule correctamente 2 páginas, habilitando el botón "Siguiente" en página 1

### Backend
1. **Mapeo de falso positivo:** `StatusOf(anomaly{Type: FALSE_POSITIVE}) → NORMAL`
2. **Búsqueda case-insensitive:** `GetAll` con parámetro `"m-109"` debe retornar el medidor M-109

**Ubicación de borradores:** `qa/propuestas/`
