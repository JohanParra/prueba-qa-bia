# Pruebas de humo (Smoke Testing)

## Objetivo

Las pruebas de humo validan que el sistema cumple con los requisitos mínimos de funcionalidad básica antes de proceder con pruebas funcionales exhaustivas. Esta suite verifica: disponibilidad de servicios, autenticación, carga correcta del dataset, navegación principal y acceso a detalles de anomalías.

**Fecha de ejecución:** 2026-10-24  
**Entorno:** Commit `026b991` · API en puerto `:8080` · UI en puerto `:5173` · Zona horaria `America/Bogota`

---

## Suite de pruebas

| ID | Verificación | Justificación | Resultado observado | Estado |
|----|--------------|---------------|---------------------|--------|
| SM-01 | Endpoint `/health` responde | Disponibilidad básica de API antes de cualquier prueba | HTTP 200, `status: ok` | PASS |
| SM-02 | Rechazo de credenciales inválidas | El sistema debe validar autenticación antes de permitir acceso | HTTP 401, mensaje descriptivo | PASS |
| SM-03 | Login con credenciales válidas | Token requerido para todos los endpoints protegidos | JWT recibido correctamente | PASS |
| SM-04 | Endpoint `/anomaly/getAll` (autenticado) | Funcionalidad core del sistema: clasificación de anomalías | 4 anomalías retornadas; M-109 con prioridad 1 | PASS |
| SM-05 | Endpoint `/dashboard/getSummary` | Fuente de datos para vista de Despacho | 12 medidores listados; M-109 en primera posición | PASS |
| SM-06 | Login en UI → Visualización de Despacho | Validación de proxy `/api` y persistencia de sesión en navegador | Orden #1 muestra M-109 | PASS |
| SM-07 | Navegación al Libro de Medidores | Flujo principal post-login | Tabla con registros de medidores visible | PASS |
| SM-08 | Acceso a detalle de M-109 | Navegación al medidor de mayor prioridad | Panel con estado Crítica, variación ~+109,8% | PASS |

---

## Conclusión

**Resultado general:** 8/8 pruebas exitosas (100%)

El sistema cumple con los requisitos mínimos de funcionalidad para proceder con pruebas exhaustivas:
- Servicios disponibles y respondiendo
- Autenticación funcional
- Dataset de 12 medidores cargado correctamente
- Navegación básica operativa

**Nota importante:** Las pruebas de humo no validan la correctitud exhaustiva de la información presentada. Los defectos identificados posteriormente (conversión de hora de planta, búsqueda case-sensitive, clasificación de estado de M-106, paginación) no impiden la ejecución de este smoke test, pero sí representan blockers para el lanzamiento a producción.

El smoke test confirma que el sistema es *usable* para pruebas, no que sea *correcto* para producción.
