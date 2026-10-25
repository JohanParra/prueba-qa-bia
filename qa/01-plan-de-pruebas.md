# Plan de pruebas · EnergIA

## Objetivo

EnergIA es una plataforma de gestión de energía basada en IA que asiste al operador de red en la priorización y diagnóstico de anomalías en medidores eléctricos. Con un dataset de 14 días de lecturas horarias de 12 medidores y un motor de clasificación de anomalías, este plan de pruebas responde a la pregunta fundamental: **¿La información presentada al operador es confiable y correcta? ¿Este build está listo para producción?**

**Entorno de pruebas:** macOS · Zona horaria `America/Bogota` · Chrome · Commit `026b991` · API en puerto `:8080` · Frontend Vite en puerto `:5173`

**Credenciales:** Usuario de demostración `admin@energia.local` / `admin123`

**Especificaciones de referencia:**
- [README.md](../README.md) — Descripción general del sistema
- [backend/README.md](../backend/README.md) — Especificación del motor de clasificación
- [frontend/PRODUCT.md](../frontend/PRODUCT.md) — Requisitos de producto para UI
- Swagger en `/docs` — Documentación de endpoints

---

## Alcance de pruebas

### Incluido

El plan se enfoca en los flujos críticos que impactan directamente la toma de decisiones operativas:

- **Autenticación:** Login exitoso y validación de token en endpoints protegidos
- **Despacho de anomalías:** Visualización de órdenes priorizadas correctamente
- **Libro de Medidores:** Funcionalidad de búsqueda, filtrado por estado, paginación y acceso a detalle
- **Validación de reglas de clasificación:** Verificación de los cuatro casos especificados (M-109, M-112, M-104, M-106) contra la matriz de decisión documentada
- **Consistencia entre capas:** Coherencia entre especificación, respuestas de API y datos visualizados en UI
- **Formato regional:** Validación de formato colombiano (es-CO) y presentación de hora de planta sin conversión a zona horaria local

### Excluido explícitamente

Los siguientes elementos quedan fuera del alcance por no ser críticos para el MVP o por limitaciones de entorno:

- **Generación de narrativa con OpenAI:** El motor genera texto descriptivo sin API key; la integración con GPT es opcional
- **Pruebas de carga y rendimiento:** No evaluadas en esta fase
- **Auditoría de seguridad ofensiva:** Fuera de alcance para esta entrega
- **Accesibilidad WCAG:** No se realiza auditoría exhaustiva de conformidad
- **Validación detallada de 8 medidores normales:** Se verifica que no generen alertas falsas, sin análisis profundo individual
- **Archivo `expected_results.csv`:** No forma parte del producto final

---

## Análisis de riesgos

Los riesgos se priorizan según su impacto en la correctitud de las decisiones operativas:

### 1. Clasificación y priorización de anomalías (Crítico)

**Riesgo:** Si M-109 no aparece en primera posición o M-106 es escalado incorrectamente, el operador puede perder tiempo investigando falsos positivos o ignorar problemas reales.

**Mitigación:** El backend cuenta con cobertura de pruebas adecuada para el motor de clasificación. Se validan manualmente los resultados contra la especificación documentada.

### 2. Conversión de hora de planta en UI (Alto)

**Riesgo:** La especificación de producto requiere mostrar timestamps sin conversión a zona horaria local. Una diferencia de 5 horas (UTC vs `America/Bogota`) puede alterar la correlación temporal con eventos operativos.

**Mitigación:** Pruebas ejecutadas explícitamente en zona `America/Bogota` con validación de formato de hora de planta.

### 3. Filtros, búsqueda y paginación del Libro de Medidores (Alto)

**Riesgo:** El Libro de Medidores es la interfaz principal de acceso al detalle. Filtros incorrectos pueden ocultar medidores críticos o mezclar falsos positivos con alertas reales.

**Mitigación:** Casos de búsqueda (CN-06 a CN-08), paginación (CN-09 a CN-11) y filtrado por estado (CN-12, CN-13), en API y UI.

### 4. Autenticación (Medio)

**Riesgo:** Sin un sistema de autenticación funcional y estable, no es posible realizar pruebas significativas del resto del sistema.

**Mitigación:** Validación temprana en fase de smoke testing.

---

## Estructura de documentación

| Documento | Contenido |
|-----------|-----------|
| [02-smoke.md](02-smoke.md) | Pruebas de humo: verificación de disponibilidad de servicios y flujos básicos |
| [03-casos-caja-negra.md](03-casos-caja-negra.md) | 24 casos de prueba funcional ejecutados contra API y UI |
| [04-caja-blanca.md](04-caja-blanca.md) | Análisis de código fuente y evaluación de suites de pruebas existentes |
| [05-defectos.md](05-defectos.md) | Reporte formal de 5 defectos identificados con evidencias |
| [e2e/](e2e/) | Suite de automatización Playwright: flujo de negocio y pruebas de regresión |
| [postman/](postman/) | Colección Postman y script `curl` para reproducir DEF-02 y DEF-03 |

---

## Criterios de entrada y salida

### Criterios de entrada (prerrequisitos)

- ✅ Aplicación levantada con endpoint `/health` respondiendo HTTP 200
- ✅ Credenciales de usuario de demostración disponibles
- ✅ Especificaciones de producto y backend documentadas
- ✅ Dataset de 12 medidores con 14 días de lecturas cargado en el sistema

### Criterios de salida (entregables)

- ✅ Ejecución completa de pruebas de humo
- ✅ Ejecución de 24 casos funcionales con resultado documentado (18 PASS · 6 FAIL)
- ✅ Identificación y reporte formal de defectos con evidencias
- ✅ Suite de automatización Playwright con al menos un flujo de negocio crítico
- ✅ Pruebas de regresión automatizadas para defectos identificados
- ✅ Plan de pruebas y resumen ejecutivo

---

## Uso de asistencia de IA

Se utilizó asistencia de inteligencia artificial para:
- Estructurar el plan de pruebas
- Cruzar referencias entre documentación y código fuente
- Generar casos de prueba automatizados en Playwright

**Importante:** Los resultados de ejecución (PASS/FAIL), capturas de evidencia y valores observados provienen de la ejecución real de la aplicación y las pruebas, no de generación sintética.

---

## Resumen ejecutivo

### Veredicto: NO LIBERAR A PRODUCCIÓN

**Fortalezas del sistema:**
- El motor de clasificación funciona correctamente sobre el dataset de prueba
- La priorización de anomalías (M-109 → M-112 → M-104 → M-106) es consistente con la especificación
- La suite de pruebas backend (`go test ./...`) ejecuta exitosamente

**Defectos identificados** (detalle en [05-defectos.md](05-defectos.md)):

1. **DEF-01 · Conversión incorrecta de hora de planta (P1):** En zona horaria `America/Bogota`, los timestamps se muestran 5 horas antes (la detección de M-109, `14:00` hora de planta, se visualiza como `09:00`). Esto altera la interpretación temporal de eventos y afecta la correlación con operaciones en sitio.

2. **DEF-02 · Búsqueda case-sensitive (P2):** La búsqueda con `m-109` (minúsculas) retorna lista vacía, contradiciendo la especificación que indica búsqueda no sensitiva a mayúsculas/minúsculas.

3. **DEF-03 · Clasificación errónea de falsos positivos (P1):** M-106 está marcado por el motor como `FALSE_POSITIVE` con acción "no escalar", pero aparece en la UI como `ALERT` y no se incluye en el filtro de medidores normales.

4. **DEF-04 · Paginación bloqueada (P2):** Con 12 medidores y tamaño de página 10, el botón "Siguiente" permanece deshabilitado, impidiendo el acceso a M-111 y M-112.

5. **DEF-05 · Fórmula de confianza sin paréntesis (P3):** En la pantalla de Investigación, la expresión `0,5 + 0,45 × 1,000 × 0,9` da 0,905 leída literalmente; el valor real es 0,86.

### Recomendación

Los defectos **DEF-01** (hora de planta) y **DEF-03** (clasificación de falsos positivos) deben resolverse antes del lanzamiento, ya que afectan directamente la correctitud de la información crítica para decisiones operativas.

Las limitaciones conocidas y documentadas (baseline fijo, integración opcional con OpenAI) son aceptables para un MVP, pero la inconsistencia entre lo especificado y lo presentado al operador representa un riesgo operativo inaceptable.
