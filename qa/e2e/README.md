# E2E · Playwright (EnergIA)

## Prerrequisito

La app debe estar corriendo:

```bash
# Desde la raíz del repo
# Terminal 1 — API
cd backend && go run ./cmd/api

# Terminal 2 — UI
cd frontend && pnpm install && pnpm dev
```

O con Docker: `docker compose up -d --build` y `E2E_BASE_URL=http://localhost:3000`.

Credenciales por defecto: `admin@energia.local` / `admin123`.

## Un solo comando

```bash
cd qa/e2e
./run.sh
# o: pnpm install && pnpm test
```

La config usa `channel: 'chrome'` (Chrome instalado en macOS). Si prefieres el Chromium de Playwright:

```bash
pnpm exec playwright install chromium
PW_CHANNEL=chromium pnpm test
```

Qué corre:

1. Login una vez (`auth.setup.ts`) → `storageState`.
2. Flujo de negocio M-109 (debe pasar).
3. DEF-01 hora de planta con `test.fail` (falla hoy de forma esperada; pasa cuando se corrija).
4. API (`request`): contrato M-109 + DEF-02 case-insensitive con `test.fail`.

Proyectos: `setup` + `chromium` (UI) + `api`.

```bash
pnpm exec playwright test --project=api   # solo API
pnpm report                               # HTML
```

> Si corres desde un entorno que bloquea el launch de Chrome (sandbox), usa tu terminal local: `cd qa/e2e && ./run.sh`.

## Diseño

- Locators: `getByRole` / `getByLabel`.
- Sin `waitForTimeout`.
- Page Objects en `pages/`, datos en `tests/fixtures/`.
- `timezoneId: 'America/Bogota'` en `playwright.config.ts`.
