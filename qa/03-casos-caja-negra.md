# Casos de prueba funcional (caja negra)

Este documento presenta el diseño y resultado de 24 casos de prueba funcional ejecutados contra la aplicación EnergIA, basándose exclusivamente en la documentación y comportamiento observable (API y UI), sin inspección previa del código fuente.

El alcance se centra en los flujos críticos para el operador de red: autenticación, búsqueda de medidores, filtrado por estado, navegación entre páginas y validación de las reglas de clasificación de anomalías.

## Técnicas de diseño aplicadas

| Técnica | Aplicación |
|---------|-----------|
| Partición de equivalencia | Agrupación de entradas válidas e inválidas (credenciales, IDs de medidores, estados) |
| Análisis de valores límite | Pruebas en fronteras de paginación (página 0, 1, 2) |
| Tablas de decisión | Matriz de clasificación: tipo de anomalía → estado → severidad → acción |
| Pruebas negativas | Validación de manejo de errores (entradas inválidas, búsquedas vacías, peticiones sin autenticación) |
| Consistencia entre capas | Verificación de coherencia entre documentación, respuestas de API y datos visualizados en UI |

## Formato de casos

Cada caso documenta:  
**ID · Título · Técnica aplicada · Precondición · Pasos · Datos de prueba · Resultado esperado · Resultado obtenido · Estado**

**Entorno de ejecución:** Commit `026b991` · API en puerto 8080 · UI en puerto 5173 · Zona horaria: `America/Bogota`

**Convenciones de API:** todas las rutas cuelgan de `/api/v1` y, salvo el login, requieren `Authorization: Bearer <token>`. El listado de medidores es `POST /api/v1/meter/getAll` con body `{ "pagination": { "page", "size" }, "filter": { "meter_id", "status" } }`; cuando un caso dice "filtro `meter_id=109`" se refiere a ese campo del body. La colección [postman/](postman/) contiene cada request listo para reejecutar.

---

## Autenticación

### CN-01 · Login sin email
- **Técnica:** Partición de equivalencia (campo obligatorio vacío) + Prueba negativa
- **Precondición:** Usuario en la pantalla de login
- **Pasos:** Dejar el campo email vacío, ingresar una contraseña y hacer clic en el botón Entrar
- **Datos:** contraseña `admin123`
- **Esperado:** El sistema debe rechazar el intento de login e indicar que el campo email es obligatorio
- **Obtenido:** El navegador bloquea el envío del formulario por validación HTML5 (campo requerido)
- **Estado:** PASS

### CN-02 · Login sin contraseña
- **Técnica:** Partición de equivalencia (campo obligatorio vacío)
- **Precondición:** Usuario en la pantalla de login
- **Pasos:** Ingresar un email válido, dejar la contraseña vacía y hacer clic en Entrar
- **Esperado:** El sistema debe rechazar el intento de login
- **Obtenido:** El navegador bloquea el envío del formulario por validación HTML5
- **Estado:** PASS

### CN-03 · Contraseña incorrecta (vía API)
- **Técnica:** Partición de equivalencia (credenciales inválidas)
- **Precondición:** API en funcionamiento
- **Pasos:** Enviar `POST /api/v1/auth/login` con contraseña incorrecta
- **Datos:** email `admin@energia.local`, contraseña `wrong`
- **Esperado:** El sistema debe rechazar el login con código HTTP 401 y mensaje de error apropiado
- **Obtenido:** Código 401, mensaje "Email o contraseña incorrectos"
- **Estado:** PASS

### CN-04 · Credenciales correctas
- **Técnica:** Partición de equivalencia (credenciales válidas)
- **Precondición:** API en funcionamiento
- **Pasos:** Enviar `POST /api/v1/auth/login` con las credenciales del usuario de demostración
- **Datos:** email `admin@energia.local`, contraseña `admin123`
- **Esperado:** El sistema debe retornar un token de sesión válido
- **Obtenido:** Token JWT recibido en la respuesta
- **Estado:** PASS

### CN-05 · Acceso a recursos protegidos sin autenticación
- **Técnica:** Prueba negativa de autorización
- **Precondición:** API en funcionamiento, sin sesión activa
- **Pasos:** Enviar `GET /api/v1/anomaly/getAll` sin header `Authorization`
- **Esperado:** El sistema debe rechazar la petición con código HTTP 401
- **Obtenido:** Código 401, mensaje "Falta el token de autenticación"
- **Estado:** PASS

---

## Búsqueda, filtrado y paginación del Libro de Medidores

### CN-06 · Búsqueda parcial por ID de medidor
- **Técnica:** Partición de equivalencia (búsqueda válida)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `meter_id=109`
- **Esperado:** El sistema debe retornar únicamente el medidor M-109
- **Obtenido:** Un resultado: M-109 con estado "Crítica"
- **Estado:** PASS

### CN-07 · Búsqueda no sensitiva a mayúsculas/minúsculas
- **Técnica:** Partición de equivalencia (variación de caso)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `meter_id=m-109` (minúsculas)
- **Esperado:** El sistema debe retornar el medidor M-109; [backend/README.md](../backend/README.md) (línea 96) indica "Búsqueda parcial, sin importar mayúsculas"
- **Obtenido:** Cero resultados — [evidencia](evidencias/DEF-02-search-m-109.json)
- **Estado:** FAIL → ver DEF-02

### CN-08 · Búsqueda de medidor inexistente
- **Técnica:** Partición de equivalencia (ID inválido)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `meter_id=M-999`
- **Esperado:** El sistema debe retornar una lista vacía sin generar error
- **Obtenido:** Cero resultados, respuesta exitosa (HTTP 200)
- **Estado:** PASS

### CN-09 · Solicitud de página inválida (página 0)
- **Técnica:** Análisis de valores límite (frontera inferior)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con `pagination: { page: 0, size: 10 }`
- **Esperado:** El sistema debe rechazar la petición (400) o normalizar el valor a página 1; la documentación no especifica cuál
- **Obtenido:** Normaliza a página 1: responde `page: 1`, `count: 12` y 10 filas
- **Estado:** PASS (se acepta la normalización porque la documentación no exige rechazo)

### CN-10 · Navegación entre páginas (API)
- **Técnica:** Análisis de valores límite (paginación con 12 registros, tamaño de página 10)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con `pagination: { page: 1, size: 10 }` y luego con `page: 2`
- **Esperado:** Página 1 debe retornar 10 registros; página 2 debe retornar 2 registros
- **Obtenido:** Primera página: 10 medidores; segunda página: 2 medidores
- **Estado:** PASS

### CN-10b · Navegación entre páginas (UI)
- **Técnica:** Consistencia entre capas (validación de paginación en interfaz)
- **Precondición:** Usuario autenticado en UI, sin filtros aplicados
- **Pasos:** Visualizar el Libro de Medidores (muestra "1–10 de 12 medidores") e intentar hacer clic en el botón "Siguiente"
- **Esperado:** El botón "Siguiente" debe estar habilitado y permitir navegar a la página 2 con los medidores M-111 y M-112
- **Obtenido:** El botón "Siguiente" permanece deshabilitado, no es posible acceder a la segunda página — DEF-04
- **Estado:** FAIL → ver DEF-04

### CN-11 · Filtro por estado con valor inválido
- **Técnica:** Prueba negativa de validación de entradas
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `status=FOO`
- **Esperado:** El sistema debe rechazar la petición con código HTTP 400 y mensaje descriptivo
- **Obtenido:** Código 400, mensaje de error con detalle de validación — [evidencia](evidencias/CN-invalid-status.json)
- **Estado:** PASS

### CN-12 · Filtro por estado "Crítica"
- **Técnica:** Partición de equivalencia (estado válido)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `status=CRITICAL`
- **Esperado:** El sistema debe retornar únicamente los medidores M-109 y M-112 (ambos con severidad alta)
- **Obtenido:** Dos resultados: M-109 y M-112
- **Estado:** PASS

### CN-13 · Clasificación de falso positivo como estado "Normal"
- **Técnica:** Tabla de decisión (tipo FALSE_POSITIVE → estado NORMAL)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `POST /api/v1/meter/getAll` con filtro `status=NORMAL` y `size=20`; buscar M-106 en las filas
- **Esperado:** M-106 debe aparecer. Regla de [backend/README.md](../backend/README.md) (línea 105): "Sin anomalía, o `FALSE_POSITIVE` → `NORMAL`"
- **Obtenido:** El sistema retorna 8 medidores normales; M-106 no está incluido (aparece clasificado como "Alerta") — DEF-03
- **Estado:** FAIL → ver DEF-03

---

## Validación de reglas de negocio (casos del enunciado)

Los siguientes cuatro casos verifican que la clasificación de anomalías (tipo, estado del libro, severidad y acción recomendada) coincida con las especificaciones del README.

| ID | Medidor | Clasificación esperada | Resultado API | Estado |
|----|---------|------------------------|---------------|--------|
| CN-14 | M-109 | Anomalía real, Crítica, prioridad 1, acción: "Investigar en sitio" | Coincide con lo esperado | PASS |
| CN-15 | M-112 | Calidad de datos, Crítica, prioridad 2, acción: "Validar el medidor" | Coincide con lo esperado | PASS |
| CN-16 | M-104 | Explicable, Alerta, prioridad 3, acción: "Validar con operación y actualizar baseline" | Coincide con lo esperado | PASS |
| CN-17 | M-106 | Falso positivo, **Normal**, prioridad 4, acción: "No escalar" | Tipo correcto, pero estado clasificado como **Alerta** en lugar de Normal | FAIL → DEF-03 |

### CN-18 · Orden de prioridad en el Despacho
- **Técnica:** Tabla de decisión (verificación de orden de severidad)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `GET /api/v1/anomaly/getAll` y verificar el orden de la respuesta; en UI, comparar con el orden del Despacho
- **Esperado:** Las anomalías deben aparecer ordenadas por prioridad: M-109 (1), M-112 (2), M-104 (3), M-106 (4)
- **Obtenido:** Orden confirmado: M-109, M-112, M-104, M-106
- **Estado:** PASS

---

## Consistencia entre documentación, API y UI

### CN-19 · Cifras de consumo de M-109
- **Técnica:** Consistencia entre capas (documentación ↔ API)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `GET /api/v1/meter/getById/M-109` y comparar `consumption_kwh`, `baseline_kwh` y `variation_pct` con el backend README
- **Esperado:** Consumo 2.207,6 kWh, baseline 1.052,15 kWh, variación +109,8 % ([backend/README.md](../backend/README.md), línea 109)
- **Obtenido:** Consumo 2.207,6 kWh, baseline 1.052,15 kWh, variación +109,8 %
- **Nota:** El README raíz menciona "+110,5 %" para M-109. No es una contradicción: según [backend/README.md](../backend/README.md) (líneas 109 y 331), +110,5 % compara real contra esperado en las 58 h del evento, mientras que +109,8 % compara el consumo de las últimas 24 h con el baseline diario
- **Estado:** PASS

### CN-20 · Nivel de confianza de M-109
- **Técnica:** Consistencia entre capas (documentación ↔ API)
- **Precondición:** Usuario autenticado en el sistema
- **Pasos:** `GET /api/v1/meter/getById/M-109` y leer `anomaly.confidence`
- **Esperado:** Confianza de 0,95
- **Obtenido:** Confianza 0,95
- **Estado:** PASS

### CN-21 · Visualización de detalle de M-109 en UI
- **Técnica:** Consistencia entre capas (API ↔ UI, formato colombiano)
- **Precondición:** Usuario autenticado en la interfaz
- **Pasos:** Navegar al Libro de Medidores, buscar "109" y abrir el panel de detalle de M-109
- **Esperado:** Visualización con formato colombiano: "2.207,6 kWh", variación con signo "+", etiqueta "Crítica", acción de "Investigar en sitio"
- **Obtenido:** Los datos se muestran correctamente con el formato esperado
- **Estado:** PASS

### CN-22 · Marca de tiempo en hora de planta
- **Técnica:** Consistencia entre capas (documentación especifica hora sin conversión de zona horaria)
- **Precondición:** Navegador configurado en zona horaria `America/Bogota` (UTC-5)
- **Pasos:** Visualizar el Despacho o el panel de detalle de M-109 y observar las marcas de tiempo
- **Datos:** La API devuelve `anomaly.detected_at = 2026-09-12T14:00:00Z` y `last_reading_at = 2026-09-14T23:00:00Z`; según `PRODUCT.md`, esos valores son hora de planta y se muestran tal cual
- **Esperado:** Los timestamps deben mostrarse sin conversión: `12/09 14:00` y `14/09 23:00`
- **Obtenido:** Los timestamps se muestran convertidos: `12/09 09:00` y `14/09 18:00` (resta de 5 horas) — DEF-01
- **Estado:** FAIL → ver DEF-01

### CN-23 · Clasificación de M-106 en la pestaña "Alertas" (UI)
- **Técnica:** Consistencia entre capas (validación de regla CN-13 / CN-17 en interfaz)
- **Precondición:** Usuario autenticado en la interfaz
- **Pasos:** Navegar al Libro de Medidores y seleccionar la pestaña "Alertas"
- **Esperado:** Solo el medidor M-104 debe aparecer en esta pestaña; M-106 debe estar en "Normales"
- **Obtenido:** Aparecen M-104 y M-106 en la pestaña "Alertas"
- **Estado:** FAIL → ver DEF-03

---

## Resumen de resultados

**24 casos ejecutados · 18 PASS · 6 FAIL**

| Defecto | Casos que fallan |
|---------|------------------|
| **DEF-01:** Conversión incorrecta de hora de planta a zona horaria local | CN-22 |
| **DEF-02:** Búsqueda de medidores sensible a mayúsculas/minúsculas | CN-07 |
| **DEF-03:** Falso positivo (M-106) con estado "Alerta" en lugar de "Normal" | CN-13, CN-17, CN-23 |
| **DEF-04:** Botón "Siguiente" deshabilitado en la paginación de la UI | CN-10b |

**DEF-05** (fórmula de confianza sin paréntesis en la pantalla de Investigación) no proviene de estos casos: se detectó durante la exploración de esa pantalla y se reporta directamente en el documento de defectos.

Detalle completo y evidencias: [05-defectos.md](05-defectos.md)
