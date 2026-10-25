# Entrega · prueba QA EnergIA

Johan Parra · rama `entrega-qa`

## Video

**Enlace:** _https://youtu.be/TCDyqJrCOSE_

## Qué incluye el repo

| Carpeta / archivo | Contenido |
|-------------------|-----------|
| [qa/01-plan-de-pruebas.md](qa/01-plan-de-pruebas.md) | Alcance, riesgos, estrategia, criterios y veredicto de liberación |
| [qa/02-smoke.md](qa/02-smoke.md) | Smoke de UI y API |
| [qa/03-casos-caja-negra.md](qa/03-casos-caja-negra.md) | 24 casos con técnica, esperado y obtenido (18 PASS · 6 FAIL) |
| [qa/04-caja-blanca.md](qa/04-caja-blanca.md) | Revisión de código y de las suites `go test` / `pnpm test` |
| [qa/05-defectos.md](qa/05-defectos.md) | 5 defectos con severidad, prioridad, pasos, evidencia y causa raíz |
| [qa/evidencias/](qa/evidencias/) | Respuestas de API, capturas y salidas de comandos citadas en los defectos |
| [qa/e2e/](qa/e2e/) | Playwright: flujo de negocio M-109 y tests que documentan defectos |
| [qa/postman/](qa/postman/) | Colección y environment de Postman, más script `curl`, para reproducir DEF-02 y DEF-03 |

**Veredicto:** no liberaría este build. El razonamiento está al final de [qa/01-plan-de-pruebas.md](qa/01-plan-de-pruebas.md).

## Cómo correr los E2E

Con la app arriba (API `:8080`, frontend `:5173` o Docker en `:3000`):

```bash
cd qa/e2e && ./run.sh
```

Detalle en [qa/e2e/README.md](qa/e2e/README.md).

## Uso de IA

Me apoyé en IA para estructurar el plan, cruzar documentación con código y armar Playwright. Los resultados de los casos y los defectos salen de ejecutar la aplicación y los tests.
